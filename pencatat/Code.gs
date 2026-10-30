/**
 * Pencatat pengguna Lab Maya SQL → Google Sheets.
 * Menerima catatan dari lab (nama, email, asal sekolah, angka progres) dan menyimpannya satu baris per email.
 * Cara memasang: lihat pencatat/PANDUAN.md.
 */
const NAMA_SHEET = 'Pengguna';   // tiap aplikasi Lab Maya dicatat di sheet sendiri: 'Pengguna · joining-tables', dst.
const KOLOM = ['Email', 'Nama', 'Asal sekolah', 'Pertama masuk', 'Terakhir aktif',
  'Tiket terpandu selesai (dari 4)', 'Soal latihan selesai', 'XP', 'Level', 'Jumlah masuk'];

function doPost(e) {
  const kunci = LockService.getScriptLock();
  kunci.waitLock(10000);
  try {
    const d = JSON.parse(e.postData.contents);
    const email = String(d.email || '').trim().toLowerCase();
    if (!/^[^\s@=+\-][^\s@]*@[^\s@]+\.[a-z]{2,}$/.test(email) || email.length > 120) return balas('email tidak valid');
    const sh = ambilSheet(d.aplikasi);
    const baris = cariBaris(sh, email);
    const sekarang = new Date();
    const isi = [teks(d.nama, 80), teks(d.sekolah, 120)];
    const progres = [angka(d.langkah, 4), angka(d.soal, 100), angka(d.xp, 5000), angka(d.level, 200)];
    if (baris) {
      const r = sh.getRange(baris, 1, 1, KOLOM.length), v = r.getValues()[0];
      const masuk = (Number(v[9]) || 0) + (d.jenis === 'masuk' ? 1 : 0);
      r.setValues([[email, ...isi, v[3], sekarang, ...progres, masuk]]);
    } else {
      sh.appendRow([email, ...isi, sekarang, sekarang, ...progres, 1]);
    }
    return balas('ok');
  } catch (err) {
    return balas('galat: ' + err);
  } finally {
    kunci.releaseLock();
  }
}

/** Buka URL Web App di browser untuk memastikan pencatat aktif. */
function doGet() { return balas('Pencatat Lab Maya SQL aktif.'); }

function ambilSheet(aplikasi) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const id = String(aplikasi || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40);
  const nama = id && id !== 'lengkap' ? NAMA_SHEET + ' · ' + id : NAMA_SHEET;
  let sh = ss.getSheetByName(nama);
  if (!sh) {
    sh = ss.insertSheet(nama);
    sh.appendRow(KOLOM);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, KOLOM.length).setFontWeight('bold');
  }
  return sh;
}
function cariBaris(sh, email) {
  const ketemu = sh.getRange('A:A').createTextFinder(email).matchEntireCell(true).findNext();
  return ketemu ? ketemu.getRow() : 0;
}
/** Teks dari pengguna: dipotong, dan diberi petik bila diawali = + - @ agar tidak dijalankan sebagai rumus. */
function teks(v, maks) { return String(v == null ? '' : v).trim().slice(0, maks).replace(/^[=+\-@]/, "'$&"); }
function angka(v, maks) { return Math.max(0, Math.min(maks, Math.round(Number(v) || 0))); }
function balas(t) { return ContentService.createTextOutput(t); }
