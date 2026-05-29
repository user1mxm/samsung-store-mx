import { Routes, Route, Navigate } from 'react-router'
import { lazy, Suspense } from 'react'
import { useAuth } from './hooks/useAuth'
import Home from './pages/Home'
import Login from './pages/Login'
import ChangePassword from './pages/ChangePassword'
import AdminDashboard from './pages/AdminDashboard'
import NetworkPage from './pages/NetworkPage'
import OrderHistory from './pages/OrderHistory'
import NotFound from './pages/NotFound'

// v3 enhanced pages (lazy-loaded to trim the initial bundle)
const AgentLogin = lazy(() => import('./pages/AgentLogin'))
const AdminLoginEnhanced = lazy(() => import('./pages/AdminLoginEnhanced'))
const AgentDashboardEnhanced = lazy(() => import('./pages/AgentDashboardEnhanced'))

const Loader = () => (
  <div className="min-h-screen flex items-center justify-center bg-white">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1428A0]" />
  </div>
)

export default function App() {
  const { user, isLoading } = useAuth()

  if (isLoading) return <Loader />

  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/login/agent" element={<AgentLogin />} />
        <Route path="/login/admin" element={<AdminLoginEnhanced />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/mi-red" element={user ? <NetworkPage /> : <Navigate to="/login/agent" />} />
        <Route path="/mis-pedidos" element={user ? <OrderHistory /> : <Navigate to="/login" />} />
        <Route
          path="/admin"
          element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/login/admin" />}
        />
        <Route
          path="/agent"
          element={(user?.role === 'agent' || user?.role === 'admin') ? <AgentDashboardEnhanced /> : <Navigate to="/login/agent" />}
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}
