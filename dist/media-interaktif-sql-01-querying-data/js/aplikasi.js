/* Daftar aplikasi Lab Maya SQL. Lab dapat dibangun menjadi beberapa aplikasi terpisah, satu per kategori
   (lihat alat/bangun-aplikasi.js). Aplikasi aktif dipilih lewat LAB_CONFIG.aplikasi; kosong = lab lengkap.
   kategori: nama kategori persis seperti di Peta Aktivitas (sumber: sql.pdf). tiket: tampilkan 4 tiket terpandu (saat ini dimatikan; latihan per perintah saja).
   monitor: contoh query di layar monitor ilustrasi Laman Muka. */
window.LAB_APLIKASI = {
  'querying-data': {
    no: 1,
    monitor: "SELECT * FROM tr_penjualan\nWHERE kode_cabang = 'CABANG-003';", kategori: 'Querying Data', judul: 'Analis Data Minimarket', tiket: false,
    lead: 'Kamu jadi <b>analis data junior</b> di Phi Minimart. Ambil, urutkan, dan saring data minimarket pakai query SQL, satu perintah demi satu perintah.',
    tujuan: 'Murid mampu mengambil, mengurutkan, dan menyaring data minimarket dengan query SQL (SELECT, ORDER BY, WHERE, IN, BETWEEN, LIKE, IS NULL) untuk menjawab kebutuhan informasi di tempat kerja.',
    profesi: [['Data Analyst', 'menyaring transaksi dan menyusun daftar terurut untuk laporan (WHERE, ORDER BY).'],
      ['Admin Database', 'memeriksa kelengkapan data, misalnya kolom yang masih kosong (IS NULL, IN, LIKE).'],
      ['Back-end Developer', 'menulis query untuk fitur aplikasi kasir, misalnya katalog produk dan daftar harga (SELECT, ORDER BY, LIMIT).']],
  },
  'joining-tables': {
    no: 2,
    monitor: 'SELECT nama_produk,\n  nama_kategori\nFROM ms_produk\nJOIN ms_kategori\n  USING (kode_kategori);', kategori: 'Joining Tables', judul: 'Menggabungkan Tabel',
    lead: 'Data Phi Minimart tersebar di banyak tabel: produk, kategori, cabang, karyawan, penjualan. Gabungkan tabel-tabel itu dengan <b>JOIN</b> supaya laporan manajer lengkap dan mudah dibaca.',
    tujuan: 'Murid mampu menggabungkan data dari beberapa tabel minimarket dengan INNER JOIN, LEFT JOIN, RIGHT JOIN, self-join, dan CROSS JOIN untuk menyusun informasi yang utuh.',
    profesi: [['Data Analyst', 'menggabungkan transaksi dengan data produk dan cabang untuk laporan penjualan (INNER JOIN).'],
      ['Admin Database', 'mencari data tanpa pasangan, misalnya kota yang belum punya cabang (LEFT JOIN … IS NULL).'],
      ['Back-end Developer', 'menampilkan nama produk beserta kategorinya di aplikasi kasir (JOIN).']],
  },
  'grouping-subqueries': {
    no: 3,
    monitor: 'SELECT kode_cabang,\n  SUM(jumlah_pembelian)\nFROM tr_penjualan\nGROUP BY kode_cabang;', kategori: 'Grouping & Subqueries', judul: 'Merangkum Data Penjualan',
    lead: 'Manajer tidak butuh 180 baris transaksi, tapi ringkasannya: total per cabang, produk terlaris, cabang di atas rata-rata. Rangkum data dengan <b>GROUP BY</b>, <b>HAVING</b>, dan <b>subquery</b>.',
    tujuan: 'Murid mampu meringkas dan menganalisis data minimarket dengan GROUP BY, HAVING, ROLLUP, subquery, EXISTS, serta operator himpunan (UNION, EXCEPT, INTERSECT).',
    profesi: [['Data Analyst', 'menghitung total dan rata-rata penjualan per cabang (GROUP BY, HAVING).'],
      ['Business Intelligence', 'menyusun laporan dengan subtotal dan total keseluruhan (ROLLUP).'],
      ['Back-end Developer', 'membuat fitur seperti "produk di atas harga rata-rata" (subquery).']],
  },
  'managing-tables': {
    no: 4,
    monitor: 'CREATE TABLE promo (\n  kode_promo VARCHAR(10)\n    PRIMARY KEY,\n  diskon_persen INT\n);', kategori: 'Managing Tables', judul: 'Merancang Tabel Database',
    lead: 'Phi Minimart butuh tabel baru untuk promo, keluhan, dan stok cabang. <b>Buat, ubah, ganti nama, dan kosongkan tabel</b> dengan perintah DDL.',
    tujuan: 'Murid mampu membuat dan mengelola struktur tabel (CREATE, ALTER, RENAME, DROP, TRUNCATE, tabel sementara, AUTO_INCREMENT) sesuai kebutuhan data minimarket.',
    profesi: [['Database Administrator', 'menambah kolom atau tabel tanpa merusak data yang sudah ada (ALTER TABLE).'],
      ['Back-end Developer', 'membuat tabel untuk fitur baru (CREATE TABLE, AUTO_INCREMENT).'],
      ['Data Engineer', 'memakai tabel sementara untuk mengolah data bertahap (TEMPORARY TABLE).']],
  },
  'mysql-constraints': {
    no: 5,
    monitor: 'ALTER TABLE ms_cabang\nADD CONSTRAINT\n  uq_nama_cabang\nUNIQUE (nama_cabang);', kategori: 'MySQL Constraints', judul: 'Menjaga Kualitas Data',
    lead: 'Data yang salah bikin laporan kacau. Pasang <b>aturan di tabel</b>: kunci utama, relasi antartabel, wajib isi, unik, cek nilai, dan nilai bawaan.',
    tujuan: 'Murid mampu menerapkan constraint (PRIMARY KEY, FOREIGN KEY, NOT NULL, UNIQUE, CHECK, DEFAULT) untuk menjaga integritas data minimarket.',
    profesi: [['Database Administrator', 'menjaga relasi antartabel tetap konsisten (FOREIGN KEY, ON DELETE).'],
      ['Back-end Developer', 'menolak data tidak valid langsung di database (CHECK, NOT NULL, UNIQUE).'],
      ['Quality Assurance', 'menguji aturan data saat aplikasi diuji sebelum dirilis.']],
  },
  'modifying-data': {
    no: 6,
    monitor: "UPDATE ms_cabang\nSET nama_cabang =\n  'Tajur Raya'\nWHERE kode_cabang =\n  'CABANG-003';", kategori: 'Modifying Data', judul: 'Mengelola Isi Data',
    lead: 'Harga naik, cabang ganti nama, data salah input. <b>Tambah, ubah, dan hapus</b> data Phi Minimart dengan aman pakai INSERT, UPDATE, DELETE, dan kawan-kawannya.',
    tujuan: 'Murid mampu menambah, memperbarui, dan menghapus data (INSERT, INSERT IGNORE, UPDATE, UPDATE JOIN, DELETE, DELETE JOIN, ON DELETE CASCADE, REPLACE) secara tepat sasaran.',
    profesi: [['Back-end Developer', 'membuat fitur tambah, ubah, dan hapus data di aplikasi kasir (INSERT, UPDATE, DELETE).'],
      ['Admin Database', 'mengoreksi data salah input secara massal dan tepat sasaran (UPDATE … WHERE, DELETE JOIN).'],
      ['Data Engineer', 'memuat dan memperbarui data harian tanpa duplikat (INSERT IGNORE, REPLACE).']],
  },
  'studi-kasus': {
    no: 7,
    monitor: 'SELECT nama_kota,\n  COUNT(*) AS cabang\nFROM ms_cabang\nJOIN ms_kota\n  USING (kode_kota)\nGROUP BY nama_kota;', kategori: 'Studi Kasus', judul: 'Studi Kasus Minimarket',
    lead: 'Saatnya memakai semua yang sudah kamu pelajari: <b>SELECT, JOIN, GROUP BY, dan subquery</b> dalam 13 soal gabungan dari level Dasar sampai Lanjut.',
    tujuan: 'Murid mampu memadukan berbagai perintah SQL (SELECT, WHERE, JOIN, GROUP BY, subquery) untuk menjawab kebutuhan informasi jaringan minimarket secara utuh.',
    profesi: [['Data Analyst', 'menjawab pertanyaan bisnis dengan query gabungan beberapa tabel.'],
      ['Back-end Developer', 'menyusun query laporan untuk dashboard aplikasi.'],
      ['Database Developer', 'merancang query multi-tabel yang tepat dan efisien.']],
  },
};
