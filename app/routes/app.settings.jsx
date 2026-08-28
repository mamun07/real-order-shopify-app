import { useEffect, useMemo, useState } from "react";
import { useFetcher, useLoaderData, useSearchParams } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { getSettings, updateSettings } from "../models/settings.server";
import { SETTINGS_DEFAULTS } from "../models/settings.shared";

const BOOL_FIELDS = new Set([
  "enabled",
  "otpEnabled",
  "partialEnabled",
  "bkashEnabled",
]);
const NUMBER_FIELDS = new Set(["formWidth", "formMaxHeight", "partialValue"]);
const EDITABLE_FIELDS = Object.keys(SETTINGS_DEFAULTS);

const TABS = [
  { id: "general", label: "General" },
  { id: "appearance", label: "Appearance" },
  { id: "payment", label: "Online payment (Partial / Full)" },
  { id: "otp", label: "OTP verification" },
  { id: "bkash", label: "bKash payment" },
];

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const settings = await getSettings(session.shop);
  const themeEditorUrl = `https://${session.shop}/admin/themes/current/editor?template=product&addAppBlockId=real-order-cod/cod-button&target=mainSection`;
  return { settings, themeEditorUrl };
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();

  const data = {};
  for (const key of EDITABLE_FIELDS) {
    if (!formData.has(key)) continue;
    const raw = formData.get(key);
    if (BOOL_FIELDS.has(key)) data[key] = raw === "true";
    else if (NUMBER_FIELDS.has(key)) data[key] = Number(raw) || 0;
    else data[key] = String(raw);
  }

  const settings = await updateSettings(session.shop, data);
  return { settings, saved: true };
};

export default function Settings() {
  const { settings, themeEditorUrl } = useLoaderData();
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const isSaving = fetcher.state !== "idle";

  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.id === params.get("tab"))
    ? params.get("tab")
    : "general";
  const selectTab = (id) =>
    setParams(id === "general" ? {} : { tab: id }, { replace: true });
  const activeLabel = (TABS.find((t) => t.id === tab) || TABS[0]).label;

  const saved = fetcher.data?.settings || settings;
  const [form, setForm] = useState(saved);

  // Re-sync local state whenever a save round-trips.
  useEffect(() => {
    if (fetcher.data?.saved) {
      setForm(fetcher.data.settings);
      shopify.toast.show("Settings saved");
    }
  }, [fetcher.data, shopify]);

  const dirty = useMemo(
    () => EDITABLE_FIELDS.some((k) => String(form[k]) !== String(saved[k])),
    [form, saved],
  );

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const onSave = () => {
    const data = new FormData();
    for (const key of EDITABLE_FIELDS) data.set(key, String(form[key] ?? ""));
    fetcher.submit(data, { method: "POST" });
  };

  const panelProps = { form, set, themeEditorUrl };

  return (
    <s-page heading="Settings" inlineSize="large">
      <s-link slot="breadcrumb-actions" href="/app">
        Back
      </s-link>
      <s-button
        slot="primary-action"
        variant="primary"
        onClick={onSave}
        {...(isSaving || !dirty ? { disabled: true } : {})}
      >
        {isSaving ? "Saving…" : "Save"}
      </s-button>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "20px",
          alignItems: "flex-start",
        }}
      >
        <nav
          style={{
            flex: "1 1 180px",
            maxWidth: 240,
            minWidth: 160,
            minHeight: "90vh",
          }}
        >
          <s-section>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                minHeight: "90vh",
              }}
            >
              {TABS.map((t) => {
                const active = t.id === tab;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => selectTab(t.id)}
                    style={{
                      textAlign: "left",
                      padding: "8px 10px",
                      border: "none",
                      borderRadius: 8,
                      cursor: "pointer",
                      font: "inherit",
                      lineHeight: 1.3,
                      background: active ? "rgba(0,0,0,0.08)" : "transparent",
                      fontWeight: active ? 600 : 400,
                    }}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </s-section>
        </nav>

        <div style={{ flex: "3 1 420px", minWidth: 0 }}>
          <s-section heading={activeLabel}>
            {tab === "general" && <GeneralPanel {...panelProps} />}
            {tab === "appearance" && <AppearancePanel {...panelProps} />}
            {tab === "payment" && <PaymentPanel {...panelProps} />}
            {tab === "otp" && <OtpPanel {...panelProps} />}
            {tab === "bkash" && <BkashPanel {...panelProps} />}
          </s-section>
        </div>
      </div>
    </s-page>
  );
}

