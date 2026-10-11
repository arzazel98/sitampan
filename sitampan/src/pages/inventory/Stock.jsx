import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { getStatus } from '../../lib/utils'
import StockAlert from '../../components/StockAlert'
import { Package, ShieldCheck, AlertTriangle, XCircle } from 'lucide-react'

export default function Stock() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(()=>{ (async()=>{ const {data}=await supabase.from('products').select('*').order('kode'); setProducts(data||[]); setLoading(false) })() }, [])
  if (loading) return <div className="p-8 text-center text-slate-500">Memuat stok...</div>
  const aman = products.filter(p=>p.stok>p.minimum).length
  const menipis = products.filter(p=>p.stok>0 && p.stok<=p.minimum).length
  const habis = products.filter(p=>p.stok===0).length
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex justify-between items-center"><div><p className="text-sm text-slate-500">Total Produk</p><p className="text-2xl font-bold">{products.length}</p></div><div className="p-3 bg-slate-900 text-white rounded-xl"><Package size={20}/></div></div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex justify-between items-center"><div><p className="text-sm text-slate-500">Aman</p><p className="text-2xl font-bold text-emerald-600">{aman}</p></div><div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl"><ShieldCheck size={20}/></div></div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex justify-between items-center"><div><p className="text-sm text-slate-500">Menipis</p><p className="text-2xl font-bold text-amber-600">{menipis}</p></div><div className="p-3 bg-amber-100 text-amber-600 rounded-xl"><AlertTriangle size={20}/></div></div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex justify-between items-center"><div><p className="text-sm text-slate-500">Habis</p><p className="text-2xl font-bold text-red-600">{habis}</p></div><div className="p-3 bg-red-100 text-red-600 rounded-xl"><XCircle size={20}/></div></div>
      </div>
      <StockAlert items={products} />
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-6"><h3 className="font-semibold">Status Persediaan</h3><p className="text-xs text-slate-500">Stok ≤ minimum → Menipis | stok =0 → Habis</p></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3 text-left">Kode</th><th className="px-4 py-3 text-left">Produk</th><th className="px-4 py-3 text-left">Kategori</th><th className="px-4 py-3 text-center">Stok</th><th className="px-4 py-3 text-center">Min</th><th className="px-4 py-3 text-center">Status</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {products.map(p=>{ const s=getStatus(p.stok,p.minimum); return <tr key={p.id} className="hover:bg-slate-50"><td className="px-4 py-3 font-mono text-xs">{p.kode}</td><td className="px-4 py-3 font-medium">{p.nama}</td><td className="px-4 py-3"><span className="px-2 py-1 bg-slate-100 rounded text-xs">{p.kategori}</span></td><td className="px-4 py-3 text-center font-bold">{p.stok}</td><td className="px-4 py-3 text-center">{p.minimum}</td><td className="px-4 py-3 text-center"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${s==='Habis'?'bg-red-100 text-red-700':s==='Stok Menipis'?'bg-amber-100 text-amber-700':'bg-emerald-100 text-emerald-700'}`}>{s}</span></td></tr> })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
