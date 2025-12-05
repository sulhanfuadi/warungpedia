# SRS-MartPlace-09: Laporan Daftar Akun Penjual (Aktif/Tidak Aktif) dalam Format PDF

## 📋 Ringkasan Implementasi

Fitur ini memungkinkan admin platform untuk menghasilkan laporan daftar akun penjual dalam format PDF dengan filter status (Semua, Aktif, atau Tidak Aktif).

## 🎯 Requirement

**SRS-MartPlace-09**: Sebagai Platform, saya ingin menghasilkan Laporan daftar akun penjual (aktif/tidak aktif) dalam format PDF

## 📁 File yang Ditambahkan/Dimodifikasi

### 1. **API Endpoint** - `app/api/admin/sellers/report/route.ts`
   - **Fungsi**: Generate PDF report dari data penjual
   - **Parameter Query**:
     - `status`: Filter status (ALL, ACTIVE, INACTIVE, PENDING)
     - `format`: Format output (pdf, json)
   - **Features**:
     - Fetch data penjual dari database Supabase
     - Apply filter berdasarkan status
     - Generate PDF dengan PDFKit
     - Multi-page support (max 25 rows per page)
     - Table formatting dengan header styling
     - Status color coding (Hijau=AKTIF, Merah=TIDAK AKTIF, Kuning=PENDING)
     - Footer dengan timestamp

### 2. **UI Component** - `app/admin/sellers/manage/page.tsx`
   - **Penambahan**:
     - Button "📄 Download PDF" di section filter
     - Handler function `handleDownloadReport()`
     - Integration dengan API endpoint
     - Download file otomatis ke user device

### 3. **Service Layer** - `lib/services/reportService.ts`
   - **Functions**:
     - `downloadSellerReport()`: Download PDF report
     - `fetchSellerReportData()`: Fetch report data dalam format JSON
   - Reusable utility untuk di-import di components lain

### 4. **Dependencies Installed**
   - `pdfkit`: Library untuk generate PDF di Node.js/backend
   - `@types/pdfkit`: TypeScript type definitions untuk pdfkit
   - `@types/nodemailer`: TypeScript types untuk nodemailer (fixed compile error)

## 🎨 Fitur PDF Report

### Header Report
- Logo/Branding Warungpedia
- Judul: "LAPORAN DAFTAR AKUN PENJUAL"
- Filter info (Status filter yang diaplikasikan)
- Tanggal laporan
- Total penjual

### Tabel Data
- **Kolom**: No, Nama Toko, Pemilik, Kota, Status
- **Styling**:
  - Header biru (#0779FF) dengan text putih
  - Alternate row colors (gray background untuk baris genap)
  - Status dengan color coding
  - Font 9pt untuk readability

### Pagination
- Maximum 25 rows per halaman
- Otomatis create new page jika data > 25
- Header table di-repeat di setiap halaman baru

### Footer
- Timestamp generation
- Credit line Warungpedia

## 🔧 Cara Menggunakan

### Dari UI Admin
1. Buka halaman `/admin/sellers/manage`
2. Pilih filter status:
   - Semua (ALL)
   - Aktif (ACTIVE)
   - Tidak Aktif (INACTIVE)
3. Klik button "📄 Download PDF"
4. File PDF otomatis di-download ke device

### Dari Code/Service Layer
```typescript
import { downloadSellerReport, fetchSellerReportData } from "@/lib/services/reportService";

// Download PDF
const result = await downloadSellerReport({ 
  status: "ACTIVE",
  format: "pdf" 
});

// Fetch data (JSON format untuk processing lanjutan)
const data = await fetchSellerReportData("ACTIVE");
```

### Direct API Call
```bash
# Download PDF
GET /api/admin/sellers/report?status=ACTIVE&format=pdf

# Fetch data (JSON)
GET /api/admin/sellers/report?status=ACTIVE&format=json
```

## 📊 Data yang Ditampilkan

Per penjual:
- Nama Toko (dari field `store_name`)
- Nama PIC (dari field `pic_name`)
- Email (dari field `pic_email`)
- Kota (dari field `pic_city`)
- Status (AKTIF/TIDAK AKTIF/PENDING/DITOLAK)

## ✅ Status Filter

- **ALL**: Tampilkan semua penjual (tanpa filter)
- **ACTIVE**: Tampilkan hanya penjual dengan status ACTIVE
- **INACTIVE**: Tampilkan hanya penjual dengan status INACTIVE
- **PENDING**: Tampilkan hanya penjual dengan status PENDING

## 🔐 Security

- API endpoint dapat diakses dari authenticated admin users
- Data fetched langsung dari database via Supabase Admin
- PDF generated di server-side (tidak expose raw data ke client)

## 🧪 Testing

Build berhasil ✅

Fitur siap untuk:
- Test download PDF dengan berbagai filter
- Verify data accuracy di laporan
- Check pagination untuk data > 25 rows
- Verify styling dan formatting PDF

## 📝 Notes

- Filename report: `Laporan_Penjual_{STATUS}_{YYYY-MM-DD}.pdf`
- PDFs di-generate on-the-fly (tidak disimpan di server)
- Support untuk future expansion (e.g., tambah filter tanggal, export Excel, etc.)

## 🚀 Next Steps (Optional)

Untuk enhancement di masa depan:
1. Add date range filter
2. Export ke format Excel/CSV
3. Email report attachment
4. Schedule automatic report generation
5. Report template customization
