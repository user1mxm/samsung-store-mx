// @ts-nocheck
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/providers/trpc";
import { toast } from "sonner";
import {
  ArrowLeft, DollarSign, ShoppingCart, Users, TrendingUp,
  Package, LogOut, Star, BadgeCheck, Phone, Mail, Target, Award,
  Wallet, ChevronUp, Zap, Calendar, ArrowUpRight, Gift
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

const salesMock = [
  { name: "Lun", ventas: 14500, comision: 725 },
  { name: "Mar", ventas: 8200, comision: 410 },
  { name: "Mie", ventas: 19800, comision: 990 },
  { name: "Jue", ventas: 24200, comision: 1210 },
  { name: "Vie", ventas: 18100, comision: 905 },
  { name: "Sab", ventas: 35500, comision: 1775 },
  { name: "Dom", ventas: 28200, comision: 1410 },
];

const COMMISSION_TIERS = [
  { name: 'Bronce', min: 0, rate: 0.03, color: 'from-amber-600 to-amber-700', icon: Award },
  { name: 'Plata', min: 20000, rate: 0.05, color: 'from-gray-400 to-gray-500', icon: Award },
  { name: 'Oro', min: 50000, rate: 0.07, color: 'from-yellow-400 to-yellow-500', icon: Award },
  { name: 'Platino', min: 100000, rate: 0.10, color: 'from-cyan-400 to-cyan-500', icon: Award },
  { name: 'Diamante', min: 250000, rate: 0.15, color: 'from-blue-500 to-purple-500', icon: Award },
];

export default function AgentDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("ventas");

  const { data: products } = trpc.product.list.useQuery();
  const { data: orders } = trpc.order.list.useQuery();
  const { data: reviews } = trpc.review.list.useQuery();

  const myOrders = (orders || []).filter(o => o.agentId === user?.id);
  const totalSales = myOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const currentTier = COMMISSION_TIERS.slice().reverse().find(t => totalSales >= t.min) || COMMISSION_TIERS[0];
  const nextTier = COMMISSION_TIERS.find(t => t.min > totalSales);
  const commissionRate = currentTier.rate;
  const commission = totalSales * commissionRate;
  const monthlyTarget = nextTier ? nextTier.min : 500000;
  const targetProgress = Math.min(100, (totalSales / monthlyTarget) * 100);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0f]">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#0077C8] to-[#1428A0] text-white sticky top-0 z-40">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => navigate("/")}><ArrowLeft className="w-5 h-5" /></Button>
            <BadgeCheck className="w-5 h-5" />
            <span className="font-bold tracking-wider text-sm">PORTAL AGENTE</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm hidden sm:inline opacity-90">{user?.name}</span>
            <Badge className="bg-white/20 text-white text-[10px] font-bold">AGENTE</Badge>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={logout}><LogOut className="w-4 h-4" /></Button>
          </div>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6">
        {/* Profile + Tier */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <Card className="border-0 shadow-md overflow-hidden">
            <div className={`bg-gradient-to-r ${currentTier.color} p-4`}>
              <div className="flex items-center gap-2 mb-1">
                <currentTier.icon className="w-4 h-4 text-white" />
                <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider">Nivel {currentTier.name}</span>
              </div>
              <p className="text-[10px] text-white/70">{commissionRate * 100}% comision por venta</p>
            </div>
            <CardContent className="p-5 flex flex-col md:flex-row items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1428A0] to-[#0077C8] flex items-center justify-center text-white text-xl font-black shadow-lg">
                {(user?.name || 'A')[0]}
              </div>
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-lg font-black text-gray-900 dark:text-white">{user?.name || 'Agente'}</h2>
                <p className="text-xs text-gray-500 flex items-center gap-3 justify-center md:justify-start mt-1 flex-wrap">
                  <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {user?.email}</span>
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> +52 55 1234 5678</span>
                </p>
              </div>
              <div className="flex gap-3">
                <div className="text-center px-4 py-2.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                  <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">${Math.round(commission).toLocaleString()}</p>
                  <p className="text-[9px] text-emerald-500 uppercase tracking-wider font-bold">Comision Acumulada</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Ventas Totales", value: `$${totalSales.toLocaleString()}`, icon: DollarSign, color: "from-emerald-500 to-emerald-600", trend: "+8.2%" },
            { label: "Mis Ordenes", value: myOrders.length, icon: ShoppingCart, color: "from-[#1428A0] to-[#0f1f7a]", trend: `${myOrders.filter(o => o.status === 'pending').length} pendientes` },
            { label: "Catalogo", value: (products || []).length, icon: Package, color: "from-[#0077C8] to-[#005fa0]", trend: "disponibles" },
            { label: "Tasa Conversion", value: "4.2%", icon: TrendingUp, color: "from-orange-500 to-orange-600", trend: "promedio" },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white mb-2 shadow-md`}>
                    <s.icon className="w-4 h-4" />
                  </div>
                  <p className="text-lg font-black text-gray-900 dark:text-white">{s.value}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{s.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Target Progress */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mb-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2"><Target className="w-4 h-4 text-[#1428A0]" /><span className="text-sm font-bold">Progreso hacia {nextTier ? nextTier.name : 'Meta Maxima'}</span></div>
                <Badge className="bg-[#1428A0]/10 text-[#1428A0] text-[10px] font-bold">{targetProgress.toFixed(0)}%</Badge>
              </div>
              <Progress value={targetProgress} className="h-2.5 mb-2" />
              <div className="flex justify-between text-[10px] text-gray-500">
                <span>${totalSales.toLocaleString()} actual</span>
                <span>${monthlyTarget.toLocaleString()} meta</span>
              </div>
              {nextTier && (
                <p className="text-[10px] text-gray-500 mt-2">Te faltan ${(monthlyTarget - totalSales).toLocaleString()} para subir a nivel {nextTier.name} ({nextTier.rate * 100}% comision)</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-4 mb-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-bold flex items-center gap-2"><TrendingUp className="w-4 h-4 text-[#1428A0]" /> Mis Ventas Semanales</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={salesMock}>
                    <defs><linearGradient id="agentSales" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1428A0" stopOpacity={0.3} /><stop offset="95%" stopColor="#1428A0" stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} contentStyle={{ borderRadius: 12, fontSize: 11 }} />
                    <Area type="monotone" dataKey="ventas" stroke="#1428A0" fill="url(#agentSales)" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-bold flex items-center gap-2"><Wallet className="w-4 h-4 text-[#1428A0]" /> Comisiones Diarias</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={salesMock}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v}`} />
                    <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} contentStyle={{ borderRadius: 12, fontSize: 11 }} />
                    <Bar dataKey="comision" fill="#0077C8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {[
            { id: "ventas", label: "Mis Ventas", icon: ShoppingCart },
            { id: "productos", label: "Catalogo", icon: Package },
            { id: "comisiones", label: "Comisiones", icon: Wallet },
          ].map((t) => (
            <Button key={t.id} variant={activeTab === t.id ? "default" : "outline"}
              className={`rounded-full text-[11px] font-bold capitalize ${activeTab === t.id ? "bg-[#1428A0] text-white shadow-md" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
              onClick={() => setActiveTab(t.id)}><t.icon className="w-3.5 h-3.5 mr-1" />{t.label}</Button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "ventas" && (
            <motion.div key="ventas" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2">
              {myOrders.length === 0 ? (
                <div className="text-center py-10 bg-white dark:bg-[#14141f] rounded-xl"><ShoppingCart className="w-10 h-10 text-gray-300 mx-auto mb-2" /><p className="text-sm text-gray-400">Sin ventas registradas aun</p></div>
              ) : (
                myOrders.map(o => (
                  <div key={o.id} className="flex justify-between items-center p-4 bg-white dark:bg-[#14141f] rounded-xl shadow-sm">
                    <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-[#1428A0]/10 flex items-center justify-center"><ShoppingCart className="w-4 h-4 text-[#1428A0]" /></div>
                      <div><p className="text-xs font-bold">Orden #{o.id}</p><p className="text-[10px] text-gray-500">{new Date(o.createdAt).toLocaleDateString('es-MX')}</p></div>
                    </div>
                    <div className="text-right"><p className="text-sm font-black text-[#1428A0]">${Number(o.total || 0).toLocaleString()}</p><Badge className="text-[10px] bg-emerald-100 text-emerald-700">+${(Number(o.total || 0) * commissionRate).toFixed(0)} com</Badge></div>
                  </div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {activeTab === "productos" && (
            <motion.div key="productos" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(products || []).map(p => (
                <div key={p.id} className="flex gap-3 p-4 bg-white dark:bg-[#14141f] rounded-xl shadow-sm">
                  <img src={p.imageUrl} alt={p.name} className="w-16 h-16 object-cover rounded-lg" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate dark:text-white">{p.name}</p>
                    <p className="text-[10px] text-gray-500">{p.model}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm font-black text-[#1428A0]">${Number(p.price).toLocaleString()}</p>
                      <span className="text-[9px] text-emerald-600 font-bold">+${(Number(p.price) * commissionRate).toFixed(0)} com</span>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {activeTab === "comisiones" && (
            <motion.div key="comisiones" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {/* Commission Summary */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                  <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">${Math.round(commission).toLocaleString()}</p>
                  <p className="text-[9px] text-emerald-500 font-bold uppercase">Ganado</p>
                </div>
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <p className="text-lg font-black text-blue-600 dark:text-blue-400">${Math.round(commission * 0.7).toLocaleString()}</p>
                  <p className="text-[9px] text-blue-500 font-bold uppercase">Disponible</p>
                </div>
                <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                  <p className="text-lg font-black text-orange-600 dark:text-orange-400">${Math.round(commission * 0.3).toLocaleString()}</p>
                  <p className="text-[9px] text-orange-500 font-bold uppercase">Pendiente</p>
                </div>
              </div>

              {/* Tier Progress */}
              <Card className="border-0 shadow-sm mb-4">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-bold flex items-center gap-2"><Award className="w-4 h-4 text-[#1428A0]" /> Niveles de Comision</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {COMMISSION_TIERS.map((tier, i) => {
                    const isCurrent = currentTier.name === tier.name;
                    const isUnlocked = totalSales >= tier.min;
                    return (
                      <div key={tier.name} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isCurrent ? 'bg-[#1428A0]/5 border border-[#1428A0]/20' : 'bg-gray-50 dark:bg-white/5'}`}>
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${tier.color} flex items-center justify-center text-white text-xs font-bold ${!isUnlocked && 'opacity-30 grayscale'}`}>
                          <tier.icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className={`text-xs font-bold ${isCurrent ? 'text-[#1428A0]' : ''}`}>{tier.name}</p>
                            {isCurrent && <Badge className="bg-[#1428A0] text-white text-[8px] px-1.5">Actual</Badge>}
                          </div>
                          <p className="text-[9px] text-gray-500">Min ${tier.min.toLocaleString()} · {tier.rate * 100}% comision</p>
                        </div>
                        {isUnlocked ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <div className="w-4 h-4 rounded-full border-2 border-gray-300" />}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Commission History */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-bold">Historial de Comisiones</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {myOrders.length === 0 ? (
                    <p className="text-center text-sm text-gray-400 py-6">Sin transacciones aun</p>
                  ) : (
                    myOrders.slice(0, 8).map(o => (
                      <div key={o.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                        <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center"><DollarSign className="w-3.5 h-3.5 text-emerald-600" /></div>
                          <div><p className="text-xs font-medium">Orden #{o.id}</p><p className="text-[9px] text-gray-500">{new Date(o.createdAt).toLocaleDateString('es-MX')}</p></div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-emerald-600">+${(Number(o.total || 0) * commissionRate).toFixed(2)}</p>
                          <p className="text-[9px] text-gray-400">{commissionRate * 100}% de ${Number(o.total || 0).toLocaleString()}</p>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
