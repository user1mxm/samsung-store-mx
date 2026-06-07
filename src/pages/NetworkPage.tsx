// @ts-nocheck
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { trpc } from '@/providers/trpc'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import {
  Users, DollarSign, TrendingUp, Copy, ArrowLeft, Sparkles,
  Share2, Crown, Award, Target, Zap, Gift, ChevronRight,
  Wallet, CheckCircle2, UserPlus, BarChart3, Crown as CrownIcon,
  Medal, Star, ArrowUpRight, Layers
} from 'lucide-react'

const TIERS = [
  { name: 'Embajador', min: 0, color: '#1428A0', icon: Award, benefits: ['8% comision directa', 'Acceso a catalogo'] },
  { name: 'Lider', min: 10, color: '#0077C8', icon: Target, benefits: ['+4% nivel 2', 'Bonus mensual $500'] },
  { name: 'Gerente', min: 50, color: '#00BFFF', icon: Crown, benefits: ['+2% nivel 3', 'Bonus mensual $2,000'] },
  { name: 'Director', min: 200, color: '#FF6900', icon: Zap, benefits: ['15% maximo', 'Viaje anual Samsung'] },
]

const LEVEL_RATES = [
  { level: 1, rate: '8%', label: 'Venta Directa', desc: 'De cada compra de tus referidos directos', color: '#1428A0' },
  { level: 2, rate: '4%', label: 'Red Nivel 2', desc: 'De las compras del 2do nivel de tu red', color: '#0077C8' },
  { level: 3, rate: '2%', label: 'Red Nivel 3', desc: 'De las compras del 3er nivel de tu red', color: '#00BFFF' },
]

const LEADERBOARD = [
  { name: 'Maria G.', earnings: 45200, network: 89, avatar: 'MG', tier: 'Oro' },
  { name: 'Carlos R.', earnings: 38400, network: 64, avatar: 'CR', tier: 'Oro' },
  { name: 'Ana L.', earnings: 29100, network: 47, avatar: 'AL', tier: 'Plata' },
  { name: 'Luis M.', earnings: 24500, network: 35, avatar: 'LM', tier: 'Plata' },
  { name: 'Diana S.', earnings: 18300, network: 22, avatar: 'DS', tier: 'Plata' },
]

const SPRING = { type: 'spring' as const, stiffness: 400, damping: 25 }

