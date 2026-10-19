// Barber / Kapster management for SITAMPAN YK
// Dukungan sinkronisasi Supabase Cloud + LocalStorage Offline Fallback

import { supabase } from '../lib/supabase'

const STORAGE_KEY = 'sitampan_barbers'

export const DEFAULT_BARBERS = [
  { id: 'b-1', nama: 'Doni', title: 'Master Barber', komisiRate: 40, status: 'Aktif' },
  { id: 'b-2', nama: 'Budi', title: 'Senior Barber', komisiRate: 40, status: 'Aktif' },
  { id: 'b-3', nama: 'Fajar', title: 'Senior Barber', komisiRate: 40, status: 'Aktif' },
  { id: 'b-4', nama: 'Rizal', title: 'Barber & Stylist', komisiRate: 35, status: 'Aktif' },
]

// Sinkronisasi sinkron (immediate read dari cache lokal)
export function getBarbers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_BARBERS))
      return DEFAULT_BARBERS
    }
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_BARBERS
  } catch (err) {
    console.error('Error reading barbers from storage:', err)
    return DEFAULT_BARBERS
  }
}

export function saveBarbers(barbers) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(barbers))
  } catch (err) {
    console.error('Error saving barbers:', err)
  }
}

// Fetch dari Supabase dengan fallback ke cache lokal
export async function fetchBarbers() {
  try {
    const { data, error } = await supabase
      .from('barbers')
      .select('*')
      .order('nama', { ascending: true })

    if (error) throw error

    if (data && data.length > 0) {
      const formatted = data.map(b => ({
        id: b.id,
        nama: b.nama,
        title: b.title || 'Barber',
        komisiRate: Number(b.komisi_rate ?? b.komisiRate ?? 40),
        status: b.status || 'Aktif',
      }))
      saveBarbers(formatted)
      return formatted
    }

    // Jika tabel masih kosong, seed data default ke Supabase
    const defaults = getBarbers()
    const payload = defaults.map(b => ({
      id: b.id,
      nama: b.nama,
      title: b.title,
      komisi_rate: b.komisiRate,
      status: b.status,
    }))
    await supabase.from('barbers').upsert(payload)
    return defaults
  } catch (err) {
    console.warn('Gagal fetch barbers dari Supabase, gunakan cache:', err)
    return getBarbers()
  }
}

// Tambah Barber baru (simpan lokal + kirim ke Supabase)
export async function addBarber({ nama, title = 'Barber', komisiRate = 40 }) {
  const current = getBarbers()
  const newBarber = {
    id: `b-${Date.now()}`,
    nama: nama.trim(),
    title,
    komisiRate: Number(komisiRate) || 40,
    status: 'Aktif',
  }
  const updated = [...current, newBarber]
  saveBarbers(updated)

  // Cloud sync
  try {
    await supabase.from('barbers').insert({
      id: newBarber.id,
      nama: newBarber.nama,
      title: newBarber.title,
      komisi_rate: newBarber.komisiRate,
      status: newBarber.status,
    })
  } catch (e) {
    console.warn('Gagal sync addBarber ke Supabase:', e)
  }

  return newBarber
}

// Update data barber
export async function updateBarber(id, updates) {
  const current = getBarbers()
  const updated = current.map(b => (b.id === id ? { ...b, ...updates } : b))
  saveBarbers(updated)

  try {
    const payload = {}
    if (updates.nama !== undefined) payload.nama = updates.nama
    if (updates.title !== undefined) payload.title = updates.title
    if (updates.komisiRate !== undefined) payload.komisi_rate = updates.komisiRate
    if (updates.status !== undefined) payload.status = updates.status
    payload.updated_at = new Date().toISOString()

    await supabase.from('barbers').update(payload).eq('id', id)
  } catch (e) {
    console.warn('Gagal sync updateBarber ke Supabase:', e)
  }

  return updated
}

// Hapus barber
export async function deleteBarber(id) {
  const current = getBarbers()
  const updated = current.filter(b => b.id !== id)
  saveBarbers(updated)

  try {
    await supabase.from('barbers').delete().eq('id', id)
  } catch (e) {
    console.warn('Gagal sync deleteBarber ke Supabase:', e)
  }

  return updated
}
