-- LUMIÈRE: orders, checkout and stock reservations. Run after 20261101120000_catalog_and_admin.sql. Safe to re-run.
--
-- Inventory model
--   * products.stock is the number of units still available to sell.
--   * Starting a checkout reserves stock: checkout_create_order() locks the product rows (in ID order, so concurrent checkouts
--     queue instead of deadlocking), checks every line, decrements stock and writes the order with frozen line snapshots, all
--     in one transaction. Two shoppers can never both get the last unit.
--   * A reservation is released only when the payment provider says the payment can no longer succeed: the checkout session
--     expired, an asynchronous payment failed, or no payment page was ever created. Never on a timer alone.
--   * A payment confirmed after its reservation was released (it shouldn't happen, but deliveries can be late) re-reserves the
--     stock if it is still there, and is flagged for review if not. Paid orders are never downgraded.
--   * Every provider event is recorded once (payment_events); a repeated delivery changes nothing.
--
-- Security model
--   * Orders hold customer details. Visitors and signed-in users get no access at all; administrators can read orders and
--     change only the fulfillment columns. Payment status can't be edited by anyone: it comes from the provider.
--   * Checkout and payment functions run only for the server (service_role, the secret key on the store's server).

-- ---------------------------------------------------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------------------------------------------------

create sequence if not exists public.order_number_seq start 1001;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  number text not null unique default ('LUM-' || nextval('public.order_number_seq')),
  -- Unguessable key for the customer's status page; never shown in the admin list or logs.
  public_token text not null unique default (replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')),
  -- The browser's checkout attempt ID: the same attempt submitted twice reuses one order.
  client_request_id uuid unique,
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'processing', 'paid', 'failed', 'expired', 'canceled', 'needs_review')),
  fulfillment_status text not null default 'unfulfilled' check (fulfillment_status in ('unfulfilled', 'shipped', 'delivered')),
  stock_reserved boolean not null default true,
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  subtotal_cents integer not null check (subtotal_cents >= 0),
  shipping_cents integer not null check (shipping_cents >= 0),
  total_cents integer not null check (total_cents = subtotal_cents + shipping_cents),
  -- Reported by the payment provider when the payment completes.
  tax_cents integer check (tax_cents >= 0),
  amount_paid_cents integer check (amount_paid_cents >= 0),
  provider text not null default 'stripe' check (provider ~ '^[a-z_]{2,20}$'),
  checkout_session_id text unique,
  checkout_url text,
  checkout_expires_at timestamptz,
  payment_intent_id text,
  customer_email text,
  customer_name text,
  customer_phone text,
  shipping_name text,
  shipping_address jsonb,
  carrier text check (char_length(carrier) <= 60),
  tracking_number text check (char_length(tracking_number) <= 80),
  tracking_url text check (tracking_url ~ '^https://' and char_length(tracking_url) <= 500),
  admin_note text check (char_length(admin_note) <= 2000),
  review_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz,
  released_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz
);

create index if not exists orders_created_idx on public.orders (created_at desc);
create index if not exists orders_open_idx on public.orders (checkout_expires_at) where payment_status in ('pending', 'processing');

create table if not exists public.order_items (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id text not null references public.products (id) on update cascade on delete restrict,
  -- Snapshots at purchase time: later product edits never change an order.
  product_name text not null,
  product_finish text not null,
  product_slug text not null,
  image_off text not null,
  unit_price_cents integer not null check (unit_price_cents >= 0),
  quantity integer not null check (quantity between 1 and 10),
  line_total_cents integer not null check (line_total_cents = unit_price_cents * quantity),
  currency text not null check (currency ~ '^[A-Z]{3}$')
);

create index if not exists order_items_order_idx on public.order_items (order_id);
create index if not exists order_items_product_idx on public.order_items (product_id);

create table if not exists public.payment_events (
  id text primary key,
  provider text not null,
  type text not null,
  order_id uuid references public.orders (id) on delete set null,
  result text not null,
  received_at timestamptz not null default now()
);

create index if not exists payment_events_order_idx on public.payment_events (order_id);

-- ---------------------------------------------------------------------------------------------------------------------
-- Integrity: frozen snapshots, fulfillment only for paid orders
-- ---------------------------------------------------------------------------------------------------------------------

