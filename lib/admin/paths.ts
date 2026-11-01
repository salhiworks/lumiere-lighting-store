/** Where to go after signing in: only admin paths on this site, so the sign-in page can't bounce people elsewhere. */
export function safeAdminPath(value: unknown): string {
  const path = typeof value === "string" ? value : "";
  return /^\/admin(\/[\w-]+)*\/?$/.test(path) && !path.startsWith("/admin/login") ? path : "/admin";
}
