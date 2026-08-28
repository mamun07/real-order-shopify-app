import db from "../db.server";

// All 64 districts of Bangladesh (flat — the popup's top-level "District"
// dropdown), each mapped to its real thanas/upazilas (the "Thana"
// dropdown). Sourced from the Wikipedia "Upazilas of Bangladesh" district
// breakdown; "Dhaka City" was added to the Dhaka district's list since the
// upazila-only breakdown otherwise has no entry for the capital itself.
const DEFAULT_BD_DISTRICTS = {
  // Dhaka division
  Dhaka: [
    "Dhamrai", "Dohar", "Keraniganj", "Nawabganj", "Savar",
    // Dhaka Metropolitan Police thanas (Dhaka city)
    "Adabor", "Airport", "Badda", "Banani", "Bangshal", "Bhashantek",
    "Cantonment", "Chackbazar", "Dakshin Khan", "Darus-Salam", "Demra",
    "Dhanmondi", "Gandaria", "Gulshan", "Hatirjheel", "Hazaribagh",
    "Jatrabari", "Kadamtoli", "Kafrul", "Kalabagan", "Kamrangirchar",
    "Khilgaon", "Khilkhet", "Kotwali", "Lalbagh", "Mirpur Model",
    "Mohammadpur", "Motijheel", "Mugda", "New Market", "Pallabi",
    "Paltan Model", "Ramna Model", "Rampura", "Rupnagar", "Sabujbag",
    "Shah Ali", "Shahbag", "Shahjahanpur", "Sher-e-Bangla Nagar",
    "Shyampur", "Sutrapur", "Tejgaon", "Tejgaon Industrial", "Turag",
    "Uttar Khan", "Uttara East", "Uttara West", "Vatara", "Wari",
  ],
  Faridpur: ["Alfadanga", "Bhanga", "Boalmari", "Charbhadrasan", "Faridpur Sadar", "Madhukhali", "Nagarkanda", "Sadarpur", "Saltha"],
  Gazipur: [
    "Gazipur Sadar", "Kaliakair", "Kaliganj", "Kapasia", "Sreepur",
    // Gazipur Metropolitan Police thanas (Gazipur city)
    "Basan", "Gacha", "Joydebpur", "Kashimpur", "Pubail", "Tongi East", "Tongi West",
  ],
  Gopalganj: ["Gopalganj Sadar", "Kashiani", "Kotalipara", "Muksudpur", "Tungipara"],
  Kishoreganj: ["Austagram", "Bajitpur", "Bhairab", "Hossainpur", "Itna", "Karimganj", "Katiadi", "Kishoreganj Sadar", "Kuliarchar", "Mithamain", "Nikli", "Pakundia", "Tarail"],
  Madaripur: ["Rajoir", "Madaripur Sadar", "Kalkini", "Shibchar", "Dasar"],
  Manikganj: ["Daulatpur", "Ghior", "Harirampur", "Manikganj Sadar", "Saturia", "Shivalaya", "Singair"],
  Munshiganj: ["Gazaria", "Lohajang", "Munshiganj Sadar", "Sirajdikhan", "Sreenagar", "Tongibari"],
  Narayanganj: ["Narayanganj Sadar", "Fatullah", "Siddhirganj", "Bandar", "Sonargaon", "Rupganj", "Araihazar"],
  Narsingdi: ["Narsingdi Sadar", "Belabo", "Monohardi", "Palash", "Raipura", "Shibpur"],
  Rajbari: ["Baliakandi", "Goalandaghat", "Pangsha", "Rajbari Sadar", "Kalukhali"],
  Shariatpur: ["Bhedarganj", "Damudya", "Gosairhat", "Naria", "Shariatpur Sadar", "Zajira"],
  Tangail: ["Gopalpur", "Basail", "Bhuapur", "Delduar", "Ghatail", "Kalihati", "Madhupur", "Mirzapur", "Nagarpur", "Sakhipur", "Dhanbari", "Tangail Sadar"],

  // Chattogram division
  Bandarban: ["Ali Kadam", "Bandarban Sadar", "Lama", "Naikhongchhari", "Rowangchhari", "Ruma", "Thanchi"],
  Brahmanbaria: ["Akhaura", "Bancharampur", "Brahmanbaria Sadar", "Kasba", "Nabinagar", "Nasirnagar", "Sarail", "Ashuganj", "Bijoynagar"],
  Chandpur: ["Chandpur Sadar", "Faridganj", "Haimchar", "Haziganj", "Kachua", "Matlab Dakshin", "Matlab Uttar", "Shahrasti"],
  Chattogram: [
    "Anwara", "Banshkhali", "Boalkhali", "Chandanaish", "Fatikchhari",
    "Hathazari", "Karnaphuli", "Lohagara", "Mirsharai", "Patiya", "Rangunia",
    "Raozan", "Sandwip", "Satkania", "Sitakunda",
    // Chattogram Metropolitan Police thanas (Chattogram city)
    "Kotwali", "Panchlaish", "Double Mooring", "Bakalia", "Chandgaon",
    "Bayazid Bostami", "Chawkbazar", "Khulshi", "Pahartali", "Halishahar",
    "Patenga", "EPZ", "Akbar Shah", "Sadarghat", "Bandar (CMP)",
  ],
  Cumilla: ["Bangra", "Barura", "Brahmanpara", "Burichang", "Chandina", "Chauddagram", "Daudkandi", "Debidwar", "Homna", "Laksam", "Lalmai", "Muradnagar", "Nangalkot", "Cumilla Adarsha Sadar", "Meghna", "Titas", "Monohargonj", "Cumilla Sadar Dakshin"],
  "Cox's Bazar": ["Chakaria", "Cox's Bazar Sadar", "Kutubdia", "Maheshkhali", "Ramu", "Teknaf", "Ukhia", "Pekua", "Eidgaon", "Matamuhuri"],
  Feni: ["Chhagalnaiya", "Daganbhuiyan", "Feni Sadar", "Parshuram", "Sonagazi", "Fulgazi"],
  Khagrachhari: ["Dighinala", "Khagrachhari Sadar", "Lakshmichhari", "Mahalchhari", "Manikchhari", "Matiranga", "Panchhari", "Ramgarh", "Guimara"],
  Lakshmipur: ["Lakshmipur Sadar", "Raipur", "Ramganj", "Ramgati", "Kamalnagar", "Chandraganj"],
  Noakhali: ["Begumganj", "Noakhali Sadar", "Chatkhil", "Companiganj", "Hatiya", "Senbagh", "Sonaimuri", "Subarnachar", "Kabirhat"],
  Rangamati: ["Bagaichhari", "Barkal", "Kawkhali", "Belaichhari", "Kaptai", "Juraichhari", "Langadu", "Naniyachar", "Rajasthali", "Rangamati Sadar"],

  // Rajshahi division
  Bogura: ["Adamdighi", "Bogura Sadar", "Dhunat", "Dhupchanchia", "Gabtali", "Kahaloo", "Nandigram", "Sariakandi", "Shajahanpur", "Sherpur", "Shibganj", "Sonatola", "Mokamtola"],
  Chapainawabganj: ["Bholahat", "Gomastapur", "Nachole", "Nawabganj Sadar", "Shibganj"],
  Joypurhat: ["Akkelpur", "Joypurhat Sadar", "Kalai", "Khetlal", "Panchbibi"],
  Naogaon: ["Atrai", "Badalgachhi", "Dhamoirhat", "Manda", "Mohadevpur", "Naogaon Sadar", "Niamatpur", "Patnitala", "Porsha", "Raninagar", "Sapahar"],
  Natore: ["Bagatipara", "Baraigram", "Gurudaspur", "Lalpur", "Naldanga", "Natore Sadar", "Singra"],
  Pabna: ["Atgharia", "Bera", "Bhangura", "Chatmohar", "Faridpur", "Ishwardi", "Pabna Sadar", "Santhia", "Sujanagar"],
  Rajshahi: [
    "Bagha", "Bagmara", "Charghat", "Durgapur", "Godagari", "Mohanpur",
    "Paba", "Puthia", "Tanore",
    // Rajshahi Metropolitan Police thanas (Rajshahi city)
    "Boalia", "Rajpara", "Motihar", "Shah Makhdum", "Chandrima",
    "Kasiadanga", "Katakhali", "Belpukur", "Rajshahi Airport", "Karnahar",
    "Damkura",
  ],
  Sirajganj: ["Belkuchi", "Chauhali", "Kamarkhanda", "Kazipur", "Raiganj", "Shahjadpur", "Sirajganj Sadar", "Tarash", "Ullahpara"],

  // Khulna division
  Bagerhat: ["Bagerhat Sadar", "Chitalmari", "Fakirhat", "Kachua", "Mollahat", "Mongla", "Morrelganj", "Rampal", "Sarankhola"],
  Chuadanga: ["Alamdanga", "Chuadanga Sadar", "Damurhuda", "Jibannagar"],
  Jashore: ["Abhaynagar", "Bagherpara", "Chaugachha", "Jhikargachha", "Keshabpur", "Jashore Sadar", "Manirampur", "Sharsha"],
  Jhenaidah: ["Harinakunda", "Jhenaidah Sadar", "Kaliganj", "Kotchandpur", "Maheshpur", "Shailkupa"],
  Khulna: [
    "Batiaghata", "Dacope", "Dumuria", "Dighalia", "Koyra", "Paikgachha",
    "Phultala", "Rupsha", "Terokhada",
    // Khulna Metropolitan Police thanas (Khulna city)
    "Khulna Sadar", "Sonadanga", "Labanchara", "Harintana", "Khalishpur",
    "Daulatpur (KMP)", "Khan Jahan Ali", "Aranghata",
  ],
  Kushtia: ["Bheramara", "Daulatpur", "Khoksa", "Kumarkhali", "Kushtia Sadar", "Mirpur"],
  Magura: ["Magura Sadar", "Mohammadpur", "Shalikha", "Sreepur"],
  Meherpur: ["Gangni", "Meherpur Sadar", "Mujibnagar"],
  Narail: ["Kalia", "Lohagara", "Narail Sadar"],
  Satkhira: ["Assasuni", "Debhata", "Kalaroa", "Kaliganj", "Satkhira Sadar", "Shyamnagar", "Tala"],

  // Barishal division
  Barguna: ["Amtali", "Bamna", "Barguna Sadar", "Betagi", "Patharghata", "Taltali"],
  Barishal: [
    "Agailjhara", "Babuganj", "Bakerganj", "Banaripara", "Barisal Sadar",
    "Gaurnadi", "Hizla", "Mehendiganj", "Muladi", "Wazirpur",
    // Barisal Metropolitan Police thanas (Barisal city)
    "Kotwali Model (Barisal)", "Barisal Airport", "Kawnia", "Bandar (Barisal)",
  ],
  Bhola: ["Bhola Sadar", "Burhanuddin", "Char Fasson", "Daulatkhan", "Lalmohan", "Manpura", "Tazumuddin"],
  Jhalokati: ["Jhalokati Sadar", "Kathalia", "Nalchity", "Rajapur"],
  Patuakhali: ["Bauphal", "Dashmina", "Dumki", "Galachipa", "Kalapara", "Mirzaganj", "Patuakhali Sadar", "Rangabali"],
  Pirojpur: ["Bhandaria", "Indurkani", "Kawkhali", "Mathbaria", "Nazirpur", "Nesarabad", "Pirojpur Sadar"],

  // Sylhet division
  Habiganj: ["Ajmiriganj", "Bahubal", "Baniyachong", "Chunarughat", "Habiganj Sadar", "Lakhai", "Madhabpur", "Nabiganj", "Shayestaganj"],
  Moulvibazar: ["Barlekha", "Juri", "Kamalganj", "Kulaura", "Moulvibazar Sadar", "Rajnagar", "Sreemangal"],
  Sunamganj: ["Bishwamvarpur", "Chhatak", "Shantiganj", "Derai", "Dharamapasha", "Dowarabazar", "Jagannathpur", "Jamalganj", "Sullah", "Sunamganj Sadar", "Tahirpur", "Madhyanagar"],
  Sylhet: [
    "Balaganj", "Beanibazar", "Bishwanath", "Companiganj", "Dakshin Surma",
    "Fenchuganj", "Golapganj", "Gowainghat", "Jaintiapur", "Kanaighat",
    "Osmani Nagar", "Sylhet Sadar", "Zakiganj",
    // Sylhet Metropolitan Police thanas (Sylhet city)
    "Kotwali Model (Sylhet)", "Moglabazar", "Jalalabad", "Bimanbandar", "Shah Poran",
  ],

  // Rangpur division
  Dinajpur: ["Biral", "Birampur", "Birganj", "Bochaganj", "Chirirbandar", "Dinajpur Sadar", "Ghoraghat", "Hakimpur", "Kaharole", "Khansama", "Nawabganj", "Parbatipur", "Phulbari"],
  Gaibandha: ["Gaibandha Sadar", "Gobindaganj", "Palashbari", "Phulchhari", "Sadullapur", "Sughatta", "Sundarganj"],
  Kurigram: ["Bhurungamari", "Char Rajibpur", "Chilmari", "Kurigram Sadar", "Nageshwari", "Phulbari", "Rajarhat", "Raomari", "Ulipur"],
  Lalmonirhat: ["Aditmari", "Hatibandha", "Kaliganj", "Lalmonirhat Sadar", "Patgram"],
  Nilphamari: ["Dimla", "Domar", "Jaldhaka", "Kishoreganj", "Nilphamari Sadar", "Saidpur"],
  Panchagarh: ["Atwari", "Boda", "Debiganj", "Panchagarh Sadar", "Tetulia"],
  Rangpur: [
    "Badarganj", "Gangachhara", "Kaunia", "Mithapukur", "Pirgachha",
    "Pirganj", "Rangpur Sadar", "Taraganj",
    // Rangpur Metropolitan Police thanas (Rangpur city)
    "Kotwali (Rangpur)", "Haragach", "Tajhat", "Mahiganj", "Hazirhat",
  ],
  Thakurgaon: ["Baliadangi", "Haripur", "Pirganj", "Ranisankail", "Thakurgaon Sadar", "Ruhia"],

  // Mymensingh division
  Jamalpur: ["Baksiganj", "Dewanganj", "Islampur", "Jamalpur Sadar", "Madarganj", "Melandaha", "Sarishabari"],
  Mymensingh: ["Bhaluka", "Dhobaura", "Fulbaria", "Gafargaon", "South Gafargaon", "Gauripur", "Haluaghat", "Ishwarganj", "Muktagachha", "Mymensingh Sadar", "Nandail", "Phulpur", "Tarakanda", "Trishal"],
  Netrokona: ["Atpara", "Barhatta", "Durgapur", "Kalmakanda", "Khaliajuri", "Kendua", "Madan", "Mohanganj", "Netrokona Sadar", "Purbadhala"],
  Sherpur: ["Jhenaigati", "Nakla", "Nalitabari", "Sherpur Sadar", "Sreebardi"],
};

