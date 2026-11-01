"use client";

import * as React from "react";
import { cn } from "cn";
import { recheckPayment, updateFulfillment, type FulfillmentState, type RecheckState } from "@/app/admin/orders/actions";
import { Button } from "@/components/ui/button";
import type { OrderRow } from "@/lib/admin/order-format";
import { controlClass, Field } from "./form-controls";

/* Shipping details for a paid order. Payment status isn't editable here, or anywhere: it comes from Stripe. */
export function FulfillmentForm({ order }: { order: Pick<OrderRow, "id" | "payment_status" | "fulfillment_status" | "carrier" | "tracking_number" | "tracking_url" | "admin_note"> }) {
  const [state, action, pending] = React.useActionState<FulfillmentState, FormData>(updateFulfillment, { status: "idle" });
  const paid = order.payment_status === "paid";
  const errors = state.fieldErrors ?? {};
  const input = cn(controlClass, "h-11");
  // Submitted through a transition rather than a form action, so a refused save never clears what was typed.
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    React.startTransition(() => action(data));
  };
  // After a save, the page sends the stored values back; remounting the fields shows them.
  const saved = [order.fulfillment_status, order.carrier, order.tracking_number, order.tracking_url, order.admin_note].join("|");

  return (
    <form onSubmit={submit} noValidate className="grid gap-5">
      <input type="hidden" name="orderId" value={order.id} />
      <fieldset key={saved} disabled={!paid || pending} className="grid gap-5 disabled:opacity-70">
        <Field id="status" label="Fulfillment">
          {(control) => (
            <select {...control} name="status" defaultValue={order.fulfillment_status} className={cn(input, "pr-8")}>
              <option value="unfulfilled">Not shipped</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
            </select>
          )}
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="carrier" label="Carrier" error={errors.carrier}>
            {(control) => <input {...control} name="carrier" defaultValue={order.carrier ?? ""} maxLength={60} className={input} />}
          </Field>
          <Field id="trackingNumber" label="Tracking number" error={errors.trackingNumber}>
            {(control) => <input {...control} name="trackingNumber" defaultValue={order.tracking_number ?? ""} maxLength={80} className={cn(input, "font-mono text-[14px]")} />}
          </Field>
        </div>
        <Field id="trackingUrl" label="Tracking link" hint="Shown to the customer on their order page." error={errors.trackingUrl}>
          {(control) => <input {...control} name="trackingUrl" type="url" inputMode="url" defaultValue={order.tracking_url ?? ""} placeholder="https://" className={input} />}
        </Field>
        <Field id="note" label="Internal note" hint="Only visible in the admin." error={errors.note}>
          {(control) => <textarea {...control} name="note" defaultValue={order.admin_note ?? ""} rows={3} maxLength={2000} className={cn(controlClass, "py-2.5 leading-relaxed")} />}
        </Field>
      </fieldset>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Button type="submit" disabled={!paid || pending} className="min-w-32">
          {pending ? "Saving…" : "Save fulfillment"}
        </Button>
        <p role="status" aria-live="polite" className={cn("text-sm", state.status === "error" ? "text-destructive" : state.status === "success" ? "text-[oklch(0.45_0.09_150)]" : "text-muted-foreground")}>
          {state.message ?? (paid ? "" : "Fulfillment opens once Stripe confirms the payment.")}
        </p>
      </div>
    </form>
  );
}

export function RecheckPayment({ orderId }: { orderId: string }) {
  const [state, action, pending] = React.useActionState<RecheckState, FormData>(recheckPayment, {});
  return (
    <form action={action} className="flex flex-col items-start gap-2">
      <input type="hidden" name="orderId" value={orderId} />
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending ? "Asking Stripe…" : "Check payment with Stripe"}
      </Button>
      <p role="status" aria-live="polite" className={cn("text-[12.5px]", state.error ? "text-destructive" : "text-muted-foreground")}>
        {state.message}
      </p>
    </form>
  );
}
