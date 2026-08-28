import db from "../db.server";

export async function logCodOrder(shop, data) {
  return db.codOrder.create({ data: { shop, ...data } });
}

export async function listCodOrders(shop, take = 25) {
  return db.codOrder.findMany({
    where: { shop },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function countCodOrders(shop) {
  return db.codOrder.count({ where: { shop } });
}

// Page through the shop's COD orders, newest first. Returns the requested
// slice plus the total count so the caller can render "X–Y of Z" and
// enable/disable the next/previous controls.
export async function listCodOrdersPage(shop, { page = 1, pageSize = 20 } = {}) {
  const size = Math.max(1, Math.min(100, Number(pageSize) || 20));
  const total = await db.codOrder.count({ where: { shop } });
  const pageCount = Math.max(1, Math.ceil(total / size));
  const current = Math.max(1, Math.min(pageCount, Number(page) || 1));

  const orders = await db.codOrder.findMany({
    where: { shop },
    orderBy: { createdAt: "desc" },
    skip: (current - 1) * size,
    take: size,
  });

  return { orders, total, page: current, pageSize: size, pageCount };
}

export async function countCodOrdersThisMonth(shop) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  return db.codOrder.count({ where: { shop, createdAt: { gte: monthStart } } });
}
