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
  { id: "SRV-01", nama: "Hair Cut", harga: 30000, deskripsi: "Potong rambut basic" },
  { id: "SRV-02", nama: "Shaving", harga: 15000, deskripsi: "Cukur jenggot/kumis" },
  { id: "SRV-03", nama: "Hair Styling", harga: 20000, deskripsi: "Styling rambut" },
  { id: "SRV-04", nama: "Hair Mask", harga: 25000, deskripsi: "Perawatan masker rambut" },
  { id: "SRV-05", nama: "Face Mask", harga: 20000, deskripsi: "Perawatan masker wajah" },
  { id: "SRV-06", nama: "Vitamin", harga: 4000, deskripsi: "Pemberian vitamin rambut" },
  { id: "SRV-07", nama: "Semir Hitam", harga: 35000, deskripsi: "Pewarnaan hitam" },
  { id: "SRV-08", nama: "Coloring Basic", harga: 100000, deskripsi: "Coloring basic" },
  { id: "SRV-09", nama: "Coloring Fashion Short", harga: 150000, deskripsi: "Coloring fashion pendek" },
  { id: "SRV-10", nama: "Coloring Fashion Medium", harga: 200000, deskripsi: "Coloring fashion sedang" },
  { id: "SRV-11", nama: "Coloring Fashion Long", harga: 250000, deskripsi: "Coloring fashion panjang" },
  { id: "SRV-12", nama: "Bleaching Short", harga: 150000, deskripsi: "Bleaching pendek" },
  { id: "SRV-13", nama: "Bleaching Medium", harga: 250000, deskripsi: "Bleaching sedang" },
  { id: "SRV-14", nama: "Bleaching Long", harga: 350000, deskripsi: "Bleaching panjang" },
  { id: "SRV-15", nama: "Highlight Bleaching Short", harga: 150000, deskripsi: "Highlight bleaching pendek" },
  { id: "SRV-16", nama: "Highlight Bleaching Medium", harga: 250000, deskripsi: "Highlight bleaching sedang" },
  { id: "SRV-17", nama: "Highlight Bleaching Long", harga: 350000, deskripsi: "Highlight bleaching panjang" },
  { id: "SRV-18", nama: "Highlight Coloring Short", harga: 250000, deskripsi: "Highlight coloring pendek" },
  { id: "SRV-19", nama: "Highlight Coloring Medium", harga: 350000, deskripsi: "Highlight coloring sedang" },
  { id: "SRV-20", nama: "Highlight Coloring Long", harga: 450000, deskripsi: "Highlight coloring panjang" }
]

export const productsForPOS = inventory.slice(0, 4)

export function getStatus(stok, minimum) {
  if (stok === 0) return "Habis"
  if (stok <= minimum) return "Stok Menipis"
  return "Aman"
}
