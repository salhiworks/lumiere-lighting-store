import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isPublishedSlug, MISSING_PRODUCT_PATH } from "@/lib/catalog/published-slugs";
import { orderTokenExists } from "@/lib/checkout/status-link";
import { demoProductIds } from "@/lib/demo-admin/catalog";
import { isLocalProductId, LOCAL_SLUGS_COOKIE, parseLocalSlugs } from "@/lib/demo-admin/ids";
import { demoOrders } from "@/lib/demo-admin/orders";
import { PUBLIC_DEMO } from "@/lib/public-demo";
import { getSupabaseConfig, SESSION_COOKIE_OPTIONS, type SupabaseConfig } from "@/lib/supabase/config";
import type { Database } from "@/lib/supabase/database.types";

/*
 * Runs before three kinds of request, and nothing else (in the public demo build, everything but /shop/<slug> and the /demo/admin
 * dashboard is a 404; in every other build /demo/... is a 404, so the demo dashboard doesn't exist outside the public demo):
 *   /shop/<slug>  checks the product exists and is published. If not, it serves the store's not-found page with a real HTTP 404,
 *                 for visitors and search engines alike (a product page that has started streaming could only send a 200).
 *   /admin/...    refreshes the Supabase session cookies, and sends anyone who isn't a signed-in administrator (signed out, not an
 *                 admin, or a session that has since been signed out) to the sign-in page with a real redirect, before any page
 *                 renders. Every admin page and Server Action still verifies administrator rights itself (lib/admin/auth.ts), and
 *                 Row Level Security guards the data.
 *   /checkout/... order status links: an unknown or malformed order key is a real 404.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // The public demo has no admin and takes no orders: those addresses don't exist there.
  if (pathname === "/demo" || pathname.startsWith("/demo/")) return PUBLIC_DEMO && isDemoDashboard(pathname) ? NextResponse.next() : missing(request);
  if (PUBLIC_DEMO && !pathname.startsWith("/shop/")) return missing(request);
  if (pathname.startsWith("/shop/")) return productProxy(request, pathname.slice("/shop/".length));
  if (pathname.startsWith("/checkout/")) return checkoutProxy(request);
  return adminProxy(request, pathname);
}

/*
 * The Demo Admin Dashboard: /demo/admin and the pages under it, which hold only built-in sample data and the visitor's own browser
 * edits. Products the visitor created exist only in their browser, so their edit pages are allowed by ID format (local-…); the page
 * itself says when this browser has no such product.
 */
function isDemoDashboard(pathname: string) {
  const [, , , section, id, extra] = pathname.split("/");
  if (pathname === "/demo/admin" || pathname === "/demo/admin/") return true;
  if (extra !== undefined) return false;
  if (section === "orders") return id === undefined || id === "" || demoOrders.some((order) => order.id === id);
  if (section === "products") return id === undefined || id === "" || id === "new" || demoProductIds.includes(id) || isLocalProductId(id);
  return false;
}

/* Internal only: proxy.ts rewrites to it; a direct request is a 404 (it isn't a dashboard page). */
const LOCAL_PRODUCT_PATH = "/demo/local-product";

/* The store's not-found page with a real 404 status, decided before anything renders. */
function missing(request: NextRequest) {
  return NextResponse.rewrite(new URL(MISSING_PRODUCT_PATH, request.url));
}

/* Order status pages: a link with an unknown or malformed order key is a real 404, not a page that streams a "not found". */
async function checkoutProxy(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("order") ?? "";
  const exists = await orderTokenExists(token).catch(() => null);
  if (exists === false) return missing(request);
  const response = NextResponse.next();
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

async function productProxy(request: NextRequest, slug: string) {
  if ((await isPublishedSlug(slug)) !== false) return NextResponse.next();
  if (PUBLIC_DEMO && parseLocalSlugs(request.cookies.get(LOCAL_SLUGS_COOKIE)?.value).includes(slug)) return localDemoProduct(request);
  return missing(request);
}

/*
 * Public demo only: a product the visitor created in the Demo Admin, which lives in their browser. Its slug is in the cookie that
 * browser keeps (lib/demo-admin/ids.ts), so its address gets a real page with HTTP 200: the demo's local-product page, which draws
 * the product from localStorage. Every other unknown slug is still a 404. Private and never indexed.
 */
function localDemoProduct(request: NextRequest) {
  const response = NextResponse.rewrite(new URL(LOCAL_PRODUCT_PATH, request.url));
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("X-Robots-Tag", "noindex");
  return response;
}

async function adminProxy(request: NextRequest, pathname: string) {
  let config: SupabaseConfig | null = null;
  try {
    config = getSupabaseConfig();
  } catch {
    // Half-configured: let the admin page explain the problem instead of failing here.
  }
  if (!config) return noStore(NextResponse.next({ request }));

  let response = NextResponse.next({ request });
  const supabase = createServerClient<Database>(config.url, config.key, {
    cookieOptions: SESSION_COOKIE_OPTIONS,
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        for (const [key, value] of Object.entries(headers)) response.headers.set(key, value);
      },
    },
  });

  // Verifies the session and refreshes an expired access token, writing the new cookies through setAll above.
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);
  // The sign-in page explains a refusal itself, and Server Actions answer for themselves (a redirect mid-action would break it).
  const checked = pathname !== "/admin/login" && !request.headers.has("next-action");
  const allowed = signedIn && (!checked || (await supabase.rpc("is_admin")).data === true);

  if (checked && !allowed) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = pathname === "/admin" ? "" : `?next=${encodeURIComponent(pathname)}`;
    const redirect = NextResponse.redirect(url);
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    return noStore(redirect);
  }
  return noStore(response);
}

/* Admin responses carry session cookies and private data: never let a CDN or proxy cache them. */
function noStore(response: NextResponse) {
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  matcher: ["/shop/:slug", "/admin", "/admin/:path*", "/checkout/:path*", "/demo", "/demo/:path*"],
};
