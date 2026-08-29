import { authenticate } from "../shopify.server";
import { getLiveShippingOptions } from "../models/shipping.server";
import {
  createCodOrder,
  createCodDraftInvoice,
  getDraftOrderStatus,
  recordOrderPayment,
} from "../models/order.server";
import { logCodOrder } from "../models/codOrder.server";
import { getSettings, computePartial } from "../models/settings.server";
import { isPhoneVerified, normalizePhone } from "../models/otp.server";

function cors() {
  return { "Access-Control-Allow-Origin": "*" };
}

function splitName(fullName) {
  const [first, ...rest] = String(fullName || "").trim().split(/\s+/);
  return { firstName: first || "", lastName: rest.join(" ") || first || "" };
}

/**
 * Online-payment flow for the Cash on Delivery popup. Only reached when the
 * merchant has enabled online payment (Partial / Full). The Shopify order is
 * created only AFTER payment:
 *   intent "create" + method "shopify" → make a draft order, return its
 *      hosted invoiceUrl; the popup opens it and polls "status".
 *   intent "status"                    → once the invoice is paid Shopify has
 *      turned the draft into a real order; record it and return the details.
 *   intent "create" + method "bkash"   → return the merchant bKash number +
 *      amount so the popup can collect a Transaction ID.
 *   intent "bkash-confirm"             → TrxID supplied → create the order
 *      (payment pending manual verification) and return the details.
 *
 * Errors come back as HTTP 200 + `error` (app-proxy 5xx-masking rule).
 */
