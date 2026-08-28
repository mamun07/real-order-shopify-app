import { authenticate } from "../shopify.server";
import { getSettings, toPublicSettings } from "../models/settings.server";

function corsHeaders() {
  return { "Access-Control-Allow-Origin": "*" };
}

/**
 * Storefront-facing app settings for the Cash on Delivery popup — text,
 * colours, size, and the OTP / partial-payment toggles. Configured from the
 * app's Settings page (/app/settings). SMS gateway credentials are stripped
 * by toPublicSettings and never sent here.
 */
export const loader = async ({ request }) => {
  const { session } = await authenticate.public.appProxy(request);

  if (!session) {
    return Response.json(
      { error: "Shop not found" },
      { status: 404, headers: corsHeaders() },
    );
  }

  try {
    const settings = await getSettings(session.shop);
    return Response.json(
      { settings: toPublicSettings(settings) },
      { headers: corsHeaders() },
    );
  } catch (error) {
    console.error("[real-order] Failed to load storefront settings", error);
    return Response.json(
      { settings: null, debug: String(error?.message || error) },
      { headers: corsHeaders() },
    );
  }
};
