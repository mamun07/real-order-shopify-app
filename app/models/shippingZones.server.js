const DELIVERY_PROFILES_QUERY = `#graphql
  query codDeliveryProfiles($first: Int!, $after: String) {
    deliveryProfiles(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          name
          default
          active
          profileLocationGroups {
            locationGroup {
              id
              locations(first: 50) {
                edges {
                  node {
                    id
                    name
                  }
                }
              }
            }
            locationGroupZones(first: 50) {
              edges {
                node {
                  zone {
                    id
                    name
                    countries {
                      name
                      code {
                        countryCode
                        restOfWorld
                      }
                      provinces {
                        code
                        name
                      }
                    }
                  }
                  methodDefinitions(first: 50) {
                    edges {
                      node {
                        id
                        name
                        description
                        active
                        methodConditions {
                          field
                          operator
                          conditionCriteria {
                            __typename
                            ... on Weight {
                              value
                              unit
                            }
                            ... on MoneyV2 {
                              amount
                              currencyCode
                            }
                          }
                        }
                        rateProvider {
                          __typename
                          ... on DeliveryRateDefinition {
                            price {
                              amount
                              currencyCode
                            }
                          }
                          ... on DeliveryParticipant {
                            carrierService {
                              name
                            }
                            fixedFee {
                              amount
                              currencyCode
                            }
                            percentageOfRateFee
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

function describeCondition(condition) {
  const field = condition.field === "TOTAL_WEIGHT" ? "Weight" : "Order total";
  const operator = {
    GREATER_THAN_OR_EQUAL_TO: "≥",
    LESS_THAN_OR_EQUAL_TO: "≤",
  }[condition.operator] || condition.operator;
  const criteria = condition.conditionCriteria;
  let value = "";
  if (criteria?.__typename === "Weight") {
    value = `${criteria.value} ${criteria.unit}`;
  } else if (criteria?.__typename === "MoneyV2") {
    value = `${criteria.amount} ${criteria.currencyCode}`;
  }
  return `${field} ${operator} ${value}`.trim();
}

function mapRate(method) {
  const conditions = (method.methodConditions || []).map(describeCondition);
  const provider = method.rateProvider;

  if (provider?.__typename === "DeliveryParticipant") {
    return {
      id: method.id,
      name: method.name,
      description: method.description || null,
      active: method.active,
      type: "CARRIER_CALCULATED",
      carrierService: provider.carrierService?.name || null,
      price: provider.fixedFee ? Number(provider.fixedFee.amount) : null,
      currency: provider.fixedFee?.currencyCode || null,
      percentageOfRateFee: provider.percentageOfRateFee,
      conditions,
    };
  }

  const hasWeightCondition = (method.methodConditions || []).some(
    (c) => c.field === "TOTAL_WEIGHT",
  );
  const hasPriceCondition = (method.methodConditions || []).some(
    (c) => c.field === "TOTAL_PRICE",
  );
  const type = hasWeightCondition
    ? "WEIGHT_BASED"
    : hasPriceCondition
      ? "PRICE_BASED"
      : "FLAT";

  return {
    id: method.id,
    name: method.name,
    description: method.description || null,
    active: method.active,
    type,
    price: provider?.price ? Number(provider.price.amount) : null,
    currency: provider?.price?.currencyCode || null,
    conditions,
  };
}

function mapZone(node) {
  const rates = node.methodDefinitions.edges.map(({ node: method }) => mapRate(method));

  return {
    id: node.zone.id,
    name: node.zone.name,
    countries: node.zone.countries.map((c) => ({
      code: c.code?.restOfWorld ? "ROW" : c.code?.countryCode || null,
      name: c.name,
      restOfWorld: !!c.code?.restOfWorld,
      provinces: c.provinces.map((p) => ({ code: p.code, name: p.name })),
    })),
    rates,
  };
}

function mapProfile(node) {
  const locations = [];
  const zones = [];

  for (const group of node.profileLocationGroups || []) {
    for (const { node: location } of group.locationGroup.locations.edges) {
      if (!locations.some((l) => l.id === location.id)) {
        locations.push({ id: location.id, name: location.name });
      }
    }
    for (const { node: zoneNode } of group.locationGroupZones.edges) {
      zones.push(mapZone(zoneNode));
    }
  }

  return {
    id: node.id,
    name: node.name,
    default: node.default,
    active: node.active,
    locations,
    zones,
  };
}

/**
 * The merchant's real shipping profiles, zones and rates (Settings >
 * Shipping and delivery) via the Admin GraphQL API. Supports cursor
 * pagination over profiles; nested zones/rates/locations are fetched in
 * full per profile (shops rarely have more than a handful of each).
 */
export async function getShippingProfiles(admin, { first = 10, after = null } = {}) {
  const response = await admin.graphql(DELIVERY_PROFILES_QUERY, {
    variables: { first, after },
  });
  const json = await response.json();

  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join(", "));
  }

  const connection = json?.data?.deliveryProfiles;
  if (!connection) {
    throw new Error("No deliveryProfiles data returned");
  }

  return {
    profiles: connection.edges.map(({ node }) => mapProfile(node)),
    pageInfo: connection.pageInfo,
  };
}

/**
 * The unique set of countries covered by any of the merchant's active
 * shipping zones — used to populate the storefront popup's Country field so
 * shoppers only ever pick a country the merchant actually ships to (rather
 * than every country enabled in Shopify Markets, which may not have a
 * matching shipping zone yet).
 */
export async function getShippingCountries(admin) {
  const seen = new Map();
  let after = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const { profiles, pageInfo } = await getShippingProfiles(admin, {
      first: 25,
      after,
    });

    for (const profile of profiles) {
      for (const zone of profile.zones) {
        for (const country of zone.countries) {
          if (country.restOfWorld) continue;
          if (!country.code) continue;
          if (!seen.has(country.code)) {
            seen.set(country.code, { code: country.code, name: country.name });
          }
        }
      }
    }

    hasNextPage = pageInfo.hasNextPage;
    after = pageInfo.endCursor;
  }

  return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name));
}
