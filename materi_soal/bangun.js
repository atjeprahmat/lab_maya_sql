// Bangun js/latihan-data.js dari JSON di folder ini. Jalankan ulang setiap kali JSON-nya diubah:
//   node materi_soal/bangun.js
// (Lab dibuka lewat file://, jadi browser tidak boleh membaca JSON langsung; datanya dibungkus sebagai skrip.)
const fs = require('fs'), path = require('path');
const baca = f => JSON.parse(fs.readFileSync(path.join(__dirname, f), 'utf8'));
const latihan = baca('latihan-minimarket.json').latihan;
const studi = baca('studi-kasus-minimarket.json').materi;
const isi = `// Dibangkitkan oleh materi_soal/bangun.js dari latihan-minimarket.json dan studi-kasus-minimarket.json. Jangan diedit langsung.
window.LATIHAN_DATA = ${JSON.stringify({ latihan, studi }, null, 1)};
`;
fs.writeFileSync(path.join(__dirname, '..', 'js', 'latihan-data.js'), isi);
console.log(`js/latihan-data.js: ${Object.keys(latihan).length} latihan perintah, ${studi.latihan.length} soal studi kasus.`);
