import db from "../db.server";

export async function getSettings(shop) {
  let settings = await db.shopSettings.findUnique({ where: { shop } });
  if (!settings) {
    settings = await db.shopSettings.create({ data: { shop } });
  }
  return settings;
}

export async function updateSettings(shop, data) {
  return db.shopSettings.upsert({
    where: { shop },
    update: data,
    create: { shop, ...data },
  });
}
