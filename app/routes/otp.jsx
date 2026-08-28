import { authenticate } from "../shopify.server";
import { getSettings } from "../models/settings.server";
import { sendSms } from "../models/sms.server";
import {
  createChallenge,
  verifyChallenge,
  generateCode,
  normalizePhone,
  OTP_RESEND_SECONDS,
} from "../models/otp.server";

function corsHeaders() {
  return { "Access-Control-Allow-Origin": "*" };
}

/**
 * Phone OTP for the Cash on Delivery popup. POST { intent, phone, code }:
 *   intent "send"   → generate a code, store its hash, SMS it via the
 *                     merchant's configured gateway. With no gateway set up
 *                     it runs in demo mode and returns the code so the flow
 *                     can be shown on screen.
 *   intent "verify" → check the code; on success the number is treated as
 *                     verified for the following order request.
 *
 * Errors are returned with HTTP 200 and an `error` field — Shopify's app
 * proxy replaces any 5xx body with the storefront error page, so the popup
 * would never see a real message otherwise.
 */
export const action = async ({ request }) => {
  const { session } = await authenticate.public.appProxy(request);

  if (!session) {
    return Response.json(
      { error: "Shop not found" },
      { status: 404, headers: corsHeaders() },
    );
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

  const intent = body?.intent;
  const phone = normalizePhone(body?.phone);
  if (!phone || phone.length < 6) {
    return Response.json(
      { error: "Enter a valid phone number first." },
      { headers: corsHeaders() },
    );
  }

  try {
    const settings = await getSettings(session.shop);
    if (!settings.otpEnabled) {
      return Response.json(
        { error: "OTP verification is not enabled." },
        { headers: corsHeaders() },
      );
    }

    if (intent === "send") {
      const code = generateCode();
      await createChallenge(session.shop, phone, code);
      const message = (
        settings.otpMessageTemplate || "Your verification code is {code}"
      ).replaceAll("{code}", code);

      const result = await sendSms(settings, { phone, message });

      if (result.demo) {
        return Response.json(
          { ok: true, demo: true, demoCode: code, resendAfter: OTP_RESEND_SECONDS },
          { headers: corsHeaders() },
        );
      }
      if (!result.sent) {
        return Response.json(
          { error: result.error || "Couldn't send the code. Please try again." },
          { headers: corsHeaders() },
        );
      }
      return Response.json(
        { ok: true, demo: false, resendAfter: OTP_RESEND_SECONDS },
        { headers: corsHeaders() },
      );
    }

    if (intent === "verify") {
      const result = await verifyChallenge(
        session.shop,
        phone,
        String(body?.code || "").trim(),
      );
      if (!result.ok) {
        return Response.json(
          { error: result.reason },
          { headers: corsHeaders() },
        );
      }
      return Response.json({ ok: true }, { headers: corsHeaders() });
    }

    return Response.json(
      { error: "Unknown request." },
      { status: 400, headers: corsHeaders() },
    );
  } catch (error) {
    console.error("[real-order] OTP flow failed", error);
    return Response.json(
      {
        error: "Verification is temporarily unavailable. Please try again.",
        debug: String(error?.message || error),
      },
      { headers: corsHeaders() },
    );
  }
};

export const loader = async () => {
  return Response.json({ error: "Method not allowed" }, { status: 405 });
};
