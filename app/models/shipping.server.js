const CART_CREATE = `#graphql
  mutation codCartCreate($lines: [CartLineInput!]!) {
    cartCreate(input: { lines: $lines }) {
      cart { id }
      userErrors { field message }
    }
  }
`;

const CART_DELIVERY_ADDRESSES_ADD = `#graphql
  mutation codCartDeliveryAddressesAdd($cartId: ID!, $addresses: [CartSelectableAddressInput!]!) {
    cartDeliveryAddressesAdd(cartId: $cartId, addresses: $addresses) {
      cart {
        id
        cost {
          subtotalAmount { amount currencyCode }
        }
        deliveryGroups(first: 5) {
          nodes {
            deliveryOptions {
              handle
              title
              description
              estimatedCost { amount currencyCode }
            }
          }
        }
      }
      userErrors { field message }
    }
  }
`;

/**
 * Ask Shopify's own Storefront Cart API for the real, live shipping options
 * for a variant/quantity/address combination — the same delivery-rate engine
 * Shopify checkout itself uses, computed from the merchant's actual shipping
 * zones/rates (Settings > Shipping and delivery). No app-invented rates.
 *
 * Uses cartCreate + cartDeliveryAddressesAdd rather than the deprecated
 * cartCreate(buyerIdentity.deliveryAddressPreferences) field, which does not
 * reliably populate deliveryGroups.
 */
export async function getLiveShippingOptions({
  storefront,
  variantGid,
  quantity,
  address,
  countryCode,
}) {
  const createResponse = await storefront.graphql(CART_CREATE, {
    variables: { lines: [{ merchandiseId: variantGid, quantity }] },
  });
  const createJson = await createResponse.json();
  const cartId = createJson?.data?.cartCreate?.cart?.id;
  const createErrors = createJson?.data?.cartCreate?.userErrors || [];

  if (!cartId || createErrors.length) {
    throw new Error(
      createErrors.map((e) => e.message).join(", ") || "cartCreate failed",
    );
  }

  const addressResponse = await storefront.graphql(CART_DELIVERY_ADDRESSES_ADD, {
    variables: {
      cartId,
      addresses: [
        {
          selected: true,
          oneTimeUse: true,
          address: {
            deliveryAddress: {
              address1: address.address1,
              city: address.city,
              provinceCode: address.provinceCode || undefined,
              zip: address.zip || undefined,
              countryCode,
            },
          },
        },
      ],
    },
  });
  const addressJson = await addressResponse.json();
  const cart = addressJson?.data?.cartDeliveryAddressesAdd?.cart;
  const addressErrors = addressJson?.data?.cartDeliveryAddressesAdd?.userErrors || [];

  if (!cart || addressErrors.length) {
    throw new Error(
      addressErrors.map((e) => e.message).join(", ") || "cartDeliveryAddressesAdd failed",
    );
  }

  const options = cart.deliveryGroups.nodes.flatMap((g) => g.deliveryOptions);

  return {
    subtotal: cart.cost.subtotalAmount,
    options: options.map((o) => ({
      handle: o.handle,
      title: o.title || "Shipping",
      description: o.description,
      amount: Number(o.estimatedCost.amount),
      currencyCode: o.estimatedCost.currencyCode,
    })),
  };
}
