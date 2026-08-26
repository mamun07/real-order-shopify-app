import db from "../db.server";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function rangeStart(range, today) {
  const d = new Date(today);
  switch (range) {
    case "today":
      return d;
    case "30d":
      d.setDate(d.getDate() - 29);
      return d;
    case "month":
      d.setDate(1);
      return d;
    case "all":
      return null;
    case "7d":
    default:
      d.setDate(d.getDate() - 6);
      return d;
  }
}

function bucketByDay(orders, today, numDays) {
  const days = [];
  for (let i = numDays - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    days.push({ date, count: 0, revenue: 0 });
  }

  const earliest = days[0].date;
  for (const order of orders) {
    const orderDay = startOfDay(order.createdAt);
    if (orderDay < earliest) continue;
    const bucket = days.find((d) => d.date.getTime() === orderDay.getTime());
    if (bucket) {
      bucket.count += 1;
      bucket.revenue += order.total;
    }
  }

  return days.map((d) => ({
    date: d.date,
    label: DAY_LABELS[d.date.getDay()],
    dayOfMonth: d.date.getDate(),
    count: d.count,
    revenue: d.revenue,
    avgOrderValue: d.count > 0 ? d.revenue / d.count : 0,
  }));
}

/**
 * Headline stats (respecting the selected date range), fixed 7-day and
 * 30-day order-count/revenue trends, and top shipping methods — all
 * derived from real logged CodOrder rows, nothing here is sample data.
 */
export async function getDashboardStats(shop, range = "7d") {
  const today = startOfDay(new Date());
  const start = rangeStart(range, today);
  const rangeWhere = start ? { shop, createdAt: { gte: start } } : { shop };

  const [aggregate, recentOrders, methodGroups, todayCount] = await Promise.all([
    db.codOrder.aggregate({
      where: rangeWhere,
      _count: true,
      _sum: { total: true },
    }),
    db.codOrder.findMany({
      where: { shop },
      select: { createdAt: true, currency: true, total: true },
      orderBy: { createdAt: "desc" },
      take: 1000,
    }),
    db.codOrder.groupBy({
      by: ["shippingMethod"],
      where: rangeWhere,
      _count: true,
      orderBy: { _count: { shippingMethod: "desc" } },
      take: 5,
    }),
    db.codOrder.count({ where: { shop, createdAt: { gte: today } } }),
  ]);

  const totalOrders = aggregate._count;
  const totalRevenue = aggregate._sum.total || 0;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const currency = recentOrders[0]?.currency || "";

  const last7Days = bucketByDay(recentOrders, today, 7);
  const last30Days = bucketByDay(recentOrders, today, 30);
  const ordersThisWeek = last7Days.reduce((sum, d) => sum + d.count, 0);

  const topShippingMethods = methodGroups.map((g) => ({
    name: g.shippingMethod,
    count: g._count,
  }));

  return {
    range,
    totalOrders,
    totalRevenue,
    averageOrderValue,
    currency,
    ordersToday: todayCount,
    ordersThisWeek,
    last7Days,
    last30Days,
    topShippingMethods,
  };
}
