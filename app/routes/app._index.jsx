import { useEffect, useRef } from "react";
import { useLoaderData, useSearchParams } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import Chart from "chart.js/auto";
import { authenticate } from "../shopify.server";
import { getDashboardStats } from "../models/analytics.server";
import { listCodOrders } from "../models/codOrder.server";

const RANGE_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "month", label: "This month" },
  { value: "all", label: "All time" },
];

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const range = url.searchParams.get("range") || "7d";
  const validRange = RANGE_OPTIONS.some((o) => o.value === range) ? range : "7d";

  const [stats, recentOrders] = await Promise.all([
    getDashboardStats(session.shop, validRange),
    listCodOrders(session.shop, 5),
  ]);

  return { stats, recentOrders, shop: session.shop };
};

function formatMoney(amount, currency) {
  var value = Number(amount || 0).toFixed(2);
  return currency ? currency + " " + value : value;
}

function timeAgo(date) {
  var diffMs = Date.now() - new Date(date).getTime();
  var mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return mins + "m ago";
  var hours = Math.round(mins / 60);
  if (hours < 24) return hours + "h ago";
  return Math.round(hours / 24) + "d ago";
}

function kpiCard(opts) {
  return (
    <s-box
      key={opts.label}
      padding="base"
      borderWidth="base"
      borderRadius="base"
      background="base"
    >
      <s-stack direction="inline" gap="base" alignItems="center">
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "999px",
            background: opts.color + "22",
            color: opts.color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flex: "none",
          }}
        >
          {opts.icon}
        </div>
        <s-stack direction="block" gap="tight" style={{ flex: "1" }}>
          <s-text color="subdued">{opts.label}</s-text>
          <s-heading>{opts.value}</s-heading>
          <s-text color="subdued">{opts.subtitle}</s-text>
        </s-stack>
        <canvas
          ref={opts.registerSparkline}
          data-color={opts.color}
          data-values={JSON.stringify(opts.trend)}
          width="90"
          height="36"
          style={{ flex: "none" }}
        />
      </s-stack>
    </s-box>
  );
}

var ORDERS_COLOR = "#5B5FEF";
var REVENUE_COLOR = "#0EA5E9";
var DONUT_COLORS = ["#F97316", "#5B5FEF", "#22C55E", "#EF4444", "#A855F7"];

function normalize(values) {
  var max = Math.max(1, ...values);
  return values.map((v) => v / max);
}

// Orders and Revenue are on different scales, so rather than a dual-axis
// chart (two Y scales on one plot — easy to misread), both series are
// indexed to their own max (0–1) and share a single (hidden) axis; the real
// absolute totals are called out separately above the chart.
function renderTrendChart(days, currency, canvasRef) {
  var orderValues = days.map((d) => d.count);
  var revenueValues = days.map((d) => d.revenue);
  var totalOrders = orderValues.reduce((a, b) => a + b, 0);
  var totalRevenue = revenueValues.reduce((a, b) => a + b, 0);

  return (
    <s-stack direction="block" gap="tight">
      <s-stack direction="inline" gap="loose">
        <s-stack direction="inline" gap="tight" alignItems="center">
          <div style={{ width: "8px", height: "8px", borderRadius: "999px", background: ORDERS_COLOR, marginLeft: "5px", marginRight: "5px" }} />
          <s-text>Orders — {totalOrders} total</s-text>
        </s-stack>
        <s-stack direction="inline" gap="tight" alignItems="center">
          <div style={{ width: "8px", height: "8px", borderRadius: "999px", background: REVENUE_COLOR, marginLeft: "5px", marginRight: "5px" }} />
          <s-text>Revenue — {formatMoney(totalRevenue, currency)}</s-text>
        </s-stack>
      </s-stack>
      <div style={{ height: "300px" }}>
        <canvas ref={canvasRef} role="img" aria-label="Orders and revenue over the last 30 days, each indexed to its own maximum" />
      </div>
    </s-stack>
  );
}

