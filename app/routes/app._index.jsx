import { useEffect } from "react";
import { useFetcher, useLoaderData } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { getSettings, updateSettings } from "../models/settings.server";
import { countCodOrders } from "../models/codOrder.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const settings = await getSettings(session.shop);
  const orderCount = await countCodOrders(session.shop);
  const themeEditorUrl = `https://${session.shop}/admin/themes/current/editor?template=product&addAppBlockId=real-order-cod/cod-button&target=mainSection`;

  return { settings, orderCount, shop: session.shop, themeEditorUrl };
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();

  const settings = await updateSettings(session.shop, {
    enabled: formData.get("enabled") === "true",
    buttonText: formData.get("buttonText") || "Cash on Delivery",
    buttonColor: formData.get("buttonColor") || "#F97316",
  });

  return { settings, saved: true };
};

export default function Index() {
  const { settings, orderCount, themeEditorUrl } = useLoaderData();
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const isSaving = fetcher.state !== "idle";
  const current = fetcher.data?.settings || settings;

  useEffect(() => {
    if (fetcher.data?.saved) {
      shopify.toast.show("Settings saved");
    }
  }, [fetcher.data?.saved, shopify]);

  const save = (overrides = {}) => {
    const data = new FormData();
    data.set("enabled", String(overrides.enabled ?? current.enabled));
    data.set("buttonText", overrides.buttonText ?? current.buttonText);
    data.set("buttonColor", overrides.buttonColor ?? current.buttonColor);
    fetcher.submit(data, { method: "POST" });
  };

  return (
    <s-page heading="Real Order — Cash on Delivery">
      <s-button
        slot="primary-action"
        href={themeEditorUrl}
        target="_blank"
        variant="primary"
      >
        Add button to product page
      </s-button>

      <s-section heading="Get started">
        <s-paragraph>
          Real Order adds a <s-text emphasis="bold">Cash on Delivery</s-text>{" "}
          button to your product page. Shoppers click it to open a popup
          checkout that collects their delivery details, shows real
          Shopify shipping rates for their address, and places the order
          directly — no card, no Shopify Checkout required. This app is
          completely free, no plan or subscription needed.
        </s-paragraph>
        <s-paragraph>
          1. Click <s-text emphasis="bold">Add button to product page</s-text>{" "}
          to open the theme editor with the Cash on Delivery block ready to
          place.
          <br />
          2. Position the block wherever you&apos;d like on the product page and
          click <s-text emphasis="bold">Save</s-text> in the theme editor.
          <br />
          3. That&apos;s it — the button and popup are live on your storefront.
        </s-paragraph>
      </s-section>

      <s-section heading="Button settings">
        <s-stack direction="block" gap="base">
          <s-switch
            label="Enable Cash on Delivery button"
            checked={current.enabled}
            onChange={(e) => save({ enabled: e.target.checked })}
          />
          <s-text-field
            label="Button text"
            value={current.buttonText}
            onChange={(e) => save({ buttonText: e.target.value })}
          />
          <s-text-field
            label="Button color"
            value={current.buttonColor}
            onChange={(e) => save({ buttonColor: e.target.value })}
          />
        </s-stack>
      </s-section>

      {isSaving && <s-spinner accessibilityLabel="Saving" />}

      <s-section slot="aside" heading="Shipping">
        <s-paragraph>
          Real Order always uses your real Shopify shipping zones and rates —
          it never invents its own.
        </s-paragraph>
        <s-link href="/app/shipping-zones">View shipping zones & rates</s-link>
      </s-section>

      <s-section slot="aside" heading="Orders">
        <s-paragraph>
          <s-text emphasis="bold">{orderCount}</s-text> Cash on Delivery{" "}
          {orderCount === 1 ? "order" : "orders"} placed so far.
        </s-paragraph>
        <s-link href="/app/orders">View COD orders</s-link>
      </s-section>

      <s-section slot="aside" heading="How it works">
        <s-unordered-list>
          <s-list-item>Shopper clicks the Cash on Delivery button</s-list-item>
          <s-list-item>Popup collects name, phone and address</s-list-item>
          <s-list-item>
            Real Shopify shipping rates load for that address
          </s-list-item>
          <s-list-item>
            Order is created with payment marked pending (COD)
          </s-list-item>
        </s-unordered-list>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
