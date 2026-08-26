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
export async function createCodOrder(admin, { variantGid, quantity, customer, shippingLine, note }) {
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
    tags: ["Cash on Delivery", "COD", "RealOrder"],
    useCustomerDefaultAddress: false,
  };

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