function renderShippingDonut(methods, canvasRef) {
  if (methods.length === 0) {
    return <s-paragraph>No orders yet in this period.</s-paragraph>;
  }

  var total = methods.reduce((sum, m) => sum + m.count, 0);
  var segments = methods.map((m, i) => ({
    name: m.name,
    count: m.count,
    percent: total > 0 ? Math.round((m.count / total) * 100) : 0,
    color: DONUT_COLORS[i % DONUT_COLORS.length],
  }));

  return (
    <s-stack direction="inline" gap="base" alignItems="center" justifyContent="center">
      <div style={{ width: "60%", aspectRatio: "1 / 1" }}>
        <canvas ref={canvasRef} role="img" aria-label="Share of orders by shipping method" />
      </div>
      <s-stack direction="inline" gap="base" justifyContent="center" style={{ width: "40%", flexWrap: "wrap" }}>
        {segments.map((s) => (
          <s-stack key={s.name} direction="inline" gap="tight" alignItems="center">
            <div style={{ width: "8px", height: "8px", borderRadius: "999px", background: s.color, marginRight: "5px", flex: "none" }} />
            <s-text>{s.name}</s-text>
            <s-text color="subdued">{s.percent}%</s-text>
          </s-stack>
        ))}
      </s-stack>
    </s-stack>
  );
}

function buildSparkline(canvas) {
  var color = canvas.dataset.color;
  var values = JSON.parse(canvas.dataset.values);
  return new Chart(canvas, {
    type: "line",
    data: {
      labels: values.map((_, i) => i),
      datasets: [
        {
          data: values,
          borderColor: color,
          backgroundColor: color,
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.35,
        },
      ],
    },
    options: {
      responsive: false,
      animation: false,
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: { x: { display: false }, y: { display: false } },
    },
  });
}