export default function NetworkPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [referralCode, setReferralCode] = useState('')
  const [activeSection, setActiveSection] = useState<'overview' | 'network' | 'leaderboard'>('overview')

  const { data: myReferral } = trpc.referral?.getMyReferral?.useQuery(undefined, { retry: false }) || { data: null }
  const { data: networkData, refetch: refetchNetwork } = trpc.referral?.getMyNetwork?.useQuery(undefined, { retry: false }) || { data: null }
  const { data: commissionsData } = trpc.referral?.getMyCommissions?.useQuery(undefined, { retry: false }) || { data: null }

  const joinMutation = trpc.referral?.joinWithCode?.useMutation?.({
    onSuccess: () => { toast.success('Te uniste exitosamente al programa'); refetchNetwork(); },
    onError: (e: any) => toast.error(e.message),
  }) || { mutate: () => toast.error('Funcionalidad no disponible'), isPending: false }

  const handleJoin = () => {
    if (!referralCode.trim()) { toast.error('Ingresa un codigo'); return }
    joinMutation.mutate({ code: referralCode.trim() })
  }

  const copyCode = (code: string) => {
    navigator.clipboard?.writeText(code)
    toast.success('Codigo copiado!')
  }

  const shareUrl = myReferral ? `${window.location.origin}/login?ref=${myReferral.referralCode}` : ''

  const currentTier = TIERS.reduce((acc, t) => (networkData?.networkSize || 0) >= t.min ? t : acc, TIERS[0])
  const nextTier = TIERS.find(t => (networkData?.networkSize || 0) < t.min)
  const progressToNext = nextTier ? Math.min(100, ((networkData?.networkSize || 0) / nextTier.min) * 100) : 100

  const totalEarnings = Number(commissionsData?.totalPending || 0) + Number(commissionsData?.totalPaid || 0)

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#1428A0]/20 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-0 shadow-2xl bg-white dark:bg-[#12121f]">
          <CardContent className="p-8 text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={SPRING}>
              <Users className="w-12 h-12 text-[#1428A0] mx-auto mb-4" />
            </motion.div>
            <h2 className="text-xl font-black mb-2 dark:text-white">Programa de Embajadores</h2>
            <p className="text-sm text-gray-500 mb-6">Inicia sesion para acceder a tu red de mercadeo y comenzar a ganar comisiones.</p>
            <Button className="h-11 samsung-btn-primary" onClick={() => navigate('/login')}>Iniciar Sesion</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a14] via-[#0a0a0f] to-[#0a0a14] text-white">
      {/* Header */}
      <header className="border-b border-white/5 backdrop-blur-xl bg-[#0a0a0f]/80 sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('/')} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </motion.button>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#00BFFF]" />
              <span className="font-bold text-sm tracking-wide hidden sm:inline">Samsung Embajadores MX</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {myReferral?.referralCode && (
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => copyCode(myReferral.referralCode)}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#1428A0]/20 rounded-full text-[10px] font-bold text-[#00BFFF] hover:bg-[#1428A0]/30 transition-colors">
                <Copy className="w-3 h-3" /> {myReferral.referralCode}
              </motion.button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
        {/* Hero Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Ganancias Totales', value: `$${totalEarnings.toLocaleString()}`, icon: DollarSign, color: 'from-emerald-500 to-emerald-600' },
            { label: 'Pendientes', value: `$${Number(commissionsData?.totalPending || 0).toLocaleString()}`, icon: Wallet, color: 'from-[#1428A0] to-[#0077C8]' },
            { label: 'Miembros Red', value: (networkData?.networkSize || 0).toLocaleString(), icon: Users, color: 'from-[#00BFFF] to-[#0077C8]' },
            { label: 'Referidos Directos', value: networkData?.directCount || 0, icon: UserPlus, color: 'from-purple-500 to-purple-600' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="border-0 bg-white/5 backdrop-blur hover:bg-white/[0.07] transition-colors">
                <CardContent className="p-4">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3 shadow-lg`}>
                    <s.icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-2xl font-black">{s.value}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">{s.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Section Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {[
            { id: 'overview', label: 'Resumen', icon: BarChart3 },
            { id: 'network', label: 'Mi Red', icon: Users },
            { id: 'leaderboard', label: 'Leaderboard', icon: CrownIcon },
          ].map(tab => (
            <motion.button key={tab.id} whileTap={{ scale: 0.95 }} onClick={() => setActiveSection(tab.id as any)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-bold transition-all shrink-0 ${
                activeSection === tab.id ? 'bg-[#1428A0] text-white shadow-md' : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}>
              <tab.icon className="w-3.5 h-3.5" />{tab.label}
            </motion.button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* OVERVIEW SECTION */}
          {activeSection === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Left */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Referral Code */}
                  {myReferral?.referralCode && (
                    <Card className="border-0 bg-gradient-to-r from-[#1428A0]/20 to-[#0077C8]/10 backdrop-blur overflow-hidden relative">
                      <div className="absolute top-0 right-0 w-40 h-40 bg-[#1428A0]/10 rounded-full blur-3xl" />
                      <CardContent className="p-6 relative">
                        <div className="flex items-center gap-2 mb-4">
                          <Gift className="w-5 h-5 text-[#00BFFF]" />
                          <h3 className="font-bold text-lg">Tu Codigo de Embajador</h3>
                        </div>
                        <div className="flex items-center gap-3 mb-4">
                          <div className="flex-1 bg-black/30 rounded-xl px-4 py-3 font-mono text-xl font-black text-[#00BFFF] tracking-wider text-center">
                            {myReferral.referralCode}
                          </div>
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button onClick={() => copyCode(myReferral.referralCode)} className="h-12 px-4 bg-[#1428A0] hover:bg-[#0f1f7a] rounded-xl">
                              <Copy className="w-4 h-4" />
                            </Button>
                          </motion.div>
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button onClick={() => { navigator.clipboard?.writeText(shareUrl); toast.success('Enlace copiado!') }} variant="outline" className="h-12 px-4 border-white/10 rounded-xl hover:bg-white/5">
                              <Share2 className="w-4 h-4" />
                            </Button>
                          </motion.div>
                        </div>
                        <p className="text-xs text-gray-400">Comparte tu codigo y gana comisiones de hasta 3 niveles de profundidad.</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Commission Levels */}
                  <div>
                    <h3 className="font-bold text-base mb-4 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#00BFFF]" /> Plan de Comisiones Multinivel
                    </h3>
                    <div className="space-y-3">
                      {LEVEL_RATES.map((l) => (
                        <motion.div key={l.level} whileHover={{ x: 4 }} transition={SPRING}
                          className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5 hover:border-[#1428A0]/30 transition-colors">
                          <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${l.color}30` }}>
                            <span className="text-xl font-black" style={{ color: l.color }}>{l.rate}</span>
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-sm">{l.label}</p>
                            <p className="text-xs text-gray-500">{l.desc}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-gray-500 uppercase">Nivel {l.level}</p>
                            <div className="flex gap-0.5 mt-1">
                              {Array.from({ length: 3 }).map((_, j) => (
                                <div key={j} className={`w-6 h-1.5 rounded-full ${j < l.level ? 'bg-[#1428A0]' : 'bg-gray-700'}`} />
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* How it works */}
                  <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5">
                    <h4 className="font-bold text-xs mb-4 text-gray-400 uppercase tracking-wider">Como Funciona</h4>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {[
                        { step: '1', icon: Share2, text: 'Comparte tu codigo con amigos y familia' },
                        { step: '2', icon: ShoppingCart, text: 'Ellos compran con tu codigo de descuento' },
                        { step: '3', icon: DollarSign, text: 'Ganas hasta 8% de cada compra directa' },
                        { step: '4', icon: Users, text: 'Tus referidos invitan mas y ganas de 3 niveles' },
                      ].map(item => (
                        <div key={item.step} className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                          <div className="w-8 h-8 rounded-lg bg-[#1428A0]/30 flex items-center justify-center shrink-0">
                            <item.icon className="w-3.5 h-3.5 text-[#00BFFF]" />
                          </div>
                          <p className="text-[11px] text-gray-400 leading-relaxed">{item.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right sidebar */}
                <div className="space-y-6">
                  {/* Tier Progress */}
                  <Card className="border-0 bg-white/5 backdrop-blur">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${currentTier.color}20` }}>
                          <currentTier.icon className="w-5 h-5" style={{ color: currentTier.color }} />
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Nivel Actual</p>
                          <p className="font-bold text-lg" style={{ color: currentTier.color }}>{currentTier.name}</p>
                        </div>
                      </div>
                      {nextTier && (
                        <>
                          <div className="flex justify-between text-[10px] text-gray-500 mb-1.5">
                            <span>{networkData?.networkSize || 0} miembros</span>
                            <span>{nextTier.min} para {nextTier.name}</span>
                          </div>
                          <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
                            <motion.div className="h-full rounded-full" style={{ backgroundColor: currentTier.color }}
                              initial={{ width: 0 }} animate={{ width: `${progressToNext}%` }} transition={{ duration: 1, delay: 0.5 }} />
                          </div>
                          <p className="text-[10px] text-gray-500 mt-2">{nextTier.min - (networkData?.networkSize || 0)} miembros mas para subir de nivel</p>
                        </>
                      )}
                      {!nextTier && (
                        <div className="flex items-center gap-2 text-emerald-400">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="text-xs font-bold">Nivel maximo alcanzado!</span>
                        </div>
                      )}

                      {/* Benefits */}
                      <div className="mt-4 pt-4 border-t border-white/5">
                        <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Beneficios</p>
                        {currentTier.benefits.map((b, i) => (
                          <div key={i} className="flex items-center gap-2 py-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                            <p className="text-[11px] text-gray-400">{b}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Join with code */}
                  {!myReferral?.referrerId && (
                    <Card className="border-0 bg-gradient-to-b from-[#1428A0]/20 to-transparent backdrop-blur">
                      <CardContent className="p-5">
                        <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                          <UserPlus className="w-4 h-4 text-[#00BFFF]" /> Unirse a una Red
                        </h3>
                        <p className="text-xs text-gray-500 mb-3">Ingresa el codigo de referido de quien te invito.</p>
                        <div className="flex gap-2">
                          <Input placeholder="Ej: SAMABC12" value={referralCode}
                            onChange={(e) => setReferralCode(e.target.value)}
                            className="h-10 bg-black/30 border-white/10 text-white text-sm rounded-xl uppercase font-bold tracking-wider" />
                          <Button onClick={handleJoin} disabled={joinMutation.isPending}
                            className="h-10 px-4 bg-[#1428A0] hover:bg-[#0f1f7a] rounded-xl text-xs font-bold shrink-0">
                            {joinMutation.isPending ? '...' : 'Unirme'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Recent Commissions */}
                  <div>
                    <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[#00BFFF]" /> Comisiones Recientes
                    </h3>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {commissionsData?.commissions && commissionsData.commissions.length > 0 ? (
                        commissionsData.commissions.slice(0, 10).map((c: any) => (
                          <motion.div key={c.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                            className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/[0.07] transition-colors">
                            <div>
                              <p className="text-xs font-semibold">Orden #{c.orderId}</p>
                              <p className="text-[10px] text-gray-500">Nivel {c.level} · {c.percentage}%</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-emerald-400">+${Number(c.amount).toLocaleString()}</p>
                              <p className={`text-[9px] ${c.status === 'pending' ? 'text-yellow-500' : 'text-emerald-500'}`}>
                                {c.status === 'pending' ? 'Pendiente' : 'Pagado'}
                              </p>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <div className="text-center py-6 bg-white/5 rounded-xl border border-white/5">
                          <DollarSign className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                          <p className="text-xs text-gray-500">Sin comisiones aun</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* NETWORK SECTION */}
          {activeSection === 'network' && (
            <motion.div key="network" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {/* Network Tree Visualization */}
              <div className="mb-6">
                <h3 className="font-bold text-base mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#00BFFF]" /> Arbol de Red
                </h3>

                {/* Root - User */}
                <div className="flex flex-col items-center">
                  <motion.div whileHover={{ scale: 1.05 }} className="w-48 p-4 bg-gradient-to-r from-[#1428A0]/30 to-[#0077C8]/20 rounded-xl border border-[#1428A0]/30 text-center">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1428A0] to-[#0077C8] flex items-center justify-center text-white font-bold mx-auto mb-2">
                      {(user?.name || 'Y')[0]}
                    </div>
                    <p className="text-sm font-bold">{user?.name || 'Tu'}</p>
                    <p className="text-[10px] text-gray-400">{currentTier.name}</p>
                    <p className="text-xs font-black text-[#00BFFF] mt-1">${totalEarnings.toLocaleString()}</p>
                  </motion.div>

                  {/* Connector line */}
                  <div className="w-px h-8 bg-[#1428A0]/30" />

                  {/* Direct referrals */}
                  {networkData?.network && networkData.network.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-3xl">
                      {networkData.network.slice(0, 6).map((member: any, i: number) => (
                        <motion.div key={member.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                          <div className="relative">
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-px h-4 bg-[#1428A0]/30" />
                            <div className="p-4 bg-white/5 rounded-xl border border-white/5 hover:border-[#1428A0]/30 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                  {(member.name || 'U')[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold truncate">{member.name || 'Usuario'}</p>
                                  <p className="text-[10px] text-gray-500">{member.email}</p>
                                </div>
                              </div>
                              <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                                <span className="text-[10px] text-gray-500">Red: {member.networkSize || 0}</span>
                                <span className="text-xs font-bold text-[#00BFFF]">${Number(member.totalEarnings || 0).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-white/5 rounded-xl border border-white/5 max-w-md w-full">
                      <Users className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                      <p className="text-sm text-gray-400 mb-1">Aun no tienes referidos directos</p>
                      <p className="text-xs text-gray-600">Comparte tu codigo para comenzar</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Full Member List */}
              {networkData?.network && networkData.network.length > 0 && (
                <div>
                  <h3 className="font-bold text-sm mb-3">Lista Completa ({networkData.network.length})</h3>
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {networkData.network.map((member: any, i: number) => (
                      <motion.div key={member.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                        className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/[0.07] transition-colors">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1428A0] to-[#0077C8] flex items-center justify-center text-xs font-bold shrink-0">
                          {(member.name || 'U')[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{member.name || 'Usuario'}</p>
                          <p className="text-[10px] text-gray-500">{member.email}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[10px] text-gray-500">Red: {member.networkSize || 0}</p>
                          <p className="text-xs font-bold text-[#00BFFF]">${Number(member.totalEarnings || 0).toLocaleString()}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* LEADERBOARD SECTION */}
          {activeSection === 'leaderboard' && (
            <motion.div key="leaderboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="max-w-2xl mx-auto">
                {/* Top 3 Podium */}
                <div className="flex items-end justify-center gap-4 mb-8 pt-4">
                  {LEADERBOARD.slice(0, 3).map((person, i) => {
                    const heights = ['h-28', 'h-36', 'h-24']
                    const positions = [2, 1, 3]
                    const medals = ['from-gray-400 to-gray-500', 'from-yellow-400 to-yellow-500', 'from-amber-600 to-amber-700']
                    const icons = [Medal, CrownIcon, Award]
                    const Icon = icons[i]
                    return (
                      <motion.div key={person.name} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }}
                        className="flex flex-col items-center">
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${medals[i]} flex items-center justify-center text-white font-bold text-sm shadow-lg mb-2`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-bold mb-1">{person.name}</p>
                        <p className="text-[10px] text-gray-500 mb-2">${person.earnings.toLocaleString()}</p>
                        <div className={`${heights[i]} w-20 rounded-t-xl bg-gradient-to-t from-white/10 to-white/5 border border-white/10 flex items-center justify-center`}>
                          <span className="text-2xl font-black text-white/20">#{positions[i]}</span>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>

                {/* Full Leaderboard */}
                <Card className="border-0 bg-white/5 backdrop-blur">
                  <CardContent className="p-4">
                    {LEADERBOARD.map((person, i) => (
                      <motion.div key={person.name} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                        className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i < 3 ? 'bg-gradient-to-br from-[#1428A0] to-[#0077C8] text-white' : 'bg-white/10 text-gray-400'}`}>
                          {i + 1}
                        </div>
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {person.avatar}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold">{person.name}</p>
                          <p className="text-[10px] text-gray-500">{person.tier} · {person.network} miembros</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-emerald-400">${person.earnings.toLocaleString()}</p>
                          <p className="text-[9px] text-gray-500">MXN</p>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-gray-600" />
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
