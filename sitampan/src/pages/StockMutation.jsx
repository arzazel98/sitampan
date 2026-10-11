import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import Modal from '../components/common/Modal'
import { Plus, ShieldAlert, ArrowDownToLine, CheckCircle2, History } from 'lucide-react'

export default function StockMutation() {
  const { isOwner, profile } = useAuth()
  const [mutations, setMutations] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filterJenis, setFilterJenis] = useState('Semua Jenis')

  // Owner restock modal
  const [modalOpen, setModalOpen] = useState(false)
  const [targetProduct, setTargetProduct] = useState(null)
  const [qty, setQty] = useState(10)
  const [note, setNote] = useState('Restock pengadaan barang')
  const [submitting, setSubmitting] = useState(false)

  async function fetchMutations() {
    setLoading(true)
    setError(null)
    try {
      let query = supabase
        .from('stock_mutations')
        .select('*')
        .order('tanggal', { ascending: false })

      if (filterJenis !== 'Semua Jenis') {
        query = query.eq('jenis', filterJenis)
      }
      const [mRes, pRes] = await Promise.all([
        query,
        supabase.from('products').select('*').order('nama'),
      ])

      if (mRes.error) throw mRes.error
      setMutations(mRes.data || [])
      setProducts(pRes.data || [])
      if (pRes.data?.length > 0 && !targetProduct) {
        setTargetProduct(pRes.data[0])
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMutations()
  }, [filterJenis])

  async function handleRestockSubmit(e) {
    e.preventDefault()
    if (!isOwner) {
      alert('Akses Ditolak: Hanya role OWNER yang berwenang menambah stok / mutasi barang masuk.')
      return
    }
    if (!targetProduct || qty <= 0) return

    setSubmitting(true)
    try {
      const newStock = Number(targetProduct.stok || 0) + Number(qty)
      // 1. Update product stock
      const { error: pErr } = await supabase
        .from('products')
        .update({ stok: newStock })
        .eq('id', targetProduct.id)

      if (pErr) throw pErr

      // 2. Insert audit log
      await supabase.from('stock_mutations').insert({
        product_id: targetProduct.id,
        produk_nama: targetProduct.nama,
        jenis: 'Barang Masuk',
        jumlah: Number(qty),
        sebelum: targetProduct.stok,
        sesudah: newStock,
        pengguna: profile?.full_name || 'Owner Ahmad',
        note: note ? `[Owner Restock] ${note}` : 'Restock resmi oleh Owner',
      })

      setModalOpen(false)
      fetchMutations()
    } catch (err) {
      alert('Gagal mencatat mutasi: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading && mutations.length === 0) {
    return <div className="p-8 text-center text-slate-500">Memuat mutasi stok...</div>
  }
  if (error) {
    return (
      <div className="p-8 text-center text-red-600">
        Gagal memuat: {error}{' '}
        <button onClick={fetchMutations} className="ml-2 underline font-semibold">
          Coba lagi
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-900 text-lg">
                Histori Mutasi Stok
              </h3>
              {isOwner ? (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Akses Owner (Penuh)
                </span>
              ) : (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Akses Kasir (Hanya Baca)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Catatan audit pergerakan keluar-masuk stok persediaan toko.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterJenis}
              onChange={e => setFilterJenis(e.target.value)}
              className="text-xs sm:text-sm font-semibold border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option>Semua Jenis</option>
              <option>Barang Masuk</option>
              <option>Penjualan</option>
              <option>Barang Keluar</option>
            </select>

            {isOwner && (
              <button
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition"
              >
                <Plus size={16} />
                <span>+ Catat Barang Masuk</span>
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80 text-slate-500 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5 text-left">Waktu</th>
                <th className="px-6 py-3.5 text-left">Produk</th>
                <th className="px-6 py-3.5 text-left">Jenis Mutasi</th>
                <th className="px-6 py-3.5 text-center">Jumlah</th>
                <th className="px-6 py-3.5 text-left">Oleh</th>
                <th className="px-6 py-3.5 text-center">Stok Sebelum</th>
                <th className="px-6 py-3.5 text-center">Stok Sesudah</th>
                <th className="px-6 py-3.5 text-left">Keterangan / Ref</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mutations.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-slate-400 text-sm">
                    Belum ada riwayat mutasi stok.
                  </td>
                </tr>
              ) : (
                mutations.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                      {m.tanggal ? new Date(m.tanggal).toLocaleString('id-ID') : '-'}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 whitespace-nowrap text-xs sm:text-sm">
                      {m.produk_nama || m.produk}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          m.jenis === 'Penjualan'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : m.jenis === 'Barang Masuk'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {m.jenis}
                      </span>
                    </td>
                    <td
                      className={`px-6 py-4 text-center font-extrabold text-xs sm:text-sm ${
                        Number(m.jumlah) > 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {Number(m.jumlah) > 0 ? `+${m.jumlah}` : m.jumlah}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-700">
                      {m.pengguna || 'System'}
                    </td>
                    <td className="px-6 py-4 text-center text-xs text-slate-500">
                      {m.sebelum ?? '-'}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-xs sm:text-sm text-slate-800">
                      {m.sesudah ?? '-'}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 truncate max-w-[200px]">
                      {m.note || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Owner-Only Restock Modal */}
      {modalOpen && (
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Input Barang Masuk (Restock Gudang)"
        >
          <form onSubmit={handleRestockSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Pilih Produk
              </label>
              <select
                value={targetProduct?.id || ''}
                onChange={e => {
                  const p = products.find(prod => prod.id === e.target.value)
                  setTargetProduct(p)
                }}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium"
                required
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.kode} - {p.nama} (Stok Saat Ini: {p.stok} pcs)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jumlah Tambahan (pcs)
                </label>
                <input
                  type="number"
                  min="1"
                  value={qty}
                  onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Stok Sesudah
                </label>
                <input
                  type="text"
                  disabled
                  value={
                    targetProduct
                      ? `${Number(targetProduct.stok || 0) + Number(qty || 0)} pcs`
                      : '-'
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-100 bg-slate-50 text-slate-600 text-sm font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Catatan / Supplier / No. Surat Jalan
              </label>
              <input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Contoh: Pengiriman dari Supplier Pomade / No. SJ 891"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50"
              >
                {submitting ? 'Menyimpan...' : 'Simpan Barang Masuk'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
