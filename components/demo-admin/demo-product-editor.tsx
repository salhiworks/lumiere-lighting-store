"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "cn";
import { controlClass, Field, FormSection } from "@/components/admin/form-controls";
import { PhotoPairField } from "@/components/admin/photo-pair-field";
import { Button } from "@/components/ui/button";
import { fieldErrors, productInputSchema, readProductForm, type ProductField } from "@/lib/admin/product-input";
import type { AdminProduct } from "@/lib/catalog/types";
import { demoAdminCollections, demoAdminProducts } from "@/lib/demo-admin/catalog";
import { preparePhotoPair } from "@/lib/demo-admin/photos";
import { demoStore, type ProductPatch } from "@/lib/demo-admin/store";
import { useDemoEdits } from "@/lib/demo-admin/use-demo-catalog";
import { DemoBanner } from "./demo-banner";

type Result = { status: "idle" } | { status: "success" | "error"; message: string; fieldErrors?: Partial<Record<ProductField, string>>; savedAt?: number };

/* The fields the demo lets a visitor edit; the rest of the product (URL, specifications, shade size) is validated but left as it is. */
const demoSchema = productInputSchema.pick({
  name: true, finish: true, slug: true, collection: true, summary: true, description: true, price: true, stock: true, highlights: true, alt: true, drop: true, published: true,
});

export function DemoProductEditor({ id }: { id: string }) {
  const edits = useDemoEdits();
  const product = demoAdminProducts(edits).find((item) => item.id === id);
  if (!product) return <p className="py-24 text-center text-sm text-muted-foreground">No sample pendant has this ID. <Link href="/demo/admin" className="underline">Back to products</Link></p>;
  return <EditorForm product={product} />;
}

/*
 * The real product form, kept to what the demo can do: the same sections, controls and photo-pair preview, validated by the same
 * rules as the real admin (lib/admin/product-input.ts), but saved to this browser instead of a database.
 */
