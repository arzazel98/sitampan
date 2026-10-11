export function formatRp(n) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n ?? 0)
}
export function getStatus(stok, minimum) {
  if (stok === 0) return 'Habis'
  if (stok <= minimum) return 'Stok Menipis'
  return 'Aman'
}
