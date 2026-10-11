import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getStatus } from '../lib/utils'
import StockAlert from '../components/StockAlert'
import { Package, ShieldCheck, AlertTriangle, XCircle } from 'lucide-react'

export default function Inventory() {
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function fetchInventory() {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase.from('products').select('*').order('kode', { ascending: true })
    if (error) setError(error.message)
    else setInventory(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchInventory() }, [])

  const total = inventory.length
  const aman = inventory.filter(i=>i.stok>i.minimum).length
  const menipis = inventory.filter(i=>i.stok>0 && i.stok<=i.minimum).length
  const habis = inventory.filter(i=>i.stok===0).length

  if (loading) return <div className="p-8 text-center text-slate-500">Memuat persediaan...</div>
  if (error) return <div className="p-8 text-center text-red-600">Gagal memuat: {error} <button onClick={fetchInventory} className="ml-2 underline">Coba lagi</button></div>

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center justify-between"><div><p className="text-sm text-slate-500">Total Produk</p><p className="text-2xl font-bold">{total}</p></div><div className="p-3 bg-slate-900 text-white rounded-xl"><Package size={20}/></div></div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center justify-between"><div><p className="text-sm text-slate-500">Stok Aman</p><p className="text-2xl font-bold text-emerald-600">{aman}</p></div><div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl"><ShieldCheck size={20}/></div></div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center justify-between"><div><p className="text-sm text-slate-500">Stok Menipis</p><p className="text-2xl font-bold text-amber-600">{menipis}</p></div><div className="p-3 bg-amber-100 text-amber-600 rounded-xl"><AlertTriangle size={20}/></div></div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center justify-between"><div><p className="text-sm text-slate-500">Stok Habis</p><p className="text-2xl font-bold text-red-600">{habis}</p></div><div className="p-3 bg-red-100 text-red-600 rounded-xl"><XCircle size={20}/></div></div>
      </div>

      <StockAlert items={inventory} />

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Monitoring Persediaan</h3>
          <span className="text-xs bg-slate-100 px-3 py-1 rounded-full">Live dari Supabase</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr><th className="px-6 py-3 text-left">Kode</th><th className="px-6 py-3 text-left">Produk</th><th className="px-6 py-3 text-left">Kategori</th><th className="px-6 py-3 text-center">Stok</th><th className="px-6 py-3 text-center">Minimum</th><th className="px-6 py-3 text-center">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inventory.map(i=>{
                const status=getStatus(i.stok,i.minimum)
                return (
                  <tr key={i.kode} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-mono text-xs">{i.kode}</td>
                    <td className="px-6 py-4 font-medium">{i.nama}</td>
                    <td className="px-6 py-4"><span className="px-2 py-1 bg-slate-100 rounded text-xs">{i.kategori}</span></td>
                    <td className="px-6 py-4 text-center font-bold">{i.stok}</td>
                    <td className="px-6 py-4 text-center">{i.minimum}</td>
                    <td className="px-6 py-4 text-center"><span className={`px-3 py-1 rounded-full text-xs font-semibold ${status==='Habis'?'bg-red-100 text-red-700':status==='Stok Menipis'?'bg-amber-100 text-amber-700':'bg-emerald-100 text-emerald-700'}`}>{status}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-slate-50 text-xs text-slate-500">Logika: stok =0 → Habis | stok ≤ minimum → Stok Menipis | stok &gt; minimum → Aman.</div>
      </div>
    </div>
  )
}
