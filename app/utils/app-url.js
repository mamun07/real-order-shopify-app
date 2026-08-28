/**
 * The app's public HTTPS origin (no trailing slash).
 *
 * Priority:
 *   1. SHOPIFY_APP_URL           — set this in Vercel to your stable prod
 *      domain so it matches shopify.app.toml exactly.
 *   2. VERCEL_PROJECT_PRODUCTION_URL — Vercel injects this automatically;
 *      used as a fallback so preview builds still work.
 *   3. localhost                 — local `shopify app dev`.
 */
export function getAppUrl() {
  const explicit = process.env.SHOPIFY_APP_URL;
  if (explicit) return explicit.replace(/\/+$/, "");

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;

  return "http://localhost:3000";
}