function GeneralPanel({ form, set, themeEditorUrl }) {
  return (
    <s-stack direction="block" gap="base">
      <s-paragraph>
        Real COD Order adds a{" "}
        <s-text emphasis="bold">Cash on Delivery</s-text> button to your product
        page. Shoppers click it to open a popup checkout that collects their
        delivery details, shows real Shopify shipping rates for their address,
        and places the order directly — no card, no Shopify Checkout required.
      </s-paragraph>
      <s-button href={themeEditorUrl} target="_blank">
        Add button to product page
      </s-button>
      <s-divider />
      <s-switch
        label="Enable Cash on Delivery button"
        details="Turn the storefront button and popup on or off."
        checked={form.enabled}
        onChange={(e) => set("enabled")(e.target.checked)}
      />
    </s-stack>
  );
}

function AppearancePanel({ form, set }) {
  return (
    <s-stack direction="block" gap="base">
      <FieldRow>
        <Quarter>
          <s-text-field
            label="Popup title"
            value={form.headerTitle}
            onChange={(e) => set("headerTitle")(e.target.value)}
          />
        </Quarter>
        <Quarter>
          <s-text-field
            label="Trigger button text"
            value={form.buttonText}
            onChange={(e) => set("buttonText")(e.target.value)}
          />
        </Quarter>
        <Quarter>
          <s-text-field
            label="Submit button text"
            value={form.submitButtonText}
            onChange={(e) => set("submitButtonText")(e.target.value)}
          />
        </Quarter>
        <Quarter>
          <s-text-field
            label="Popup width (px)"
            type="number"
            value={String(form.formWidth)}
            onChange={(e) => set("formWidth")(e.target.value)}
          />
        </Quarter>
        <Quarter>
          <s-text-field
            label="Popup max height (vh)"
            details="e.g. 90 = 90% of screen height"
            type="number"
            value={String(form.formMaxHeight)}
            onChange={(e) => set("formMaxHeight")(e.target.value)}
          />
        </Quarter>
        <Quarter>
          <ColorField
            label="Brand colour"
            value={form.buttonColor}
            onChange={set("buttonColor")}
          />
        </Quarter>
        <Quarter>
          <ColorField
            label="Popup background colour"
            value={form.backgroundColor}
            onChange={set("backgroundColor")}
          />
        </Quarter>
      </FieldRow>

      <s-divider />
      <s-text emphasis="bold">Field placeholders</s-text>
      <FieldRow>
        <Quarter>
          <s-text-field
            label="Full name field"
            value={form.fullNameLabel}
            onChange={(e) => set("fullNameLabel")(e.target.value)}
          />
        </Quarter>
        <Quarter>
          <s-text-field
            label="Phone field"
            value={form.phoneLabel}
            onChange={(e) => set("phoneLabel")(e.target.value)}
          />
        </Quarter>
        <Quarter>
          <s-text-field
            label="Email field"
            value={form.emailLabel}
            onChange={(e) => set("emailLabel")(e.target.value)}
          />
        </Quarter>
        <Quarter>
          <s-text-field
            label="Address field"
            value={form.addressLabel}
            onChange={(e) => set("addressLabel")(e.target.value)}
          />
        </Quarter>
      </FieldRow>
    </s-stack>
  );
}

function OtpPanel({ form, set }) {
  return (
    <s-stack direction="block" gap="base">
      <s-switch
        label="Require phone verification before an order is placed"
        details="The shopper receives a 6-digit code by SMS and must enter it to complete the order."
        checked={form.otpEnabled}
        onChange={(e) => set("otpEnabled")(e.target.checked)}
      />
      {form.otpEnabled && (
        <>
          <s-paragraph>
            <s-text tone="subdued">
              Leave the credentials blank to run in{" "}
              <s-text emphasis="bold">demo mode</s-text> — the code is shown on
              screen instead of being sent, so you can see the flow before
              connecting a provider. Fill them in and it sends for real through
              your SMS gateway.
            </s-text>
          </s-paragraph>
          <s-text-field
            label="SMS API URL"
            placeholder="https://api.your-sms-gateway.com/send"
            value={form.otpSmsApiUrl}
            onChange={(e) => set("otpSmsApiUrl")(e.target.value)}
          />
          <s-grid gridTemplateColumns="1fr 1fr" gap="base">
            <s-select
              label="HTTP method"
              value={form.otpSmsMethod}
              onChange={(e) => set("otpSmsMethod")(e.target.value)}
            >
              <s-option value="POST">POST</s-option>
              <s-option value="GET">GET</s-option>
            </s-select>
            <s-text-field
              label="Sender ID"
              value={form.otpSmsSenderId}
              onChange={(e) => set("otpSmsSenderId")(e.target.value)}
            />
          </s-grid>
          <s-text-field
            label="API key"
            value={form.otpSmsApiKey}
            onChange={(e) => set("otpSmsApiKey")(e.target.value)}
          />
          <s-text-field
            label="Request parameter template"
            details='Placeholders: {apiKey} {senderId} {phone} {message}. GET example: api_key={apiKey}&senderid={senderId}&number={phone}&message={message}  ·  POST JSON example: {"api_key":"{apiKey}","number":"{phone}","message":"{message}"}'
            value={form.otpSmsParamsTemplate}
            onChange={(e) => set("otpSmsParamsTemplate")(e.target.value)}
          />
          <s-text-field
            label="Message template"
            details="Placeholder: {code}"
            value={form.otpMessageTemplate}
            onChange={(e) => set("otpMessageTemplate")(e.target.value)}
          />
        </>
      )}
    </s-stack>
  );
}

