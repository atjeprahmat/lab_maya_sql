/* Penerjemah MySQL → SQLite untuk latihan per perintah.
   Murid menulis sintaks MySQL seperti di soal; lab menjalankannya di SQLite (sql.js).
   Bentuk yang tidak dikenal SQLite (MODIFY, ADD CONSTRAINT CHECK, ADD COLUMN … FIRST, SET DEFAULT, …)
   dikerjakan dengan membangun ulang tabel: buat tabel baru, salin data, hapus yang lama, ganti nama. */
(() => {
  'use strict';

  // ---------------------------------------------------------------- pemecah teks
  /** Pecah skrip jadi daftar perintah. Komentar dibuang, titik koma di dalam string diabaikan, \' MySQL → ''. */
  function pecah(sql) {
    const hasil = []; let cur = '', q = null;
    for (let i = 0; i < sql.length; i++) {
      const c = sql[i], n = sql[i + 1];
      if (q) {
        if (c === '\\' && q !== '`' && n === q) { cur += q + q; i++; continue; }
        cur += c;
        if (c === q) { if (n === q) { cur += n; i++; } else q = null; }
        continue;
      }
      if (c === "'" || c === '"' || c === '`') { q = c; cur += c; continue; }
      if ((c === '-' && n === '-') || c === '#') { while (i < sql.length && sql[i] !== '\n') i++; cur += ' '; continue; }
      if (c === '/' && n === '*') { const j = sql.indexOf('*/', i + 2); i = j < 0 ? sql.length : j + 1; cur += ' '; continue; }
      if (c === ';') { if (cur.trim()) hasil.push(cur.trim()); cur = ''; continue; }
      cur += c;
    }
    if (cur.trim()) hasil.push(cur.trim());
    return hasil;
  }
  /** Pisah daftar dengan koma di tingkat teratas (tidak di dalam kurung atau string). */
  function pisahKoma(s) {
    const hasil = []; let cur = '', d = 0, q = null;
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (q) { cur += c; if (c === q) q = null; continue; }
      if (c === "'" || c === '"' || c === '`') { q = c; cur += c; continue; }
      if (c === '(') d++; else if (c === ')') d--;
      if (c === ',' && d === 0) { hasil.push(cur.trim()); cur = ''; continue; }
      cur += c;
    }
    if (cur.trim()) hasil.push(cur.trim());
    return hasil;
  }
  const polos = s => s.replace(/^[`"[]|[`"\]]$/g, '');
  const kolomDari = (db, t) => (db.exec(`PRAGMA table_info("${t}")`)[0]?.values ?? []).map(r => r[1]);
  const BATAS = 5000;
  /** Satu perintah. SELECT/WITH diambil baris demi baris dan dihentikan di BATAS baris supaya browser tidak macet. */
  const exec = (db, sql) => {
    if (/^\s*(SELECT|WITH)\b/i.test(sql)) {
      const st = db.prepare(sql);
      try { const kolom = st.getColumnNames(), baris = []; while (baris.length < BATAS && st.step()) baris.push(st.get()); return kolom.length ? { kolom, baris } : null; }
      finally { st.free(); }
    }
    const r = db.exec(sql); const t = r[r.length - 1]; return t ? { kolom: t.columns, baris: t.values } : null;
  };
  const KATA_ITEM = /^(CONSTRAINT|PRIMARY|FOREIGN|UNIQUE|CHECK|KEY|INDEX)\b/i;
  const namaItem = item => KATA_ITEM.test(item) ? null : polos(item.split(/\s+/)[0]).toLowerCase();

  // ---------------------------------------------------------------- definisi kolom & CREATE TABLE
  /** Satu definisi kolom MySQL → SQLite. AUTO_INCREMENT + PRIMARY KEY → INTEGER PRIMARY KEY AUTOINCREMENT. */
  function kolomDef(def, pkTabel = false) {
    def = def.replace(/\bENUM\s*\([^)]*\)/ig, 'TEXT').replace(/\s+COMMENT\s+'(?:[^']|'')*'/ig, '')
      .replace(/\s+ON\s+UPDATE\s+CURRENT_TIMESTAMP(\(\))?/ig, '');
    if (!/\bAUTO_INCREMENT\b/i.test(def)) return def;
    if (!/\bPRIMARY\s+KEY\b/i.test(def) && !pkTabel) return def.replace(/\s+AUTO_INCREMENT\b/ig, '');
    const [nama, ...sisa] = def.split(/\s+/);
    const aturan = sisa.join(' ').replace(/^\w+(\s*\(\s*\d+\s*\))?(\s+UNSIGNED)?/i, '')
      .replace(/\bAUTO_INCREMENT\b|\bPRIMARY\s+KEY\b|\bNOT\s+NULL\b/ig, '').replace(/\s+/g, ' ').trim();
    return `${nama} INTEGER PRIMARY KEY AUTOINCREMENT${aturan ? ' ' + aturan : ''}`;
  }
  function createTable(st) {
    if (/\)\s*AS\s+SELECT\b|^CREATE\s+(TEMPORARY\s+)?TABLE\s+\S+\s+(AS\s+)?SELECT\b/i.test(st)) return st;
    const buka = st.indexOf('('), tutup = st.lastIndexOf(')');
    if (buka < 0 || tutup < buka) return st;
    let item = pisahKoma(st.slice(buka + 1, tutup));
    // PRIMARY KEY (id) di tingkat tabel + id AUTO_INCREMENT → pindahkan ke definisi kolom
    const pk = item.map(s => s.match(/^PRIMARY\s+KEY\s*\(\s*([`"\w]+)\s*\)$/i)).find(Boolean);
    const pkKolom = pk && polos(pk[1]).toLowerCase();
    const pkAuto = pkKolom && item.some(s => namaItem(s) === pkKolom && /\bAUTO_INCREMENT\b/i.test(s));
    if (pkAuto) item = item.filter(s => !/^PRIMARY\s+KEY\s*\(/i.test(s));
    item = item.map(s => namaItem(s) ? kolomDef(s, pkAuto && namaItem(s) === pkKolom)
      : s.replace(/^UNIQUE\s+(?:KEY|INDEX)\s+(\S+)\s*\(/i, 'CONSTRAINT $1 UNIQUE (').replace(/^UNIQUE\s+(?:KEY|INDEX)\s*\(/i, 'UNIQUE (').replace(/^(?:INDEX|KEY)\b.*$/i, ''))
      .filter(Boolean);
    return `${st.slice(0, buka)}(${item.join(', ')})`;
  }

  // ---------------------------------------------------------------- bangun ulang tabel
  function bangunUlang(db, tabel, ubah) {
    const nama = polos(tabel);
    const r = db.exec(`SELECT sql FROM sqlite_master WHERE type = 'table' AND name = '${nama.replace(/'/g, "''")}'`);
    if (!r.length) throw new Error(`no such table: ${nama}`);
    const sql = r[0].values[0][0], buka = sql.indexOf('('), tutup = sql.lastIndexOf(')');
    const lama = kolomDari(db, nama);
    const { item, peta = {} } = ubah(pisahKoma(sql.slice(buka + 1, tutup)), lama);
    const baru = `_baru_${nama}`;
    const indeks = (db.exec(`SELECT sql FROM sqlite_master WHERE type = 'index' AND tbl_name = '${nama}' AND sql IS NOT NULL`)[0]?.values ?? []).map(x => x[0]);
    const fk = db.exec('PRAGMA foreign_keys')[0].values[0][0];
    db.exec('PRAGMA foreign_keys = OFF; PRAGMA legacy_alter_table = ON; SAVEPOINT bangun');
    try {
      db.exec(`CREATE TABLE "${baru}" (${item.join(', ')})`);
      const pasang = kolomDari(db, baru).map(k => [k, peta[k.toLowerCase()] ?? lama.find(l => l.toLowerCase() === k.toLowerCase())]).filter(p => p[1]);
      db.exec(`INSERT INTO "${baru}" (${pasang.map(p => `"${p[0]}"`).join(', ')}) SELECT ${pasang.map(p => `"${p[1]}"`).join(', ')} FROM "${nama}"`);
      db.exec(`DROP TABLE "${nama}"; ALTER TABLE "${baru}" RENAME TO "${nama}"`);
      for (const s of indeks) db.exec(s);
      db.exec('RELEASE bangun');
    } catch (e) {
      db.exec('ROLLBACK TO bangun; RELEASE bangun');
      throw new Error(e.message.replaceAll(baru, nama));
    } finally { db.exec(`PRAGMA legacy_alter_table = OFF; PRAGMA foreign_keys = ${fk ? 'ON' : 'OFF'}`); }
    return null;
  }
  const cariKolom = (item, k) => { const i = item.findIndex(s => namaItem(s) === polos(k).toLowerCase()); if (i < 0) throw new Error(`no such column: ${polos(k)}`); return i; };
  const sisip = (item, def, posisi) => {
    if (!posisi) return [...item.filter(namaItem), def, ...item.filter(s => !namaItem(s))];
    if (/^FIRST$/i.test(posisi)) return [def, ...item];
    const i = cariKolom(item, posisi.replace(/^AFTER\s+/i, ''));
    return [...item.slice(0, i + 1), def, ...item.slice(i + 1)];
  };

  // ---------------------------------------------------------------- ALTER TABLE
  function ubahTabel(db, tabel, aksiSemua) {
    for (const aksi of pisahKoma(aksiSemua)) {
      let m;
      const lewat = s => exec(db, `ALTER TABLE ${tabel} ${s}`);
      if (/^RENAME\s+(TO|AS|COLUMN)\b/i.test(aksi)) { lewat(aksi.replace(/^RENAME\s+AS\b/i, 'RENAME TO')); continue; }
      if ((m = aksi.match(/^ADD\s+(?:CONSTRAINT\s+(\S+)\s+)?UNIQUE(?:\s+(?:INDEX|KEY))?(?:\s+(?!\()(\S+))?\s*\(([^)]+)\)$/i))) {
        const kol = pisahKoma(m[3]); db.exec(`CREATE UNIQUE INDEX ${m[1] || m[2] || polos(kol[0])} ON ${tabel} (${kol.join(', ')})`); continue;
      }
      if ((m = aksi.match(/^ADD\s+(?:INDEX|KEY)(?:\s+(?!\()(\S+))?\s*\(([^)]+)\)$/i))) {
        const kol = pisahKoma(m[2]); db.exec(`CREATE INDEX ${m[1] || polos(kol[0])} ON ${tabel} (${kol.join(', ')})`); continue;
      }
      if ((m = aksi.match(/^DROP\s+(?:INDEX|KEY)\s+(\S+)$/i))) { db.exec(`DROP INDEX ${m[1]}`); continue; }
      if ((m = aksi.match(/^ADD\s+((?:CONSTRAINT\s+\S+\s+)?(?:CHECK|FOREIGN\s+KEY|PRIMARY\s+KEY)\b[\s\S]*)$/i))) {
        bangunUlang(db, tabel, item => ({ item: [...item, m[1]] })); continue;
      }
      if ((m = aksi.match(/^DROP\s+(?:CONSTRAINT|CHECK|FOREIGN\s+KEY)\s+(\S+)$/i))) {
        const n = polos(m[1]);
        if (db.exec(`SELECT 1 FROM sqlite_master WHERE type = 'index' AND name = '${n}'`).length) { db.exec(`DROP INDEX ${n}`); continue; }
        bangunUlang(db, tabel, item => {
          const sisa = item.filter(s => !new RegExp(`^CONSTRAINT\\s+[\`"]?${n}[\`"]?\\s`, 'i').test(s));
          if (sisa.length === item.length) throw new Error(`Constraint ${n} tidak ditemukan.`);
          return { item: sisa };
        }); continue;
      }
      if (/^DROP\s+PRIMARY\s+KEY$/i.test(aksi)) {
        bangunUlang(db, tabel, item => ({ item: item.filter(s => !/^PRIMARY\s+KEY\b/i.test(s)).map(s => s.replace(/\s+PRIMARY\s+KEY(\s+AUTOINCREMENT)?/i, '')) })); continue;
      }
      if ((m = aksi.match(/^DROP\s+(?:COLUMN\s+)?(\S+)$/i))) { lewat(`DROP COLUMN ${m[1]}`); continue; }
      if ((m = aksi.match(/^ADD\s+(?:COLUMN\s+)?([\s\S]+?)(?:\s+(FIRST|AFTER\s+\S+))?$/i))) {
        const def = kolomDef(m[1].replace(/^\(([\s\S]*)\)$/, '$1'));
        if (!m[2] && !/\b(PRIMARY\s+KEY|UNIQUE|AUTOINCREMENT)\b/i.test(def)) { lewat(`ADD COLUMN ${def}`); continue; }
        bangunUlang(db, tabel, item => ({ item: sisip(item, def, m[2]) })); continue;
      }
      if ((m = aksi.match(/^(MODIFY|CHANGE)\s+(?:COLUMN\s+)?(\S+)\s+(?:(\S+)\s+)?([\s\S]+?)(?:\s+(FIRST|AFTER\s+\S+))?$/i))) {
        const ganti = m[1].toUpperCase() === 'CHANGE';
        const kolBaru = ganti ? m[3] : m[2], def = kolomDef(`${kolBaru} ${ganti ? m[4] : [m[3], m[4]].filter(Boolean).join(' ')}`);
        bangunUlang(db, tabel, item => {
          const i = cariKolom(item, m[2]); let hasil = item.filter((_, j) => j !== i);
          hasil = m[5] ? sisip(hasil, def, m[5]) : [...hasil.slice(0, i), def, ...hasil.slice(i)];
          return { item: hasil, peta: { [polos(kolBaru).toLowerCase()]: polos(m[2]) } };
        }); continue;
      }
      if ((m = aksi.match(/^ALTER\s+(?:COLUMN\s+)?(\S+)\s+(SET\s+DEFAULT\s+([\s\S]+)|DROP\s+DEFAULT)$/i))) {
        bangunUlang(db, tabel, item => {
          const i = cariKolom(item, m[1]);
          let def = item[i].replace(/\s+DEFAULT\s+('(?:[^']|'')*'|\([^)]*\)|\S+)/i, '');
          if (m[3]) def += ` DEFAULT ${m[3]}`;
          return { item: item.map((s, j) => j === i ? def : s) };
        }); continue;
      }
      throw new Error(`Bagian ALTER TABLE ini belum bisa dicoba di lab: ${aksi}`);
    }
    return null;
  }

  // ---------------------------------------------------------------- UPDATE … JOIN dan DELETE … JOIN
  function updateJoin(st) {
    const m = st.match(/^UPDATE\s+(\S+)(?:\s+(?:AS\s+)?(?!(?:INNER|CROSS|JOIN)\b)(\w+))?\s+((?:(?:INNER|CROSS)\s+)?JOIN\s[\s\S]+?)\s+SET\s+([\s\S]+?)(?:\s+WHERE\s+([\s\S]+))?$/i);
    const j = m?.[3].match(/^(?:(?:INNER|CROSS)\s+)?JOIN\s+(\S+(?:\s+(?:AS\s+)?(?!ON\b)\w+)?)\s+ON\s+([\s\S]+?)(\s+(?:(?:INNER|LEFT|CROSS)\s+)?JOIN\s[\s\S]*)?$/i);
    if (!j) throw new Error('Bentuk UPDATE … JOIN ini belum dikenali. Polanya: UPDATE t1 JOIN t2 ON … SET … WHERE …');
    const set = pisahKoma(m[4]).map(a => a.replace(/^[`"\w]+\.([`"\w]+)\s*=/, '$1 =')).join(', ');
    return `UPDATE ${m[1]}${m[2] ? ' AS ' + m[2] : ''} SET ${set} FROM ${j[1]}${j[3] ?? ''} WHERE (${j[2]})${m[5] ? ` AND (${m[5]})` : ''}`;
  }
  function deleteJoin(st) {
    const m = st.match(/^DELETE\s+([`"\w]+)(?:\.\*)?\s+FROM\s+([\s\S]+?)(?:\s+WHERE\s+([\s\S]+))?$/i);
    if (!m) throw new Error(/^DELETE\s+\w+\s*,/i.test(st) ? 'DELETE beberapa tabel sekaligus belum bisa dicoba di lab. Hapus satu tabel per perintah.' : 'Bentuk DELETE ini belum dikenali. Polanya: DELETE t FROM tabel t JOIN … ON … WHERE …');
    const s = polos(m[1]);
    const t = m[2].match(new RegExp(`(?:^|JOIN\\s+|,\\s*)([\`"\\w]+)\\s+(?:AS\\s+)?${s}\\b`, 'i'));
    return `DELETE FROM ${t ? t[1] : s} WHERE rowid IN (SELECT ${s}.rowid FROM ${m[2]}${m[3] ? ' WHERE ' + m[3] : ''})`;
  }

  // ---------------------------------------------------------------- SELECT (dan WITH ROLLUP)
  function rollup(st) {
    const m = st.match(/^SELECT\s+([\s\S]+?)\s+FROM\s+([\s\S]+?)\s+GROUP\s+BY\s+([\s\S]+?)\s+WITH\s+ROLLUP$/i);
    if (!m) return st;
    const item = pisahKoma(m[1]), grup = pisahKoma(m[3]);
    const ujung = s => polos(s.split('.').pop()).toLowerCase();
    const level = [];
    for (let n = grup.length; n >= 0; n--) {
      const hilang = grup.slice(n).map(ujung);
      const kol = item.map(it => {
        const [, ekspr, alias] = it.match(/^([\s\S]+?)(?:\s+(?:AS\s+)?([`"\w]+))?$/i) ?? [, it];
        const dasar = /^[`"\w.]+$/.test(ekspr) ? ekspr : it;
        return hilang.includes(ujung(dasar)) ? `NULL AS ${alias ?? polos(dasar.split('.').pop())}` : it;
      });
      level.push(`SELECT ${kol.join(', ')} FROM ${m[2]}${n ? ' GROUP BY ' + grup.slice(0, n).join(', ') : ''}`);
    }
    return level.join(' UNION ALL ');
  }
  function select(st) {
    st = st.trim().replace(/;\s*$/, '').replace(/@@(?:SESSION\.|GLOBAL\.)?foreign_key_checks/ig, '(SELECT foreign_keys FROM pragma_foreign_keys)');
    let m;
    if (/^SHOW\s+TABLES$/i.test(st)) return "SELECT name AS Tables_in_minimarket FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name";
    if ((m = st.match(/^(?:DESCRIBE|DESC|SHOW\s+COLUMNS\s+FROM)\s+(\S+)$/i))) {
      return `SELECT name AS Field, type AS Type, CASE WHEN "notnull" OR pk THEN 'NO' ELSE 'YES' END AS "Null", CASE WHEN pk THEN 'PRI' ELSE '' END AS "Key", dflt_value AS "Default" FROM pragma_table_info('${polos(m[1])}') ORDER BY cid`;
    }
    return rollup(st);
  }

  // ---------------------------------------------------------------- jalankan skrip (latihan bertipe "ubah")
  function satu(db, st) {
    let m;
    if ((m = st.match(/^SET\s+(?:@@(?:SESSION\.|GLOBAL\.)?|SESSION\s+|GLOBAL\s+)?FOREIGN_KEY_CHECKS\s*=\s*(\w+)$/i))) return exec(db, `PRAGMA foreign_keys = ${/^(1|ON)$/i.test(m[1]) ? 'ON' : 'OFF'}`);
    if ((m = st.match(/^TRUNCATE\s+(?:TABLE\s+)?(\S+)$/i))) return exec(db, `DELETE FROM ${m[1]}`);
    if ((m = st.match(/^RENAME\s+TABLE\s+(\S+)\s+TO\s+(\S+)$/i))) return exec(db, `ALTER TABLE ${m[1]} RENAME TO ${m[2]}`);
    if (/^(USE\s|(CREATE|DROP)\s+(DATABASE|SCHEMA)\b)/i.test(st)) throw new Error('USE, CREATE DATABASE, dan DROP DATABASE belum bisa dicoba di lab ini.');
    if ((m = st.match(/^ALTER\s+TABLE\s+(\S+)\s+([\s\S]+)$/i))) return ubahTabel(db, m[1], m[2]);
    if (/^UPDATE\s+\S+(\s+(AS\s+)?\w+)?\s+((INNER|CROSS)\s+)?JOIN\s/i.test(st)) return exec(db, updateJoin(st));
    if (/^DELETE\s+(?!FROM\b)/i.test(st)) return exec(db, deleteJoin(st));
    st = st.replace(/^INSERT\s+IGNORE\b/i, 'INSERT OR IGNORE').replace(/^REPLACE\s+(?!INTO\b)/i, 'REPLACE INTO ');
    if (/^CREATE\s+(TEMPORARY\s+)?TABLE\b/i.test(st)) st = createTable(st);
    return exec(db, select(st));
  }
  /** Jalankan skrip MySQL (bisa beberapa perintah) di database SQLite. Kembalikan jumlah perintah dan hasil SELECT terakhir. */
  function jalankan(db, skrip) {
    const daftar = pecah(skrip); let hasil = null;
    daftar.forEach((st, i) => {
      try { hasil = satu(db, st) ?? hasil; } catch (e) { e.message = (daftar.length > 1 ? `Perintah ke-${i + 1}: ` : '') + e.message; throw e; }
    });
    return { jumlah: daftar.length, hasil };
  }

  /** Fungsi SQL bantu untuk pemeriksa: daftar_check('tabel') → "nama: kondisi; …" (SQLite tidak punya information_schema). */
  function pasangFungsi(db) {
    db.create_function('daftar_check', tabel => {
      const r = db.exec(`SELECT sql FROM sqlite_master WHERE type = 'table' AND name = '${String(tabel).replace(/'/g, "''")}'`);
      if (!r.length) return null;
      const sql = r[0].values[0][0], item = pisahKoma(sql.slice(sql.indexOf('(') + 1, sql.lastIndexOf(')')));
      let n = 0;
      return item.map(s => s.match(/^(?:CONSTRAINT\s+(\S+)\s+)?CHECK\s*\(([\s\S]*)\)$/i)).filter(Boolean)
        .map(([, nama, isi]) => `${nama ? polos(nama) : `${tabel}_chk_${++n}`}: ${isi.replace(/\s+/g, '').toLowerCase()}`).join('; ') || null;
    });
  }

  (typeof window !== 'undefined' ? window : globalThis).MySQLLab = { pecah, pisahKoma, select, jalankan, pasangFungsi };
})();
