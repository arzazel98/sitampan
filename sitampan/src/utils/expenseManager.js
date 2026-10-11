// Operational and Petty Cash Expenses Management for SITAMPAN YK
import { recordExpenseInShift } from './shiftManager'

const EXPENSES_KEY = 'sitampan_expenses'

export const EXPENSE_CATEGORIES = [
  'Perlengkapan Cukur (Silet/Kapas/Bedak)',
  'Konsumsi & Air Galon',
  'Kebersihan & Sanitasi',
  'Listrik, Air & Internet',
  'Perawatan Alat & Mesin Cukur',
  'Lain-lain',
]

const DEFAULT_EXPENSES = [
  {
    id: 'EXP-SAMPLE-1',
    tanggal: new Date(Date.now() - 86400000).toISOString(),
    kategori: 'Konsumsi & Air Galon',
    jumlah: 22000,
    keterangan: 'Refill 1 galon Aqua + es batu',
    dicatatOleh: 'Rizal (Kasir)',
    dariKasKasir: true,
  },
  {
    id: 'EXP-SAMPLE-2',
    tanggal: new Date(Date.now() - 172800000).toISOString(),
    kategori: 'Perlengkapan Cukur (Silet/Kapas/Bedak)',
    jumlah: 45000,
    keterangan: '1 pak silet Feather Hi-Stainless',
    dicatatOleh: 'Ahmad (Owner)',
    dariKasKasir: false,
  },
]

export function getExpenses() {
  try {
    const raw = localStorage.getItem(EXPENSES_KEY)
    if (!raw) {
      localStorage.setItem(EXPENSES_KEY, JSON.stringify(DEFAULT_EXPENSES))
      return DEFAULT_EXPENSES
    }
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : DEFAULT_EXPENSES
  } catch (err) {
    console.error('Error getting expenses:', err)
    return DEFAULT_EXPENSES
  }
}

export function addExpense({
  kategori,
  jumlah,
  keterangan,
  dicatatOleh = 'Kasir',
  dariKasKasir = true,
}) {
  const current = getExpenses()
  const newExp = {
    id: `EXP-${Date.now().toString().slice(-6)}`,
    tanggal: new Date().toISOString(),
    kategori,
    jumlah: Number(jumlah) || 0,
    keterangan: keterangan.trim(),
    dicatatOleh,
    dariKasKasir: Boolean(dariKasKasir),
  }

  // If paid from cashier drawer, log it into active shift automatically
  if (dariKasKasir) {
    recordExpenseInShift({
      amount: newExp.jumlah,
      note: `${kategori}: ${keterangan}`,
      kategori,
    })
  }

  const updated = [newExp, ...current]
  localStorage.setItem(EXPENSES_KEY, JSON.stringify(updated))
  return newExp
}

export function deleteExpense(id) {
  const current = getExpenses()
  const updated = current.filter(e => e.id !== id)
  localStorage.setItem(EXPENSES_KEY, JSON.stringify(updated))
  return updated
}
