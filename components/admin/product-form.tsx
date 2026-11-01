"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, Minus, Plus } from "lucide-react";
import { cn } from "cn";
import { preparePhotoUpload, saveProduct, type ProductFormState } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { slugify } from "@/lib/admin/slugify";
import type { AdminProduct, Collection } from "@/lib/catalog/types";
import { controlClass, Field, FormSection } from "./form-controls";
import { imageSize, PhotoPairField } from "./photo-pair-field";

type SpecRow = { key: number; label: string; value: string };

const photoFailure = (message: string): ProductFormState => ({ status: "error", message: "Check the photos.", fieldErrors: { photos: message } });

/*
 * Sends a newly picked photo pair straight to Supabase Storage, so large files never pass through the store's server: the server
 * checks the form and signs two upload URLs (preparePhotoUpload), the browser uploads to them, and saveProduct then checks the
 * stored files before the product points at them. Returns a failure to show, or null once the form names the uploaded pair.
 */
async function uploadPhotos(data: FormData, off: File, on: File): Promise<ProductFormState | null> {
  try {
    const [offSize, onSize] = await Promise.all([imageSize(off), imageSize(on)]);
    data.set("photoMeta", JSON.stringify({ off: { type: off.type, size: off.size, ...offSize }, on: { type: on.type, size: on.size, ...onSize } }));
    const prepared = await preparePhotoUpload(data);
    data.delete("photoMeta");
    if ("state" in prepared) return prepared.state;

    const { ticket } = prepared;
    const put = (url: string, file: File) =>
      fetch(url, { method: "PUT", body: file, headers: { "content-type": file.type, "cache-control": "max-age=31536000", "x-upsert": "false" } });
    const responses = await Promise.all([put(ticket.off.url, off), put(ticket.on.url, on)]);
    const failed = responses.find((response) => !response.ok);
    if (failed) {
      const reason = ((await failed.json().catch(() => null)) as { message?: string } | null)?.message;
      return photoFailure(`The photos couldn’t be uploaded${reason ? ` (${reason})` : ""}. Try again.`);
    }
    data.set("photoOff", ticket.off.path);
    data.set("photoOn", ticket.on.path);
    if (!data.get("productId")) data.set("newProductId", ticket.productId);
    return null;
  } catch {
    return photoFailure("The photos couldn’t be uploaded. Check your connection, then save again.");
  }
}

/*
 * Adds or edits one product. Fields stay uncontrolled and the form is submitted through a transition (not a form `action`), so a
 * validation error never wipes what was typed. The server action validates everything again and reports errors per field.
 */
type ProductFormProps = { product?: AdminProduct; collections: Collection[]; created?: boolean };

export function ProductForm(props: ProductFormProps) {
  const [generation, setGeneration] = React.useState(0);
  // Next.js keeps a page mounted but hidden (React <Activity>) after navigating away. A new-product draft starts fresh on every
  // visit, so the form is replaced when its page is hidden; an edit form keeps any unsaved changes, like a draft would.
  const creating = !props.product;
  React.useLayoutEffect(() => {
    if (!creating) return;
    return () => setGeneration((value) => value + 1);
  }, [creating]);
  return <ProductFormBody key={generation} {...props} />;
}

