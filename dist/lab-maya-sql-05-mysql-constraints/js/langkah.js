/* Lab Maya SQL · Phi Minimart — Lab Maya 1 · Querying Data: isi 4 percobaan (Mengambil data, Mengurutkan, Menyaring, Menyaring lanjut). */
(() => {
  'use strict';
  const { el } = Lab;
  const $$ = (s, r) => [...r.querySelectorAll(s)];

  // ---------------------------------------------------------------- kontrol rakit (dipakai semua langkah)
  const pilihan = (opsi, nilai, on, label) => {
    const s = el('select', { 'aria-label': label || 'pilihan', onchange: e => on(e.target.value) });
    for (const [v, t] of opsi) s.append(el('option', { value: v, selected: String(v) === String(nilai) }, t));
    return s;
  };
  const sakelar = (opsi, nilai, on, label) => el('span', { class: 'sakelar', role: 'group', 'aria-label': label || 'sakelar' },
    opsi.map(([v, t]) => el('button', { type: 'button', class: v === nilai ? 'on' : '', 'aria-pressed': v === nilai, onclick: () => on(v) }, t)));
  const slider = (min, max, nilai, on, label, fmt = v => v) => {
    const out = el('output', {}, fmt(nilai));
    const inp = el('input', { type: 'range', min, max, value: nilai, 'aria-label': label, oninput: e => { out.textContent = fmt(+e.target.value); on(+e.target.value); } });
    return el('span', { class: 'slider' }, inp, out);
  };
  const cek = (teks, nilai, on) => { const i = el('input', { type: 'checkbox', checked: nilai, onchange: e => on(e.target.checked) }); return el('label', { class: 'cek' }, i, teks); };
  const blok = (jenis, kw, ...isi) => el('div', { class: 'blok ' + jenis }, el('span', { class: 'kw' }, kw), ...isi);
  const angkaBesar = (html) => el('div', { class: 'angka-besar', html });
  const q = Lab.q;
  const tunda = ms => new Promise(r => setTimeout(r, ms));

  // ================================================================ LANGKAH 1 · MENGAMBIL DATA (SELECT FROM, alias)
  const kolomDari = nama => Lab.tabel.find(t => t.nama === nama)?.kolom || [];
  const aliasSah = a => /^[A-Za-z_][A-Za-z0-9_]*$/.test(a);
  const daftarKolom1 = st => st.semua ? '*' : st.kolom.map(k => st.alias[k] && aliasSah(st.alias[k]) ? `${k} AS ${st.alias[k]}` : k).join(', ');
  const sql1 = st => `SELECT ${st.semua || st.kolom.length ? daftarKolom1(st) : '…'}\nFROM ${st.tabel || '…'};`;
  const validasi1 = st => !st.tabel ? 'Pilih tabel dulu di slot FROM (atau klik tabel di rak).'
    : !st.semua && !st.kolom.length ? 'Centang minimal satu kolom, atau pilih * untuk semua kolom.'
    : !st.semua && st.kolom.some(k => st.alias[k] && !aliasSah(st.alias[k])) ? 'Alias hanya boleh berisi huruf, angka, dan garis bawah, tanpa spasi (contoh: nama_produk AS produk).' : null;
  // Kontrol kolom: centang kolom (urut sesuai tabel) + isian alias untuk kolom yang dicentang.
  function kontrolKolom(st, ubah, render, { alias = true } = {}) {
    const semua = kolomDari(st.tabel);
    return [
      sakelar([['semua', '* semua kolom'], ['pilih', 'pilih kolom']], st.semua ? 'semua' : 'pilih', v => { st.semua = v === 'semua'; render(); }, 'Mode kolom'),
      st.semua ? null : el('div', { class: 'kolom-pilih' }, semua.map(k => {
        const on = st.kolom.includes(k);
        return el('span', { class: 'kolom-item' + (on ? ' on' : '') },
          cek(k, on, v => { st.kolom = v ? semua.filter(x => x === k || st.kolom.includes(x)) : st.kolom.filter(x => x !== k); render(); }),
          on && alias ? el('span', { class: 'mono kecil' }, 'AS') : null,
          on && alias ? el('input', { type: 'text', class: 'alias', value: st.alias[k] || '', placeholder: '(alias)', 'aria-label': 'Alias ' + k, maxlength: 20,
            onchange: e => { st.alias[k] = e.target.value.trim(); render(); } }) : null);
      })),
    ];
  }
  // Tabel utuh: kolom yang tidak diambil memudar, judul kolom yang diberi alias berganti nama.
  function tabelAmbil(wadah, st, { maks = 19 } = {}) {
    const isi = q(`SELECT * FROM ${st.tabel}`), diambil = k => st.semua || st.kolom.includes(k);
    const t = el('table', { class: 'tabel-ambil' });
    t.append(el('thead', {}, el('tr', {}, isi.kolom.map(k => el('th', { class: diambil(k) ? 'ambil' : 'pudar' },
      !st.semua && st.alias[k] && aliasSah(st.alias[k]) ? el('span', {}, el('s', {}, k), ' → ', el('b', {}, st.alias[k])) : k)))));
    const tb = el('tbody');
    isi.baris.slice(0, maks).forEach((r, i) => tb.append(el('tr', { style: { animationDelay: i * 25 + 'ms' } },
      r.map((v, j) => el('td', { class: diambil(isi.kolom[j]) ? 'ambil' : 'pudar' }, v == null ? 'NULL' : v)))));
    t.append(tb);
    wadah.append(el('div', { class: 'wadah-ambil' }, t));
    return { kolom: isi.kolom.filter(diambil).length, dari: isi.kolom.length, baris: isi.baris.length };
  }
  const PRODUK_KASIR = () => q("SELECT nama_produk, harga FROM daftar_harga WHERE nama_cabang = 'Phi Minimart Kebayoran' AND tgl_berlaku = '2026-01-01' ORDER BY nama_produk").baris;

  Lab.langkah.push({
    no: 1, judul: 'Mengambil data', konsep: 'SELECT · FROM · AS', warna: 'var(--b-select)',
    ringkas: 'Ambil kolom yang dibutuhkan saja dari tabel produk dan beri judul kolom yang mudah dibaca.',
    tabelTiket: 'ms_produk', tabelSorot: 'ms_produk',
    tiket: { dari: 'Kak Tari', panggilan: 'Kak Tari', jabatan: 'Tim Katalog Online Phi Minimart', inisial: 'KT', warnaAvatar: '#d6e4ff',
      teks: 'Kami sedang menyiapkan <b>katalog online</b>. Tolong kirimkan daftar produk yang berisi <b>nama produk</b> dan <b>satuannya</b> saja. Supaya mudah dibaca pelanggan, beri judul kolom <b>produk</b> dan <b>satuan</b>.',
      ringkas: 'kolom nama_produk dan kode_satuan dari ms_produk, dengan judul kolom (alias) produk dan satuan.',
      narasi: 'Tiket dari Kak Tari, tim katalog online. Kirimkan nama produk dan satuannya saja, dengan judul kolom produk dan satuan.' },
    duniaKerja: 'Hampir setiap laporan dan fitur aplikasi dimulai dari SELECT. Mengambil kolom yang dibutuhkan saja membuat data lebih ringan, dan alias membuat judul kolom mudah dipahami orang non-teknis.',
    petunjuk: ['Data produk tersimpan di tabel ms_produk.', 'Pilih ms_produk di slot FROM, pilih mode "pilih kolom", lalu centang nama_produk dan kode_satuan. Tulis alias di kotak AS.', 'Kolom pudar tidak ikut diambil. Judul kolom berganti sesuai alias.', 'Bandingkan jumlah sel SELECT * dengan kolom pilihan, lalu coba kalkulator kasir: SELECT bisa menghitung tanpa tabel.', 'Alias ditulis setelah nama kolom: nama_kolom AS alias.'],
    stateAwal: () => ({ tabel: '', semua: true, kolom: [], alias: {} }),
    tabelDipilih: st => st.tabel,
    pilihTabel: (st, nama) => { if (st.tabel !== nama) { st.tabel = nama; st.kolom = []; st.alias = {}; } },
    validasi: validasi1,
    sql: sql1,
    hitung: st => q(`SELECT COUNT(*) FROM ${st.tabel}`).baris[0][0],
    labelHitung: 'baris akan tampil',
    rakit(meja, st, ubah) {
      const render = () => {
        meja.innerHTML = '';
        meja.append(
          blok('select', 'SELECT', kontrolKolom(st, ubah, render)),
          blok('select', 'FROM', pilihan([['', '(pilih tabel)'], ...Lab.tabel.filter(t => !t.bantu).map(t => [t.nama, t.nama])], st.tabel,
            v => { if (st.tabel !== v) { st.tabel = v; st.kolom = []; st.alias = {}; } render(); }, 'Tabel FROM'),
            el('span', { class: 'slot' + (st.tabel ? ' isi' : '') }, st.tabel || 'slot tabel kosong')),
          el('p', { class: 'muted kecil' }, st.tabel ? 'Kotak AS muncul di samping kolom yang dicentang. Kosongkan bila tidak perlu alias.' : 'Pilih tabel dulu, lalu daftar kolomnya muncul di blok SELECT.'));
        ubah();
      };
      render();
    },
    visual(vis, st) {
      vis.innerHTML = '';
      const r = tabelAmbil(vis, st);
      vis.prepend(angkaBesar(`<b>${r.kolom}</b> dari ${r.dari} kolom diambil · ${r.baris} baris`));
      Lab.sfx('swoosh'); setTimeout(() => Lab.sfx('ting'), 700);
    },
    cekTiket(st, hasil) {
      if (st.tabel !== 'ms_produk') return { ok: false, pesan: 'Data produk ada di tabel ms_produk.' };
      if (st.semua) return { ok: false, pesan: `SELECT * mengirim ${hasil.kolom.length} kolom. Kak Tari hanya butuh nama produk dan satuannya.` };
      if (st.kolom.join() !== 'nama_produk,kode_satuan') return { ok: false, pesan: `Kolommu: ${st.kolom.join(', ')}. Yang diminta hanya nama_produk dan kode_satuan.` };
      if (hasil.kolom.join() !== 'produk,satuan') return { ok: false, pesan: `Judul kolommu: ${hasil.kolom.join(', ')}. Beri alias: nama_produk AS produk, kode_satuan AS satuan.` };
      return { ok: true, pesan: `${hasil.baris.length} produk dengan kolom produk dan satuan sudah dikirim ke Kak Tari.`, narasi: 'Katalog online siap diisi. Terima kasih!' };
    },
    banding: {
      judulA: 'SELECT * (semua kolom)', judulB: 'SELECT kolom pilihan + alias',
      pengantar: 'data yang sama, dua cara mengambil. Bandingkan jumlah <b>sel</b> (kolom × baris) yang dikirim. Lalu coba <b>Kalkulator kasir</b> di kanan: SELECT juga bisa menghitung tanpa tabel.',
      narasi: 'Mana yang lebih ringan dan mudah dibaca, semua kolom atau kolom pilihan?',
      a: () => ({ tabel: 'ms_produk', semua: true, kolom: [], alias: {} }),
      b: () => ({ tabel: 'ms_produk', semua: false, kolom: ['nama_produk', 'kode_satuan'], alias: { nama_produk: 'produk', kode_satuan: 'satuan' } }),
      atur(w, st, ubah) {
        const r = () => { w.innerHTML = ''; w.append(blok('select', 'SELECT', kontrolKolom(st, ubah, () => { r(); ubah(); }, { alias: false }))); };
        r();
      },
      mini(w, st, hasil) {
        w.innerHTML = '';
        const sel = hasil.kolom.length * hasil.baris.length;
        const t = el('div', { class: 'hasil', style: { border: 'none', background: 'transparent' } });
        Lab.tabelHasil(t, hasil, { maks: 2 });
        w.append(el('div', { style: { padding: '10px 12px 0', fontSize: '13px' }, html: `<b style="font-size:22px">${sel}</b> sel = ${hasil.kolom.length} kolom × ${hasil.baris.length} baris` }), t);
      },
      simulasi() {
        const produk = PRODUK_KASIR();
        const st = { i: Math.max(0, produk.findIndex(r => r[0] === 'Keripik Kentang 68 g')), diskon: 15 };
        const hasil = el('div');
        const segar = () => {
          const harga = produk[st.i][1], sql = `SELECT ${harga} * (100 - ${st.diskon}) / 100 AS harga_diskon;`;
          hasil.innerHTML = ''; hasil.append(Lab.kotakSql(sql), el('div', { class: 'angka-sim', html: `harga_diskon = <b>${Lab.rp(Lab.satu(sql.replace(/;$/, '')))}</b>` }));
        };
        const w = el('div', { class: 'simulasi' }, el('b', {}, 'Simulasi spesifik · Kalkulator kasir'),
          el('span', {}, 'Kasir Phi Minimart Kebayoran menghitung harga promo. SELECT tanpa FROM langsung menghitung angka.'),
          pilihan(produk.map(([n, h], i) => [i, `${n} · ${Lab.rp(h)}`]), st.i, v => { st.i = +v; Lab.sfx('pas'); segar(); }, 'Produk'),
          el('span', {}, 'Diskon (%)'), slider(0, 50, st.diskon, v => { st.diskon = v; segar(); }, 'Diskon persen'), hasil);
        segar();
        return w;
      },
    },
    soal: {
      penerapan: { teks: 'Bu Sari meminta daftar karyawan untuk papan nama. Ketik query yang menampilkan <code>kode_karyawan</code> dengan judul kolom <b>kode</b> dan <code>nama_depan</code> dengan judul kolom <b>nama</b> dari tabel <code>ms_karyawan</code>.',
        kunci: 'SELECT kode_karyawan AS kode, nama_depan AS nama FROM ms_karyawan', urut: false, namaKolom: true },
      reflektif: { teks: 'Mengapa laporan sebaiknya tidak selalu memakai SELECT *?',
        opsi: ['SELECT * mengambil semua kolom, termasuk yang tidak dibutuhkan, sehingga data lebih besar dan sulit dibaca.', 'SELECT * hanya mengambil baris pertama tabel.', 'SELECT * otomatis mengurutkan data.', 'SELECT * tidak bisa dipakai di SQLite.'],
        benar: 0, alasan: 'Tepat. Ambil kolom yang dibutuhkan saja: data lebih ringan dikirim, dan dengan alias judul kolomnya langsung mudah dipahami.' },
    },
    lencana: { nama: 'Pengambil Data', huruf: 'S' }, ucapan: 'Kak Tari sudah menerima daftar produk untuk katalog online.',
  });

  // ================================================================ LANGKAH 2 · MENGURUTKAN (ORDER BY, LIMIT)
  const CAB2 = ['Kebayoran', 'Tebet', 'Tajur', 'Margonda', 'Dago', 'Cikokol'].map(c => ['Phi Minimart ' + c, 'Phi Minimart ' + c]);
  const where2 = st => `\nWHERE nama_cabang = '${st.cabang}'\n  AND tgl_berlaku = '${st.tanggal}'`;
  const order2 = st => st.urut ? `\nORDER BY ${st.urut} ${st.arah}${st.kedua && st.urut !== 'nama_produk' ? ', nama_produk ASC' : ''}` : '';
  const sql2 = (st, limit = true) => `SELECT nama_produk, harga\nFROM daftar_harga${where2(st)}${order2(st)}${limit && st.pakaiLimit ? `\nLIMIT ${st.limit}` : ''};`;
  const acakSeri = rows => { // urutan seri tidak dijamin SQL: tukar acak di dalam kelompok harga sama (untuk simulasi)
    const out = []; let i = 0;
    while (i < rows.length) { let j = i; while (j + 1 < rows.length && rows[j + 1][1] === rows[i][1]) j++; const g = rows.slice(i, j + 1); g.sort(() => Math.random() - .5); out.push(...g); i = j + 1; }
    return out;
  };
  function batang(wadah, st, { acak = false, kecil = false } = {}) {
    let semua = q(sql2(st, false).replace(/;$/, '')).baris;
    if (acak && st.urut === 'harga' && !st.kedua) semua = acakSeri(semua);
    const awal = q(`SELECT nama_produk, harga FROM daftar_harga${where2(st)}`).baris.map(r => r[0]);
    const n = semua.length, lebar = wadah.clientWidth - (kecil ? 20 : 40), langkahX = Math.min(kecil ? 44 : 62, lebar / Math.max(n, 1));
    const area = el('div', { class: 'batang-area', style: kecil ? { inset: '30px 8px 30px' } : null });
    wadah.append(area);
    const maks = Math.max(...semua.map(r => r[1]), 1), tinggi = (area.clientHeight || (kecil ? 120 : 360)) - 26;
    const batas = st.pakaiLimit ? st.limit : n;
    const els = new Map();
    for (const [nama, harga] of semua) {
      const seri = st.urut === 'harga' && semua.filter(r => r[1] === harga).length > 1;
      const b = el('div', { class: 'batang' + (seri ? ' seri' : ''), style: { width: (langkahX - 8) + 'px', left: (awal.indexOf(nama) * langkahX) + 'px' }, title: `${nama} · ${Lab.rp(harga)}` },
        el('span', { class: 'hrg' }, (harga / 1000).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + (kecil ? 'k' : ' rb')), el('span', { class: 'tiang', style: { height: Math.max(6, Math.sqrt(harga / maks) * tinggi) + 'px' } }),
        kecil ? null : el('span', { class: 'nama' }, nama));
      area.append(b); els.set(nama, b);
    }
    const garis = el('div', { class: 'garis-limit', hidden: !st.pakaiLimit, style: { left: (batas * langkahX - 5) + 'px' } }, el('span', {}, `LIMIT ${st.limit}`));
    area.append(garis);
    const urutkan = () => semua.forEach(([nama], i) => { const b = els.get(nama); b.style.left = (i * langkahX) + 'px'; b.classList.toggle('redup', i >= batas); });
    if (kecil) urutkan(); else setTimeout(() => { urutkan(); Lab.sfx('swoosh'); setTimeout(() => { garis.hidden = !st.pakaiLimit; if (st.pakaiLimit) Lab.sfx('ting'); }, 700); }, 350);
    return semua.slice(0, batas);
  }

  Lab.langkah.push({
    no: 2, judul: 'Mengurutkan', konsep: 'ORDER BY · LIMIT', warna: 'var(--b-order)',
    ringkas: 'Susun daftar 5 produk termurah untuk spanduk promosi, lalu atasi produk yang harganya sama.',
    tabelTiket: 'daftar_harga (tabel bantu)', tabelSorot: 'daftar_harga',
    tiket: { dari: 'Mbak Dewi', panggilan: 'Mbak Dewi', jabatan: 'Tim Promosi Phi Minimart', inisial: 'MD', warnaAvatar: '#ffd9b8',
      teks: 'Kami mau memasang spanduk <b>"Harga Hemat"</b> di Phi Minimart Tajur. Tolong buat daftar <b>5 produk termurah</b> yang berlaku <b>1 Januari 2026</b>, dari yang paling murah.',
      ringkas: '5 produk termurah di Phi Minimart Tajur, harga berlaku 1 Januari 2026, urut dari yang termurah.',
      narasi: 'Tiket dari Mbak Dewi, tim promosi. Buat daftar lima produk termurah di cabang Tajur untuk spanduk harga hemat.' },
    duniaKerja: 'Tim promosi dan pemasaran membutuhkan daftar produk terurut (termurah, terlaris, termahal) untuk spanduk, katalog, dan laporan. Urutan yang salah bisa membuat promosi salah sasaran.',
    petunjuk: ['Tabel bantu daftar_harga sudah berisi nama produk, cabang, tanggal, dan harga.', 'Pilih ORDER BY harga dengan arah ASC (kecil ke besar), lalu aktifkan LIMIT 5.', 'Perhatikan garis merah LIMIT: hanya batang di kirinya yang masuk hasil.', 'Dua produk seharga Rp3.500. Jalankan skenario A beberapa kali, lalu bandingkan dengan B yang punya urutan kedua.', 'Termahal berarti DESC (besar ke kecil).'],
    stateAwal: () => ({ cabang: 'Phi Minimart Tajur', tanggal: '2026-01-01', urut: '', arah: 'ASC', kedua: false, pakaiLimit: false, limit: 5 }),
    sql: sql2,
    hitung: st => q(sql2(st).replace(/;$/, '')).baris.length,
    labelHitung: 'produk akan tampil',
    rakit(meja, st, ubah) {
      const render = () => {
        meja.innerHTML = '';
        meja.append(blok('select', 'FROM', el('span', { class: 'slot isi' }, 'daftar_harga'), el('span', { class: 'muted kecil' }, 'tabel bantu: nama_produk, nama_cabang, tgl_berlaku, harga')),
          blok('where', 'WHERE', el('span', { class: 'mono' }, 'nama_cabang ='), pilihan(CAB2, st.cabang, v => { st.cabang = v; ubah(); }, 'Cabang'),
            el('span', { class: 'mono' }, 'AND tgl_berlaku ='), pilihan([['2026-01-01', "'2026-01-01'"], ['2026-02-01', "'2026-02-01'"]], st.tanggal, v => { st.tanggal = v; ubah(); }, 'Tanggal')),
          blok('order', 'ORDER BY', pilihan([['', '(tanpa urutan)'], ['harga', 'harga'], ['nama_produk', 'nama_produk']], st.urut, v => { st.urut = v; render(); }, 'Kolom urut'),
            sakelar([['ASC', 'ASC ↑ kecil→besar'], ['DESC', 'DESC ↓ besar→kecil']], st.arah, v => { st.arah = v; render(); }, 'Arah urutan'),
            st.urut === 'harga' ? cek('+ urutan kedua: nama_produk', st.kedua, v => { st.kedua = v; ubah(); }) : null),
          blok('order', 'LIMIT', cek('pakai LIMIT', st.pakaiLimit, v => { st.pakaiLimit = v; render(); }), st.pakaiLimit ? slider(1, 10, st.limit, v => { st.limit = v; ubah(); }, 'Jumlah LIMIT') : null),
          st.urut === 'harga' && st.arah === 'DESC' ? el('div', { class: 'pesan warn' }, 'Catatan: "termurah" berarti harga dari kecil ke besar (ASC).') : '');
        ubah();
      };
      render();
    },
    visual(vis, st, hasil) {
      vis.innerHTML = '';
      vis.append(angkaBesar(`<b>${hasil.baris.length}</b> produk ${st.pakaiLimit ? 'di kiri garis LIMIT' : 'tampil'}`), el('div', { class: 'muted kecil', style: { position: 'absolute', right: '16px', top: '20px' } }, 'Tinggi batang = harga (ribu rupiah) · kuning = harga seri · arahkan kursor ke batang untuk nama produk'));
      requestAnimationFrame(() => batang(vis, st));
    },
    sorotBaris: null,
    cekTiket(st, hasil) {
      const kunci = q("SELECT nama_produk, harga FROM daftar_harga WHERE nama_cabang = 'Phi Minimart Tajur' AND tgl_berlaku = '2026-01-01' ORDER BY harga ASC, nama_produk ASC LIMIT 5");
      if (st.cabang !== 'Phi Minimart Tajur' || st.tanggal !== '2026-01-01') return { ok: false, pesan: 'Mbak Dewi meminta harga Phi Minimart Tajur yang berlaku 1 Januari 2026.' };
      if (st.urut !== 'harga') return { ok: false, pesan: 'Daftar harus diurutkan berdasarkan harga.' };
      if (st.arah !== 'ASC') return { ok: false, pesan: 'Termurah dulu berarti ASC (dari kecil ke besar).' };
      if (!st.pakaiLimit || st.limit !== 5) return { ok: false, pesan: `Hasilmu ${hasil.baris.length} produk. Spanduk hanya memuat 5 produk: pakai LIMIT 5.` };
      const sama = Lab.nilai(hasil, kunci, false).ok;
      if (!sama) return { ok: false, pesan: 'Isinya belum sesuai. Periksa kembali rakitanmu.' };
      return { ok: true, pesan: st.kedua ? 'Daftar 5 produk termurah sudah urut pasti, termasuk dua produk seharga Rp3.500.' : 'Daftar 5 produk termurah terkirim. Tips: tambahkan urutan kedua nama_produk supaya dua produk seharga Rp3.500 selalu tampil dengan urutan yang sama.', narasi: 'Spanduk siap dicetak!' };
    },
    banding: {
      judulA: 'ORDER BY harga saja', judulB: 'ORDER BY harga, nama_produk',
      pengantar: 'dua produk seharga <b>Rp3.500</b> (kuning). Tekan <b>Jalankan lagi</b> di A beberapa kali: SQL tidak menjamin urutan produk yang seri, jadi lab menukarnya. Bandingkan dengan B. Coba juga ganti ASC/DESC.',
      narasi: 'Dua produk harganya sama. Mana yang tampil duluan di spanduk?',
      a: () => ({ cabang: 'Phi Minimart Tajur', tanggal: '2026-01-01', urut: 'harga', arah: 'ASC', kedua: false, pakaiLimit: true, limit: 5 }),
      b: () => ({ cabang: 'Phi Minimart Tajur', tanggal: '2026-01-01', urut: 'harga', arah: 'ASC', kedua: true, pakaiLimit: true, limit: 5 }),
      atur(w, st, ubah) {
        const r = () => { w.innerHTML = ''; w.append(blok('order', 'ORDER BY', el('span', { class: 'mono' }, 'harga'), sakelar([['ASC', 'ASC'], ['DESC', 'DESC']], st.arah, v => { st.arah = v; r(); ubah(); }, 'Arah'),
          el('span', { class: 'mono' }, 'LIMIT'), slider(1, 10, st.limit, v => { st.limit = v; ubah(); }, 'LIMIT'))); };
        r();
      },
      // Daftar berperingkat: produk seri disorot kuning; di A urutan seri ditukar acak tiap "Jalankan lagi" (simulasi).
      mini(w, st, hasil, sisi) {
        w.innerHTML = '';
        const daftar = el('ol', { class: 'peringkat-mini' });
        let ke = 0;
        const ulang = () => {
          let rows = q(sql2(st).replace(/;$/, '')).baris;
          if (sisi === 'a' && !st.kedua) rows = acakSeri(q(sql2(st, false).replace(/;$/, '')).baris).slice(0, st.limit);
          daftar.innerHTML = ''; ke++;
          rows.forEach(([n, h], i) => daftar.append(el('li', { class: rows.filter(r => r[1] === h).length > 1 ? 'seri' : '', style: { animationDelay: i * 40 + 'ms' } },
            el('b', {}, i + 1), el('span', {}, n), el('span', { class: 'mono' }, Lab.rp(h)))));
        };
        w.append(el('div', { class: 'baris', style: { padding: '8px 10px 0' } }, el('span', { class: 'muted kecil' }, sisi === 'a' ? 'Urutan seri tidak dijamin → bisa bertukar' : 'Urutan kedua membuat hasil selalu sama'),
          el('span', { class: 'spasi' }), el('button', { class: 'btn kecil', onclick: () => { Lab.sfx('klik'); ulang(); } }, el('i', { 'data-ikon': 'main' }), 'Jalankan lagi')), daftar);
        ulang();
      },
    },
    soal: {
      penerapan: { teks: 'Tim promosi Phi Minimart <b>Dago</b> meminta <b>3 produk termahal</b> yang berlaku <b>1 Januari 2026</b>. Ketik query yang menampilkan kolom <code>nama_produk</code> dan <code>harga</code> dari tabel <code>daftar_harga</code>, urut dari yang termahal.',
        kunci: "SELECT nama_produk, harga FROM daftar_harga WHERE nama_cabang = 'Phi Minimart Dago' AND tgl_berlaku = '2026-01-01' ORDER BY harga DESC LIMIT 3", urut: true },
      reflektif: { teks: 'Apa risikonya memakai LIMIT tanpa ORDER BY untuk membuat laporan "5 produk termurah"?',
        opsi: ['Baris yang terambil hanya 5 baris pertama yang kebetulan tersimpan, belum tentu yang termurah.', 'Query akan selalu gagal dijalankan.', 'LIMIT tanpa ORDER BY otomatis mengurutkan dari yang termurah.', 'Kolom harga akan hilang dari hasil.'],
        benar: 0, alasan: 'Tepat. Tanpa ORDER BY, urutan baris tidak dijamin, jadi LIMIT bisa memotong produk yang salah. Urutkan dulu, baru batasi.' },
    },
    lencana: { nama: 'Penyusun Laporan', huruf: 'O' }, ucapan: 'Spanduk Harga Hemat siap dicetak. Terima kasih dari Mbak Dewi!',
  });

  // ================================================================ LANGKAH 3 · MENYARING (WHERE)
  const CABANG = [['', '(semua cabang)'], ['CABANG-001', "'CABANG-001' Kebayoran"], ['CABANG-002', "'CABANG-002' Tebet"], ['CABANG-003', "'CABANG-003' Tajur"],
    ['CABANG-004', "'CABANG-004' Margonda"], ['CABANG-005', "'CABANG-005' Dago"], ['CABANG-006', "'CABANG-006' Cikokol"]];
  const KOLOM_TRX = ['tgl_transaksi', 'kode_cabang', 'kode_kasir', 'kode_produk', 'jumlah_pembelian'];
  const where1 = st => {
    const c = [];
    if (st.min > 1) c.push(`jumlah_pembelian >= ${st.min}`);
    if (st.cabang) c.push(`kode_cabang = '${st.cabang}'`);
    return c.length ? '\nWHERE ' + c.join(`\n  ${st.op} `) : '';
  };
  const rowid1 = st => new Set(q(`SELECT rowid FROM tr_penjualan${where1(st)}`).baris.map(r => r[0]));
  let semuaTrx = null;
  const trx = () => (semuaTrx ??= q('SELECT rowid, tgl_transaksi, kode_cabang, kode_kasir, kode_produk, jumlah_pembelian FROM tr_penjualan ORDER BY rowid').baris);

  function gridTrx(wadah, lolos, { kecil = false, animasi = true } = {}) {
    const g = el('div', { class: 'grid-trx', style: kecil ? { inset: '34px 10px 10px', gridTemplateColumns: 'repeat(30, 1fr)', gap: '3px' } : null });
    const tip = el('div', { class: 'tooltip', hidden: true });
    for (const [id, tgl, cab, kas, prod, jml] of trx()) {
      const b = el('button', { class: 'trx', 'aria-label': `Transaksi ${tgl}`, 'data-id': id });
      if (!kecil) {
        b.onmouseenter = b.onfocus = () => { const r = b.getBoundingClientRect(), w = wadah.getBoundingClientRect(), s = r.width / b.offsetWidth;
          tip.innerHTML = `<b>${tgl}</b><br>${cab} · kasir ${kas}<br>${prod} · <b>${jml} barang</b>`; tip.hidden = false;
          tip.style.left = Math.min((r.left - w.left) / s + 20, wadah.clientWidth - 230) + 'px'; tip.style.top = ((r.top - w.top) / s - 70) + 'px'; };
        b.onmouseleave = b.onblur = () => { tip.hidden = true; };
      }
      g.append(b);
    }
    wadah.append(g, tip);
    const terapkan = () => [...g.children].forEach((b, i) => {
      const ok = lolos.has(+b.dataset.id);
      if (animasi) setTimeout(() => b.classList.add(ok ? 'lolos' : 'gugur'), 6 * i); else b.classList.add(ok ? 'lolos' : 'gugur');
    });
    animasi ? setTimeout(terapkan, 250) : terapkan();
  }

  Lab.langkah.push({
    no: 3, judul: 'Menyaring', konsep: 'WHERE', warna: 'var(--b-where)',
    ringkas: 'Cari transaksi pembelian besar di satu cabang dengan WHERE, AND, dan OR.',
    tabelTiket: 'tr_penjualan', tabelSorot: 'tr_penjualan',
    tiket: { dari: 'Pak Joko', panggilan: 'Pak Joko', jabatan: 'Kepala Cabang Phi Minimart Tajur', inisial: 'PJ', warnaAvatar: '#c7e3ff',
      teks: 'Kami mau menawarkan <b>kartu member grosir</b>. Tolong carikan transaksi di <b>cabang Tajur</b> (CABANG-003) yang membeli <b>minimal 4 barang</b> sekaligus.',
      ringkas: 'transaksi cabang Tajur (CABANG-003) dengan jumlah_pembelian minimal 4.',
      narasi: 'Tiket dari Pak Joko, kepala cabang Tajur. Carikan transaksi di cabang Tajur yang membeli minimal empat barang sekaligus.' },
    duniaKerja: 'Admin data dan analis di ritel sering menyaring data transaksi untuk program promosi atau member. Kemampuan menulis syarat yang tepat menentukan siapa yang mendapat penawaran.',
    petunjuk: ['Data transaksi tersimpan di tabel tr_penjualan.', 'Pilih tr_penjualan di slot FROM, pilih cabang CABANG-003, lalu geser slider jumlah_pembelian ke 4.', 'Perhatikan kartu hijau: itulah transaksi yang lolos saringan.', 'Ganti AND menjadi OR di skenario B. Mengapa jumlahnya melonjak?', 'Untuk "Tajur atau Margonda" dengan minimal 4 barang, kelompokkan kondisi cabang dengan tanda kurung.'],
    stateAwal: () => ({ tabel: '', kolom: [...KOLOM_TRX], cabang: '', min: 1, op: 'AND' }),
    tabelDipilih: st => st.tabel,
    pilihTabel: (st, nama) => { st.tabel = nama; },
    validasi: st => !st.tabel ? 'Pilih tabel dulu di slot FROM (atau klik tabel di rak).'
      : st.tabel !== 'tr_penjualan' ? `Kolom jumlah_pembelian tidak ada di tabel ${st.tabel}. Data transaksi ada di tabel tr_penjualan.`
      : !st.kolom.length ? 'Centang minimal satu kolom di SELECT.' : null,
    sql: st => `SELECT ${st.kolom.length ? st.kolom.join(', ') : '…'}\nFROM ${st.tabel || '…'}${st.tabel === 'tr_penjualan' ? where1(st) : ''};`,
    hitung: st => q(`SELECT COUNT(*) FROM tr_penjualan${where1(st)}`).baris[0][0],
    labelHitung: 'dari 180 transaksi akan lolos saringan',
    rakit(meja, st, ubah) {
      const render = (salah) => {
        meja.innerHTML = '';
        const bFrom = blok('select', 'FROM', pilihan([['', '(pilih tabel)'], ...Lab.tabel.filter(t => !t.bantu).map(t => [t.nama, t.nama])], st.tabel, v => { st.tabel = v; render(v && v !== 'tr_penjualan'); }, 'Tabel FROM'),
          el('span', { class: 'slot' + (st.tabel ? ' isi' : '') }, st.tabel || 'slot tabel kosong'));
        meja.append(
          blok('select', 'SELECT', KOLOM_TRX.map(k => cek(k, st.kolom.includes(k), on => { st.kolom = on ? KOLOM_TRX.filter(x => x === k || st.kolom.includes(x)) : st.kolom.filter(x => x !== k); ubah(); }))),
          bFrom,
          blok('where', 'WHERE', el('span', { class: 'mono' }, 'jumlah_pembelian >='), slider(1, 5, st.min, v => { st.min = v; ubah(); }, 'Minimal jumlah pembelian')),
          blok('where', st.op, el('span', { class: 'mono' }, 'kode_cabang ='), pilihan(CABANG, st.cabang, v => { st.cabang = v; render(); }, 'Cabang'),
            el('span', { class: 'muted kecil' }, 'operator:'), sakelar([['AND', 'AND'], ['OR', 'OR']], st.op, v => { st.op = v; render(); }, 'Operator')),
          el('p', { class: 'muted kecil' }, 'Slider = 1 berarti tanpa syarat jumlah. Operator AND/OR dipakai bila kedua syarat aktif.'));
        ubah(salah ? bFrom : null);
      };
      render();
    },
    visual(vis, st, hasil) {
      vis.innerHTML = '';
      const lolos = rowid1(st);
      vis.append(angkaBesar(`<b>${lolos.size}</b> dari 180 transaksi lolos`), el('div', { class: 'muted kecil', style: { position: 'absolute', right: '16px', top: '20px' } }, 'Arahkan kursor ke kotak untuk melihat rincian transaksi'));
      gridTrx(vis, lolos);
      Lab.sfx('swoosh'); setTimeout(() => Lab.sfx('ting'), 1400);
    },
    cekTiket(st) {
      const kunci = rowid1({ cabang: 'CABANG-003', min: 4, op: 'AND' }), punya = rowid1(st);
      const sama = punya.size === kunci.size && [...kunci].every(x => punya.has(x));
      if (sama) return { ok: true, pesan: `${kunci.size} transaksi cabang Tajur dengan minimal 4 barang sudah dikirim ke Pak Joko.`, narasi: 'Tiket selesai, Pak Joko berterima kasih!' };
      if (st.cabang !== 'CABANG-003') return { ok: false, pesan: `Hasilmu ${punya.size} transaksi. Pak Joko hanya meminta cabang Tajur (CABANG-003).` };
      if (st.op === 'OR') return { ok: false, pesan: `Hasilmu ${punya.size} transaksi. Dengan OR, transaksi kecil di Tajur dan transaksi besar di cabang lain ikut masuk. Kedua syarat harus terpenuhi bersamaan.` };
      return { ok: false, pesan: `Hasilmu ${punya.size} transaksi, seharusnya ${kunci.size}. "Minimal 4 barang" berarti jumlah_pembelian >= 4.` };
    },
    banding: {
      judulA: 'Hanya syarat jumlah', judulB: 'Syarat jumlah + cabang',
      pengantar: 'bandingkan dua saringan. Lalu ganti operator di skenario B dari <b>AND</b> ke <b>OR</b> dan amati jumlah transaksinya.',
      narasi: 'Apa yang terjadi jika AND diganti OR?',
      a: () => ({ tabel: 'tr_penjualan', kolom: [...KOLOM_TRX], cabang: '', min: 4, op: 'AND' }),
      b: () => ({ tabel: 'tr_penjualan', kolom: [...KOLOM_TRX], cabang: 'CABANG-003', min: 4, op: 'AND' }),
      atur(w, st, ubah) {
        const r = () => { w.innerHTML = ''; w.append(
          blok('where', 'WHERE', el('span', { class: 'mono' }, 'jumlah >='), slider(1, 5, st.min, v => { st.min = v; ubah(); }, 'Minimal jumlah')),
          blok('where', st.op, pilihan(CABANG, st.cabang, v => { st.cabang = v; r(); ubah(); }, 'Cabang'), sakelar([['AND', 'AND'], ['OR', 'OR']], st.op, v => { st.op = v; r(); ubah(); }, 'Operator'))); };
        r();
      },
      mini(w, st) {
        w.innerHTML = '';
        const l = rowid1(st);
        w.append(el('div', { class: 'angka-besar', style: { left: '10px', top: '6px', padding: '4px 10px', fontSize: '13px' }, html: `<b style="font-size:18px">${l.size}</b> transaksi lolos` }));
        gridTrx(w, l, { kecil: true, animasi: false });
      },
    },
    soal: {
      penerapan: { teks: 'Pak Joko memperluas program ke cabang <b>Tajur atau Margonda</b> (CABANG-003 / CABANG-004). Ketik query yang menampilkan <b>semua kolom</b> transaksi di salah satu cabang itu dengan <b>minimal 4 barang</b>.',
        kunci: "SELECT * FROM tr_penjualan WHERE jumlah_pembelian >= 4 AND (kode_cabang = 'CABANG-003' OR kode_cabang = 'CABANG-004')", urut: false },
      reflektif: { teks: 'Di skenario B, mengapa hasil OR jauh lebih banyak daripada AND?',
        opsi: ['OR meloloskan baris yang memenuhi salah satu syarat saja, sedangkan AND harus memenuhi keduanya.', 'OR mengurutkan data sehingga lebih banyak baris tampil.', 'AND menghapus kolom yang tidak dipakai.', 'OR menggabungkan dua tabel menjadi satu.'],
        benar: 0, alasan: 'Tepat. AND mempersempit (kedua syarat wajib), OR memperluas (cukup satu syarat). Saat mencampur keduanya, pakai tanda kurung agar maksudnya jelas.' },
    },
    lencana: { nama: 'Penyaring Data', huruf: 'W' }, ucapan: 'Pak Joko sudah menerima daftar calon member grosir.',
  });

  // ================================================================ LANGKAH 4 · MENYARING LANJUT (IS NULL, IN, BETWEEN, LIKE, DISTINCT)
  const KOLOM_KRY = ['kode_cabang', 'kode_karyawan', 'nama_depan', 'nama_belakang', 'jenis_kelamin'];
  const KOL_SARING = [['nama_belakang', 'nama_belakang'], ['jenis_kelamin', 'jenis_kelamin'], ['kode_cabang', 'kode_cabang']];
  const OP4 = [['', '(pilih operator)'], ['=', '='], ['IS NULL', 'IS NULL'], ['IS NOT NULL', 'IS NOT NULL'], ['IN', 'IN (…)'], ['LIKE', 'LIKE']];
  const petik = v => `'${String(v).replace(/'/g, "''")}'`;
  const nilaiKolom = kol => q(`SELECT DISTINCT ${kol} FROM ms_karyawan WHERE ${kol} IS NOT NULL ORDER BY ${kol}`).baris.map(r => r[0]);
  const where4 = st => {
    if (!st.op) return '';
    const k = st.kol;
    if (st.op === 'IS NULL' || st.op === 'IS NOT NULL') return `\nWHERE ${k} ${st.op}`;
    if (st.op === '=') return `\nWHERE ${k} = ${st.nilai === 'NULL' ? 'NULL' : petik(st.nilai)}`;
    if (st.op === 'IN') return `\nWHERE ${k} IN (${st.daftar.map(petik).join(', ')})`;
    return `\nWHERE ${k} LIKE ${petik(st.pola)}`;
  };
  const sql4 = st => `SELECT ${st.kolom.length ? st.kolom.join(', ') : '…'}\nFROM ms_karyawan${where4(st)};`;
  const kode4 = st => new Set(q(`SELECT kode_karyawan FROM ms_karyawan${where4(st)}`).baris.map(r => r[0]));
  const aturOp = (st, op) => {
    st.op = op;
    const nilai = nilaiKolom(st.kol);
    if (op === '=' && !['NULL', ...nilai].includes(st.nilai)) st.nilai = nilai[0];
    if (op === 'IN') st.daftar = st.daftar.filter(v => nilai.includes(v));
    if (op === 'LIKE' && !st.pola) st.pola = 'R%';
  };
  // Isian nilai yang menyesuaikan operator.
  function isianNilai(st, render) {
    const nilai = nilaiKolom(st.kol);
    if (st.op === '=') return pilihan([...nilai.map(v => [v, petik(v)]), ['NULL', 'NULL']], st.nilai, v => { st.nilai = v; render(); }, 'Nilai');
    if (st.op === 'IN') return el('span', { class: 'kolom-pilih' }, nilai.map(v => cek(v, st.daftar.includes(v), on => { st.daftar = on ? nilai.filter(x => x === v || st.daftar.includes(x)) : st.daftar.filter(x => x !== v); render(); })));
    if (st.op === 'LIKE') return el('span', { class: 'baris', style: { gap: '6px' } }, el('input', { type: 'text', class: 'alias', value: st.pola, maxlength: 20, 'aria-label': 'Pola LIKE',
      onchange: e => { st.pola = e.target.value.trim() || '%'; render(); } }), el('span', { class: 'muted kecil' }, '% = huruf apa saja · _ = satu huruf'));
    return st.op ? el('span', { class: 'muted kecil' }, 'Tanpa nilai: IS NULL / IS NOT NULL memeriksa kolom yang kosong.') : null;
  }
  function kartuKaryawan(wadah, lolos, { kecil = false, animasi = true } = {}) {
    const g = el('div', { class: 'grid-kry' + (kecil ? ' kecil' : '') });
    q('SELECT kode_karyawan, nama_depan, nama_belakang, kode_cabang, jenis_kelamin FROM ms_karyawan ORDER BY kode_karyawan').baris.forEach(([kd, nd, nb, cab, jk], i) => {
      const k = el('div', { class: 'kry' }, el('b', {}, nd, ' ', nb == null ? el('span', { class: 'null-badge' }, 'NULL') : nb),
        kecil ? null : el('small', {}, `${kd} · ${jk === 'L' ? 'laki-laki' : 'perempuan'}`), kecil ? null : el('small', {}, cab));
      g.append(k);
      const pasang = () => k.classList.add(lolos.has(kd) ? 'lolos' : 'gugur');
      animasi ? setTimeout(pasang, 250 + i * 60) : pasang();
    });
    wadah.append(g);
  }
  // Simulasi: alat pencari produk dengan 4 tab (LIKE, IN, BETWEEN, DISTINCT).
  function alatPencari() {
    const kat = q('SELECT kode_kategori, nama_kategori FROM ms_kategori ORDER BY kode_kategori').baris;
    const st = { tab: 'LIKE', pola: '%ml%', kat: ['KAT-002', 'KAT-003'], not: false, min: 10, max: 40, distinct: true };
    const kontrol = el('div', { class: 'kolom', style: { gap: '6px' } }), hasil = el('div');
    const sqlTab = () => ({
      LIKE: `SELECT nama_produk\nFROM ms_produk\nWHERE nama_produk LIKE ${petik(st.pola)};`,
      IN: `SELECT nama_produk\nFROM ms_produk\nWHERE kode_kategori ${st.not ? 'NOT IN' : 'IN'} (${st.kat.map(petik).join(', ')});`,
      BETWEEN: `SELECT nama_produk, unit\nFROM ms_produk\nWHERE unit BETWEEN ${Math.min(st.min, st.max)} AND ${Math.max(st.min, st.max)};`,
      DISTINCT: `SELECT ${st.distinct ? 'DISTINCT ' : ''}kode_satuan\nFROM ms_produk;`,
    })[st.tab];
    const segar = () => {
      hasil.innerHTML = '';
      if (st.tab === 'IN' && !st.kat.length) { hasil.append(el('div', { class: 'pesan warn' }, 'Centang minimal satu kategori.')); return; }
      const sql = sqlTab(), r = q(sql.replace(/;$/, ''));
      hasil.append(Lab.kotakSql(sql), el('div', { class: 'angka-sim', html: `<b>${r.baris.length}</b> ${st.tab === 'DISTINCT' ? 'satuan' : 'produk'} ditemukan` }),
        el('div', { class: 'baris', style: { gap: '4px' } }, r.baris.map(b => el('span', { class: 'chip abu' }, b.join(' · ')))));
    };
    const tampil = () => {
      kontrol.innerHTML = '';
      if (st.tab === 'LIKE') kontrol.append(el('span', {}, 'Pola nama produk'), el('input', { type: 'text', class: 'alias', value: st.pola, maxlength: 20, 'aria-label': 'Pola LIKE simulasi',
        oninput: e => { st.pola = e.target.value || '%'; segar(); } }));
      if (st.tab === 'IN') kontrol.append(sakelar([[false, 'IN'], [true, 'NOT IN']], st.not, v => { st.not = v; Lab.sfx('pas'); tampil(); }, 'IN atau NOT IN'),
        el('div', { class: 'kolom-pilih' }, kat.map(([k, n]) => cek(n, st.kat.includes(k), on => { st.kat = on ? kat.map(x => x[0]).filter(x => x === k || st.kat.includes(x)) : st.kat.filter(x => x !== k); segar(); }))));
      if (st.tab === 'BETWEEN') kontrol.append(el('span', {}, 'Isi kemasan (unit) dari … sampai …'), slider(1, 40, st.min, v => { st.min = v; segar(); }, 'Unit minimal'), slider(1, 40, st.max, v => { st.max = v; segar(); }, 'Unit maksimal'));
      if (st.tab === 'DISTINCT') kontrol.append(cek('pakai DISTINCT (buang duplikat)', st.distinct, v => { st.distinct = v; Lab.sfx('pas'); segar(); }));
      segar();
    };
    const tab = sakelar(['LIKE', 'IN', 'BETWEEN', 'DISTINCT'].map(t => [t, t]), st.tab, () => {}, 'Jenis pencarian');
    [...tab.children].forEach(b => { b.onclick = () => { st.tab = b.textContent; [...tab.children].forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); }); Lab.sfx('klik'); tampil(); }; });
    const w = el('div', { class: 'simulasi' }, el('b', {}, 'Simulasi spesifik · Alat pencari produk'), el('span', {}, 'Coba empat alat saringan lain pada tabel ms_produk.'), tab, kontrol, hasil);
    tampil();
    return w;
  }

  Lab.langkah.push({
    no: 4, judul: 'Menyaring lanjut', konsep: 'IS NULL · IN · LIKE', warna: 'var(--b-join)',
    ringkas: 'Temukan data karyawan yang belum lengkap dengan IS NULL, lalu jelajahi IN, LIKE, BETWEEN, dan DISTINCT.',
    tabelTiket: 'ms_karyawan', tabelSorot: 'ms_karyawan',
    tiket: { dari: 'Bu Sari', panggilan: 'Bu Sari', jabatan: 'Kepala Divisi Data Phi Minimart', inisial: 'BS', warnaAvatar: '#ffd6e8',
      teks: 'Kami sedang merapikan data karyawan untuk <b>kartu identitas</b>. Tolong cari karyawan yang <b>nama belakangnya belum diisi</b>, supaya bisa kami lengkapi.',
      ringkas: 'karyawan di ms_karyawan yang kolom nama_belakang-nya kosong (NULL).',
      narasi: 'Tiket dari Bu Sari, kepala divisi data. Cari karyawan yang nama belakangnya belum diisi.' },
    duniaKerja: 'Admin database rutin memeriksa kelengkapan data: kolom yang masih kosong, kode yang termasuk daftar tertentu, atau nama yang mengandung kata tertentu. Data yang rapi membuat laporan bisa dipercaya.',
    petunjuk: ['Kolom yang kosong di database bernilai NULL.', 'Pilih kolom nama_belakang dan operator IS NULL. Centang kolom yang ingin ditampilkan.', 'Kartu berlabel NULL adalah karyawan yang nama belakangnya kosong.', 'Ganti = NULL dengan IS NULL di skenario. Lalu coba alat pencari produk: LIKE, IN, BETWEEN, DISTINCT.', 'IN (…) berarti "salah satu dari daftar ini". Kode kategori Minuman = KAT-002, Sembako = KAT-003.'],
    stateAwal: () => ({ kolom: ['kode_karyawan', 'nama_depan', 'nama_belakang'], kol: 'nama_belakang', op: '', nilai: '', daftar: [], pola: 'R%' }),
    validasi: st => !st.kolom.length ? 'Centang minimal satu kolom di SELECT.'
      : st.op === 'IN' && !st.daftar.length ? 'Centang minimal satu nilai untuk IN (…).' : null,
    sql: sql4,
    hitung: st => kode4(st).size,
    labelHitung: 'dari 13 karyawan cocok',
    rakit(meja, st, ubah) {
      const render = (salah) => {
        meja.innerHTML = '';
        const bWhere = blok('join', 'WHERE', pilihan(KOL_SARING, st.kol, v => { st.kol = v; aturOp(st, st.op); render(); }, 'Kolom WHERE'),
          pilihan(OP4, st.op, v => { aturOp(st, v); render(v === '=' && st.nilai === 'NULL'); }, 'Operator'), isianNilai(st, () => render(st.op === '=' && st.nilai === 'NULL')));
        meja.append(
          blok('select', 'SELECT', KOLOM_KRY.map(k => cek(k, st.kolom.includes(k), on => { st.kolom = on ? KOLOM_KRY.filter(x => x === k || st.kolom.includes(x)) : st.kolom.filter(x => x !== k); ubah(); }))),
          blok('select', 'FROM', el('span', { class: 'slot isi' }, 'ms_karyawan'), el('span', { class: 'muted kecil' }, '13 karyawan')),
          bWhere,
          st.op === '=' && st.nilai === 'NULL' ? el('div', { class: 'pesan warn' }, 'Perhatikan penghitung: = NULL selalu 0 baris. NULL tidak bisa dibandingkan dengan =.') : '');
        ubah(salah ? bWhere : null);
      };
      render();
    },
    visual(vis, st) {
      vis.innerHTML = '';
      const lolos = kode4(st);
      vis.append(angkaBesar(`<b>${lolos.size}</b> dari 13 karyawan`), el('div', { class: 'muted kecil', style: { position: 'absolute', right: '16px', top: '20px' } }, 'Label NULL = kolom nama_belakang kosong'));
      kartuKaryawan(vis, lolos);
      Lab.sfx('swoosh'); setTimeout(() => Lab.sfx('ting'), 1100);
    },
    cekTiket(st) {
      const kunci = kode4({ kol: 'nama_belakang', op: 'IS NULL' }), punya = kode4(st);
      const sama = punya.size === kunci.size && [...kunci].every(x => punya.has(x));
      if (st.op === '=' && st.nilai === 'NULL') return { ok: false, pesan: 'Hasilmu 0 karyawan. = NULL tidak pernah bernilai benar; gunakan IS NULL.' };
      if (!sama) return { ok: false, pesan: `Hasilmu ${punya.size} karyawan. Bu Sari mencari yang kolom nama_belakang-nya kosong (NULL).` };
      if (!st.kolom.includes('nama_depan') && !st.kolom.includes('kode_karyawan')) return { ok: false, pesan: 'Tampilkan kode_karyawan atau nama_depan supaya Bu Sari tahu siapa karyawannya.' };
      return { ok: true, pesan: 'Karyawan dengan nama belakang kosong: Yoga (EMP-0011) dan Raka (EMP-0013). Daftar sudah dikirim ke Bu Sari.', narasi: 'Data karyawan siap dirapikan. Terima kasih!' };
    },
    banding: {
      judulA: 'nama_belakang = NULL', judulB: 'nama_belakang IS NULL',
      pengantar: 'dua cara mencari nilai kosong. Mengapa A selalu 0? Ganti operatornya dan amati. Lalu coba <b>Alat pencari produk</b> di kanan.',
      narasi: 'Kenapa sama dengan NULL tidak menemukan apa pun?',
      a: () => ({ kolom: ['kode_karyawan', 'nama_depan', 'nama_belakang'], kol: 'nama_belakang', op: '=', nilai: 'NULL', daftar: [], pola: 'R%' }),
      b: () => ({ kolom: ['kode_karyawan', 'nama_depan', 'nama_belakang'], kol: 'nama_belakang', op: 'IS NULL', nilai: '', daftar: [], pola: 'R%' }),
      atur(w, st, ubah) {
        const r = () => { w.innerHTML = ''; w.append(blok('join', 'WHERE', el('span', { class: 'mono' }, 'nama_belakang'),
          sakelar([['= NULL', '= NULL'], ['IS NULL', 'IS NULL'], ['IS NOT NULL', 'IS NOT NULL']], st.op === '=' ? '= NULL' : st.op, v => {
            if (v === '= NULL') { st.op = '='; st.nilai = 'NULL'; } else st.op = v; r(); ubah(); }, 'Operator NULL'))); };
        r();
      },
      mini(w, st, hasil) {
        w.innerHTML = '';
        const nama = hasil.baris.map(r => r[1]);
        w.append(el('div', { style: { padding: '12px', display: 'grid', gap: '8px', fontSize: '13px' } },
          el('div', { html: `<b style="font-size:22px">${hasil.baris.length}</b> dari 13 karyawan` }),
          nama.length ? el('div', { class: 'baris', style: { gap: '5px' } }, nama.map(n => el('span', { class: 'chip ' + (['Yoga', 'Raka'].includes(n) ? 'warn' : 'abu') }, n)))
            : el('div', { class: 'pesan bad' }, 'Tidak ada baris: perbandingan dengan NULL tidak pernah bernilai benar.')));
      },
      simulasi: alatPencari,
    },
    soal: {
      penerapan: { teks: 'Tim pengadaan butuh daftar produk kategori <b>Minuman atau Sembako</b> (<code>KAT-002</code>, <code>KAT-003</code>). Ketik query yang menampilkan <code>nama_produk</code> dan <code>kode_kategori</code> dari <code>ms_produk</code> memakai <b>IN</b>.',
        kunci: "SELECT nama_produk, kode_kategori FROM ms_produk WHERE kode_kategori IN ('KAT-002', 'KAT-003')", urut: false },
      reflektif: { teks: 'Mengapa nama_belakang = NULL tidak menghasilkan satu baris pun?',
        opsi: ['NULL berarti nilainya tidak diketahui, jadi perbandingan dengan = tidak pernah bernilai benar. Gunakan IS NULL.', 'Karena semua karyawan sudah punya nama belakang.', 'Karena tanda = hanya bisa dipakai untuk angka.', 'Karena NULL sama dengan teks kosong.'],
        benar: 0, alasan: 'Tepat. NULL bukan nilai, melainkan tanda "tidak ada data". Untuk memeriksanya pakai IS NULL atau IS NOT NULL.' },
    },
    lencana: { nama: 'Penyaring Ahli', huruf: 'N' }, ucapan: 'Data karyawan siap dirapikan. Terima kasih dari Bu Sari!',
  });

  // mulai setelah semua langkah terdaftar
  Lab.mulai();
})();