create or replace function public.orders_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id is distinct from old.id or new.number is distinct from old.number or new.public_token is distinct from old.public_token
     or new.currency is distinct from old.currency or new.subtotal_cents is distinct from old.subtotal_cents
     or new.shipping_cents is distinct from old.shipping_cents or new.total_cents is distinct from old.total_cents
     or new.created_at is distinct from old.created_at or new.client_request_id is distinct from old.client_request_id then
    raise exception 'Order % totals and identity are frozen', old.number using errcode = 'check_violation';
  end if;
  if new.fulfillment_status is distinct from old.fulfillment_status then
    if new.payment_status <> 'paid' then
      raise exception 'Only paid orders can be fulfilled (order % is %)', old.number, new.payment_status using errcode = 'check_violation';
    end if;
    if new.fulfillment_status = 'shipped' and old.shipped_at is null then new.shipped_at := now(); end if;
    if new.fulfillment_status = 'delivered' then
      new.delivered_at := coalesce(old.delivered_at, now());
      new.shipped_at := coalesce(new.shipped_at, old.shipped_at, now());
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.orders_before_update() from public, anon, authenticated;

drop trigger if exists orders_before_update on public.orders;
create trigger orders_before_update before update on public.orders for each row execute function public.orders_before_update();

create or replace function public.order_items_frozen()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Order lines are frozen at purchase time' using errcode = 'check_violation';
end;
$$;

revoke all on function public.order_items_frozen() from public, anon, authenticated;

drop trigger if exists order_items_frozen on public.order_items;
create trigger order_items_frozen before update on public.order_items for each row execute function public.order_items_frozen();

-- ---------------------------------------------------------------------------------------------------------------------
-- Grants and Row Level Security
-- ---------------------------------------------------------------------------------------------------------------------

revoke all on table public.orders, public.order_items, public.payment_events from anon, authenticated;
revoke all on sequence public.order_number_seq from anon, authenticated;
grant select on table public.orders, public.order_items, public.payment_events to authenticated;
-- Administrators may change fulfillment details and nothing else: payment status, totals and customer data stay as recorded.
grant update (fulfillment_status, carrier, tracking_number, tracking_url, admin_note) on table public.orders to authenticated;

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payment_events enable row level security;

drop policy if exists "Admins can read orders" on public.orders;
create policy "Admins can read orders" on public.orders for select to authenticated using ((select public.is_admin()));

drop policy if exists "Admins can update fulfillment" on public.orders;
create policy "Admins can update fulfillment" on public.orders for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "Admins can read order lines" on public.order_items;
create policy "Admins can read order lines" on public.order_items for select to authenticated using ((select public.is_admin()));

drop policy if exists "Admins can read payment events" on public.payment_events;
create policy "Admins can read payment events" on public.payment_events for select to authenticated using ((select public.is_admin()));

-- ---------------------------------------------------------------------------------------------------------------------
-- Checkout functions (server only)
-- ---------------------------------------------------------------------------------------------------------------------

