import { getStatus } from '../lib/utils'

export default function StockTable({ items }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
          <tr><th className="px-6 py-3 text-left">Kode</th><th className="px-6 py-3 text-left">Produk</th><th className="px-6 py-3 text-center">Stok</th><th className="px-6 py-3 text-center">Minimum</th><th className="px-6 py-3 text-center">Status</th></tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map(i=>{
            const s=getStatus(i.stok,i.minimum)
            return <tr key={i.kode} className="hover:bg-slate-50"><td className="px-6 py-3 font-mono text-xs">{i.kode}</td><td className="px-6 py-3 font-medium">{i.nama}</td><td className="px-6 py-3 text-center font-bold">{i.stok}</td><td className="px-6 py-3 text-center">{i.minimum}</td><td className="px-6 py-3 text-center"><span className={`px-2 py-1 rounded-full text-xs font-medium ${s==='Habis'?'bg-red-100 text-red-700':s==='Stok Menipis'?'bg-amber-100 text-amber-700':'bg-emerald-100 text-emerald-700'}`}>{s}</span></td></tr>
          })}
        </tbody>
      </table>
    </div>
  )
}
