import { authenticate } from "../shopify.server";
import { getShippingCountries } from "../models/shippingZones.server";

function corsHeaders() {
  return { "Access-Control-Allow-Origin": "*" };
}

/**
 * Countries the popup's Country field offers — sourced from the merchant's
 * real shipping zones (Admin API), not just every country enabled in
 * Shopify Markets, so a shopper can't select a country with no shipping
 * coverage at all.
 */
export const loader = async ({ request }) => {
  const { session, admin } = await authenticate.public.appProxy(request);

  if (!session || !admin) {
    return Response.json({ error: "Shop not found" }, { status: 404 });
  }

  try {
    const countries = await getShippingCountries(admin);
    return Response.json({ countries }, { headers: corsHeaders() });
  } catch (error) {
    console.error("[real-order] Failed to load shipping-zone countries", error);
    return Response.json(
      { countries: [], debug: String(error?.message || error) },
      { headers: corsHeaders() },
    );
  }
};
