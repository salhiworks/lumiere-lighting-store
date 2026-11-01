import { z } from "zod";

/*
 * Validates the product form on the server. Every field the admin can send is checked here, whatever the browser did; the database
 * constraints in supabase/migrations repeat the critical ones (price, stock, slug and ID formats) as a last line of defence.
 */

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const text = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .max(max, `${label} is too long (${max} characters at most).`);

/** "180", "180.5" or "180.50" → 18050 cents. Parsed as text so no floating point is involved. */
const price = z
  .string()
  .trim()
  .regex(/^\d{1,6}(\.\d{1,2})?$/, "Enter a price like 180 or 180.50.")
  .transform((value) => {
    const [whole, fraction = ""] = value.split(".");
    return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  })
  .refine((cents) => cents > 0, "The price must be more than zero.");

const wholeNumber = (label: string, min: number, max: number) =>
  z
    .string()
    .trim()
    .regex(/^\d+$/, `${label} must be a whole number.`)
    .transform(Number)
    .refine((value) => value >= min && value <= max, `${label} must be between ${min} and ${max}.`);

const decimal = (label: string, min: number, max: number, places: number) =>
  z
    .string()
    .trim()
    .regex(new RegExp(`^\\d+(\\.\\d{1,${places}})?$`), `${label} must be a number.`)
    .transform(Number)
    .refine((value) => value >= min && value <= max, `${label} must be between ${min} and ${max}.`);

export const productInputSchema = z.object({
  name: text("Name", 60),
  finish: text("Finish", 40),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "The URL name is required.")
    .max(80, "The URL name is too long.")
    .regex(SLUG, "Use lowercase letters, numbers and single hyphens, e.g. brass-cone-brushed."),
  collection: z.string().trim().regex(SLUG, "Choose a collection."),
  summary: text("Summary", 200),
  description: text("Description", 2000),
  price,
  stock: wholeNumber("Stock", 0, 100000),
  diameterCm: decimal("Shade diameter", 1, 500, 1),
  highlights: z
    .array(z.string().trim().min(1).max(40, "Each highlight must be 40 characters or fewer."))
    .max(6, "Keep it to six highlights."),
  specs: z
    .array(z.object({ label: text("A specification label", 30), value: text("A specification value", 120) }))
    .max(12, "Keep it to twelve specifications."),
  alt: text("Photo description", 200),
  drop: decimal("Cord length", 0.3, 1.2, 2),
  published: z.boolean(),
});

export type ProductInput = z.output<typeof productInputSchema>;
export type ProductField = keyof ProductInput | "photos";

/** Reads the product form's fields into the shape the schema expects. */
export function readProductForm(form: FormData) {
  const field = (name: string) => {
    const value = form.get(name);
    return typeof value === "string" ? value : "";
  };
  const labels = form.getAll("specLabel").map(String);
  const values = form.getAll("specValue").map(String);
  return {
    name: field("name"),
    finish: field("finish"),
    slug: field("slug"),
    collection: field("collection"),
    summary: field("summary"),
    description: field("description"),
    price: field("price"),
    stock: field("stock"),
    diameterCm: field("diameterCm"),
    highlights: field("highlights")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
    // Rows left completely empty are ignored; half-filled rows are reported.
    specs: labels
      .map((label, index) => ({ label: label.trim(), value: (values[index] ?? "").trim() }))
      .filter((spec) => spec.label || spec.value),
    alt: field("alt"),
    drop: field("drop"),
    published: form.get("published") === "on",
  };
}

export function fieldErrors(error: z.ZodError): Partial<Record<ProductField, string>> {
  const errors: Partial<Record<ProductField, string>> = {};
  for (const issue of error.issues) {
    const key = issue.path[0] as ProductField | undefined;
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return errors;
}
