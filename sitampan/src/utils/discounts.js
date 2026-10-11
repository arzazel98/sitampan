// Preset and custom discount calculation for SITAMPAN YK

export const PRESET_DISCOUNTS = [
  { id: 'none', label: 'Tanpa Diskon', type: 'nominal', value: 0 },
  { id: 'pelajar', label: 'Diskon Pelajar / Mahasiswa (10%)', type: 'percent', value: 10 },
  { id: 'jumat', label: 'Promo Jumat Berkah (Rp 10.000)', type: 'nominal', value: 10000 },
  { id: 'member', label: 'Voucher Member Setia (Rp 5.000)', type: 'nominal', value: 5000 },
]

export function calculateDiscount(subtotal, discountObj) {
  if (!discountObj || subtotal <= 0) {
    return { discountAmount: 0, finalTotal: Math.max(0, subtotal) }
  }

  let amount = 0
  if (discountObj.type === 'percent') {
    const pct = Math.min(100, Math.max(0, Number(discountObj.value) || 0))
    amount = Math.round((subtotal * pct) / 100)
  } else if (discountObj.type === 'nominal') {
    amount = Math.max(0, Number(discountObj.value) || 0)
  }

  // Discount cannot exceed subtotal
  const discountAmount = Math.min(subtotal, amount)
  const finalTotal = Math.max(0, subtotal - discountAmount)

  return {
    discountAmount,
    finalTotal,
  }
}
