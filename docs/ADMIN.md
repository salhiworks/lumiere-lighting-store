# The admin

The admin lives at `/admin` once Supabase is connected (README, "Connect Supabase"). The public demo build has no admin at all.

`/admin` signs in with Supabase Auth (email and password). It covers:
- **Products:** every product with its photo, price, stock and visibility. Search by name, finish, collection or URL name, and show or hide a product in one click.
- **Add and edit:**
  - name, finish, URL name and collection
  - price, stock and shade size
  - summary, description, highlights and specifications
  - photo description, cord length on the rail, and visibility (new products start hidden)
- **Photo pairs:** upload or replace the unlit and lit photos together, and preview them as Off, On and Overlay before saving.
- **Orders:** every order with its payment status from Stripe, filters (To ship, Awaiting payment, Needs review, Shipped, Not completed) and search. An order page shows the purchased pendants at their checkout prices, the customer and shipping address, and a fulfillment form (status, carrier, tracking). Payment status can't be edited by hand.

Every change goes through a Server Action. Each action checks administrator rights on the server, validates every field, and writes under the admin's own session, so Row Level Security has the final say. A save updates the rail, shop, collections, product pages and carts at once.

Admin rights also depend on the session itself: signing out ends them immediately, for the dashboard, the Data API and Storage alike, even if someone copied the session cookie.

There are two deliberate limits:
- **No deleting products.** Hide them instead, so carts and orders can still point at them.
- **No collection editing.** Edit collections in the Supabase table editor.

## Photo pairs

The rail switches a lamp on by crossfading two photos, so the pair has to match exactly. Saving is refused unless both photos are:
- PNG or WebP (read from the file itself), at most 4 MB
- 300–4000 px wide and 450–6000 px tall
- portrait, close to 2:3: the width is 55–72% of the height (the originals are 557 × 900)
- transparent, with an alpha channel
- the same canvas size as each other

The preview also runs pixel checks. They are advisory only:
- the corners are clear
- the cord starts at the top centre
- the lamp ends above 85% of the height
- the two photos line up: they shift by at most 2% of the width, and the shades overlap by at least 90%

Photos upload straight from the browser to the `lamp-photos` bucket, through single-use signed URLs, so they never pass through the store's server:
1. The server signs the upload only after checking the admin, the form and the photos' reported size and canvas.
2. The browser uploads the two files.
3. Before the product uses them, the server checks the stored files themselves.

The store then serves them from its own address, under `/lamps/uploads/…`. Each upload gets a new file name, and the files it replaces are deleted. The original eight pairs are never changed. Full rules: [`ASSETS.md`](ASSETS.md).

## Create your administrator

New accounts are never administrators. Access is granted in SQL, which only the project's owners can run.

1. In **Authentication → Users**, choose **Add user → Create new user**. Enter your email and a strong password, and leave **Auto Confirm User** ticked.
2. In **SQL Editor**, run this with your email:

   ```sql
   insert into public.admin_users (user_id)
   select id from auth.users where email = 'you@example.com';
   ```

3. Sign in at `/admin`.

The store has no customer accounts, so turn off **Allow new users to sign up** under **Authentication → Sign In / Providers**. A sign-up could never become an administrator anyway; this just keeps stray accounts out.

To remove an administrator:

```sql
delete from public.admin_users where user_id = (select id from auth.users where email = 'you@example.com');
```
