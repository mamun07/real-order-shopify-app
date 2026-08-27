import { authenticate } from "../shopify.server";
import { getLiveShippingOptions } from "../models/shipping.server";
import { createCodOrder } from "../models/order.server";
import { logCodOrder, countCodOrdersThisMonth } from "../models/codOrder.server";
import { getActivePlan, PLAN_LIMITS } from "../models/plan.server";

function corsHeaders() {
  return { "Access-Control-Allow-Origin": "*" };
}

export const action = async ({ request }) => {
  const { session, admin, storefront } =
    await authenticate.public.appProxy(request);

  if (!session || !admin) {
    return Response.json({ error: "Shop not found" }, { status: 404 });
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

  const {
    variantId,
    quantity = 1,
    fullName,
    phone,
    email,
    province,
    city,
    address1,
    countryCode = "BD",
    shippingHandle,
  } = body || {};

  if (!variantId || !fullName || !phone || !address1 || !city || !shippingHandle) {
    return Response.json(
      { error: "Missing required fields" },
      { status: 400, headers: corsHeaders() },
    );
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json(
      { error: "Invalid email address" },
      { status: 400, headers: corsHeaders() },
    );
  }

  const { planKey } = await getActivePlan(admin);
  const ordersThisMonth = await countCodOrdersThisMonth(session.shop);
  if (ordersThisMonth >= PLAN_LIMITS[planKey]) {
    return Response.json(
      { error: "This store has reached its Cash on Delivery order limit for this month. Please contact the store." },
      { status: 402, headers: corsHeaders() },
    );
  }

  const variantGid = variantId.startsWith("gid://")
    ? variantId
    : `gid://shopify/ProductVariant/${variantId}`;

  // Re-derive the shipping cost server-side from the merchant's real,
  // live shipping rates rather than trusting the amount the client
  // remembered from the earlier /rates call.
  let shippingLine;
  try {
    const live = await getLiveShippingOptions({
      storefront,
      variantGid,
      quantity: Number(quantity),
      address: { address1, city, provinceCode: province },
      countryCode,
    });
    shippingLine = live.options.find((o) => o.handle === shippingHandle);
  } catch (error) {
    console.error("[real-order] Live shipping verification failed", error);
  }

  if (!shippingLine) {
    return Response.json(
      { error: "That shipping method is no longer available. Please choose again." },
      { status: 409, headers: corsHeaders() },
    );
  }

  const [firstName, ...rest] = fullName.trim().split(/\s+/);
  const lastName = rest.join(" ") || firstName;

  try {
    const order = await createCodOrder(admin, {
      variantGid,
      quantity: Number(quantity),
      customer: {
        firstName,
        lastName,
        address1,
        city,
        province,
        countryCode,
        phone,
        email,
      },
      shippingLine,
      note: `Cash on Delivery order placed via Real COD Order product page popup.\nCustomer: ${fullName}, ${phone}`,
    });

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
      currency: order.totalPriceSet.shopMoney.currencyCode,
    });

    return Response.json(
      {
        success: true,
        orderName: order.name,
        subtotal: order.subtotalPriceSet.shopMoney.amount,
        shipping: order.totalShippingPriceSet.shopMoney.amount,
        total: order.totalPriceSet.shopMoney.amount,
        currency: order.totalPriceSet.shopMoney.currencyCode,
      },
      { headers: corsHeaders() },
    );
  } catch (error) {
    console.error("COD order creation failed", error);
    return Response.json(
      { error: "We couldn't place your order. Please try again." },
      { status: 500, headers: corsHeaders() },
    );
  }
};

export const loader = async () => {
  return Response.json({ error: "Method not allowed" }, { status: 405 });
};
