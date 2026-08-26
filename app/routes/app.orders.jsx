import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { listCodOrders } from "../models/codOrder.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const orders = await listCodOrders(session.shop, 50);
  return { orders, shop: session.shop };
};

export default function Orders() {
  const { orders, shop } = useLoaderData();

  return (
    <s-page heading="Cash on Delivery orders">
      <s-section>
        {orders.length === 0 ? (
          <s-paragraph>
            No Cash on Delivery orders yet. Once a shopper completes an order
            through the popup, it&apos;ll show up here.
          </s-paragraph>
        ) : (
          <s-table>
            <s-table-header-row>
              <s-table-header>Order</s-table-header>
              <s-table-header>Customer</s-table-header>
              <s-table-header>Phone</s-table-header>
              <s-table-header>Address</s-table-header>
              <s-table-header>Shipping method</s-table-header>
              <s-table-header>Total</s-table-header>
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
                    {new Date(o.createdAt).toLocaleString()}
                  </s-table-cell>
                </s-table-row>
              ))}
            </s-table-body>
          </s-table>
        )}
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