-- Gives back the stock an order holds. Callers hold the order row lock.
create or replace function public.checkout_release_stock(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.products p
     set stock = p.stock + lines.quantity
    from (select product_id, sum(quantity)::integer as quantity from public.order_items where order_id = p_order_id group by product_id) lines
   where p.id = lines.product_id;
  update public.orders set stock_reserved = false, released_at = now() where id = p_order_id;
end;
$$;

-- Validates a cart against the live catalog, reserves its stock and records a pending order, atomically.
-- p_items: [{"product_id": "...", "quantity": 2}, ...]. Returns {ok, order: {...}} or {ok: false, problems: [...]}.
create or replace function public.checkout_create_order(
  p_request_id uuid,
  p_items jsonb,
  p_currency text,
  p_shipping_cents integer,
  p_provider text,
  p_hold_minutes integer default 35
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_existing public.orders%rowtype;
  v_lines jsonb;
  v_problems jsonb := '[]'::jsonb;
  v_subtotal integer := 0;
  v_order public.orders%rowtype;
  v_line record;
begin
  if p_request_id is null then raise exception 'A checkout request ID is required' using errcode = 'invalid_parameter_value'; end if;
  if p_shipping_cents is null or p_shipping_cents < 0 then raise exception 'Invalid shipping amount' using errcode = 'invalid_parameter_value'; end if;
  if p_currency !~ '^[A-Z]{3}$' then raise exception 'Invalid currency' using errcode = 'invalid_parameter_value'; end if;

  -- The same attempt submitted twice: hand back the order it already created.
  select * into v_existing from public.orders where client_request_id = p_request_id;
  if found then
    return jsonb_build_object('ok', true, 'existing', true, 'order', jsonb_build_object(
      'id', v_existing.id, 'number', v_existing.number, 'public_token', v_existing.public_token,
      'payment_status', v_existing.payment_status, 'checkout_url', v_existing.checkout_url, 'checkout_expires_at', v_existing.checkout_expires_at));
  end if;

  -- One entry per product, quantities added up.
  select coalesce(jsonb_agg(jsonb_build_object('product_id', product_id, 'quantity', quantity) order by product_id), '[]'::jsonb)
    into v_lines
    from (
      select item ->> 'product_id' as product_id, sum((item ->> 'quantity')::integer) as quantity
        from jsonb_array_elements(case when jsonb_typeof(p_items) = 'array' then p_items else '[]'::jsonb end) as item
       group by 1
    ) grouped;
  if jsonb_array_length(v_lines) = 0 or jsonb_array_length(v_lines) > 20 then
    return jsonb_build_object('ok', false, 'problems', jsonb_build_array(jsonb_build_object('reason', 'empty_cart')));
  end if;

  -- Lock the products in a fixed order, then check every line against what is there now.
  perform 1 from public.products
   where id in (select line ->> 'product_id' from jsonb_array_elements(v_lines) line)
   order by id
   for update;

  for v_line in
    select line ->> 'product_id' as product_id, (line ->> 'quantity')::integer as quantity, p.*
      from jsonb_array_elements(v_lines) line
      left join public.products p on p.id = line ->> 'product_id'
  loop
    if v_line.quantity is null or v_line.quantity < 1 or v_line.quantity > 10 then
      v_problems := v_problems || jsonb_build_object('product_id', v_line.product_id, 'reason', 'invalid_quantity');
    elsif v_line.id is null or not v_line.is_published then
      v_problems := v_problems || jsonb_build_object('product_id', v_line.product_id, 'reason', 'unavailable');
    elsif v_line.currency <> p_currency then
      v_problems := v_problems || jsonb_build_object('product_id', v_line.product_id, 'reason', 'currency');
    elsif v_line.stock < v_line.quantity then
      v_problems := v_problems || jsonb_build_object('product_id', v_line.product_id, 'reason', 'insufficient_stock', 'available', v_line.stock);
    else
      v_subtotal := v_subtotal + v_line.price_cents * v_line.quantity;
    end if;
  end loop;

  if jsonb_array_length(v_problems) > 0 then
    return jsonb_build_object('ok', false, 'problems', v_problems);
  end if;

  update public.products p
     set stock = p.stock - (line ->> 'quantity')::integer
    from jsonb_array_elements(v_lines) line
   where p.id = line ->> 'product_id';

  insert into public.orders (client_request_id, currency, subtotal_cents, shipping_cents, total_cents, provider, checkout_expires_at)
  values (p_request_id, p_currency, v_subtotal, p_shipping_cents, v_subtotal + p_shipping_cents, p_provider,
          now() + make_interval(mins => greatest(5, least(p_hold_minutes, 1440))))
  returning * into v_order;

  insert into public.order_items (order_id, product_id, product_name, product_finish, product_slug, image_off, unit_price_cents, quantity, line_total_cents, currency)
  select v_order.id, p.id, p.name, p.finish, p.slug, p.image_off, p.price_cents, (line ->> 'quantity')::integer,
         p.price_cents * (line ->> 'quantity')::integer, p.currency
    from jsonb_array_elements(v_lines) line
    join public.products p on p.id = line ->> 'product_id';

  return jsonb_build_object('ok', true, 'existing', false, 'order', jsonb_build_object(
    'id', v_order.id, 'number', v_order.number, 'public_token', v_order.public_token, 'payment_status', v_order.payment_status,
    'subtotal_cents', v_order.subtotal_cents, 'shipping_cents', v_order.shipping_cents, 'total_cents', v_order.total_cents,
    'checkout_expires_at', v_order.checkout_expires_at,
    'items', (select jsonb_agg(jsonb_build_object('product_id', product_id, 'name', product_name, 'finish', product_finish,
                                                  'unit_price_cents', unit_price_cents, 'quantity', quantity) order by id)
                from public.order_items where order_id = v_order.id)));
end;
$$;

-- Records the provider's payment page for a pending order.
create or replace function public.checkout_attach_session(p_order_id uuid, p_session_id text, p_url text, p_expires_at timestamptz)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.orders
     set checkout_session_id = p_session_id, checkout_url = p_url, checkout_expires_at = p_expires_at
   where id = p_order_id and payment_status = 'pending' and (checkout_session_id is null or checkout_session_id = p_session_id);
  if not found then raise exception 'Order % is not waiting for a payment page', p_order_id using errcode = 'check_violation'; end if;
end;
$$;

-- The single place where payment state changes. Idempotent per provider event; safe in any delivery order.
-- p_outcome: paid | processing | failed | expired | canceled. p_details: payment_intent, amount_total, amount_tax,
-- customer {email, name, phone}, shipping {name, address}.
create or replace function public.checkout_apply_outcome(
  p_event_id text,
  p_event_type text,
  p_provider text,
  p_order_id uuid,
  p_session_id text,
  p_outcome text,
  p_details jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_result text;
  v_short integer;
  v_amount integer := nullif(p_details ->> 'amount_total', '')::integer;
  v_tax integer := nullif(p_details ->> 'amount_tax', '')::integer;
begin
  if p_outcome not in ('paid', 'processing', 'failed', 'expired', 'canceled') then
    raise exception 'Unknown payment outcome %', p_outcome using errcode = 'invalid_parameter_value';
  end if;

  -- A delivery we have already processed: acknowledge it and change nothing.
  if p_event_id is not null and exists (select 1 from public.payment_events where id = p_event_id) then
    return jsonb_build_object('result', 'duplicate');
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    v_result := 'unknown_order';
  elsif p_session_id is not null and v_order.checkout_session_id is not null and v_order.checkout_session_id <> p_session_id then
    v_result := 'session_mismatch';
  else
    -- What the customer entered on the payment page, kept whenever the provider reports it.
    update public.orders set
      -- An order whose payment page was never recorded (the server failed right after creating it) adopts the session here.
      checkout_session_id = coalesce(checkout_session_id, p_session_id),
      payment_intent_id = coalesce(nullif(p_details ->> 'payment_intent', ''), payment_intent_id),
      customer_email = coalesce(nullif(p_details #>> '{customer,email}', ''), customer_email),
      customer_name = coalesce(nullif(p_details #>> '{customer,name}', ''), customer_name),
      customer_phone = coalesce(nullif(p_details #>> '{customer,phone}', ''), customer_phone),
      shipping_name = coalesce(nullif(p_details #>> '{shipping,name}', ''), shipping_name),
      shipping_address = coalesce(p_details #> '{shipping,address}', shipping_address)
    where id = v_order.id;

    if v_order.payment_status in ('paid', 'needs_review') then
      v_result := 'already_final';
    elsif p_outcome = 'paid' then
      if not v_order.stock_reserved then
        -- Paid after its reservation was released: take the stock again if it is still there.
        perform 1 from public.products where id in (select product_id from public.order_items where order_id = v_order.id) order by id for update;
        select count(*) into v_short
          from (select product_id, sum(quantity) as quantity from public.order_items where order_id = v_order.id group by product_id) lines
          join public.products p on p.id = lines.product_id
         where p.stock < lines.quantity;
        if v_short = 0 then
          update public.products p set stock = p.stock - lines.quantity
            from (select product_id, sum(quantity)::integer as quantity from public.order_items where order_id = v_order.id group by product_id) lines
           where p.id = lines.product_id;
          update public.orders set stock_reserved = true, released_at = null where id = v_order.id;
        end if;
      end if;
      if v_short > 0 then
        update public.orders set payment_status = 'needs_review', paid_at = now(), amount_paid_cents = v_amount, tax_cents = v_tax,
               review_reason = 'Paid after its reservation was released, and some items are no longer in stock.'
         where id = v_order.id;
        v_result := 'needs_review';
      elsif v_amount is not null and v_amount - coalesce(v_tax, 0) <> v_order.total_cents then
        update public.orders set payment_status = 'needs_review', paid_at = now(), amount_paid_cents = v_amount, tax_cents = v_tax,
               review_reason = format('The provider charged %s (tax %s), but the order total is %s.', v_amount, coalesce(v_tax, 0), v_order.total_cents)
         where id = v_order.id;
        v_result := 'needs_review';
      else
        update public.orders set payment_status = 'paid', paid_at = now(), amount_paid_cents = v_amount, tax_cents = v_tax where id = v_order.id;
        v_result := 'paid';
      end if;
    elsif p_outcome = 'processing' then
      if v_order.payment_status = 'pending' then
        update public.orders set payment_status = 'processing' where id = v_order.id;
        v_result := 'processing';
      else
        v_result := 'ignored';
      end if;
    else
      -- failed, expired or canceled: the payment can no longer succeed, so the stock goes back.
      if v_order.payment_status in ('pending', 'processing') then
        if v_order.stock_reserved then perform public.checkout_release_stock(v_order.id); end if;
        update public.orders set payment_status = p_outcome where id = v_order.id;
        v_result := p_outcome;
      else
        v_result := 'ignored';
      end if;
    end if;
  end if;

  if p_event_id is not null then
    insert into public.payment_events (id, provider, type, order_id, result)
    values (p_event_id, p_provider, coalesce(p_event_type, 'unknown'), case when v_result = 'unknown_order' then null else p_order_id end, v_result);
  end if;

  select payment_status into v_order.payment_status from public.orders where id = p_order_id;
  return jsonb_build_object('result', v_result, 'payment_status', v_order.payment_status);
end;
$$;

-- Open orders whose payment page should have ended by now: the server asks the provider about them (missed webhooks,
-- abandoned tabs). A payment page always expires 32 minutes after its order was created, so an order that never recorded one
-- is safe to release after 45 minutes: no payment page for it can still be open.
create or replace function public.checkout_orders_to_reconcile(p_limit integer default 10)
returns table (id uuid, checkout_session_id text, provider text)
language sql
stable
security definer
set search_path = ''
as $$
  select o.id, o.checkout_session_id, o.provider
    from public.orders o
   where o.payment_status in ('pending', 'processing')
     and ((o.checkout_session_id is null and o.created_at < now() - interval '45 minutes')
          or (o.checkout_session_id is not null and o.checkout_expires_at < now() - interval '2 minutes')
          or (o.payment_status = 'processing' and o.updated_at < now() - interval '30 minutes'))
   order by o.checkout_expires_at nulls first
   limit greatest(1, least(p_limit, 50));
$$;

-- What the customer's status page may show: no contact or address details.
create or replace function public.checkout_order_status(p_token text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'id', o.id, 'number', o.number, 'payment_status', o.payment_status, 'fulfillment_status', o.fulfillment_status,
    'currency', o.currency, 'subtotal_cents', o.subtotal_cents, 'shipping_cents', o.shipping_cents, 'tax_cents', o.tax_cents,
    'total_cents', o.total_cents, 'amount_paid_cents', o.amount_paid_cents, 'created_at', o.created_at,
    'checkout_session_id', o.checkout_session_id, 'provider', o.provider, 'carrier', o.carrier, 'tracking_number', o.tracking_number,
    'tracking_url', o.tracking_url,
    'items', (select jsonb_agg(jsonb_build_object('name', i.product_name, 'finish', i.product_finish, 'slug', i.product_slug,
                                                  'image_off', i.image_off, 'unit_price_cents', i.unit_price_cents,
                                                  'quantity', i.quantity, 'line_total_cents', i.line_total_cents) order by i.id)
                from public.order_items i where i.order_id = o.id))
    from public.orders o
   where o.public_token = p_token and char_length(p_token) = 64;
$$;

-- Internal: only the state machine above may release stock, so not even the server can call it directly.
revoke all on function public.checkout_release_stock(uuid) from public, anon, authenticated, service_role;
revoke all on function public.checkout_create_order(uuid, jsonb, text, integer, text, integer) from public, anon, authenticated;
revoke all on function public.checkout_attach_session(uuid, text, text, timestamptz) from public, anon, authenticated;
revoke all on function public.checkout_apply_outcome(text, text, text, uuid, text, text, jsonb) from public, anon, authenticated;
revoke all on function public.checkout_orders_to_reconcile(integer) from public, anon, authenticated;
revoke all on function public.checkout_order_status(text) from public, anon, authenticated;
grant execute on function public.checkout_create_order(uuid, jsonb, text, integer, text, integer) to service_role;
grant execute on function public.checkout_attach_session(uuid, text, text, timestamptz) to service_role;
grant execute on function public.checkout_apply_outcome(text, text, text, uuid, text, text, jsonb) to service_role;
grant execute on function public.checkout_orders_to_reconcile(integer) to service_role;
grant execute on function public.checkout_order_status(text) to service_role;
