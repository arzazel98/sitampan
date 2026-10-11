export const transactions = [
  { id: "TRX-20241002-018", tanggal: "2024-10-02", jam: "14:32", pelanggan: "Walk-in #18", items: "Haircut Premium + Pomade", total: 105000, metode: "QRIS", status: "Berhasil", kasir: "Kasir A" },
  { id: "TRX-20241002-017", tanggal: "2024-10-02", jam: "13:55", pelanggan: "Walk-in #17", items: "Haircut Basic", total: 25000, metode: "Cash", status: "Berhasil", kasir: "Kasir A" },
  { id: "TRX-20241002-016", tanggal: "2024-10-02", jam: "12:10", pelanggan: "Walk-in #16", items: "Haircut Basic + Clay Matte", total: 100000, metode: "Cash", status: "Berhasil", kasir: "Kasir B" },
  { id: "TRX-20241002-015", tanggal: "2024-10-02", jam: "11:02", pelanggan: "Walk-in #15", items: "Hair Powder", total: 45000, metode: "QRIS", status: "Berhasil", kasir: "Kasir A" },
  { id: "TRX-20241001-014", tanggal: "2024-10-01", jam: "17:20", pelanggan: "Walk-in #14", items: "Haircut Premium", total: 40000, metode: "Cash", status: "Berhasil", kasir: "Kasir B" },
]

export const mutationHistory = [
  { tanggal: "2024-10-02 14:32", produk: "Pomade", jenis: "Penjualan", jumlah: -1, pengguna: "Kasir A", sebelum: 1, sesudah: 0 },
  { tanggal: "2024-10-02 12:10", produk: "Clay Matte", jenis: "Penjualan", jumlah: -1, pengguna: "Kasir A", sebelum: 4, sesudah: 3 },
  { tanggal: "2024-10-02 09:00", produk: "Mineral Water", jenis: "Barang Masuk", jumlah: +12, pengguna: "Admin", sebelum: 16, sesudah: 28 },
  { tanggal: "2024-10-02 08:30", produk: "Hair Tonic", jenis: "Barang Masuk", jumlah: +10, pengguna: "Admin", sebelum: 0, sesudah: 4, note: "Stok awal masih menipis" },
  { tanggal: "2024-10-01 16:20", produk: "Hair Powder", jenis: "Penjualan", jumlah: -2, pengguna: "Kasir B", sebelum: 14, sesudah: 12 },
  { tanggal: "2024-10-01 15:00", produk: "Shampoo Anti Dandruff", jenis: "Barang Keluar", jumlah: -1, pengguna: "Admin", sebelum: 3, sesudah: 2, note: "Rusak / kadaluarsa" },
  { tanggal: "2024-10-01 09:00", produk: "Beard Oil", jenis: "Barang Masuk", jumlah: +5, pengguna: "Admin", sebelum: 13, sesudah: 18 },
]

export const laporanPenjualanProduk = [
  { produk: "Haircut Basic", kategori: "Layanan", terjual: 42, pendapatan: 1050000 },
  { produk: "Haircut Premium", kategori: "Layanan", terjual: 28, pendapatan: 1120000 },
  { produk: "Clay Matte", kategori: "Pomade & Clay", terjual: 8, pendapatan: 600000 },
  { produk: "Hair Powder", kategori: "Styling", terjual: 12, pendapatan: 540000 },
  { produk: "Pomade", kategori: "Pomade & Clay", terjual: 5, pendapatan: 325000 },
  { produk: "Mineral Water", kategori: "Minuman", terjual: 34, pendapatan: 170000 },
]