function ProductFormBody({ product, collections, created = false }: ProductFormProps) {
  const [state, formAction, pending] = React.useActionState<ProductFormState, FormData>(saveProduct, { status: "idle" });
  const [name, setName] = React.useState(product?.name ?? "");
  const [finish, setFinish] = React.useState(product?.finish ?? "");
  const [slug, setSlug] = React.useState(product?.slug ?? "");
  const [slugEdited, setSlugEdited] = React.useState(Boolean(product));
  const [drop, setDrop] = React.useState(product?.drop ?? 0.75);
  const [specs, setSpecs] = React.useState<SpecRow[]>(() =>
    (product?.specs.length ? product.specs : [{ label: "", value: "" }]).map((spec, index) => ({ key: index, ...spec })),
  );

  /* A failed photo upload is reported like a failed save, until the next submit. */
  const [uploading, setUploading] = React.useState(false);
  const [clientResult, setClientResult] = React.useState<ProductFormState | null>(null);
  const result = clientResult ?? state;
  const busy = uploading || pending;

  /* The status line reports the last save until the form is edited again; field errors stay until the next save. */
  const [editedAfter, setEditedAfter] = React.useState<ProductFormState | null>(null);
  const showResult = editedAfter !== result;
  const errors = result.status === "error" ? (result.fieldErrors ?? {}) : {};
  const slugValue = slugEdited ? slug : slugify(name, finish);
  const input = (extra?: string) => cn(controlClass, "h-11", extra);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget);
    const picked = (value: FormDataEntryValue | null) => (value instanceof File && value.size > 0 ? value : null);
    const off = picked(data.get("imageOff"));
    const on = picked(data.get("imageOn"));
    // The files themselves never go to the server action; uploadPhotos names the stored pair instead.
    data.delete("imageOff");
    data.delete("imageOn");
    if (Boolean(off) !== Boolean(on)) {
      setClientResult(photoFailure("Upload the switched-off and switched-on photos together, so they stay a matching pair."));
      return;
    }
    setClientResult(null);
    if (off && on) setUploading(true);
    React.startTransition(async () => {
      if (off && on) {
        const failure = await uploadPhotos(data, off, on);
        if (failure) {
          setClientResult(failure);
          setUploading(false);
          return;
        }
      }
      React.startTransition(() => formAction(data));
      setUploading(false);
    });
  };

  return (
    <form onSubmit={submit} onChange={() => setEditedAfter(result)} noValidate className="mt-8">
      {product && <input type="hidden" name="productId" value={product.id} />}

      {created && state.status === "idle" && (
        <p role="status" className="mb-8 rounded-lg border border-[oklch(0.62_0.09_150)]/40 bg-[oklch(0.62_0.09_150)]/8 px-4 py-3 text-sm">
          Product created. {product?.published ? "It’s visible in the store." : "It stays hidden until you make it visible below."}
        </p>
      )}

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,25rem)] lg:gap-14">
        <div className="grid gap-10">
          <FormSection title="Product" description="What visitors read on the rail, in the shop and on the product page.">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="name" label="Name" hint="Shape and material, e.g. Enamel dome." error={errors.name}>
                {(control) => <input {...control} name="name" value={name} onChange={(event) => setName(event.currentTarget.value)} maxLength={60} className={input()} />}
              </Field>
              <Field id="finish" label="Finish" hint="Colour or surface, e.g. Forest." error={errors.finish}>
                {(control) => <input {...control} name="finish" value={finish} onChange={(event) => setFinish(event.currentTarget.value)} maxLength={40} className={input()} />}
              </Field>
            </div>
            <Field
              id="slug"
              label="URL name"
              hint={product ? "Changing it breaks links people saved to the old address." : "Filled in from the name and finish. Lowercase letters, numbers and hyphens."}
              error={errors.slug}
            >
              {(control) => (
                <div className="flex items-stretch">
                  <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-secondary px-3 font-mono text-[12.5px] text-muted-foreground">/shop/</span>
                  <input
                    {...control}
                    name="slug"
                    value={slugValue}
                    onChange={(event) => {
                      setSlugEdited(true);
                      setSlug(event.currentTarget.value);
                    }}
                    maxLength={80}
                    spellCheck={false}
                    className={input("rounded-l-none font-mono text-[14px]")}
                  />
                </div>
              )}
            </Field>
            <Field id="collection" label="Collection" error={errors.collection}>
              {(control) => (
                <select {...control} name="collection" defaultValue={product?.collection ?? collections[0]?.id} className={input("pr-8")}>
                  {collections.map((collection) => (
                    <option key={collection.id} value={collection.id}>
                      {collection.name}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <Field id="summary" label="Summary" hint="One sentence. Shown on the rail and in the shop." error={errors.summary}>
              {(control) => <input {...control} name="summary" defaultValue={product?.summary} maxLength={200} className={input()} />}
            </Field>
            <Field id="description" label="Description" hint="The product page copy." error={errors.description}>
              {(control) => <textarea {...control} name="description" defaultValue={product?.description} maxLength={2000} rows={5} className={cn(controlClass, "py-2.5 leading-relaxed")} />}
            </Field>
          </FormSection>

          <FormSection title="Price and stock">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="price" label="Price" hint="US dollars, e.g. 180 or 180.50." error={errors.price}>
                {(control) => (
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] text-muted-foreground">$</span>
                    <input {...control} name="price" inputMode="decimal" defaultValue={product ? (product.priceCents / 100).toFixed(2) : ""} className={input("pl-7 tabular-nums")} />
                  </div>
                )}
              </Field>
              <Field id="stock" label="Stock" hint="Units available. 0 shows the product as sold out." error={errors.stock}>
                {(control) => <input {...control} name="stock" type="number" min={0} step={1} inputMode="numeric" defaultValue={product?.stock ?? 0} className={input("tabular-nums")} />}
              </Field>
            </div>
            <label className="group flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-card px-4 py-3.5">
              <input type="checkbox" name="published" defaultChecked={product?.published ?? false} className="sr-only" />
              <span
                aria-hidden="true"
                className="relative mt-0.5 h-6 w-11 shrink-0 rounded-full border border-foreground/20 bg-secondary transition-colors group-has-[:checked]:border-brass group-has-[:checked]:bg-brass group-has-[:focus-visible]:ring-2 group-has-[:focus-visible]:ring-ring motion-reduce:transition-none"
              >
                <span className="absolute left-[2px] top-1/2 size-[18px] -translate-y-1/2 rounded-full bg-card shadow-[0_1px_3px_rgb(35_32_28/0.3)] transition-transform group-has-[:checked]:translate-x-5 motion-reduce:transition-none" />
              </span>
              <span>
                <span className="block text-sm font-medium">Visible in the store</span>
                <span className="block text-[12.5px] text-muted-foreground">Hidden products stay in the admin only: off the rail, the shop and search engines.</span>
              </span>
            </label>
          </FormSection>

          <FormSection title="Details" description="Facts for the product page and the rail’s detail view.">
            <Field id="diameterCm" label="Shade diameter (cm)" error={errors.diameterCm} className="sm:max-w-[12rem]">
              {(control) => <input {...control} name="diameterCm" inputMode="decimal" defaultValue={product?.diameterCm ?? ""} className={input("tabular-nums")} />}
            </Field>
            <Field id="highlights" label="Highlights" hint="One per line, up to six. Shown as chips, e.g. E27 · 4 W filament LED." error={errors.highlights}>
              {(control) => (
                <textarea {...control} name="highlights" defaultValue={product?.highlights.join("\n")} rows={4} className={cn(controlClass, "py-2.5 font-mono text-[13.5px] leading-relaxed")} />
              )}
            </Field>
            <fieldset className="flex flex-col gap-2" aria-describedby={errors.specs ? "specs-error" : undefined}>
              <legend className="mb-1.5 text-[13px] font-medium">Specifications</legend>
              {specs.map((spec, index) => (
                <div key={spec.key} className="grid grid-cols-[minmax(0,10rem)_minmax(0,1fr)_2.5rem] gap-2">
                  <input name="specLabel" defaultValue={spec.label} aria-label={`Specification ${index + 1} label`} placeholder="Label" maxLength={30} className={input()} />
                  <input name="specValue" defaultValue={spec.value} aria-label={`Specification ${index + 1} value`} placeholder="Value" maxLength={120} className={input()} />
                  <button
                    type="button"
                    onClick={() => setSpecs((rows) => rows.filter((row) => row.key !== spec.key))}
                    aria-label={`Remove specification ${index + 1}`}
                    className="grid size-11 place-items-center rounded-full text-muted-foreground outline-none hover:bg-secondary hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Minus className="size-4" aria-hidden="true" />
                  </button>
                </div>
              ))}
              {specs.length < 12 && (
                <button
                  type="button"
                  onClick={() => setSpecs((rows) => [...rows, { key: Math.max(-1, ...rows.map((row) => row.key)) + 1, label: "", value: "" }])}
                  className="inline-flex items-center gap-1.5 self-start rounded-full px-1 py-1 text-[13px] font-medium outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Plus className="size-3.5" aria-hidden="true" /> Add a specification
                </button>
              )}
              {errors.specs && (
                <p id="specs-error" className="text-[12.5px] text-destructive">
                  {errors.specs}
                </p>
              )}
            </fieldset>
          </FormSection>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <FormSection title="Photos" description="The switched-off and switched-on cut-outs, always replaced as a pair.">
            <PhotoPairField key={state.savedAt ?? "initial"} current={product?.images} error={errors.photos} />
            <Field id="alt" label="Photo description" hint="Describes the lamp for screen readers, e.g. Dome pendant in forest-green enamel." error={errors.alt}>
              {(control) => <input {...control} name="alt" defaultValue={product?.images.alt} maxLength={200} className={input()} />}
            </Field>
            <Field id="drop" label={`Cord length on the rail: ${drop.toFixed(2)}`} hint="How low the lamp hangs on the homepage rail. Longer cords swing more slowly." error={errors.drop}>
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
            className={cn("mr-auto text-sm", showResult && result.status === "error" && "text-destructive", showResult && result.status === "success" && "text-[oklch(0.45_0.09_150)]")}
          >
            {uploading
              ? "Uploading photos…"
              : pending
                ? "Saving…"
                : ((showResult && result.message) ||
                  (product ? "Changes appear in the store as soon as you save." : "New products start hidden unless you make them visible."))}
          </p>
          {product?.published && (
            <Link
              href={`/shop/${product.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1 text-[13px] font-medium underline decoration-foreground/25 underline-offset-4 outline-none hover:decoration-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              View in store <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </Link>
          )}
          <Button asChild variant="outline">
            <Link href="/admin">{product ? "Back to products" : "Cancel"}</Link>
          </Button>
          <Button type="submit" disabled={busy} className="min-w-36">
            {uploading ? "Uploading…" : pending ? "Saving…" : product ? "Save changes" : "Create product"}
          </Button>
        </div>
      </div>
    </form>
  );
}
