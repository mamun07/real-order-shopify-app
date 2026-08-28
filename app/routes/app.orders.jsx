import { useLoaderData, useSearchParams } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { listCodOrdersPage } from "../models/codOrder.server";

const PAGE_SIZE = 20;

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page")) || 1;

  const result = await listCodOrdersPage(session.shop, { page, pageSize: PAGE_SIZE });
  return { ...result, shop: session.shop };
};

export default function Orders() {
  const { orders, total, page, pageSize, pageCount, shop } = useLoaderData();
  const [, setSearchParams] = useSearchParams();

  const goToPage = (next) => {
    setSearchParams(next <= 1 ? {} : { page: String(next) });
  };

  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  return (
    <s-page heading="Cash on Delivery orders" inlineSize="large">
      <s-link slot="breadcrumb-actions" href="/app">
        Back
      </s-link>
      <s-section>
        {total === 0 ? (
          <s-paragraph>
            No Cash on Delivery orders yet. Once a shopper completes an order
            through the popup, it&apos;ll show up here.
          </s-paragraph>
        ) : (
          <s-stack direction="block" gap="base">
            <s-table>
              <s-table-header-row>
                <s-table-header>Order</s-table-header>
                <s-table-header>Customer</s-table-header>
                <s-table-header>Phone</s-table-header>
                <s-table-header>Address</s-table-header>
                <s-table-header>Shipping method</s-table-header>
                <s-table-header>Total</s-table-header>
                <s-table-header>Advance / Balance</s-table-header>
                <s-table-header>Placed</s-table-header>
              </s-table-header-row>
              <s-table-body>
                {orders.map((o) => (
                  <s-table-row key={o.id}>
                    <s-table-cell>
                      <s-link
                        href={`https://${shop}/admin/orders/${o.orderId.split("/").pop()}`}
                        target="_blank"
                      >
                        {o.orderName}
                      </s-link>
                    </s-table-cell>
                    <s-table-cell>{o.customerName}</s-table-cell>
                    <s-table-cell>{o.phone}</s-table-cell>
                    <s-table-cell>
                      {[o.address, o.city, o.province, o.zip]
                        .filter(Boolean)
                        .join(", ")}
                    </s-table-cell>
                    <s-table-cell>{o.shippingMethod}</s-table-cell>
                    <s-table-cell>
                      {o.currency} {o.total.toFixed(2)}
                    </s-table-cell>
                    <s-table-cell>
                      {o.advanceAmount != null
                        ? `${o.currency} ${o.advanceAmount.toFixed(2)} / ${o.currency} ${(o.codBalance ?? 0).toFixed(2)}`
                        : "—"}
                    </s-table-cell>
                    <s-table-cell>
                      {new Date(o.createdAt).toLocaleString()}
                    </s-table-cell>
                  </s-table-row>
                ))}
              </s-table-body>
            </s-table>

            <div
              style={{
                display: "flex",
                gap: "12px",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <PagerButton disabled={page <= 1} onClick={() => goToPage(page - 1)}>
                Previous
              </PagerButton>
              <s-text color="subdued">
                {rangeStart}–{rangeEnd} of {total}
              </s-text>
              <PagerButton
                disabled={page >= pageCount}
                onClick={() => goToPage(page + 1)}
              >
                Next
              </PagerButton>
            </div>
          </s-stack>
        )}
      </s-section>
    </s-page>
  );
}

// Native button — Polaris <s-button>'s onClick doesn't reliably fire under
// React 18, so the pager uses a plain styled button instead.
export function PagerButton({ disabled, onClick, children }) {
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

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
