"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Check, Trash2 } from "lucide-react";
import { cn } from "cn";
import { controlClass, Field, FormSection } from "@/components/admin/form-controls";
import { PhotoPairField, type PickedPair } from "@/components/admin/photo-pair-field";
import { ProductPreview, readDraft, type PreviewDraft } from "@/components/admin/product-preview";
import { LampImage } from "@/components/product/lamp-image";
import { ProductLink } from "@/components/product/product-link";
import { Button } from "@/components/ui/button";
import { fieldErrors, productInputSchema, readProductForm, type ProductField } from "@/lib/admin/product-input";
import { slugify } from "@/lib/admin/slugify";
import { demoProducts } from "@/lib/catalog/demo-data";
import type { AdminProduct, ProductImages, ProductSpec } from "@/lib/catalog/types";
import { demoAdminCollections, demoAdminProducts } from "@/lib/demo-admin/catalog";
import { isLocalProductId, newLocalProductId } from "@/lib/demo-admin/ids";
import { preparePhotoPair } from "@/lib/demo-admin/photos";
import { demoStore, slugAvailable, type ProductPatch } from "@/lib/demo-admin/store";
import { useDemoEdits } from "@/lib/demo-admin/use-demo-catalog";
import { DemoBanner } from "./demo-banner";

type Result = { status: "idle" } | { status: "success" | "error"; message: string; fieldErrors?: Partial<Record<ProductField, string>>; savedAt?: number };
type PhotoSource = "current" | "sample" | "upload";

/* The fields a visitor may change on a built-in sample pendant (its URL, size and specifications stay as shipped). */
const sampleSchema = productInputSchema.pick({
  name: true, finish: true, slug: true, collection: true, summary: true, description: true, price: true, stock: true, highlights: true, alt: true, drop: true, published: true,
});

/* The sample photo pairs a new product can borrow, so the demo works without the visitor having matching cut-outs of their own. */
const SAMPLE_PAIRS = demoProducts.map((product) => ({ id: product.id, label: `${product.name} · ${product.finish}`, images: product.images }));

/* A message carried across the navigation from "Create product" to the new product's edit page (same tab, in memory only). */
let flash: string | null = null;

const subscribeNever = () => () => {};

/*
 * The demo's product editor, for a new product (no `id`) or an existing one. It mirrors the real admin's form: the same sections,
 * controls, validation rules (lib/admin/product-input.ts), photo-pair checks and live preview, but saves to this browser instead of a
 * database. It renders once the browser's saved demo data is known, so the fields always start from the latest saved values.
 */
export function DemoProductEditor({ id }: { id?: string }) {
  const edits = useDemoEdits();
  const ready = React.useSyncExternalStore(subscribeNever, () => true, () => false);
  if (!ready) return <EditorSkeleton />;
  if (!id) return <EditorForm key="new" />;
  const product = demoAdminProducts(edits).find((item) => item.id === id);
  if (!product) {
    return (
      <div className="py-24 text-center">
        <p className="font-display text-2xl">No pendant with this ID in this browser.</p>
        <p className="mt-2 text-sm text-muted-foreground">Products made in the demo live only in the browser that made them, and Reset Demo removes them.</p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/demo/admin/products">Back to products</Link>
        </Button>
      </div>
    );
  }
  return <EditorForm key={product.id} product={product} />;
}

function EditorSkeleton() {
  return (
    <div aria-hidden="true" className="grid gap-10 pt-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,25rem)]">
      <div className="grid content-start gap-4">
        <span className="h-10 w-2/3 animate-pulse rounded bg-secondary" />
        <span className="h-11 animate-pulse rounded bg-secondary" />
        <span className="h-11 animate-pulse rounded bg-secondary" />
        <span className="h-32 animate-pulse rounded bg-secondary" />
      </div>
      <span className="aspect-[4/5] animate-pulse rounded-2xl bg-secondary" />
    </div>
  );
}

