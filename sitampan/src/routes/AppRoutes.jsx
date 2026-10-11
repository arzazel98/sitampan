import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import ProtectedRoute from './ProtectedRoute'
import DashboardLayout from '../layouts/DashboardLayout'
import Login from '../pages/auth/Login'
import Dashboard from '../pages/Dashboard'
import Products from '../pages/inventory/Products'
import POS from '../pages/POS'
import Inventory from '../pages/Inventory'
import StockMutation from '../pages/StockMutation'
import Reports from '../pages/Reports'

export default function AppRoutes() {
  const { loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-900 text-white font-medium">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold tracking-wide">Memuat SITAMPAN YK...</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/pos"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <POS />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/inventory"
        element={
          <ProtectedRoute roles={['OWNER']}>
            <DashboardLayout>
              <Products />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/stok"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Inventory />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/mutasi"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <StockMutation />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/laporan"
        element={
          <ProtectedRoute roles={['OWNER']}>
            <DashboardLayout>
              <Reports />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/riwayat"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Reports />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
