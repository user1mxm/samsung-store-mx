import { Routes, Route, Navigate } from 'react-router'
import { useAuth } from './hooks/useAuth'
import Home from './pages/Home'
import Login from './pages/Login'
import AdminLogin from './pages/AdminLogin'
import ChangePassword from './pages/ChangePassword'
import AdminDashboard from './pages/AdminDashboard'
import AgentDashboard from './pages/AgentDashboard'
import NetworkPage from './pages/NetworkPage'
import OrderHistory from './pages/OrderHistory'
import NotFound from './pages/NotFound'

export default function App() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1428A0]" />
      </div>
    )
  }

  return (
    <Routes>
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
    </Routes>
  )
}
