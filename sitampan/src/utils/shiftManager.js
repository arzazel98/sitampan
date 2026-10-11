// Cashier Shift Management (Buka & Tutup Kasir, X & Z Report) for SITAMPAN YK

const ACTIVE_SHIFT_KEY = 'sitampan_active_shift'
const SHIFT_HISTORY_KEY = 'sitampan_shift_history'

export function getActiveShift() {
  try {
    const raw = localStorage.getItem(ACTIVE_SHIFT_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch (err) {
    console.error('Error getting active shift:', err)
    return null
  }
}

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
  return newShift
}

export function recordSaleInShift({ paymentMethod = 'Cash', amount = 0, trxId = '' }) {
  const shift = getActiveShift()
  if (!shift) return null

  const amt = Number(amount) || 0
  const isCash = paymentMethod.toLowerCase() === 'cash' || paymentMethod.toLowerCase() === 'tunai'

  shift.totalSales = (shift.totalSales || 0) + amt
  shift.transactionCount = (shift.transactionCount || 0) + 1

  if (isCash) {
    shift.cashSales = (shift.cashSales || 0) + amt
  } else {
    shift.qrisSales = (shift.qrisSales || 0) + amt
  }

  localStorage.setItem(ACTIVE_SHIFT_KEY, JSON.stringify(shift))
  return shift
}

export function recordExpenseInShift({ amount = 0, note = '', kategori = '' }) {
  const shift = getActiveShift()
  if (!shift) return null

  shift.cashExpenses = (shift.cashExpenses || 0) + (Number(amount) || 0)
  localStorage.setItem(ACTIVE_SHIFT_KEY, JSON.stringify(shift))
  return shift
}

export function closeShift({ actualCash = 0, closingNote = '' }) {
  const shift = getActiveShift()
  if (!shift) throw new Error('Tidak ada shift kasir yang sedang aktif!')

  const closedAt = new Date().toISOString()
  const startingCash = Number(shift.startingCash) || 0
  const cashSales = Number(shift.cashSales) || 0
  const cashExpenses = Number(shift.cashExpenses) || 0
  const qrisSales = Number(shift.qrisSales) || 0
  const totalSales = Number(shift.totalSales) || 0
  const enteredActualCash = Number(actualCash) || 0

  // Expected cash inside the drawer: Starting Cash + Cash Sales - Cash Expenses
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

  // Save to shift history
  try {
    const rawHist = localStorage.getItem(SHIFT_HISTORY_KEY)
    const history = rawHist ? JSON.parse(rawHist) : []
    history.unshift(closedShift)
    localStorage.setItem(SHIFT_HISTORY_KEY, JSON.stringify(history.slice(0, 100))) // keep last 100 shifts
  } catch (err) {
    console.error('Error saving shift history:', err)
  }

  // Remove active shift
  localStorage.removeItem(ACTIVE_SHIFT_KEY)
  return closedShift
}

export function getShiftHistory() {
  try {
    const raw = localStorage.getItem(SHIFT_HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch (err) {
    console.error('Error loading shift history:', err)
    return []
  }
}
