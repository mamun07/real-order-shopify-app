const CART_CREATE = `#graphql
  mutation codCartCreate($lines: [CartLineInput!]!) {
    cartCreate(input: { lines: $lines }) {
      cart { id }
      userErrors { field message }
    }
  }
`;

const CART_CREATE_LOCALIZED = `#graphql
  mutation codCartCreateLocalized($lines: [CartLineInput!]!, $country: CountryCode!) @inContext(country: $country) {
    cartCreate(input: { lines: $lines }) {
      cart { id }
      userErrors { field message }
    }
  }
`;

const CART_DELIVERY_ADDRESSES_ADD_FIELDS = `
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
`;

const CART_DELIVERY_ADDRESSES_ADD = `#graphql
  mutation codCartDeliveryAddressesAdd($cartId: ID!, $addresses: [CartSelectableAddressInput!]!) {
    cartDeliveryAddressesAdd(cartId: $cartId, addresses: $addresses) {
      ${CART_DELIVERY_ADDRESSES_ADD_FIELDS}
    }
  }
`;

const CART_DELIVERY_ADDRESSES_ADD_LOCALIZED = `#graphql
  mutation codCartDeliveryAddressesAddLocalized($cartId: ID!, $addresses: [CartSelectableAddressInput!]!, $country: CountryCode!) @inContext(country: $country) {
    cartDeliveryAddressesAdd(cartId: $cartId, addresses: $addresses) {
      ${CART_DELIVERY_ADDRESSES_ADD_FIELDS}
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
 *
 * `presentmentCountry` runs both mutations with the `@inContext(country:
 * ...)` directive, which makes Shopify convert every Money field in the
 * response into that country's local (Markets) currency — the same
 * conversion the storefront itself uses — so the popup can show the
 * product price, shipping cost and total in the currency the shopper is
 * actually browsing in (their storefront currency-switcher selection),
 * NOT the delivery destination's currency. Those are independent: a
 * shopper browsing in CAD can still ship to Bangladesh, so `countryCode`
 * (the delivery address, used to match the right shipping zone) and
 * `presentmentCountry` (the currency to display, from the shopper's active
 * market) are separate arguments. Left `undefined` for the order-creation
 * verification lookup, since the amount handed to `shippingLine.price` on
 * the actual Shopify order must stay in the shop's base currency;
 * `@inContext` can't be toggled by a variable, so two separate query
 * strings are used instead of parameterizing the directive.
 */
export async function getLiveShippingOptions({
  storefront,
  variantGid,
  quantity,
  address,
  countryCode,
  presentmentCountry,
}) {
  const localizeCurrency = !!presentmentCountry;
  const createQuery = localizeCurrency ? CART_CREATE_LOCALIZED : CART_CREATE;
  const createVariables = { lines: [{ merchandiseId: variantGid, quantity }] };
  if (localizeCurrency) createVariables.country = presentmentCountry;

  const createResponse = await storefront.graphql(createQuery, {
    variables: createVariables,
  });
  const createJson = await createResponse.json();
  const cartId = createJson?.data?.cartCreate?.cart?.id;
  const createErrors = createJson?.data?.cartCreate?.userErrors || [];

  if (!cartId || createErrors.length) {
    throw new Error(
      createErrors.map((e) => e.message).join(", ") || "cartCreate failed",
    );
  }

  const addressQuery = localizeCurrency
    ? CART_DELIVERY_ADDRESSES_ADD_LOCALIZED
    : CART_DELIVERY_ADDRESSES_ADD;
  const addressVariables = {
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
  };
  if (localizeCurrency) addressVariables.country = presentmentCountry;

  const addressResponse = await storefront.graphql(addressQuery, {
    variables: addressVariables,
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
