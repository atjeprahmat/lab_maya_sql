/* Lab Maya SQL · Phi Minimart — inti aplikasi: panggung 16:9, progres, suara, mesin SQL (sql.js), penilai, navigasi. */
(() => {
  'use strict';
  const Lab = (window.Lab = { langkah: [] });
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // ---------------------------------------------------------------- utilitas
  Lab.el = (tag, attr = {}, ...anak) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attr)) {
      if (v == null || v === false) continue;
      if (k === 'class') e.className = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else if (k === 'style' && typeof v === 'object') for (const [p, n] of Object.entries(v)) { if (p.startsWith('--')) e.style.setProperty(p, n); else e.style[p] = n; }
      else e.setAttribute(k, v === true ? '' : v);
    }
    for (const a of anak.flat()) if (a != null && a !== false) e.append(a instanceof Node ? a : document.createTextNode(String(a)));
    ikon(e);
    return e;
  };
  const el = Lab.el;
  Lab.esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  Lab.rp = n => 'Rp' + Number(n).toLocaleString('id-ID');
  Lab.angka = n => Number(n).toLocaleString('id-ID');

  // ---------------------------------------------------------------- ikon (SVG garis, konsisten)
  const P = {
    rumah: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    buku: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/><path d="M9 7h6"/>',
    peta: '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
    labu: '<path d="M9 3h6"/><path d="M10 3v6L4.5 18.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3"/><path d="M7 15h10"/>',
    suara: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>',
    bisu: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9l5 6M22 9l-5 6"/>',
    main: '<path d="M7 4l13 8-13 8z" fill="currentColor"/>',
    panah: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    kiri: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    lampu: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5.9 1.1.9 1.8V16h5.2v-.3c0-.7.3-1.3.9-1.8A6 6 0 0 0 12 3z"/>',
    ulang: '<path d="M4 4v6h6"/><path d="M4.5 10A8 8 0 1 1 6 17.5"/>',
    kode: '<path d="M8 6l-6 6 6 6M16 6l6 6-6 6"/>',
    banding: '<path d="M7 7h13l-4-4M17 17H4l4 4"/>',
    tiket: '<path d="M3 7a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-3a2 2 0 0 0 0-4z"/><path d="M14 5v14" stroke-dasharray="2 2"/>',
    cek: '<path d="M4 12l5 5L20 6"/>',
    gembok: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    cetak: '<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M6 14h12v7H6z"/>',
    kirim: '<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/>',
    simpan: '<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v6h8V3M8 21v-7h8v7"/>',
  };
  function ikon(root) {
    const daftar = root.matches?.('i[data-ikon]') ? [root] : [];
    daftar.push(...(root.querySelectorAll?.('i[data-ikon]:empty') ?? []));
    for (const i of daftar) {
      if (i.firstChild) continue;
      i.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[i.dataset.ikon] || ''}</svg>`;
    }
  }
  Lab.ikon = ikon;

  // ---------------------------------------------------------------- panggung (responsif)
  // Layar lebar/mendatar: panggung minimal 1280×720 yang melebar atau meninggi mengikuti rasio layar, lalu diskalakan,
  // jadi tidak ada garis hitam di tepi. Layar sempit (HP, tablet tegak): "mode HP" (html.sempit) dengan tata letak
  // bertumpuk, ukuran asli, dan halaman yang bisa di-scroll (lihat css/lab.css bagian Mode HP).
  const panggung = $('#panggung');
  Lab.sempit = false;
  function skala() {
    Lab.sempit = innerWidth < 900 || (innerHeight > innerWidth && innerWidth < 1100);
    document.documentElement.classList.toggle('sempit', Lab.sempit);
    if (Lab.sempit) { panggung.style.cssText = ''; return; }
    const rasio = innerWidth / innerHeight;
    const w = Math.round(Math.min(1920, Math.max(1280, 720 * rasio))), h = Math.round(Math.min(1080, Math.max(720, 1280 / rasio)));
    const s = Math.min(innerWidth / w, innerHeight / h);
    Object.assign(panggung.style, { width: w + 'px', height: h + 'px', transform: `translate(-50%, -50%) scale(${s})` });
  }
  addEventListener('resize', skala);

  // ---------------------------------------------------------------- progres (localStorage, aman bila diblokir)
  // Progres disimpan terpisah per email, jadi satu perangkat bisa dipakai bergantian. KUNCI + ':aktif' = email yang sedang masuk.
  const CFG = window.LAB_CONFIG ?? {};
  // Lab bisa dibangun menjadi beberapa aplikasi, satu per kategori (js/aplikasi.js). null = lab lengkap.
  const APP = window.LAB_APLIKASI?.[CFG.aplikasi] ?? null;
  const adaTiket = !!APP?.tiket;   // tiket terpandu Querying Data; dimatikan (lihat js/aplikasi.js)
  const adaBebas = false;   // Mode Bebas (laboratorium terbuka); dimatikan sementara karena aktivitas sudah banyak. true = tampilkan lagi
  Lab.app = APP; Lab.adaTiket = adaTiket; Lab.adaBebas = adaBebas;
  const KUNCI = 'labmaya-phi-querying-v1' + (APP ? ':' + CFG.aplikasi : '');
  const awal = () => ({ suara: true, siswa: null, langkah: {}, refleksi: {}, latihan: {}, panduanDilihat: false, terakhir: null });
  const baca = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
  const tulis = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { /* mode privat */ } };
  const kunciSiswa = email => `${KUNCI}:${email}`;
  Lab.st = awal();
  { const email = baca(KUNCI + ':aktif'); if (email) Object.assign(Lab.st, baca(kunciSiswa(email)) ?? {}); }
  if (Lab.st.siswa && !Lab.st.siswa.email) Lab.st = awal();   // akun versi lama (NIS) diminta mengisi data baru
  Lab.simpan = () => { if (Lab.st.siswa) tulis(kunciSiswa(Lab.st.siswa.email), JSON.stringify(Lab.st)); };
  Lab.masuk = siswa => {
    let data = baca(kunciSiswa(siswa.email));
    // Progres lama (sebelum ada fitur masuk) diambil alih oleh siswa pertama yang masuk.
    if (!data && (data = baca(KUNCI))) tulis(KUNCI, null);
    const suara = Lab.st.suara;
    Lab.st = Object.assign(awal(), data ?? { suara }, { siswa });
    tulis(KUNCI + ':aktif', JSON.stringify(siswa.email)); Lab.simpan();
  };
  Lab.keluar = () => { Lab.simpan(); tulis(KUNCI + ':aktif', null); const suara = Lab.st.suara; Lab.st = awal(); Lab.st.suara = suara; };
  /** Level dari XP latihan: naik satu level tiap 50 XP. */
  Lab.level = xp => Math.floor(xp / 50) + 1;
  Lab.pl = no => (Lab.st.langkah[no] ??= { tahap: 1, rakit: null, tiketOk: false, penerapanOk: false, reflektifOk: false, catatan: '', sqlTerakhir: '', jawabSql: '' });
  // Selesai = ketiga pengalaman belajar dijalani: Memahami (tiket), Mengaplikasi (penerapan), Merefleksi (reflektif + jurnal).
  Lab.selesai = no => { const p = Lab.st.langkah[no]; return !!(p && p.tiketOk && p.penerapanOk && p.reflektifOk && (p.jurnal?.paham || '').trim().length >= 10); };
  const bebasTerbuka = () => adaBebas && (!adaTiket || Lab.selesai(1));
  Lab.terbuka = no => no === 1 || Lab.selesai(no - 1);
  Lab.jumlahSelesai = () => [1, 2, 3, 4].filter(Lab.selesai).length;

  // ---------------------------------------------------------------- suara: efek (WebAudio) + narasi (Web Speech, bila ada suara Indonesia)
  let ac = null;
  function nada(f, dur, tipe = 'sine', vol = .08, tunda = 0) {
    try {
      ac ??= new (window.AudioContext || window.webkitAudioContext)();
      const t = ac.currentTime + tunda, o = ac.createOscillator(), g = ac.createGain();
      o.type = tipe; o.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      o.connect(g).connect(ac.destination); o.start(t); o.stop(t + dur + .02);
    } catch (e) { /* audio tidak tersedia */ }
  }
  Lab.sfx = jenis => {
    if (!Lab.st.suara) return;
    ({
      klik: () => nada(660, .06, 'triangle', .05),
      pas: () => { nada(520, .07, 'triangle', .06); nada(780, .09, 'triangle', .05, .05); },
      tiket: () => { nada(880, .12, 'sine', .07); nada(1175, .16, 'sine', .06, .1); },
      sukses: () => { [523, 659, 784, 1046].forEach((f, i) => nada(f, .18, 'triangle', .07, i * .09)); },
      salah: () => { nada(300, .16, 'sawtooth', .04); nada(220, .22, 'sawtooth', .04, .12); },
      swoosh: () => { for (let i = 0; i < 6; i++) nada(300 + i * 90, .05, 'sine', .025, i * .03); },
      ting: () => nada(1320, .25, 'sine', .06),
      fanfare: () => { [523, 659, 784, 659, 784, 1046].forEach((f, i) => nada(f, .2, 'triangle', .07, i * .12)); },
    })[jenis]?.();
  };
  // Narasi: pilih suara Bahasa Indonesia paling natural. Urutan: suara neural Edge ("… Online (Natural)"),
  // suara Google, lalu suara bawaan sistem (mis. Microsoft Andika, terdengar seperti robot). Pilihan siswa disimpan per perangkat.
  const KUNCI_SUARA = 'labmaya-suara-narasi';
  let suaraId = null;
  const skorSuara = v => (/natural|neural/i.test(v.name) ? 8 : 0) + (/online|google/i.test(v.name) ? 4 : 0) + (v.localService ? 0 : 2) + (/gadis/i.test(v.name) ? 1 : 0);
  const suaraIndonesia = () => ('speechSynthesis' in window ? speechSynthesis.getVoices() : [])
    .filter(v => /^id([-_]|$)/i.test(v.lang)).sort((a, b) => skorSuara(b) - skorSuara(a));
  const cariSuara = () => { const daftar = suaraIndonesia(), pilihan = baca(KUNCI_SUARA); suaraId = daftar.find(v => v.name === pilihan) || daftar[0] || null; };
  if ('speechSynthesis' in window) { cariSuara(); speechSynthesis.onvoiceschanged = cariSuara; }
  /** Teks layar → kalimat lisan: tanpa HTML, emoji, dan simbol yang dibaca aneh; dipecah per kalimat. */
  const lisan = teks => String(teks).replace(/<[^>]+>/g, ' ').replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, '')
    .replace(/\s*[·•→]\s*/g, ', ').replace(/_/g, ' ').replace(/…/g, '.').replace(/\s+/g, ' ').trim()
    .split(/(?<=[.!?])\s+/).filter(Boolean);
  const ucapkan = (teks, suara = suaraId) => {
    if (!suara) return;
    speechSynthesis.cancel();
    // jeda singkat: di Chrome, speak() tepat setelah cancel() kadang tidak berbunyi
    setTimeout(() => lisan(teks).forEach(k => {
      const u = new SpeechSynthesisUtterance(k);
      u.voice = suara; u.lang = suara.lang;
      u.rate = skorSuara(suara) >= 4 ? 1 : 0.95;   // suara bawaan sistem sedikit diperlambat agar lebih jelas
      speechSynthesis.speak(u);
    }), 80);
  };
  Lab.narasi = teks => { if (Lab.st.suara && 'speechSynthesis' in window) ucapkan(teks); };
  $('#suaraPilih').onclick = () => {
    Lab.sfx('klik');
    const daftar = suaraIndonesia(), d = $('#dialog'), kotak = d.querySelector('.dialog-kotak'), asli = kotak.innerHTML;
    const tutup = () => { d.hidden = true; kotak.innerHTML = asli; kotak.style.width = ''; };
    const jenis = v => /natural|neural/i.test(v.name) ? 'paling natural · butuh internet' : /online|google/i.test(v.name) ? 'natural · butuh internet' : 'bawaan perangkat · offline';
    kotak.style.width = '600px'; kotak.innerHTML = '';
    kotak.append(el('b', {}, 'Pilih suara narasi'),
      daftar.length ? el('div', { class: 'daftar-suara' }, daftar.map(v => el('label', { class: 'pilihan-suara' },
        el('input', { type: 'radio', name: 'suaraNarasi', checked: v === suaraId || null, onchange: () => { suaraId = v; tulis(KUNCI_SUARA, JSON.stringify(v.name)); ucapkan('Selamat datang di Lab Ngulik Data!', v); } }),
        el('span', { class: 'kat-teks' }, el('b', {}, v.name.replace(/ - Indonesian \(Indonesia\)/, '')), el('small', {}, jenis(v))),
        el('button', { class: 'btn kecil', onclick: e => { e.preventDefault(); ucapkan('Selamat datang di Lab Ngulik Data!', v); } }, el('i', { 'data-ikon': 'main' }), 'Coba'))))
        : el('p', { class: 'muted' }, 'Browser ini tidak punya suara Bahasa Indonesia, jadi narasi hanya tampil sebagai teks.'),
      el('p', { class: 'muted kecil' }, 'Tips: buka lab di Microsoft Edge untuk suara "Gadis" atau "Ardi" (Natural) yang paling alami. Di Chrome tersedia "Google Bahasa Indonesia".'),
      el('div', { class: 'baris', style: { justifyContent: 'flex-end' } }, el('button', { class: 'btn utama', onclick: () => { speechSynthesis?.cancel(); tutup(); } }, 'Selesai')));
    d.hidden = false;
  };
  const tombolSuara = $('#suara');
  const aturSuara = () => {
    tombolSuara.setAttribute('aria-pressed', Lab.st.suara);
    tombolSuara.querySelector('i').dataset.ikon = Lab.st.suara ? 'suara' : 'bisu';
    tombolSuara.querySelector('i').innerHTML = ''; ikon(tombolSuara);
    tombolSuara.querySelector('span').textContent = Lab.st.suara ? 'Suara' : 'Bisu';
  };
  tombolSuara.onclick = () => { Lab.st.suara = !Lab.st.suara; if (!Lab.st.suara && 'speechSynthesis' in window) speechSynthesis.cancel(); Lab.simpan(); aturSuara(); Lab.sfx('klik'); };

  // ---------------------------------------------------------------- toast & dialog
  let tt;
  /** Pesan singkat, tampil sebagai pop-up kecil (gayanya sama dengan pop-up lain). Emoji di awal teks menjadi ikonnya.
   *  Bila pop-up lain sedang terbuka, pesan menunggu sampai pop-up itu ditutup. */
  Lab.toast = teks => {
    if ($('#rayakan')) { clearInterval(tt); tt = setInterval(() => { if (!$('#rayakan')) { clearInterval(tt); Lab.toast(teks); } }, 250); return; }
    const m = /^(\p{Extended_Pictographic}️?)\s*/u.exec(teks);
    Lab.rayakan({ ikon: m ? m[1] : '💬', isi: m ? teks.slice(m[0].length) : teks, meriah: false, bunyi: false, kecil: true });
  };
  Lab.tanya = teks => new Promise(res => {
    const d = $('#dialog'); $('#dialogTeks').textContent = teks; d.hidden = false;
    const tutup = v => { d.hidden = true; res(v); };
    $('#dialogYa').onclick = () => tutup(true); $('#dialogBatal').onclick = () => tutup(false);
  });
  /** Pop-up perayaan dengan konfeti dan fanfare. tombol: [{ teks, utama, aksi }]; setiap tombol menutup pop-up. */
  Lab.rayakan = ({ ikon = '🎉', judul, isi, tombol = [{ teks: 'Oke', utama: true }], meriah = true, bunyi = true, kecil = false }) => {   // meriah: konfeti + fanfare; kecil: pesan singkat tanpa judul
    $('#rayakan')?.remove();
    const tutup = () => { lapis.remove(); removeEventListener('keydown', esc); };
    const esc = e => { if (e.key === 'Escape') tutup(); };
    const warna = ['var(--kuning)', 'var(--pink)', 'var(--mint)', 'var(--langit)', 'var(--oranye)', 'var(--primer)'];
    const lapis = el('div', { id: 'rayakan', class: 'rayakan', role: 'dialog', 'aria-modal': 'true', [judul ? 'aria-labelledby' : 'aria-describedby']: judul ? 'rayakanJudul' : 'rayakanIsi' },
      meriah && el('div', { class: 'konfeti', 'aria-hidden': 'true' }, Array.from({ length: 36 }, (_, i) => el('i', { style: {
        left: `${(i * 37) % 100}%`, background: warna[i % warna.length], animationDelay: `${(i % 9) * .08}s`, '--putar': `${(i * 47) % 360}deg`, '--geser': `${((i * 29) % 120) - 60}px` } }))),
      el('div', { class: 'rayakan-kotak' + (kecil ? ' kecil' : '') }, el('div', { class: 'rayakan-ikon', 'aria-hidden': 'true' }, ikon), judul ? el('h2', { id: 'rayakanJudul' }, judul) : null, el('p', { id: 'rayakanIsi', html: isi }),
        el('div', { class: 'baris' }, tombol.map(t => el('button', { class: 'btn besar' + (t.utama ? ' utama' : ''), onclick: () => { Lab.sfx('klik'); tutup(); t.aksi?.(); } }, t.teks)))));
    lapis.addEventListener('click', e => { if (e.target === lapis) tutup(); });
    addEventListener('keydown', esc);
    $('#panggung').append(lapis);
    if (bunyi) Lab.sfx(meriah ? 'fanfare' : 'ting');
    setTimeout(() => lapis.querySelector('.btn.utama')?.focus(), 50);
  };

  // ---------------------------------------------------------------- mesin SQL
  let db = null;
  Lab.siapkanDb = async () => {
    const bin = Uint8Array.from(atob(window.SQL_WASM_B64), c => c.charCodeAt(0));
    const SQL = await initSqlJs({ wasmBinary: bin });
    db = new SQL.Database();
    db.exec(window.PHI_SQL);
    // Latihan bertipe "ubah" memakai salinan database sendiri, jadi data utama tidak pernah berubah.
    const salinan = db.export();
    Lab.dbBaru = () => { const d = new SQL.Database(salinan); d.exec('PRAGMA foreign_keys = ON'); window.MySQLLab?.pasangFungsi(d); return d; };
    Lab.tabel = db.exec("SELECT name, type FROM sqlite_master WHERE type IN ('table','view') ORDER BY type DESC, name")[0].values
      .map(([nama, jenis]) => ({ nama, bantu: jenis === 'view', kolom: db.exec(`PRAGMA table_info(${nama})`)[0].values.map(r => r[1]),
        baris: db.exec(`SELECT COUNT(*) FROM ${nama}`)[0].values[0][0] }));
  };
  /** Jalankan SELECT; hasil {kolom, baris}. Galat diterjemahkan ke pesan ramah. */
  Lab.q = sql => {
    const r = db.exec(sql);
    if (!r.length) return { kolom: [], baris: [] };
    const t = r[r.length - 1];
    return { kolom: t.columns, baris: t.values };
  };
  Lab.satu = sql => Lab.q(sql).baris[0]?.[0];
  /** Query murid diambil baris demi baris dan dihentikan di BATAS_BARIS, supaya query raksasa
      (JOIN silang berlapis, WITH RECURSIVE tanpa batas) tidak membuat browser macet. */
  Lab.BATAS_BARIS = 5000;
  const qMurid = sql => {
    const st = db.prepare(sql);
    try {
      const kolom = st.getColumnNames(), baris = [];
      let terpotong = false;
      while (st.step()) { if (baris.length >= Lab.BATAS_BARIS) { terpotong = true; break; } baris.push(st.get()); }
      return { kolom, baris, terpotong };
    } finally { st.free(); }
  };
  /** Untuk query yang diketik murid: hanya satu perintah SELECT/WITH. */
  Lab.jalankanMurid = sql => {
    const bersih = sql.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').trim().replace(/;\s*$/, '');
    if (!bersih) throw new Error('Editornya masih kosong nih. Tulis query SELECT dulu, ya.');
    if (window.MySQLLab ? MySQLLab.pecah(bersih).length > 1 : bersih.includes(';')) throw new Error('Satu query aja dulu, ya (tanpa titik koma di tengah).');
    if (!/^(select|with)\b/i.test(bersih)) {
      const kata = bersih.split(/\s+/)[0];
      throw new Error(/^(insert|update|delete|replace|create|drop|alter|truncate|rename|set|use)$/i.test(kata)
        ? 'Di lab ini cukup pakai SELECT buat membaca data, ya.'
        : `Kata pertama "${kata}" belum dikenal. Query untuk membaca data diawali SELECT. Cek ejaannya, ya.`);
    }
    try { return qMurid(bersih); } catch (e) { throw new Error(Lab.galat(e.message)); }
  };
  const jarak = (a, b) => { const d = Array.from({ length: a.length + 1 }, (_, i) => [i]); for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[a.length][b.length]; };
  const mirip = (nama, daftar) => daftar.map(x => [x, jarak(nama.toLowerCase(), x.toLowerCase())]).sort((a, b) => a[1] - b[1]).find(([, d]) => d <= 3)?.[0];
  Lab.galat = m => {
    let x;
    if ((x = m.match(/no such table: (\S+)/))) { const s = mirip(x[1], Lab.tabel.map(t => t.nama)); return `Hmm, tabel "${x[1]}" nggak ada.${s ? ` Maksudmu "${s}"?` : ' Lihat daftar tabel di rak.'}`; }
    if ((x = m.match(/no such column: (\S+)/))) { const semua = [...new Set(Lab.tabel.flatMap(t => t.kolom))]; const k = x[1].split('.').pop(); const s = mirip(k, semua); return `Hmm, kolom "${x[1]}" nggak ketemu.${s ? ` Maksudmu "${s}"?` : ''} Cek lagi ejaan dan tabelnya.`; }
    if (/ambiguous column name: (\S+)/.test(m)) return `Kolom "${m.split(': ')[1]}" ada di dua tabel. Tulis nama tabelnya di depan, misalnya k.${m.split(': ')[1]}.`;
    if (/syntax error/.test(m)) return 'Penulisan query-nya belum pas. Cek koma, tanda petik, dan urutan klausa (SELECT … FROM … WHERE … GROUP BY … ORDER BY … LIMIT).';
    if ((x = m.match(/NOT NULL constraint failed: (\S+)/))) return `Kolom ${x[1]} nggak boleh kosong (NOT NULL), tapi ada baris yang nilainya NULL.`;
    if ((x = m.match(/UNIQUE constraint failed: (\S+)/))) return `Nilai ${x[1]} sudah dipakai baris lain, padahal harus unik (PRIMARY KEY / UNIQUE).`;
    if ((x = m.match(/CHECK constraint failed: (\S+)/))) return `Data ditolak CHECK constraint ${x[1]}.`;
    if (/FOREIGN KEY constraint failed/.test(m)) return 'Ditolak foreign key: datanya masih dirujuk tabel lain, atau rujukannya tidak ada.';
    if ((x = m.match(/^(table|index) (\S+) already exists/))) return `${x[1] === 'table' ? 'Tabel' : 'Indeks'} ${x[2]} sudah ada.`;
    if (/aggregate/.test(m)) return 'Fungsi COUNT/SUM/AVG tidak bisa dipakai di WHERE. Gunakan HAVING untuk menyaring hasil kelompok.';
    return 'Ups, query gagal: ' + m;
  };

  // ---------------------------------------------------------------- penilai: bandingkan hasil murid dengan kunci
  const norm = v => v == null ? '∅' : (typeof v === 'number' || /^-?\d+(\.\d+)?$/.test(String(v))) ? String(Math.round(Number(v) * 100) / 100) : String(v).trim();
  const kunciBaris = r => r.map(norm).join('␟');
  Lab.nilai = (hasil, kunci, urut, namaKolom = false) => {
    const [uc, ec, ur, er] = [hasil.kolom.length, kunci.kolom.length, hasil.baris.length, kunci.baris.length];
    if (uc !== ec) return { ok: false, pesan: `Hasilmu punya ${uc} kolom, harusnya ${ec}. Cek lagi kolom di SELECT.` };
    if (namaKolom && hasil.kolom.join().toLowerCase() !== kunci.kolom.join().toLowerCase()) return { ok: false, pesan: `Judul kolommu: ${hasil.kolom.join(', ')}. Harusnya: ${kunci.kolom.join(', ')}. Pakai alias (AS) sesuai permintaan.` };
    if (ur !== er) return { ok: false, pesan: `Hasilmu ${ur} baris, harusnya ${er}. ${ur > er ? 'Saringanmu masih kelonggaran.' : 'Ada baris yang ikut kesaring atau hilang.'}` };
    const u = hasil.baris.map(kunciBaris), e = kunci.baris.map(kunciBaris);
    if ([...u].sort().join('\n') !== [...e].sort().join('\n')) return { ok: false, pesan: 'Jumlah baris dan kolomnya udah pas, tapi isinya belum sama. Cek kondisi, urutan kolom, atau perhitungannya.' };
    if (urut && u.join('\n') !== e.join('\n')) return { ok: false, pesan: 'Isinya udah benar, tinggal urutannya! Cek ORDER BY dan arahnya (ASC/DESC).' };
    return { ok: true, pesan: 'Hasilmu cocok sama kebutuhan tiket. Mantap!' };
  };

  // ---------------------------------------------------------------- penyorot SQL & tabel hasil
  const KW = new Set(('SELECT FROM WHERE AND OR NOT IN IS NULL LIKE BETWEEN ORDER BY ASC DESC LIMIT OFFSET JOIN INNER LEFT RIGHT ON AS GROUP HAVING COUNT SUM AVG MIN MAX ROUND DISTINCT WITH CASE WHEN THEN ELSE END ' +
    'CROSS UNION EXCEPT INTERSECT EXISTS ROLLUP CREATE TABLE ALTER DROP TRUNCATE RENAME TO ADD COLUMN MODIFY CHANGE FIRST AFTER INSERT IGNORE INTO VALUES ' +
    'UPDATE SET DELETE REPLACE PRIMARY FOREIGN KEY REFERENCES CONSTRAINT UNIQUE CHECK DEFAULT AUTO_INCREMENT TEMPORARY CASCADE INT VARCHAR DATE').split(' '));
  // Teks sudah di-escape: petik tunggal menjadi &#39;, jadi string dicocokkan dalam bentuk itu.
  Lab.sorot = sql => Lab.esc(sql).replace(/(--[^\n]*)|(&#39;(?:(?!&#39;).)*&#39;)|\b(\d+(?:\.\d+)?)\b|([A-Za-z_]+)/g, (m, c, s, n, w) => {
    if (c) return `<span class="cm">${c}</span>`;
    if (s) return `<span class="st">${s}</span>`;
    if (n) return `<span class="nm">${n}</span>`;
    return KW.has(w.toUpperCase()) ? `<span class="kw">${w}</span>` : w;
  });
  Lab.kotakSql = (sql, judul = 'SQL') => el('div', { class: 'kode', html: `<span class="judul-kode">${judul}</span>${Lab.sorot(sql)}` });
  Lab.tabelHasil = (wadah, hasil, { maks = 60, sorot } = {}) => {
    wadah.innerHTML = '';
    if (!hasil || !hasil.kolom.length) { wadah.append(el('div', { class: 'kosong' }, 'Belum ada hasil.')); return; }
    const t = el('table');
    t.append(el('thead', {}, el('tr', {}, hasil.kolom.map(k => el('th', {}, k)))));
    const tb = el('tbody');
    hasil.baris.slice(0, maks).forEach((r, i) => tb.append(el('tr', { class: sorot?.(r, i) ? 'sorot' : null },
      r.map(v => el('td', { class: v == null ? 'null' : null }, v == null ? 'NULL' : (typeof v === 'number' ? Lab.angka(v) : v))))));
    t.append(tb);
    wadah.append(el('div', { class: 'info-hasil' }, hasil.terpotong
      ? `Lebih dari ${Lab.angka(Lab.BATAS_BARIS)} baris! Query dihentikan biar browser nggak macet · ditampilkan ${maks} pertama. Cek lagi JOIN atau WHERE-mu.`
      : `${Lab.angka(hasil.baris.length)} baris${hasil.baris.length > maks ? ` · ditampilkan ${maks} pertama` : ''}`), t);
  };

  // ---------------------------------------------------------------- editor SQL (paste & seret-lepas ditolak)
  Lab.editor = ({ nilai = '', placeholder = '-- Tulis query di sini', onubah, onjalankan } = {}) => {
    const sorot = el('pre', { class: 'sorot', 'aria-hidden': 'true' });
    const ta = el('textarea', { spellcheck: 'false', autocapitalize: 'off', autocomplete: 'off', placeholder, 'aria-label': 'Editor SQL' });
    const info = el('div', { class: 'info-tempel', hidden: true }, '✋ Paste dimatiin. Ketik query-mu sendiri biar makin jago.');
    const segar = () => { sorot.innerHTML = Lab.sorot(ta.value) + '\n'; };
    ta.value = nilai; segar();
    pasangEditor(ta, sorot, info, () => { segar(); onubah?.(ta.value); }, onjalankan);
    const wadah = el('div', { class: 'editor' }, el('div', { class: 'editor-kepala' }, el('span', {}, 'jawaban.sql'), el('span', {}, 'SQLite · Phi Minimart')),
      el('div', { class: 'editor-badan' }, sorot, ta), info);
    return { wadah, ta, get nilai() { return ta.value; } };
  };
  function pasangEditor(ta, sorot, info, onubah, onjalankan) {
    let j;
    const tolak = e => { e.preventDefault(); if (info) { info.hidden = false; clearTimeout(j); j = setTimeout(() => { info.hidden = true; }, 3200); } else Lab.toast('✋ Paste dimatiin. Ketik query-mu sendiri, ya.'); };
    ta.addEventListener('paste', tolak); ta.addEventListener('drop', tolak); ta.addEventListener('dragover', e => e.preventDefault());
    ta.addEventListener('beforeinput', e => { if (/^insertFrom(Paste|Drop)/.test(e.inputType)) tolak(e); });
    ta.addEventListener('input', onubah);
    ta.addEventListener('scroll', () => { sorot.scrollTop = ta.scrollTop; });
    ta.addEventListener('keydown', e => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); onjalankan?.(); }
      if (e.key === 'Tab') { e.preventDefault(); ta.setRangeText('  ', ta.selectionStart, ta.selectionEnd, 'end'); onubah(); }
    });
  }
  Lab.pasangEditor = pasangEditor;

  // ---------------------------------------------------------------- navigasi layar
  Lab.layar = null;
  let tujuanMasuk = null;
  Lab.ke = (nama, opsi = {}) => {
    if (!Lab.st.siswa && !['muka', 'masuk', 'panduan'].includes(nama)) { tujuanMasuk = [nama, opsi]; nama = 'masuk'; }
    if (nama === 'langkah' && !adaTiket) nama = 'peta';   // aplikasi tanpa tiket terpandu
    if (nama === 'bebas' && !adaBebas) nama = 'peta';
    if (nama === 'bebas' && !bebasTerbuka()) { Lab.toast('Mode Bebas kebuka setelah Langkah 1 selesai. Semangat!'); return; }
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    $('#menuBebas').disabled = !bebasTerbuka();
    $$('.layar').forEach(l => l.classList.toggle('aktif', l.id === 'layar-' + nama));
    $$('#menu button').forEach(b => b.classList.toggle('aktif', b.dataset.ke === nama || (b.dataset.ke === 'peta' && (nama === 'langkah' || nama === 'latihan'))));
    Lab.layar = nama;
    if (Lab.sempit) scrollTo(0, 0);   // mode HP: halaman di-scroll, mulai dari atas tiap pindah layar
    segarSiswa();
    ({ muka: tampilMuka, briefing: tampilBriefing, panduan: () => tampilPanduan(opsi.hal ?? 0), peta: tampilPeta,
      langkah: () => Lab.bukaLangkah(opsi.no ?? 1, opsi.tahap), bebas: tampilBebas, ringkasan: tampilRingkasan, masuk: tampilMasuk, latihan: () => Lab.bukaLatihan(opsi.id) })[nama]?.();
  };
  document.addEventListener('click', e => { const b = e.target.closest('[data-ke]'); if (b) { Lab.sfx('klik'); Lab.ke(b.dataset.ke); } });

  // ---------------------------------------------------------------- pencatatan pengguna (Google Sheets lewat Apps Script, lihat pencatat/)
  // Yang dikirim hanya identitas (nama, email, asal sekolah) dan angka progres; jawaban & query murid tetap di perangkat.
  const ANTREAN = KUNCI + ':antrean';
  Lab.pencatatAktif = () => /^https:\/\//.test(CFG.urlPencatat || '');
  const kirimCatatan = c => fetch(CFG.urlPencatat, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(c) })
    .then(() => true, () => false);
  /** Catatan yang gagal terkirim (offline) disimpan di antrean dan dicoba lagi saat online / saat lab dibuka. */
  async function kirimAntrean() {
    if (!Lab.pencatatAktif()) return;
    const antre = baca(ANTREAN) ?? [], sisa = [];
    for (const c of antre) if (!(await kirimCatatan(c))) sisa.push(c);
    tulis(ANTREAN, sisa.length ? JSON.stringify(sisa) : null);
  }
  Lab.catat = async jenis => {
    const s = Lab.st.siswa;
    if (!s?.setuju || !Lab.pencatatAktif()) return;
    const xp = Lab.xp?.() ?? 0;
    const c = { jenis, aplikasi: CFG.aplikasi || 'lengkap', waktu: new Date().toISOString(), nama: s.nama, email: s.email, sekolah: s.sekolah,
      langkah: Lab.jumlahSelesai(), soal: Object.values(Lab.st.latihan ?? {}).filter(p => p.ok).length, xp, level: Lab.level(xp) };
    if (await kirimCatatan(c)) return kirimAntrean();
    // simpan hanya catatan terbaru per email & jenis supaya antrean tidak menumpuk
    tulis(ANTREAN, JSON.stringify([...(baca(ANTREAN) ?? []).filter(x => !(x.email === c.email && x.jenis === c.jenis)), c]));
  };
  addEventListener('online', kirimAntrean);

  // ---------------------------------------------------------------- Isi data diri & chip siswa di bilah atas
  function segarSiswa() {
    const c = $('#siswaChip'), s = Lab.st.siswa; c.hidden = !s;
    if (s) { const xp = Lab.xp?.() ?? 0; c.querySelector('span').textContent = `${s.nama.split(' ')[0]} · Lv ${Lab.level(xp)} · ${xp} XP`; }
  }
  $('#siswaChip').onclick = async () => {
    const s = Lab.st.siswa;
    if (!(await Lab.tanya(`Keluar dari akun ${s.nama} (${s.email})? Progresmu tetap tersimpan di perangkat ini dan muncul lagi saat kamu masuk dengan email yang sama.`))) return;
    Lab.keluar(); Lab.ke('muka');
  };
  function tampilMasuk() {
    $('#masukPesan').hidden = true;
    for (const id of ['masukNama', 'masukEmail', 'masukSekolah']) $('#' + id).value = '';
    $('#masukSetuju').checked = false;
    // Persetujuan hanya diminta bila pencatatan aktif; bila tidak, data cuma tersimpan di perangkat ini.
    const aktif = Lab.pencatatAktif();
    $('#masukSetujuBaris').hidden = !aktif;
    $('#privasiTujuan').textContent = aktif
      ? `Catatan pengguna milik ${CFG.pengelola || 'pengelola lab'} (Google Sheets). Tidak dibagikan ke pihak lain dan tidak dipakai untuk iklan.`
      : 'Saat ini pencatatan belum aktif: datamu hanya tersimpan di perangkat ini.';
    $('#privasiKontak').hidden = !CFG.kontak;
    $('#privasiKontak').textContent = CFG.kontak ? `Mau datamu dihapus atau diperbaiki? Hubungi ${CFG.kontak}.` : '';
    setTimeout(() => $('#masukNama').focus(), 50);
  }
  $('#formMasuk').onsubmit = e => {
    e.preventDefault();
    const nama = $('#masukNama').value.trim().replace(/\s+/g, ' '), email = $('#masukEmail').value.trim().toLowerCase();
    const sekolah = $('#masukSekolah').value.trim().replace(/\s+/g, ' '), setuju = !Lab.pencatatAktif() || $('#masukSetuju').checked;
    const salah = nama.length < 3 ? 'Tulis nama lengkapmu dulu, ya.'
      : !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email) ? 'Email-nya belum valid, contoh: andi@gmail.com.'
      : sekolah.length < 5 ? 'Tulis nama sekolahmu, mis. SMK Negeri 1 Bogor.'
      : !setuju ? 'Centang persetujuan dulu, ya.' : '';
    if (salah) { $('#masukPesan').textContent = salah; $('#masukPesan').hidden = false; Lab.sfx('salah'); return; }
    Lab.masuk({ nama, email, sekolah, setuju: Lab.pencatatAktif() && setuju });
    if (panduanTamu) { Lab.st.panduanDilihat = true; Lab.simpan(); }
    Lab.catat('masuk');
    Lab.sfx('sukses'); Lab.toast(`Halo, ${nama.split(' ')[0]}! 👋 Progresmu disimpan atas ${email}.`);
    // Siswa baru → Briefing sekali. Siswa lama → lanjut ke tiket terakhir atau Peta (tujuan "briefing" dari
    // tombol Mulai dibuat sebelum lab tahu siapa yang masuk, jadi diperiksa ulang di sini).
    let [n, o] = tujuanMasuk ?? ['peta', {}]; tujuanMasuk = null;
    if (!Lab.st.panduanDilihat) n = 'briefing';
    else if (n === 'briefing') [n, o] = Lab.st.terakhir?.layar === 'langkah' ? ['langkah', Lab.st.terakhir] : ['peta', {}];
    Lab.ke(n, o);
  };
  kirimAntrean();

  // ---------------------------------------------------------------- S01 Laman Muka
  function tampilMuka() {
    const n = Lab.jumlahSelesai(), s = Lab.st.siswa, lanjut = Lab.st.terakhir || Lab.st.panduanDilihat;
    $('#infoProgres').textContent = s ? `Masuk sebagai ${s.nama} (${s.email}) · ${adaTiket ? `${n} dari 4 langkah · ` : ''}${Lab.xp?.() ?? 0} XP. Bukan kamu? Klik namamu di pojok kanan atas untuk keluar.` : '';
    $('#btnMulai').innerHTML = ''; $('#btnMulai').append(el('i', { 'data-ikon': 'main' }), s && lanjut ? 'Lanjut lagi' : 'Gas, mulai!');
    // sambutan lengkap sekali per buka lab: sasaran kelas + isi kartu "Tentang lab ini" (dibaca dari halaman, singkatan dalam kurung dilewati).
    // Browser baru mengizinkan suara setelah siswa mengeklik halaman, jadi sambutan lengkap baru "terpakai" setelah itu.
    if (sambutanLengkap || navigator.userActivation?.hasBeenActive === false) { Lab.narasi('Selamat datang di Lab Ngulik Data!'); return; }
    sambutanLengkap = true;
    const info = $$('#layar-muka .info-ubin').map(u => `${u.querySelector('dt').textContent}: ${u.querySelector('dd').textContent.replace(/\s*\([^)]*\)/g, '')}.`).join(' ');
    Lab.narasi(`Selamat datang di Lab Ngulik Data! Lab ini untuk belajar murid SMK kelas sepuluh, sebelas, dan dua belas. ${info}`);
  }
  let sambutanLengkap = false;
  $('#btnMulai').onclick = () => {
    Lab.sfx('klik');
    if (!Lab.st.terakhir) return Lab.ke(Lab.st.panduanDilihat ? 'peta' : 'briefing');
    const t = Lab.st.terakhir; Lab.ke(t.layar === 'langkah' ? 'langkah' : 'peta', t);
  };

  // ---------------------------------------------------------------- S02 Briefing
  function tampilBriefing() {
    const w = $('#petaCabang'); w.innerHTML = '';
    const prov = Lab.q('SELECT kode_propinsi, nama_propinsi FROM ms_propinsi ORDER BY kode_propinsi').baris;
    for (const [kp, np] of prov) {
      const kotak = el('div', { class: 'prov' }, el('b', {}, np));
      for (const [kk, nk] of Lab.q(`SELECT kode_kota, nama_kota FROM ms_kota WHERE kode_propinsi='${kp}' ORDER BY kode_kota`).baris) {
        const cab = Lab.q(`SELECT kode_cabang, nama_cabang FROM ms_cabang WHERE kode_kota='${kk}'`).baris;
        const kota = el('div', { class: 'kota' + (cab.length ? '' : ' kosong'), 'data-kota': nk }, nk + (cab.length ? '' : ' · belum ada cabang'));
        for (const [kc, nc] of cab) kota.append(el('button', { class: 'pin', onclick: e => {
          $$('.pin', w).forEach(p => p.classList.remove('pilih')); e.currentTarget.classList.add('pilih'); Lab.sfx('klik');
          const n = Lab.satu(`SELECT COUNT(*) FROM ms_karyawan WHERE kode_cabang='${kc}'`);
          $('#infoCabang').innerHTML = `<b>${nc}</b> · ${nk}, ${np}<br><span class="muted">Kode ${kc} · ${n} karyawan</span>`;
        } }, nc.replace('Phi Minimart ', '')));
        kotak.append(kota);
      }
      w.append(kotak);
    }
    Lab.sfx('tiket');
    Lab.narasi(adaTiket ? 'Phi Minimart punya enam cabang. Setiap hari manajer meminta data. Tugasmu menjawab empat tiket dengan query SQL.'
      : `Halo, selamat gabung di tim data! Phi Minimart punya enam cabang di enam kota. Hari ini fokusmu ${APP?.kategori ?? 'Querying Data'}. Kerjakan latihannya satu per satu pakai query SQL, ya!`);
  }

  // ---------------------------------------------------------------- P01–P03 Panduan
  let hal = 0, sorotan = 0, tSorot, tSorotTutor, panduanTamu = false;
  const AREA = [['m-tiket', 'A', 'Tiket kerja', 'Permintaan data dari manajer. Bacalah dulu: apa yang diminta dan dari tabel mana.'],
    ['m-rak', 'B', 'Rak Tabel', 'Daftar 8 tabel Phi Minimart + tabel bantu. Klik nama tabel untuk mengintip isinya.'],
    ['m-meja', 'C', 'Meja Kerja Query', 'Tempat merakit query dengan blok perintah, slider, dan pilihan. SQL-nya tersusun otomatis.'],
    ['m-hasil', 'D', 'Panel Hasil', 'Animasi proses dan tabel hasil setelah query dijalankan.']];
  const HAL_PANDUAN = adaTiket ? 4 : 1;   // hal. 2–4 menjelaskan tiket terpandu
  // [nama tahap, penjelasan, fase 3M]
  const TAHAP_ALUR = [['Baca tiket', 'Baca permintaan manajer: data apa yang diminta, dari tabel mana, dan syaratnya apa. Tekan <b>Terima tiket</b> untuk mulai.', '🔍 Memahami'],
    ['Rakit query', 'Susun query dengan blok: pilih tabel, centang kolom, geser slider, atau ganti operator. SQL-nya tersusun otomatis.', '🔍 Memahami'],
    ['Jalankan & amati', 'Jalankan query, amati animasi baris yang lolos dan yang tersaring, lalu kirim hasilnya ke manajer.', '🔍 Memahami'],
    ['Bandingkan', 'Jalankan dua versi query berdampingan (A dan B), amati bedanya, lalu catat pengamatanmu: mengapa hasilnya berbeda?', '🔍 Memahami'],
    ['Terapkan', 'Tulis query sendiri, tanpa blok, untuk soal penerapan dengan permintaan yang berbeda.', '🛠️ Mengaplikasi'],
    ['Refleksi', 'Jawab pertanyaan reflektif dan tulis jurnal singkat: apa yang baru kamu pahami, apa yang masih membingungkan. Setelah itu lencanamu terbuka! 🏅', '💭 Merefleksi']];
  /** Cara menghitung XP & Level, dengan XP maksimal aplikasi ini (lab lengkap: semua kategori). */
  function infoXp() {
    const ids = iApp >= 0 ? Lab.soalKategori(iApp) : KATEGORI.flatMap((_, i) => Lab.soalKategori(i));
    const maks = ids.reduce((a, id) => a + (Lab.soal[id]?.xp ?? 0), 0), lvMaks = Lab.level(maks);
    const jangkau = Array.from({ length: Math.min(lvMaks, 4) }, (_, i) => `<tr><td>${i * 50}–${i * 50 + 49} XP</td><td>Level ${i + 1}</td></tr>`).join('');
    Lab.rayakan({ ikon: '⭐', meriah: false, judul: 'Cara hitung XP & Level', tombol: [{ teks: 'Siap!', utama: true }],
      isi: '<span class="xp-info">'
        + '<b>XP dari soal yang benar</b>'
        + '<span class="xp-tingkat"><span class="chip level-dasar">Dasar +10 XP</span><span class="chip level-menengah">Menengah +20 XP</span><span class="chip level-lanjut">Lanjut +30 XP</span></span>'
        + '<small>Lihat solusi sebelum jawabanmu benar? XP soal itu jadi <b>setengah</b>. Buka petunjuk dulu, ya!</small>'
        + '<b>Level naik tiap 50 XP</b>'
        + `<table class="xp-tabel">${jangkau}${lvMaks > 4 ? '<tr><td colspan="2">… dan seterusnya</td></tr>' : ''}</table>`
        + `<small>${APP ? `Lab Maya ${APP.no} · ${APP.kategori}` : 'Lab ini'} punya <b>${ids.length} soal</b>: total <b>${maks} XP</b>, cukup untuk sampai <b>Level ${lvMaks}</b>.</small></span>` });
  }
  Lab.infoXp = infoXp;
  /** Panduan hal. 1: latihan mini yang meniru layar Aktivitas apa adanya (tidak dinilai, tidak menambah XP):
   *  pilih kartu perintah → 👀 Amati contoh → ✍️ Kerjakan soal → 💭 Renungkan. */
  function tutorCaraKerja(w) {
    const LANGKAH = [['Pilih perintah', `Klik kartu <b>SELECT FROM</b> di ${Lab.sempit ? 'bawah' : 'kanan'}. Di menu Aktivitas, kartunya persis seperti ini.`],
      ['👀 Amati contoh', 'Tekan <b>Jalankan contoh</b>, lalu perhatikan hasilnya. Sudah? Tekan <b>Lanjut: Kerjakan soal</b>.'],
      ['✍️ Kerjakan soal', 'Baca soal dan skema tabel, tulis query di editor, tekan <b>Jalankan</b> (atau Ctrl+Enter), lalu <b>Kirim jawaban</b>. Bingung? Tekan <b>Buka petunjuk</b>.'],
      ['💭 Renungkan', 'Jawab pertanyaan singkat, lalu tulis catatan belajarmu dan tekan <b>Simpan catatan</b>.']];
    const KUNCI_TUTOR = 'SELECT * FROM ms_kategori', CONTOH = 'SELECT nama_kategori FROM ms_kategori';
    let tahap = 0, hasil = null, jalanSejakKetik = false;
    const daftar = el('ol', {}, LANGKAH.map(([b]) => el('li', {}, el('b', {}, b))));
    const arahan = el('div', { class: 'pesan info tutor-arahan', 'aria-live': 'polite' });
    const segar = () => {
      [...daftar.children].forEach((li, i) => { li.className = i < tahap ? 'lewat' : i === tahap ? 'aktif' : ''; });
      arahan.innerHTML = tahap < 4 ? `<b>Langkah ${tahap + 1}:</b> ${LANGKAH[tahap][1]}`
        : '<b>🎉 Mantap, kamu sudah paham caranya!</b> Begitulah setiap soal dikerjakan. Klik <b>Mulai Aktivitas</b> untuk latihan sungguhan.';
    };
    const RINGKAS = '<ul class="tutor-ringkas">'
      + '<li><b>🧭 Tetap dipandu</b> di 3 soal pertama Aktivitas: ikuti bingkai pink dan suara narator, sampai kamu terbiasa.</li>'
      + '<li><b>Tombol bawah</b> ← kembali ke daftar perintah, → lanjut ke materi selanjutnya. Tombol <b>?</b> di atas menjelaskan 3 langkah lagi.</li>'
      + '<li><b>✓ Tuntas</b> tanda di kartu perintah kalau ketiga langkah soal itu selesai.</li>'
      + '<li><b>XP & Level</b> Dasar +10, Menengah +20, Lanjut +30 XP; lihat solusi dulu = setengah. Tiap 50 XP, level-mu naik.</li>'
      + (adaBebas ? '<li><b>Mode Bebas</b> coba query apa saja pada tabel Phi Minimart, tidak dinilai.</li>' : '') + '</ul>';

    // area kanan: kartu perintah dulu, lalu deretan 3 langkah + isi langkah (sama dengan layar latihan)
    const meja = el('div', { class: 'tutor-meja' });
    const kartu = (p, f, xp, level, contoh) => el('button', { class: 'perintah bisa' + (contoh ? ' contoh' : ''), style: { '--warna': 'var(--kuning)' }, onclick: () => {
      if (contoh) { Lab.toast('Di panduan ini, coba kartu SELECT FROM dulu ya. Kartu lainnya ada di menu Aktivitas.'); return; }
      Lab.sfx('klik'); naik(1); bukaSoal();
    } }, el('code', {}, p), el('p', {}, f), el('span', { class: 'perintah-kaki' }, el('span', { class: 'chip level-' + level.toLowerCase() }, level), el('span', { class: 'xp' }, `+${xp} XP`)));
    const pilihW = el('div', { class: 'tutor-pilih' }, el('span', { class: 'label' }, 'Querying Data · pilih perintah buat latihan'),
      el('div', { class: 'perintah-grid' }, kartu('SELECT FROM', 'Menampilkan/mengambil data dari sebuah tabel tunggal.', 10, 'Dasar'),
        kartu('ORDER BY', 'Mengurutkan hasil query.', 10, 'Dasar', true), kartu('WHERE', 'Menyaring baris data berdasarkan kondisi tertentu.', 10, 'Dasar', true)));
    meja.append(pilihW);

    const FASE = [['👀', 'Amati contoh', 'Memahami'], ['✍️', 'Kerjakan soal', 'Mengaplikasi'], ['💭', 'Renungkan', 'Merefleksi']];
    const strip = el('div', { class: 'lat-fase', 'aria-label': 'Langkah belajar' }), badan = el('div', { class: 'tutor-badan' });
    const segarStrip = () => {   // fase aktif = tahap - 1; yang sudah lewat hijau + ✓
      strip.innerHTML = '';
      FASE.forEach(([ikon, aksi, nama], i) => strip.append(i ? el('span', { class: 'fase-panah', 'aria-hidden': 'true' }, '→') : '',
        el('span', { class: `fase-tab${i === tahap - 1 ? ' aktif' : ''}${i < tahap - 1 ? ' beres' : ''}` },
          el('span', { class: 'n' }, i < tahap - 1 ? '✓' : i + 1), el('span', { class: 'fase-teks' }, el('b', {}, `${ikon} ${aksi}`), el('small', {}, nama)))));
    };
    const naik = n => {
      if (n <= tahap) return;
      tahap = n; segar(); segarStrip();
      if (Lab.sempit && n < 4) setTimeout(() => strip.scrollIntoView({ block: 'start', behavior: 'smooth' }), 60);   // HP: langkah baru ada di bawah
      if (n < 4) { Lab.sfx('pas'); return; }
      Lab.rayakan({ judul: 'Mantap, kamu sudah paham caranya!', isi: 'Setiap soal dikerjakan dengan 3 langkah: <b>👀 Amati contoh → ✍️ Kerjakan soal → 💭 Renungkan</b>.' + RINGKAS,
        tombol: [{ teks: 'Tutup' }, { teks: 'Mulai Aktivitas →', utama: true, aksi: () => selesaiPanduan() }] });
    };
    function bukaSoal() {
      pilihW.hidden = true;
      meja.append(el('div', { class: 'baris tutor-judul' }, el('span', { class: 'label' }, 'Latihan mini · SELECT FROM'), el('span', { class: 'spasi' }), el('span', { class: 'chip abu' }, 'tidak dinilai')), strip, badan);
      segarStrip(); faseAmati();
    }
    // 👀 Amati contoh
    function faseAmati() {
      const hasilW = el('div', { class: 'hasil' }, el('div', { class: 'kosong' }, 'Tekan Jalankan contoh untuk melihat hasilnya.'));
      const lanjut = el('button', { class: 'btn utama', hidden: true, onclick: () => { Lab.sfx('klik'); naik(2); faseKerjakan(); } }, 'Lanjut: Kerjakan soal', el('i', { 'data-ikon': 'panah' }));
      badan.innerHTML = '';
      badan.append(el('div', { class: 'kartu lat-contoh' }, el('span', { class: 'label' }, 'Contoh'), Lab.kotakSql(CONTOH, 'contoh query'),
        el('p', { class: 'muted kecil' }, 'Amati: kolom apa yang muncul, dan ada berapa baris?'),
        el('div', { class: 'baris' }, el('button', { class: 'btn', onclick: () => { Lab.tabelHasil(hasilW, Lab.q(CONTOH), { maks: 6 }); lanjut.hidden = false; Lab.sfx('pas'); } },
          el('i', { 'data-ikon': 'main' }), 'Jalankan contoh'), lanjut)), hasilW);
    }
    // ✍️ Kerjakan soal
    function faseKerjakan() {
      const t = Lab.tabel.find(x => x.nama === 'ms_kategori'), lain = Lab.tabel.filter(x => x !== t);
      const tabel = (x, buka) => el('details', { class: 'skema-tabel', open: buka || null }, el('summary', {}, el('code', {}, x.nama), el('small', {}, `${Lab.angka(x.baris)} baris`)),
        el('div', { class: 'skema-kolom' }, x.kolom.map(k => el('code', {}, k))));
      const hint = el('ul', { class: 'hint-daftar' });
      const tombolHint = el('button', { class: 'btn kecil', onclick: e => { hint.append(el('li', { html: 'Tanda <code>*</code> artinya semua kolom. Polanya: <code>SELECT * FROM nama_tabel</code>' })); e.currentTarget.disabled = true; e.currentTarget.lastChild.textContent = 'Petunjuk habis'; } },
        el('i', { 'data-ikon': 'lampu' }), 'Buka petunjuk (1/1)');
      const umpan = el('div'), hasilW = el('div', { class: 'hasil' }, el('div', { class: 'kosong' }, 'Hasil query bakal muncul di sini.'));
      const jalankan = () => {
        jalanSejakKetik = true;
        umpan.innerHTML = '';
        try { hasil = Lab.jalankanMurid(ed.nilai); Lab.tabelHasil(hasilW, hasil, { maks: 6 }); kirim.disabled = false; }
        catch (e) { hasil = null; kirim.disabled = true; umpan.append(el('div', { class: 'pesan bad' }, e.message)); Lab.sfx('salah'); }
      };
      const ed = Lab.editor({ placeholder: '-- Tulis query di sini', onubah: () => { jalanSejakKetik = false; }, onjalankan: jalankan });
      const kirim = el('button', { class: 'btn utama', disabled: true, onclick: () => {
        const n = Lab.nilai(hasil, Lab.q(KUNCI_TUTOR), false);
        umpan.innerHTML = '';
        if (!n.ok) { umpan.append(el('div', { class: 'pesan bad' }, el('b', {}, 'Hampir! '), `${n.pesan} Coba buka petunjuknya.`)); Lab.sfx('salah'); return; }
        umpan.append(el('div', { class: 'pesan ok baris' }, el('span', {}, el('b', {}, 'Benar! '), 'Di latihan sungguhan, jawaban ini memberimu +10 XP.'), el('span', { class: 'spasi' }),
          el('button', { class: 'btn utama kecil', onclick: () => { Lab.sfx('klik'); naik(3); faseRenungkan(); } }, 'Lanjut: Renungkan', el('i', { 'data-ikon': 'panah' }))));
        Lab.sfx('sukses');
      } }, el('i', { 'data-ikon': 'kirim' }), 'Kirim jawaban');
      badan.innerHTML = '';
      badan.append(el('div', { class: 'tutor-dua' },
        el('div', { class: 'kolom' }, el('div', { class: 'kartu lat-soal' }, el('span', { class: 'label' }, 'Soal'), el('p', { html: 'Tampilkan <b>semua kolom</b> dari tabel <code>ms_kategori</code>.' })),
          el('div', { class: 'kartu lat-skema' }, el('span', { class: 'label' }, 'Skema tabel'), tabel(t, true),
            el('details', { class: 'skema-lain' }, el('summary', {}, `Tabel lainnya (${lain.length})`), lain.map(x => tabel(x)))),
          el('div', { class: 'kartu lat-hint' }, el('div', { class: 'baris' }, el('span', { class: 'label' }, 'Petunjuk'), el('span', { class: 'spasi' }), tombolHint), hint)),
        el('div', { class: 'kolom tutor-editor' }, ed.wadah, el('div', { class: 'baris' }, el('button', { class: 'btn', onclick: jalankan }, el('i', { 'data-ikon': 'main' }), 'Jalankan'), kirim,
          el('span', { class: 'muted kecil' }, 'Ctrl+Enter untuk menjalankan')), umpan, hasilW)));
      setTimeout(() => ed.ta.focus(), 50);
    }
    // 💭 Renungkan
    function faseRenungkan() {
      const OPSI = ['Mengambil baris yang namanya diawali huruf tertentu', 'Mengambil semua kolom dari tabel', 'Menghapus semua isi tabel', 'Mengalikan isi kolom'], BENAR = 1;
      const alasan = el('div'), opsiW = el('div', { class: 'opsi' });
      OPSI.forEach((o, i) => opsiW.append(el('button', { onclick: e => {
        const ok = i === BENAR; e.currentTarget.classList.add(ok ? 'benar' : 'salah'); alasan.innerHTML = '';
        alasan.append(el('div', { class: 'pesan ' + (ok ? 'ok' : 'warn') }, ok ? 'Tepat! Tanda * memilih semua kolom. Contoh tadi hanya mengambil satu kolom (nama_kategori), sedangkan jawabanmu mengambil semuanya.'
          : 'Hampir! Bandingkan kolom pada hasil contoh dengan hasil jawabanmu, lalu coba pilihan lain.'));
        if (!ok) { Lab.sfx('salah'); return; }
        $$('button', opsiW).forEach(b => { b.disabled = true; }); catatanW.hidden = false; setTimeout(() => ta.focus(), 50);
      } }, el('span', { class: 'huruf' }, 'ABCD'[i]), el('span', {}, o))));
      badan.innerHTML = '';
      // catatan belajar wajib (sama seperti di Aktivitas): langkah 3 selesai setelah catatan disimpan
      const ta = el('textarea', { placeholder: 'Tulis minimal satu kalimat. mis. Ternyata tanda * mengambil semua kolom.' }), infoCt = el('div');
      const catatanW = el('div', { class: 'kartu jurnal', hidden: true }, el('span', { class: 'label' }, 'Catatan belajarku (wajib)'),
        el('label', {}, el('b', {}, 'Apa yang baru kamu pahami, atau yang masih membingungkan?'), ta),
        el('div', { class: 'baris' }, el('button', { class: 'btn kecil utama', onclick: () => {
          if (ta.value.trim().length < 10) { Lab.sfx('salah'); infoCt.innerHTML = ''; infoCt.append(el('div', { class: 'pesan warn' }, 'Tulis minimal satu kalimat pendek dulu, ya.')); ta.focus(); return; }
          infoCt.innerHTML = ''; infoCt.append(el('span', { class: 'chip ok' }, '✓ Catatan tersimpan')); ta.disabled = true; naik(4);
        } }, el('i', { 'data-ikon': 'simpan' }), 'Simpan catatan'), infoCt));
      badan.append(el('div', { class: 'tutor-renung' }, el('div', { class: 'kartu' }, el('span', { class: 'label' }, 'Pertanyaan reflektif'), el('p', { class: 'soal-teks' }, 'Apa arti tanda * pada SELECT * FROM ms_kategori?'), opsiW, alasan), catatanW));
    }

    w.append(el('div', { class: 'panduan-hal tutor' },
      el('div', { class: 'panduan-teks' }, el('h3', {}, 'Cara kerja · coba langsung!'),
        el('p', { html: 'Ini latihan mini, tidak dinilai. Kamu mencoba <b>satu soal</b> persis seperti di menu <b>Aktivitas</b>: pilih perintah, lalu kerjakan 3 langkahnya.' }),
        el('div', { class: 'cara-kerja' }, daftar), arahan,
        el('button', { class: 'btn kecil xp-tombol', onclick: () => { Lab.sfx('klik'); infoXp(); } }, '⭐ Cara hitung XP & Level')),
      meja));
    segar();

    // sorotan + narator, sama seperti di 3 soal pertama Aktivitas: yang harus dikerjakan sekarang diberi bingkai pink dan dibacakan
    const q = s => w.querySelector(s), tombolT = awal => $$('button', w).find(b => b.offsetParent && !b.disabled && b.textContent.trim().startsWith(awal));
    let sorotKini = null, kalimatKini = '';
    const cariSorot = () => {
      if ($('#rayakan')) return [null, kalimatKini];   // tunggu pop-up ditutup
      if (tahap >= 4) return [$('#panduanBerikut'), 'Mantap, kamu sudah paham caranya! Tekan Mulai Aktivitas untuk latihan sungguhan.'];
      if (tahap === 0) return [q('.tutor-pilih .perintah:not(.contoh)'), `Klik kartu SELECT FROM di ${Lab.sempit ? 'bawah' : 'kanan'}. Di menu Aktivitas, kartunya persis seperti ini.`];
      if (tahap === 1) { const l = tombolT('Lanjut: Kerjakan'); return l ? [l, 'Perhatikan hasilnya: kolom apa yang muncul, dan ada berapa baris? Sudah? Tekan Lanjut: Kerjakan soal.'] : [tombolT('Jalankan contoh'), 'Tekan Jalankan contoh untuk melihat hasil query-nya.']; }
      if (tahap === 2) {
        const l = tombolT('Lanjut: Renungkan'), ta = q('.tutor-editor textarea');
        if (l) return [l, 'Jawabanmu benar! Tekan Lanjut: Renungkan.'];
        if (!ta?.value.trim()) return [ta?.closest('.editor'), 'Baca soal dan skema tabel, lalu tulis query-mu di editor.'];
        if (!jalanSejakKetik) return [tombolT('Jalankan'), 'Tekan Jalankan untuk mencoba query-mu dan melihat hasilnya.'];
        if (q('.tutor-editor .pesan.bad')) return [tombolT('Buka petunjuk') ?? ta.closest('.editor'), 'Belum tepat. Baca pesannya, lalu perbaiki query-mu. Bingung? Tekan Buka petunjuk.'];
        return [tombolT('Kirim jawaban'), 'Hasilnya sudah tampil. Sudah sesuai dengan soal? Tekan Kirim jawaban.'];
      }
      const ct = q('.tutor-badan .jurnal');
      if (!ct || ct.hidden) return [q('.tutor-badan .opsi'), 'Baca pertanyaannya, lalu pilih jawaban yang paling tepat.'];
      const cta = ct.querySelector('textarea');
      return cta.value.trim().length < 10 ? [cta, 'Jawabanmu tepat! Sekarang tulis catatan belajarmu: apa yang baru kamu pahami?']
        : [tombolT('Simpan catatan'), 'Tekan Simpan catatan untuk menyelesaikan langkah 3.'];
    };
    const detakSorot = () => {
      if (!meja.isConnected) { clearInterval(tSorotTutor); sorotKini?.classList.remove('pandu-sorot'); return; }
      if (Lab.layar !== 'panduan') return;
      const [sasaran, k] = cariSorot();
      if (sasaran !== sorotKini) { sorotKini?.classList.remove('pandu-sorot'); sorotKini = sasaran; sorotKini?.classList.add('pandu-sorot');
        if (sasaran && Lab.sempit) sasaran.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
      if (k && k !== kalimatKini) { kalimatKini = k; if (tahap < 4) arahan.innerHTML = `<b>Langkah ${tahap + 1}:</b> ${Lab.esc(k)}`; if (sasaran) Lab.narasi(k); }
    };
    clearInterval(tSorotTutor); tSorotTutor = setInterval(detakSorot, 300); setTimeout(detakSorot, 50);
  }
  function tampilPanduan(h) {
    hal = h; clearInterval(tSorot);
    const w = $('#panduanIsi'); w.innerHTML = '';
    $('#panduanIndikator').textContent = `Panduan ${hal + 1} dari ${HAL_PANDUAN}`;
    $('#panduanSebelum').disabled = hal === 0;
    // satu halaman: Sebelumnya, indikator, dan Skip (= Mulai Aktivitas) tidak berguna, jadi disembunyikan
    for (const s of ['#panduanSebelum', '#panduanIndikator', '#panduanLewati']) $(s).hidden = HAL_PANDUAN === 1;
    $('#panduanBerikut').innerHTML = ''; $('#panduanBerikut').append(hal === HAL_PANDUAN - 1 ? 'Mulai Aktivitas' : 'Berikutnya', el('i', { 'data-ikon': 'panah' }));
    if (hal === 0) {
      tutorCaraKerja(w);
    } else if (hal === 1) {
      const mock = el('div', { class: 'mock' },
        el('div', { class: 'm-tiket' }, el('span', { class: 'huruf' }, 'A'), 'Tiket kerja', el('span', { class: 'spasi' }), el('span', { class: 'indikator' }, 'E · Langkah 1 dari 4')),
        el('div', { class: 'm-rak' }, el('span', { class: 'huruf' }, 'B'), 'Rak Tabel', ...Array.from({ length: 6 }, () => el('div', { class: 'm-baris' }))),
        el('div', { class: 'm-meja' }, el('span', { class: 'huruf' }, 'C'), 'Meja Kerja Query', el('div', { class: 'm-baris', style: { width: '70%' } }), el('div', { class: 'm-baris', style: { width: '55%' } })),
        el('div', { class: 'm-hasil' }, el('span', { class: 'huruf' }, 'D'), 'Panel Hasil', el('div', { class: 'm-baris' })));
      const ket = el('p', { class: 'kartu', 'aria-live': 'polite' });
      const sorotKe = i => { sorotan = i; $$('.mock > div', w).forEach((d, k) => d.classList.toggle('sorot', k === i)); const a = AREA[i]; ket.innerHTML = `<b>${a[1]} · ${a[2]}</b><br>${a[3]}`; };
      // area di gambar bisa diklik; putaran otomatis berhenti begitu siswa mengklik
      [...mock.children].forEach((d, i) => { d.classList.add('bisa-klik'); d.onclick = () => { clearInterval(tSorot); sorotKe(i); Lab.sfx('klik'); }; });
      w.append(el('div', { class: 'panduan-hal' }, el('div', { class: 'panduan-teks' }, el('h3', {}, 'Mengenal area kerja tiket'),
        el('p', {}, 'Tiket terpandu memakai tata letak yang sama di setiap langkah. 👉 Klik tiap area di gambar untuk melihat fungsinya.'),
        ket, el('div', { class: 'baris' }, el('button', { class: 'btn kecil', onclick: () => { clearInterval(tSorot); sorotKe((sorotan + 3) % 4); } }, el('i', { 'data-ikon': 'kiri' }), 'Area sebelumnya'),
          el('button', { class: 'btn kecil', onclick: () => { clearInterval(tSorot); sorotKe((sorotan + 1) % 4); } }, 'Area berikutnya', el('i', { 'data-ikon': 'panah' })))), mock));
      sorotKe(0); tSorot = setInterval(() => { if (Lab.layar === 'panduan' && hal === 1) sorotKe((sorotan + 1) % 4); }, 3800);
      Lab.narasi('Klik tiap area untuk mengenal tiket, rak tabel, meja kerja query, dan panel hasil.');
    } else if (hal === 2) {
      // Setiap blok perintah bisa diklik: contoh query sungguhan dijalankan di database Phi Minimart.
      const blok = [['select', 'SELECT · FROM · AS', 'mengambil kolom, tabel, dan alias', 'SELECT nama_produk AS produk, kode_satuan AS satuan FROM ms_produk'],
        ['order', 'ORDER BY · LIMIT', 'mengurutkan & membatasi', "SELECT nama_produk, harga FROM daftar_harga WHERE nama_cabang = 'Phi Minimart Tajur' AND tgl_berlaku = '2026-01-01' ORDER BY harga LIMIT 3"],
        ['where', 'WHERE · AND · OR', 'menyaring baris', "SELECT tgl_transaksi, kode_cabang, jumlah_pembelian FROM tr_penjualan WHERE kode_cabang = 'CABANG-003' AND jumlah_pembelian >= 4"],
        ['join', 'IN · BETWEEN · LIKE · IS NULL', 'saringan lanjut', 'SELECT kode_karyawan, nama_depan FROM ms_karyawan WHERE nama_belakang IS NULL'],
        ['group', 'DISTINCT', 'membuang baris kembar', 'SELECT DISTINCT kode_cabang FROM tr_penjualan']];
      const tombol = [['main', 'Jalankan', 'menjalankan query dan animasinya'], ['banding', 'Bandingkan', 'dua skenario berdampingan'], ['lampu', 'Petunjuk', 'bantuan singkat untuk tahap ini'], ['ulang', 'Ulang', 'kembali merakit, rakitan tetap tersimpan'], ['kode', 'Lihat SQL', 'query dari rakitanmu']];
      const contoh = el('div', { class: 'kartu contoh-blok' });
      const pilihBlok = i => {
        const [k, n, d, sql] = blok[i];
        $$('.leg-blok', w).forEach((b, j) => b.classList.toggle('pilih', j === i));
        contoh.innerHTML = ''; const hasilW = el('div', { class: 'hasil' });
        contoh.append(el('h3', {}, `Contoh ${n}`), el('p', { class: 'muted kecil' }, `Blok ini dipakai untuk ${d}.`), Lab.kotakSql(sql, 'contoh query'), hasilW);
        Lab.tabelHasil(hasilW, Lab.q(sql), { maks: 5 });
      };
      w.append(el('div', { class: 'panduan-hal' }, el('div', { class: 'panduan-teks' }, el('h3', {}, 'Alat dan tanda'),
        el('p', {}, 'Warna dan ikon alat sama di semua langkah. 👉 Klik blok perintah untuk melihat contoh query dan hasilnya.'),
        el('div', { class: 'kartu' }, el('h3', {}, 'Tombol'), tombol.map(([i, n, d]) => el('div', { class: 'leg-baris' }, el('span', { class: 'btn kecil', style: { minWidth: '118px' } }, el('i', { 'data-ikon': i }), n), el('small', {}, d)))),
        el('div', { class: 'kartu' }, el('h3', {}, 'Warna hasil'), el('div', { class: 'baris' }, el('span', { class: 'chip ok' }, '■ lolos / benar'), el('span', { class: 'chip abu' }, '■ tersaring'), el('span', { class: 'chip bad' }, '■ belum tepat'), el('span', { class: 'chip warn' }, '■ perlu perhatian')))),
        el('div', { class: 'legenda' },
          el('div', { class: 'kartu' }, el('h3', {}, 'Blok perintah'), blok.map(([k, n, d], i) => el('button', { class: 'leg-baris leg-blok', onclick: () => { Lab.sfx('klik'); pilihBlok(i); } },
            el('span', { class: `blok ${k}`, style: { padding: '4px 10px', minWidth: '150px' } }, el('span', { class: 'kw', style: { minWidth: 0 } }, n)), el('small', {}, d)))),
          contoh)));
      pilihBlok(0);
      Lab.narasi('Klik blok perintah untuk melihat contoh query dan hasilnya.');
    } else {
      const demo = el('div', { class: 'hasil' }, el('div', { class: 'kosong' }, 'Tekan Coba demo.'));
      const detail = el('p', { class: 'kartu alur-detail', 'aria-live': 'polite', html: `<b>Tahap 1 · ${TAHAP_ALUR[0][0]}</b> <span class="chip abu">${TAHAP_ALUR[0][2]}</span><br>${TAHAP_ALUR[0][1]}` });
      w.append(el('div', { class: 'panduan-hal' }, el('div', { class: 'panduan-teks' }, el('h3', {}, 'Alur setiap percobaan'),
        el('p', {}, 'Setiap tiket dikerjakan dalam 6 tahap yang mengikuti 3 pengalaman belajar Pembelajaran Mendalam: 🔍 Memahami, 🛠️ Mengaplikasi, dan 💭 Merefleksi. 👉 Klik tiap tahap untuk melihat apa yang kamu lakukan di sana.'),
        el('p', { class: 'muted' }, 'Panduan ini bisa dibuka lagi kapan saja lewat menu Panduan di atas.')),
        el('div', { class: 'alur' }, el('div', { class: 'alur-langkah' }, TAHAP_ALUR.flatMap(([t], i) => [i ? el('span', {}, '→') : null,
          el('button', { class: 'bisa-klik fase-' + (i < 4 ? 'memahami' : i < 5 ? 'mengaplikasi' : 'merefleksi') + (i ? '' : ' pilih'), onclick: e => { Lab.sfx('klik'); $$('.alur-langkah > button', w).forEach(b => b.classList.toggle('pilih', b === e.currentTarget)); detail.innerHTML = `<b>Tahap ${i + 1} · ${t}</b> <span class="chip abu">${TAHAP_ALUR[i][2]}</span><br>${TAHAP_ALUR[i][1]}`; } }, el('small', {}, TAHAP_ALUR[i][2]), el('b', {}, i + 1), t)])),
          detail,
          el('div', { class: 'kartu' }, el('h3', {}, 'Coba demo: SELECT * FROM ms_kategori'), Lab.kotakSql('SELECT * FROM ms_kategori;'),
            el('div', { class: 'baris', style: { margin: '10px 0' } }, el('button', { class: 'btn utama', onclick: () => {
              const r = Lab.q('SELECT * FROM ms_kategori'); Lab.sfx('swoosh');
              Lab.tabelHasil(demo, { kolom: r.kolom, baris: [] });
              r.baris.forEach((b, i) => setTimeout(() => { Lab.tabelHasil(demo, { kolom: r.kolom, baris: r.baris.slice(0, i + 1) }); if (i === r.baris.length - 1) Lab.sfx('ting'); }, 180 * (i + 1)));
            } }, el('i', { 'data-ikon': 'main' }), 'Coba demo')), demo))));
      Lab.narasi('Setiap tiket dikerjakan dalam lima tahap: baca tiket, rakit, jalankan, bandingkan, lalu jawab pertanyaan.');
    }
  }
  $('#panduanSebelum').onclick = () => { Lab.sfx('klik'); tampilPanduan(Math.max(0, hal - 1)); };
  // Briefing → langsung Peta Aktivitas. Panduan tidak diputar ulang (biasanya sudah dibaca sebelum mengisi data),
  // dan tetap bisa dibuka kapan saja lewat menu Panduan.
  $('#briefingLanjut').onclick = () => {
    Lab.sfx('klik'); Lab.st.panduanDilihat = true; Lab.simpan(); Lab.ke('peta');
    Lab.toast('📖 Butuh bantuan? Buka menu <b>Panduan</b> di atas kapan saja.', 4500);
  };
  // Panduan boleh dibaca sebelum mengisi data diri; tandanya diingat sampai siswa masuk.
  const selesaiPanduan = () => { Lab.st.panduanDilihat = true; panduanTamu = !Lab.st.siswa; Lab.simpan(); Lab.ke('peta'); };
  $('#panduanBerikut').onclick = () => { Lab.sfx('klik'); if (hal < HAL_PANDUAN - 1) tampilPanduan(hal + 1); else selesaiPanduan(); };
  $('#panduanLewati').onclick = selesaiPanduan;

  // ---------------------------------------------------------------- S03 Peta aktivitas
  // Kategori perintah SQL (sumber: sql.pdf). Baru Querying Data yang punya lab; kategori lain tampil sebagai pratinjau.
  const KATEGORI = [
    { nama: 'Querying Data', warna: 'var(--kuning)', perintah: [
      ['SELECT FROM', 'Menampilkan/mengambil data dari sebuah tabel tunggal.', 'select-from'], ['SELECT', 'Menjalankan perintah select tanpa mereferensikan tabel.', 'select-tanpa-tabel'],
      ['ORDER BY', 'Mengurutkan hasil query (bisa dikombinasikan dengan fungsi FIELD).', 'order-by'], ['WHERE', 'Menyaring baris data berdasarkan kondisi tertentu.', 'where'],
      ['SELECT DISTINCT', 'Menghilangkan baris duplikat dari hasil query.', 'select-distinct'], ['AND / OR', 'Mengombinasikan beberapa ekspresi Boolean untuk filter kompleks.', 'and-or'],
      ['IN / NOT IN', 'Mencocokkan nilai apakah ada (atau tidak ada) di dalam sekumpulan nilai.', 'in-not-in'], ['BETWEEN', 'Menyaring data berdasarkan rentang nilai tertentu.', 'between'],
      ['LIKE', 'Mencocokkan pola data (pattern matching) menggunakan wildcard (% dan _).', 'like'], ['LIMIT', 'Membatasi jumlah baris keluaran dari perintah SELECT.', 'limit'],
      ['IS NULL', 'Menguji apakah suatu nilai bernilai NULL atau tidak.', 'is-null'], ['Table & Column Aliases', 'Memberikan nama alias/sementara pada tabel atau kolom.', 'alias']] },
    { nama: 'Joining Tables', warna: 'var(--mint)', perintah: [
      ['INNER JOIN', 'Mengambil baris dari tabel yang memiliki kecocokan di kedua tabel.', 'inner-join'], ['LEFT JOIN', 'Mengambil semua baris dari tabel kiri dan data yang cocok dari tabel kanan.', 'left-join'],
      ['RIGHT JOIN', 'Mengambil semua baris dari tabel kanan dan data yang cocok dari tabel kiri.', 'right-join'], ['Self-join', 'Menggabungkan tabel dengan dirinya sendiri menggunakan alias.', 'self-join'],
      ['CROSS JOIN', 'Membuat perkalian kartesius (Cartesian product) dari baris beberapa tabel.', 'cross-join']] },
    { nama: 'Grouping & Subqueries', warna: 'var(--pink)', perintah: [
      ['GROUP BY', 'Mengelompokkan baris berdasarkan kolom atau ekspresi tertentu.', 'group-by'], ['HAVING', 'Menyaring kelompok data berdasarkan kondisi tertentu.', 'having'],
      ['HAVING COUNT', 'Menyaring grup berdasarkan jumlah item tertentu.', 'having-count'], ['ROLLUP', 'Membuat multiple grouping sets secara hierarki.', 'rollup'],
      ['Subquery', 'Menyisipkan query di dalam query utama (inner query & outer query).', 'subquery'], ['Derived table', 'Konsep tabel turunan untuk menyederhanakan query yang kompleks.', 'derived-table'],
      ['EXISTS', 'Menguji keberadaan baris (existence check).', 'exists'], ['UNION, EXCEPT, INTERSECT', 'Operator himpunan untuk menggabungkan, mencari selisih, atau mencari irisan data.', 'union-except-intersect']] },
    { nama: 'Managing Databases', warna: 'var(--langit)', perintah: [
      ['USE', 'Memilih database yang aktif untuk digunakan.'], ['CREATE DATABASE', 'Membuat database baru di MySQL Server.'], ['DROP DATABASE', 'Menghapus database dari server.']] },
    { nama: 'Managing Tables', warna: '#c9b8ff', perintah: [
      ['CREATE TABLE', 'Membuat tabel baru di dalam database.', 'create-table'], ['ALTER TABLE', 'Mengubah struktur tabel yang sudah ada.', 'alter-table'], ['RENAME TABLE', 'Mengganti nama tabel.', 'rename-table'],
      ['ALTER TABLE ADD COLUMN', 'Menambahkan kolom baru ke dalam tabel.', 'alter-add-column'], ['ALTER TABLE DROP COLUMN', 'Menghapus kolom dari tabel.', 'alter-drop-column'], ['DROP TABLE', 'Menghapus tabel yang ada.', 'drop-table'],
      ['TRUNCATE TABLE', 'Mengosongkan seluruh data di dalam tabel dengan cepat.', 'truncate-table'], ['Temporary tables', 'Mengelola tabel sementara (temporary tables).', 'temporary-table'],
      ['AUTO_INCREMENT', 'Menghasilkan nomor unik otomatis untuk primary key.', 'auto-increment']] },
    { nama: 'MySQL Constraints', warna: 'var(--oranye)', perintah: [
      ['Primary Key', 'Constraint untuk menentukan kunci utama suatu tabel.', 'primary-key'], ['Foreign Key', 'Mengelola relasi antar tabel.', 'foreign-key'],
      ['Disable Foreign Key Checks', 'Menonaktifkan pengecekan foreign key sementara.', 'disable-foreign-key-checks'], ['NOT NULL', 'Memastikan kolom tidak boleh diisi dengan nilai kosong.', 'not-null'],
      ['UNIQUE Constraint', 'Memastikan nilai dalam kolom bersifat unik/tidak kembar.', 'unique'], ['CHECK Constraint', 'Menjaga integritas data melalui aturan kondisi tertentu.', 'check'],
      ['DEFAULT Constraint', 'Mengatur nilai bawaan (default) pada kolom.', 'default']] },
    { nama: 'Modifying Data', warna: '#ff9b9b', perintah: [
      ['INSERT', 'Memasukkan data baru ke dalam tabel (bisa multi-row atau dari SELECT).', 'insert'], ['INSERT IGNORE', 'Memasukkan data sambil mengabaikan baris yang menyebabkan error.', 'insert-ignore'],
      ['UPDATE', 'Memperbarui data yang ada di dalam tabel.', 'update'], ['UPDATE JOIN', 'Memperbarui data lintas tabel menggunakan join.', 'update-join'], ['DELETE', 'Menghapus baris data dari tabel.', 'delete'],
      ['DELETE JOIN', 'Menghapus data dari beberapa tabel sekaligus.', 'delete-join'], ['ON DELETE CASCADE', 'Otomatis menghapus data anak saat data induknya dihapus.', 'on-delete-cascade'],
      ['REPLACE', 'Menyisipkan atau memperbarui data berdasarkan eksistensi data.', 'replace']] },
    { nama: 'Import & Export', warna: '#9be7d8', perintah: [
      ['LOAD DATA INFILE', 'Mengimpor file CSV ke dalam tabel MySQL.'], ['Export to CSV', 'Mengekspor tabel MySQL ke dalam format file CSV.']] },
    { nama: 'Studi Kasus', warna: '#ffb3c7', studi: true, perintah: [] },
  ];
  Lab.kategori = KATEGORI;
  const iApp = APP ? KATEGORI.findIndex(k => k.nama === APP.kategori) : -1;   // kategori milik aplikasi ini
  /** Nomor Lab Maya untuk kategori (dari js/aplikasi.js); kosong bila kategori belum dijadikan aplikasi. */
  const noLab = k => Object.values(window.LAB_APLIKASI ?? {}).find(a => a.kategori === k.nama)?.no;
  let petaPilih = Math.max(0, iApp);
  function tampilPeta() {
    const n = Lab.jumlahSelesai();
    if (adaTiket) {
      $('#petaProgresTeks').textContent = `${n} dari 4 langkah selesai · ${Lab.xp()} XP latihan`;
      $('#petaProgresBar').style.width = n * 25 + '%';
    } else {
      const ids = iApp >= 0 ? Lab.soalKategori(iApp) : KATEGORI.flatMap((_, i) => Lab.soalKategori(i)), s = soalSelesai(ids);   // lab lengkap: semua kategori
      $('#petaProgresTeks').textContent = `${s} dari ${ids.length} latihan selesai · ${Lab.xp()} XP · Level ${Lab.level(Lab.xp())}`;
      $('#petaProgresBar').style.width = (ids.length ? s / ids.length * 100 : 0) + '%';
    }
    if (iApp >= 0) petaPilih = iApp;
    $('#layar-peta .peta-badan').classList.toggle('satu', iApp >= 0);
    $('#layar-peta .peta-atas .muted').textContent = iApp < 0 ? `Pilih kategori SQL ${Lab.sempit ? 'di bawah (geser ke samping untuk melihat semua)' : 'di kiri'}. Kerjakan latihannya dan kumpulkan XP, progresnya nggak bakal hilang.`
      : adaTiket ? 'Kerjakan tiket terpandu berurutan, lalu asah tiap perintah lewat latihan. Progresnya nggak bakal hilang.'
        : 'Pilih perintah, kerjakan latihannya, dan kumpulkan XP. Progresnya nggak bakal hilang.';
    isiPeta(n);
    $('#menuBebas').disabled = !bebasTerbuka();
    Lab.narasi(adaTiket ? 'Pilih kategori, lalu kerjakan tiket atau latihan per perintah. Kamu bisa kembali kapan saja.' : 'Pilih perintah, lalu kerjakan latihannya. Kamu bisa kembali kapan saja.');
  }
  /** Daftar id latihan milik kategori ke-i (Studi Kasus: studi-1 … studi-n). */
  Lab.soalKategori = i => KATEGORI[i].studi ? Lab.studi.latihan.map((_, j) => 'studi-' + (j + 1)) : KATEGORI[i].perintah.map(p => p[2]).filter(Boolean);
  Lab.bukaKategori = i => { petaPilih = i; Lab.ke('peta'); };
  const soalSelesai = ids => ids.filter(id => Lab.st.latihan[id]?.ok).length;
  function isiPeta(n) {
    const daftar = $('#petaKategori'); daftar.innerHTML = '';
    KATEGORI.forEach((k, i) => {
      const ids = Lab.soalKategori(i), sel = soalSelesai(ids);
      daftar.append(el('button', { class: 'kategori' + (i === petaPilih ? ' pilih' : '') + (i && !ids.length ? ' nanti' : ''), role: 'tab', 'aria-selected': String(i === petaPilih),
        style: { '--warna': k.warna }, onclick: () => { Lab.sfx('klik'); petaPilih = i; isiPeta(n); } },
        el('span', { class: 'kat-no' }, i + 1), el('span', { class: 'kat-teks' }, el('b', {}, k.nama),
          el('small', {}, k.studi ? `Lab Maya ${noLab(k)} · materi + ${ids.length} soal` : noLab(k) ? `Lab Maya ${noLab(k)} · ${k.perintah.length} perintah` : `${k.perintah.length} perintah · segera hadir`)),
        !i && adaTiket ? el('span', { class: 'chip ' + (n === 4 ? 'ok' : 'primer') }, `${n}/4`)
          : ids.length ? el('span', { class: 'chip ' + (sel === ids.length ? 'ok' : 'abu') }, `${sel}/${ids.length}`) : el('i', { 'data-ikon': 'gembok', title: 'Segera hadir' })));
    });
    const k = KATEGORI[petaPilih], ids = Lab.soalKategori(petaPilih), w = $('#petaDetail'); w.innerHTML = '';
    const xpKat = ids.reduce((a, id) => a + Lab.xpSoal(id), 0);
    w.append(el('header', { class: 'kat-kepala', style: { '--warna': k.warna } },
      el('div', {}, el('span', { class: 'label' }, (noLab(k) ? `Lab Maya ${noLab(k)} · ` : '') + (k.studi ? 'Materi & soal gabungan' : 'Kategori')), el('h3', {}, k.nama)),
      ids.length ? el('span', { class: 'chip ok' }, `${soalSelesai(ids)}/${ids.length} latihan · ${xpKat} XP`) : el('span', { class: 'chip abu' }, el('i', { 'data-ikon': 'gembok' }), 'Segera hadir')));
    const buka = id => () => { Lab.sfx('klik'); Lab.ke('latihan', { id }); };
    if (k.studi) {
      w.append(el('div', { class: 'studi' },
        el('div', { class: 'studi-materi' }, el('p', { class: 'lead-kecil' }, Lab.studi.ringkasan), Lab.md(Lab.studi.isi, { coba: true })),
        el('div', { class: 'studi-soal' }, el('span', { class: 'label' }, 'Soal studi kasus · klik untuk mengerjakan'),
          ids.map((id, j) => { const s = Lab.soal[id]; return el('button', { class: 'soal-kartu' + (Lab.st.latihan[id]?.ok ? ' ok' : ''), onclick: buka(id) },
            el('span', { class: 'soal-no' }, j + 1), el('span', { class: 'kat-teks' }, el('b', {}, s.judul), el('small', {}, s.konsep)),
            el('span', { class: 'chip level-' + s.level.toLowerCase() }, s.level), el('span', { class: 'xp' }, Lab.lengkap3M(id) ? '✓ Tuntas' : Lab.st.latihan[id]?.ok ? '✓' : `+${s.xp}`)); }))));
      return;
    }
    if (petaPilih || !adaTiket) {
      w.append(el('p', { class: 'muted kecil' }, ids.length ? 'Pilih perintah buat latihan. Tiap latihan yang benar nambah XP!' : 'Kategori ini belum punya latihan. Intip dulu perintah yang bakal kamu pelajari:'),
        el('div', { class: 'perintah-grid' }, k.perintah.map(([p, f, id]) => {
          const s = id && Lab.soal[id], ok = id && Lab.st.latihan[id]?.ok;
          return el(s ? 'button' : 'div', { class: 'perintah' + (s ? ' bisa' : '') + (ok ? ' ok' : ''), style: { '--warna': k.warna }, onclick: s ? buka(id) : null },
            el('code', {}, p), el('p', {}, f),
            s ? el('span', { class: 'perintah-kaki' }, el('span', { class: 'chip level-' + s.level.toLowerCase() }, s.level),
              el('span', { class: 'xp' }, Lab.lengkap3M(id) ? '✓ Tuntas' : ok ? '✓ Benar · renungkan?' : `+${s.xp} XP`)) : null);
        })));
      return;
    }
    w.append(el('span', { class: 'label' }, 'Latihan per perintah · klik untuk mengerjakan'),
      el('div', { class: 'perintah-chip' }, k.perintah.map(([p, f, id]) => el('button', { class: 'chip' + (Lab.lengkap3M(id) ? ' lengkap' : Lab.st.latihan[id]?.ok ? ' ok' : ''), title: f + (Lab.lengkap3M(id) ? ' · tuntas (3 langkah selesai)' : ''), onclick: buka(id) },
        Lab.lengkap3M(id) ? '★ ' + p : Lab.st.latihan[id]?.ok ? '✓ ' + p : p))));
    const kartu = el('div', { class: 'peta-kartu' }); w.append(kartu);
    for (const d of Lab.langkah) {
      const buka = Lab.terbuka(d.no), sel = Lab.selesai(d.no), p = Lab.st.langkah[d.no];
      kartu.append(el('button', { class: 'tiket', disabled: !buka, onclick: () => { Lab.sfx('klik'); Lab.ke('langkah', { no: d.no }); } },
        el('span', { class: 'stempel' }, sel ? el('span', { class: 'chip ok' }, el('i', { 'data-ikon': 'cek' }), 'Selesai') : !buka ? el('span', { class: 'chip abu' }, el('i', { 'data-ikon': 'gembok' }), 'Terkunci') : p ? el('span', { class: 'chip warn' }, 'Dikerjakan') : el('span', { class: 'chip primer' }, 'Baru')),
        el('span', { class: 'no' }, `Langkah ${d.no} dari 4`), el('h3', {}, d.judul), el('span', { class: 'konsep', style: { background: d.warna } }, d.konsep),
        el('p', {}, d.ringkas), el('span', { class: 'dari' }, 'Tiket dari ' + d.tiket.dari)));
    }
    kartu.append(el('button', { class: 'tiket bebas', disabled: !Lab.selesai(1), onclick: () => Lab.ke('bebas') },
      el('span', { class: 'stempel' }, Lab.selesai(1) ? el('span', { class: 'chip primer' }, 'Terbuka') : el('span', { class: 'chip abu' }, el('i', { 'data-ikon': 'gembok' }), 'Setelah L1')),
      el('span', { class: 'no' }, 'Bonus'), el('h3', {}, 'Mode Bebas'), el('span', { class: 'konsep', style: { background: 'var(--primer)' } }, 'SQL bebas'),
      el('p', {}, 'Laboratorium terbuka: tulis query apa saja pada 8 tabel Phi Minimart, plus tantangan bonus.'), el('span', { class: 'dari' }, 'Tidak dinilai')));
    if (n === 4) w.append(el('button', { class: 'btn utama', onclick: () => Lab.ke('ringkasan') }, el('i', { 'data-ikon': 'cetak' }), 'Lihat laporan kerja'));
  }

  // ---------------------------------------------------------------- Rak tabel (dipakai langkah & Mode Bebas)
  Lab.rak = ({ pilih, sorot, onpilih, judul = 'Rak Tabel', intip = true } = {}) => {
    const w = el('aside', { class: 'rak', 'aria-label': 'Rak tabel' }, el('h3', {}, judul));
    for (const t of Lab.tabel) {
      w.append(el('button', { class: [t.nama === pilih ? 'pilih' : '', t.nama === sorot ? 'kedip' : ''].join(' '), title: t.kolom.join(', '),
        onclick: () => { Lab.sfx('klik'); if (onpilih) onpilih(t.nama); else if (intip) Lab.intip(t.nama); } },
      t.nama, el('small', {}, `${t.bantu ? 'tabel bantu · ' : ''}${t.baris} baris · ${t.kolom.length} kolom`)));
    }
    return w;
  };
  /** Jendela hasil query (intip tabel di rak, contoh query di materi): jendela diam, tabelnya ter-scroll di dalam. */
  Lab.dialogHasil = (judul, r, sql) => {
    const isi = el('div', { class: 'hasil', style: { maxHeight: sql ? '300px' : '360px' } }); Lab.tabelHasil(isi, r);
    const d = $('#dialog'); const kotak = d.querySelector('.dialog-kotak'); const asli = kotak.innerHTML;
    kotak.style.width = '900px';
    kotak.innerHTML = ''; kotak.append(el('b', {}, judul), sql ? Lab.kotakSql(sql, 'query') : null, isi, el('div', { class: 'baris', style: { justifyContent: 'flex-end' } }, el('button', { class: 'btn utama', onclick: () => { d.hidden = true; kotak.innerHTML = asli; kotak.style.width = ''; } }, 'Tutup')));
    d.hidden = false;
  };
  Lab.intip = nama => Lab.dialogHasil(`Intip 5 baris pertama: ${nama}`, Lab.q(`SELECT * FROM ${nama} LIMIT 5`));

  // ---------------------------------------------------------------- Mesin langkah (L1–L4): 6 tahap dalam 3 pengalaman belajar
  // Pembelajaran Mendalam (3M): Memahami → Mengaplikasi → Merefleksi.
  const FASE = [
    { nama: 'Memahami', ikon: '🔍', kelas: 'memahami', tahap: [1, 2, 3, 4], arti: 'membangun pemahaman konsep dari masalah nyata: baca tiket, rakit, jalankan, dan bandingkan' },
    { nama: 'Mengaplikasi', ikon: '🛠️', kelas: 'mengaplikasi', tahap: [5], arti: 'memakai konsep itu sendiri untuk masalah baru, tanpa bantuan blok' },
    { nama: 'Merefleksi', ikon: '💭', kelas: 'merefleksi', tahap: [6], arti: 'mengevaluasi dan memaknai proses belajarmu' },
  ];
  Lab.FASE = FASE;
  const TAHAP = ['Baca tiket', 'Rakit query', 'Jalankan & amati', 'Bandingkan', 'Terapkan', 'Refleksi'];
  const TAHAP_PENDEK = ['Baca tiket', 'Rakit', 'Jalankan', 'Bandingkan', 'Terapkan', 'Refleksi'];   // label strip; nama lengkap di title
  const faseDari = t => FASE.find(f => f.tahap.includes(t));
  /** Jurnal refleksi dianggap terisi bila "yang kupahami" berisi minimal satu kalimat pendek. */
  const jurnalOk = p => (p?.jurnal?.paham || '').trim().length >= 10;
  Lab.jurnalOk = jurnalOk;
  let L = null; // { d, p, tahap }
  Lab.bukaLangkah = (no, tahap) => {
    if (!Lab.terbuka(no)) { Lab.toast(`Langkah ${no} kebuka setelah Langkah ${no - 1} selesai.`); Lab.ke('peta'); return; }
    const d = Lab.langkah[no - 1], p = Lab.pl(no);
    p.rakit ??= d.stateAwal();
    L = { d, p };
    $('#lgIndikator').textContent = `Langkah ${no} dari 4`;
    $('#lgJudul').textContent = `${d.judul} (${d.konsep})`;
    keTahap(tahap ?? p.tahap ?? 1);
  };
  function keTahap(t) {
    L.p.tahap = t; L.tahap = t;
    Lab.st.terakhir = { layar: 'langkah', no: L.d.no, tahap: t }; Lab.simpan();
    // strip tahap dikelompokkan per fase 3M
    const ol = $('#lgTahap'); ol.innerHTML = '';
    FASE.forEach(f => ol.append(el('li', { class: 'fase ' + f.kelas + (f.tahap.includes(t) ? ' kini' : '') },
      el('span', { class: 'fase-label', title: f.arti }, `${f.ikon} ${f.nama}`),
      el('div', { class: 'fase-tahap' }, f.tahap.map(i => el('button', { class: (i === t ? 'aktif' : '') + (i < t ? ' lewat' : ''), 'aria-current': i === t ? 'step' : null,
        title: `Tahap ${i} · ${TAHAP[i - 1]} (${f.nama})`, onclick: () => { Lab.sfx('klik'); keTahap(i); } }, el('span', { class: 'n' }, i), TAHAP_PENDEK[i - 1]))))));
    ol.setAttribute('aria-label', `Tahap ${t} dari ${TAHAP.length} · ${faseDari(t).nama}`);
    const w = $('#lgIsi'); w.innerHTML = '';
    [tahapTiket, tahapRakit, tahapJalankan, tahapBanding, tahapTerapkan, tahapRefleksi][t - 1](w);
  }
  Lab.keTahap = keTahap;
  const PETUNJUK_REFLEKSI = 'Ingat lagi hasil tahap Bandingkan dan soal penerapan. Tulis dengan bahasamu sendiri: apa yang baru kamu pahami, dan apa yang masih bikin bingung.';
  $('#lgPetunjuk').onclick = () => { Lab.sfx('ting'); Lab.toast('💡 ' + (L.tahap === 6 ? PETUNJUK_REFLEKSI : L.d.petunjuk[L.tahap - 1] || L.d.petunjuk[0]), 6000); };
  const navTahap = (kiriTeks, kiriKe, kananTeks, kananKe, kananUtama = true) => el('div', { class: 'baris' },
    kiriTeks ? el('button', { class: 'btn', onclick: () => { Lab.sfx('klik'); keTahap(kiriKe); } }, el('i', { 'data-ikon': 'kiri' }), kiriTeks) : null,
    el('span', { class: 'spasi' }),
    kananTeks ? el('button', { class: 'btn' + (kananUtama ? ' utama' : ''), onclick: () => { Lab.sfx('klik'); typeof kananKe === 'function' ? kananKe() : keTahap(kananKe); } }, kananTeks, el('i', { 'data-ikon': 'panah' })) : null);

  // Tahap 1: tiket
  function tahapTiket(w) {
    const { d, p } = L;
    const kertas = el('div', { class: 'tiket-kertas' },
      el('div', { class: 'kepala' }, el('div', { class: 'avatar', style: { background: d.tiket.warnaAvatar || '#bcd3ff', color: '#1d3b7a' } }, d.tiket.inisial),
        el('div', {}, el('b', {}, d.tiket.dari), el('br'), el('small', { class: 'muted' }, d.tiket.jabatan)), el('span', { class: 'spasi' }), el('span', { class: 'chip warn' }, el('i', { 'data-ikon': 'tiket' }), `Tiket #${d.no}`)),
      el('div', { class: 'isi', html: d.tiket.teks }),
      el('div', { class: 'meta' }, el('span', { class: 'chip primer' }, 'Peranmu: Analis Data Junior'), el('span', { class: 'chip abu' }, 'Konsep: ' + d.konsep), el('span', { class: 'chip abu' }, 'Tabel: ' + d.tabelTiket)),
      Lab.selesai(d.no) ? el('div', { class: 'stempel-selesai' }, 'SELESAI') : null);
    w.append(el('div', { class: 'kolom', style: { flex: 1 } }, el('div', { class: 'tiket-besar' }, kertas,
      el('div', { class: 'kolom', style: { flex: 1 } }, el('div', { class: 'kartu' }, el('h3', {}, 'Kaitan dengan dunia kerja'), el('p', { class: 'muted', style: { fontSize: '14px', lineHeight: 1.5 } }, d.duniaKerja)),
        el('div', { class: 'kartu' }, el('h3', {}, 'Yang akan kamu lakukan'), el('div', { class: 'fase-ringkas' }, FASE.map(f => el('div', { class: 'fase ' + f.kelas },
          el('b', {}, `${f.ikon} ${f.nama}`), el('span', {}, f.arti[0].toUpperCase() + f.arti.slice(1) + '.'))))),
        el('button', { class: 'btn utama besar', onclick: () => { Lab.sfx('pas'); keTahap(2); } }, el('i', { 'data-ikon': 'cek' }), p.tiketOk ? 'Gas ke meja kerja' : 'Terima tiket')))));
    Lab.sfx('tiket');
    Lab.narasi(d.tiket.narasi);
  }

  // Tahap 2: rakit
  function tahapRakit(w) {
    const { d, p } = L;
    const meja = el('div', { class: 'meja' });
    const kodeW = el('div'), pesanW = el('div'), hitung = el('div', { class: 'penghitung' });
    const segar = () => {
      Lab.simpan();
      const err = d.validasi?.(p.rakit);
      pesanW.innerHTML = '';
      if (err) pesanW.append(el('div', { class: 'pesan bad' }, err));
      kodeW.innerHTML = ''; kodeW.append(Lab.kotakSql(d.sql(p.rakit), 'Lihat SQL · tersusun otomatis'));
      hitung.innerHTML = '';
      if (err) hitung.append(el('span', { class: 'muted' }, 'Rakitannya dibenerin dulu, ya.'));
      else { try { hitung.append(el('b', {}, Lab.angka(d.hitung(p.rakit))), el('span', {}, d.labelHitung || 'baris akan tampil')); } catch (e) { hitung.append(el('span', { class: 'pesan bad' }, Lab.galat(e.message))); } }
    };
    const ubah = (salahBlok) => { Lab.sfx('pas'); if (salahBlok) { salahBlok.classList.remove('salah'); void salahBlok.offsetWidth; salahBlok.classList.add('salah'); Lab.sfx('salah'); } segar(); };
    d.rakit(meja, p.rakit, ubah);
    // Rak: bila langkah punya slot FROM yang bisa diisi, klik tabel = pasang ke slot; selain itu = intip isinya.
    const rak = Lab.rak({ pilih: d.tabelDipilih?.(p.rakit), sorot: d.tabelSorot,
      onpilih: d.pilihTabel ? nama => { d.pilihTabel(p.rakit, nama); Lab.simpan(); keTahap(2); if (nama !== d.tabelSorot) Lab.toast(`Tabel ${nama} dipasang di FROM. Periksa pesan di meja kerja.`); } : null });
    w.append(rak, el('div', { class: 'kolom', style: { flex: 1 } }, el('div', { class: 'pesan info' }, el('b', {}, 'Tiket: '), el('span', { html: d.tiket.ringkas })), meja, pesanW),
      el('div', { class: 'kolom', style: { width: '380px' } }, kodeW, hitung,
        el('p', { class: 'muted', style: { fontSize: '13px' } }, 'Geser slider atau ganti pilihan: jumlah baris di atas berubah seketika.'),
        el('span', { class: 'spasi' }), navTahap('Tiket', 1, 'Jalankan', 3)));
    segar();
  }

  // Tahap 3: jalankan & amati
  function tahapJalankan(w) {
    const { d, p } = L;
    const vis = el('div', { class: 'panggung-visual' }, el('div', { class: 'kosong', style: { marginTop: '120px' } }, 'Tekan ', el('b', {}, 'Jalankan'), ' untuk melihat bagaimana database memproses query-mu.'));
    const hasilW = el('div', { class: 'hasil', style: { height: '170px' } }, el('div', { class: 'kosong' }, 'Tabel hasil muncul di sini.'));
    const umpan = el('div');
    let hasil = null;
    const jalankan = () => {
      const err = d.validasi?.(p.rakit);
      if (err) { Lab.sfx('salah'); umpan.innerHTML = ''; umpan.append(el('div', { class: 'pesan bad' }, err, ' Kembali ke tahap Rakit untuk memperbaikinya.')); return; }
      try { hasil = Lab.q(d.sql(p.rakit)); } catch (e) { Lab.sfx('salah'); umpan.innerHTML = ''; umpan.append(el('div', { class: 'pesan bad' }, Lab.galat(e.message))); return; }
      p.sqlTerakhir = d.sql(p.rakit); Lab.simpan();
      d.visual(vis, p.rakit, hasil, hasilW);
      Lab.tabelHasil(hasilW, hasil, { sorot: d.sorotBaris });
      umpan.innerHTML = '';
      kirimBtn.disabled = false;
    };
    const kirimBtn = el('button', { class: 'btn hijau', disabled: true, onclick: () => {
      const c = d.cekTiket(p.rakit, hasil);
      umpan.innerHTML = '';
      umpan.append(el('div', { class: 'pesan ' + (c.ok ? 'ok' : 'bad') }, el('b', {}, c.ok ? 'Tiket beres! 🎉 ' : 'Belum sesuai tiket, coba lagi! '), c.pesan));
      if (c.ok) { p.tiketOk = true; Lab.simpan(); Lab.sfx('sukses'); Lab.narasi(c.narasi || 'Hasilmu sudah sesuai tiket.'); } else Lab.sfx('salah');
    } }, el('i', { 'data-ikon': 'kirim' }), 'Kirim hasil ke ' + d.tiket.panggilan);
    w.append(el('div', { class: 'kolom', style: { width: '380px' } },
      el('div', { class: 'pesan info' }, el('b', {}, 'Tiket: '), el('span', { html: d.tiket.ringkas })),
      Lab.kotakSql(d.sql(p.rakit), 'Query yang akan dijalankan'),
      el('div', { class: 'baris' }, el('button', { class: 'btn utama besar', onclick: () => { Lab.sfx('klik'); jalankan(); } }, el('i', { 'data-ikon': 'main' }), 'Jalankan'),
        el('button', { class: 'btn', onclick: () => { Lab.sfx('klik'); keTahap(2); } }, el('i', { 'data-ikon': 'ulang' }), 'Ulang rakit')),
      kirimBtn, umpan, p.tiketOk ? el('div', { class: 'pesan ok' }, '✓ Tiket ini udah pernah kamu jawab dengan benar.') : null,
      el('span', { class: 'spasi' }), navTahap('Rakit', 2, 'Bandingkan', 4)),
    el('div', { class: 'kolom', style: { flex: 1 } }, vis, hasilW));
  }

  // Tahap 4: bandingkan skenario (A vs B) + simulasi spesifik
  function tahapBanding(w) {
    const { d, p } = L;
    p.banding ??= { a: d.banding.a(), b: d.banding.b() };
    const panel = (sisi, judul) => {
      const st = p.banding[sisi];
      const mini = el('div', { class: 'mini' }), kode = el('div'), atur = el('div', { class: 'meja', style: { flex: 'none', overflow: 'visible' } });
      const segar = () => {
        Lab.simpan(); kode.innerHTML = '';
        const sql = d.sql(st); kode.append(Lab.kotakSql(sql, 'Skenario ' + sisi.toUpperCase()));
        try { d.banding.mini(mini, st, Lab.q(sql), sisi); } catch (e) { mini.innerHTML = ''; mini.append(el('div', { class: 'pesan bad' }, Lab.galat(e.message))); }
      };
      d.banding.atur(atur, st, () => { Lab.sfx('pas'); segar(); });
      const el_ = el('div', { class: 'banding-panel ' + sisi }, el('header', {}, el('b', {}, sisi.toUpperCase()), el('strong', {}, judul)), atur, kode, mini);
      segar();
      return el_;
    };
    const catatan = el('textarea', { placeholder: 'Catat pengamatanmu: apa yang berbeda antara skenario A dan B, dan mengapa?' }); catatan.value = p.catatan || '';
    const simpanBtn = el('button', { class: 'btn', onclick: () => { p.catatan = catatan.value; Lab.simpan(); Lab.sfx('pas'); Lab.toast('Pengamatan aman tersimpan ✓'); } }, el('i', { 'data-ikon': 'simpan' }), 'Simpan pengamatan');
    w.append(el('div', { class: 'kolom', style: { flex: 1 } },
      el('div', { class: 'pesan info', html: `<b>Eksplorasi:</b> ${d.banding.pengantar}` }),
      // Simulasi spesifik (bila ada) mendapat kolom sendiri di kanan panel A/B.
      el('div', { class: 'banding' + (d.banding.simulasi ? ' dengan-sim' : '') }, panel('a', d.banding.judulA), panel('b', d.banding.judulB), d.banding.simulasi ? d.banding.simulasi() : null),
      el('div', { class: 'banding-bawah' }, catatan, el('div', { class: 'kolom' }, simpanBtn, navTahap(null, null, 'Terapkan', 5)))));
    Lab.narasi(d.banding.narasi);
  }

  /** Kartu kecil penjelas fase 3M yang sedang dijalani. */
  const kartuFase = (t, teks) => { const f = faseDari(t); return el('div', { class: 'kartu fase-kartu ' + f.kelas }, el('span', { class: 'label' }, `${f.ikon} ${f.nama}`), el('p', {}, teks || `Saatnya ${f.arti}.`)); };
  /** Banner selesai bila ketiga pengalaman belajar sudah dijalani; jika belum, sebutkan yang kurang. */
  function cekSelesai(banner) {
    const { d, p } = L;
    banner.innerHTML = '';
    const kurang = [!p.tiketOk && 'kirim hasil tiket (tahap 3, Memahami)', !p.penerapanOk && 'soal penerapan (tahap 5, Mengaplikasi)',
      !p.reflektifOk && 'pertanyaan reflektif (tahap 6)', !jurnalOk(p) && 'jurnal refleksi (tahap 6)'].filter(Boolean);
    if (kurang.length) { banner.append(el('div', { class: 'pesan warn' }, 'Biar langkah ini kelar, selesaikan juga: ' + kurang.join(', ') + '.')); return; }
    const baru = !p.diumumkan; p.diumumkan = true; Lab.simpan(); if (baru) Lab.catat('progres');
    banner.append(el('div', { class: 'selesai-banner' }, el('span', { class: 'lencana', style: { '--warna': d.warna } }, d.lencana.huruf),
      el('div', { style: { flex: 1 } }, el('b', {}, `Langkah ${d.no} kelar! Lencana "${d.lencana.nama}" kebuka 🏅`), el('br'), el('span', { class: 'muted' }, d.ucapan)),
      d.no < 4 ? el('button', { class: 'btn utama', onclick: () => Lab.ke('langkah', { no: d.no + 1, tahap: 1 }) }, `Gas ke Langkah ${d.no + 1}`, el('i', { 'data-ikon': 'panah' }))
        : el('button', { class: 'btn utama', onclick: () => Lab.ke('ringkasan') }, 'Lihat laporan', el('i', { 'data-ikon': 'panah' })),
      el('button', { class: 'btn', onclick: () => Lab.ke('peta') }, 'Peta aktivitas')));
    if (baru) {
      Lab.narasi(d.ucapan);
      Lab.rayakan({ ikon: d.lencana.huruf, judul: `Lencana "${d.lencana.nama}" kebuka!`, isi: `Kamu sudah <b>memahami</b>, <b>mengaplikasi</b>, dan <b>merefleksi</b> ${d.konsep}. ${d.ucapan}`,
        tombol: [{ teks: 'Tutup' }, d.no < 4 ? { teks: `Gas ke Langkah ${d.no + 1} →`, utama: true, aksi: () => Lab.ke('langkah', { no: d.no + 1, tahap: 1 }) }
          : { teks: 'Lihat laporan →', utama: true, aksi: () => Lab.ke('ringkasan') }] });
    }
  }

  // Tahap 5 · MENGAPLIKASI: tulis query sendiri untuk soal penerapan (konteks baru, tanpa blok)
  function tahapTerapkan(w) {
    const { d, p } = L;
    const s = d.soal;
    const hasilW = el('div', { class: 'hasil' }, el('div', { class: 'kosong' }, 'Jalankan query-mu untuk melihat hasilnya.'));
    const umpan = el('div'), banner = el('div');
    const ed = Lab.editor({ nilai: p.jawabSql || '', onubah: v => { p.jawabSql = v; Lab.simpan(); }, onjalankan: () => coba(false) });
    function coba(kirim) {
      umpan.innerHTML = '';
      let h;
      try { h = Lab.jalankanMurid(ed.nilai); } catch (e) { Lab.sfx('salah'); umpan.append(el('div', { class: 'pesan bad' }, e.message)); return; }
      Lab.tabelHasil(hasilW, h);
      if (!kirim) { Lab.sfx('klik'); return; }
      const n = Lab.nilai(h, Lab.q(s.penerapan.kunci), s.penerapan.urut, s.penerapan.namaKolom);
      umpan.append(el('div', { class: 'pesan ' + (n.ok ? 'ok' : 'bad') }, el('b', {}, n.ok ? 'Mantap, benar! ' : 'Hampir! '), n.pesan,
        n.ok ? el('button', { class: 'btn kecil utama lat-lanjut', onclick: () => { Lab.sfx('klik'); keTahap(6); } }, 'Lanjut refleksi', el('i', { 'data-ikon': 'panah' })) : null));
      if (n.ok) { p.penerapanOk = true; Lab.simpan(); Lab.sfx('sukses'); cekSelesai(banner); } else Lab.sfx('salah');
    }
    w.append(el('div', { class: 'jawab' },
      el('div', { class: 'soal' }, el('div', { class: 'kartu' }, el('span', { class: 'label' }, 'Soal penerapan'), el('p', { class: 'soal-teks', html: s.penerapan.teks }),
        p.penerapanOk ? el('span', { class: 'chip ok' }, '✓ Udah benar') : null),
        ed.wadah, el('div', { class: 'baris' }, el('button', { class: 'btn', onclick: () => coba(false) }, el('i', { 'data-ikon': 'main' }), 'Jalankan'),
          el('button', { class: 'btn utama', onclick: () => coba(true) }, el('i', { 'data-ikon': 'kirim' }), 'Kirim jawaban'), el('span', { class: 'muted kecil' }, 'Ctrl+Enter untuk menjalankan')), umpan, hasilW),
      el('div', { class: 'soal' },
        kartuFase(5, `Di tahap Memahami kamu merakit ${d.konsep} dengan blok. Sekarang tulis query-nya sendiri untuk permintaan yang berbeda.`),
        p.sqlTerakhir ? el('div', { class: 'kartu' }, el('span', { class: 'label' }, 'Contekan: SQL dari rakitanmu'), el('p', { class: 'muted kecil' }, 'Pola ini bisa kamu tiru, tapi tabel dan syaratnya berbeda.'), Lab.kotakSql(p.sqlTerakhir, 'tahap 3')) : null,
        banner, el('span', { class: 'spasi' }), navTahap('Bandingkan', 4, 'Refleksi', 6))));
    if (p.penerapanOk) cekSelesai(banner);
    Lab.narasi('Saatnya mengaplikasi. Tulis query-mu sendiri untuk soal penerapan.');
  }

  // Tahap 6 · MEREFLEKSI: pertanyaan reflektif + jurnal singkat + tingkat keyakinan
  function tahapRefleksi(w) {
    const { d, p } = L;
    const s = d.soal;
    p.jurnal ??= { paham: '', bingung: '', yakin: 0 };
    const banner = el('div');
    const opsi = el('div', { class: 'opsi' }), alasan = el('div');
    s.reflektif.opsi.forEach((o, i) => opsi.append(el('button', { onclick: e => {
      const benar = i === s.reflektif.benar;
      $$('button', opsi).forEach(b => { b.disabled = benar; });
      e.currentTarget.classList.add(benar ? 'benar' : 'salah');
      alasan.innerHTML = ''; alasan.append(el('div', { class: 'pesan ' + (benar ? 'ok' : 'warn') }, benar ? s.reflektif.alasan : 'Hampir! Inget-inget lagi hasil percobaanmu di tahap Bandingkan, terus coba pilihan lain.'));
      if (benar) { p.reflektifOk = true; Lab.simpan(); Lab.sfx('sukses'); cekSelesai(banner); } else Lab.sfx('salah');
    } }, el('span', { class: 'huruf' }, 'ABCD'[i]), el('span', {}, o))));
    if (p.reflektifOk) { const b = opsi.children[s.reflektif.benar]; b.classList.add('benar'); $$('button', opsi).forEach(x => { x.disabled = true; }); alasan.append(el('div', { class: 'pesan ok' }, s.reflektif.alasan)); }

    const paham = el('textarea', { placeholder: `mis. Ternyata ${d.konsep.split(' · ')[0]} itu …` }); paham.value = p.jurnal.paham;
    const bingung = el('textarea', { placeholder: 'Boleh dikosongkan. mis. Aku masih bingung kapan harus pakai …' }); bingung.value = p.jurnal.bingung;
    const skala = el('div', { class: 'skala' }, [1, 2, 3, 4].map(v => el('button', { class: p.jurnal.yakin === v ? 'on' : '', title: ['', 'Belum yakin', 'Agak yakin', 'Yakin', 'Yakin banget'][v],
      onclick: e => { p.jurnal.yakin = v; Lab.simpan(); $$('button', skala).forEach(b => b.classList.toggle('on', b === e.currentTarget)); Lab.sfx('klik'); } }, v)));
    const simpan = () => { p.jurnal.paham = paham.value; p.jurnal.bingung = bingung.value; Lab.simpan(); };
    paham.oninput = bingung.oninput = simpan;
    const simpanBtn = el('button', { class: 'btn utama', onclick: () => {
      simpan();
      if (!jurnalOk(p)) { Lab.sfx('salah'); Lab.toast('Tulis minimal satu kalimat tentang hal yang baru kamu pahami, ya.'); paham.focus(); return; }
      Lab.sfx('pas'); Lab.toast('Jurnal refleksi tersimpan ✓'); cekSelesai(banner);
    } }, el('i', { 'data-ikon': 'simpan' }), 'Simpan jurnal');

    w.append(el('div', { class: 'jawab refleksi' },
      el('div', { class: 'soal' }, kartuFase(6, 'Lihat lagi apa yang sudah kamu lakukan di tiket ini, lalu maknai: apa yang kamu pahami, dan apa yang masih perlu dipelajari.'),
        el('div', { class: 'kartu' }, el('span', { class: 'label' }, 'Pertanyaan reflektif'), el('p', { class: 'soal-teks' }, s.reflektif.teks), opsi, alasan)),
      el('div', { class: 'soal' }, el('div', { class: 'kartu jurnal' }, el('span', { class: 'label' }, 'Jurnal refleksi'),
        p.catatan ? el('p', { class: 'muted kecil' }, el('b', {}, 'Pengamatanmu di tahap Bandingkan: '), p.catatan) : null,
        el('label', {}, el('b', {}, 'Apa yang baru kamu pahami dari tiket ini? *'), paham),
        el('label', {}, el('b', {}, 'Apa yang masih membingungkan atau ingin kamu tanyakan?'), bingung),
        el('div', { class: 'baris' }, el('b', { class: 'kecil' }, `Seberapa yakin kamu bisa memakai ${d.konsep.split(' · ')[0]} sendiri?`), skala),
        el('div', { class: 'baris' }, simpanBtn, el('span', { class: 'muted kecil' }, '* wajib, minimal satu kalimat'))),
        banner, el('span', { class: 'spasi' }), navTahap('Terapkan', 5, null, null))));
    if (p.reflektifOk || jurnalOk(p)) cekSelesai(banner);
    Lab.narasi('Saatnya merefleksi. Jawab pertanyaan reflektif dan tulis jurnal singkatmu.');
  }

  // ---------------------------------------------------------------- MB Mode Bebas
  let bebasSiap = false;
  function tampilBebas() {
    const rak = $('#bebasRak'); rak.replaceWith(Object.assign(Lab.rak({ judul: 'Rak Tabel · klik untuk intip' }), { id: 'bebasRak' }));
    $('#bebasTantangan').innerHTML = '<b>Tantangan bonus:</b> Produk apa saja di Phi Minimart Dago yang harganya <b>antara Rp10.000 dan Rp20.000</b> per 1 Januari 2026? Petunjuk: tabel bantu daftar_harga dan BETWEEN.';
    if (bebasSiap) return;
    bebasSiap = true;
    const ta = $('#bebasSql'), sorot = $('#bebasSorot');
    const segar = () => { sorot.innerHTML = Lab.sorot(ta.value) + '\n'; };
    const jalankan = () => {
      const w = $('#bebasHasil');
      try {
        const st = window.MySQLLab ? MySQLLab.pecah(ta.value) : [];
        const h = Lab.jalankanMurid(st.length === 1 ? MySQLLab.select(st[0]) : ta.value); Lab.tabelHasil(w, h, { maks: 200 }); Lab.sfx('ting');
      }
      catch (e) { w.innerHTML = ''; w.append(el('div', { class: 'pesan bad', style: { margin: '10px' } }, e.message)); Lab.sfx('salah'); }
    };
    pasangEditor(ta, sorot, null, segar, jalankan);
    $('#bebasJalankan').onclick = jalankan;
  }

  // ---------------------------------------------------------------- PN1–PN2 Penutup
  function tampilRingkasan() {
    const n = Lab.jumlahSelesai();
    const s = Lab.st.siswa ?? {}, xp = Lab.xp();
    $('#ringkasanSub').textContent = `${s.nama ?? '-'} · ${s.email ?? '-'} · ${s.sekolah ?? '-'} · ${adaTiket ? `${n} dari 4 tiket · ` : ''}${xp} XP · Level ${Lab.level(xp)} · ${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`;
    const kiri = $('#ringkasanTiket'); kiri.innerHTML = '';
    for (const d of adaTiket ? Lab.langkah : []) {
      const p = Lab.st.langkah[d.no] || {};
      kiri.append(el('div', { class: 'kartu' }, el('div', { class: 'baris' }, el('b', {}, `Tiket ${d.no} · ${d.judul}`), el('span', { class: 'spasi' }),
        Lab.selesai(d.no) ? el('span', { class: 'chip ok' }, 'SELESAI') : el('span', { class: 'chip abu' }, 'Belum')),
        el('span', { class: 'muted' }, 'Dari ' + d.tiket.dari),
        p.sqlTerakhir ? Lab.kotakSql(p.sqlTerakhir, 'query tiket') : el('span', { class: 'muted' }, 'Belum ada query.'),
        el('div', { class: 'baris fase-status' }, [['Memahami', p.tiketOk], ['Mengaplikasi', p.penerapanOk], ['Merefleksi', p.reflektifOk && Lab.jurnalOk(p)]]
          .map(([n, ok]) => el('span', { class: 'chip ' + (ok ? 'ok' : 'abu') }, (ok ? '✓ ' : '○ ') + n))),
        p.catatan ? el('span', {}, el('b', {}, 'Pengamatan: '), p.catatan) : null,
        p.jurnal?.paham ? el('span', {}, el('b', {}, 'Yang kupahami: '), p.jurnal.paham) : null,
        p.jurnal?.bingung ? el('span', {}, el('b', {}, 'Masih bingung: '), p.jurnal.bingung) : null,
        p.jurnal?.yakin ? el('span', { class: 'muted' }, `Keyakinan: ${p.jurnal.yakin}/4`) : null,
        el('button', { class: 'btn kecil', disabled: !Lab.terbuka(d.no), onclick: () => Lab.ke('langkah', { no: d.no }) }, 'Buka kembali langkah ini')));
    }
    kiri.append(el('div', { class: 'kartu profesi rekap-latihan' }, el('h3', {}, 'Latihan per perintah & Studi Kasus'),
      el('table', {}, el('thead', {}, el('tr', {}, ['Kategori', 'Soal benar', 'Tuntas (3 langkah)', 'Solusi dilihat', 'XP'].map(x => el('th', {}, x)))),
        el('tbody', {}, KATEGORI.map((k, i) => [k, Lab.soalKategori(i), i]).filter(([, ids, i]) => ids.length && (iApp < 0 || i === iApp)).map(([k, ids]) => el('tr', {},
          el('td', {}, k.nama), el('td', {}, `${ids.filter(id => Lab.st.latihan[id]?.ok).length}/${ids.length}`), el('td', {}, `${ids.filter(Lab.lengkap3M).length}/${ids.length}`),
          el('td', {}, ids.filter(id => Lab.st.latihan[id]?.solusi).length), el('td', {}, ids.reduce((a, id) => a + Lab.xpSoal(id), 0))))))));
    const len = $('#ringkasanLencana'); len.innerHTML = ''; len.hidden = !adaTiket;
    len.append(el('h3', {}, 'Lencana'), el('div', { class: 'lencana-deret' }, Lab.langkah.map(d => el('div', {}, el('span', { class: 'lencana' + (Lab.selesai(d.no) ? '' : ' mati'), style: { '--warna': d.warna } }, d.lencana.huruf), d.lencana.nama))));
    const r = $('#ringkasanRefleksi'); r.innerHTML = '';
    r.append(el('h3', {}, 'Refleksi diri'));
    [['paham', 'Seberapa paham kamu menulis query SQL sekarang? (1 = belum, 4 = sangat paham)'], ['sulit', 'Perintah mana yang paling menantang, dan mengapa?'], ['pakai', 'Di mana kamu akan memakai kemampuan ini (PKL, proyek, pekerjaan)?']].forEach(([k, t], i) => {
      const item = el('div', { class: 'refleksi-item' }, el('span', {}, t));
      if (i === 0) item.append(el('div', { class: 'skala' }, [1, 2, 3, 4].map(v => el('button', { class: Lab.st.refleksi[k] === v ? 'on' : '', onclick: e => { Lab.st.refleksi[k] = v; Lab.simpan(); $$('button', e.currentTarget.parentNode).forEach(b => b.classList.toggle('on', +b.textContent === v)); Lab.sfx('klik'); } }, v))));
      else { const inp = el('input', { value: Lab.st.refleksi[k] || '', placeholder: 'Tulis jawabanmu…' }); inp.oninput = () => { Lab.st.refleksi[k] = inp.value; Lab.simpan(); }; item.append(inp); }
      r.append(item);
    });
    const daftarApp = Object.values(window.LAB_APLIKASI ?? {}), ini = APP ?? daftarApp[0], lanjut = daftarApp.find(a => a.no === (ini?.no ?? 0) + 1);
    kiri.append(el('div', { class: 'kartu profesi', id: 'ringkasanProfesi' }, el('h3', {}, 'Kemampuan ini di dunia kerja'),
      (ini?.profesi ?? []).map(([peran, teks]) => el('div', {}, el('b', {}, peran + ': '), teks)),
      el('div', { class: 'muted' }, el('b', {}, 'Berikutnya: '), lanjut ? `Lab Maya ${lanjut.no} · ${lanjut.judul} (${lanjut.kategori}).` : 'Kamu sudah sampai di lab terakhir. Keren! 🎉')));
    if (adaTiket && n === 4) { Lab.sfx('fanfare'); Lab.narasi('Kerja bagus! Keempat tiket hari ini beres.'); }
  }
  $('#btnCetak').onclick = () => window.print();
  $('#btnUlangi').onclick = async () => {
    if (!(await Lab.tanya('Yakin mau ulang dari awal? Semua progres, jawaban, dan lencana bakal kehapus.'))) return;
    const { suara, siswa } = Lab.st; Lab.st = awal(); Object.assign(Lab.st, { suara, siswa }); Lab.simpan(); Lab.ke('muka');
  };

  // ---------------------------------------------------------------- mulai
  ikon(document.body);
  aturSuara();
  skala();
  /** Teks Laman Muka, judul, dan Briefing menyesuaikan aplikasi aktif (lab lengkap memakai teks bawaan di index.html). */
  function terapkanAplikasi() {
    if (!APP || iApp < 0) return;
    document.title = `Ngulik Data · Lab Maya SQL ${APP.no} – ${APP.judul}`;
    $('#layar-muka .muka-kiri > .label').textContent = `Lab Maya ${APP.no} · ${APP.kategori}`;
    $('#layar-muka h1 em').textContent = APP.judul;
    $('#layar-muka .lead').innerHTML = APP.lead;
    $('#infoMateri').textContent = APP.kategori;
    if (APP.monitor) $('.toko-monitor code').innerHTML = Lab.sorot(APP.monitor).replace(/\n/g, '<br>').replace(/ {2}/g, '&nbsp;&nbsp;');
    if (adaTiket) return;
    const k = KATEGORI[iApp], ids = Lab.soalKategori(iApp);
    $('#gelembungBriefing p:last-child').innerHTML = `Hari ini fokusmu <b>${APP.kategori}</b>. Ada <b>${ids.length} latihan</b> yang menunggu. Kerjakan satu per satu, ya!`;
    $('#layar-briefing .tiket-mini b').textContent = `${ids.length} latihan ${APP.kategori}`;
    $('#layar-briefing .tiket-mini small').textContent = k.studi ? 'Materi + soal gabungan · Dasar · Menengah · Lanjut' : k.perintah.filter(x => x[2]).map(x => x[0]).join(' · ');
  }
  Lab.mulai = async () => {
    const splash = $('#memuat'), t0 = performance.now();
    if (APP) $('#splashLab').textContent = `Lab Maya ${APP.no} · ${APP.kategori}`;
    try {
      await Lab.siapkanDb();
      terapkanAplikasi();
      $('#menuBebas').hidden = !adaBebas;
      $('#menuBebas').disabled = !bebasTerbuka();
      Lab.ke('muka');   // lab sudah siap di belakang splash
      // splash tampil minimal ±2 detik supaya sempat terbaca, lalu memudar; klik untuk melewati
      splash.classList.add('siap'); $('#splashStatus').textContent = 'Siap! Yuk mulai ngulik 🚀';
      let tutup = () => {
        tutup = () => {}; splash.classList.add('pergi'); setTimeout(() => { splash.hidden = true; }, 450);
        const l = $('.layar.aktif'); if (l) { l.classList.remove('aktif'); void l.offsetWidth; l.classList.add('aktif'); }   // animasi masuk diputar saat splash memudar
      };
      if (window.__tanpaSplash) splash.hidden = true;   // dipakai alat uji
      else { splash.onclick = () => { tutup(); if (Lab.layar === 'muka') tampilMuka(); }; setTimeout(() => tutup(), Math.max(700, 2200 - (performance.now() - t0))); }   // klik splash = suara diizinkan → sambutan lengkap
    } catch (e) {
      splash.classList.remove('splash');
      $('#memuat').innerHTML = `<div><p><b>Database gagal disiapkan.</b><br>${Lab.esc(e.message)}</p><p>Coba muat ulang halaman, atau gunakan browser terbaru (Chrome, Edge, Firefox).</p></div>`;
    }
  };
})();
