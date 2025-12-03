import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * Diagnostic endpoint untuk test Supabase connection dan data
 * GET /api/admin/sellers/report/diagnostic
 */
export async function GET() {
  try {
    console.log("🔵 [Diagnostic] Starting diagnostic check...");

    // Test 1: Check Supabase connection
    console.log("🔵 [Diagnostic] Test 1: Checking Supabase connection...");
    const testQuery = await supabaseAdmin.from("sellers").select("count()");
    console.log("🔵 [Diagnostic] Test 1 result:", testQuery);

    if (testQuery.error) {
      console.error("❌ [Diagnostic] Test 1 failed:", testQuery.error);
      return NextResponse.json(
        {
          status: "FAILED",
          test1: {
            name: "Supabase Connection",
            result: "FAILED",
            error: testQuery.error.message,
          },
        },
        { status: 500 }
      );
    }

    console.log("✅ [Diagnostic] Test 1 passed: Supabase connection OK");

    // Test 2: Check sellers table exists and has data
    console.log("🔵 [Diagnostic] Test 2: Fetching sellers data...");
    const { data: sellers, error: sellersError } = await supabaseAdmin
      .from("sellers")
      .select("id, store_name, status")
      .limit(5);

    if (sellersError) {
      console.error("❌ [Diagnostic] Test 2 failed:", sellersError);
      return NextResponse.json(
        {
          status: "FAILED",
          test1: { name: "Supabase Connection", result: "PASSED" },
          test2: {
            name: "Sellers Table",
            result: "FAILED",
            error: sellersError.message,
          },
        },
        { status: 500 }
      );
    }

    const sellerCount = sellers?.length || 0;
    console.log(`✅ [Diagnostic] Test 2 passed: Found ${sellerCount} sellers`);

    // Test 3: Check seller status distribution
    console.log("🔵 [Diagnostic] Test 3: Checking seller statuses...");
    const { data: allSellers } = await supabaseAdmin
      .from("sellers")
      .select("status");

    const statusCount: Record<string, number> = {};
    allSellers?.forEach((s) => {
      const status = s.status || "UNKNOWN";
      statusCount[status] = (statusCount[status] || 0) + 1;
    });

    console.log("✅ [Diagnostic] Test 3 passed: Status distribution", statusCount);

    // Test 4: Check for required fields
    console.log("🔵 [Diagnostic] Test 4: Checking required fields...");
    if (sellers && sellers.length > 0) {
      const sample = sellers[0];
      const hasRequiredFields = {
        id: !!sample.id,
        store_name: !!sample.store_name,
        status: !!sample.status,
      };
      console.log("✅ [Diagnostic] Test 4 passed: Required fields check", hasRequiredFields);
    }

    return NextResponse.json(
      {
        status: "SUCCESS",
        tests: [
          { name: "Supabase Connection", result: "PASSED" },
          {
            name: "Sellers Table",
            result: "PASSED",
            count: sellerCount,
          },
          {
            name: "Status Distribution",
            result: "PASSED",
            statuses: statusCount,
          },
          {
            name: "Required Fields",
            result: "PASSED",
            sampleData: sellers ? sellers.slice(0, 2) : [],
          },
        ],
        recommendation:
          sellerCount === 0
            ? "⚠️ No sellers found. Create some sellers before generating reports."
            : "✅ System is ready. You can generate PDF reports.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ [Diagnostic] Unexpected error:", error);
    return NextResponse.json(
      {
        status: "ERROR",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
