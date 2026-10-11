export const summary = {
  transaksiHariIni: 18,
  pendapatanHariIni: 865000,
  produkTerjual: 11,
  stokMenipis: 4,
}

export const chartData = [
  { name: "Sen", transaksi: 12, pendapatan: 420000 },
  { name: "Sel", transaksi: 15, pendapatan: 610000 },
  { name: "Rab", transaksi: 9, pendapatan: 330000 },
  { name: "Kam", transaksi: 18, pendapatan: 865000 },
  { name: "Jum", transaksi: 14, pendapatan: 520000 },
  { name: "Sab", transaksi: 22, pendapatan: 980000 },
  { name: "Min", transaksi: 19, pendapatan: 740000 },
]

export const recentTransactions = [
  { id: "TRX-20241002-018", waktu: "14:32", pelanggan: "Walk-in #18", items: "Haircut Premium + Pomade", total: 105000, metode: "QRIS", status: "Berhasil" },
  { id: "TRX-20241002-017", waktu: "13:55", pelanggan: "Walk-in #17", items: "Haircut Basic", total: 25000, metode: "Cash", status: "Berhasil" },
  { id: "TRX-20241002-016", waktu: "12:10", pelanggan: "Walk-in #16", items: "Haircut Basic + Clay Matte", total: 100000, metode: "Cash", status: "Berhasil" },
  { id: "TRX-20241002-015", waktu: "11:02", pelanggan: "Walk-in #15", items: "Hair Powder", total: 45000, metode: "QRIS", status: "Berhasil" },
]

export const recentMutations = [
  { tanggal: "2024-10-02 14:32", produk: "Pomade", jenis: "Penjualan", jumlah: -1, pengguna: "Kasir A", sebelum: 1, sesudah: 0 },
  { tanggal: "2024-10-02 12:10", produk: "Clay Matte", jenis: "Penjualan", jumlah: -1, pengguna: "Kasir A", sebelum: 4, sesudah: 3 },
  { tanggal: "2024-10-02 09:00", produk: "Mineral Water", jenis: "Barang Masuk", jumlah: 12, pengguna: "Admin", sebelum: 16, sesudah: 28 },
  { tanggal: "2024-10-01 16:20", produk: "Hair Powder", jenis: "Penjualan", jumlah: -2, pengguna: "Kasir B", sebelum: 14, sesudah: 12 },
]