function PaymentPanel({ form, set }) {
  return (
    <s-stack direction="block" gap="base">
      <s-switch
        label="Let shoppers pay online — an advance now, or the full amount"
        details="When on, the popup asks how to pay. Card / Shopify payments always work (the shopper is sent to Shopify's hosted checkout for the chosen amount). Any remainder is collected Cash on Delivery. The order is created only after payment."
        checked={form.partialEnabled}
        onChange={(e) => set("partialEnabled")(e.target.checked)}
      />
      {form.partialEnabled && (
        <>
          <s-grid gridTemplateColumns="1fr 1fr" gap="base">
            <s-select
              label="Advance type"
              value={form.partialType}
              onChange={(e) => set("partialType")(e.target.value)}
            >
              <s-option value="percent">Percent of total</s-option>
              <s-option value="fixed">Fixed amount</s-option>
            </s-select>
            <s-text-field
              label={
                form.partialType === "fixed"
                  ? "Advance amount"
                  : "Advance percent (%)"
              }
              details={
                form.partialType === "percent"
                  ? "Default 25% of the order total."
                  : undefined
              }
              type="number"
              value={String(form.partialValue)}
              onChange={(e) => set("partialValue")(e.target.value)}
            />
          </s-grid>
          <s-text-field
            label="Note shown to the shopper"
            placeholder="Pay 25% now to confirm your order. The rest is collected on delivery."
            value={form.partialNote}
            onChange={(e) => set("partialNote")(e.target.value)}
          />
        </>
      )}
    </s-stack>
  );
}

function BkashPanel({ form, set }) {
  return (
    <s-stack direction="block" gap="base">
      <s-switch
        label="Offer bKash as a payment method"
        details="Adds a 'Pay with bKash' choice next to card. The shopper sends money to your bKash number and enters the Transaction ID. A full payment is marked Paid on the order automatically; a partial payment is recorded against the order too (recording a partial amount by API needs Shopify Plus — on other plans the order is left payment-pending for you to record by hand). Needs online payment above to be on."
        checked={form.bkashEnabled}
        onChange={(e) => set("bkashEnabled")(e.target.checked)}
      />
      {form.bkashEnabled && (
        <s-text-field
          label="Your bKash merchant / personal number"
          placeholder="01XXXXXXXXX"
          value={form.bkashMerchantNumber}
          onChange={(e) => set("bkashMerchantNumber")(e.target.value)}
        />
      )}
    </s-stack>
  );
}

// Appearance fields: capped at 25% of the row, wrapping to new lines.
function FieldRow({ children }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
      {children}
    </div>
  );
}

function Quarter({ children }) {
  return (
    <div style={{ flex: "1 1 180px", maxWidth: "25%", minWidth: 160 }}>
      {children}
    </div>
  );
}

function ColorField({ label, value, onChange }) {
  const hex = /^#[0-9a-fA-F]{6}$/.test(value || "") ? value : "#000000";
  return (
    <div style={{ minWidth: 0 }}>
      <s-text-field
        label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <input
        type="color"
        value={hex}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        style={{
          marginTop: 6,
          width: "100%",
          height: 28,
          padding: 0,
          border: "1px solid #ccc",
          borderRadius: 6,
          background: "none",
          cursor: "pointer",
        }}
        aria-label={`${label} swatch`}
      />
    </div>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
