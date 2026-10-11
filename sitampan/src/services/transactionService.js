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
