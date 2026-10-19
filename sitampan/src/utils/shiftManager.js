// Cashier Shift Management (Buka & Tutup Kasir, X & Z Report) for SITAMPAN YK
// Terintegrasi Cloud Supabase + LocalStorage Cache untuk Offline Fallback

import { supabase } from '../lib/supabase'

const ACTIVE_SHIFT_KEY = 'sitampan_active_shift'
const SHIFT_HISTORY_KEY = 'sitampan_shift_history'

// Helper format data dari DB (snake_case) ke format aplikasi (camelCase)
export function formatShift(row) {
  if (!row) return null
  return {
    id: row.id,
    cashierName: row.cashier_name || row.cashierName || 'Kasir',
    openedAt: row.opened_at || row.openedAt,
    closedAt: row.closed_at || row.closedAt,
    startingCash: Number(row.starting_cash ?? row.startingCash ?? 0),
    cashSales: Number(row.cash_sales ?? row.cashSales ?? 0),
    qrisSales: Number(row.qris_sales ?? row.qrisSales ?? 0),
    totalSales: Number(row.total_sales ?? row.totalSales ?? 0),
    transactionCount: Number(row.transaction_count ?? row.transactionCount ?? 0),
    cashExpenses: Number(row.cash_expenses ?? row.cashExpenses ?? 0),
    actualCash: Number(row.actual_cash ?? row.actualCash ?? 0),
    expectedCash: Number(row.expected_cash ?? row.expectedCash ?? 0),
    discrepancy: Number(row.discrepancy ?? 0),
    closingNote: row.closing_note || row.closingNote || '',
    note: row.note || '',
    status: row.status || 'OPEN',
  }
}

