# Lab Maya SQL – Analis Data Minimarket (Phi Minimart)

**Lab Maya 1 · Querying Data.** Lab Maya interaktif untuk murid SMK kelas X–XII (usia 15–17 tahun), Program Keahlian PPLG (Konsentrasi Rekayasa Perangkat Lunak, Basis Data).
Murid berperan sebagai **analis data junior** di minimarket fiktif Phi Minimart dan mengerjakan latihan per perintah dengan query SQL.

## Alur belajar (versi sekarang)

1. **Splash screen** (±2 detik, klik untuk lewati) → **Laman Muka** dengan kartu "Tentang lab ini"; narator membacakan sambutan, sasaran kelas X–XII, dan isi kartu.
2. **Isi data diri** (nama, email, asal sekolah + persetujuan) → **Briefing** singkat.
3. **Panduan**: latihan mini satu soal (tidak dinilai) yang meniru layar Aktivitas; yang harus dikerjakan disorot bingkai pink dan dibacakan narator.
   Tombol "⭐ Cara hitung XP & Level" menjelaskan XP (Dasar +10, Menengah +20, Lanjut +30; lihat solusi dulu = setengah) dan level (naik tiap 50 XP).
4. **Peta Aktivitas**: kartu perintah (SELECT FROM, ORDER BY, WHERE, …) dengan level dan XP.
5. **Latihan** per perintah, 3 langkah Pembelajaran Mendalam: 👀 **Amati contoh** (Memahami) → ✍️ **Kerjakan soal** (Mengaplikasi) →
   💭 **Renungkan** (Merefleksi: pertanyaan pilihan ganda **dan** catatan belajar wajib). Soal "tuntas" setelah ketiganya; muncul pop-up perayaan.
   Di **3 soal pertama** tiap aplikasi, sorotan + narator memandu langkah demi langkah (bisa dimatikan). Navigasi di bawah: ← kategori · materi selanjutnya →.
6. **Laporan**: rekap soal benar, soal tuntas, solusi dilihat, XP, refleksi diri, dan cetak.

> Catatan: 4 tiket terpandu di bawah saat ini **dimatikan** (`tiket: false` di `js/aplikasi.js`) agar beban siswa lebih ringan; kodenya tetap ada.
Urutan materi mengikuti bab *Querying Data* (SELECT, ORDER BY, WHERE, saringan lanjut):

| Langkah | Topik | Tiket |
|---|---|---|
| 1 dari 4 | Mengambil data (SELECT, FROM, AS, SELECT tanpa tabel) | Nama produk dan satuan untuk katalog online, dengan alias |
| 2 dari 4 | Mengurutkan (ORDER BY, LIMIT) | 5 produk termurah untuk spanduk promosi |
| 3 dari 4 | Menyaring (WHERE, AND/OR) | Transaksi cabang Tajur dengan minimal 4 barang (13 dari 180) |
| 4 dari 4 | Menyaring lanjut (IS NULL, IN, BETWEEN, LIKE, DISTINCT) | Karyawan yang nama belakangnya belum diisi (2 dari 13) |

JOIN dan GROUP BY disiapkan untuk Lab Maya 2 dan 3. Kode lamanya disimpan di `cadangan/` (tidak dimuat dan tidak perlu diunggah).

Setiap langkah punya 6 tahap yang mengikuti **3 pengalaman belajar Pembelajaran Mendalam (3M)**:
**Memahami** (Baca tiket → Rakit query → Jalankan & amati → Bandingkan) → **Mengaplikasi** (Terapkan: tulis query sendiri untuk soal penerapan)
→ **Merefleksi** (pertanyaan reflektif + jurnal: yang kupahami, yang masih membingungkan, tingkat keyakinan). Lencana terbuka setelah ketiganya dijalani.
Ada juga **Laporan Kerja** (ringkasan, refleksi, dan cetak). **Mode Bebas** (laboratorium terbuka) saat ini dimatikan (`adaBebas = false` di `js/app.js`); kodenya tetap ada.

## Cara membuka

