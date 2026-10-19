import {
  LayoutDashboard,
  ShoppingCart,
  History,
  Package,
  Boxes,
  ArrowLeftRight,
  FileBarChart,
  Database,
  LogOut,
  ChevronLeft,
  Scissors,
  Sparkles,
  X,
} from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const navGroups = [
  {
    title: 'OPERASIONAL',
    items: [
      { path: '/', name: 'Dashboard', icon: LayoutDashboard, roles: ['OWNER', 'CASHIER'] },
      { path: '/pos', name: 'Kasir POS', icon: ShoppingCart, roles: ['OWNER', 'CASHIER'], highlight: true },
      { path: '/riwayat', name: 'Laporan & Komisi', icon: History, roles: ['OWNER', 'CASHIER'] },
    ],
  },
  {
    title: 'INVENTARIS',
    items: [
      { path: '/inventory', name: 'Katalog Produk', icon: Package, roles: ['OWNER'] },
      { path: '/stok', name: 'Status Persediaan', icon: Boxes, roles: ['OWNER', 'CASHIER'], hasStockBadge: true },
      { path: '/mutasi', name: 'Mutasi Stok', icon: ArrowLeftRight, roles: ['OWNER', 'CASHIER'] },
    ],
  },
  {
    title: 'ANALITIK',
    items: [
      { path: '/laporan', name: 'Analitik & Laba Rugi', icon: FileBarChart, roles: ['OWNER'] },
      { path: '/data-management', name: 'Manajemen Data', icon: Database, roles: ['OWNER'] },
    ],
  },
]

export default function Sidebar({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
  lowStockCount = 0,
}) {
  const location = useLocation()
  const nav = useNavigate()
  const { role, profile, logout } = useAuth()

  async function handleLogout() {
    await logout()
    nav('/login')
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[55] lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-[60] flex flex-col bg-slate-950 text-white border-r border-slate-800/80 transition-all duration-300 ${
          collapsed ? 'lg:w-20' : 'lg:w-64'
        } ${
          mobileOpen ? 'w-64 translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 border-b border-slate-800/80 flex items-center justify-between shrink-0">
          <Link
            to="/"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 overflow-hidden"
          >
            {(!collapsed || mobileOpen) ? (
              <img src="/logo.svg" alt="TAMPAN.YK Barbershop" className="h-10 w-auto rounded-lg bg-white px-2 py-1 shrink-0" />
            ) : (
              <img src="/logo.svg" alt="TAMPAN.YK" className="w-9 h-9 rounded-xl bg-white object-contain p-1 shrink-0" />
            )}
          </Link>

          {/* Desktop Collapse Toggle / Mobile Close Toggle */}
          <div className="flex items-center">
            {/* Mobile close button */}
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X size={18} />
            </button>

            {/* Desktop collapse toggle */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title={collapsed ? 'Perluas Menu' : 'Perkecil Menu'}
            >
              <ChevronLeft
                size={16}
                className={`transition-transform duration-200 ${
                  collapsed ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {/* User Card when expanded */}
        {(!collapsed || mobileOpen) && (
          <div className="px-3 pt-3 shrink-0">
            <div className="bg-gradient-to-r from-slate-900 to-slate-900/90 rounded-xl p-3 border border-slate-800 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0">
                {profile?.full_name ? profile.full_name[0].toUpperCase() : 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-200 truncate">
                  {profile?.full_name || 'Rizal'}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] text-slate-400 font-medium truncate uppercase">
                    {role || 'Kasir'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto custom-scrollbar">
          {navGroups.map((group, idx) => {
            const accessibleItems = group.items.filter(
              item => !role || item.roles.includes(role)
            )
            if (accessibleItems.length === 0) return null

            return (
              <div key={idx} className="space-y-1">
                {(!collapsed || mobileOpen) && (
                  <div className="px-3 pb-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                    {group.title}
                  </div>
                )}
                <div className="space-y-1">
                  {accessibleItems.map(item => {
                    const Icon = item.icon
                    const isActive = location.pathname === item.path

                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileOpen(false)}
                        title={collapsed && !mobileOpen ? item.name : ''}
                        className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30'
                            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80'
                        }`}
                      >
                        <Icon
                          size={18}
                          className={`shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                            isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                          }`}
                        />
                        {(!collapsed || mobileOpen) && (
                          <span className="truncate flex-1">{item.name}</span>
                        )}

                        {/* Stock warning badge */}
                        {item.hasStockBadge && lowStockCount > 0 && (!collapsed || mobileOpen) && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {lowStockCount}
                          </span>
                        )}

                        {/* Highlight dot if collapsed */}
                        {item.hasStockBadge && lowStockCount > 0 && collapsed && !mobileOpen && (
                          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-slate-950" />
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </nav>

        {/* Footer with Logout */}
        <div className="p-3 border-t border-slate-800/80 shrink-0">
          <button
            onClick={handleLogout}
            title={collapsed && !mobileOpen ? 'Logout' : ''}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 transition group"
          >
            <LogOut
              size={18}
              className="shrink-0 group-hover:text-rose-400 transition"
            />
            {(!collapsed || mobileOpen) && <span>Keluar / Logout</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