async function seedDefaults(shop) {
  const names = Object.keys(DEFAULT_BD_DISTRICTS);
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    await db.province.create({
      data: {
        shop,
        countryCode: "BD",
        name,
        position: i,
        cities: {
          create: DEFAULT_BD_DISTRICTS[name].map((thanaName, j) => ({
            name: thanaName,
            position: j,
          })),
        },
      },
    });
  }
}

/**
 * The merchant's District → Thana list for one country, used by the Cash on
 * Delivery popup's address dropdowns. When the customer picks a country that
 * has a list configured here, the popup shows a required District dropdown
 * (and Thana cascade); countries with no list get plain text fields.
 *
 * Bangladesh is seeded with all 64 districts + thanas on first use so
 * behavior doesn't regress for shops that haven't configured anything.
 * (Internally still `Province`/`City` — only the labels say District/Thana.)
 */
export async function getProvinces(shop, countryCode = "BD") {
  const cc = String(countryCode || "BD").toUpperCase();
  if (cc === "BD") {
    const bdCount = await db.province.count({
      where: { shop, countryCode: "BD" },
    });
    if (bdCount === 0) await seedDefaults(shop);
  }

  return db.province.findMany({
    where: { shop, countryCode: cc },
    orderBy: { position: "asc" },
    include: { cities: { orderBy: { position: "asc" } } },
  });
}

/**
 * Every configured country's list, keyed by country code — used by the
 * storefront proxy so the popup can pick the right list when the shopper
 * changes country without a round-trip.
 */
export async function getProvincesByCountry(shop) {
  await getProvinces(shop, "BD"); // ensure BD is seeded
  const rows = await db.province.findMany({
    where: { shop },
    orderBy: [{ countryCode: "asc" }, { position: "asc" }],
    include: { cities: { orderBy: { position: "asc" } } },
  });
  const byCountry = {};
  for (const p of rows) {
    (byCountry[p.countryCode] ||= []).push(p);
  }
  return byCountry;
}

export async function addProvince(shop, countryCode, name) {
  const cc = String(countryCode || "BD").toUpperCase();
  const count = await db.province.count({ where: { shop, countryCode: cc } });
  return db.province.create({
    data: { shop, countryCode: cc, name: name.trim(), position: count },
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
