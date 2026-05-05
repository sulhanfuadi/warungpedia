/**
 * Test PDF Report Generation
 * Simple test untuk diagnose masalah PDF report
 */

export async function testPDFReport() {
  console.log("🧪 Testing PDF Report Generation...\n");

  try {
    // Test 1: Fetch sellers data
    console.log("1️⃣ Testing data fetch from /api/admin/sellers/report (JSON format)");
    const testResponse = await fetch(
      "/api/admin/sellers/report?status=ALL&format=json"
    );
    console.log(`   Status: ${testResponse.status}`);
    const testData = await testResponse.json();
    console.log(`   Total records: ${testData.totalRecords || 0}`);
    console.log(`   Data fetch: ${testResponse.ok ? "✅ OK" : "❌ FAILED"}\n`);

    if (!testResponse.ok || !testData.data || testData.data.length === 0) {
      console.warn("⚠️ No sellers data found. Make sure you have sellers in the database.\n");
      return;
    }

    // Test 2: Generate PDF
    console.log("2️⃣ Testing PDF generation");
    const pdfResponse = await fetch(
      "/api/admin/sellers/report?status=ALL&format=pdf"
    );
    console.log(`   Status: ${pdfResponse.status}`);
    console.log(`   Content-Type: ${pdfResponse.headers.get("content-type")}`);
    
    const blob = await pdfResponse.blob();
    console.log(`   Blob size: ${blob.size} bytes`);
    console.log(`   PDF generation: ${pdfResponse.ok ? "✅ OK" : "❌ FAILED"}\n`);

    if (pdfResponse.ok && blob.size > 0) {
      console.log("✅ All tests passed! PDF report generation is working.");
      
      // Optional: Auto-download for testing
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `test_report_${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      console.log("📥 Test PDF downloaded");
    } else {
      console.error("❌ PDF generation test failed");
      console.error("Response:", await pdfResponse.text());
    }
  } catch (error) {
    console.error("❌ Test error:", error);
  }
}

// Usage in console:
// import { testPDFReport } from "@/lib/services/testReport"
// testPDFReport()
