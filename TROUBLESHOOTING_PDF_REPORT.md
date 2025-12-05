# 🔧 Troubleshooting: Gagal Mengunduh Laporan

## Error Message: "❌ Gagal mengunduh laporan: Terjadi kesalahan server"

Panduan lengkap untuk mendiagnosis dan memperbaiki masalah download PDF report.

---

## 🔍 Diagnosis Steps

### Step 1: Check Browser Console
1. Buka halaman `/admin/sellers/manage`
2. Tekan **F12** untuk buka Developer Tools
3. Pilih tab **Console**
4. Klik tombol "📄 Download PDF"
5. Lihat log messages yang muncul:

**Harusnya lihat:**
```
📥 Downloading report for status: ALL
Response status: 200
Content-Type: application/pdf
📄 Filename: Laporan_Penjual_ALL_2025-12-04.pdf
📊 Blob size: 15000 bytes
✅ File downloaded successfully
```

**Jika ada error, lihat pesan error:**
```
❌ Error downloading report: [error message]
```

---

### Step 2: Check Network Tab
1. Buka tab **Network** di Developer Tools
2. Filter untuk API calls (bisa filter "report")
3. Klik tombol "📄 Download PDF" lagi
4. Lihat request `/api/admin/sellers/report?status=...`

**Check:**
- ✅ Status: 200 (bukan 500)
- ✅ Content-Type: application/pdf
- ✅ Response Size: > 0 bytes (misalnya 15 KB, bukan 0 bytes)

**Jika error 500**, expand response untuk lihat error message:
```json
{
  "error": "Terjadi kesalahan server",
  "details": "[actual error message]"
}
```

---

### Step 3: Check Server Logs
1. Lihat terminal dimana Anda menjalankan `npm run dev`
2. Cari log messages saat download:

**Harusnya lihat:**
```
🔄 Starting PDF generation for X sellers
📝 Received PDF chunk: 4096 bytes
📝 Received PDF chunk: 4096 bytes
...
📄 Calling doc.end() to finalize PDF
✅ PDF end event fired, total chunks: XX
📊 PDF generation complete: XXXXX bytes
✅ PDF generated successfully, size: XXXXX bytes
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Tidak ada data penjual" (404 Error)
```json
{
  "error": "Tidak ada data penjual"
}
```

**Cause:** Tidak ada sellers di database

**Solution:**
1. Buat beberapa seller accounts terlebih dahulu
2. Atau jalankan seed script untuk test data:
   ```bash
   npm run seed:users
   ```

---

### Issue 2: "Gagal mengambil data penjual" (500 Error)
```json
{
  "error": "Gagal mengambil data penjual"
}
```

**Cause:** Error connecting ke Supabase database

**Solution:**
1. Check `.env.local` file - pastikan Supabase credentials benar:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
2. Test connection dengan hit endpoint JSON format:
   ```
   /api/admin/sellers/report?status=ALL&format=json
   ```
3. Check Supabase dashboard - pastikan `sellers` table ada dan accessible

---

### Issue 3: "PDF generation timeout"
```
❌ PDF generation timeout (30s exceeded)
```

**Cause:** PDF generation terlalu lama (biasanya data terlalu besar)

**Solution:**
1. Reduce jumlah sellers untuk test (test dengan 10 sellers dulu)
2. Atau increase timeout di `route.ts` line ~310

---

### Issue 4: Blob size 0 bytes
```
📊 Blob size: 0 bytes
❌ File PDF kosong, gagal generate
```

**Cause:** PDF generated tapi kosong data

**Solution:**
1. Check server logs untuk `PDF generation complete: 0 bytes`
2. Verify sellers data ada di database:
   ```bash
   # Test di Supabase SQL Editor
   SELECT COUNT(*) FROM sellers;
   ```
3. Check PDFKit version compatibility

---

## 🧪 Testing

### Test 1: JSON Data Fetch (No PDF)
```bash
curl "http://localhost:3000/api/admin/sellers/report?status=ALL&format=json"
```

Expected response:
```json
{
  "success": true,
  "data": [...],
  "totalRecords": 5,
  "filterStatus": "ALL"
}
```

### Test 2: PDF Generation
```bash
curl "http://localhost:3000/api/admin/sellers/report?status=ACTIVE&format=pdf" \
  -H "Accept: application/pdf" \
  --output report.pdf
```

Then check file size:
```bash
ls -lah report.pdf
# Should show size > 0 bytes
```

---

## 🧩 Advanced Debugging

### Enable Detailed Logging
Edit `route.ts` dan uncomment sections dengan `console.log`:

```typescript
console.log(`🔄 Starting PDF generation for ${sellers.length} sellers`);
console.log(`📝 Received PDF chunk: ${chunk.length} bytes`);
console.log(`✅ PDF end event fired, total chunks: ${chunks.length}`);
```

### Test PDF Generation Locally
Buat file test untuk generate PDF:

```typescript
import { generatePDFBuffer } from "@/lib/services/reportService";

const sellers = [
  {
    id: "1",
    store_name: "Test Store",
    pic_name: "John Doe",
    pic_email: "john@example.com",
    pic_city: "Jakarta",
    status: "ACTIVE",
    // ... other fields
  }
];

const pdfBuffer = await generatePDFBuffer(sellers, "ALL");
console.log(`PDF Size: ${pdfBuffer.length} bytes`);
```

---

## 📋 Checklist

- ✅ Admin user terlogin dan bisa akses `/admin/sellers/manage`
- ✅ Ada sellers di database (check via `/api/admin/sellers/report?status=ALL&format=json`)
- ✅ Supabase credentials benar di `.env.local`
- ✅ PDFKit library terinstall (`npm list pdfkit`)
- ✅ Server tidak error (check terminal logs)
- ✅ Network request status 200 (check Network tab)
- ✅ PDF blob size > 0 bytes (check Console)

---

## 📞 Getting Help

Jika masih error setelah follow troubleshooting ini:

1. **Collect debug info:**
   - Screenshot dari Browser Console (all logs)
   - Screenshot dari Network tab (request/response)
   - Log messages dari terminal
   - Seller count dari database

2. **Report dengan format:**
   ```
   Error: [exact error message]
   Status code: [HTTP status]
   Seller count: [number of sellers]
   Steps to reproduce: [what you did]
   ```

---

## 🚀 Quick Fix Summary

```bash
# 1. Restart development server
npm run dev

# 2. Clear browser cache (Ctrl+Shift+Delete)

# 3. Check database has data
# Go to Supabase > SQL Editor
SELECT COUNT(*) FROM sellers;

# 4. Test JSON endpoint
curl "http://localhost:3000/api/admin/sellers/report?status=ALL&format=json"

# 5. Try download from UI again
# Go to http://localhost:3000/admin/sellers/manage
# Click "📄 Download PDF"

# 6. Check browser console (F12) untuk detailed error
```
