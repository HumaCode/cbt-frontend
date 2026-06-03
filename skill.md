# 🗺️ Next.js Skill Roadmap & Checklist: CBT Universal Project

Dokumen ini berisi daftar keahlian (*skills*) dan fitur teknis yang perlu dikuasai dan diimplementasikan secara bertahap untuk membangun *frontend* aplikasi CBT menggunakan **Next.js (App Router)** dan **Clean Architecture**.

---

## 🟢 Fase 1: Fondasi Next.js & Tailwind (Presentation Layer)
*Fokus pada pembuatan UI yang statis dan sistem routing bawaan Next.js.*

- [ ] **App Router Basics:** Memahami cara kerja struktur folder `app/` (membuat `page.tsx`, `layout.tsx`, dan `loading.tsx`).
- [ ] **Server Components vs Client Components:** Memahami kapan harus menggunakan `use client` di baris paling atas *file* (wajib untuk komponen yang butuh *state*, *timer*, atau *event listener* seperti tombol klik).
- [ ] **Tailwind CSS Grid & Flexbox:** Membuat *layout dashboard* dan *grid* navigasi nomor soal yang responsif.
- [ ] **Dumb Components:** Membuat komponen UI murni (*Button*, *Input*, *Modal*, *Card*) di folder `src/presentation/components` yang tidak memiliki logika pemanggilan API sama sekali.

## 🟡 Fase 2: Penguasaan State & Logika (Application Layer)
*Fokus pada manajemen data di sisi klien (browser) tanpa menyentuh database eksternal.*

- [ ] **React Hooks Dasar:** Menguasai `useState` (untuk menyimpan jawaban sementara) dan `useEffect` (untuk mendeteksi perpindahan halaman).
- [ ] **Custom Hooks:** Membuat *hook* terpisah di folder `src/application/`. Misalnya, `useTimer()` untuk menghitung waktu mundur ujian secara mandiri.
- [ ] **Global State Management:** Menggunakan *Context API* atau *library* seperti **Zustand** untuk menyimpan *state* ujian (sisa waktu, daftar soal, jawaban saat ini) agar bisa diakses oleh seluruh komponen UI tanpa *prop drilling*.
- [ ] **Local Storage API:** Menyimpan jawaban siswa ke `localStorage` secara otomatis setiap beberapa detik sebagai *backup* darurat sebelum dikirim ke API.

## 🟠 Fase 3: Integrasi API & Keamanan (Infrastructure Layer)
*Fokus pada komunikasi antara Next.js dan API (seperti backend dengan Laravel).*

- [ ] **Setup Axios / Fetcher:** Membuat *instance* API di folder `src/infrastructure/` dengan pengaturan Base URL.
- [ ] **JWT Handling:** Menyimpan *token auth* dengan aman (direkomendasikan menggunakan HTTP-Only Cookies) dan menyisipkannya ke setiap *header request* API.
- [ ] **Next.js Middleware:** Membuat *file* `middleware.ts` untuk memblokir peserta yang belum *login* agar tidak bisa mengakses halaman `/exam`, mirip dengan konsep *middleware auth* di arsitektur *backend* tradisional.
- [ ] **Data Fetching (SWR / React Query):** Menggunakan *library* pemanggil data agar Next.js bisa melakukan *caching* soal CBT. Ini mencegah *server backend* jebol ketika direfresh berkali-kali oleh peserta.

## 🔴 Fase 4: Fitur CBT Lanjutan (Advanced API & Browser APIs)
*Fokus pada fitur-fitur khusus pengawasan ujian dan interaksi real-time.*

- [ ] **Fullscreen API:** Memaksa elemen antarmuka ujian masuk ke mode layar penuh saat peserta menekan tombol "Mulai Ujian".
- [ ] **Page Visibility API:** Mendeteksi jika peserta membuka *tab* baru atau mengecilkan *browser* (Tab Focus Loss), lalu memicu peringatan otomatis.
- [ ] **Disable Browser Defaults:** Mencegah pintasan *keyboard* tertentu (seperti `Ctrl+C`, `Ctrl+V`, klik kanan) menggunakan intervensi *event listener* React.
- [ ] **Real-time Engine Integration:** Mengintegrasikan *frontend* dengan layanan berbasis *WebSocket* atau *BaaS* seperti **Supabase** / **Firebase** untuk membaca *stream* data secara *live* pada fitur **Live Leaderboard**.

## 🟣 Fase 5: Clean Architecture Enforcement (Core Layer)
*Fokus pada kedisiplinan kode agar tidak mudah rusak saat aplikasi membesar.*

- [ ] **TypeScript Interfaces:** Mendefinisikan bentuk data secara statis di folder `src/core/`. Misalnya: `export interface Question { id: number, text: string, options: Option[] }`.
- [ ] **Repository Pattern:** Memastikan komponen UI memanggil fungsi seperti `examRepository.submitAnswer()` dari *Infrastructure Layer*, bukan menulis ulang URL dan konfigurasi *fetch* di dalam tombol UI.
- [ ] **Error Handling & Toast:** Membuat standarisasi penangkapan *error* dari API dan menampilkannya dalam bentuk notifikasi (*Toast*) yang elegan kepada pengguna.