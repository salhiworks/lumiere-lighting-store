"use client";

import * as React from "react";
import { beginCheckout } from "@/app/(store)/checkout/actions";
import { Button } from "@/components/ui/button";
import { productTitle } from "@/lib/catalog/helpers";
import type { CheckoutProblem } from "@/lib/checkout/orders";
import { formatPrice } from "@/lib/format";
import { useCartCatalog, useCheckoutNotice } from "./cart-context";
import type { CartItem } from "./use-cart";

const countries = new Intl.DisplayNames(["en"], { type: "region" });

/*
 * Starts Stripe Checkout for the cart. The browser sends only IDs and quantities; the server prices everything and reserves the
 * stock. One attempt keeps one request ID, so a double click (or a retry after a dropped connection) reuses a single order.
 */
export function CheckoutButton({ items }: { items: CartItem[] }) {
  const notice = useCheckoutNotice();
  const catalog = useCartCatalog();
  const [pending, startTransition] = React.useTransition();
  const [redirecting, setRedirecting] = React.useState(false);
  const [message, setMessage] = React.useState<{ text: string; problems: string[] } | null>(null);
  const cartKey = items.map((item) => `${item.product.id}:${item.quantity}`).join(",");
  const attempt = React.useRef<{ key: string; id: string } | null>(null);

  if (!notice.open) {
    return (
      <>
        <Button size="lg" className="mt-5 w-full" aria-disabled="true" aria-describedby="checkout-status" onClick={(event) => event.preventDefault()}>
          Checkout unavailable
        </Button>
        <p id="checkout-status" className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
          {notice.message}
        </p>
      </>
    );
  }

  const busy = pending || redirecting;
  const describe = (problem: CheckoutProblem) => {
    const product = problem.productId ? catalog.get(problem.productId) : undefined;
    const label = product ? productTitle(product) : "A pendant";
    if (problem.reason === "insufficient_stock") return problem.available ? `${label}: only ${problem.available} left` : `${label}: sold out`;
    if (problem.reason === "unavailable") return `${label}: no longer available`;
    return `${label}: can’t be ordered right now`;
  };

  const start = () => {
    if (busy || !items.length) return;
    // A new attempt whenever the cart changes; the same attempt (and order) if the same cart is submitted again.
    if (!attempt.current || attempt.current.key !== cartKey) attempt.current = { key: cartKey, id: crypto.randomUUID() };
    const requestId = attempt.current.id;
    setMessage(null);
    startTransition(async () => {
      const result = await beginCheckout({ requestId, lines: items.map((item) => ({ productId: item.product.id, quantity: item.quantity })) });
      if (result.ok) {
        setRedirecting(true);
        window.location.assign(result.url);
        return;
      }
      if (result.retryWithNewRequest || result.problems?.length) attempt.current = null;
      setMessage({ text: result.message, problems: (result.problems ?? []).filter((problem) => problem.reason !== "empty_cart").map(describe) });
    });
  };

  const shipping = notice.shippingCents === 0 ? "Free shipping" : `Shipping ${formatPrice(notice.shippingCents, notice.currency)}`;
  const destinations = notice.shippingCountries.map((code) => countries.of(code) ?? code).join(", ");

  return (
    <>
      <Button size="lg" className="mt-5 w-full" disabled={busy || !items.length} aria-describedby="checkout-status" onClick={start}>
        {busy ? "Opening secure checkout…" : "Checkout"}
      </Button>
      <div id="checkout-status" aria-live="polite" className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
        {message ? (
          <div role="alert" className="text-destructive">
            <p>{message.text}</p>
            {message.problems.length > 0 && (
              <ul className="mt-1.5 list-disc pl-4">
                {message.problems.map((problem) => (
                  <li key={problem}>{problem}</li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <p>
            {shipping} to {destinations}
            {notice.taxAdded ? "; tax is calculated at checkout" : ""}. Secure payment on Stripe.
          </p>
        )}
      </div>
    </>
  );
}