function EditorForm({ product }: { product: AdminProduct }) {
  const [result, setResult] = React.useState<Result>({ status: "idle" });
  const [busy, setBusy] = React.useState(false);
  const [drop, setDrop] = React.useState(product.drop);
  const [formKey, setFormKey] = React.useState(0);
  const errors = result.status === "error" ? (result.fieldErrors ?? {}) : {};
  const input = (extra?: string) => cn(controlClass, "h-11", extra);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    const parsed = demoSchema.safeParse(readProductForm(form));
    if (!parsed.success) return setResult({ status: "error", message: "Check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) });
    setBusy(true);
    try {
      const picked = (value: FormDataEntryValue | null) => (value instanceof File && value.size > 0 ? value : null);
      const off = picked(form.get("imageOff"));
      const on = picked(form.get("imageOn"));
      if (Boolean(off) !== Boolean(on)) {
        return setResult({ status: "error", message: "Check the photos.", fieldErrors: { photos: "Pick the switched-off and switched-on photos together, so they stay a matching pair." } });
      }
      const { name, finish, collection, summary, description, price, stock, highlights, alt, drop: cord, published } = parsed.data;
      const patch: ProductPatch = { name, finish, collection, summary, description, priceCents: price, stock, highlights, drop: cord, published };
      if (off && on) {
        try {
          patch.images = await preparePhotoPair(off, on, alt);
        } catch (error) {
          return setResult({ status: "error", message: "Check the photos.", fieldErrors: { photos: error instanceof Error ? error.message : "The photos couldn’t be used." } });
        }
      } else if (alt !== product.images.alt) {
        patch.images = { ...product.images, alt };
      }
      const failure = demoStore.patchProduct(product.id, patch);
      if (failure) return setResult({ status: "error", message: failure });
      setFormKey((value) => value + 1); // the photo field starts fresh and shows the saved pair
      setResult({ status: "success", message: "Saved in this browser. Open the store to see it.", savedAt: Date.now() });
    } finally {
      setBusy(false);
    }
  };

  const title = `${product.name} · ${product.finish}`;
  return (
    <>
      <div className="pt-10">
        <Link href="/demo/admin" className="text-[13px] text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring">
          ← Products
        </Link>
        <h1 className="mt-3 font-display text-[clamp(2.2rem,4vw,3rem)] font-light leading-none tracking-[-0.02em]">{title}</h1>
        <p className="mt-3 font-mono text-[12.5px] text-muted-foreground">/shop/{product.slug}</p>
      </div>
      <DemoBanner />
      <form key={formKey} onSubmit={submit} onChange={() => result.status !== "idle" && setResult({ status: "idle" })} noValidate className="mt-8">
        <input type="hidden" name="slug" value={product.slug} />
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,25rem)] lg:gap-14">
          <div className="grid gap-10">
            <FormSection title="Product" description="What visitors read on the rail, in the shop and on the product page.">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="name" label="Name" hint="Shape and material, e.g. Enamel dome." error={errors.name}>
                  {(control) => <input {...control} name="name" defaultValue={product.name} maxLength={60} className={input()} />}
                </Field>
                <Field id="finish" label="Finish" hint="Colour or surface, e.g. Forest." error={errors.finish}>
                  {(control) => <input {...control} name="finish" defaultValue={product.finish} maxLength={40} className={input()} />}
                </Field>
              </div>
              <Field id="collection" label="Collection" error={errors.collection}>
                {(control) => (
                  <select {...control} name="collection" defaultValue={product.collection} className={input("pr-8")}>
                    {demoAdminCollections.map((collection) => (
                      <option key={collection.id} value={collection.id}>
                        {collection.name}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
              <Field id="summary" label="Summary" hint="One sentence. Shown on the rail and in the shop." error={errors.summary}>
                {(control) => <input {...control} name="summary" defaultValue={product.summary} maxLength={200} className={input()} />}
              </Field>
              <Field id="description" label="Description" hint="The product page copy." error={errors.description}>
                {(control) => <textarea {...control} name="description" defaultValue={product.description} maxLength={2000} rows={5} className={cn(controlClass, "py-2.5 leading-relaxed")} />}
              </Field>
            </FormSection>

            <FormSection title="Price and stock">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="price" label="Price" hint="US dollars, e.g. 180 or 180.50." error={errors.price}>
                  {(control) => (
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] text-muted-foreground">$</span>
                      <input {...control} name="price" inputMode="decimal" defaultValue={(product.priceCents / 100).toFixed(2)} className={input("pl-7 tabular-nums")} />
                    </div>
                  )}
                </Field>
                <Field id="stock" label="Stock" hint="Units available. 0 shows the product as sold out." error={errors.stock}>
                  {(control) => <input {...control} name="stock" type="number" min={0} step={1} inputMode="numeric" defaultValue={product.stock} className={input("tabular-nums")} />}
                </Field>
              </div>
              <label className="group flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-card px-4 py-3.5">
                <input type="checkbox" name="published" defaultChecked={product.published} className="sr-only" />
                <span
                  aria-hidden="true"
                  className="relative mt-0.5 h-6 w-11 shrink-0 rounded-full border border-foreground/20 bg-secondary transition-colors group-has-[:checked]:border-brass group-has-[:checked]:bg-brass group-has-[:focus-visible]:ring-2 group-has-[:focus-visible]:ring-ring motion-reduce:transition-none"
                >
                  <span className="absolute left-[2px] top-1/2 size-[18px] -translate-y-1/2 rounded-full bg-card shadow-[0_1px_3px_rgb(35_32_28/0.3)] transition-transform group-has-[:checked]:translate-x-5 motion-reduce:transition-none" />
                </span>
                <span>
                  <span className="block text-sm font-medium">Visible in the store</span>
                  <span className="block text-[12.5px] text-muted-foreground">Hidden products leave the rail, the shop, collections and the cart.</span>
                </span>
              </label>
            </FormSection>

            <FormSection title="Details" description="Facts for the product page and the rail’s detail view.">
              <Field id="highlights" label="Highlights" hint="One per line, up to six. Shown as chips." error={errors.highlights}>
                {(control) => (
                  <textarea {...control} name="highlights" defaultValue={product.highlights.join("\n")} rows={4} className={cn(controlClass, "py-2.5 font-mono text-[13.5px] leading-relaxed")} />
                )}
              </Field>
            </FormSection>
          </div>

          <div className="lg:sticky lg:top-24 lg:self-start">
            <FormSection title="Photos" description="The switched-off and switched-on cut-outs, always replaced as a pair. They stay in this browser.">
              <PhotoPairField key={result.status === "success" ? result.savedAt : "initial"} current={product.images} error={errors.photos} />
              <Field id="alt" label="Photo description" hint="Describes the lamp for screen readers." error={errors.alt}>
                {(control) => <input {...control} name="alt" defaultValue={product.images.alt} maxLength={200} className={input()} />}
              </Field>
              <Field id="drop" label={`Cord length on the rail: ${drop.toFixed(2)}`} hint="How low the lamp hangs on the homepage rail." error={errors.drop}>
                {(control) => (
                  <input
                    {...control}
                    name="drop"
                    type="range"
                    min={0.5}
                    max={1.1}
                    step={0.01}
                    value={drop}
                    onChange={(event) => setDrop(Number(event.currentTarget.value))}
                    className="h-6 w-full cursor-pointer [accent-color:var(--brass)]"
                  />
                )}
              </Field>
            </FormSection>
          </div>
        </div>

        <div className="sticky bottom-0 z-20 -mx-[clamp(1.25rem,4vw,2.5rem)] mt-12 border-t border-border bg-background/92 px-[clamp(1.25rem,4vw,2.5rem)] py-4 backdrop-blur-md">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <p
              role="status"
              aria-live="polite"
              className={cn("mr-auto text-sm", result.status === "error" && "text-destructive", result.status === "success" && "text-[oklch(0.45_0.09_150)]")}
            >
              {busy ? "Saving…" : result.status === "idle" ? "Changes appear in the demo store as soon as you save." : result.message}
            </p>
            {product.published && (
              <Link
                href={`/shop/${product.slug}`}
                target="_blank"
                className="inline-flex items-center gap-1 text-[13px] font-medium underline decoration-foreground/25 underline-offset-4 outline-none hover:decoration-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                View in store <ArrowUpRight className="size-3.5" aria-hidden="true" />
              </Link>
            )}
            <Button asChild variant="outline">
              <Link href="/demo/admin">Back to products</Link>
            </Button>
            <Button type="submit" disabled={busy} className="min-w-36">
              {busy ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </div>
      </form>
    </>
  );
}
