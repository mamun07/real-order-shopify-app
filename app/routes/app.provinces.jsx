import { useFetcher, useLoaderData } from "react-router";
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

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const provinces = await getProvinces(session.shop);
  return { provinces };
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  try {
    switch (intent) {
      case "addProvince": {
        const name = formData.get("name");
        if (name?.trim()) await addProvince(session.shop, name);
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

  const provinces = await getProvinces(session.shop);
  return { provinces };
};

function renderProvinceModal(province, submit) {
  const modalId = "province-modal-" + province.id;

  return (
    <s-modal key={modalId} id={modalId} heading={province.name}>
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
            <s-text-field
              name="name"
              label="District name"
              defaultValue={province.name}
            />
            <s-button type="submit" variant="tertiary">
              Rename
            </s-button>
          </s-stack>
        </form>

        {province.cities.length === 0 ? (
          <s-paragraph>No thanas yet.</s-paragraph>
        ) : (
          <s-table>
            <s-table-header-row>
              <s-table-header>Thana</s-table-header>
              <s-table-header></s-table-header>
            </s-table-header-row>
            <s-table-body>
              {province.cities.map((city) => (
                <s-table-row key={city.id}>
                  <s-table-cell>{city.name}</s-table-cell>
                  <s-table-cell>
                    <s-button
                      variant="tertiary"
                      tone="critical"
                      onClick={() =>
                        submit({ intent: "deleteCity", cityId: city.id })
                      }
                    >
                      Delete
                    </s-button>
                  </s-table-cell>
                </s-table-row>
              ))}
            </s-table-body>
          </s-table>
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

      <s-button
        slot="primary-action"
        variant="primary"
        command="--hide"
        commandFor={modalId}
      >
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

  const submit = (data) => fetcher.submit(data, { method: "POST" });

  return (
    <s-page heading="District & Thana list" inlineSize="large">
      <s-link slot="breadcrumb-actions" href="/app">
        Back
      </s-link>
      <s-paragraph>
        This list powers the District and Thana dropdowns in the Cash on
        Delivery popup for Bangladesh addresses. It doesn&apos;t affect any
        other country — shoppers selecting another country get a plain text
        address field instead.
      </s-paragraph>

      {fetcher.data?.error && (
        <s-banner tone="critical">{fetcher.data.error}</s-banner>
      )}

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
          <s-stack direction="inline" gap="base">
            <s-text-field name="name" label="District name" labelAccessibilityVisibility="exclusive" placeholder="District name" />
            <s-button type="submit">Add district</s-button>
          </s-stack>
        </form>
      </s-section>

      <s-section heading="Districts">
        {provinces.length === 0 ? (
          <s-paragraph>No districts yet — add one above.</s-paragraph>
        ) : (
          <s-table>
            <s-table-header-row>
              <s-table-header>District</s-table-header>
              <s-table-header>Thanas</s-table-header>
              <s-table-header></s-table-header>
            </s-table-header-row>
            <s-table-body>
              {provinces.map((province) => (
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
        )}
      </s-section>

      {provinces.map((province) => renderProvinceModal(province, submit))}
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
