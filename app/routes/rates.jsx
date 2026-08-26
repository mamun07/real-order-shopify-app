import { authenticate } from "../shopify.server";
import { getLiveShippingOptions } from "../models/shipping.server";

function corsHeaders() {
  return { "Access-Control-Allow-Origin": "*" };
}

export const action = async ({ request }) => {
  const { session, storefront } = await authenticate.public.appProxy(request);

  if (!session) {
    return Response.json({ error: "Shop not found" }, { status: 404 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid request body" },
      { status: 400, headers: corsHeaders() },
    );
  }

  const {
    variantId,
    quantity = 1,
    address1,
    city,
    province,
    countryCode = "BD",
    presentmentCountry,
  } = body || {};

  if (!variantId || !address1 || !city) {
    return Response.json(
      { error: "variantId, address1 and city are required" },
      { status: 400, headers: corsHeaders() },
    );
  }

  const variantGid = variantId.startsWith("gid://")
    ? variantId
    : `gid://shopify/ProductVariant/${variantId}`;

  try {
    const live = await getLiveShippingOptions({
      storefront,
      variantGid,
      quantity: Number(quantity),
      address: { address1, city, provinceCode: province },
      countryCode,
      presentmentCountry: presentmentCountry || countryCode,
    });

    return Response.json(
      { subtotal: live.subtotal, options: live.options },
      { headers: corsHeaders() },
    );
  } catch (error) {
    console.error("[real-order] Live shipping rate lookup failed", error);
    return Response.json(
      { options: [] },
      { headers: corsHeaders() },
    );
  }
};

export const loader = async () => {
  return Response.json({ error: "Method not allowed" }, { status: 405 });
};
