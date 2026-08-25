import { authenticate } from "../shopify.server";
import { getShippingProfiles } from "../models/shippingZones.server";

const CACHE_TTL_MS = 60_000;
const cache = new Map();

function getCacheKey(shop, after) {
  return `${shop}::${after || ""}`;
}

/**
 * GET /api/shipping-zones[?after=<cursor>]
 *
 * Returns the merchant's real shipping profiles → zones → countries/regions
 * → rates, straight from the Admin GraphQL API. Never invents rates.
 * Cached briefly per shop/page to avoid hammering the Admin API on repeated
 * dashboard loads.
 */
export const loader = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);

  const url = new URL(request.url);
  const after = url.searchParams.get("after") || null;
  const cacheKey = getCacheKey(session.shop, after);
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.storedAt < CACHE_TTL_MS) {
    return Response.json(cached.body);
  }

  try {
    const { profiles, pageInfo } = await getShippingProfiles(admin, {
      first: 10,
      after,
    });

    const body = {
      profiles,
      pageInfo,
      warnings: profiles.length === 0
        ? ["No shipping profiles found for this store."]
        : profiles
            .flatMap((p) => p.zones)
            .filter((z) => z.rates.length === 0)
            .map((z) => `Zone "${z.name}" has no active shipping rates configured.`),
    };

    cache.set(cacheKey, { body, storedAt: Date.now() });

    return Response.json(body);
  } catch (error) {
    console.error("[real-order] Failed to load shipping profiles", error);
    return Response.json(
      {
        profiles: [],
        pageInfo: { hasNextPage: false, endCursor: null },
        error: "Could not load shipping zones from Shopify. Please try again.",
      },
      { status: 502 },
    );
  }
};
