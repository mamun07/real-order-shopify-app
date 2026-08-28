import { useEffect, useMemo, useState } from "react";
import { useFetcher, useLoaderData, useSearchParams } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import {
  getProvinces,
  addProvince,
  renameProvince,
  deleteProvince,
  addCity,
  renameCity,
  deleteCity,
} from "../models/provinces.server";

const DISTRICT_PAGE_SIZE = 15;
const THANA_PAGE_SIZE = 10;

function cc(value) {
  return String(value || "BD")
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 2) || "BD";
}

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const country = cc(new URL(request.url).searchParams.get("country"));
  const provinces = await getProvinces(session.shop, country);
  return { provinces, country };
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");
  const country = cc(formData.get("country"));

  try {
    switch (intent) {
      case "addProvince": {
        const name = formData.get("name");
        if (name?.trim()) await addProvince(session.shop, country, name);
        break;
      }
      case "renameProvince": {
        await renameProvince(session.shop, formData.get("provinceId"), formData.get("name"));
        break;
      }
      case "deleteProvince": {
        await deleteProvince(session.shop, formData.get("provinceId"));
        break;
      }
      case "addCity": {
        const name = formData.get("name");
        if (name?.trim()) {
          await addCity(session.shop, formData.get("provinceId"), name);
        }
        break;
      }
      case "renameCity": {
        await renameCity(session.shop, formData.get("cityId"), formData.get("name"));
        break;
      }
      case "deleteCity": {
        await deleteCity(session.shop, formData.get("cityId"));
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error("[real-order] District/thana update failed", error);
    return { error: error.message || "Update failed" };
  }

  const provinces = await getProvinces(session.shop, country);
  return { provinces, country };
};

// Native buttons — Polaris <s-button>'s onClick doesn't reliably fire under
// React 18.
function PagerButton({ disabled, onClick, children }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        padding: "6px 14px",
        borderRadius: 8,
        border: "1px solid #c9cccf",
        background: "#fff",
        font: "inherit",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  );
}

function Pager({ page, pageCount, total, rangeStart, rangeEnd, onPage }) {
  if (pageCount <= 1) return null;
  return (
    <div
      style={{
        display: "flex",
        gap: "12px",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <PagerButton disabled={page <= 1} onClick={() => onPage(page - 1)}>
        Previous
      </PagerButton>
      <s-text color="subdued">
        {rangeStart}–{rangeEnd} of {total}
      </s-text>
      <PagerButton disabled={page >= pageCount} onClick={() => onPage(page + 1)}>
        Next
      </PagerButton>
    </div>
  );
}

function usePagination(itemCount, pageSize) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(itemCount / pageSize));

  useEffect(() => {
    setPage((p) => Math.min(p, pageCount));
  }, [pageCount]);

  const start = (page - 1) * pageSize;
  return {
    page,
    pageCount,
    setPage: (p) => setPage(Math.max(1, Math.min(pageCount, p))),
    slice: (arr) => arr.slice(start, start + pageSize),
    rangeStart: itemCount === 0 ? 0 : start + 1,
    rangeEnd: Math.min(start + pageSize, itemCount),
  };
}

function ProvinceModal({ province, submit }) {
  const modalId = "province-modal-" + province.id;
  const pager = usePagination(province.cities.length, THANA_PAGE_SIZE);
  const pageCities = pager.slice(province.cities);

  return (
    <s-modal id={modalId} heading={province.name}>
      <s-stack direction="block" gap="base">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(new FormData(e.currentTarget));
          }}
        >
          <input type="hidden" name="intent" value="renameProvince" />
          <input type="hidden" name="provinceId" value={province.id} />
          <s-stack direction="inline" gap="tight">
            <s-text-field name="name" label="District name" defaultValue={province.name} />
            <s-button type="submit" variant="tertiary">
              Rename
            </s-button>
          </s-stack>
        </form>

        {province.cities.length === 0 ? (
          <s-paragraph>No thanas yet.</s-paragraph>
        ) : (
          <s-stack direction="block" gap="base">
            <s-table>
              <s-table-header-row>
                <s-table-header>Thana</s-table-header>
                <s-table-header></s-table-header>
              </s-table-header-row>
              <s-table-body>
                {pageCities.map((city) => (
                  <s-table-row key={city.id}>
                    <s-table-cell>{city.name}</s-table-cell>
                    <s-table-cell>
                      <s-button
                        variant="tertiary"
                        tone="critical"
                        onClick={() => submit({ intent: "deleteCity", cityId: city.id })}
                      >
                        Delete
                      </s-button>
                    </s-table-cell>
                  </s-table-row>
                ))}
              </s-table-body>
            </s-table>
            <Pager
              page={pager.page}
              pageCount={pager.pageCount}
              total={province.cities.length}
              rangeStart={pager.rangeStart}
              rangeEnd={pager.rangeEnd}
              onPage={pager.setPage}
            />
          </s-stack>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            submit(new FormData(form));
            form.reset();
          }}
        >
          <input type="hidden" name="intent" value="addCity" />
          <input type="hidden" name="provinceId" value={province.id} />
          <s-stack direction="inline" gap="tight">
            <s-text-field name="name" label="Thana name" placeholder="Add a thana" />
            <s-button type="submit" variant="tertiary">
              Add thana
            </s-button>
          </s-stack>
        </form>
      </s-stack>

      <s-button slot="primary-action" variant="primary" command="--hide" commandFor={modalId}>
        Save
      </s-button>
      <s-button slot="secondary-actions" command="--hide" commandFor={modalId}>
        Cancel
      </s-button>
    </s-modal>
  );
}

