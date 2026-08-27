import { redirect } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { useLoaderData } from "react-router";
import { authenticate, BASIC_PLAN, UNLIMITED_PLAN } from "../shopify.server";
import { getActivePlan, PLAN_LIMITS } from "../models/plan.server";
import { countCodOrdersThisMonth } from "../models/codOrder.server";

export const loader = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);
  const { planKey, subscription } = await getActivePlan(admin);
  const ordersThisMonth = await countCodOrdersThisMonth(session.shop);
  const limit = PLAN_LIMITS[planKey];

  return {
    planKey,
    subscriptionId: subscription?.id || null,
    ordersThisMonth,
    limit: Number.isFinite(limit) ? limit : null,
  };
};

export const action = async ({ request }) => {
  const { billing } = await authenticate.admin(request);
  const formData = await request.formData();
  const target = formData.get("plan");
  // eslint-disable-next-line no-undef
  const isTest = process.env.NODE_ENV !== "production";

  if (target === "basic") {
    return billing.request({ plan: BASIC_PLAN, isTest, returnUrl: "/app/plan" });
  }
  if (target === "unlimited") {
    return billing.request({ plan: UNLIMITED_PLAN, isTest, returnUrl: "/app/plan" });
  }
  if (target === "free") {
    const subscriptionId = formData.get("subscriptionId");
    if (subscriptionId) {
      await billing.cancel({ subscriptionId, isTest, prorate: true });
    }
    return redirect("/app/plan");
  }

  return redirect("/app/plan");
};

const PLANS = [
  {
    key: "free",
    name: "Free",
    price: "$0",
    period: "",
    limit: "50 Cash on Delivery orders / month",
    features: ["Real, live Shopify shipping rates", "District & Thana address fields", "No credit card required"],
  },
  {
    key: "basic",
    name: "Basic",
    price: "$5",
    period: "/month",
    limit: "1,000 Cash on Delivery orders / month",
    features: ["Everything in Free", "Higher monthly order limit", "Priority over Free plan orders"],
  },
  {
    key: "unlimited",
    name: "Unlimited",
    price: "$8",
    period: "/month",
    limit: "Unlimited Cash on Delivery orders",
    features: ["Everything in Basic", "No monthly order cap", "Built for high-volume stores"],
  },
];

function planCard(plan, currentPlanKey, subscriptionId, ordersThisMonth, limit) {
  const isCurrent = plan.key === currentPlanKey;
  const usage = isCurrent && limit != null ? `${ordersThisMonth} of ${limit} used this month` : null;

  return (
    <s-box key={plan.key} padding="base" borderWidth="base" borderRadius="base" background="base">
      <s-stack direction="block" gap="base">
        <s-stack direction="inline" gap="tight" alignItems="center" justifyContent="space-between">
          <s-heading>{plan.name}</s-heading>
          {isCurrent ? <s-badge tone="success">Current plan</s-badge> : null}
        </s-stack>
        <s-stack direction="inline" gap="tight" alignItems="baseline">
          <s-text emphasis="bold">{plan.price}</s-text>
          <s-text color="subdued">{plan.period}</s-text>
        </s-stack>
        <s-text>{plan.limit}</s-text>
        {usage ? <s-text color="subdued">{usage}</s-text> : null}
        <s-unordered-list>
          {plan.features.map((f) => (
            <s-list-item key={f}>{f}</s-list-item>
          ))}
        </s-unordered-list>
        {isCurrent ? null : (
          <form method="post">
            <input type="hidden" name="plan" value={plan.key} />
            {plan.key === "free" ? <input type="hidden" name="subscriptionId" value={subscriptionId || ""} /> : null}
            <s-button type="submit" variant={plan.key === "free" ? "secondary" : "primary"}>
              {plan.key === "free" ? "Downgrade to Free" : `Choose ${plan.name}`}
            </s-button>
          </form>
        )}
      </s-stack>
    </s-box>
  );
}

export default function Plan() {
  const { planKey, subscriptionId, ordersThisMonth, limit } = useLoaderData();

  return (
    <s-page heading="Plan" inlineSize="large">
      <s-link slot="breadcrumb-actions" href="/app">
        Back
      </s-link>

      <s-section>
        <s-grid gridTemplateColumns="1fr 1fr 1fr" gap="base">
          {PLANS.map((plan) => planCard(plan, planKey, subscriptionId, ordersThisMonth, limit))}
        </s-grid>
      </s-section>

      <s-section slot="aside" heading="How limits work">
        <s-paragraph>
          Orders are counted from the 1st of the calendar month. Once a
          store&apos;s monthly limit is reached, the Cash on Delivery button
          will stop accepting new orders until the next month or an upgrade.
        </s-paragraph>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
