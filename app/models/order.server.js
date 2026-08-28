const DRAFT_ORDER_CREATE = `#graphql
  mutation codDraftOrderCreate($input: DraftOrderInput!) {
    draftOrderCreate(input: $input) {
      draftOrder {
        id
      }
      userErrors { field message }
    }
  }
`;

const DRAFT_ORDER_COMPLETE = `#graphql
  mutation codDraftOrderComplete($id: ID!) {
    draftOrderComplete(id: $id, paymentPending: true) {
      draftOrder {
        id
        order {
          id
          name
          subtotalPriceSet { shopMoney { amount currencyCode } }
          totalShippingPriceSet { shopMoney { amount currencyCode } }
          totalPriceSet { shopMoney { amount currencyCode } }
        }
      }
      userErrors { field message }
    }
  }
`;

/**
 * Creates a real Shopify order for a Cash on Delivery purchase using the
 * standard draft-order-create-then-complete-as-pending pattern (no Shopify
 * Checkout / payment gateway involved — the order lands with a
 * "payment pending" financial status until the merchant collects cash and
 * marks it paid).
 */
export async function createCodOrder(admin, { variantGid, quantity, customer, shippingLine, note, customAttributes }) {
  const input = {
    lineItems: [{ variantId: variantGid, quantity }],
    email: customer.email || undefined,
    shippingAddress: {
      firstName: customer.firstName,
      lastName: customer.lastName,
      address1: customer.address1,
      city: customer.city,
      province: customer.province,
      countryCode: customer.countryCode,
      phone: customer.phone,
    },
    shippingLine: {
      title: shippingLine.title,
      price: shippingLine.amount.toFixed(2),
    },
    note,
    useCustomerDefaultAddress: false,
  };

  if (customAttributes && customAttributes.length) {
    input.customAttributes = customAttributes;
  }

  const createResponse = await admin.graphql(DRAFT_ORDER_CREATE, {
    variables: { input },
  });
  const createJson = await createResponse.json();
  const createErrors = createJson?.data?.draftOrderCreate?.userErrors || [];
  const draftOrderId = createJson?.data?.draftOrderCreate?.draftOrder?.id;

  if (!draftOrderId || createErrors.length) {
    throw new Error(
      createErrors.map((e) => e.message).join(", ") || "draftOrderCreate failed",
    );
  }

  const completeResponse = await admin.graphql(DRAFT_ORDER_COMPLETE, {
    variables: { id: draftOrderId },
  });
  const completeJson = await completeResponse.json();
  const completeErrors = completeJson?.data?.draftOrderComplete?.userErrors || [];
  const order = completeJson?.data?.draftOrderComplete?.draftOrder?.order;

  if (!order || completeErrors.length) {
    throw new Error(
      completeErrors.map((e) => e.message).join(", ") || "draftOrderComplete failed",
    );
  }

  return order;
}

const DRAFT_ORDER_INVOICE_CREATE = `#graphql
  mutation codDraftOrderInvoiceCreate($input: DraftOrderInput!) {
    draftOrderCreate(input: $input) {
      draftOrder { id invoiceUrl }
      userErrors { field message }
    }
  }
`;

const DRAFT_ORDER_STATUS = `#graphql
  query codDraftOrderStatus($id: ID!) {
    draftOrder(id: $id) {
      id
      status
      order {
        id
        name
        displayFinancialStatus
        subtotalPriceSet { shopMoney { amount currencyCode } }
        totalShippingPriceSet { shopMoney { amount currencyCode } }
        totalPriceSet { shopMoney { amount currencyCode } }
      }
    }
  }
`;

/**
 * A draft order the shopper pays online through Shopify's own hosted invoice
 * page (returned as `invoiceUrl`). It is deliberately NOT completed here —
 * Shopify turns it into a real, paid order once the invoice is paid; call
 * getDraftOrderStatus to detect that.
 *
 * `balanceDiscountPercent` > 0 makes the invoice charge only the advance: a
 * draft-order-level percentage discount covering the Cash-on-Delivery
 * balance, titled so it is obvious on the order.
 */
