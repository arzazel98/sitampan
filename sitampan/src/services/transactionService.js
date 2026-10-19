import { supabase } from '../lib/supabase'
import { upsertCustomerFromTrx } from './customerService'

export async function createTransaction({ items, total, metode, cashierId, customerName, customerPhone }) {
  const trxId = `TRX-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`
  const { error: txErr } = await supabase.from('transactions').insert({
    id: trxId, total, metode, kasir: cashierId || 'Kasir', pelanggan: customerName || 'Walk-in', status: 'Berhasil'
  })
  if (txErr) throw txErr

  // Auto-save customer
  if (customerPhone) {
    const srvItems = (items || []).filter(i => i.type === 'service').map(i => i.nama).join(', ')
    upsertCustomerFromTrx({ nama: customerName, phone: customerPhone, layananFavorit: srvItems || null, total }).then(() => {})
  }

  for (const item of items) {
    const { error: e1 } = await supabase.from('transaction_items').insert({
      transaction_id: trxId, item_id: item.key, nama: item.nama, harga: item.harga, qty: item.qty, type: item.type
    })
    if (e1) throw e1
    if (item.type === 'product') {
      const { data: p, error: e2 } = await supabase.from('products').select('stok,id').eq('id', item.id || item.kode).single()
      if (e2) throw e2
      const next = (Number(p.stok) || 0) - item.qty
      await supabase.from('products').update({ stok: next }).eq('id', p.id)
      await supabase.from('stock_mutations').insert({
        product_id: p.id, produk_nama: item.nama, jenis: 'Penjualan', jumlah: -item.qty, sebelum: p.stok, sesudah: next, pengguna: cashierId || 'Kasir', note: `Penjualan ${trxId}`
      })
    }
  }
  return trxId
}

export async function voidTransaction(trxId, { reason, voidBy }) {
  try {
    const { data: trx, error: e0 } = await supabase.from('transactions').select('*, transaction_items(*)').eq('id', trxId).single()
    if (e0) throw e0
    if (trx.status === 'VOID') throw new Error('Transaksi sudah dibatalkan sebelumnya.')

    // 1. Mark status
    const { error: e1 } = await supabase.from('transactions').update({
      status: 'VOID', void_reason: reason, void_by: voidBy || 'Owner', void_at: new Date().toISOString()
    }).eq('id', trxId)
    if (e1) throw e1

    // 2. Revert stock
    for (const item of (trx.transaction_items || [])) {
      if (item.type === 'product') {
        const { data: p } = await supabase.from('products').select('stok,id,nama').eq('id', item.item_id).maybeSingle()
        if (p) {
          const before = Number(p.stok) || 0
          const after = before + (Number(item.qty) || 0)
          await supabase.from('products').update({ stok: after }).eq('id', p.id)
          await supabase.from('stock_mutations').insert({
            product_id: p.id, produk_nama: p.nama, jenis: 'VOID (Pembatalan)', jumlah: item.qty, sebelum: before, sesudah: after, pengguna: voidBy || 'Owner', note: `VOID Trx ${trxId}`
          })
        }
      }
    }
    return true
  } catch (e) {
    console.error('Void error:', e)
    throw e
  }
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

export async function syncServicesFromLocal(localServices) {
  // 1. Ambil ID existing untuk menghindari duplikasi jika nama sama
  // Namun cara teraman adalah truncate dan insert ulang jika pricelist adalah master data
  const { error: delErr } = await supabase.from('services').delete().neq('nama', '__NEVER__')
  if (delErr) throw delErr

  const payload = localServices.map(s => ({
    nama: s.nama,
    harga: s.harga,
    deskripsi: s.deskripsi || ''
  }))

  const { error: insErr } = await supabase.from('services').insert(payload)
  if (insErr) throw insErr
}
