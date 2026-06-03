# Daftar Tugas & Prioritas Portal CBT (TODO List)

Berikut adalah daftar tugas untuk melengkapi Portal CBT menjadi sistem ujian yang aman, tangguh, dan lengkap.

## 🔴 Prioritas Tinggi (Keamanan & Kendali Ujian)
- [x] **Buka Kunci / Lanjutkan Sesi (Resume/Unlock Session)**
  - [x] Tambahkan tombol "Buka Kunci" di baris peserta jika statusnya terkunci/masalah teknis.
  - [x] Hubungkan ke endpoint API baru untuk mengatur ulang status kunci sesi peserta.
- [x] **Paksa Kumpul Jawaban (Force Submit)**
  - [x] Sediakan opsi tindakan di baris peserta untuk langsung menutup ujian dan mengunci status sesi menjadi `force_submitted`.
  - [x] Sinkronisasi dengan database backend untuk menghitung skor jawaban terakhir peserta.
- [x] **Inspektur Rincian Pelanggaran Layar**
  - [x] Tambahkan modal "Log Pelanggaran" yang dipicu saat mengklik jumlah pelanggaran peserta.
  - [x] Tampilkan riwayat timestamp beserta deskripsi kejadian secara detail (misal: "Pindah Tab", "Keluar Layar Penuh").

---

## 🟡 Prioritas Sedang (Operasional & UX)
- [x] **Ekspor Laporan Nilai Ujian (Excel/PDF)**
  - [x] Buat tombol ekspor rekapitulasi nilai ujian per jadwal di halaman monitor.
  - [x] Implementasikan library ekspor (misal: laravel-excel di backend) untuk format file `.xlsx` / `.pdf`.
- [x] **Pembatasan Copy-Paste & Klik Kanan**
  - [x] Tambahkan pencegahan event klik kanan (`contextmenu`) dan tombol pintasan salin (`ctrl+c` / `cmd+c`) pada halaman pengerjaan ujian peserta.
- [x] **Mode Layar Penuh Wajib (Strict Fullscreen Mode)**
  - [x] Terapkan validasi layar penuh saat ujian berlangsung. Sesi ujian hanya dapat diakses saat browser berada pada mode layar penuh.

---

## 🟢 Prioritas Rendah (Pelengkap Fitur)
- [ ] **Manajemen Rilis Sertifikat Kelulusan**
  - [ ] Tambahkan toggle opsi rilis sertifikat: "Otomatis Rilis setelah Ujian Selesai" atau "Rilis Manual oleh Admin".
- [ ] **Dasbor Statistik Kualitas Soal (Item Analysis)**
  - [ ] Buat grafik statistik soal tersulit dan termudah berdasarkan presentasi keberhasilan jawaban seluruh peserta.
