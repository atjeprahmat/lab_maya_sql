// Bangun lab menjadi beberapa aplikasi terpisah, satu per kategori (daftar di js/aplikasi.js).
//   node alat/bangun-aplikasi.js            → semua aplikasi
//   node alat/bangun-aplikasi.js joining-tables studi-kasus   → hanya aplikasi tertentu
// Hasil: dist/lab-maya-sql-NN-<id>/ (siap dibuka / diunggah) dan dist/lab-maya-sql-NN-<id>.zip.
// Isi folder aplikasi sama dengan lab lengkap, hanya js/config.js yang memilih kategorinya.
const fs = require('fs'), path = require('path'), vm = require('vm'), { spawnSync } = require('child_process');

const AKAR = path.join(__dirname, '..'), DIST = path.join(AKAR, 'dist');
const muat = (berkas, nama) => { const ctx = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(AKAR, berkas), 'utf8'), ctx); return ctx.window[nama]; };
const APLIKASI = muat('js/aplikasi.js', 'LAB_APLIKASI'), CONFIG = muat('js/config.js', 'LAB_CONFIG');
const DIBAWA = ['index.html', 'css', 'js', 'vendor'];   // yang dibutuhkan siswa; materi_soal, pencatat, alat, dll. tidak ikut

const pilihan = process.argv.slice(2);
const daftar = Object.entries(APLIKASI).filter(([id]) => !pilihan.length || pilihan.includes(id));
if (!daftar.length) { console.error('Aplikasi tidak dikenal. Pilihan: ' + Object.keys(APLIKASI).join(', ')); process.exit(1); }
fs.mkdirSync(DIST, { recursive: true });

const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
/** ZIP siap unggah. Dicoba berurutan: tar bawaan Windows (tar milik Git tidak bisa membuat zip), PowerShell, zip. */
function buatZip(nama, zip) {
  const win = process.platform === 'win32', tarWin = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe');
  const cara = [
    win && fs.existsSync(tarWin) && [tarWin, ['-a', '-c', '-f', nama + '.zip', nama]],   // nama relatif: "D:\..." dibaca tar sebagai host
    win && ['powershell', ['-NoProfile', '-Command', `Compress-Archive -Path '${nama}' -DestinationPath '${nama}.zip' -Force`]],
    ['zip', ['-qr', nama + '.zip', nama]],
  ].filter(Boolean);
  for (const [prog, arg] of cara) {
    fs.rmSync(zip, { force: true });
    const z = spawnSync(prog, arg, { cwd: DIST });
    if (z.status === 0 && fs.existsSync(zip) && fs.readFileSync(zip).subarray(0, 2).toString() === 'PK') return true;
  }
  fs.rmSync(zip, { force: true });
  return false;
}
const ukuran = d => fs.readdirSync(d, { withFileTypes: true }).reduce((a, e) => a + (e.isDirectory() ? ukuran(path.join(d, e.name)) : fs.statSync(path.join(d, e.name)).size), 0);

for (const [id, app] of daftar) {
  const nama = `lab-maya-sql-${String(app.no).padStart(2, '0')}-${id}`, tujuan = path.join(DIST, nama);
  fs.rmSync(tujuan, { recursive: true, force: true });
  for (const b of DIBAWA) fs.cpSync(path.join(AKAR, b), path.join(tujuan, b), { recursive: true });

  // judul & deskripsi halaman (sebelum JavaScript jalan, mis. di daftar unggahan / mesin pencari)
  const judul = `Ngulik Data · Lab Maya SQL ${app.no} – ${app.judul}`;
  let html = fs.readFileSync(path.join(tujuan, 'index.html'), 'utf8');
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(judul)}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(`Lab Maya ${app.no} · ${app.kategori}: ${app.tujuan} SMK kelas X–XII, PPLG/RPL.`)}">`);
  fs.writeFileSync(path.join(tujuan, 'index.html'), html);

  // config: pengaturan pengelola dibawa, aplikasi dipilih
  fs.writeFileSync(path.join(tujuan, 'js', 'config.js'),
    `/* Dibangkitkan oleh alat/bangun-aplikasi.js untuk aplikasi "${id}". Ubah pengaturan di js/config.js lab lengkap, lalu bangun ulang. */\n` +
    `window.LAB_CONFIG = ${JSON.stringify({ ...CONFIG, aplikasi: id }, null, 2)};\n`);

  const zip = path.join(DIST, nama + '.zip');
  const infoZip = buatZip(nama, zip) ? `${(fs.statSync(zip).size / 1024).toFixed(0)} KB zip` : 'zip gagal (kompres folder secara manual)';
  console.log(`✓ ${nama.padEnd(42)} ${(ukuran(tujuan) / 1024 / 1024).toFixed(1)} MB · ${infoZip}`);
}
console.log(`\n${daftar.length} aplikasi di ${path.relative(AKAR, DIST)}${path.sep}`);
