import { useEffect, useRef, useState } from "react";
import { useFetcher, useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { getShippingProfiles } from "../models/shippingZones.server";

export const loader = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);
  const url = new URL(request.url);
  const after = url.searchParams.get("after") || null;

  try {
    const { profiles, pageInfo } = await getShippingProfiles(admin, {
      first: 10,
      after,
    });
    return { profiles, pageInfo, error: null, shop: session.shop };
  } catch (error) {
    console.error("[real-order] Failed to load shipping profiles", error);
    return {
      profiles: [],
      pageInfo: { hasNextPage: false, endCursor: null },
      error: "Could not load shipping zones from Shopify. Please try again.",
      shop: session.shop,
    };
  }
};

function renderRate(rate) {
  return (
    <s-table-row key={rate.id}>
      <s-table-cell>{rate.name}</s-table-cell>
      <s-table-cell>
        <s-badge tone={rate.active ? "success" : "neutral"}>
          {rate.type.replace(/_/g, " ")}
        </s-badge>
      </s-table-cell>
      <s-table-cell>
        {rate.price === null
          ? rate.carrierService
            ? `Calculated by ${rate.carrierService}`
            : "Calculated"
          : `${rate.price.toFixed(2)} ${rate.currency || ""}`}
      </s-table-cell>
      <s-table-cell>
        {rate.conditions.length ? rate.conditions.join(", ") : "—"}
      </s-table-cell>
    </s-table-row>
  );
}

function renderZone(zone) {
  return (
    <s-box key={zone.id} padding="base" borderWidth="base" borderRadius="base">
      <s-stack direction="block" gap="tight">
        <s-heading>{zone.name}</s-heading>
        <s-paragraph>
          {zone.countries
            .map((c) => (c.restOfWorld ? "Rest of world" : c.name))
            .join(", ")}
        </s-paragraph>

        {zone.rates.length === 0 ? (
          <s-paragraph>No active shipping rates configured for this zone.</s-paragraph>
        ) : (
          <s-table>
            <s-table-header-row>
              <s-table-header>Rate name</s-table-header>
              <s-table-header>Type</s-table-header>
              <s-table-header>Price</s-table-header>
              <s-table-header>Conditions</s-table-header>
            </s-table-header-row>
            <s-table-body>{zone.rates.map(renderRate)}</s-table-body>
          </s-table>
        )}
      </s-stack>
    </s-box>
  );
}

function renderProfile(profile) {
  return (
    <s-section
      key={profile.id}
      heading={profile.default ? `${profile.name} (Default)` : profile.name}
    >
      <s-paragraph>
        <s-text emphasis="bold">Locations: </s-text>
        {profile.locations.length
          ? profile.locations.map((l) => l.name).join(", ")
          : "None assigned"}
      </s-paragraph>

      {profile.zones.length === 0 ? (
        <s-paragraph>This profile has no shipping zones yet.</s-paragraph>
      ) : (
        <s-stack direction="block" gap="base">
          {profile.zones.map(renderZone)}
        </s-stack>
      )}
    </s-section>
  );
}

export default function ShippingZones() {
  const initial = useLoaderData();
  const fetcher = useFetcher();
  const [profiles, setProfiles] = useState(initial.profiles);
  const [pageInfo, setPageInfo] = useState(initial.pageInfo);
  const lastMergedData = useRef(null);

  useEffect(() => {
    if (
      fetcher.data &&
      fetcher.state === "idle" &&
      fetcher.data !== lastMergedData.current
    ) {
      lastMergedData.current = fetcher.data;
      setProfiles((prev) => [...prev, ...fetcher.data.profiles]);
      setPageInfo(fetcher.data.pageInfo);
    }
  }, [fetcher.data, fetcher.state]);

  const loadMore = () => {
    if (!pageInfo.hasNextPage) return;
    fetcher.load(`/app/shipping-zones?after=${encodeURIComponent(pageInfo.endCursor)}`);
  };

  return (
    <s-page heading="Shipping Zones & Rates">
      <s-link slot="breadcrumb-actions" href="/app">
        Back
      </s-link>
      <s-paragraph>
        Pulled live from{" "}
        <s-link href={`https://${initial.shop}/admin/settings/shipping`} target="_blank">
          Settings &rsaquo; Shipping and delivery
        </s-link>
        . This is exactly what Real Order uses to offer shipping methods in
        the Cash on Delivery popup — nothing here is set by Real Order.
      </s-paragraph>

      {initial.error && <s-banner tone="critical">{initial.error}</s-banner>}

      {profiles.length === 0 && !initial.error ? (
        <s-section>
          <s-paragraph>
            No shipping profiles found. Add one in Settings &rsaquo; Shipping
            and delivery.
          </s-paragraph>
        </s-section>
      ) : (
        profiles.map(renderProfile)
      )}

      {pageInfo.hasNextPage && (
        <s-button onClick={loadMore} loading={fetcher.state !== "idle"}>
          Load more profiles
        </s-button>
      )}
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
