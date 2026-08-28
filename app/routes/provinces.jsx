import { authenticate } from "../shopify.server";
import {
  getProvinces,
  getProvincesByCountry,
} from "../models/provinces.server";

function corsHeaders() {
  return { "Access-Control-Allow-Origin": "*" };
}

const toList = (rows) =>
  rows.map((p) => ({ name: p.name, cities: p.cities.map((c) => c.name) }));

/**
 * The merchant's District → Thana lists for the Cash on Delivery popup's
 * address dropdowns, configured from /app/provinces.
 *
 * Without params: returns every configured country's list, keyed by country
 *   code (`byCountry`) so the popup can switch lists when the shopper changes
 *   country. `provinces` is kept as the Bangladesh list for backwards compat.
 * With `?country=XX`: just that country's list.
 */
export const loader = async ({ request }) => {
  const { session } = await authenticate.public.appProxy(request);

  if (!session) {
    return Response.json({ error: "Shop not found" }, { status: 404 });
  }

  const country = new URL(request.url).searchParams.get("country");

  try {
    if (country) {
      const rows = await getProvinces(session.shop, country);
      return Response.json(
        { country: country.toUpperCase(), provinces: toList(rows) },
        { headers: corsHeaders() },
      );
    }

    const byCountry = await getProvincesByCountry(session.shop);
    const out = {};
    for (const [cc, rows] of Object.entries(byCountry)) out[cc] = toList(rows);

    return Response.json(
      { byCountry: out, provinces: out.BD || [] },
      { headers: corsHeaders() },
    );
  } catch (error) {
    console.error("[real-order] Failed to load provinces", error);
    return Response.json(
      { byCountry: {}, provinces: [] },
      { headers: corsHeaders() },
    );
  }
};
