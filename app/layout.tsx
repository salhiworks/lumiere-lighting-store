import type { Metadata, Viewport } from "next";
import { Albert_Sans, DM_Mono, Newsreader } from "next/font/google";
import { site } from "@/lib/site";
import "./globals.css";

/* Display serif for names and headlines, a Scandinavian-leaning grotesk for the interface, a mono for spec-sheet data. */
const newsreader = Newsreader({ subsets: ["latin"], variable: "--font-newsreader", axes: ["opsz"], display: "swap" });
const albertSans = Albert_Sans({ subsets: ["latin"], variable: "--font-albert-sans", display: "swap" });
const dmMono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-dm-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: "LUMIÈRE · Contemporary pendant lighting", template: "%s · LUMIÈRE" },
  description: site.description,
  applicationName: site.name,
  openGraph: { type: "website", siteName: site.name, locale: "en_US" },
};

export const viewport: Viewport = {
  themeColor: "#FAF8F4",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${newsreader.variable} ${albertSans.variable} ${dmMono.variable}`}>
      <body className="flex min-h-svh flex-col">
        <a
          href="#main"
          className="sr-only rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50"
        >
          Skip to content
        </a>
        {/* The storefront ((store)/layout.tsx) and the admin (admin/layout.tsx) each bring their own header and <main id="main">. */}
        {children}
      </body>
    </html>
  );
}
