import { BASIC_PLAN, UNLIMITED_PLAN } from "../shopify.server";

export const PLAN_LIMITS = {
  free: 50,
  basic: 1000,
  unlimited: Infinity,
};

const ACTIVE_SUBSCRIPTIONS_QUERY = `#graphql
  query ActiveSubscriptions {
    currentAppInstallation {
      activeSubscriptions {
        id
        name
        status
      }
    }
  }
`;

function planKeyFromSubscriptionName(name) {
  if (name === UNLIMITED_PLAN) return "unlimited";
  if (name === BASIC_PLAN) return "basic";
  return null;
}

/**
 * Live-checks the shop's active app subscriptions via Admin GraphQL, usable
 * from both the embedded-admin `admin` client and the app-proxy `admin`
 * client (unlike shopify.server's `billing.check`, which only works inside
 * `authenticate.admin`) — the order-creation route runs under the app proxy.
 */
export async function getActivePlan(admin) {
  const response = await admin.graphql(ACTIVE_SUBSCRIPTIONS_QUERY);
  const json = await response.json();
  const subscriptions = json.data?.currentAppInstallation?.activeSubscriptions || [];
  const active = subscriptions.find((s) => s.status === "ACTIVE" && planKeyFromSubscriptionName(s.name));

  if (!active) return { planKey: "free", subscription: null };
  return { planKey: planKeyFromSubscriptionName(active.name), subscription: active };
}
