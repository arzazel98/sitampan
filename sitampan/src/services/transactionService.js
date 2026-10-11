import { supabase } from '../lib/supabase'
export async function createTransaction({ items, total, metode, cashierId }) {
  const trxId = `TRX-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`
  const { error: txErr } = await supabase.from('transactions').insert({
    id: trxId, total, metode, kasir: cashierId || 'Kasir', pelanggan: 'Walk-in', status: 'Berhasil'
  })
  if (txErr) throw txErr
  for (const item of items) {
    const { error: e1 } = await supabase.from('transaction_items').insert({
      transaction_id: trxId, item_id: item.key, nama: item.nama, harga: item.harga, qty: item.qty, type: item.type
    })
    if (e1) throw e1
    if (item.type === 'product') {
      const { data: p, error: e2 } = await supabase.from('products').select('stok,id').eq('kode', item.kode).single()
      if (e2) throw e2
      if (item.qty > p.stok) throw new Error(`Stok ${item.nama} tidak mencukupi`)
      const next = p.stok - item.qty
      const { error: e3 } = await supabase.from('products').update({ stok: next }).eq('id', p.id)
      if (e3) throw e3
      const { error: e4 } = await supabase.from('stock_mutations').insert({
        product_id: p.id, produk_nama: item.nama, jenis: 'Penjualan', jumlah: -item.qty, sebelum: p.stok, sesudah: next, pengguna: cashierId || 'Kasir', note: `Penjualan ${trxId}`
      })
      if (e4) throw e4
    }
  }
  return trxId
}
export async function fetchRecentTransactions(limit = 20) {
  const { data, error } = await supabase.from('transactions').select('*, transaction_items(*)').order('created_at', { ascending: false }).limit(limit)
  if (error) throw error
  return data
}

const AUDIT_KEY = 'sitampan_reset_audit'

export function getResetAuditLog() {
  try {
    const raw = localStorage.getItem(AUDIT_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function pushResetAudit(entry) {
  try {
    const log = getResetAuditLog()
    log.unshift({ ...entry, at: new Date().toISOString(), id: `RST-${Date.now()}` })
    localStorage.setItem(AUDIT_KEY, JSON.stringify(log.slice(0, 50)))
  } catch {}
}

export async function resetAllTransactions({ actorName, actorEmail } = {}) {
  const { error: e1 } = await supabase.from('transaction_items').delete().neq('transaction_id', '__NEVER__')
  if (e1) throw e1
  const { error: e2 } = await supabase.from('stock_mutations').delete().neq('produk_nama', '__NEVER__')
  if (e2 && !String(e2.message).includes('produk_nama')) {
    const { error: e2b } = await supabase.from('stock_mutations').delete().gte('jumlah', -999999999)
    if (e2b) throw e2b
  } else if (e2) { throw e2 }
  const { error: e3 } = await supabase.from('transactions').delete().neq('id', '__NEVER__')
  if (e3) throw e3
  try {
    localStorage.removeItem('sitampan_active_shift')
    localStorage.removeItem('sitampan_shift_history')
    localStorage.removeItem('sitampan_expenses')
  } catch {}
  pushResetAudit({ actorName: actorName || 'Owner', actorEmail: actorEmail || '', action: 'RESET_ALL_TRANSAKSI' })
}

export async function fetchTransactionCounts() {
  const [t, i, m] = await Promise.all([
    supabase.from('transactions').select('id', { count: 'exact', head: true }),
    supabase.from('transaction_items').select('transaction_id', { count: 'exact', head: true }),
    supabase.from('stock_mutations').select('id', { count: 'exact', head: true }),
  ])
  return {
    transactions: t.count ?? 0,
    items: i.count ?? 0,
    mutations: m.count ?? 0,
  }
}
