import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Eye, EyeOff, Scissors, Lock, Mail, AlertCircle } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Email dan password wajib diisi.'); return }
    setLoading(true)
    try {
      await login(email, password)
      nav('/', { replace: true })
    } catch (err) {
      setError(err.message || 'Login gagal. Periksa kredensial.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-50">
      <div className="hidden lg:flex flex-col justify-between bg-slate-900 text-white p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/30 via-transparent to-emerald-500/20" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center"><Scissors size={20} /></div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">SITAMPAN YK</h1>
              <p className="text-xs text-slate-400 tracking-[0.2em]">BARBERSHOP PAKEM</p>
            </div>
          </div>
        </div>
        <div className="relative">
          <h2 className="text-4xl font-bold leading-tight">POS & Inventory<br />yang siap pakai.</h2>
          <p className="text-slate-400 mt-4 max-w-md">Kelola transaksi, stok, dan laporan dalam satu dashboard premium. Dibuat untuk operasional harian Barbershop.</p>
          <div className="mt-8 grid grid-cols-3 gap-4 text-sm">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10"><p className="font-bold text-lg">POS</p><p className="text-slate-400 text-xs">Transaksi cepat</p></div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10"><p className="font-bold text-lg">Stok</p><p className="text-slate-400 text-xs">Mutasi tercatat</p></div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10"><p className="font-bold text-lg">Laporan</p><p className="text-slate-400 text-xs">Realtime</p></div>
          </div>
        </div>
        <p className="relative text-xs text-slate-500">© 2026 Sitampan YK Pakem</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <form onSubmit={handleSubmit} className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <div className="w-9 h-9 bg-slate-900 text-white rounded-lg grid place-items-center"><Scissors size={18} /></div>
            <div><p className="font-bold">SITAMPAN YK</p><p className="text-xs text-slate-500">Barbershop Pakem</p></div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900">Masuk</h3>
          <p className="text-sm text-slate-500 mt-1">Gunakan email yang terdaftar di Supabase Auth.</p>
          {error && <div className="mt-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg"><AlertCircle size={16} />{error}</div>}
          <label className="block mt-6 text-sm font-medium text-slate-700">Email</label>
          <div className="mt-1 relative">
            <Mail size={16} className="absolute left-3 top-3.5 text-slate-400" />
            <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="owner@sitampan.id" className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
          </div>
          <label className="block mt-4 text-sm font-medium text-slate-700">Password</label>
          <div className="mt-1 relative">
            <Lock size={16} className="absolute left-3 top-3.5 text-slate-400" />
            <input value={password} onChange={e=>setPassword(e.target.value)} type={show ? 'text':'password'} placeholder="••••••••" className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
            <button type="button" onClick={()=>setShow(!show)} className="absolute right-3 top-3 text-slate-400">{show ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
          </div>
          <button disabled={loading} className="w-full mt-6 py-3 bg-slate-900 hover:bg-black text-white rounded-xl font-semibold disabled:opacity-50 text-sm">{loading ? 'Memproses...' : 'Masuk'}</button>
          <p className="text-xs text-slate-400 mt-3 text-center">Masuk dengan akun terdaftar (role OWNER atau CASHIER).</p>
          <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 space-y-2">
            <p className="font-bold text-slate-800">Akun Uji Coba Cepat (1-Klik):</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setEmail('ahmad@sitampan.id'); setPassword('123456') }}
                className="flex-1 py-1.5 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg border border-indigo-200 text-left transition"
              >
                👑 Owner: Ahmad
                <span className="block text-[10px] font-normal text-indigo-500">ahmad@sitampan.id</span>
              </button>
              <button
                type="button"
                onClick={() => { setEmail('rizal@sitampan.id'); setPassword('123456') }}
                className="flex-1 py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg border border-emerald-200 text-left transition"
              >
                ✂️ Kasir: Rizal
                <span className="block text-[10px] font-normal text-emerald-500">rizal@sitampan.id</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
