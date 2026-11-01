/** "Enamel dome" + "Forest" → "enamel-dome-forest". Accents are dropped, anything else becomes a single hyphen. */
export function slugify(...parts: string[]) {
  return parts
    .join(" ")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}
