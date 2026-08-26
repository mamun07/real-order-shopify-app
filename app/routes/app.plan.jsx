import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export default function Plan() {
  return (
    <s-page heading="Plan" inlineSize="large">
      <s-link slot="breadcrumb-actions" href="/app">
        Back
      </s-link>

      <s-section heading="Free plan">
        <s-stack direction="block" gap="base">
          <s-badge tone="success">Current plan</s-badge>
          <s-paragraph>
            Real Order is <s-text emphasis="bold">completely free</s-text> —
            unlimited Cash on Delivery orders, unlimited shipping zones, no
            subscription, no order caps, no trial to expire.
          </s-paragraph>
          <s-unordered-list>
            <s-list-item>Unlimited Cash on Delivery orders</s-list-item>
            <s-list-item>Real, live Shopify shipping rates — no app fees added</s-list-item>
            <s-list-item>Unlimited Province &amp; City entries</s-list-item>
            <s-list-item>No credit card required</s-list-item>
          </s-unordered-list>
        </s-stack>
      </s-section>

      <s-section slot="aside" heading="Questions?">
        <s-paragraph>
          If Real Order ever introduces a paid plan in the future, existing
          features you&apos;re already using today will keep working.
        </s-paragraph>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
