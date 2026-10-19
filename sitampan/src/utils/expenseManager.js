// Operational and Petty Cash Expenses Management for SITAMPAN YK
import { recordExpenseInShift } from './shiftManager'
import { supabase } from '../lib/supabase'

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

function mapDbToLocal(r) {
  return {
    id: r.id,
    tanggal: r.tanggal || r.created_at,
    kategori: r.kategori,
    jumlah: Number(r.jumlah),
    keterangan: r.keterangan,
    dicatatOleh: r.dicatat_oleh,
    dariKasKasir: !!r.dari_kas_kasir,
    status: r.status || 'APPROVED',
    approvedBy: r.approved_by || null,
    approvedAt: r.approved_at || null,
  }
}

function persistLocal(list) {
  try { localStorage.setItem(EXPENSES_KEY, JSON.stringify(list)) } catch {}
}

export async function fetchExpensesDb() {
  try {
    const { data, error } = await supabase.from('expenses').select('*').order('tanggal', { ascending: false }).limit(200)
    if (error) throw error
    const mapped = (data || []).map(mapDbToLocal)
    persistLocal(mapped)
    return mapped
  } catch {
    return getExpenses()
  }
}

export async function submitExpenseDb({ kategori, jumlah, keterangan, dicatatOleh = 'Kasir', dariKasKasir = true }) {
  const fallback = addExpense({ kategori, jumlah, keterangan, dicatatOleh, dariKasKasir: false, status: 'PENDING' })
  try {
    const { data, error } = await supabase.from('expenses').insert({
      kategori, jumlah: Number(jumlah) || 0, keterangan: keterangan.trim(),
      dicatat_oleh: dicatatOleh, dari_kas_kasir: Boolean(dariKasKasir), status: 'PENDING',
    }).select().single()
    if (error) throw error
    const mapped = mapDbToLocal(data)
    const current = getExpenses().filter(e => e.id !== fallback.id)
    persistLocal([mapped, ...current])
    return mapped
  } catch {
    return fallback
  }
}

export async function approveExpenseDb(id, approverName) {
  try {
    const { data, error } = await supabase.from('expenses').update({
      status: 'APPROVED', approved_by: approverName || 'Owner', approved_at: new Date().toISOString(),
    }).eq('id', id).select().single()
    if (error) throw error
    const mapped = mapDbToLocal(data)
    if (mapped.dariKasKasir) {
      recordExpenseInShift({ amount: mapped.jumlah, note: `${mapped.kategori}: ${mapped.keterangan}`, kategori: mapped.kategori })
    }
    persistLocal(getExpenses().map(e => (e.id === id ? mapped : e)))
    return mapped
  } catch {
    const updated = getExpenses().map(e => (e.id === id ? { ...e, status: 'APPROVED', approvedBy: approverName || 'Owner', approvedAt: new Date().toISOString() } : e))
    persistLocal(updated)
    const item = updated.find(e => e.id === id)
    if (item?.dariKasKasir) recordExpenseInShift({ amount: item.jumlah, note: `${item.kategori}: ${item.keterangan}`, kategori: item.kategori })
    return item
  }
}

export async function rejectExpenseDb(id, approverName) {
  try {
    const { error } = await supabase.from('expenses').update({
      status: 'REJECTED', approved_by: approverName || 'Owner', approved_at: new Date().toISOString(),
    }).eq('id', id)
    if (error) throw error
  } catch {}
  const updated = getExpenses().map(e => (e.id === id ? { ...e, status: 'REJECTED', approvedBy: approverName || 'Owner', approvedAt: new Date().toISOString() } : e))
  persistLocal(updated)
  return updated
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
