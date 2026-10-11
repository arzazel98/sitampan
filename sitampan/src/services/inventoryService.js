import { supabase } from '../lib/supabase'
export async function fetchProducts(opts = {}) {
  let q = supabase.from('products').select('*').order('kode', { ascending: true })
  if (opts.activeOnly) q = q.eq('is_active', true)
  if (opts.category) q = q.eq('kategori', opts.category)
  const { data, error } = await q
  if (error) throw error
  return data
}
export async function createProduct(payload) {
  const { data, error } = await supabase.from('products').insert(payload).select().single()
  if (error) throw error
  return data
}
export async function updateProduct(id, patch) {
  const { data, error } = await supabase.from('products').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data
}
export async function softDeleteProduct(id) {
  const { data, error } = await supabase.from('products').update({ is_active: false }).eq('id', id).select().single()
  if (error) throw error
  return data
}
export async function stockIn(productId, qty, note, userId) {
  const { data: p, error: e1 } = await supabase.from('products').select('stok,id,nama').eq('id', productId).single()
  if (e1) throw e1
  const before = p.stok
  const after = before + qty
  const { error: e2 } = await supabase.from('products').update({ stok: after }).eq('id', productId)
  if (e2) throw e2
  const { error: e3 } = await supabase.from('stock_mutations').insert({
    product_id: productId, produk_nama: p.nama, jenis: 'Barang Masuk', jumlah: qty, sebelum: before, sesudah: after, pengguna: userId || 'System', note
  })
  if (e3) throw e3
  return { before, after }
}
export async function stockOut(productId, qty, reason, userId) {
  const { data: p, error: e1 } = await supabase.from('products').select('stok,id,nama').eq('id', productId).single()
  if (e1) throw e1
  if (qty > p.stok) throw new Error('Stok tidak mencukupi')
  const before = p.stok
  const after = before - qty
  const { error: e2 } = await supabase.from('products').update({ stok: after }).eq('id', productId)
  if (e2) throw e2
  const { error: e3 } = await supabase.from('stock_mutations').insert({
    product_id: productId, produk_nama: p.nama, jenis: 'Barang Keluar', jumlah: -qty, sebelum: before, sesudah: after, pengguna: userId || 'System', note: reason
  })
  if (e3) throw e3
  return { before, after }
}