function buildTrendChart(canvas, days) {
  return new Chart(canvas, {
    type: "line",
    data: {
      labels: days.map((d) => d.dayOfMonth),
      datasets: [
        {
          label: "Orders",
          data: normalize(days.map((d) => d.count)),
          borderColor: ORDERS_COLOR,
          backgroundColor: ORDERS_COLOR,
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.3,
        },
        {
          label: "Revenue",
          data: normalize(days.map((d) => d.revenue)),
          borderColor: REVENUE_COLOR,
          backgroundColor: REVENUE_COLOR,
          borderWidth: 2,
          borderDash: [4, 3],
          pointRadius: 0,
          tension: 0.3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      interaction: { mode: "index", intersect: false },
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: { x: { grid: { display: false } }, y: { display: false } },
    },
  });
}

function buildDonutChart(canvas, methods) {
  return new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: methods.map((m) => m.name),
      datasets: [
        {
          data: methods.map((m) => m.count),
          backgroundColor: methods.map((_, i) => DONUT_COLORS[i % DONUT_COLORS.length]),
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      cutout: "70%",
      plugins: { legend: { display: false } },
    },
  });
}

export default function Index() {
  const { stats, recentOrders, shop } = useLoaderData();
  const [searchParams, setSearchParams] = useSearchParams();
  const range = searchParams.get("range") || "7d";

  const counts = stats.last7Days.map((d) => d.count);
  const revenues = stats.last7Days.map((d) => d.revenue);
  const aovs = stats.last7Days.map((d) => d.avgOrderValue);

  const trendCanvasRef = useRef(null);
  const donutCanvasRef = useRef(null);
  const sparklineCanvases = useRef([]);
  sparklineCanvases.current = [];

  function registerSparkline(el) {
    if (el) sparklineCanvases.current.push(el);
  }

  useEffect(() => {
    var charts = sparklineCanvases.current.map(buildSparkline);
    if (trendCanvasRef.current) charts.push(buildTrendChart(trendCanvasRef.current, stats.last30Days));
    if (donutCanvasRef.current) charts.push(buildDonutChart(donutCanvasRef.current, stats.topShippingMethods));
    return () => charts.forEach((c) => c.destroy());
  }, [stats]);

  return (
    <s-page heading="Real Order — Cash on Delivery" inlineSize="large">
      <s-section>
        <s-stack direction="inline" gap="base" alignItems="center" justifyContent="space-between">
          <h1 style={{ fontSize: "24px", fontWeight: "700", margin: 0 }}>Welcome back</h1>
          <div style={{ width: "100%", maxWidth: "300px" }}>
            <s-select
              label="Date range"
              labelAccessibilityVisibility="exclusive"
              value={range}
              onChange={(e) => setSearchParams({ range: e.target.value })}
            >
              {RANGE_OPTIONS.map((o) => (
                <s-option key={o.value} value={o.value}>
                  {o.label}
                </s-option>
              ))}
            </s-select>
          </div>
        </s-stack>
      </s-section>

      <s-section>
        <s-grid gridTemplateColumns="1fr 1fr 1fr 1fr" gap="base">
          {kpiCard({
            label: "Total orders",
            value: String(stats.totalOrders),
            subtitle: stats.ordersToday + " today",
            color: "#5B5FEF",
            trend: counts,
            icon: "🛍️",
            registerSparkline,
          })}
          {kpiCard({
            label: "Total revenue",
            value: formatMoney(stats.totalRevenue, stats.currency),
            subtitle: stats.totalOrders + " orders",
            color: "#22C55E",
            trend: revenues,
            icon: "💰",
            registerSparkline,
          })}
          {kpiCard({
            label: "Orders this week",
            value: String(stats.ordersThisWeek),
            subtitle: "last 7 days",
            color: "#F97316",
            trend: counts,
            icon: "📦",
            registerSparkline,
          })}
          {kpiCard({
            label: "Average order value",
            value: formatMoney(stats.averageOrderValue, stats.currency),
            subtitle: "per order",
            color: "#A855F7",
            trend: aovs,
            icon: "📈",
            registerSparkline,
          })}
        </s-grid>
      </s-section>

      <s-section>
        <s-grid gridTemplateColumns="7fr 3fr" gap="base">
          <s-box padding="base" borderWidth="base" borderRadius="base" background="base">
            <s-stack direction="block" gap="base">
              <s-heading>Order volume &amp; revenue (30 days)</s-heading>
              {renderTrendChart(stats.last30Days, stats.currency, trendCanvasRef)}
            </s-stack>
          </s-box>
          <s-box padding="base" borderWidth="base" borderRadius="base" background="base">
            <s-stack direction="block" gap="base">
              <s-heading>Top shipping methods</s-heading>
              {renderShippingDonut(stats.topShippingMethods, donutCanvasRef)}
            </s-stack>
          </s-box>
        </s-grid>
      </s-section>

      <s-section heading="Recent orders">
        <s-stack direction="inline" gap="base" justifyContent="end">
          <s-link href="/app/orders">View all orders</s-link>
        </s-stack>
        {recentOrders.length === 0 ? (
          <s-paragraph>No orders yet.</s-paragraph>
        ) : (
          <s-table>
            <s-table-header-row>
              <s-table-header>Order</s-table-header>
              <s-table-header>Customer</s-table-header>
              <s-table-header>Phone</s-table-header>
              <s-table-header>Amount</s-table-header>
              <s-table-header>Shipping method</s-table-header>
              <s-table-header>Time</s-table-header>
            </s-table-header-row>
            <s-table-body>
              {recentOrders.map((o) => (
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
                  <s-table-cell>{formatMoney(o.total, o.currency)}</s-table-cell>
                  <s-table-cell>{o.shippingMethod}</s-table-cell>
                  <s-table-cell>{timeAgo(o.createdAt)}</s-table-cell>
                </s-table-row>
              ))}
            </s-table-body>
          </s-table>
        )}
      </s-section>

      <s-section heading="Manage">
        <s-stack direction="inline" gap="base">
          <s-link href="/app/settings">Settings</s-link>
          <s-link href="/app/provinces">District &amp; Thana list</s-link>
          <s-link href="/app/orders">COD orders</s-link>
        </s-stack>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
