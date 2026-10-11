export const inventory = [
  { kode: "PRD-001", nama: "Clay Matte", kategori: "Pomade & Clay", stok: 3, minimum: 5, harga: 75000 },
  { kode: "PRD-002", nama: "Hair Powder", kategori: "Styling", stok: 12, minimum: 5, harga: 45000 },
  { kode: "PRD-003", nama: "Pomade", kategori: "Pomade & Clay", stok: 0, minimum: 5, harga: 65000 },
  { kode: "PRD-004", nama: "Mineral Water", kategori: "Minuman", stok: 28, minimum: 10, harga: 5000 },
  { kode: "PRD-005", nama: "Hair Tonic", kategori: "Perawatan", stok: 4, minimum: 5, harga: 55000 },
  { kode: "PRD-006", nama: "Beard Oil", kategori: "Perawatan", stok: 18, minimum: 5, harga: 80000 },
  { kode: "PRD-007", nama: "Shampoo Anti Dandruff", kategori: "Perawatan", stok: 2, minimum: 6, harga: 35000 },
  { kode: "PRD-008", nama: "Aftershave Lotion", kategori: "Perawatan", stok: 9, minimum: 5, harga: 40000 },
]

export const services = [
  { id: "SRV-01", nama: "Haircut Basic", harga: 25000, deskripsi: "Potong + styling sederhana", stok: null },
  { id: "SRV-02", nama: "Haircut Premium", harga: 40000, deskripsi: "Potong + wash + styling premium", stok: null },
]

export const productsForPOS = inventory.slice(0, 4)

export function getStatus(stok, minimum) {
  if (stok === 0) return "Habis"
  if (stok <= minimum) return "Stok Menipis"
  return "Aman"
}
