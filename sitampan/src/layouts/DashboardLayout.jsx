import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import { supabase } from '../lib/supabase'

const titles = {
  '/': 'Ringkasan Dashboard',
  '/pos': 'Point of Sale (Kasir)',
  '/inventory': 'Katalog Produk',
  '/mutasi': 'Mutasi Stok Persediaan',
  '/laporan': 'Laporan & Analitik',
  '/stok': 'Monitoring Persediaan',
  '/riwayat': 'Riwayat Transaksi',
}

export default function DashboardLayout({ children }) {
  const location = useLocation()
  const title = titles[location.pathname] || 'Dashboard Sitampan'
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [lowStockCount, setLowStockCount] = useState(0)

  // Listen to route changes to close mobile menu
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  // Fetch low stock items for navbar & sidebar indicators
  useEffect(() => {
    async function checkStock() {
      try {
        const { data } = await supabase.from('products').select('stok, minimum')
        if (data) {
          const count = data.filter(
            p => Number(p.stok ?? 0) <= Number(p.minimum ?? 0)
          ).length
          setLowStockCount(count)
        }
      } catch (err) {
        console.warn('Could not fetch stock badge:', err)
      }
    }
    checkStock()
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900 antialiased selection:bg-indigo-500 selection:text-white">
      {/* Sidebar */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        lowStockCount={lowStockCount}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          collapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}
      >
        <Navbar
          title={title}
          onToggleMobile={() => setMobileOpen(prev => !prev)}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(prev => !prev)}
          lowStockCount={lowStockCount}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