function EditorForm({ product }: { product?: AdminProduct }) {
  const router = useRouter();
  const edits = useDemoEdits();
  const creating = !product;
  // A visitor-created product is fully editable; a built-in sample keeps its URL, size and specifications.
  const ownProduct = creating || isLocalProductId(product.id);
  const [result, setResult] = React.useState<Result>(() => {
    const message = flash;
    flash = null;
    return message ? { status: "success", message, savedAt: Date.now() } : { status: "idle" };
  });
  const [busy, setBusy] = React.useState(false);
  const [drop, setDrop] = React.useState(product?.drop ?? 0.75);
  const [formKey, setFormKey] = React.useState(0);
  const [name, setName] = React.useState(product?.name ?? "");
  const [finish, setFinish] = React.useState(product?.finish ?? "");
  const [slug, setSlug] = React.useState(product?.slug ?? "");
  const [slugEdited, setSlugEdited] = React.useState(Boolean(product));
  const [source, setSource] = React.useState<PhotoSource>(creating ? "sample" : "current");
  const [sampleId, setSampleId] = React.useState(SAMPLE_PAIRS[0]?.id ?? "");
  const [pair, setPair] = React.useState<PickedPair | null>(null);
  const formRef = React.useRef<HTMLFormElement>(null);
  const [draft, setDraft] = React.useState<PreviewDraft>(() => ({
    name: product?.name ?? "",
    finish: product?.finish ?? "",
    priceCents: product?.priceCents ?? null,
    stock: product?.stock ?? 10,
    published: product?.published ?? true,
    drop: product?.drop ?? 0.75,
  }));

  const errors = result.status === "error" ? (result.fieldErrors ?? {}) : {};
  const input = (extra?: string) => cn(controlClass, "h-11", extra);
  const slugValue = slugEdited ? slug : slugify(name, finish);
  const sample = SAMPLE_PAIRS.find((item) => item.id === sampleId) ?? SAMPLE_PAIRS[0];
  const previewImages: ProductImages | null =
    source === "upload" ? (pair ? { ...pair, alt: "" } : (product?.images ?? null)) : source === "sample" ? (sample?.images ?? null) : (product?.images ?? null);

  const refresh = () => {
    if (formRef.current) setDraft(readDraft(formRef.current, demoAdminCollections));
    if (result.status !== "idle" && !busy) setResult({ status: "idle" });
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    const raw = readProductForm(form);
    const specs = parseSpecs(String(form.get("specsText") ?? ""));
    const fullParsed = ownProduct ? productInputSchema.safeParse({ ...raw, specs: specs.rows }) : null;
    const parsed = fullParsed ?? sampleSchema.safeParse(raw);
    const problems: Partial<Record<ProductField, string>> = parsed.success ? {} : fieldErrors(parsed.error);
    if (ownProduct && specs.error) problems.specs = specs.error;
    if (ownProduct && parsed.success && !slugAvailable(edits, parsed.data.slug, product?.id)) problems.slug = "Another pendant already uses this URL name. Try adding the finish or a number.";
    if (!parsed.success || Object.keys(problems).length) return setResult({ status: "error", message: "Check the highlighted fields.", fieldErrors: problems });

    setBusy(true);
    try {
      const data = parsed.data;
      // The complete product (URL, size, specifications): only for products the visitor makes themselves.
      const full = fullParsed?.success ? fullParsed.data : null;
      let images: ProductImages;
      if (source === "upload") {
        const picked = (value: FormDataEntryValue | null) => (value instanceof File && value.size > 0 ? value : null);
        const off = picked(form.get("imageOff"));
        const on = picked(form.get("imageOn"));
        if (!off || !on) {
          if (product) images = { ...product.images, alt: data.alt };
          else return setResult({ status: "error", message: "Check the photos.", fieldErrors: { photos: "Pick both photos of the pair, or use a sample pair." } });
        } else {
          try {
            images = await preparePhotoPair(off, on, data.alt);
          } catch (error) {
            return setResult({ status: "error", message: "Check the photos.", fieldErrors: { photos: error instanceof Error ? error.message : "The photos couldn’t be used." } });
          }
        }
      } else if (source === "sample" && sample) {
        images = { ...sample.images, alt: data.alt };
      } else if (product) {
        images = { ...product.images, alt: data.alt };
      } else {
        return setResult({ status: "error", message: "Check the photos.", fieldErrors: { photos: "Choose a photo pair." } });
      }

      const common: ProductPatch = {
        name: data.name, finish: data.finish, collection: data.collection, summary: data.summary, description: data.description,
        priceCents: data.price, stock: data.stock, highlights: data.highlights, drop: data.drop, published: data.published, images,
      };

      if (creating && full) {
        const id = newLocalProductId();
        const failure = demoStore.createProduct({
          ...(common as Required<Omit<ProductPatch, "updatedAt">>),
          id, slug: full.slug, currency: "USD", diameterCm: full.diameterCm, specs: full.specs,
        });
        if (failure) return setResult({ status: "error", message: failure, fieldErrors: failure.includes("URL name") ? { slug: failure } : undefined });
        flash = data.published ? "Product created and visible in the demo store." : "Product created. It stays hidden until you make it visible.";
        router.push(`/demo/admin/products/${id}`);
        return;
      }

      const patch = full ? { ...common, slug: full.slug, diameterCm: full.diameterCm, specs: full.specs } : common;
      const failure = demoStore.patchProduct(product!.id, patch);
      if (failure) return setResult({ status: "error", message: failure });
      setFormKey((value) => value + 1); // the photo field starts fresh and shows the saved pair
      setSource("current");
      setPair(null);
      setResult({ status: "success", message: data.published ? "Saved. The demo store shows it now." : "Saved. It’s hidden from the store.", savedAt: Date.now() });
    } finally {
      setBusy(false);
    }
  };

  const remove = () => {
    if (!product || !window.confirm(`Delete ${product.name} · ${product.finish}? This removes it from the demo in this browser.`)) return;
    const failure = demoStore.deleteProduct(product.id);
    if (failure) return setResult({ status: "error", message: failure });
    router.push("/demo/admin/products");
  };

  const title = product ? `${product.name} · ${product.finish}` : "New product";
  const shownSlug = ownProduct ? slugValue : product!.slug;

  return (
    <>
      <div className="pt-8 sm:pt-12">
        <Link href="/demo/admin/products" className="inline-flex items-center gap-1.5 rounded-sm text-[13px] text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
          <ArrowLeft className="size-3.5" aria-hidden="true" /> All products
        </Link>
        <h1 className="mt-4 font-display text-[clamp(2.2rem,4vw,3.2rem)] font-light leading-none tracking-[-0.03em]">{title}</h1>
        <p className="mt-3 font-mono text-[12.5px] text-muted-foreground">
          /shop/{shownSlug || "…"}
          {product && isLocalProductId(product.id) && <span className="ml-3 font-sans text-[12px]">· made in this browser</span>}
        </p>
        <DemoBanner>
          {creating ? (
            <>
              <strong className="font-medium text-foreground">Make a pendant.</strong> It appears on the rail, in the shop, in its collection and in the cart, in this browser only.
              Reset Demo removes it.
            </>
          ) : undefined}
        </DemoBanner>
      </div>

      <form key={formKey} ref={formRef} onSubmit={submit} onInput={refresh} noValidate className="mt-8">
        {!ownProduct && <input type="hidden" name="slug" value={product!.slug} />}
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,25rem)] lg:gap-14">
          <div className="grid content-start gap-10">
            <FormSection title="Product" description="What visitors read on the rail, in the shop and on the product page.">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="name" label="Name" hint="Shape and material, e.g. Enamel dome." error={errors.name}>
                  {(control) => <input {...control} name="name" value={name} onChange={(event) => setName(event.currentTarget.value)} maxLength={60} className={input()} />}
                </Field>
                <Field id="finish" label="Finish" hint="Colour or surface, e.g. Forest." error={errors.finish}>
                  {(control) => <input {...control} name="finish" value={finish} onChange={(event) => setFinish(event.currentTarget.value)} maxLength={40} className={input()} />}
                </Field>
              </div>
              {ownProduct && (
                <Field id="slug" label="URL name" hint={creating ? "Filled in from the name and finish." : "Changing it changes the product’s address."} error={errors.slug}>
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
              )}
              <Field id="collection" label="Collection" error={errors.collection}>
                {(control) => (
                  <select {...control} name="collection" defaultValue={product?.collection ?? demoAdminCollections[0]?.id} className={input("pr-8")}>
                    {demoAdminCollections.map((collection) => (
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
                {(control) => <textarea {...control} name="description" defaultValue={product?.description} maxLength={2000} rows={4} className={cn(controlClass, "py-2.5 leading-relaxed")} />}
              </Field>
            </FormSection>

            <FormSection title="Photos" description="The switched-off and switched-on cut-outs, always used as a pair. They stay in this browser.">
              <div role="radiogroup" aria-label="Photo pair" className="inline-flex self-start rounded-full border border-foreground/15 p-0.5">
                {(
                  [
                    ...(product ? ([["current", "Current pair"]] as const) : []),
                    ["sample", "Sample pair"],
                    ["upload", "Upload your own"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={source === value}
                    onClick={() => {
                      setSource(value);
                      if (result.status !== "idle") setResult({ status: "idle" });
                    }}
                    className={cn(
                      "h-8 rounded-full px-3.5 text-[12.5px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none",
                      source === value ? "bg-foreground text-background" : "text-foreground/70 hover:text-foreground",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {source === "sample" && (
                <div>
                  <div role="radiogroup" aria-label="Sample photo pairs" className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                    {SAMPLE_PAIRS.map((item) => {
                      const active = item.id === sample?.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          aria-label={item.label}
                          onClick={() => setSampleId(item.id)}
                          className={cn(
                            "group relative aspect-[3/4] overflow-hidden rounded-lg border bg-secondary outline-none transition-[border-color,box-shadow] focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none",
                            active ? "border-foreground shadow-[0_0_0_1px_var(--foreground)]" : "border-border hover:border-foreground/40",
                          )}
                        >
                          <LampImage product={item} lit={active ? true : "hover"} fit="cover" className="inset-0" />
                          {active && (
                            <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-foreground text-background">
                              <Check className="size-2.5" aria-hidden="true" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-[12.5px] text-muted-foreground">Borrow one of the studio’s photographed pairs: {sample?.label}.</p>
                </div>
              )}
              {source === "upload" && <PhotoPairField current={product?.images} error={errors.photos} onPairChange={setPair} />}
              {source !== "upload" && errors.photos && <p className="text-[12.5px] text-destructive">{errors.photos}</p>}

              <Field id="alt" label="Photo description" hint="Describes the lamp for screen readers." error={errors.alt}>
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
                  {(control) => <input {...control} name="stock" type="number" min={0} step={1} inputMode="numeric" defaultValue={product?.stock ?? 10} className={input("tabular-nums")} />}
                </Field>
              </div>
              <label className="group flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-card px-4 py-3.5">
                <input type="checkbox" name="published" defaultChecked={product?.published ?? true} className="sr-only" />
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
              {ownProduct && (
                <Field id="diameterCm" label="Shade diameter (cm)" error={errors.diameterCm} className="sm:max-w-[12rem]">
                  {(control) => <input {...control} name="diameterCm" inputMode="decimal" defaultValue={product?.diameterCm ?? ""} className={input("tabular-nums")} />}
                </Field>
              )}
              <Field id="highlights" label="Highlights" hint="One per line, up to six. Shown as chips." error={errors.highlights}>
                {(control) => (
                  <textarea {...control} name="highlights" defaultValue={product?.highlights.join("\n")} rows={3} className={cn(controlClass, "py-2.5 font-mono text-[13.5px] leading-relaxed")} />
                )}
              </Field>
              {ownProduct && (
                <Field id="specsText" label="Specifications" hint="One per line as Label: value, e.g. Material: Spun brass. Up to twelve." error={errors.specs}>
                  {(control) => (
                    <textarea
                      {...control}
                      name="specsText"
                      defaultValue={product?.specs.map((spec) => `${spec.label}: ${spec.value}`).join("\n")}
                      rows={4}
                      className={cn(controlClass, "py-2.5 font-mono text-[13.5px] leading-relaxed")}
                    />
                  )}
                </Field>
              )}
            </FormSection>
          </div>

          <div className="lg:sticky lg:top-6 lg:self-start">
            <ProductPreview images={previewImages} draft={draft} unsavedPhotos={source !== "current" && (source === "sample" || Boolean(pair))} />
          </div>
        </div>

        <div className="sticky bottom-0 z-20 -mx-[clamp(1.25rem,4vw,3rem)] mt-12 border-t border-border bg-background/92 px-[clamp(1.25rem,4vw,3rem)] py-4 backdrop-blur-md">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <p
              role="status"
              aria-live="polite"
              className={cn(
                "mr-auto inline-flex items-center gap-2 text-sm",
                result.status === "error" && "text-destructive",
                result.status === "success" && "text-[oklch(0.45_0.09_150)]",
              )}
            >
              {result.status === "success" && (
                <span className="grid size-5 place-items-center rounded-full bg-[oklch(0.62_0.09_150)] text-white">
                  <Check className="size-3" aria-hidden="true" />
                </span>
              )}
              {busy ? "Saving…" : result.status === "idle" ? (creating ? "Saved in this browser only." : "Changes appear in the demo store as soon as you save.") : result.message}
            </p>
            {product?.published && (
              <ProductLink
                product={product}
                target="_blank"
                className="inline-flex items-center gap-1 text-[13px] font-medium underline decoration-foreground/25 underline-offset-4 outline-none hover:decoration-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                View in store <ArrowUpRight className="size-3.5" aria-hidden="true" />
              </ProductLink>
            )}
            {product && isLocalProductId(product.id) && (
              <Button type="button" variant="ghost" onClick={remove} className="text-destructive hover:bg-destructive/10">
                <Trash2 aria-hidden="true" /> Delete
              </Button>
            )}
            <Button asChild variant="outline">
              <Link href="/demo/admin/products">{creating ? "Cancel" : "Back to products"}</Link>
            </Button>
            <Button type="submit" disabled={busy} className="min-w-36">
              {busy ? "Saving…" : creating ? "Create product" : "Save changes"}
            </Button>
          </div>
        </div>
      </form>
    </>
  );
}

/* "Material: Spun brass" per line → specifications. Lines without a colon are reported rather than guessed at. */
function parseSpecs(text: string): { rows: ProductSpec[]; error?: string } {
  const rows: ProductSpec[] = [];
  for (const line of text.split("\n").map((value) => value.trim()).filter(Boolean)) {
    const at = line.indexOf(":");
    if (at <= 0) return { rows, error: `Write each specification as Label: value (“${line.slice(0, 30)}” has no colon).` };
    rows.push({ label: line.slice(0, at).trim(), value: line.slice(at + 1).trim() });
  }
  return { rows };
}
