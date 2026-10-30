/* Pengaturan lab yang boleh diubah pengelola.
   urlPencatat: URL Web App Google Apps Script (lihat pencatat/PANDUAN.md). Isi agar nama, email, asal sekolah,
                dan angka progres pengguna tercatat di Google Sheets. Kosongkan untuk mematikan pencatatan.
   kontak:      email/WA pengelola yang ditampilkan di layar Masuk untuk permintaan hapus data.
   aplikasi:    id dari js/aplikasi.js (mis. 'joining-tables') agar lab hanya berisi satu kategori.
                Kosong = lab lengkap. Diisi otomatis oleh alat/bangun-aplikasi.js untuk tiap folder aplikasi. */
window.LAB_CONFIG = {
  urlPencatat: 'https://script.google.com/macros/s/AKfycbx29xvFZ9Dq4RBEeGNordnOvf2I4PJ-xTrqiuz22prjUyqF3VK7BkMc-PMVuI2SZx1b/exec',
  pengelola: 'Pengelola Lab Maya SQL-Acep Rahmat-SMK Wikrama Bogor',
  kontak: '08569000223',
  aplikasi: '',
};
