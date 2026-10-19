import { supabase } from '../lib/supabase'

const CACHE_KEY = 'sitampan_customers_cache'

function cacheGet() {
  try { const raw = localStorage.getItem(CACHE_KEY); return raw ? JSON.parse(raw) : [] } catch { return [] }
}
function cacheSet(list) { try { localStorage.setItem(CACHE_KEY, JSON.stringify(list.slice(0, 500))) } catch {} }

export async function fetchCustomers() {
  try {
    const { data, error } = await supabase.from('customers').select('*').order('kunjungan_terakhir', { ascending: false }).limit(500)
    if (error) throw error
    cacheSet(data || [])
    return data || []
  } catch {
    return cacheGet()
  }
}

export async function searchCustomers(q) {
  const all = await fetchCustomers()
  if (!q) return all
  const s = q.toLowerCase()
  return all.filter(c => (c.nama || '').toLowerCase().includes(s) || (c.phone || '').includes(s))
}

export async function upsertCustomerFromTrx({ nama, phone, layananFavorit, total }) {
  const cleanPhone = (phone || '').replace(/[^0-9]/g, '')
  if (!cleanPhone || cleanPhone.length < 10) return null
  const displayPhone = cleanPhone.startsWith('62') ? cleanPhone : cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone
  const finalNama = (nama || '').trim() || 'Pelanggan'
  const amt = Number(total) || 0

  try {
    const { data: existing } = await supabase.from('customers').select('*').eq('phone', displayPhone).maybeSingle()
    if (existing) {
      const upd = {
        nama: finalNama !== 'Pelanggan' ? finalNama : existing.nama,
        total_kunjungan: (existing.total_kunjungan || 0) + 1,
        total_belanja: (Number(existing.total_belanja) || 0) + amt,
        layanan_favorit: layananFavorit || existing.layanan_favorit,
        kunjungan_terakhir: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      const { data, error } = await supabase.from('customers').update(upd).eq('id', existing.id).select().single()
      if (error) throw error
      return data
    }
    const payload = { nama: finalNama, phone: displayPhone, total_kunjungan: 1, total_belanja: amt, layanan_favorit: layananFavorit || null }
    const { data, error } = await supabase.from('customers').insert(payload).select().single()
    if (error) throw error
    return data
  } catch {
    const list = cacheGet()
    const idx = list.findIndex(c => c.phone === displayPhone)
    if (idx >= 0) {
      list[idx] = { ...list[idx], nama: finalNama !== 'Pelanggan' ? finalNama : list[idx].nama, total_kunjungan: (list[idx].total_kunjungan || 0) + 1, total_belanja: (Number(list[idx].total_belanja) || 0) + amt, layanan_favorit: layananFavorit || list[idx].layanan_favorit, kunjungan_terakhir: new Date().toISOString() }
    } else {
      list.unshift({ id: `cust-${Date.now()}`, nama: finalNama, phone: displayPhone, total_kunjungan: 1, total_belanja: amt, layanan_favorit: layananFavorit, kunjungan_terakhir: new Date().toISOString(), created_at: new Date().toISOString() })
    }
    cacheSet(list)
    return list[0]
  }
}

export async function deleteCustomer(id) {
  try {
    const { error } = await supabase.from('customers').delete().eq('id', id)
    if (error) throw error
  } catch {
    const list = cacheGet().filter(c => c.id !== id)
    cacheSet(list)
  }
}