export async function createCodDraftInvoice(admin, {
  variantGid,
  quantity,
  customer,
  shippingLine,
  note,
  customAttributes,
  balanceDiscountPercent,
}) {
  const input = {
    lineItems: [{ variantId: variantGid, quantity }],
    email: customer.email || undefined,
    shippingAddress: {
      firstName: customer.firstName,
      lastName: customer.lastName,
      address1: customer.address1,
      city: customer.city,
      province: customer.province,
      countryCode: customer.countryCode,
      phone: customer.phone,
    },
    shippingLine: {
      title: shippingLine.title,
      price: shippingLine.amount.toFixed(2),
    },
    note,
    useCustomerDefaultAddress: false,
  };

  if (customAttributes && customAttributes.length) {
    input.customAttributes = customAttributes;
  }
  if (balanceDiscountPercent > 0) {
    input.appliedDiscount = {
      valueType: "PERCENTAGE",
      value: Number(balanceDiscountPercent),
      title: "Balance payable on delivery (COD)",
      description: "Collected as Cash on Delivery",
    };
  }

  const res = await admin.graphql(DRAFT_ORDER_INVOICE_CREATE, {
    variables: { input },
  });
  const json = await res.json();
  const errors = json?.data?.draftOrderCreate?.userErrors || [];
  const draft = json?.data?.draftOrderCreate?.draftOrder;

  if (!draft?.id || errors.length) {
    throw new Error(
      errors.map((e) => e.message).join(", ") || "draftOrderCreate failed",
    );
  }
  return { id: draft.id, invoiceUrl: draft.invoiceUrl };
}

export async function getDraftOrderStatus(admin, id) {
  const res = await admin.graphql(DRAFT_ORDER_STATUS, { variables: { id } });
  const json = await res.json();
  return json?.data?.draftOrder || null;
}

const ORDER_MARK_AS_PAID = `#graphql
  mutation codOrderMarkAsPaid($id: ID!) {
    orderMarkAsPaid(input: { id: $id }) {
      order {
        id
        displayFinancialStatus
        totalOutstandingSet { shopMoney { amount currencyCode } }
      }
      userErrors { field message }
    }
  }
`;

const ORDER_CREATE_MANUAL_PAYMENT = `#graphql
  mutation codOrderManualPayment($id: ID!, $amount: MoneyInput!, $paymentMethodName: String) {
    orderCreateManualPayment(id: $id, amount: $amount, paymentMethodName: $paymentMethodName) {
      order {
        id
        displayFinancialStatus
        totalOutstandingSet { shopMoney { amount currencyCode } }
      }
      userErrors { field message }
    }
  }
`;

/**
 * Register money already collected outside Shopify Checkout (e.g. a bKash
 * transfer) against the order so the admin's financial status and "Paid"
 * amount reflect reality.
 *   full  → orderMarkAsPaid (works on every plan)
 *   part  → orderCreateManualPayment with an `amount`. Shopify only allows
 *           the amount field on Shopify Plus; on other plans this returns a
 *           userError and the order stays "payment pending" for the merchant
 *           to record manually.
 * Never throws — returns { ok, financialStatus, error }.
 */
export async function recordOrderPayment(admin, {
  orderId,
  amount,
  currencyCode,
  full,
  paymentMethodName,
}) {
  try {
    if (full) {
      const res = await admin.graphql(ORDER_MARK_AS_PAID, {
        variables: { id: orderId },
      });
      const json = await res.json();
      const errs = json?.data?.orderMarkAsPaid?.userErrors || [];
      if (errs.length) {
        return { ok: false, error: errs.map((e) => e.message).join(", ") };
      }
      return {
        ok: true,
        financialStatus:
          json?.data?.orderMarkAsPaid?.order?.displayFinancialStatus || null,
      };
    }

    const res = await admin.graphql(ORDER_CREATE_MANUAL_PAYMENT, {
      variables: {
        id: orderId,
        amount: { amount: Number(amount).toFixed(2), currencyCode },
        paymentMethodName: paymentMethodName || "Other",
      },
    });
    const json = await res.json();
    const errs = json?.data?.orderCreateManualPayment?.userErrors || [];
    if (errs.length) {
      return { ok: false, error: errs.map((e) => e.message).join(", ") };
    }
    return {
      ok: true,
      financialStatus:
        json?.data?.orderCreateManualPayment?.order?.displayFinancialStatus ||
        null,
    };
  } catch (error) {
    return { ok: false, error: String(error?.message || error) };
  }
}