- **Tanpa server:** klik dua kali `index.html` (Chrome, Edge, atau Firefox terbaru).
- **Di web/LMS:** unggah seluruh isi folder ini, lalu buka `index.html`. Tidak butuh server khusus, database, atau internet.

## Teknologi

- HTML, CSS, dan JavaScript murni, tanpa framework dan tanpa CDN. Semua aset ada di folder ini.
- SQL dijalankan di browser memakai **SQLite (sql.js 1.12.0, lisensi MIT)**, lihat `vendor/LICENSE-sql.js.txt`.
  File WebAssembly ditanam sebagai base64 (`vendor/sql-wasm-bin.js`) agar lab tetap berjalan saat dibuka dari `file://`.
- **Responsif.** Di laptop/PC/tablet mendatar, panggung (minimal 1280×720) melebar atau meninggi mengikuti rasio layar
  lalu diskalakan, sehingga tidak ada garis hitam di tepi (16:9, 16:10, 4:3, ultrawide). Di HP (tegak maupun mendatar)
  dan tablet tegak, lab memakai **mode HP**: kolom bertumpuk, halaman bisa di-scroll, menu dan kategori bisa digeser,
  tabel hasil tetap punya scroll sendiri. Diuji dari lebar 320 px sampai 2560 px.
- Murid **mengisi nama, email, dan asal sekolah** (tanpa password). Progres, rakitan, jawaban, XP, dan refleksi disimpan di
  `localStorage` **terpisah per email**, jadi satu komputer bisa dipakai bergantian. Laporan Kerja memuat identitas dan rekap latihan.
- **Pencatatan pengguna (opsional):** isi `urlPencatat` di `js/config.js` dengan URL Google Apps Script (lihat `pencatat/PANDUAN.md`)
  agar nama, email, asal sekolah, dan angka progres tercatat di Google Sheets pengelola. Murid harus mencentang persetujuan;
  jawaban & query tidak dikirim. Bila offline, catatan diantrekan dan dikirim saat online. Kosong = tidak ada data yang keluar dari perangkat.
- Suara: efek suara dibuat dengan Web Audio. Narasi memakai suara Bahasa Indonesia bawaan perangkat (Web Speech API) bila
  tersedia; bila tidak, narasi hanya tampil sebagai teks. Tombol **Suara** mematikan keduanya.
- Editor menolak tempel (paste) dan seret-lepas, supaya murid mengetik query sendiri. Query yang diketik murid
  dibatasi satu perintah SELECT.

## Struktur berkas

| Berkas | Isi |
|---|---|
| `index.html` | Kerangka panggung 16:9 dan semua layar |
| `css/lab.css` | Tampilan, sistem warna alat, animasi |
| `js/app.js` | Inti: skala panggung, progres, suara, mesin SQL, penilai, navigasi, kerangka 5 tahap |
| `js/langkah.js` | Isi 4 percobaan: tiket, alat rakit, visualisasi, skenario pembanding, simulasi, soal |
| `cadangan/` | Kode JOIN dan GROUP BY untuk Lab Maya berikutnya (tidak dimuat) |
| `js/data.js` | Data fiktif Phi Minimart: 8 tabel + tabel bantu `daftar_harga` |
| `js/config.js` | Pengaturan pengelola: URL pencatat Google Sheets dan kontak untuk permintaan hapus data |
| `pencatat/` | Skrip Google Apps Script penerima data pengguna + panduan pemasangan (tidak perlu diunggah bersama lab) |
| `js/latihan.js` | Layar latihan per perintah dan Studi Kasus: soal, hint bertahap, XP, penilaian |
| `js/latihan-data.js` | Materi & soal dari `materi_soal/` (dibangkitkan, jangan diedit langsung) |
| `js/latihan-3m.js` | Isi 3M tiap latihan: contoh query + pertanyaan amati (Memahami) dan pertanyaan reflektif (Merefleksi). Boleh disunting |
| `js/latihan-cek.js` | Query pemeriksa versi SQLite untuk soal yang aslinya memakai `information_schema` MySQL |
| `js/mysql.js` | Penerjemah MySQL → SQLite agar murid bisa menulis sintaks MySQL seperti di soal |
| `materi_soal/` | Sumber materi & soal (JSON), dataset `minimarket.sql`, dan skrip `bangun.js` |
| `vendor/` | sql.js dan lisensinya |

