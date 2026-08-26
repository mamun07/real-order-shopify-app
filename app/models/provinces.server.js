import db from "../db.server";

const DEFAULT_BD_DIVISIONS = {
  Dhaka: ["Dhaka", "Gazipur", "Narayanganj", "Tangail", "Manikganj", "Munshiganj"],
  Chattogram: ["Chattogram", "Cox's Bazar", "Comilla", "Feni", "Noakhali", "Rangamati"],
  Khulna: ["Khulna", "Jessore", "Satkhira", "Bagerhat", "Kushtia", "Chuadanga"],
  Rajshahi: ["Rajshahi", "Bogura", "Pabna", "Sirajganj", "Natore", "Naogaon"],
  Barishal: ["Barishal", "Bhola", "Patuakhali", "Pirojpur", "Barguna", "Jhalokati"],
  Sylhet: ["Sylhet", "Moulvibazar", "Habiganj", "Sunamganj"],
  Rangpur: ["Rangpur", "Dinajpur", "Kurigram", "Gaibandha", "Nilphamari", "Thakurgaon"],
  Mymensingh: ["Mymensingh", "Jamalpur", "Netrokona", "Sherpur"],
};

async function seedDefaults(shop) {
  const names = Object.keys(DEFAULT_BD_DIVISIONS);
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    await db.province.create({
      data: {
        shop,
        name,
        position: i,
        cities: {
          create: DEFAULT_BD_DIVISIONS[name].map((cityName, j) => ({
            name: cityName,
            position: j,
          })),
        },
      },
    });
  }
}

/**
 * The merchant's Province → City list used by the Cash on Delivery popup's
 * address dropdowns (Bangladesh only). Seeded with a default set of
 * divisions/districts on first use so behavior doesn't regress for shops
 * that haven't configured anything yet; from then on it's fully
 * merchant-editable from the app settings page.
 */
export async function getProvinces(shop) {
  const count = await db.province.count({ where: { shop } });
  if (count === 0) {
    await seedDefaults(shop);
  }

  return db.province.findMany({
    where: { shop },
    orderBy: { position: "asc" },
    include: { cities: { orderBy: { position: "asc" } } },
  });
}

export async function addProvince(shop, name) {
  const count = await db.province.count({ where: { shop } });
  return db.province.create({
    data: { shop, name: name.trim(), position: count },
  });
}

export async function renameProvince(shop, provinceId, name) {
  const province = await db.province.findFirst({ where: { id: provinceId, shop } });
  if (!province) throw new Error("Province not found");

  return db.province.update({
    where: { id: provinceId },
    data: { name: name.trim() },
  });
}

export async function deleteProvince(shop, provinceId) {
  const province = await db.province.findFirst({ where: { id: provinceId, shop } });
  if (!province) throw new Error("Province not found");

  return db.province.delete({ where: { id: provinceId } });
}

export async function addCity(shop, provinceId, name) {
  const province = await db.province.findFirst({ where: { id: provinceId, shop } });
  if (!province) throw new Error("Province not found");

  const count = await db.city.count({ where: { provinceId } });
  return db.city.create({
    data: { provinceId, name: name.trim(), position: count },
  });
}

export async function renameCity(shop, cityId, name) {
  const city = await db.city.findFirst({
    where: { id: cityId, province: { shop } },
  });
  if (!city) throw new Error("City not found");

  return db.city.update({ where: { id: cityId }, data: { name: name.trim() } });
}

export async function deleteCity(shop, cityId) {
  const city = await db.city.findFirst({
    where: { id: cityId, province: { shop } },
  });
  if (!city) throw new Error("City not found");

  return db.city.delete({ where: { id: cityId } });
}
