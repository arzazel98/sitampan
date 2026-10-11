import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { formatRp, getStatus } from '../../lib/utils'
import Modal from '../../components/common/Modal'
import { Package, Search, Pencil, Trash2 } from 'lucide-react'

const categories = ['Pomade & Clay','Styling','Minuman','Perawatan','Hair Product','Beverage','Hair Care','Other']

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ kode:'', nama:'', kategori:'Pomade & Clay', satuan:'pcs', harga:0, stok:0, minimum:5, is_active:true })
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('products').select('*').order('kode')
    setProducts(data || [])
    setLoading(false)
  }
  useEffect(()=>{ load() }, [])

  function openCreate() {
    setEditing(null)
    setForm({ kode:'', nama:'', kategori:'Pomade & Clay', satuan:'pcs', harga:0, stok:0, minimum:5, is_active:true })
    setError('')
    setOpen(true)
  }
  function openEdit(p) {
    setEditing(p)
    setForm({ kode:p.kode, nama:p.nama, kategori:p.kategori, satuan:p.satuan||'pcs', harga:Number(p.harga), stok:p.stok, minimum:p.minimum, is_active:p.is_active ?? true })
    setError('')
    setOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.kode.trim() || !form.nama.trim()) { setError('Kode dan nama wajib diisi'); return }
    if (form.harga < 0 || form.stok < 0 || form.minimum < 0) { setError('Harga/stok/minimum tidak boleh negatif'); return }
    try {
      const payload = {
        kode: form.kode.trim(),
        nama: form.nama.trim(),
        kategori: form.kategori,
        harga: Number(form.harga),
        stok: Number(form.stok),
        minimum: Number(form.minimum),
      }
      if (editing) {
        const { error } = await supabase.from('products').update(payload).eq('id', editing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('products').insert(payload)
        if (error) throw error
      }
      setOpen(false)
      load()
    } catch (err) { setError(err.message) }
  }

  async function handleToggleActive(p) {
    if (!confirm(`${p.is_active ? 'Nonaktifkan' : 'Aktifkan'} produk ${p.nama}?`)) return
    await supabase.from('products').update({ is_active: !p.is_active }).eq('id', p.id)
    load()
  }

  async function handleDelete(p) {
    if (!confirm(`Hapus produk ${p.nama}? Tindakan ini tidak dapat dibatalkan.`)) return
    try {
      const { error } = await supabase.from('products').delete().eq('id', p.id)
      if (error) throw error
      load()
    } catch (err) {
      alert('Tidak dapat menghapus produk: ' + (err.message || 'Produk mungkin masih terhubung dengan transaksi.'))
    }
  }

  const filtered = products.filter(p => {
    if (q && !(`${p.kode} ${p.nama} ${p.kategori}`.toLowerCase().includes(q.toLowerCase()))) return false
    if (cat && p.kategori !== cat) return false
    if (filterStatus === 'active' && !p.is_active) return false
    if (filterStatus === 'inactive' && p.is_active) return false
    if (filterStatus === 'low' && !(p.stok <= p.minimum && p.stok > 0)) return false
    if (filterStatus === 'out' && p.stok !== 0) return false
    return true
  })

  if (loading) return <div className="p-8 text-center text-slate-500">Memuat produk...</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Data Produk</h2>
          <p className="text-sm text-slate-500">{products.length} produk • {products.filter(p=>p.is_active).length} aktif</p>
        </div>
        <button onClick={openCreate} className="bg-slate-900 hover:bg-black text-white px-4 py-2 rounded-xl text-sm font-semibold">+ Tambah Produk</button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Cari kode / nama / kategori" className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <select value={cat} onChange={e=>setCat(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white">
          <option value="">Semua Kategori</option>
          {categories.map(c=> <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white">
          <option value="all">Semua Status</option>
          <option value="active">Aktif</option>
          <option value="inactive">Nonaktif</option>
          <option value="low">Stok Menipis</option>
          <option value="out">Habis</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr><th className="px-4 py-3 text-left">Kode</th><th className="px-4 py-3 text-left">Produk</th><th className="px-4 py-3 text-left">Kategori</th><th className="px-4 py-3 text-center">Stok</th><th className="px-4 py-3 text-center">Min</th><th className="px-4 py-3 text-center">Status</th><th className="px-4 py-3 text-right">Harga</th><th className="px-4 py-3 text-center">Aktif</th><th className="px-4 py-3 text-center">Aksi</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(p=>{
                const s=getStatus(p.stok,p.minimum)
                return (
                  <tr key={p.id} className={`hover:bg-slate-50 ${!p.is_active?'opacity-50':''}`}>
                    <td className="px-4 py-3 font-mono text-xs">{p.kode}</td>
                    <td className="px-4 py-3"><p className="font-medium text-slate-800">{p.nama}</p><p className="text-xs text-slate-500">{p.satuan||'pcs'}</p></td>
                    <td className="px-4 py-3"><span className="px-2 py-1 bg-slate-100 rounded text-xs">{p.kategori}</span></td>
                    <td className="px-4 py-3 text-center font-bold">{p.stok}</td>
                    <td className="px-4 py-3 text-center">{p.minimum}</td>
                    <td className="px-4 py-3 text-center"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${s==='Habis'?'bg-red-100 text-red-700':s==='Stok Menipis'?'bg-amber-100 text-amber-700':'bg-emerald-100 text-emerald-700'}`}>{s}</span></td>
                    <td className="px-4 py-3 text-right font-semibold">{formatRp(p.harga)}</td>
                    <td className="px-4 py-3 text-center"><span className={`px-2 py-1 rounded-full text-xs ${p.is_active?'bg-emerald-100 text-emerald-700':'bg-slate-200 text-slate-600'}`}>{p.is_active?'Aktif':'Nonaktif'}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-1">
                        <button onClick={()=>openEdit(p)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"><Pencil size={14}/></button>
                        <button onClick={()=>handleToggleActive(p)} className="p-2 hover:bg-slate-100 rounded-lg text-xs font-medium text-slate-600">{p.is_active?'Off':'On'}</button>
                        <button onClick={()=>handleDelete(p)} className="p-2 hover:bg-red-50 rounded-lg text-red-600"><Trash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length===0 && <tr><td colSpan={9} className="text-center py-8 text-slate-400">Tidak ada produk</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={open} onClose={()=>setOpen(false)} title={editing ? 'Edit Produk' : 'Tambah Produk'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-semibold text-slate-700">Kode *</label><input value={form.kode} onChange={e=>setForm({...form,kode:e.target.value})} className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm" placeholder="PRD-009" /></div>
            <div><label className="text-xs font-semibold text-slate-700">Satuan</label><input value={form.satuan} onChange={e=>setForm({...form,satuan:e.target.value})} className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm" /></div>
          </div>
          <div><label className="text-xs font-semibold text-slate-700">Nama Produk *</label><input value={form.nama} onChange={e=>setForm({...form,nama:e.target.value})} className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-semibold text-slate-700">Kategori</label><select value={form.kategori} onChange={e=>setForm({...form,kategori:e.target.value})} className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white">{categories.map(c=> <option key={c} value={c}>{c}</option>)}</select></div>
            <div><label className="text-xs font-semibold text-slate-700">Harga Jual</label><input type="number" min={0} value={form.harga} onChange={e=>setForm({...form,harga:Number(e.target.value)})} className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-xs font-semibold text-slate-700">Stok</label><input type="number" min={0} value={form.stok} onChange={e=>setForm({...form,stok:Number(e.target.value)})} className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm" /></div>
            <div><label className="text-xs font-semibold text-slate-700">Minimum</label><input type="number" min={0} value={form.minimum} onChange={e=>setForm({...form,minimum:Number(e.target.value)})} className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm" /></div>
            <div className="flex items-end gap-2 pb-2"><input type="checkbox" checked={form.is_active} onChange={e=>setForm({...form,is_active:e.target.checked})} /><span className="text-sm">Aktif</span></div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={()=>setOpen(false)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold text-sm">Batal</button>
            <button type="submit" className="flex-1 py-3 bg-slate-900 hover:bg-black text-white rounded-xl font-semibold text-sm">{editing ? 'Simpan' : 'Tambah'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