export const action = async ({ request }) => {
  const { session, admin, storefront } =
    await authenticate.public.appProxy(request);

  if (!session || !admin) {
    return Response.json(
      { error: "Shop not found" },
      { status: 404, headers: cors() },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid request body" },
      { status: 400, headers: cors() },
    );
  }

  const intent = body?.intent;

  try {
    const settings = await getSettings(session.shop);
    if (!settings.partialEnabled) {
      return Response.json(
        { error: "Online payment is not enabled." },
        { headers: cors() },
      );
    }

    // ---- Poll: has the hosted invoice been paid yet? -------------------
    if (intent === "status") {
      const draft = await getDraftOrderStatus(admin, body.draftOrderId);
      if (!draft) {
        return Response.json(
          { error: "Payment session not found." },
          { headers: cors() },
        );
      }
      if (!draft.order) {
        return Response.json({ paid: false }, { headers: cors() });
      }

      const o = draft.order;
      const currency = o.totalPriceSet.shopMoney.currencyCode;
      const invoiceTotal = Number(o.totalPriceSet.shopMoney.amount);
      const orderTotal = Number(body.orderTotal || invoiceTotal);
      const amountPaid = Number(body.expectedAmount || invoiceTotal);
      const codBalance = Math.max(
        0,
        Math.round((orderTotal - amountPaid) * 100) / 100,
      );

      await logCodOrder(session.shop, {
        orderId: o.id,
        orderName: o.name,
        customerName: body.fullName || "",
        phone: body.phone || "",
        province: body.province || null,
        city: body.city || null,
        address: body.address1 || "",
        shippingMethod: body.shippingTitle || "",
        total: invoiceTotal,
        currency,
        advanceAmount: amountPaid,
        codBalance,
        paymentMethod: "shopify",
        paymentChoice: body.paymentChoice || null,
        paymentStatus: "paid",
      }).catch((e) =>
        console.error("[real-order] logCodOrder (paid) failed", e),
      );

      return Response.json(
        {
          paid: true,
          orderName: o.name,
          subtotal: o.subtotalPriceSet.shopMoney.amount,
          shipping: o.totalShippingPriceSet.shopMoney.amount,
          total: o.totalPriceSet.shopMoney.amount,
          currency,
          amountPaid,
          codBalance,
          paymentMethod: "shopify",
          paymentStatus: "paid",
        },
        { headers: cors() },
      );
    }

    // ---- create / bkash-confirm: need the full order payload ----------
    const {
      variantId,
      quantity = 1,
      fullName,
      phone,
      email,
      province,
      provinceCode,
      city,
      address1,
      countryCode = "BD",
      shippingHandle,
      paymentMethod,
      paymentChoice,
      bkashTrxId,
    } = body || {};

    if (!variantId || !fullName || !phone || !address1 || !city || !shippingHandle) {
      return Response.json(
        { error: "Missing required fields" },
        { headers: cors() },
      );
    }
    if (paymentChoice !== "partial" && paymentChoice !== "full") {
      return Response.json(
        { error: "Choose an amount to pay." },
        { headers: cors() },
      );
    }
    if (settings.otpEnabled) {
      const ok = await isPhoneVerified(session.shop, normalizePhone(phone));
      if (!ok) {
        return Response.json(
          { error: "Please verify your phone number.", needsOtp: true },
          { headers: cors() },
        );
      }
    }

    const variantGid = variantId.startsWith("gid://")
      ? variantId
      : `gid://shopify/ProductVariant/${variantId}`;

    const live = await getLiveShippingOptions({
      storefront,
      variantGid,
      quantity: Number(quantity),
      address: { address1, city, provinceCode: provinceCode || province },
      countryCode,
    });
    const shippingLine = live.options.find((o) => o.handle === shippingHandle);
    if (!shippingLine) {
      return Response.json(
        { error: "That shipping method is no longer available. Please choose again." },
        { headers: cors() },
      );
    }

    const currency = live.subtotal?.currencyCode || "";
    const orderTotal =
      Number(live.subtotal?.amount || 0) + Number(shippingLine.amount || 0);

    let payNow = orderTotal;
    let balanceDiscountPercent = 0;
    if (paymentChoice === "partial") {
      const p = computePartial(settings, orderTotal);
      payNow = p ? p.advance : orderTotal;
      balanceDiscountPercent =
        orderTotal > 0
          ? Math.max(
              0,
              Math.min(
                100,
                Math.round(((orderTotal - payNow) / orderTotal) * 10000) / 100,
              ),
            )
          : 0;
    }
    const codBalance = Math.max(
      0,
      Math.round((orderTotal - payNow) * 100) / 100,
    );

    const { firstName, lastName } = splitName(fullName);
    const customer = {
      firstName,
      lastName,
      address1,
      city,
      province,
      countryCode,
      phone,
      email,
    };

    // ---- Shopify hosted invoice -------------------------------------
    if (intent === "create" && paymentMethod === "shopify") {
      const note =
        `Cash on Delivery order via Real COD Order popup.\nCustomer: ${fullName}, ${phone}\n` +
        `Online payment: ${paymentChoice} (${payNow.toFixed(2)} ${currency}); ` +
        `balance on delivery: ${codBalance.toFixed(2)} ${currency}`;
      const customAttributes = [
        { key: "Payment method", value: "Shopify (online)" },
        { key: "Paid online", value: `${payNow.toFixed(2)} ${currency}`.trim() },
        {
          key: "Balance on delivery",
          value: `${codBalance.toFixed(2)} ${currency}`.trim(),
        },
      ];

      const draft = await createCodDraftInvoice(admin, {
        variantGid,
        quantity: Number(quantity),
        customer,
        shippingLine,
        note,
        customAttributes,
        balanceDiscountPercent,
      });

      return Response.json(
        {
          method: "shopify",
          draftOrderId: draft.id,
          invoiceUrl: draft.invoiceUrl,
          expectedAmount: payNow,
          orderTotal,
          codBalance,
          currency,
        },
        { headers: cors() },
      );
    }

    // ---- bKash ----------------------------------------------------------
    if (
      (intent === "create" || intent === "bkash-confirm") &&
      paymentMethod === "bkash"
    ) {
      if (!settings.bkashEnabled || String(countryCode).toUpperCase() !== "BD") {
        return Response.json(
          { error: "bKash is only available for orders shipping to Bangladesh." },
          { headers: cors() },
        );
      }

      if (intent === "create") {
        return Response.json(
          {
            method: "bkash",
            bkashNumber: settings.bkashMerchantNumber,
            expectedAmount: payNow,
            orderTotal,
            codBalance,
            currency,
          },
          { headers: cors() },
        );
      }

      // bkash-confirm
      if (!bkashTrxId || String(bkashTrxId).trim().length < 4) {
        return Response.json(
          { error: "Enter the bKash Transaction ID." },
          { headers: cors() },
        );
      }
      const trx = String(bkashTrxId).trim();
      const note =
        `Cash on Delivery order via Real COD Order popup.\nCustomer: ${fullName}, ${phone}\n` +
        `bKash ${paymentChoice} payment ${payNow.toFixed(2)} ${currency}, TrxID ${trx} (UNVERIFIED); ` +
        `balance on delivery: ${codBalance.toFixed(2)} ${currency}`;
      const customAttributes = [
        { key: "Payment method", value: "bKash" },
        { key: "bKash TrxID", value: trx },
        { key: "bKash amount", value: `${payNow.toFixed(2)} ${currency}`.trim() },
        {
          key: "Balance on delivery",
          value: `${codBalance.toFixed(2)} ${currency}`.trim(),
        },
      ];

      const order = await createCodOrder(admin, {
        variantGid,
        quantity: Number(quantity),
        customer,
        shippingLine,
        note,
        customAttributes,
      });

      // Register the bKash money against the order so the admin's financial
      // status / "Paid" amount are correct. Full payment → mark paid; partial
      // → record a manual payment for the advance (Shopify Plus only — on
      // other plans this fails gracefully and the order stays pending for the
      // merchant to record by hand).
      const isFull = paymentChoice === "full";
      const orderCurrency = order.totalPriceSet.shopMoney.currencyCode;
      const recorded = await recordOrderPayment(admin, {
        orderId: order.id,
        amount: payNow,
        currencyCode: orderCurrency,
        full: isFull,
        paymentMethodName: "bKash",
      });
      let paymentStatus;
      if (recorded.ok) {
        paymentStatus = recorded.financialStatus
          ? recorded.financialStatus.toLowerCase()
          : isFull
            ? "paid"
            : "partially_paid";
      } else {
        console.error(
          "[real-order] recordOrderPayment failed (order left pending)",
          recorded.error,
        );
        paymentStatus = "pending_verification";
      }

      await logCodOrder(session.shop, {
        orderId: order.id,
        orderName: order.name,
        customerName: fullName,
        phone,
        province,
        city,
        address: address1,
        shippingMethod: shippingLine.title,
        total: Number(order.totalPriceSet.shopMoney.amount),
        currency: orderCurrency,
        advanceAmount: payNow,
        codBalance,
        paymentMethod: "bkash",
        paymentChoice,
        bkashTrxId: trx,
        paymentStatus,
      }).catch((e) =>
        console.error("[real-order] logCodOrder (bkash) failed", e),
      );

      return Response.json(
        {
          success: true,
          orderName: order.name,
          subtotal: order.subtotalPriceSet.shopMoney.amount,
          shipping: order.totalShippingPriceSet.shopMoney.amount,
          total: order.totalPriceSet.shopMoney.amount,
          currency: orderCurrency,
          amountPaid: payNow,
          codBalance,
          paymentMethod: "bkash",
          paymentStatus,
          paymentRecorded: recorded.ok,
          bkashTrxId: trx,
        },
        { headers: cors() },
      );
    }

    return Response.json(
      { error: "Unsupported payment option." },
      { headers: cors() },
    );
  } catch (error) {
    console.error("[real-order] Payment flow failed", error);
    return Response.json(
      {
        error: "Payment couldn't be started. Please try again.",
        debug: String(error?.stack || error?.message || error),
      },
      { headers: cors() },
    );
  }
};

export const loader = async () => {
  return Response.json({ error: "Method not allowed" }, { status: 405 });
};
