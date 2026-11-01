import Link from "next/link";
import type { Collection } from "@/lib/catalog/types";
import { PUBLIC_DEMO } from "@/lib/public-demo";
import { Wordmark } from "./wordmark";

const footerLink = "rounded-sm text-sm text-foreground/75 outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none";

/** `demoCatalog` shows a quiet note when the store runs on the built-in catalog because Supabase is not configured. */
export function SiteFooter({ collections, demoCatalog }: { collections: Collection[]; demoCatalog: boolean }) {
  return (
    <footer className="mt-auto border-t border-border bg-secondary/50">
      <div className="shell grid gap-12 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
        <div className="max-w-sm">
          <Link href="/" aria-label="LUMIÈRE, home" className="inline-block rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Wordmark />
          </Link>
          <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
            Contemporary pendant lighting in enamel, brass, copper, concrete, glass, rattan and washi paper.
          </p>
        </div>
        <nav aria-label="Shop">
          <h2 className="eyebrow">Shop</h2>
          <ul className="mt-4 space-y-2.5">
            <li>
              <Link href="/shop" className={footerLink}>
                All pendants
              </Link>
            </li>
            {collections.map((collection) => (
              <li key={collection.id}>
                <Link href={`/shop?collection=${collection.id}`} className={footerLink}>
                  {collection.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Studio">
          <h2 className="eyebrow">Studio</h2>
          <ul className="mt-4 space-y-2.5">
            <li>
              <Link href="/#studio" className={footerLink}>
                About the studio
              </Link>
            </li>
            <li>
              <Link href="/collections" className={footerLink}>
                Collections
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-border">
        <div className="shell flex flex-col gap-2 py-6 text-[13px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © 2026 LUMIÈRE.
            {PUBLIC_DEMO ? (
              <span className="block sm:inline"> A demonstration storefront: browse freely; no orders are taken.</span>
            ) : (
              demoCatalog && <span className="block sm:inline"> Demo catalog: connect Supabase to manage products.</span>
            )}
          </p>
          <p>
            Interactive rail:{" "}
            <a
              href="https://21st.dev/@dhxwhy/components/pendant-lamp-rail"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-sm underline decoration-foreground/25 underline-offset-4 outline-none hover:text-foreground hover:decoration-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              Pendant Lamp Rail by dhxwhy
            </a>{" "}
            (MIT)
          </p>
        </div>
      </div>
    </footer>
  );
}
