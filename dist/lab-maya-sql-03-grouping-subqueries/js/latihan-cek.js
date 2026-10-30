/* Pemeriksa latihan versi SQLite.
   Query "cek" di materi_soal memakai information_schema MySQL. Lab berjalan di SQLite, jadi untuk soal-soal itu
   dipakai query setara di bawah (pragma_table_info, sqlite_master, …). Soal yang tidak tercantum memakai "cek" aslinya.
   Kolom hasilnya dibuat semirip mungkin dengan versi MySQL agar mudah dibaca murid. */
(() => {
  const kolom = (t, isi) => `SELECT ${isi} FROM pragma_table_info('${t}') ORDER BY cid`;
  const NAMA = 'name AS COLUMN_NAME', TIPE = "replace(lower(type), ' ', '') AS COLUMN_TYPE";
  const NULLABLE = `CASE WHEN "notnull" OR pk THEN 'NO' ELSE 'YES' END AS IS_NULLABLE`, KUNCI = "CASE WHEN pk THEN 'PRI' ELSE '' END AS COLUMN_KEY";
  const TABEL = "SELECT name AS TABLE_NAME FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name";

  window.LATIHAN_CEK = {
    'create-table': kolom('promo', [NAMA, TIPE, NULLABLE, KUNCI].join(', ')),
    'alter-table': kolom('ms_kota', [NAMA, TIPE, NULLABLE].join(', ')),
    'rename-table': TABEL,
    'alter-add-column': kolom('ms_cabang', [NAMA, TIPE, NULLABLE].join(', ')),
    'alter-drop-column': kolom('ms_harga_harian', NAMA),
    'drop-table': TABEL,
    'truncate-table': "SELECT (SELECT COUNT(*) FROM tr_penjualan) AS jumlah_baris, (SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = 'tr_penjualan') AS tabel_masih_ada",
    'primary-key': kolom('tr_penjualan', [NAMA, KUNCI, "CASE WHEN pk AND lower(type) = 'integer' THEN 'auto_increment' ELSE '' END AS EXTRA"].join(', ')),
    'foreign-key': "SELECT * FROM (SELECT name AS COLUMN_NAME, NULL AS REFERENCED_TABLE_NAME, NULL AS REFERENCED_COLUMN_NAME FROM pragma_table_info('stok_cabang') WHERE pk > 0 " +
      `UNION ALL SELECT "from", "table", "to" FROM pragma_foreign_key_list('stok_cabang')) ORDER BY REFERENCED_TABLE_NAME IS NULL, COLUMN_NAME, REFERENCED_TABLE_NAME`,
    'disable-foreign-key-checks': 'SELECT (SELECT COUNT(*) FROM ms_kategori) AS jumlah_kategori, (SELECT foreign_keys FROM pragma_foreign_keys) AS pengecekan_aktif',
    'not-null': `SELECT (SELECT CASE WHEN "notnull" THEN 'NO' ELSE 'YES' END FROM pragma_table_info('ms_karyawan') WHERE name = 'nama_belakang') AS boleh_null, (SELECT COUNT(*) FROM ms_karyawan WHERE nama_belakang = '-') AS diisi_strip`,
    'unique': "SELECT 'PRIMARY' AS CONSTRAINT_NAME, 'PRIMARY KEY' AS CONSTRAINT_TYPE WHERE EXISTS (SELECT 1 FROM pragma_table_info('ms_cabang') WHERE pk) " +
      "UNION ALL SELECT name, 'UNIQUE' FROM pragma_index_list('ms_cabang') WHERE \"unique\" AND origin <> 'pk' ORDER BY 1",
    'check': "SELECT daftar_check('tr_penjualan') AS CHECK_CONSTRAINTS",
    'default': `SELECT name AS COLUMN_NAME, trim(dflt_value, '''') AS COLUMN_DEFAULT, ${NULLABLE} FROM pragma_table_info('ms_produk') WHERE name = 'unit'`,
  };

  /** Kata kunci yang wajib dipakai karena soal memintanya secara eksplisit ("Gunakan …"). */
  window.LATIHAN_WAJIB = {
    'select-distinct': ['DISTINCT'], 'in-not-in': ['IN'], between: ['BETWEEN'], like: ['LIKE'], limit: ['LIMIT'], 'is-null': ['IS NULL'],
    'inner-join': ['JOIN'], 'left-join': ['LEFT JOIN'], 'right-join': ['RIGHT JOIN'], 'cross-join': ['CROSS JOIN'], 'self-join': ['JOIN'],
    'group-by': ['GROUP BY'], having: ['HAVING'], 'having-count': ['HAVING', 'COUNT'], rollup: ['WITH ROLLUP'], exists: ['EXISTS'],
    'union-except-intersect': ['UNION'], 'rename-table': ['RENAME'], 'truncate-table': ['TRUNCATE'], 'temporary-table': ['TEMPORARY'],
    'auto-increment': ['AUTO_INCREMENT'], 'disable-foreign-key-checks': ['FOREIGN_KEY_CHECKS', 'TRUNCATE'], 'insert-ignore': ['INSERT IGNORE'],
    'update-join': ['JOIN'], 'delete-join': ['JOIN'], 'on-delete-cascade': ['ON DELETE CASCADE'], replace: ['REPLACE'],
  };
})();
