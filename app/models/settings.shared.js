// Pure settings helpers — safe to import from client code (no db / server
// imports). settings.server.js re-exports these for server callers.

// Kept in sync with the ShopSettings model defaults so the storefront popup
// and the admin form always have a full object to work with even before a
// row exists.
export const SETTINGS_DEFAULTS = {
  enabled: true,
  headerTitle: "Cash on Delivery",
  buttonText: "Cash on Delivery",
  // Single brand colour — drives every accent in the popup (button, focus
  // rings, selected states, success icons). Text-on-brand and soft tints are
  // derived on the storefront. Stored in the legacy `buttonColor` column.
  buttonColor: "#F97316",
  backgroundColor: "#FFFFFF",
  submitButtonText: "COMPLETE ORDER",
  fullNameLabel: "Enter Your Full Name",
  phoneLabel: "Phone Number",
  emailLabel: "Email (optional)",
  addressLabel: "Full Address",
  formWidth: 480,
  formMaxHeight: 90,
  otpEnabled: false,
  otpSmsApiUrl: "",
  otpSmsMethod: "POST",
  otpSmsApiKey: "",
  otpSmsSenderId: "",
  otpSmsParamsTemplate: "",
  otpMessageTemplate: "Your verification code is {code}",
  partialEnabled: false,
  partialType: "percent",
  partialValue: 25,
  partialNote: "",
  bkashEnabled: false,
  bkashMerchantNumber: "",
};

// Advance vs cash-on-delivery-balance split for a given order total. The
// server is the source of truth; the popup runs the same math for display.
export function computePartial(settings, total) {
  if (!settings.partialEnabled) return null;
  const raw =
    settings.partialType === "fixed"
      ? Number(settings.partialValue || 0)
      : (Number(total) * Number(settings.partialValue || 0)) / 100;
  const advance = Math.min(Math.max(Math.round(raw * 100) / 100, 0), Number(total));
  const balance = Math.round((Number(total) - advance) * 100) / 100;
  return { advance, balance };
}
