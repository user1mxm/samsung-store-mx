// @ts-nocheck
import { useNavigate } from 'react-router'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { trpc } from '@/providers/trpc'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, ShoppingCart, Package, Clock, CheckCircle2, Truck, XCircle } from 'lucide-react'

const STATUS_CONFIG: Record<string, { label: string; color: string; Icon: any }> = {
  pending:    { label: 'Pendiente',   color: 'bg-yellow-100 text-yellow-700', Icon: Clock },
  processing: { label: 'Procesando', color: 'bg-blue-100 text-blue-700',     Icon: Package },
  shipped:    { label: 'Enviado',     color: 'bg-purple-100 text-purple-700', Icon: Truck },
  delivered:  { label: 'Entregado',  color: 'bg-green-100 text-green-700',   Icon: CheckCircle2 },
  cancelled:  { label: 'Cancelado',  color: 'bg-red-100 text-red-700',       Icon: XCircle },
}

export default function OrderHistory() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const { data: orders, isLoading } = trpc.order.list.useQuery(undefined, { enabled: isAuthenticated, retry: false })

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <ShoppingCart className="w-12 h-12 text-[#1428A0] mx-auto mb-4" />
            <h2 className="text-xl font-black mb-2">Mis Pedidos</h2>
            <p className="text-sm text-gray-500 mb-6">Inicia sesion para ver tu historial de pedidos.</p>
            <Button className="h-11 bg-[#1428A0] hover:bg-[#0f1f7a] rounded-full px-8" onClick={() => navigate('/login')}>
              Iniciar Sesion
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#1428A0] to-[#0077C8] text-white sticky top-0 z-40">
        <div className="max-w-[900px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <ShoppingCart className="w-5 h-5" />
            <span className="font-bold tracking-wider text-sm">MIS PEDIDOS</span>
          </div>
          <span className="text-sm opacity-90 hidden sm:inline">{user?.name}</span>
        </div>
      </header>

      <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-8">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : !(orders || []).length ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-center py-20">
            <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-black text-gray-700 mb-2">Sin pedidos aun</h2>
            <p className="text-sm text-gray-400 mb-6">Cuando realices una compra, aparecera aqui.</p>
            <Button className="h-11 bg-[#1428A0] hover:bg-[#0f1f7a] rounded-full px-8 font-bold" onClick={() => navigate('/')}>
              Ver Catalogo
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 mb-4">{(orders || []).length} pedido{(orders || []).length !== 1 ? 's' : ''}</p>
            {(orders || []).map((order, i) => {
              const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
              const Icon = cfg.Icon
              return (
                <motion.div key={order.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                  <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-[#1428A0]/10 flex items-center justify-center shrink-0">
                            <Icon className="w-5 h-5 text-[#1428A0]" />
                          </div>
                          <div>
                            <p className="font-black text-gray-900">Orden #{order.id}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {new Date(order.createdAt).toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1.5">
                          <p className="text-lg font-black text-[#1428A0]">${Number(order.total || 0).toLocaleString()} <span className="text-xs font-normal text-gray-400">MXN</span></p>
                          <Badge className={`text-[10px] font-bold ${cfg.color}`}>{cfg.label}</Badge>
                        </div>
                      </div>

                      {/* Status timeline */}
                      <div className="mt-4 flex items-center gap-0">
                        {['pending', 'processing', 'shipped', 'delivered'].map((s, idx) => {
                          const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
                          const currentIdx = statuses.indexOf(order.status)
                          const isCancelled = order.status === 'cancelled'
                          const isActive = !isCancelled && statuses.indexOf(s) <= currentIdx
                          const isLast = idx === 3
                          return (
                            <div key={s} className="flex items-center flex-1">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${isActive ? 'bg-[#1428A0]' : 'bg-gray-200'}`}>
                                {isActive && <div className="w-2 h-2 rounded-full bg-white" />}
                              </div>
                              {!isLast && <div className={`flex-1 h-0.5 ${isActive && !isCancelled && statuses.indexOf(s) < currentIdx ? 'bg-[#1428A0]' : 'bg-gray-200'}`} />}
                            </div>
                          )
                        })}
                      </div>
                      <div className="flex justify-between mt-1.5">
                        {['Pendiente', 'Procesando', 'Enviado', 'Entregado'].map(label => (
                          <span key={label} className="text-[9px] text-gray-400 flex-1 text-center first:text-left last:text-right">{label}</span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
