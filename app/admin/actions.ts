"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin, type AdminSession } from "@/lib/admin/auth";
import { inspectImage, validatePhotoPair, type ImageInfo } from "@/lib/admin/image-inspect";
import { safeAdminPath } from "@/lib/admin/paths";
import { fieldErrors, productInputSchema, readProductForm, type ProductField, type ProductInput } from "@/lib/admin/product-input";
import { CATALOG_TAG } from "@/lib/catalog";
import { forgetPublishedSlugs } from "@/lib/catalog/published-slugs";
import { isSupabaseConfigured, requireSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/*
 * Every action here re-checks that the caller is a signed-in administrator (requireAdmin) and validates its input on the server.
 * Writes and uploads run with the administrator's own session, so Row Level Security and the storage policies have the final say.
 */

const BUCKET = "lamp-photos";
/** Uploaded photos are served from this site under this prefix; next.config.ts proxies it to the lamp-photos bucket. */
const UPLOAD_PREFIX = "/lamps/uploads/";
const ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
/** How much of a stored photo is read to check it: format, size and transparency all sit in the first bytes. */
const HEADER_BYTES = 256 * 1024;
/** Unsaved uploads (an abandoned tab, a failed connection) are swept from a product's folder once they are this old. */
const ORPHAN_AGE_MS = 60 * 60 * 1000;

/* After any catalog change: refresh the cached catalog, and the proxy's list of published URLs, for the very next request. */
function catalogChanged() {
  updateTag(CATALOG_TAG);
  forgetPublishedSlugs();
}

// -------------------------------------------------------------------------------------------------------------------------------
// Sign in and out
// -------------------------------------------------------------------------------------------------------------------------------

export type SignInState = { error?: string; email?: string };

const signInSchema = z.object({
  email: z.email("Enter a valid email address.").max(320),
  password: z.string().min(1, "Enter your password.").max(200),
});

export async function signIn(_previous: SignInState, form: FormData): Promise<SignInState> {
  if (!isSupabaseConfigured()) redirect("/admin");
  const email = String(form.get("email") ?? "").trim();
  const parsed = signInSchema.safeParse({ email, password: String(form.get("password") ?? "") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your email and password.", email };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: signInMessage(error), email };

  const { data: isAdmin, error: adminError } = await supabase.rpc("is_admin");
  if (adminError || !isAdmin) {
    await supabase.auth.signOut();
    return {
      error: adminError
        ? "You signed in, but administrator access couldn't be checked. Try again in a moment."
        : "This account isn't an administrator. Ask the store owner to add it (docs/ADMIN.md, “Create your administrator”).",
      email,
    };
  }
  redirect(safeAdminPath(form.get("next")));
}

function signInMessage(error: { message: string; status?: number; code?: string }) {
  if (error.code === "invalid_credentials" || /invalid login credentials/i.test(error.message)) return "Email or password is incorrect.";
  if (error.code === "email_not_confirmed") return "This email address isn't confirmed yet. Confirm the user in Supabase (Authentication → Users), then try again.";
  if (error.status === 429 || /rate limit/i.test(error.message)) return "Too many attempts. Wait a minute, then try again.";
  return `Couldn't sign in: ${error.message}`;
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  redirect("/admin/login");
}

// -------------------------------------------------------------------------------------------------------------------------------
// Products
// -------------------------------------------------------------------------------------------------------------------------------

export type ProductFormState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Partial<Record<ProductField, string>>;
  /** Changes after each successful save, so the form can clear its picked photos. */
  savedAt?: number;
};

type StoredPhoto = { path: string; info: ImageInfo };
type StoredPair = { off: StoredPhoto; on: StoredPhoto };

/* A problem with one field is explained next to it; the status line just points there. */
const failure = (message: string, field?: ProductField): ProductFormState => ({
  status: "error",
  message: field === "photos" ? "Check the photos." : field ? "Check the highlighted field." : message,
  fieldErrors: field ? { [field]: message } : undefined,
});

function parseProduct(form: FormData): { input: ProductInput } | { state: ProductFormState } {
  const parsed = productInputSchema.safeParse(readProductForm(form));
  if (parsed.success) return { input: parsed.data };
  return { state: { status: "error", message: "Check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) } };
}

// -------------------------------------------------------------------------------------------------------------------------------
// Photo uploads
// -------------------------------------------------------------------------------------------------------------------------------

/*
 * Photos go straight from the browser to Supabase Storage, so they never pass through this server or its host's upload limits:
 *   1. preparePhotoUpload checks the administrator, the form and what the browser reports about the two files, then signs two
 *      single-use upload URLs for new, unique paths. Storage itself enforces the bucket's 4 MB limit and PNG/WebP types.
 *   2. The browser uploads the files to those URLs (components/admin/product-form.tsx).
 *   3. saveProduct reads the first bytes of the stored files and checks their real format, canvas and transparency before the
 *      product points at them. Anything that fails is deleted again.
 */

export type PhotoUploadTicket = { productId: string; off: { path: string; url: string }; on: { path: string; url: string } };

const reportedPhoto = z.object({
  type: z.string(),
  size: z.number().int().nonnegative(),
  width: z.number().int().nonnegative(),
  height: z.number().int().nonnegative(),
});
const reportedPair = z.object({ off: reportedPhoto, on: reportedPhoto });

export async function preparePhotoUpload(form: FormData): Promise<{ ticket: PhotoUploadTicket } | { state: ProductFormState }> {
  const session = await requireAdmin();
  const existingId = String(form.get("productId") ?? "");
  if (existingId && !ID_PATTERN.test(existingId)) return { state: failure("This product can't be found.") };

  // Field errors are reported before anything is uploaded.
  const parsed = parseProduct(form);
  if ("state" in parsed) return parsed;

  let reported: z.output<typeof reportedPair>;
  try {
    reported = reportedPair.parse(JSON.parse(String(form.get("photoMeta") ?? "")));
  } catch {
    return { state: failure("The photos couldn't be read. Pick them again.", "photos") };
  }
  const claim = (photo: z.output<typeof reportedPhoto>): ImageInfo | null =>
    photo.type === "image/png" || photo.type === "image/webp"
      ? { mime: photo.type, extension: photo.type === "image/png" ? "png" : "webp", width: photo.width, height: photo.height, hasAlpha: true }
      : null;
  const off = claim(reported.off);
  const on = claim(reported.on);
  const problems = validatePhotoPair(off, on, { off: reported.off.size, on: reported.on.size });
  if (problems.length || !off || !on) return { state: failure(problems.join(" "), "photos") };

  // A taken URL name would fail the save anyway (the database keeps slugs unique); say so before anything is uploaded.
  const { data: taken } = await session.supabase.from("products").select("id").eq("slug", parsed.input.slug).neq("id", existingId).limit(1);
  if (taken?.length) return { state: failure("Another product already uses this URL name. Choose a different one.", "slug") };

  let id = existingId;
  if (existingId) {
    const { data, error } = await session.supabase.from("products").select("id").eq("id", existingId).maybeSingle();
    if (error || !data) return { state: failure("This product no longer exists.") };
  } else {
    id = await availableId(session, parsed.input.slug);
  }

  // A new name for every upload: browsers cache photos for a year, so a replaced photo must never reuse a URL.
  const stamp = `${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}`;
  const paths = { off: `products/${id}/off-${stamp}.${off.extension}`, on: `products/${id}/on-${stamp}.${on.extension}` };
  const bucket = session.supabase.storage.from(BUCKET);
  const [signedOff, signedOn] = await Promise.all([bucket.createSignedUploadUrl(paths.off), bucket.createSignedUploadUrl(paths.on)]);
  const error = signedOff.error ?? signedOn.error;
  if (error || !signedOff.data || !signedOn.data) return { state: failure(`The upload couldn't be prepared: ${error?.message ?? "no URL"}`, "photos") };
  return { ticket: { productId: id, off: { path: paths.off, url: signedOff.data.signedUrl }, on: { path: paths.on, url: signedOn.data.signedUrl } } };
}

/* Reads the uploaded pair named in the form and checks the files themselves, whatever the browser said about them. */
async function readStoredPair(id: string, form: FormData): Promise<{ pair: StoredPair | null } | { problem: string; paths: string[] }> {
  const offPath = String(form.get("photoOff") ?? "");
  const onPath = String(form.get("photoOn") ?? "");
  if (!offPath && !onPath) return { pair: null };
  const ours = (path: string, state: "off" | "on") => ID_PATTERN.test(id) && new RegExp(`^products/${id}/${state}-[a-z0-9]+-[0-9a-f]{8}\\.(png|webp)$`).test(path);
  if (!ours(offPath, "off") || !ours(onPath, "on")) return { problem: "The uploaded photos don't belong to this product. Pick them again.", paths: [] };

  const [offHead, onHead] = await Promise.all([readHeader(offPath), readHeader(onPath)]);
  const paths = [offPath, onPath];
  if (!offHead || !onHead) return { problem: "The uploaded photos couldn't be found. Pick them again.", paths };
  const off = inspectImage(offHead.bytes);
  const on = inspectImage(onHead.bytes);
  const problems = validatePhotoPair(off, on, { off: offHead.size, on: onHead.size });
  if (off && !offPath.endsWith(`.${off.extension}`)) problems.push("The switched-off photo's contents don't match its file type.");
  if (on && !onPath.endsWith(`.${on.extension}`)) problems.push("The switched-on photo's contents don't match its file type.");
  if (problems.length || !off || !on) return { problem: problems.join(" "), paths };
  return { pair: { off: { path: offPath, info: off }, on: { path: onPath, info: on } } };
}

/* The first bytes of a stored photo and its full size. The bucket is public, so this is the same URL the store serves. */
async function readHeader(path: string): Promise<{ bytes: Uint8Array; size: number } | null> {
  const { url } = requireSupabaseConfig();
  try {
    const response = await fetch(`${url}/storage/v1/object/public/${BUCKET}/${path}`, { headers: { Range: `bytes=0-${HEADER_BYTES - 1}` }, cache: "no-store" });
    if (response.status !== 200 && response.status !== 206) return null;
    const bytes = new Uint8Array(await response.arrayBuffer());
    const total = Number(response.headers.get("content-range")?.split("/")[1]);
    return { bytes, size: Number.isFinite(total) && total > 0 ? total : bytes.length };
  } catch {
    return null;
  }
}

/* Deletes uploads that no product points at (a refused or failed save must not leave files behind, nor delete live ones). */
async function discardUploads({ supabase }: AdminSession, paths: string[]) {
  if (!paths.length) return;
  // Paths are validated against a strict pattern before they get here, so quoting them is enough for PostgREST's list syntax.
  const served = paths.map((path) => `"${UPLOAD_PREFIX + path}"`).join(",");
  const { data } = await supabase.from("products").select("id").or(`image_off.in.(${served}),image_on.in.(${served})`).limit(1);
  if (data?.length) return;
  const { error } = await supabase.storage.from(BUCKET).remove(paths);
  if (error) console.warn(`LUMIÈRE admin: could not remove unused photos ${paths.join(", ")}: ${error.message}`);
}

/* After a product's photos change: delete the pair it replaced, and uploads in its folder that were never saved. */
async function sweepUploads({ supabase }: AdminSession, id: string, keep: string[], replaced: string[]) {
  const bucket = supabase.storage.from(BUCKET);
  const { data } = await bucket.list(`products/${id}`, { limit: 100 });
  const cutoff = Date.now() - ORPHAN_AGE_MS;
  const orphans = (data ?? [])
    .filter((file) => file.id && file.created_at && Date.parse(file.created_at) < cutoff)
    .map((file) => `products/${id}/${file.name}`);
  const stale = [...new Set([...replaced, ...orphans])].filter((path) => !keep.includes(path));
  if (!stale.length) return;
  const { error } = await bucket.remove(stale);
  if (error) console.warn(`LUMIÈRE admin: could not remove replaced photos ${stale.join(", ")}: ${error.message}`);
}

// -------------------------------------------------------------------------------------------------------------------------------
// Saving
// -------------------------------------------------------------------------------------------------------------------------------

export async function saveProduct(_previous: ProductFormState, form: FormData): Promise<ProductFormState> {
  const session = await requireAdmin();
  const { supabase } = session;

  const existingId = String(form.get("productId") ?? "");
  const creating = existingId === "";
  if (!creating && !ID_PATTERN.test(existingId)) return failure("This product can't be found.");
  // A new product's ID is chosen when its photos are prepared (preparePhotoUpload), and it can't be created without them.
  const id = creating ? String(form.get("newProductId") ?? "") : existingId;

  const photos = await readStoredPair(id, form);
  if ("problem" in photos) {
    await discardUploads(session, photos.paths);
    return failure(photos.problem, "photos");
  }
  const uploaded = photos.pair ? [photos.pair.off.path, photos.pair.on.path] : [];
  const refuse = async (state: ProductFormState) => {
    await discardUploads(session, uploaded);
    return state;
  };

  const parsed = parseProduct(form);
  if ("state" in parsed) return refuse(parsed.state);
  const input = parsed.input;
  if (creating && !photos.pair) return failure("Add both photos of the pair: switched off and switched on.", "photos");

  let previousPhotos: { image_off: string; image_on: string } | null = null;
  if (!creating) {
    const { data, error } = await supabase.from("products").select("image_off, image_on").eq("id", existingId).maybeSingle();
    if (error) return refuse(failure(`The product couldn't be loaded: ${error.message}`));
    if (!data) return refuse(failure("This product no longer exists."));
    previousPhotos = data;
  }

  const fields = {
    slug: input.slug,
    name: input.name,
    finish: input.finish,
    collection_id: input.collection,
    price_cents: input.price,
    stock: input.stock,
    diameter_cm: input.diameterCm,
    summary: input.summary,
    description: input.description,
    highlights: input.highlights,
    specs: input.specs,
    image_alt: input.alt,
    cord_drop: input.drop,
    is_published: input.published,
  };
  const photoFields = photos.pair
    ? {
        image_off: UPLOAD_PREFIX + photos.pair.off.path,
        image_on: UPLOAD_PREFIX + photos.pair.on.path,
        image_width: photos.pair.off.info.width,
        image_height: photos.pair.off.info.height,
      }
    : null;

  const { data: saved, error: writeError } =
    creating && photoFields
      ? await supabase
          .from("products")
          .insert({ id, ...fields, ...photoFields, sort_order: await nextSortOrder(session) })
          .select("id")
          .maybeSingle()
      : await supabase
          .from("products")
          .update({ ...fields, ...photoFields })
          .eq("id", id)
          .select("id")
          .maybeSingle();

  if (writeError || !saved) {
    return refuse(writeError ? writeFailure(writeError) : failure("The product couldn't be saved. It may have been removed, or your access changed."));
  }

  // The pair it replaced is no longer referenced. The original demo pairs (/lamps/<id>-…) are never touched.
  if (photoFields) {
    const replaced = previousPhotos
      ? [previousPhotos.image_off, previousPhotos.image_on].filter((path) => path.startsWith(UPLOAD_PREFIX)).map((path) => path.slice(UPLOAD_PREFIX.length))
      : [];
    await sweepUploads(session, id, uploaded, replaced);
  }

  catalogChanged();
  if (creating) redirect(`/admin/products/${id}?created=1`);
  refresh();
  return { status: "success", message: "Saved. The store shows the changes now.", savedAt: Date.now() };
}

/* New products take their URL name as ID (readable in carts and orders), with a short suffix if that ID was ever used. */
async function availableId({ supabase }: AdminSession, slug: string) {
  const base = slug.slice(0, 55).replace(/-+$/, "");
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = attempt === 0 ? base : `${base}-${crypto.randomUUID().slice(0, 6)}`;
    const { data } = await supabase.from("products").select("id").eq("id", candidate).maybeSingle();
    if (!data) return candidate;
  }
  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

async function nextSortOrder({ supabase }: AdminSession) {
  const { data } = await supabase.from("products").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
  return (data?.sort_order ?? 0) + 1;
}

function writeFailure(error: { code?: string; message: string }): ProductFormState {
  if (error.code === "23505" && /products_pkey/.test(error.message)) return failure("Another product was just created with the same ID. Save again.");
  if (error.code === "23505") return failure("Another product already uses this URL name. Choose a different one.", "slug");
  if (error.code === "23503") return failure("Choose one of the existing collections.", "collection");
  if (error.code === "23514") return failure("One of the values is outside what the store accepts. Check prices, stock and lengths.");
  if (error.code === "42501" || /row-level security/i.test(error.message)) return failure("Your account isn't allowed to change products.");
  return failure(`The product couldn't be saved: ${error.message}`);
}

// -------------------------------------------------------------------------------------------------------------------------------
// Visibility
// -------------------------------------------------------------------------------------------------------------------------------

export type VisibilityState = { error?: string };

export async function setProductVisibility(_previous: VisibilityState, form: FormData): Promise<VisibilityState> {
  const { supabase } = await requireAdmin();
  const id = String(form.get("productId") ?? "");
  const published = form.get("published") === "true";
  if (!ID_PATTERN.test(id)) return { error: "Unknown product." };
  const { data, error } = await supabase.from("products").update({ is_published: published }).eq("id", id).select("id").maybeSingle();
  if (error || !data) return { error: "The change wasn't saved. Try again." };
  catalogChanged();
  refresh();
  return {};
}
