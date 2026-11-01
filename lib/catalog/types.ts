export interface Collection {
  id: string;
  name: string;
  /** One sentence about the light this family gives. */
  description: string;
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface ProductImages {
  /**
   * Switched-off cut-out: transparent canvas, cord starting at the top centre, the same canvas and scale for every lamp.
   * A path served by this site (/lamps/…). See docs/ASSETS.md before replacing one: the off and on photo must share framing.
   */
  off: string;
  /** Switched-on cut-out with exactly the same framing as `off`. */
  on: string;
  /** Describes the lamp itself; the switched-on photo is decorative on top of it. */
  alt: string;
  /** Pixel size shared by both photos of the pair. */
  width: number;
  height: number;
}

export interface Product {
  /** Stable ID shared by the cart, the lamp rail and the database. Never changes once created. */
  id: string;
  /** URL segment: /shop/[slug]. */
  slug: string;
  /** Shape and material, e.g. "Enamel dome". */
  name: string;
  /** Colour or surface, e.g. "Forest". */
  finish: string;
  /** Collection ID. */
  collection: string;
  /** Price in minor units (cents for USD), so totals never pass through floating point. */
  priceCents: number;
  /** ISO 4217 code. */
  currency: string;
  /** Units available. 0 shows the product as sold out. */
  stock: number;
  /** Shade diameter, used for size facts. */
  diameterCm: number;
  /** One line for the rail caption and product cards. */
  summary: string;
  /** Product page copy. */
  description: string;
  /** Short facts, shown as chips on the rail detail and the product page. */
  highlights: string[];
  specs: ProductSpec[];
  images: ProductImages;
  /** Cord length on the rail (0.3–1.2, usually 0.55–1). Longer cords hang lower and swing more slowly. */
  drop: number;
  /** Visible in the storefront. Hidden products only appear in the admin. */
  published: boolean;
}

/** A product as the admin sees it, with ordering and timestamps. */
export interface AdminProduct extends Product {
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/** The slice of a product the cart needs in the browser. */
export type CartProduct = Pick<Product, "id" | "slug" | "name" | "finish" | "priceCents" | "currency" | "stock" | "images">;
