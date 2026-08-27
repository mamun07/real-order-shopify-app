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

export async function countCodOrdersThisMonth(shop) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  return db.codOrder.count({ where: { shop, createdAt: { gte: monthStart } } });
}
