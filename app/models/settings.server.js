import db from "../db.server";
import { SETTINGS_DEFAULTS, computePartial } from "./settings.shared";

// Re-exported so existing server callers can keep importing from here.
export { SETTINGS_DEFAULTS, computePartial };

export async function getSettings(shop) {
  let settings = await db.shopSettings.findUnique({ where: { shop } });
  if (!settings) {
    settings = await db.shopSettings.create({ data: { shop } });
  }
  return { ...SETTINGS_DEFAULTS, ...settings };
}

export async function updateSettings(shop, data) {
  const settings = await db.shopSettings.upsert({
    where: { shop },
    update: data,
    create: { shop, ...data },
  });
  return { ...SETTINGS_DEFAULTS, ...settings };
}

// The subset safe to hand to the storefront: everything the popup needs to
// render, with the SMS gateway credentials removed — they must never reach
// the browser.
export function toPublicSettings(s) {
  return {
    enabled: s.enabled,
    headerTitle: s.headerTitle,
    buttonText: s.buttonText,
    buttonColor: s.buttonColor,
    brandColor: s.buttonColor,
    backgroundColor: s.backgroundColor,
    submitButtonText: s.submitButtonText,
    fullNameLabel: s.fullNameLabel,
    phoneLabel: s.phoneLabel,
    emailLabel: s.emailLabel,
    addressLabel: s.addressLabel,
    formWidth: s.formWidth,
    formMaxHeight: s.formMaxHeight,
    otpEnabled: s.otpEnabled,
    partialEnabled: s.partialEnabled,
    partialType: s.partialType,
    partialValue: s.partialValue,
    partialNote: s.partialNote,
    bkashEnabled: s.bkashEnabled,
    bkashMerchantNumber: s.bkashMerchantNumber,
  };
}
