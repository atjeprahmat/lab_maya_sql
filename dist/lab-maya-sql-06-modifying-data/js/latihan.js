/* Latihan per perintah SQL dan Studi Kasus. Materi & soal berasal dari folder materi_soal (lihat materi_soal/bangun.js).
   Soal "select" dijalankan di database utama. Soal "ubah" dijalankan di salinan database yang segar setiap kali,
   lalu kondisi akhirnya diperiksa dengan query cek dan dibandingkan dengan hasil kunci. */
(() => {
  'use strict';
  const Lab = window.Lab, el = Lab.el, $ = s => document.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const { latihan: L, studi } = window.LATIHAN_DATA;
  const CEK = window.LATIHAN_CEK, WAJIB = window.LATIHAN_WAJIB, M = window.MySQLLab;

  // ---------------------------------------------------------------- data soal & progres
  Lab.soal = {};
  for (const [id, s] of Object.entries(L)) Lab.soal[id] = { ...s, id };
  studi.latihan.forEach((s, i) => { const id = 'studi-' + (i + 1); Lab.soal[id] = { ...s, id, mode: 'select' }; });
  Lab.studi = studi;
  Lab.pLat = id => ((Lab.st.latihan ??= {})[id] ??= { ok: false, sql: '', hint: 0, solusi: false, paham: false, refleksi: false, catatan: '', catatanOk: false });
  /** 3M lengkap: contoh dijalankan (Memahami), soal benar (Mengaplikasi), pertanyaan reflektif terjawab (Merefleksi). */
  // Renungkan selesai = pertanyaan reflektif dijawab benar DAN catatan belajar ditulis & disimpan (wajib)
  Lab.lengkap3M = id => { const p = Lab.st.latihan?.[id]; return !!(p?.paham && p.ok && p.refleksi && p.catatanOk); };
  const CATATAN_MIN = 10;   // minimal satu kalimat pendek
  /** Acak urutan secara tetap per kunci (urutan pilihan sama setiap kali soal dibuka, berbeda antarsoal). */
  function acak(arr, kunci) {
    let h = 2166136261; for (const c of kunci) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) { h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0; const j = h % (i + 1); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  /** XP yang didapat dari satu soal: penuh, atau setengah bila solusi dilihat sebelum benar. */
  Lab.xpSoal = id => { const p = Lab.st.latihan?.[id]; return p?.ok && Lab.soal[id] ? (p.xp ?? Lab.soal[id].xp) : 0; };
  Lab.xp = () => Object.keys(Lab.st.latihan ?? {}).reduce((a, id) => a + Lab.xpSoal(id), 0);

  // ---------------------------------------------------------------- markdown sederhana (judul, paragraf, daftar, tabel, kutipan, blok kode)
  const inline = s => Lab.esc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/\*([^*]+)\*/g, '<i>$1</i>');
  const sel = baris => baris.replace(/^\||\|$/g, '').split('|').map(x => x.trim());
  /** Ubah teks markdown jadi elemen. opsi.coba: blok kode SELECT diberi tombol "Coba jalankan". */
  Lab.md = (teks, { coba = false } = {}) => {
    const wadah = el('div', { class: 'md' }), baris = String(teks ?? '').replace(/\r/g, '').split('\n');
    let par = [];
    const tutupPar = () => { if (par.length) wadah.append(el('p', { html: inline(par.join(' ')) })); par = []; };
    for (let i = 0; i < baris.length; i++) {
      const b = baris[i];
      if (/^```/.test(b)) {
        tutupPar(); const kode = [];
        while (++i < baris.length && !/^```/.test(baris[i])) kode.push(baris[i]);
        wadah.append(blokKode(kode.join('\n'), coba));
      } else if (/^\|/.test(b)) {
        tutupPar(); const t = [];
        while (i < baris.length && /^\|/.test(baris[i])) t.push(baris[i++]);
        i--;
        const [kepala, , ...isi] = t;
        wadah.append(el('div', { class: 'md-tabel' }, el('table', {}, el('thead', {}, el('tr', {}, sel(kepala).map(x => el('th', { html: inline(x) })))),
          el('tbody', {}, isi.map(r => el('tr', {}, sel(r).map(x => el('td', { html: inline(x) }))))))));
      } else if (/^#{1,4}\s/.test(b)) { tutupPar(); wadah.append(el('h4', { html: inline(b.replace(/^#+\s*/, '')) })); }
      else if (/^\s*[-*]\s/.test(b)) {
        tutupPar(); const ul = el('ul');
        while (i < baris.length && /^\s*[-*]\s/.test(baris[i])) ul.append(el('li', { html: inline(baris[i++].replace(/^\s*[-*]\s/, '')) }));
        i--; wadah.append(ul);
      } else if (/^>\s?/.test(b)) { tutupPar(); wadah.append(el('div', { class: 'md-kutip', html: inline(b.replace(/^>\s?/, '')) })); }
      else if (!b.trim()) tutupPar();
      else par.push(b.trim());
    }
    tutupPar();
    return wadah;
  };
  function blokKode(kode, coba) {
    const w = el('div', { class: 'md-kode' }, Lab.kotakSql(kode, 'SQL'));
    // hasilnya dibuka di jendela hasil (sama seperti intip tabel), bukan di tengah teks materi yang ter-scroll
    if (coba && /^\s*select/i.test(kode)) {
      w.append(el('button', { class: 'btn kecil', onclick: () => {
        Lab.sfx('klik');
        try { Lab.dialogHasil('Hasil contoh query', Lab.jalankanMurid(M.select(kode)), kode); } catch (e) { Lab.sfx('salah'); Lab.toast(e.message, 5000); }
      } }, el('i', { 'data-ikon': 'main' }), 'Coba jalankan'));
    }
    return w;
  }

  // ---------------------------------------------------------------- mesin latihan
  const galat = e => { const [, awal = '', inti] = String(e.message).match(/^(Perintah ke-\d+: )?([\s\S]*)$/); return new Error(awal + Lab.galat(inti)); };
  /** Query pemeriksa untuk soal "ubah": versi SQLite bila ada, jika tidak "cek" aslinya. */
  const queryCek = s => CEK[s.id] ?? M.select(s.cek);
  function periksa(d, s) {
    try { const r = d.exec(queryCek(s)); const t = r[r.length - 1]; return t ? { kolom: t.columns, baris: t.values } : { kolom: [], baris: [] }; }
    catch (e) { throw new Error(/no such table/.test(e.message) ? `Pemeriksaan gagal: ${Lab.galat(e.message)} Pastikan perintahmu membuat/menyisakan tabel yang diminta.` : Lab.galat(e.message)); }
  }
  /** Jalankan jawaban. select → hasil query; ubah → kondisi database setelah skrip (hasil pemeriksaan). */
  function jalankan(s, sql) {
    if (s.mode === 'select') {
      const st = M.pecah(sql);
      return { hasil: Lab.jalankanMurid(st.length === 1 ? M.select(st[0]) : sql) };
    }
    if (!M.pecah(sql).length) throw new Error('Editornya masih kosong nih. Tulis perintah SQL dulu, ya.');
    const d = Lab.dbBaru();
    try {
      let r; try { r = M.jalankan(d, sql); } catch (e) { throw galat(e); }
      return { hasil: periksa(d, s), jumlah: r.jumlah };
    } finally { d.close(); }
  }
  const kunciCache = {};
  const hasilKunci = s => (kunciCache[s.id] ??= jalankan(s, s.kunci).hasil);
  function nilai(s, sql, h) {
    const kunci = hasilKunci(s);
    let n = Lab.nilai(h, kunci, !!s.urut, s.mode === 'select' && !!s.nama_kolom);
    if (!n.ok && s.mode === 'ubah') n = { ok: false, pesan: 'Kondisi database setelah perintahmu belum sesuai soal. Bandingkan tabel pemeriksaan di bawah dengan permintaan soal.' };
    if (n.ok) n.pesan = s.mode === 'ubah' ? 'Kondisi database-nya udah sesuai permintaan soal.' : 'Hasil query-mu cocok sama yang diminta soal.';
    if (n.ok) {
      const polos = M.pecah(sql).join(' ').replace(/'(?:[^']|'')*'/g, "''");
      const kurang = (WAJIB[s.id] ?? []).find(w => !new RegExp(`\\b${w.replace(/\s+/g, '\\s+')}\\b`, 'i').test(polos));
      if (kurang) n = { ok: false, pesan: `Hasilnya udah benar, tapi soal ini minta kamu pakai ${kurang}. Coba tulis ulang pakai ${kurang}, ya.` };
    }
    return n;
  }

  // ---------------------------------------------------------------- skema tabel: tabel yang disebut soal terbuka, sisanya dilipat
  function skema(s) {
    const teks = `${s.teks} ${s.kunci}`.toLowerCase();
    const dipakai = t => new RegExp(`\\b${t.nama}\\b`).test(teks);
    const tabel = t => el('details', { class: 'skema-tabel', open: dipakai(t) || null },
      el('summary', {}, el('code', {}, t.nama), el('small', {}, `${t.bantu ? 'tabel bantu · ' : ''}${Lab.angka(t.baris)} baris`)),
      el('div', { class: 'skema-kolom' }, t.kolom.map(k => el('code', {}, k))));
    const utama = Lab.tabel.filter(dipakai), lain = Lab.tabel.filter(t => !dipakai(t));
    return el('div', { class: 'kartu lat-skema' }, el('span', { class: 'label' }, 'Skema tabel'),
      utama.map(tabel), lain.length ? el('details', { class: 'skema-lain' }, el('summary', {}, `Tabel lainnya (${lain.length})`), lain.map(tabel)) : null);
  }

  // ---------------------------------------------------------------- layar latihan
  function konteks(id) {
    for (let i = 0; i < Lab.kategori.length; i++) {
      const ids = Lab.soalKategori(i), j = ids.indexOf(id);
      if (j >= 0) return { i, k: Lab.kategori[i], ids, j, perintah: Lab.kategori[i].perintah.find(p => p[2] === id) };
    }
    return null;
  }
  /** Penjelasan singkat 3 langkah; muncul sekali saat siswa pertama membuka soal, dan lewat tombol "?". */
  function jelaskanLangkah() {
    Lab.rayakan({ ikon: '🧭', meriah: false, judul: 'Setiap soal punya 3 langkah', tombol: [{ teks: 'Siap, mulai!', utama: true }],
      isi: '<span class="langkah-jelas"><b>1 · 👀 Amati contoh</b> Jalankan contoh query dan perhatikan hasilnya.'
        + '<b>2 · ✍️ Kerjakan soal</b> Tulis query-mu sendiri, kirim, dan dapatkan XP.'
        + '<b>3 · 💭 Renungkan</b> Jawab satu pertanyaan singkat, lalu tulis catatan belajarmu: apa yang baru kamu pahami?</span>'
        + '<small class="muted">Ketiga langkah ini mengikuti Pembelajaran Mendalam: Memahami, Mengaplikasi, Merefleksi.</small>' });
  }
  // ---------------------------------------------------------------- pandu: sorotan + arahan bersuara di 3 soal pertama
  // Setiap saat dicari "apa yang harus dikerjakan sekarang" dari keadaan layar, lalu elemen itu disorot dan arahannya dibacakan.
  // Berhenti sendiri setelah PANDU_MAKS soal selesai ketiga langkahnya (Lab.st.pandu), atau saat siswa mematikannya.
  const PANDU_MAKS = 3;
  const panduAktif = () => !Lab.st.panduMati && (Lab.st.pandu ?? []).length < PANDU_MAKS;
  function mulaiPandu(id, nav) {
    const isi = $('#latIsi'), q = s => isi.querySelector(s), teks = el('span', { class: 'pandu-teks' }), urut = el('b', {});
    let sudahJalan = false, kini = null, kalimat = '';
    const bar = el('div', { class: 'pandu', role: 'status', 'aria-live': 'polite' }, el('span', { class: 'pandu-ikon', 'aria-hidden': 'true' }, '🧭'),
      el('span', { class: 'pandu-isi' }, urut, teks),
      el('button', { class: 'btn tipis kecil pandu-tutup', title: 'Matikan panduan', onclick: () => { Lab.sfx('klik'); Lab.st.panduMati = true; Lab.simpan(); berhenti(); } }, 'Matikan'));
    nav.querySelector('.spasi').replaceWith(bar);
    const tombol = awal => $$('button', isi).find(b => b.offsetParent && !b.disabled && b.textContent.trim().startsWith(awal));
    const cari = () => {
      if ($('#rayakan') || !$('#dialog').hidden) return [null, kalimat];   // tunggu pop-up ditutup dulu
      if (Lab.lengkap3M(id)) return [nav.querySelector('.lat-maju'), (Lab.st.pandu ?? []).length >= PANDU_MAKS
        ? 'Mantap, kamu sudah terbiasa! Mulai soal berikutnya panduan ini tidak muncul lagi. Tekan tombol ini untuk lanjut.'
        : 'Ketiga langkah selesai! Tekan tombol ini untuk lanjut ke materi berikutnya.'];
      const fase = $$('.lat-fase .fase-tab', isi).findIndex(b => b.classList.contains('aktif'));
      if (fase === 0) {
        const lanjut = tombol('Lanjut: Kerjakan');
        return lanjut ? [lanjut, 'Perhatikan hasilnya: kolom apa yang muncul, dan ada berapa baris? Sudah? Tekan Lanjut: Kerjakan soal.']
          : [tombol('Jalankan contoh'), 'Langkah 1, amati contoh. Tekan Jalankan contoh untuk melihat hasil query-nya.'];
      }
      if (fase === 1) {
        const lanjut = tombol('Lanjut: Renungkan'), ta = q('.editor textarea');
        if (lanjut) return [lanjut, 'Jawabanmu benar! Tekan Lanjut: Renungkan.'];
        if (!ta?.value.trim()) return [ta?.closest('.editor'), 'Langkah 2, kerjakan soal. Baca soal dan skema tabel di kiri, lalu tulis query-mu di editor ini.'];
        if (!sudahJalan) return [tombol('Jalankan'), 'Tekan Jalankan untuk mencoba query-mu dan melihat hasilnya.'];
        if (q('.lat-kanan .pesan.bad')) return [tombol('Buka petunjuk') ?? ta.closest('.editor'), 'Belum tepat. Baca pesannya, lalu perbaiki query-mu. Bingung? Tekan Buka petunjuk.'];
        return [tombol('Kirim jawaban'), 'Hasilnya sudah tampil. Sudah sesuai dengan soal? Tekan Kirim jawaban.'];
      }
      if (fase === 2) {
        const p = Lab.pLat(id), ta = q('.jurnal textarea');
        if (!p.refleksi) return [q('.opsi'), 'Langkah 3, renungkan. Baca pertanyaannya, lalu pilih jawaban yang paling tepat.'];
        if (ta && ta.value.trim().length < CATATAN_MIN) return [ta, 'Jawabanmu tepat! Sekarang tulis catatan belajarmu: apa yang baru kamu pahami, atau yang masih membingungkan?'];
        return [tombol('Simpan catatan'), 'Catatanmu sudah ditulis. Tekan Simpan catatan untuk menyelesaikan langkah 3.'];
      }
      return [null, kalimat];
    };
    // soal yang tuntas dihitung ke 3 soal terpandu (juga saat siswa langsung pindah soal lewat pop-up)
    const catatTuntas = () => { if (Lab.lengkap3M(id) && !(Lab.st.pandu ??= []).includes(id)) { Lab.st.pandu.push(id); Lab.simpan(); } };
    const sorot = sasaran => { kini?.classList.remove('pandu-sorot'); kini = sasaran; kini?.classList.add('pandu-sorot'); };
    const detak = () => {
      catatTuntas();
      if (!bar.isConnected) { berhenti(); return; }
      urut.textContent = `Panduan · soal ${Math.min(PANDU_MAKS, (Lab.st.pandu ?? []).length + (Lab.lengkap3M(id) ? 0 : 1))} dari ${PANDU_MAKS} `;
      const [sasaran, k] = cari();
      if (sasaran !== kini) { sorot(sasaran); if (sasaran && Lab.sempit) sasaran.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
      if (k && k !== kalimat) { kalimat = k; teks.textContent = k; if (sasaran) Lab.narasi(k); }
    };
    const t = setInterval(detak, 300);
    function berhenti() { clearInterval(t); sorot(null); if (bar.isConnected) bar.replaceWith(el('span', { class: 'spasi' })); }   // spasi dikembalikan: tombol lanjut tetap di kanan
    setTimeout(detak, 50);
    return { ketik: () => { sudahJalan = false; }, jalan: () => { sudahJalan = true; }, tuntas: catatTuntas };
  }

  Lab.bukaLatihan = id => {
    const s = Lab.soal[id], kx = s && konteks(id);
    if (!kx) { Lab.ke('peta'); return; }
    const p = Lab.pLat(id), w = $('#latIsi'); w.innerHTML = '';
    const ubah = s.mode === 'ubah';

    // navigasi di bawah (saran mentor): kembali ke kategori (kiri) dan materi selanjutnya (kanan), dua tombol yang sama bentuknya
    const xpNanti = () => p.solusi && !p.ok ? Math.ceil(s.xp / 2) : s.xp;
    const ke = j => () => { Lab.sfx('klik'); Lab.ke('latihan', { id: kx.ids[j] }); };
    const idLanjut = kx.ids[kx.j + 1], namaLanjut = idLanjut && (kx.k.perintah.find(x => x[2] === idLanjut)?.[0] ?? Lab.soal[idLanjut].judul);
    const nav = (el('nav', { class: 'lat-nav', 'aria-label': 'Navigasi materi', style: { '--warna': kx.k.warna } },
      el('button', { class: 'btn kecil lat-mundur', title: `Kembali ke ${kx.k.nama}`, 'aria-label': `Kembali ke ${kx.k.nama}`, onclick: () => { Lab.sfx('klik'); Lab.bukaKategori(kx.i); } }, el('i', { 'data-ikon': 'kiri' }), el('span', { class: 'lat-maju-nama' }, kx.k.nama)),
      el('span', { class: 'spasi' }),
      idLanjut ? el('button', { class: 'btn kecil lat-maju', title: `Materi selanjutnya: ${namaLanjut}`, 'aria-label': `Materi selanjutnya: ${namaLanjut}`, onclick: ke(kx.j + 1) },
        el('span', { class: 'lat-maju-nama' }, namaLanjut), el('i', { 'data-ikon': 'panah' }))
        : el('button', { class: 'btn kecil lat-maju', title: 'Materi terakhir · lihat laporan belajarmu', onclick: () => { Lab.sfx('klik'); Lab.ke('ringkasan'); } }, el('span', { class: 'lat-maju-nama' }, 'Lihat laporan'), el('i', { 'data-ikon': 'panah' }))));

    // 3 langkah per soal, mengikuti 3M Pembelajaran Mendalam. Siswa melihat kata kerjanya (Amati, Kerjakan, Renungkan);
    // istilah 3M tampil kecil sebagai keterangan. [ikon, aksi, istilah 3M, kelas CSS, sudah selesai?]
    const t3 = window.LATIHAN_3M?.[id];
    const FASE = [['👀', 'Amati contoh', 'Memahami', 'memahami', () => p.paham], ['✍️', 'Kerjakan soal', 'Mengaplikasi', 'mengaplikasi', () => p.ok], ['💭', 'Renungkan', 'Merefleksi', 'merefleksi', () => p.refleksi && p.catatanOk]];
    const strip = el('div', { class: 'lat-fase', role: 'tablist', 'aria-label': 'Langkah belajar' });
    const badan = el('div', { class: 'lat-badan' });
    let fase = !t3 ? 1 : !p.paham ? 0 : !p.ok ? 1 : !p.refleksi ? 2 : 1;
    const segarStrip = () => {
      strip.innerHTML = '';
      FASE.forEach(([ikon, aksi, nama, kelas, beres], i) => strip.append(i ? el('span', { class: 'fase-panah', 'aria-hidden': 'true' }, '→') : '',
        el('button', { class: `fase-tab ${kelas}${i === fase ? ' aktif' : ''}${beres() ? ' beres' : ''}`, role: 'tab', 'aria-selected': String(i === fase), title: `Langkah ${i + 1}: ${aksi} (${nama})`,
          disabled: !t3 && i !== 1, onclick: () => { Lab.sfx('klik'); keFase(i); } },
          el('span', { class: 'n' }, beres() ? '✓' : i + 1), el('span', { class: 'fase-teks' }, el('b', {}, `${ikon} ${aksi}`), el('small', {}, nama)))));
      strip.append(
        Lab.lengkap3M(id) ? el('span', { class: 'chip ok' }, '✓ Ketiga langkah selesai') : el('span', { class: 'muted kecil fase-posisi' }, `Langkah ${fase + 1} dari 3`),
        el('button', { class: 'ikon-btn fase-bantu', title: 'Apa maksud 3 langkah ini?', 'aria-label': 'Apa maksud 3 langkah ini?', onclick: () => { Lab.sfx('klik'); jelaskanLangkah(); } }, '?'));
    };
    const keFase = i => { fase = i; segarStrip(); badan.innerHTML = ''; [faseMemahami, faseMengaplikasi, faseMerefleksi][i](); };
    if (t3 && !Lab.st.kenalLangkah) { Lab.st.kenalLangkah = true; Lab.simpan(); setTimeout(jelaskanLangkah, 150); }   // penjelasan sekali saja
    let pandu = null;
    const naik = n => n === 2 ? pandu?.ketik() : pandu?.jalan();   // kait fase Mengaplikasi: 2 = mengetik, 3 = query dijalankan
    w.append(strip, badan, nav);
    if (panduAktif()) pandu = mulaiPandu(id, nav);

    // ---- 🔍 Memahami: jalankan contoh (berbeda dari soal) lalu amati
    function faseMemahami() {
      const hasilW = el('div', { class: 'hasil' }, el('div', { class: 'kosong' }, 'Tekan Jalankan contoh untuk melihat hasilnya.'));
      const lanjut = el('div');
      const jalankanContoh = () => {
        lanjut.innerHTML = '';
        const d = Lab.dbBaru();
        try {
          let r = M.jalankan(d, t3.contoh);
          if (t3.lihat) r = M.jalankan(d, t3.lihat);
          Lab.tabelHasil(hasilW, r.hasil ?? { kolom: [], baris: [] });
          if (ubah || t3.lihat) hasilW.prepend(el('div', { class: 'info-hasil' }, '✓ Contoh dijalankan di salinan database: database aslinya tidak berubah.'));
          const baru = !p.paham; p.paham = true; Lab.simpan(); Lab.sfx(baru ? 'pas' : 'klik'); segarStrip();
          lanjut.append(el('div', { class: 'pesan ok' }, el('b', {}, 'Sudah mengamati? '), 'Sekarang pakai konsepnya untuk soal.',
            el('button', { class: 'btn kecil utama lat-lanjut', onclick: () => { Lab.sfx('klik'); keFase(1); } }, 'Lanjut: Kerjakan soal', el('i', { 'data-ikon': 'panah' }))));
        } catch (e) { hasilW.innerHTML = ''; hasilW.append(el('div', { class: 'pesan bad', style: { margin: '10px' } }, galat(e).message)); Lab.sfx('salah'); }
        finally { d.close(); }
      };
      badan.append(
        el('div', { class: 'kolom lat-kiri' },
          kx.perintah ? el('div', { class: 'kartu lat-perintah', style: { '--warna': kx.k.warna } }, el('span', { class: 'label' }, 'Perintah'), el('code', {}, kx.perintah[0]), el('p', {}, kx.perintah[1]))
            : el('div', { class: 'kartu lat-perintah', style: { '--warna': kx.k.warna } }, el('span', { class: 'label' }, 'Konsep'), el('code', {}, s.konsep)),
          el('div', { class: 'kartu lat-contoh' }, el('span', { class: 'label' }, 'Contoh'), Lab.kotakSql(t3.contoh, ubah ? 'contoh perintah' : 'contoh query'),
            t3.lihat ? Lab.kotakSql(t3.lihat, 'lalu lihat hasilnya') : null,
            el('button', { class: 'btn utama', onclick: jalankanContoh }, el('i', { 'data-ikon': 'main' }), 'Jalankan contoh')),
          skema({ teks: `${t3.contoh} ${t3.lihat || ''}`, kunci: '' })),
        // pertanyaan "Amati" diletakkan di samping hasil supaya langsung terbaca saat mengamati
        el('div', { class: 'kolom lat-kanan' }, el('div', { class: 'kartu fase-kartu memahami' }, el('span', { class: 'label' }, '👀 Langkah 1 · Amati contoh: jalankan di kiri, lalu perhatikan hasilnya'),
          el('p', { class: 'amati' }, el('b', {}, '👀 '), t3.amati)),
          lanjut, hasilW));
      Lab.narasi('Memahami. Jalankan contohnya dan amati hasilnya.');
    }

    // ---- 💭 Merefleksi: pertanyaan reflektif (urutan pilihan diacak tetap per soal) + catatan belajar (wajib)
    function faseMerefleksi() {
      const [tanya, opsi, benar, alasanTeks] = t3.refleksi;
      const urut = acak(opsi.map((_, i) => i), id);
      const opsiW = el('div', { class: 'opsi' }), alasan = el('div'), selesaiW = el('div'), jejak = el('div', { class: 'baris fase-status' });
      const segarSelesai = () => {
        jejak.innerHTML = ''; jejak.append(...FASE.map(([ikon, aksi, , , beres]) => el('span', { class: 'chip ' + (beres() ? 'ok' : 'abu') }, (beres() ? '✓ ' : '○ ') + `${ikon} ${aksi}`)));
        selesaiW.innerHTML = '';
        if (!Lab.lengkap3M(id)) {
          const kurang = [!p.paham && 'langkah 1 (jalankan contoh)', !p.ok && 'langkah 2 (jawab soal dengan benar)', !p.refleksi && 'langkah 3 (jawab pertanyaan)', !p.catatanOk && 'langkah 3 (tulis & simpan catatan belajarmu)'].filter(Boolean);
          selesaiW.append(el('div', { class: 'pesan warn' }, 'Supaya ketiga langkah selesai, kerjakan juga: ' + kurang.join(', ') + '.'));
          return;
        }
        // selesai: tidak ada banner lagi; perayaannya berupa pop-up (rayakanTuntas) saat langkah terakhir dituntaskan
      };
      urut.forEach((i, pos) => opsiW.append(el('button', { onclick: e => {
        const ok = i === benar;
        e.currentTarget.classList.add(ok ? 'benar' : 'salah');
        alasan.innerHTML = ''; alasan.append(el('div', { class: 'pesan ' + (ok ? 'ok' : 'warn') }, ok ? alasanTeks : 'Hampir! Ingat lagi hasil contoh di fase Memahami dan soal yang kamu kerjakan, lalu coba pilihan lain.'));
        if (!ok) { Lab.sfx('salah'); return; }
        $$('button', opsiW).forEach(b => { b.disabled = true; });
        const tadi = Lab.lengkap3M(id); p.refleksi = true; Lab.simpan(); segarStrip(); segarSelesai(); rayakanTuntas(tadi);
      } }, el('span', { class: 'huruf' }, 'ABCD'[pos]), el('span', {}, opsi[i]))));
      if (p.refleksi) { opsiW.children[urut.indexOf(benar)].classList.add('benar'); $$('button', opsiW).forEach(b => { b.disabled = true; }); alasan.append(el('div', { class: 'pesan ok' }, alasanTeks)); }
      /** Pop-up perayaan saat soal baru saja tuntas (tadi = sudah tuntas sebelum aksi ini). */
      const rayakanTuntas = tadi => {
        if (tadi || !Lab.lengkap3M(id)) { Lab.sfx('sukses'); return; }
        pandu?.tuntas();   // langsung dihitung, sebelum siswa sempat pindah soal
        const ada = kx.j < kx.ids.length - 1;
        Lab.rayakan({ ikon: '🏅', judul: 'Mantap! Ketiga langkah selesai.', isi: 'Kamu sudah <b>mengamati</b>, <b>mengerjakan</b>, dan <b>merenungkan</b> soal ini.',
          tombol: [{ teks: 'Tutup' }, ada ? { teks: 'Materi selanjutnya →', utama: true, aksi: () => Lab.ke('latihan', { id: kx.ids[kx.j + 1] }) }
            : { teks: 'Kembali ke Peta →', utama: true, aksi: () => Lab.bukaKategori(kx.i) }] });
      };
      const catatan = el('textarea', { placeholder: 'Tulis minimal satu kalimat. mis. Ternyata … / Aku masih bingung …' }); catatan.value = p.catatan || '';
      const infoCatatan = el('div');
      const segarCatatan = () => { infoCatatan.innerHTML = ''; if (p.catatanOk) infoCatatan.append(el('span', { class: 'chip ok' }, '✓ Catatan tersimpan')); };
      catatan.oninput = () => { p.catatan = catatan.value; Lab.simpan(); };
      const simpanCatatan = el('button', { class: 'btn kecil utama', onclick: () => {
        if (catatan.value.trim().length < CATATAN_MIN) {
          Lab.sfx('salah'); infoCatatan.innerHTML = ''; infoCatatan.append(el('div', { class: 'pesan warn' }, 'Tulis minimal satu kalimat pendek dulu, ya: apa yang baru kamu pahami, atau yang masih membingungkan?')); catatan.focus(); return;
        }
        const tadi = Lab.lengkap3M(id); p.catatan = catatan.value; p.catatanOk = true; Lab.simpan(); segarCatatan(); segarStrip(); segarSelesai(); rayakanTuntas(tadi);
      } }, el('i', { 'data-ikon': 'simpan' }), 'Simpan catatan');
      segarCatatan();
      badan.append(
        el('div', { class: 'kolom lat-kiri' }, el('div', { class: 'kartu fase-kartu merefleksi' }, el('span', { class: 'label' }, '💭 Langkah 3 · Renungkan'),
          el('p', {}, 'Lihat lagi contoh yang kamu amati dan soal yang kamu kerjakan. Apa makna dari keduanya?')),
          el('div', { class: 'kartu' }, el('span', { class: 'label' }, 'Pertanyaan reflektif'), el('p', { class: 'soal-teks' }, tanya), opsiW, alasan)),
        el('div', { class: 'kolom lat-kanan refleksi-kanan' },
          el('div', { class: 'kartu jurnal' }, el('span', { class: 'label' }, 'Catatan belajarku (wajib)'),
            el('label', {}, el('b', {}, 'Apa yang baru kamu pahami, atau yang masih membingungkan?'), catatan),
            el('div', { class: 'baris' }, simpanCatatan, infoCatatan)),
          el('div', { class: 'kartu' }, el('span', { class: 'label' }, 'Langkah soal ini'), jejak),
          selesaiW));
      segarSelesai();
      Lab.narasi('Merefleksi. Jawab pertanyaan reflektifnya, lalu tulis catatan belajarmu.');
    }

    // ---- 🛠️ Mengaplikasi: soal dari materi_soal (petunjuk, solusi, editor, penilaian)
    function faseMengaplikasi() {
      // kiri: perintah (materi singkat dari sql.pdf), soal, skema tabel, petunjuk bertahap & solusi
      const daftarHint = el('ol', { class: 'hint-daftar' });
      const tombolHint = el('button', { class: 'btn kecil' }, el('i', { 'data-ikon': 'lampu' }), 'Minta hint');
      const solusiW = el('div');
      const segarHint = () => {
        daftarHint.innerHTML = ''; solusiW.innerHTML = '';
        s.hints.slice(0, p.hint).forEach(h => daftarHint.append(el('li', { html: inline(h) })));
        const habis = p.hint >= s.hints.length;
        tombolHint.hidden = habis;
        tombolHint.disabled = habis;
        tombolHint.lastChild.textContent = habis ? 'Petunjuk habis' : `Buka petunjuk (${p.hint + 1}/${s.hints.length})`;
        if (p.solusi) solusiW.append(Lab.kotakSql(s.kunci, 'solusi'));
        else if (habis) solusiW.append(el('button', { class: 'btn kecil', onclick: async () => {
          if (!p.ok && !(await Lab.tanya(`Lihat solusi sekarang? Kalau soal ini belum benar, XP-nya jadi setengah (${Math.ceil(s.xp / 2)} XP). Coba dulu sekali lagi juga boleh!`))) return;
          p.solusi = true; Lab.simpan(); Lab.sfx('ting'); segarHint();
        } }, el('i', { 'data-ikon': 'gembok' }), 'Lihat solusi'));
      };
      tombolHint.onclick = () => { p.hint = Math.min(s.hints.length, p.hint + 1); Lab.simpan(); Lab.sfx('ting'); segarHint(); };
      segarHint();
      const kiri = el('div', { class: 'kolom lat-kiri' },
        kx.perintah ? el('div', { class: 'kartu lat-perintah', style: { '--warna': kx.k.warna } }, el('span', { class: 'label' }, 'Perintah'), el('code', {}, kx.perintah[0]), el('p', {}, kx.perintah[1])) : null,
        el('div', { class: 'kartu lat-soal' }, el('span', { class: 'label' }, 'Soal'), Lab.md(s.teks),
          ubah ? el('p', { class: 'muted kecil' }, 'Tulis perintah MySQL-nya (boleh beberapa perintah, pisahkan dengan titik koma). Setiap kali dijalankan, database dimulai dari kondisi awal lagi.') : null),
        skema(s),
        el('div', { class: 'kartu lat-hint' }, el('div', { class: 'baris' }, el('span', { class: 'label' }, 'Petunjuk'), el('span', { class: 'spasi' }), tombolHint), daftarHint, solusiW));

      // kanan: editor, tombol, umpan balik, hasil
      const umpan = el('div'), hasilW = el('div', { class: 'hasil' }, el('div', { class: 'kosong' }, ubah ? 'Kondisi database setelah perintahmu bakal muncul di sini.' : 'Hasil query bakal muncul di sini.'));
      const ed = Lab.editor({ nilai: p.sql, placeholder: ubah ? '-- Tulis perintah MySQL di sini' : '-- Tulis query di sini', onubah: v => { p.sql = v; Lab.simpan(); naik(2); }, onjalankan: () => coba(false) });
      function coba(kirim) {
        umpan.innerHTML = '';
        let h;
        try { h = jalankan(s, ed.nilai); } catch (e) { Lab.sfx('salah'); umpan.append(el('div', { class: 'pesan bad' }, e.message)); hasilW.innerHTML = ''; return; }
        Lab.tabelHasil(hasilW, h.hasil); naik(3);
        if (ubah) hasilW.prepend(el('div', { class: 'info-hasil' }, `✓ ${h.jumlah} perintah dijalankan. Tabel di bawah: hasil pemeriksaan kondisi database.`));
        if (!kirim) { Lab.sfx('klik'); return; }
        let n;
        try { n = nilai(s, ed.nilai, h.hasil); } catch (e) { umpan.append(el('div', { class: 'pesan bad' }, 'Kunci soal ini gagal dijalankan: ' + e.message)); return; }
        umpan.append(el('div', { class: 'pesan ' + (n.ok ? 'ok' : 'bad') }, el('b', {}, n.ok ? 'Mantap, benar! ' : 'Hampir! '), n.pesan,
          n.ok && t3 ? el('button', { class: 'btn kecil utama lat-lanjut', onclick: () => { Lab.sfx('klik'); keFase(2); } }, 'Lanjut: Renungkan', el('i', { 'data-ikon': 'panah' }))
            : n.ok && kx.j < kx.ids.length - 1 ? el('button', { class: 'btn kecil utama lat-lanjut', onclick: ke(kx.j + 1) }, 'Materi selanjutnya', el('i', { 'data-ikon': 'panah' })) : null));
        if (n.ok) {
          const baru = !p.ok; if (baru) p.xp = xpNanti();
          p.ok = true; Lab.simpan(); segarStrip(); Lab.sfx('sukses');
          if (baru) { Lab.catat('progres'); Lab.toast(`🎉 +${p.xp} XP! Total XP-mu: ${Lab.xp()} · Level ${Lab.level(Lab.xp())}`); }
        } else Lab.sfx('salah');
      }
      const kanan = el('div', { class: 'kolom lat-kanan' }, ed.wadah,
        el('div', { class: 'baris' }, el('button', { class: 'btn', onclick: () => coba(false) }, el('i', { 'data-ikon': 'main' }), 'Jalankan'),
          el('button', { class: 'btn utama', onclick: () => coba(true) }, el('i', { 'data-ikon': 'kirim' }), 'Kirim jawaban'),
          el('span', { class: 'muted kecil' }, 'Ctrl+Enter untuk menjalankan')), umpan, hasilW);
      badan.append(kiri, kanan);
      Lab.narasi(s.judul);
    }
    keFase(fase);
  };
})();
