"use client";

import * as React from "react";
import Link from "next/link";
import { LampImage } from "@/components/product/lamp-image";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { productTitle } from "@/lib/catalog/helpers";
import type { CartProduct } from "@/lib/catalog/types";
import { formatPrice } from "@/lib/format";
import { CheckoutButton } from "./checkout-button";
import { QuantityStepper } from "./quantity-stepper";
import { useCart, type CartItem, type UnavailableLine } from "./use-cart";

type CartDrawerProps = { open: boolean; onOpenChange: (open: boolean) => void };

export function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const { ready, items, unavailable, count, subtotalCents, currency, setQuantity, remove } = useCart();
  const [announcement, setAnnouncement] = React.useState("");
  const returnFocus = React.useRef<HTMLElement | null>(null);
  const close = () => onOpenChange(false);

  const removeLine = (productId: string, label: string) => {
    remove(productId);
    setAnnouncement(`${label} removed from your cart.`);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 border-l-border bg-background p-0 sm:max-w-[27rem]"
        /* The drawer opens from several places (header, product page, lamp detail), none of them a Radix trigger, so Radix would drop
           focus on close. Remember what had focus when it opened and hand focus back there. */
        onOpenAutoFocus={() => {
          const focused = document.activeElement;
          returnFocus.current = focused instanceof HTMLElement && focused !== document.body ? focused : null;
        }}
        onCloseAutoFocus={(event) => {
          const target = returnFocus.current;
          returnFocus.current = null;
          if (!target?.isConnected) return;
          event.preventDefault();
          target.focus({ preventScroll: true });
        }}
      >
        <SheetHeader className="gap-1.5 border-b border-border px-6 pb-5 pt-7">
          <SheetTitle className="text-[1.75rem] leading-none font-normal tracking-[-0.01em]">Your cart</SheetTitle>
          <SheetDescription className="text-[13px]">
            {!ready ? "Opening your cart…" : count > 0 ? `${count} ${count === 1 ? "pendant" : "pendants"}, saved on this device` : "Saved on this device"}
          </SheetDescription>
        </SheetHeader>
        <p className="sr-only" aria-live="polite">
          {announcement}
        </p>

        {!ready ? (
          <CartSkeleton />
        ) : items.length === 0 && unavailable.length === 0 ? (
          <EmptyCart onBrowse={close} />
        ) : (
          <>
            <ul className="flex-1 overflow-y-auto px-6" aria-label="Items in your cart">
              {items.map((item) => (
                <CartLineItem
                  key={item.product.id}
                  item={item}
                  onNavigate={close}
                  onQuantity={setQuantity}
                  onRemove={(product) => removeLine(product.id, productTitle(product))}
                />
              ))}
              {unavailable.map((line) => (
                <UnavailableLineItem key={line.productId} line={line} onRemove={(label) => removeLine(line.productId, label)} />
              ))}
            </ul>
            <SheetFooter className="gap-0 border-t border-border bg-card px-6 pb-6 pt-5">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium">Subtotal</span>
                <span className="font-display text-[1.75rem] leading-none tabular-nums">{formatPrice(subtotalCents, currency)}</span>
              </div>
              <CheckoutButton items={items} />
              <Button variant="link" size="sm" className="mt-4 self-center" onClick={close}>
                Continue shopping
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

type CartLineItemProps = {
  item: CartItem;
  onNavigate: () => void;
  onQuantity: (product: CartProduct, quantity: number) => void;
  onRemove: (product: CartProduct) => void;
};

function CartLineItem({ item, onNavigate, onQuantity, onRemove }: CartLineItemProps) {
  const { product, quantity, max, lineTotalCents } = item;
  const href = `/shop/${product.slug}`;
  return (
    <li className="flex gap-4 border-b border-border py-5 last:border-b-0">
      <Link href={href} onClick={onNavigate} tabIndex={-1} aria-hidden="true" className="relative h-28 w-20 shrink-0 overflow-hidden rounded-md bg-secondary">
        <LampImage product={product} lit fit="cover" className="inset-0" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={href} onClick={onNavigate} className="font-display text-lg leading-tight underline-offset-4 outline-none hover:underline focus-visible:underline focus-visible:ring-2 focus-visible:ring-ring">
              {product.name}
            </Link>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              {product.finish} · {formatPrice(product.priceCents, product.currency)} each
            </p>
          </div>
          <p className="text-sm tabular-nums">{formatPrice(lineTotalCents, product.currency)}</p>
        </div>
        <div className="mt-auto flex items-center justify-between gap-3">
          <QuantityStepper value={quantity} max={max} onChange={(next) => onQuantity(product, next)} label={`Quantity, ${productTitle(product)}`} />
          <RemoveButton label={productTitle(product)} onRemove={() => onRemove(product)} />
        </div>
      </div>
    </li>
  );
}

/* A saved line whose pendant was hidden, removed or sold out since it was added. */
function UnavailableLineItem({ line, onRemove }: { line: UnavailableLine; onRemove: (label: string) => void }) {
  const label = line.product ? productTitle(line.product) : "This pendant";
  return (
    <li className="flex items-center justify-between gap-4 border-b border-border py-5 last:border-b-0">
      <div className="min-w-0">
        <p className="font-display text-lg leading-tight text-muted-foreground">{line.product ? line.product.name : "No longer available"}</p>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          {line.product ? "Sold out for now · not included in the subtotal" : "Removed from the collection · not included in the subtotal"}
        </p>
      </div>
      <RemoveButton label={label} onRemove={() => onRemove(label)} />
    </li>
  );
}

function RemoveButton({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      aria-label={`Remove ${label}`}
      className="rounded-sm text-[13px] text-muted-foreground underline decoration-foreground/20 underline-offset-4 outline-none transition-colors hover:text-foreground hover:decoration-foreground focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
    >
      Remove
    </button>
  );
}

function EmptyCart({ onBrowse }: { onBrowse: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-10 pb-16 text-center">
      <svg aria-hidden="true" viewBox="0 0 64 96" className="h-24 w-16 text-muted-foreground/70" fill="none" stroke="currentColor" strokeWidth="1.2">
        <path d="M32 0v38" />
        <path d="M28 38h8l2 6H26z" />
        <path d="M32 44c-12 0-19 9-22 26h44c-3-17-10-26-22-26z" />
        <path d="M27 70a5 5 0 0 0 10 0" />
      </svg>
      <p className="mt-6 font-display text-2xl">Your cart is empty</p>
      <p className="mt-2 max-w-[32ch] text-sm leading-relaxed text-muted-foreground">Light a few pendants on the rail, then add the ones you like.</p>
      <Button asChild className="mt-7">
        <Link href="/shop" onClick={onBrowse}>
          Browse pendants
        </Link>
      </Button>
    </div>
  );
}

function CartSkeleton() {
  return (
    <div aria-hidden="true" className="flex-1 px-6 py-5">
      {[0, 1].map((row) => (
        <div key={row} className="flex gap-4 py-5">
          <div className="h-28 w-20 animate-pulse rounded-md bg-secondary" />
          <div className="flex flex-1 flex-col gap-2 pt-1">
            <div className="h-4 w-2/3 animate-pulse rounded bg-secondary" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-secondary" />
          </div>
        </div>
      ))}
    </div>
  );
}
