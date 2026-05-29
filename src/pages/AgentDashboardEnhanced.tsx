// @ts-nocheck
// src/pages/AgentDashboardEnhanced.tsx — /agent
// Bound to REAL procedures: localAuth.me, agent.getMyStats, referral.getMyReferral,
// referral.getMyNetwork, referral.getMyCommissions, order.list.
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  ChartLineUp, CurrencyDollar, Users, Trophy, ShareNetwork, Storefront,
  ShoppingBag, WhatsappLogo, Copy, ArrowsClockwise, CaretRight, SignOut,
} from "@phosphor-icons/react";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import confetti from "canvas-confetti";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";

const fmtMxn = (n: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(Number(n) || 0);
const fmtNum = (n: number) => new Intl.NumberFormat("es-MX").format(Number(n) || 0);
const fmtDate = (d) => new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(d));

export default function AgentDashboardEnhanced() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const statsQuery       = trpc.agent.getMyStats.useQuery(undefined, { retry: false });
  const referralQuery    = trpc.referral.getMyReferral.useQuery(undefined, { retry: false });
  const networkQuery     = trpc.referral.getMyNetwork.useQuery(undefined, { retry: false });
  const commissionsQuery = trpc.referral.getMyCommissions.useQuery(undefined, { retry: false });
  const ordersQuery      = trpc.order.list.useQuery(undefined, { retry: false });

  const stats       = statsQuery.data ?? null;
  const referral    = referralQuery.data ?? null;
  const network     = networkQuery.data ?? { myCode: null, directCount: 0, network: [], totalNetworkSales: 0 };
  const commData    = commissionsQuery.data ?? { commissions: [], totalPending: 0, totalPaid: 0 };
  const orders      = Array.isArray(ordersQuery.data) ? ordersQuery.data : (ordersQuery.data?.orders ?? []);

  const allCommissions = commData.commissions ?? [];

  const rollup = useMemo(() => {
    const now = Date.now(); const day = 86_400_000;
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const sum = (arr) => arr.reduce((a, c) => a + Number(c.amount || 0), 0);
    const within = (days) => allCommissions.filter((c) => now - new Date(c.createdAt).getTime() <= days * day);
    const today = allCommissions.filter((c) => new Date(c.createdAt) >= todayStart);
    const week = within(7); const prevWeek = allCommissions.filter((c) => { const t = new Date(c.createdAt).getTime(); return t >= now - 14 * day && t < now - 7 * day; });
    const wt = sum(week); const pwt = sum(prevWeek);
    return {
      today: sum(today), todayCount: today.length,
      week: wt, weekDelta: pwt > 0 ? ((wt - pwt) / pwt) * 100 : 0,
      month: sum(within(30)),
      total: Number(commData.totalPaid || 0) + Number(commData.totalPending || 0),
      pending: Number(commData.totalPending || 0),
    };
  }, [allCommissions, commData]);

  const trend = useMemo(() => {
    const days = []; const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
      const next = new Date(d); next.setDate(d.getDate() + 1);
      const value = allCommissions.filter((c) => { const t = new Date(c.createdAt).getTime(); return t >= d.getTime() && t < next.getTime(); }).reduce((a, c) => a + Number(c.amount || 0), 0);
      days.push({ day: new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short" }).format(d), value });
    }
    return days;
  }, [allCommissions]);

  const tier = useMemo(() => {
    const name = stats?.tier?.name ?? null; const rate = stats?.commissionRate ?? stats?.tier?.rate ?? null;
    const totalSales = Number(stats?.totalSales ?? network.totalNetworkSales ?? 0);
    if (name) {
      const colors = { Diamante: "#00BFFF", Oro: "#FFD700", Plata: "#C0C0C0", Bronce: "#CD7F32" };
      const icons = { Diamante: "💎", Oro: "🥇", Plata: "🥈", Bronce: "🥉" };
      return { name, rate: typeof rate === "number" ? `${Math.round(rate * 100)}%` : (rate ?? "—"), color: colors[name] ?? "#1428A0", icon: icons[name] ?? "⭐" };
    }
    if (totalSales >= 50000) return { name: "Diamante", rate: "15%", color: "#00BFFF", icon: "💎" };
    if (totalSales >= 20000) return { name: "Oro", rate: "12%", color: "#FFD700", icon: "🥇" };
    if (totalSales >= 5000) return { name: "Plata", rate: "10%", color: "#C0C0C0", icon: "🥈" };
    return { name: "Bronce", rate: "8%", color: "#CD7F32", icon: "🥉" };
  }, [stats, network]);

  const code = referral?.referralCode ?? network.myCode ?? "";
  const link = code ? `${typeof window !== "undefined" ? window.location.origin : ""}/?ref=${code}` : "";

  const copyLink = async () => { try { await navigator.clipboard.writeText(link); toast.success("Enlace copiado"); confetti({ particleCount: 60, spread: 65, origin: { y: 0.6 } }); } catch { toast.error("No se pudo copiar"); } };
  const shareWa = () => window.open(`https://wa.me/?text=${encodeURIComponent(`¡Hola! Te invito a Samsung Premium Store México con mi enlace exclusivo: ${link}`)}`, "_blank", "noopener");
  const shareNative = async () => { if (navigator.share) { try { await navigator.share({ title: "Samsung Premium Store México", text: "Tecnología Samsung con beneficios exclusivos.", url: link }); } catch {} } else copyLink(); };

  const directReferrals = network.network ?? [];

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div><p className="text-xs text-gray-500">Portal de Agente</p><h1 className="text-lg sm:text-xl font-bold text-gray-900">Hola, {(user?.name || "Agente").split(" ")[0]} 👋</h1></div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate("/mis-pedidos")} className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100"><ShoppingBag size={16} /> Pedidos</button>
            <button onClick={() => navigate("/mi-red")} className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100"><Users size={16} /> Mi red</button>
            <button onClick={() => logout()} className="p-2 rounded-lg hover:bg-gray-100 text-gray-700" aria-label="Salir"><SignOut size={20} /></button>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0077C8] to-[#1428A0] flex items-center justify-center text-white font-semibold text-sm">{(user?.name || "A").charAt(0).toUpperCase()}</div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl p-5 sm:p-6 text-white shadow-lg overflow-hidden relative" style={{ background: `linear-gradient(135deg, ${tier.color}DD, #1428A0)` }}>
          <div className="absolute -right-6 -top-6 text-7xl opacity-30 select-none">{tier.icon}</div>
          <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-widest opacity-80">Tu nivel</div>
              <div className="text-2xl sm:text-3xl font-bold mt-1">Comisionista {tier.name}</div>
              <div className="text-sm opacity-90 mt-1">Ganas <span className="font-bold">{tier.rate}</span> de cada venta de tu red.</div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={shareNative} className="px-4 py-2.5 rounded-lg bg-white text-gray-900 font-medium text-sm hover:bg-gray-100 flex items-center gap-2"><ShareNetwork size={16} weight="bold" /> Compartir</button>
              <button onClick={shareWa} className="px-4 py-2.5 rounded-lg bg-[#25D366] text-white font-medium text-sm hover:bg-[#1FB855] flex items-center gap-2"><WhatsappLogo size={16} weight="fill" /> WhatsApp</button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Stat label="Hoy" value={fmtMxn(rollup.today)} sub={`${rollup.todayCount} comisión${rollup.todayCount === 1 ? "" : "es"}`} icon={CurrencyDollar} color="#10b981" />
          <Stat label="Esta semana" value={fmtMxn(rollup.week)} sub={<span className={rollup.weekDelta >= 0 ? "text-emerald-600" : "text-red-600"}>{rollup.weekDelta >= 0 ? "▲" : "▼"} {Math.abs(rollup.weekDelta).toFixed(1)}%</span>} icon={ChartLineUp} color="#0077C8" />
          <Stat label="Mi red" value={fmtNum(network.directCount)} sub="comisionistas directos" icon={Users} color="#8b5cf6" />
          <Stat label="Total ganado" value={fmtMxn(rollup.total)} sub={`${fmtMxn(rollup.pending)} pendiente`} icon={Trophy} color="#f59e0b" />
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div><h3 className="font-bold text-gray-900">Comisiones (14 días)</h3><p className="text-xs text-gray-500">Acumulado: {fmtMxn(trend.reduce((a, d) => a + d.value, 0))}</p></div>
              <button onClick={() => commissionsQuery.refetch()} className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100"><ArrowsClockwise size={16} /></button>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                  <defs><linearGradient id="gc" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0077C8" stopOpacity={0.4} /><stop offset="95%" stopColor="#0077C8" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`} tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} width={45} />
                  <Tooltip formatter={(v) => [fmtMxn(v), "Comisiones"]} contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }} />
                  <Area type="monotone" dataKey="value" stroke="#0077C8" strokeWidth={2.5} fill="url(#gc)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#1428A0] to-[#0077C8] rounded-2xl p-5 text-white relative overflow-hidden">
            <div className="absolute -right-8 -bottom-8 opacity-10"><ShareNetwork size={120} weight="duotone" /></div>
            <h3 className="font-bold text-lg mb-1">Tu enlace exclusivo</h3>
            <p className="text-sm text-blue-100 mb-4">Compártelo y gana comisión por cada venta.</p>
            <div className="bg-white/10 backdrop-blur rounded-lg p-3 mb-3 border border-white/20">
              <div className="text-[10px] uppercase tracking-widest opacity-70">Tu código</div>
              <div className="font-mono font-bold text-xl tracking-wider truncate">{code || "—"}</div>
            </div>
            <button onClick={copyLink} disabled={!code} className="w-full px-4 py-2.5 rounded-lg bg-white text-[#1428A0] font-semibold text-sm hover:bg-blue-50 flex items-center justify-center gap-2 disabled:opacity-50"><Copy size={16} weight="bold" /> Copiar enlace</button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-gray-200">
            <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-gray-900">Pedidos recientes</h3><button onClick={() => navigate("/mis-pedidos")} className="text-xs text-[#0077C8] hover:underline flex items-center gap-1">Ver todos <CaretRight size={12} /></button></div>
            {orders.length === 0 ? <Empty icon={Storefront} title="Aún no hay pedidos" hint="Las ventas de tu red aparecerán aquí." /> : (
              <ul className="divide-y divide-gray-100">
                {orders.slice(0, 6).map((o) => (
                  <li key={o.id} className="py-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#0077C8] flex items-center justify-center"><ShoppingBag size={18} weight="bold" /></div>
                    <div className="flex-1 min-w-0"><div className="text-sm font-medium text-gray-900 truncate">Pedido #{String(o.id).slice(-6).toUpperCase()}</div><div className="text-xs text-gray-500">{o.createdAt ? fmtDate(o.createdAt) : ""}</div></div>
                    <div className="font-semibold text-gray-900 text-sm">{fmtMxn(Number(o.total ?? o.totalAmount ?? 0))}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-4">Resumen de comisiones</h3>
            <div className="space-y-3">
              <Row label="Pagadas" value={fmtMxn(commData.totalPaid)} color="#10b981" />
              <Row label="Pendientes" value={fmtMxn(commData.totalPending)} color="#f59e0b" />
              <Row label="Ventas de red" value={fmtMxn(network.totalNetworkSales ?? 0)} color="#0077C8" />
              <Row label="Registros" value={fmtNum(allCommissions.length)} color="#8b5cf6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200">
          <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-gray-900">Mi red directa ({fmtNum(network.directCount)})</h3><button onClick={() => navigate("/mi-red")} className="text-xs text-[#0077C8] hover:underline flex items-center gap-1">Ver red completa <CaretRight size={12} /></button></div>
          {directReferrals.length === 0 ? <Empty icon={Users} title="Empieza tu red" hint="Comparte tu enlace y tus comisionistas aparecerán aquí." /> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {directReferrals.slice(0, 6).map((r, i) => {
                const nm = r.users?.name ?? r.name ?? r.referralCode ?? "Comisionista";
                return (
                  <div key={r.referrals?.id ?? r.id ?? i} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0077C8] to-[#00BFFF] flex items-center justify-center text-white font-semibold">{String(nm).charAt(0).toUpperCase()}</div>
                    <div className="flex-1 min-w-0"><div className="text-sm font-medium text-gray-900 truncate">{nm}</div><div className="text-xs text-gray-500">{fmtMxn(Number(r.referrals?.totalNetworkSales ?? r.totalNetworkSales ?? 0))} en red</div></div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, sub, icon: Icon, color }) {
  return (
    <motion.div whileHover={{ y: -2 }} className="bg-white rounded-2xl p-4 border border-gray-200">
      <div className="flex items-start justify-between mb-2"><span className="text-xs text-gray-500 font-medium">{label}</span><div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}15`, color }}><Icon size={16} weight="bold" /></div></div>
      <div className="text-xl sm:text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">{sub}</div>
    </motion.div>
  );
}
function Row({ label, value, color }) {
  return <div className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: color }} /><span className="text-sm text-gray-600">{label}</span></div><span className="font-semibold text-gray-900 text-sm">{value}</span></div>;
}
function Empty({ icon: Icon, title, hint }) {
  return <div className="text-center py-10"><div className="inline-flex w-12 h-12 rounded-full bg-gray-100 items-center justify-center text-gray-400 mb-3"><Icon size={20} weight="duotone" /></div><div className="text-sm font-medium text-gray-900">{title}</div><div className="text-xs text-gray-500 mt-0.5 max-w-xs mx-auto">{hint}</div></div>;
}