## Data

Data Phi Minimart adalah **data fiktif** (bukan data asli): 4 provinsi, 8 kota, 6 cabang, 13 karyawan, 6 kategori,
19 produk, 144 harga harian, dan 180 transaksi Januari–Februari 2026.
Semua angka di storyboard dan di soal sudah diverifikasi dengan data ini.

## Latihan per perintah & Studi Kasus

Peta Aktivitas disusun per kategori (acuan `sql.pdf`). Setiap kartu perintah membuka satu latihan dari
`materi_soal/latihan-minimarket.json`, dan kategori **Studi Kasus** berisi materi + 13 soal dari
`materi_soal/studi-kasus-minimarket.json`. Managing Databases dan Import & Export belum punya soal.

- Setiap latihan punya 3 fase Pembelajaran Mendalam: **🔍 Memahami** (jalankan contoh query yang berbeda dari soal lalu amati),
  **🛠️ Mengaplikasi** (kerjakan soal), **💭 Merefleksi** (pertanyaan reflektif, pilihan diacak tetap per soal, + catatan opsional).
  Isi fase Memahami & Merefleksi ada di `js/latihan-3m.js`. "3M lengkap" tampil di Peta (★) dan Laporan Kerja.
- Soal `select` dinilai dengan membandingkan hasil query murid dengan hasil kunci.
- Soal `ubah` (DDL/DML) dijalankan di salinan database yang segar, lalu kondisi akhirnya diperiksa dengan query `cek`.
- Soal ditulis dalam sintaks MySQL; `js/mysql.js` menerjemahkannya ke SQLite (TRUNCATE, RENAME TABLE, INSERT IGNORE,
  UPDATE/DELETE … JOIN, AUTO_INCREMENT, MODIFY/CHANGE, ADD CONSTRAINT, SET DEFAULT, SET FOREIGN_KEY_CHECKS, WITH ROLLUP, SHOW TABLES, DESCRIBE).

Alur kerja murid di latihan: **Pilih soal → Baca soal & skema tabel → Tulis & jalankan query → Kirim jawaban**.
Petunjuk dibuka satu per satu; setelah habis tersedia **Lihat solusi** (XP soal itu jadi setengah bila dilihat sebelum benar).
Level naik setiap 50 XP.

**Mengubah soal:** edit JSON di `materi_soal/`, lalu jalankan `node materi_soal/bangun.js` untuk memperbarui
`js/latihan-data.js`. Soal `ubah` baru yang query `cek`-nya memakai `information_schema` butuh versi SQLite di `js/latihan-cek.js`.

## Membangun aplikasi terpisah (satu per kategori)

Lab ini bisa dipecah menjadi beberapa aplikasi yang lebih singkat, masing-masing satu kategori (daftar di `js/aplikasi.js`):

| No | Aplikasi | Isi |
|---|---|---|
| 1 | Querying Data | 12 latihan |
| 2 | Joining Tables | 5 latihan |
| 3 | Grouping & Subqueries | 8 latihan |
| 4 | Managing Tables | 9 latihan |
| 5 | MySQL Constraints | 7 latihan |
| 6 | Modifying Data | 8 latihan |
| 7 | Studi Kasus Minimarket | materi + 13 soal gabungan |

```
node alat/bangun-aplikasi.js                     # semua aplikasi
node alat/bangun-aplikasi.js joining-tables      # satu aplikasi saja
```

Hasilnya ada di `dist/`: satu folder per aplikasi (buka `index.html`-nya) dan satu `.zip` siap unggah.
Setiap aplikasi punya Laman Muka, tujuan pembelajaran, progres (localStorage), dan sheet pencatat sendiri.
Semua aplikasi memakai kode yang sama: perbaiki di folder utama, lalu jalankan perintah di atas lagi.
Pengaturan `urlPencatat`, `pengelola`, dan `kontak` di `js/config.js` ikut terbawa ke setiap aplikasi.
Folder utama sendiri tetap menjadi **lab lengkap** (semua kategori dalam satu aplikasi).
