import { authenticate } from "../shopify.server";
import { getProvinces } from "../models/provinces.server";

function corsHeaders() {
  return { "Access-Control-Allow-Origin": "*" };
}

/**
 * The merchant's Province → City list (Bangladesh-only address dropdowns in
 * the Cash on Delivery popup), configured from the app's admin settings
 * (/app/provinces) instead of hardcoded in the storefront JS.
 */
export const loader = async ({ request }) => {
  const { session } = await authenticate.public.appProxy(request);

  if (!session) {
    return Response.json({ error: "Shop not found" }, { status: 404 });
  }

  try {
    const provinces = await getProvinces(session.shop);
    return Response.json(
      {
        provinces: provinces.map((p) => ({
          name: p.name,
          cities: p.cities.map((c) => c.name),
        })),
      },
      { headers: corsHeaders() },
    );
  } catch (error) {
    console.error("[real-order] Failed to load provinces", error);
    return Response.json({ provinces: [] }, { headers: corsHeaders() });
  }
};
