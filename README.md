# 🛒 Warungpedia

**Warungpedia** adalah platform marketplace yang menghubungkan penjual UMKM dengan pembeli. Dibangun menggunakan Next.js 15, TypeScript, Tailwind CSS, dan Supabase.

## 📋 Deskripsi Project

Project ini dikembangkan sebagai bagian dari mata kuliah **Proyek Perangkat Lunak** dengan tujuan membuat sistem marketplace yang memudahkan:

- 🏪 Penjual UMKM untuk mendaftar dan mengelola toko online
- 🛍️ Pembeli untuk mencari dan membeli produk lokal
- 👨‍💼 Admin untuk melakukan verifikasi dan monitoring

## 🏗️ Arsitektur

Project ini menggunakan pola **MVC (Model-View-Controller)**:

- **View (V)**: React Components (`app/**/*.tsx`) - UI menggunakan Tailwind CSS
- **Controller (C)**: API Route Handlers (`app/api/**/*.ts`) - Business logic
- **Model (M)**: Supabase Client (`lib/supabaseClient.ts`) - Database, Auth, Storage

### Tech Stack

```
Frontend:
├── Next.js 15 (App Router)
├── TypeScript
├── Tailwind CSS
└── React 19

Backend:
├── Next.js API Routes
├── Supabase (PostgreSQL)
├── Supabase Auth
└── Supabase Storage
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x atau lebih tinggi
- npm, yarn, pnpm, atau bun
- Akun Supabase (gratis)

### 1. Clone Repository

```bash
git clone https://github.com/sulhanfuadi/warungpedia.git
cd warungpedia
```

### 2. Install Dependencies

```bash
npm install
# atau
yarn install
# atau
pnpm install
```

### 3. Setup Environment Variables

Buat file `.env.local` di root folder:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Cara mendapatkan credentials Supabase:**

1. Login ke [https://supabase.com](https://supabase.com)
2. Buat project baru atau buka project yang sudah ada
3. Klik **Settings** → **API**
4. Copy `Project URL` dan `anon/public key`

### 4. Setup Database

Buka **SQL Editor** di Supabase Dashboard, lalu jalankan script database.

### 6. Run Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

<!-- ## 📁 Struktur Folder

```
warungpedia/
├── app/
│   ├── api/
│   │   └── penjual/
│   │       └── register/
│   │           └── route.ts          # API endpoint registrasi penjual
│   ├── penjual/
│   │   └── register/
│   │       └── page.tsx              # Halaman form registrasi
│   ├── layout.tsx                    # Root layout
│   ├── page.tsx                      # Homepage
│   └── globals.css                   # Global styles
├── lib/
│   └── supabaseClient.ts             # Supabase client configuration
├── public/                           # Static assets
├── resources/                        # Dokumentasi project
│   ├── SRS_MartPlace.pdf
│   ├── Class_Diagram.mmd
│   └── GUI_Storyboard.html
├── .env.local                        # Environment variables (JANGAN COMMIT!)
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
``` -->

<!-- ## 🎯 Fitur yang Sudah Diimplementasi

### ✅ Registrasi Penjual (SRS-MartPlace-01)

**Endpoint:** `/api/penjual/register`
**Method:** `POST`

**Fitur:**

- Form registrasi dengan 14 field data penjual
- Validasi password (minimal 8 karakter, huruf besar, angka, simbol)
- Upload foto PIC dan file KTP
- Integrasi dengan Supabase Auth (sign up)
- Upload file ke Supabase Storage
- Simpan data ke database dengan status `PENDING`
- Email verification otomatis

**Flow:**

1. Penjual mengisi form di `/penjual/register`
2. Submit → API Route Handler
3. Auth: Create user account (Supabase Auth)
4. Storage: Upload foto & KTP (Supabase Storage)
5. Database: Insert data penjual (PostgreSQL)
6. Email: Kirim link aktivasi (Supabase Auth)

## 🔐 Security

- ✅ Row Level Security (RLS) enabled di Supabase
- ✅ Environment variables untuk credentials
- ✅ Password hashing otomatis (Supabase Auth)
- ✅ File validation (tipe & ukuran)
- ✅ CORS protection (Next.js API Routes)

## 📚 Dokumentasi Tambahan

Dokumentasi lengkap tersedia di folder `/resources`:

- **SRS (Software Requirements Specification)**: Spesifikasi kebutuhan sistem
- **Class Diagram**: Struktur data dan relasi
- **GUI Storyboard**: Mockup interface -->

## 🧪 Testing

```bash
# Run development server
npm run dev

# Build production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

<!-- ## 📦 Deployment

### Deploy ke Vercel

Cara termudah untuk deploy project Next.js:

1. Push code ke GitHub
2. Buka [Vercel](https://vercel.com)
3. Import repository
4. Tambahkan environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/sulhanfuadi/warungpedia) -->

## 🤝 Contributing

Project ini dikembangkan untuk pembelajaran. Kontribusi dan feedback sangat diterima!

### Git Workflow

```bash
# Buat branch baru
git checkout -b feature/nama-fitur

# Commit changes
git add .
git commit -m "feat: deskripsi fitur"

# Push ke remote
git push -u origin feature/nama-fitur

# Buat Pull Request di GitHub
```

<!-- ### Commit Message Convention

```
feat: menambah fitur baru
fix: memperbaiki bug
docs: update dokumentasi
style: formatting code
refactor: refactoring code
test: menambah test
chore: maintenance
``` -->

## 📄 License

Project ini menggunakan [MIT License](LICENSE).

Copyright (c) 2025 sulhanfuadi

<!-- ## 👥 Tim Pengembang

- **Sulhan Fuadi** - Developer
- **Pak Aris** - Dosen Pembimbing -->

<!-- ## 📞 Kontak

Untuk pertanyaan atau feedback:

- GitHub: [@sulhanfuadi](https://github.com/sulhanfuadi)
- Email: sulhanfuadi@example.com -->

## 🙏 Acknowledgments

- Next.js Team untuk framework yang amazing
- Supabase Team untuk BaaS platform yang powerful
- Tailwind CSS untuk utility-first CSS framework
- Pak Aris untuk bimbingan dan arahan project

---

**Made with ❤️ for Mata Kuliah Proyek Perangkat Lunak**

## Fitur SRS 03-05

- **SRS-MartPlace-03**: Upload produk oleh penjual (foto utama, galeri, varian dengan harga/stok, spesifikasi dinamis) mengacu flow UI marketplace.
- **SRS-MartPlace-04**: Katalog publik (tanpa login) beserta halaman detail produk, menampilkan rating rata-rata dan komentar (placeholder).
- **SRS-MartPlace-05**: Pencarian produk via filter nama produk, nama toko, kategori, dan lokasi (kota/provinsi) di halaman beranda.
