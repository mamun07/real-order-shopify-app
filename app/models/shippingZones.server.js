const DELIVERY_ZONE_COUNTRIES_QUERY = `#graphql
  query codDeliveryZoneCountries($first: Int!, $after: String) {
    deliveryProfiles(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          profileLocationGroups {
            locationGroupZones(first: 10) {
              edges {
                node {
                  zone {
                    countries {
                      name
                      code {
                        countryCode
                        restOfWorld
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

/**
 * The unique set of countries covered by any of the merchant's shipping
 * zones — used to populate the storefront popup's Country field so shoppers
 * only ever pick a country the merchant actually ships to. Deliberately a
 * minimal query (just zone.countries, no locations/rates) to stay well
 * under the Admin API's single-query cost limit — the fuller
 * profile/zone/rate query this app used to also need (for an admin
 * dashboard page that's since been removed) was expensive enough to get
 * rejected with "Query cost ... exceeds the single query max cost limit".
 */
export async function getShippingCountries(admin) {
  const seen = new Map();
  let after = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const response = await admin.graphql(DELIVERY_ZONE_COUNTRIES_QUERY, {
      variables: { first: 10, after },
    });
    const json = await response.json();

    if (json.errors?.length) {
      throw new Error(json.errors.map((e) => e.message).join(", "));
    }

    const connection = json?.data?.deliveryProfiles;
    if (!connection) throw new Error("No deliveryProfiles data returned");

    for (const { node: profile } of connection.edges) {
      for (const group of profile.profileLocationGroups || []) {
        for (const { node: zoneEdge } of group.locationGroupZones.edges) {
          for (const country of zoneEdge.zone.countries) {
            if (country.code?.restOfWorld) continue;
            const code = country.code?.countryCode;
            if (!code || seen.has(code)) continue;
            seen.set(code, { code, name: country.name });
          }
        }
      }
    }

    hasNextPage = connection.pageInfo.hasNextPage;
    after = connection.pageInfo.endCursor;
  }

  return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name));
}
