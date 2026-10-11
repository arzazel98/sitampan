import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Package, Plus, Trash2, Edit } from 'lucide-react'

export default function Inventory() {
  const [products, setProducts] = useState([])
  
  async function load() {
    const { data } = await supabase.from('products').select('*').order('nama')
    setProducts(data || [])
  }

  useEffect(() => { load() }, [])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Data Produk</h2>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium">+ Tambah Produk</button>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
            <tr>
              <th className="px-6 py-3 text-left">Produk</th>
              <th className="px-6 py-3 text-center">Stok</th>
              <th className="px-6 py-3 text-right">Harga</th>
              <th className="px-6 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map(p => (
              <tr key={p.id}>
                <td className="px-6 py-4 font-medium">{p.nama}</td>
                <td className="px-6 py-4 text-center">{p.stok}</td>
                <td className="px-6 py-4 text-right">{p.harga}</td>
                <td className="px-6 py-4 flex justify-center gap-2">
                  <button className="text-indigo-600 hover:text-indigo-800"><Edit size={16}/></button>
                  <button className="text-red-600 hover:text-red-800"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