// 1. Ambil Active Shift secara Sinkron (Cache Lokal)
export function getActiveShift() {
  try {
    const raw = localStorage.getItem(ACTIVE_SHIFT_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch (err) {
    console.error('Error getting active shift from storage:', err)
    return null
  }
}

// 2. Fetch Active Shift dari Supabase Cloud (agar Owner bisa pantau realtime dari HP)
export async function fetchActiveShiftCloud() {
  try {
    const { data, error } = await supabase
      .from('cashier_shifts')
      .select('*')
      .eq('status', 'OPEN')
      .order('opened_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error

    if (data) {
      const formatted = formatShift(data)
      localStorage.setItem(ACTIVE_SHIFT_KEY, JSON.stringify(formatted))
      return formatted
    } else {
      // Tidak ada shift open di cloud
      return null
    }
  } catch (err) {
    console.warn('Gagal ambil active shift dari Supabase, gunakan cache lokal:', err)
    return getActiveShift()
  }
}

// 3. Buka Shift Kasir Baru (Simpan Lokal + Sync ke Supabase)
export function openShift({ cashierName = 'Kasir', startingCash = 0, note = '' }) {
  const existing = getActiveShift()
  if (existing) {
    return existing
  }

  const newShift = {
    id: `SHIFT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-4)}`,
    cashierName,
    openedAt: new Date().toISOString(),
    startingCash: Number(startingCash) || 0,
    cashSales: 0,
    qrisSales: 0,
    totalSales: 0,
    transactionCount: 0,
    cashExpenses: 0,
    note,
    status: 'OPEN',
  }

  localStorage.setItem(ACTIVE_SHIFT_KEY, JSON.stringify(newShift))

  // Sync ke Supabase
  supabase
    .from('cashier_shifts')
    .upsert({
      id: newShift.id,
      cashier_name: newShift.cashierName,
      opened_at: newShift.openedAt,
      starting_cash: newShift.startingCash,
      cash_sales: 0,
      qris_sales: 0,
      total_sales: 0,
      transaction_count: 0,
      cash_expenses: 0,
      note: newShift.note,
      status: 'OPEN',
    })
    .then(() => {})
    .catch(e => console.warn('Gagal simpan openShift ke Supabase:', e))

  return newShift
}

// 4. Catat Transaksi Penjualan pada Shift (Termasuk Dukungan Split Payment)
export function recordSaleInShift({ paymentMethod = 'Cash', amount = 0, trxId = '', splitCash = 0, splitQris = 0 }) {
  const shift = getActiveShift()
  if (!shift) return null

  const amt = Number(amount) || 0
  const method = (paymentMethod || '').toLowerCase()
  const isSplit = method.includes('split')
  const isCash = method === 'cash' || method === 'tunai'

  shift.totalSales = (shift.totalSales || 0) + amt
  shift.transactionCount = (shift.transactionCount || 0) + 1

  if (isSplit) {
    shift.cashSales = (shift.cashSales || 0) + (Number(splitCash) || 0)
    shift.qrisSales = (shift.qrisSales || 0) + (Number(splitQris) || 0)
  } else if (isCash) {
    shift.cashSales = (shift.cashSales || 0) + amt
  } else {
    shift.qrisSales = (shift.qrisSales || 0) + amt
  }

  localStorage.setItem(ACTIVE_SHIFT_KEY, JSON.stringify(shift))

  // Sync update ke Supabase
  supabase
    .from('cashier_shifts')
    .update({
      total_sales: shift.totalSales,
      transaction_count: shift.transactionCount,
      cash_sales: shift.cashSales,
      qris_sales: shift.qrisSales,
      updated_at: new Date().toISOString(),
    })
    .eq('id', shift.id)
    .then(() => {})
    .catch(e => console.warn('Gagal sync recordSaleInShift ke Supabase:', e))

  return shift
}

// 5. Catat Pengeluaran Beban dari Laci Kasir pada Shift
export function recordExpenseInShift({ amount = 0, note = '', kategori = '' }) {
  const shift = getActiveShift()
  if (!shift) return null

  shift.cashExpenses = (shift.cashExpenses || 0) + (Number(amount) || 0)
  localStorage.setItem(ACTIVE_SHIFT_KEY, JSON.stringify(shift))

  // Sync update ke Supabase
  supabase
    .from('cashier_shifts')
    .update({
      cash_expenses: shift.cashExpenses,
      updated_at: new Date().toISOString(),
    })
    .eq('id', shift.id)
    .then(() => {})
    .catch(e => console.warn('Gagal sync recordExpenseInShift ke Supabase:', e))

  return shift
}

// 6. Tutup Shift Kasir (Simpan Lokal + Sync ke Supabase)
export function closeShift({ actualCash = 0, closingNote = '' }) {
  const shift = getActiveShift()
  if (!shift) throw new Error('Tidak ada shift kasir yang sedang aktif!')

  const closedAt = new Date().toISOString()
  const startingCash = Number(shift.startingCash) || 0
  const cashSales = Number(shift.cashSales) || 0
  const cashExpenses = Number(shift.cashExpenses) || 0
  const enteredActualCash = Number(actualCash) || 0

  // Expected cash inside drawer: Starting Cash + Cash Sales - Cash Expenses
  const expectedCash = startingCash + cashSales - cashExpenses
  const discrepancy = enteredActualCash - expectedCash // > 0: lebih, < 0: kurang, 0: pas

  const closedShift = {
    ...shift,
    closedAt,
    actualCash: enteredActualCash,
    expectedCash,
    discrepancy,
    closingNote,
    status: 'CLOSED',
  }

  // Simpan ke riwayat lokal
  try {
    const rawHist = localStorage.getItem(SHIFT_HISTORY_KEY)
    const history = rawHist ? JSON.parse(rawHist) : []
    history.unshift(closedShift)
    localStorage.setItem(SHIFT_HISTORY_KEY, JSON.stringify(history.slice(0, 100)))
  } catch (err) {
    console.error('Error saving shift history:', err)
  }

  // Hapus shift aktif dari penyimpanan lokal
  localStorage.removeItem(ACTIVE_SHIFT_KEY)

  // Sync penutupan shift ke Supabase
  supabase
    .from('cashier_shifts')
    .update({
      closed_at: closedAt,
      actual_cash: enteredActualCash,
      expected_cash: expectedCash,
      discrepancy,
      closing_note: closingNote,
      status: 'CLOSED',
      updated_at: new Date().toISOString(),
    })
    .eq('id', shift.id)
    .then(() => {})
    .catch(e => console.warn('Gagal sync closeShift ke Supabase:', e))

  return closedShift
}

// 7. Ambil Riwayat Shift dari Cache Lokal
export function getShiftHistory() {
  try {
    const raw = localStorage.getItem(SHIFT_HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch (err) {
    console.error('Error loading shift history:', err)
    return []
  }
}

// 8. Fetch Riwayat Shift dari Supabase Cloud (Bisa diakses Owner dari mana saja)
export async function fetchShiftHistoryCloud() {
  try {
    const { data, error } = await supabase
      .from('cashier_shifts')
      .select('*')
      .eq('status', 'CLOSED')
      .order('opened_at', { ascending: false })
      .limit(100)

    if (error) throw error

    if (data && data.length > 0) {
      const formatted = data.map(formatShift)
      localStorage.setItem(SHIFT_HISTORY_KEY, JSON.stringify(formatted))
      return formatted
    }
    return getShiftHistory()
  } catch (err) {
    console.warn('Gagal fetch shift history dari Supabase, gunakan cache lokal:', err)
    return getShiftHistory()
  }
}
