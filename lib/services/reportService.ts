/**
 * PDF Report Service
 * Utility functions untuk generate PDF reports
 */

export interface SellerReportOptions {
  status: "ALL" | "ACTIVE" | "INACTIVE" | "PENDING";
  format?: "pdf" | "json";
}

export async function downloadSellerReport(options: SellerReportOptions) {
  try {
    const params = new URLSearchParams({
      status: options.status,
      format: options.format || "pdf",
    });

    const response = await fetch(`/api/admin/sellers/report?${params.toString()}`);

    if (!response.ok) {
      throw new Error("Gagal mengunduh laporan");
    }

    // Get filename dari Content-Disposition header
    const contentDisposition = response.headers.get("content-disposition");
    const filename =
      contentDisposition
        ?.split("filename=")[1]
        ?.replace(/"/g, "") ||
      `Laporan_Penjual_${options.status}_${new Date().toISOString().split("T")[0]}.pdf`;

    // Convert response to blob dan download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(link);

    return { success: true, filename };
  } catch (error) {
    console.error("❌ Error downloading report:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function fetchSellerReportData(
  status: "ALL" | "ACTIVE" | "INACTIVE" | "PENDING"
) {
  try {
    const response = await fetch(
      `/api/admin/sellers/report?status=${status}&format=json`
    );

    if (!response.ok) {
      throw new Error("Gagal mengambil data laporan");
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("❌ Error fetching report data:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
