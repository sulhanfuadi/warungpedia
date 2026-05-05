import { supabaseAdmin } from "@/lib/supabaseAdmin";

type SeedUser = {
  email: string;
  password: string;
  role: "admin" | "seller";
  sellerProfile?: {
    store_name: string;
    pic_name: string;
    pic_phone: string;
    pic_email: string;
    pic_city: string;
    pic_province: string;
  };
};

const seedUsers: SeedUser[] = [
  {
    email: "admin@warungpedia.id",
    password: "Admin123!",
    role: "admin",
  },
  {
    email: "seller@warungpedia.id",
    password: "Seller123!",
    role: "seller",
    sellerProfile: {
      store_name: "Toko Seeding",
      pic_name: "Penjual Seed",
      pic_phone: "081234567890",
      pic_email: "seller@warungpedia.id",
      pic_city: "Jakarta",
      pic_province: "DKI Jakarta",
    },
  },
];

async function findUserIdByEmail(email: string) {
  let page = 1;
  const perPage = 100;
  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) throw error;
    const found = data.users.find((u) => u.email === email);
    if (found) return found.id;
    if (data.users.length < perPage) break;
    page += 1;
  }
  return null;
}

async function ensureUser(seed: SeedUser) {
  const meta = { role: seed.role };
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: seed.email,
    password: seed.password,
    email_confirm: true,
    user_metadata: meta,
    app_metadata: meta,
  });

  if (error) {
    if (!error.message.toLowerCase().includes("already registered")) {
      throw error;
    }
  }

  const userId = data?.user?.id ?? (await findUserIdByEmail(seed.email));
  if (!userId) {
    throw new Error(`Tidak dapat menemukan userId untuk ${seed.email}`);
  }

  return userId;
}

async function ensureSellerProfile(userId: string, seed: SeedUser) {
  if (!seed.sellerProfile) return;

  const { error } = await supabaseAdmin
    .from("sellers")
    .upsert(
      {
        id: userId,
        status: "ACTIVE",
        store_name: seed.sellerProfile.store_name,
        pic_name: seed.sellerProfile.pic_name,
        pic_phone: seed.sellerProfile.pic_phone,
        pic_email: seed.sellerProfile.pic_email,
        pic_city: seed.sellerProfile.pic_city,
        pic_province: seed.sellerProfile.pic_province,
        pic_street: "Seeder Street 123",
        pic_rt: "001",
        pic_rw: "001",
        pic_village: "Seeder Village",
        pic_ktp_number: "1234567890123456",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );

  if (error) throw error;
}

async function main() {
  for (const seed of seedUsers) {
    console.log(`Seeding ${seed.role} : ${seed.email}`);
    const userId = await ensureUser(seed);
    if (seed.role === "seller") {
      await ensureSellerProfile(userId, seed);
    }
    console.log(`  -> OK (${userId})`);
  }
  console.log("Selesai seeding user admin & seller.");
}

main().catch((err) => {
  console.error("Seeder gagal:", err);
  process.exit(1);
});
