import { supabase } from "./supabaseClient";

export async function testSupabaseConnection(): Promise<boolean> {
  console.log("\n" + "=".repeat(60));
  console.log("🔍 TESTING SUPABASE CONNECTION");
  console.log("=".repeat(60));

  console.log("\n📋 Environment Variables:");
  console.log("   URL:", process.env.NEXT_PUBLIC_SUPABASE_URL || "❌ NOT SET");
  console.log(
    "   Key:",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ? `✅ ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...`
      : "❌ NOT SET"
  );

  let allTestsPassed = true;

  // ========================================
  // TEST 1: Database Connection
  // ========================================
  console.log("\n" + "─".repeat(60));
  console.log("📋 TEST 1: Database Connection");
  console.log("─".repeat(60));

  try {
    const { data, error } = await supabase
      .from("sellers")
      .select("id")
      .limit(1);

    if (error) {
      console.error("❌ Database Error:", error.message);
      console.error("   Code:", error.code);
      console.error("   Details:", JSON.stringify(error, null, 2));
      allTestsPassed = false;
    } else {
      console.log("✅ Database connected successfully");
      console.log(`   Query returned ${data?.length || 0} rows`);
    }
  } catch (err) {
    console.error("❌ Database connection failed:", err);
    allTestsPassed = false;
  }

  // ========================================
  // TEST 2: Auth Service Check
  // ========================================
  console.log("\n" + "─".repeat(60));
  console.log("📋 TEST 2: Auth Service Check");
  console.log("─".repeat(60));

  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error("❌ Auth Error:", error.message);
      allTestsPassed = false;
    } else {
      console.log("✅ Auth service accessible");
      console.log(
        "   Current session:",
        session ? "Active" : "No active session"
      );
    }
  } catch (err) {
    console.error("❌ Auth check failed:", err);
    allTestsPassed = false;
  }

  // ========================================
  // TEST 3: Storage Service Check
  // ========================================
  console.log("\n" + "─".repeat(60));
  console.log("📋 TEST 3: Storage Service Check");
  console.log("─".repeat(60));

  try {
    const { error } = await supabase.storage.listBuckets();

    if (error) {
      console.error("❌ Storage Error:", error.message);
      console.log("\n💡 SOLUSI:");
      console.log(
        "   1. Cek apakah Storage sudah di-enable di Supabase project"
      );
      console.log("   2. Verify API Key di .env.local");
      console.log("   3. Restart dev server: npm run dev");
      allTestsPassed = false;
    } else {
      console.log("✅ Storage API connected");
    }
  } catch (err) {
    console.error("❌ Storage check failed:", err);
    allTestsPassed = false;
  }

  // ========================================
  // FINAL RESULT
  // ========================================
  console.log("\n" + "=".repeat(60));
  if (allTestsPassed) {
    console.log("🎉 ALL TESTS PASSED!");
    console.log("=".repeat(60));
    console.log("\n✅ System is ready for seller registration!");
  } else {
    console.log("❌ SOME TESTS FAILED");
    console.log("=".repeat(60));
    console.log("\n⚠️  Please fix the issues above before proceeding");
  }
  console.log("\n");

  return allTestsPassed;
}
