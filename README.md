# 🎓 CBT Portal - Portal Ujian & Tryout Online Modern

Aplikasi Computer-Based Test (CBT) modern berbasis web yang dibangun menggunakan **Next.js (App Router)** dan **Tailwind CSS**. Sistem ini dirancang untuk memfasilitasi administrasi ujian online yang aman, cepat, dan interaktif dengan fitur Proctoring, Certificate Builder, Group Analytics, serta Impor Peserta massal.

---

## 🚀 Fitur Utama & Keunggulan

### 🔐 1. Portal Autentikasi & Keamanan (Login Portal)
*   Form masuk yang modern dan aman dengan verifikasi hak akses *role-based* (Super Admin / Peserta).
*   Sistem notifikasi responsif dengan efek neon interaktif.

### 📊 2. Dashboard Peserta & Admin
*   **Portal Peserta**: Halaman beranda yang menampilkan daftar ujian aktif, riwayat ujian, skor kelulusan, dan tautan unduh sertifikat.
*   **Admin Panel**: Pusat manajemen statistik yang menampilkan jumlah soal, kategori, sesi ujian aktif, tingkat kelulusan, grafik komparasi performa grup, dan log pelanggaran peserta.

### 📂 3. Manajemen Soal & Kategori (Question Bank)
*   **Bank Soal**: Mendukung pembuatan soal pilihan ganda (dengan kunci jawaban dan bobot skor) serta soal esai.
*   **Kategori Soal**: Pengelompokan soal berdasarkan materi atau bidang studi.

### 📅 4. Penjadwalan & Konfigurasi Ujian (Assessment Schedule)
*   Konfigurasi waktu pengerjaan (durasi menit), masa aktif ujian, dan nilai KKM kelulusan.
*   **Mode Rilis Sertifikat**: Pilihan rilis sertifikat otomatis setelah lulus KKM atau rilis manual oleh administrator.

### 📜 5. Certificate Builder & Customizer
*   Administrator dapat memilih salah satu dari 3 desain sertifikat digital kelulusan:
    *   **Formal & Klasik (Classic)**: Bingkai emas-biru formal ganda yang elegan.
    *   **Minimalis & Bersih (Modern)**: Garis aksen toska modern yang bersih.
    *   **Kreatif & Dinamis (Creative)**: Gradasi warna ungu-biru yang kekinian.
*   Sertifikat digital dinamis ini dapat diunduh/dicetak langsung oleh peserta yang lulus.

### 👥 6. Manajemen Peserta & Impor Excel
*   Modul untuk mengelola data peserta dan pembagian grup/kelas.
*   Fitur impor data peserta secara massal menggunakan file spreadsheet Excel (`.xlsx`).

### 🛡️ 7. Proctoring & Log Pelanggaran Layar
*   Sistem proteksi pengerjaan ujian yang memantau perpindahan tab browser atau aplikasi peserta.
*   Pelanggaran dicatat secara *real-time* ke server proctoring log.

### 📉 8. Analisis Performa Ujian (Group Analytics)
*   Bagan bar chart interaktif di dashboard admin yang menampilkan perbandingan rata-rata skor kelulusan antar kelas/grup peserta.

---

## 📸 Dokumentasi & Pratinjau Tampilan

### 🔑 Tampilan Login Portal
Halaman masuk bagi peserta dan administrator CBT dengan validasi state-based.
<img width="1366" height="605" alt="Tampilan Login" src="https://github.com/user-attachments/assets/8f14e5b7-9953-4dcd-8246-7dd53e751b73" />

### 📈 Tampilan Dashboard Peserta
Beranda peserta ujian untuk melihat jadwal ujian aktif yang siap dikerjakan.
<img width="1363" height="600" alt="Tampilan Dashboard" src="https://github.com/user-attachments/assets/2d6ebfd6-b60d-4a24-8151-6efac6e42dd2" />

### 🛠️ Tampilan Panel Admin
Dashboard pusat kendali administrator yang menyajikan data statistik dan visualisasi data performa.
<img width="1362" height="602" alt="Tampilan Panel Admin" src="https://github.com/user-attachments/assets/f476f5e7-fb81-4037-b7ed-ab14248ac4f4" />

### 🗂️ Tampilan Kategori Soal
Halaman manajemen untuk membuat, mengedit, dan mengelompokkan bidang materi studi.
<img width="1365" height="601" alt="Tampilan Kategori Soal" src="https://github.com/user-attachments/assets/13a4d461-867a-4058-8955-eff673949d5b" />

### 📝 Tampilan Bank Soal
Halaman penulisan soal ujian pilihan ganda dan esai beserta bobot nilai masing-masing.
<img width="1366" height="599" alt="Tampilan Bank Soal" src="https://github.com/user-attachments/assets/7e570f06-62d7-4556-8b44-ce4ab364d962" />

### 📅 Tampilan Jadwal Ujian
Halaman pengaturan sesi ujian lengkap dengan pilihan rilis sertifikat dan kustomisasi template desain.
<img width="1366" height="602" alt="Tampilan Jadwal Ujian" src="https://github.com/user-attachments/assets/52cfeecc-4146-4f33-acfe-f11011c4ebcc" />

### 👥 Tampilan Peserta & Manajemen Grup
Halaman pengelolaan daftar peserta ujian beserta fitur tambah, hapus, dan impor via Excel.
<img width="1365" height="600" alt="Tampilan Peserta" src="https://github.com/user-attachments/assets/9c457ff2-b3c4-4505-8afa-55a76defeaff" />

### 📜 Tampilan Sertifikat Digital (Desain Dinamis)
Pratinjau sertifikat digital kelulusan peserta yang dicetak berdasarkan template pilihan administrator.
<img width="1366" height="599" alt="Tampilan Sertifikat Dinamis" src="https://github.com/user-attachments/assets/94539190-4cbe-40cb-aba2-b54bccb02984" />
<img width="1366" height="606" alt="Tampilan Sertifikat Klasik" src="https://github.com/user-attachments/assets/077f7a56-3ae5-404a-a79b-361da81a0695" />

---

## 🛠️ Stack Teknologi

- **Frontend core**: React.js 18 & Next.js 14 (App Router)
- **Styling**: Tailwind CSS (untuk layouting & desain responsif)
- **State Management**: Zustand
- **Icons**: Lucide React
- **HTTP Client**: Axios (terintegrasi dengan JWT authentication & dynamic interceptors)

---

## ⚙️ Cara Memulai Pengoperasian

### 1. Prasyarat
Pastikan Anda sudah menginstal:
- [Node.js](https://nodejs.org) (Versi 18 ke atas disarankan)
- Package Manager npm, yarn, pnpm, atau bun.

### 2. Instalasi Dependensi
Jalankan perintah berikut di terminal repositori frontend:
```bash
npm install
```

### 3. Konfigurasi Environment (`.env.local`)
Buat file `.env.local` pada direktori root dan arahkan backend API url:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### 4. Menjalankan Server Pengembangan
Jalankan server lokal:
```bash
npm run dev
```
Buka browser dan akses [http://localhost:3000](http://localhost:3000) untuk melihat hasilnya.

### 5. Build Produksi
Untuk mengompilasi dan mengoptimalkan aplikasi untuk mode produksi:
```bash
npm run build
npm run start
```
