import { useState, useEffect } from 'react'
import { Bell, Menu, Sparkles, Store, ShoppingCart, CheckCircle2, AlertTriangle, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Navbar({
  title,
  onToggleMobile,
  collapsed,
  onToggleCollapse,
  lowStockCount = 0,
}) {
  const { profile, role } = useAuth()
  const [timeStr, setTimeStr] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)

  useEffect(() => {
    function updateTime() {
      const now = new Date()
      const formatted = now.toLocaleDateString('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      setTimeStr(`${formatted} • ${hours}:${minutes} WIB`)
    }
    updateTime()
    const timer = setInterval(updateTime, 30000)
    return () => clearInterval(timer)
  }, [])

  return (
    <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-20 px-4 sm:px-6 flex items-center justify-between transition-all">
      {/* Left: Mobile hamburger + title & breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobile}
          className="lg:hidden p-2 -ml-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
          aria-label="Buka Menu"
        >
          <Menu size={20} />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              {title}
            </h1>
            <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Sistem Aktif
            </span>
          </div>
          <p className="text-[11px] text-slate-500 hidden sm:block">
            Barbershop Sitampan YK • Pakem, Sleman
          </p>
        </div>
      </div>

      {/* Right: Quick actions, Live clock, Notifications, Profile */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Live Clock */}
        <div className="hidden xl:flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80">
          <span>{timeStr}</span>
        </div>

        {/* Quick POS button */}
        <Link
          to="/pos"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl text-xs font-bold shadow-sm shadow-indigo-200 transition"
        >
          <ShoppingCart size={14} />
          <span>Kasir POS</span>
        </Link>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl relative transition"
            title="Pemberitahuan"
          >
            <Bell size={18} />
            {lowStockCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                {lowStockCount}
              </span>
            )}
          </button>

          {/* Notifications dropdown popover */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl p-4 z-30 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-slate-900">Notifikasi</h4>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                    {lowStockCount > 0 ? `${lowStockCount} Baru` : 'Kosong'}
                  </span>
                </div>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
                {lowStockCount > 0 ? (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 flex items-start gap-2.5">
                    <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-amber-900">
                        Peringatan Stok Minimum
                      </p>
                      <p className="text-[11px] text-amber-700 mt-0.5">
                        Terdapat {lowStockCount} produk yang persediaannya berada di bawah batas minimum.
                      </p>
                      <Link
                        to="/stok"
                        onClick={() => setShowNotifications(false)}
                        className="inline-block text-[11px] font-bold text-indigo-600 hover:underline mt-1.5"
                      >
                        Lihat Persediaan →
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-slate-400">
                    <CheckCircle2 size={24} className="mx-auto text-emerald-500 mb-1" />
                    Semua stok aman dan sistem berjalan normal.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Pill */}
        <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-slate-900 to-indigo-900 text-white font-bold text-xs flex items-center justify-center shadow-xs">
            {profile?.full_name ? profile.full_name[0].toUpperCase() : 'U'}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-bold text-slate-900 leading-none truncate max-w-[120px]">
              {profile?.full_name || 'Rizal'}
            </p>
            <span
              className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded mt-1 uppercase ${
                role === 'OWNER'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {role || 'Kasir'}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
