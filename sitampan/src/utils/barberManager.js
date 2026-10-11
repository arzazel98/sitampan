// Barber / Kapster management for SITAMPAN YK

const STORAGE_KEY = 'sitampan_barbers'

const DEFAULT_BARBERS = [
  { id: 'b-1', nama: 'Doni', title: 'Master Barber', komisiRate: 40, status: 'Aktif' },
  { id: 'b-2', nama: 'Budi', title: 'Senior Barber', komisiRate: 40, status: 'Aktif' },
  { id: 'b-3', nama: 'Fajar', title: 'Senior Barber', komisiRate: 40, status: 'Aktif' },
  { id: 'b-4', nama: 'Rizal', title: 'Barber & Stylist', komisiRate: 35, status: 'Aktif' },
]

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

export function addBarber({ nama, title = 'Barber', komisiRate = 40 }) {
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
  return newBarber
}
