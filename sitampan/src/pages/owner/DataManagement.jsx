import { useEffect, useState } from 'react'
import { Trash2, ShieldAlert, Database, RotateCcw, Clock, User, RefreshCw } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import Modal from '../../components/common/Modal'
import { fetchTransactionCounts, resetAllTransactions, getResetAuditLog, syncServicesFromLocal } from '../../services/transactionService'
import { services as localServices } from '../../data/inventoryData'

export default function DataManagement() {
  const { profile } = useAuth()
  const [counts, setCounts] = useState({ transactions: 0, items: 0, mutations: 0 })
  const [loading, setLoading] = useState(true)
  const [confirmText, setConfirmText] = useState('')
  const [agree, setAgree] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [audit, setAudit] = useState(() => getResetAuditLog())
  const [done, setDone] = useState(false)

  async function loadCounts() {
    setLoading(true)
    try {
      const c = await fetchTransactionCounts()
      setCounts(c)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { loadCounts() }, [])

  const canReset = agree && confirmText.trim() === 'RESET' && !processing
  const totalRecords = counts.transactions + counts.items + counts.mutations

  async function handleSyncPricelist() {
    if (!confirm('Sinkronkan pricelist dari kode ke Database? Harga layanan di kasir akan terupdate.')) return
    setSyncing(true)
    try {
      await syncServicesFromLocal(localServices)
      alert('Pricelist berhasil disinkronkan ke Database!')
    } catch (e) {
      alert('Gagal sync: ' + e.message)
    } finally {
      setSyncing(false)
    }
  }

  async function handleConfirmReset() {
    if (!canReset) return
    setProcessing(true)
    try {
      await resetAllTransactions({ actorName: profile?.full_name || 'Owner', actorEmail: profile?.email || '' })
      setAudit(getResetAuditLog())
      await loadCounts()
      setDone(true)
      setShowModal(false)
      setConfirmText('')
      setAgree(false)
    } catch (e) {
      alert('Gagal reset: ' + e.message)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-extrabold text-slate-900 text-base flex items-center gap-2"><Database size={18} className="text-indigo-600" /> Manajemen Data (Owner Only)</h2>
          <p className="text-xs text-slate-500 mt-1">Kelola data pricelist dan reset transaksi. Akses eksklusif role OWNER.</p>
        </div>
        <div className="flex gap-2">
            <button onClick={handleSyncPricelist} disabled={syncing} className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold flex items-center gap-2"><RefreshCw size={14} /> {syncing ? 'Menyinkronkan...' : 'Sync Pricelist ke DB'}</button>
            <span className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center gap-1.5"><ShieldAlert size={14} /> Owner</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Transaksi</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{loading ? '...' : counts.transactions}</p>
          <p className="text-xs text-slate-500 mt-1">tabel transactions</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Item Transaksi</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{loading ? '...' : counts.items}</p>
          <p className="text-xs text-slate-500 mt-1">tabel transaction_items</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Mutasi Stok</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{loading ? '...' : counts.mutations}</p>
          <p className="text-xs text-slate-500 mt-1">tabel stock_mutations</p>
        </div>
      </div>

      {done && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 text-emerald-800 text-sm font-semibold">
          <RotateCcw size={16} /> Reset berhasil — semua transaksi, item & mutasi telah dihapus. Local shift & beban juga dibersihkan.
        </div>
      )}

      <div className="bg-white rounded-2xl border border-rose-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-rose-100 bg-rose-50/60">
          <h3 className="font-extrabold text-rose-900 flex items-center gap-2 text-sm"><Trash2 size={16} /> Danger Zone — Reset Semua Transaksi</h3>
          <p className="text-xs text-rose-700 mt-1">Tindakan permanen. Menghapus transactions + transaction_items + stock_mutations di Supabase serta shift & beban lokal. Tidak dapat dibatalkan.</p>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-3.5 text-xs text-slate-700 space-y-1">
            <p className="font-bold">Yang akan dihapus:</p>
            <ul className="list-disc pl-5 space-y-0.5">
              <li>{counts.transactions} transaksi utama</li>
              <li>{counts.items} detail item</li>
              <li>{counts.mutations} log mutasi stok</li>
              <li>Shift aktif + riwayat Z-Report (localStorage)</li>
              <li>Beban/petty cash lokal</li>
            </ul>
            <p className="font-bold pt-1">Yang TIDAK dihapus: katalog products/services, profiles, barbers.</p>
          </div>

          <label className="flex items-start gap-2.5 text-xs font-medium text-slate-700 cursor-pointer">
            <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} className="mt-0.5 w-4 h-4 rounded border-slate-300" />
            <span>Saya memahami ini akan menghapus <b>{totalRecords}</b> record permanen dan telah membackup jika diperlukan.</span>
          </label>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Ketik <span className="font-mono bg-slate-900 text-white px-1.5 py-0.5 rounded">RESET</span> untuk konfirmasi:</label>
            <input value={confirmText} onChange={e => setConfirmText(e.target.value)} placeholder="ketik RESET" className="w-full max-w-xs px-3 py-2.5 text-sm font-mono font-bold border border-slate-200 rounded-xl focus:outline-none focus:border-rose-300" />
          </div>

          <div className="flex gap-2">
            <button disabled={!canReset} onClick={() => setShowModal(true)} className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-black flex items-center gap-2 transition">
              <Trash2 size={14} /> {processing ? 'Memproses...' : 'Reset Semua Transaksi'}
            </button>
            <button onClick={loadCounts} className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5"><RotateCcw size={14} /> Refresh Hitung</button>
          </div>
          <p className="text-[11px] text-slate-400">Alternatif teknisi: jalankan TRUNCATE via Supabase SQL Editor jika akses dashboard tersedia.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2"><Clock size={16} className="text-slate-500" /> Audit Log Reset (50 terbaru)</h3>
          <span className="text-xs text-slate-500 font-medium">{audit.length} entri</span>
        </div>
        {audit.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">Belum ada reset tercatat.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500">
                <tr><th className="px-6 py-3 text-left">Waktu</th><th className="px-6 py-3 text-left">Aktor</th><th className="px-6 py-3 text-left">Aksi</th><th className="px-6 py-3 text-left">ID</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {audit.map(a => (
                  <tr key={a.id} className="text-xs">
                    <td className="px-6 py-3 text-slate-600">{new Date(a.at).toLocaleString('id-ID')}</td>
                    <td className="px-6 py-3 font-semibold text-slate-800 flex items-center gap-1.5"><User size={12} /> {a.actorName} {a.actorEmail ? `(${a.actorEmail})` : ''}</td>
                    <td className="px-6 py-3"><span className="px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[11px]">{a.action}</span></td>
                    <td className="px-6 py-3 font-mono text-[11px]">{a.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <Modal open={showModal} onClose={() => !processing && setShowModal(false)} title="Konfirmasi Akhir — Reset Permanen">
          <div className="space-y-4">
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
              <p className="font-bold">Anda akan menghapus {totalRecords} record transaksi selamanya.</p>
              <p className="mt-1">Operator: <b>{profile?.full_name}</b> ({profile?.email}). Aksi dicatat di audit log.</p>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowModal(false)} disabled={processing} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold disabled:opacity-50">Batal</button>
              <button onClick={handleConfirmReset} disabled={processing} className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-50">{processing ? 'Menghapus...' : 'Ya, Hapus Permanen'}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