export default function Provinces() {
  const initial = useLoaderData();
  const fetcher = useFetcher();
  const provinces = fetcher.data?.provinces || initial.provinces;
  const country = fetcher.data?.country || initial.country || "BD";

  const [, setParams] = useSearchParams();
  const [countryInput, setCountryInput] = useState(country);
  useEffect(() => setCountryInput(country), [country]);

  const applyCountry = (value) => {
    const next = String(value || "BD")
      .toUpperCase()
      .replace(/[^A-Z]/g, "")
      .slice(0, 2);
    if (next && next.length === 2) {
      setParams(next === "BD" ? {} : { country: next });
    }
  };

  // Every mutation carries the country currently being edited.
  const submit = (data) => {
    if (data instanceof FormData) {
      if (!data.has("country")) data.set("country", country);
    } else {
      data = { country, ...data };
    }
    return fetcher.submit(data, { method: "POST" });
  };

  const pager = usePagination(provinces.length, DISTRICT_PAGE_SIZE);
  const pageProvinces = useMemo(() => pager.slice(provinces), [pager, provinces]);

  return (
    <s-page heading="District & Thana list" inlineSize="large">
      <s-link slot="breadcrumb-actions" href="/app">
        Back
      </s-link>
      <s-paragraph>
        These lists power the address dropdowns in the Cash on Delivery popup.
        When a shopper picks a country that has a list here, the popup shows a
        required District dropdown (and Thana cascade); countries with no list
        get plain text address fields.
      </s-paragraph>

      {fetcher.data?.error && (
        <s-banner tone="critical">{fetcher.data.error}</s-banner>
      )}

      <s-section heading="Country">
        <s-stack direction="inline" gap="base" alignItems="end">
          <div style={{ maxWidth: 120 }}>
            <s-text-field
              label="Country code (ISO-2)"
              value={countryInput}
              onChange={(e) => setCountryInput(e.target.value)}
            />
          </div>
          <s-button onClick={() => applyCountry(countryInput)}>
            Edit this country
          </s-button>
          <s-text tone="subdued">
            Now editing: <s-text emphasis="bold">{country}</s-text>
          </s-text>
        </s-stack>
      </s-section>

      <s-section heading="Add a district">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            submit(new FormData(form));
            form.reset();
          }}
        >
          <input type="hidden" name="intent" value="addProvince" />
          <input type="hidden" name="country" value={country} />
          <s-stack direction="inline" gap="base">
            <s-text-field
              name="name"
              label="District name"
              labelAccessibilityVisibility="exclusive"
              placeholder="District name"
            />
            <s-button type="submit">Add district</s-button>
          </s-stack>
        </form>
      </s-section>

      <s-section heading="Districts">
        {provinces.length === 0 ? (
          <s-paragraph>No districts yet — add one above.</s-paragraph>
        ) : (
          <s-stack direction="block" gap="base">
            <s-table>
              <s-table-header-row>
                <s-table-header>District</s-table-header>
                <s-table-header>Thanas</s-table-header>
                <s-table-header></s-table-header>
              </s-table-header-row>
              <s-table-body>
                {pageProvinces.map((province) => (
                  <s-table-row key={province.id}>
                    <s-table-cell>{province.name}</s-table-cell>
                    <s-table-cell>{province.cities.length}</s-table-cell>
                    <s-table-cell>
                      <s-stack direction="inline" gap="tight">
                        <s-button
                          variant="tertiary"
                          command="--show"
                          commandFor={"province-modal-" + province.id}
                        >
                          Edit
                        </s-button>
                        <s-button
                          variant="tertiary"
                          tone="critical"
                          onClick={() =>
                            submit({ intent: "deleteProvince", provinceId: province.id })
                          }
                        >
                          Delete
                        </s-button>
                      </s-stack>
                    </s-table-cell>
                  </s-table-row>
                ))}
              </s-table-body>
            </s-table>
            <Pager
              page={pager.page}
              pageCount={pager.pageCount}
              total={provinces.length}
              rangeStart={pager.rangeStart}
              rangeEnd={pager.rangeEnd}
              onPage={pager.setPage}
            />
          </s-stack>
        )}
      </s-section>

      {provinces.map((province) => (
        <ProvinceModal key={province.id} province={province} submit={submit} />
      ))}
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
