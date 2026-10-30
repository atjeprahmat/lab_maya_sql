# Memasang pencatat pengguna (Google Sheets)

Pencatat ini membuat lab mengirim **nama, email, asal sekolah**, dan angka progres (tiket selesai, soal selesai, XP, level)
ke Google Sheets milikmu, satu baris per email. Jawaban, query, catatan, dan refleksi murid **tidak** dikirim.
Murid tercatat saat menekan Masuk di layar "Isi data diri". Tidak ada kotak centang; pemberitahuan di atas tombol Masuk menjelaskan hal ini.

## Langkah (±10 menit, sekali saja)

1. Buka [sheets.new](https://sheets.new) dan beri nama, misalnya **Pengguna Lab Maya SQL**.
2. Menu **Ekstensi → Apps Script**. Hapus isi `Code.gs` bawaan, lalu tempel seluruh isi berkas `pencatat/Code.gs`. Klik **Simpan**.
3. Klik **Terapkan (Deploy) → Penerapan baru (New deployment)**.
   - Jenis: **Aplikasi web (Web app)**
   - Jalankan sebagai: **Saya (akunmu)**
   - Yang memiliki akses: **Siapa saja (Anyone)**. Ini perlu agar lab murid bisa mengirim tanpa login Google.
4. Klik **Terapkan**, izinkan akses saat diminta (pilih akunmu → Lanjutan → Buka proyek → Izinkan).
5. Salin **URL aplikasi web** (berakhiran `/exec`). Buka URL itu di browser: harus muncul *Pencatat Lab Maya SQL aktif.*
6. Buka `js/config.js` di folder lab dan isi:
   ```js
   urlPencatat: 'https://script.google.com/macros/s/XXXX/exec',
   kontak: 'email-atau-WA-kamu',   // ditampilkan untuk permintaan hapus data
   ```
7. **Bangun ulang aplikasi** supaya URL-nya ikut terbawa ke ketujuh aplikasi di `dist/`:
   ```
   node alat/bangun-aplikasi.js
   ```
8. Buka lab, isi data diri lalu tekan Masuk. Dalam beberapa detik baris baru muncul di Google Sheets.

Setiap aplikasi dicatat di sheet sendiri yang dibuat otomatis saat pengguna pertamanya masuk: **Pengguna** (lab lengkap),
**Pengguna · querying-data**, **Pengguna · joining-tables**, dan seterusnya. Kolomnya: Email, Nama, Asal sekolah,
Pertama masuk, Terakhir aktif, Tiket terpandu selesai, Soal latihan selesai, XP, Level, Jumlah masuk.

Tidak muncul? Pastikan perangkat terhubung internet, dan URL di `js/config.js` berawalan
`https://` dan berakhiran `/exec` (bukan `/dev`). Catatan yang gagal terkirim saat offline akan dikirim ulang otomatis.

## Kalau skripnya diubah

**Terapkan → Kelola penerapan → ✎ Edit → Versi: Versi baru → Terapkan.** URL-nya tetap sama, jadi `js/config.js` tidak perlu diubah.

## Catatan penting

- **Data anak.** Sebagian besar murid SMK berusia di bawah 18 tahun. UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi
  mengatur data anak secara khusus (persetujuan orang tua/wali). Pemberitahuan di lab hanya ditujukan kepada murid (menekan Masuk dianggap setuju),
  jadi izin orang tua/wali (bila diperlukan) diurus di luar lab, dan tanggung jawab pengendali data tetap ada pada pengelola. Simpan sheet ini secara pribadi (jangan dibagikan "siapa saja
  yang memiliki link"), hapus data bila diminta, dan jangan pakai untuk keperluan selain yang dijelaskan ke murid.
- **Siapa saja bisa mengirim ke URL ini.** Skrip memvalidasi email, membatasi panjang teks, dan mencegah teks dijalankan
  sebagai rumus, tetapi tidak bisa membedakan murid asli dari kiriman iseng. Anggap angkanya sebagai gambaran pemakaian,
  bukan nilai resmi.
- **Lab tetap jalan offline.** Kalau tidak ada internet, catatan disimpan di perangkat dan dikirim otomatis saat online.
- Kosongkan `urlPencatat` untuk mematikan pencatatan. Layar "Isi data diri" lalu menjelaskan bahwa data hanya tersimpan
  di perangkat dan pemberitahuan pencatatan disembunyikan.
