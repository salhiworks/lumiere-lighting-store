export const site = {
  name: "LUMIÈRE",
  description:
    "Eight contemporary pendant lamps in enamel, brass, copper, concrete, glass, rattan and washi paper. Switch them on right on the page.",
  /** Absolute base for canonical URLs, Open Graph and the sitemap. Set NEXT_PUBLIC_SITE_URL in production. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  nav: [
    { href: "/shop", label: "Shop" },
    { href: "/collections", label: "Collections" },
    { href: "/#studio", label: "Studio" },
  ],
} as const;
