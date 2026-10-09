import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router'
import { useAuth } from './hooks/useAuth'
import Home from './pages/Home'
const Login = lazy(() => import('./pages/Login'))
const AdminLogin = lazy(() => import('./pages/AdminLogin'))
const ChangePassword = lazy(() => import('./pages/ChangePassword'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const AgentDashboard = lazy(() => import('./pages/AgentDashboard'))
const NetworkPage = lazy(() => import('./pages/NetworkPage'))
const OrderHistory = lazy(() => import('./pages/OrderHistory'))
const NotFound = lazy(() => import('./pages/NotFound'))

export default function App() {
  const { user, isLoading } = useAuth()

  const accountLoading = <div role="status" className="min-h-[50vh] flex items-center justify-center">Cargando tu cuenta…</div>
  if (isLoading && window.location.pathname !== '/') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1428A0]" />
      </div>
    )
  }

  return (
    <Suspense fallback={accountLoading}><Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/login/admin" element={<AdminLogin />} />
      <Route path="/change-password" element={<ChangePassword />} />
      <Route path="/mi-red" element={<NetworkPage />} />
      <Route path="/mis-pedidos" element={<OrderHistory />} />
      <Route
        path="/admin"
        element={
          user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/login/admin" />
        }
      />
      <Route
        path="/agent"
        element={
          user?.role === 'agent' ? <AgentDashboard /> : <Navigate to="/login" />
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes></Suspense>
  )
}
