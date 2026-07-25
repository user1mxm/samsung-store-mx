// @ts-nocheck
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/providers/trpc";
import { toast } from "sonner";
import {
  ArrowLeft, DollarSign, ShoppingCart, Users, TrendingUp,
  LogOut, BadgeCheck, Copy, Share2, Crown, Award, Target,
  Zap, Gift, Wallet, UserPlus, BarChart3, Star, ArrowUpRight,
  ChevronRight, Pencil, Check, X, Phone, Mail, Layers,
  Shield, Lock, Unlock, AlertCircle, Settings, RefreshCw,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";

/* ─── Constantes MLM ─── */
const B = "#1428A0";
const A = "#0077C8";
const MAX_SUB_AGENTS = 40;

const MLM_TIERS = [
  { name:"Embajador", min:0,   icon:Award,  color:"#6366F1", bg:"from-indigo-500 to-indigo-600",  rate:8,  maxSubs:10  },
  { name:"Líder",     min:10,  icon:Target, color:"#0077C8", bg:"from-blue-500 to-blue-600",       rate:10, maxSubs:20  },
  { name:"Gerente",   min:50,  icon:Crown,  color:"#00BFFF", bg:"from-cyan-400 to-cyan-500",       rate:12, maxSubs:30  },
  { name:"Director",  min:200, icon:Zap,    color:"#FF6900", bg:"from-orange-500 to-orange-600",   rate:15, maxSubs:40  },
];

const LEVEL_DESC = [
  { level:1, label:"Nivel 1 — Directo",   pct:8, color:"#1428A0", desc:"Ventas de tus sub-agentes directos"  },
  { level:2, label:"Nivel 2 — Red",        pct:4, color:"#0077C8", desc:"Ventas de sub-agentes de tu red"     },
  { level:3, label:"Nivel 3 — Profundo",   pct:2, color:"#00BFFF", desc:"Tercer nivel de la cadena"           },
];

/* ─── helpers ─── */
function StatCard({ icon:Icon, label, value, sub, color=B, trend }:any) {
  return (
    <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}
      className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background:`${color}18`}}>
          <Icon className="w-4 h-4" style={{color}} />
        </div>
        {trend!==undefined&&(
          <span className={`text-[10px] font-bold flex items-center gap-0.5 ${trend>=0?"text-green-500":"text-red-500"}`}>
            <ArrowUpRight className={`w-3 h-3 ${trend<0?"rotate-180":""}`}/>{Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-xl font-black text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      {sub&&<p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
    </motion.div>
  );
}

/* ─── Rate Editor ─── */
function RateEditor({ subAgent, onSave, saving }:any) {
  const [rate, setRate] = useState<string>(String(subAgent.customRate ?? 8));
  const [notes, setNotes] = useState("");
  const [open, setOpen] = useState(false);

  const handleSave = () => {
    const n = parseFloat(rate);
    if (isNaN(n)||n<0||n>25) { toast.error("Tasa entre 0% y 25%"); return; }
    onSave({ subAgentUserId: subAgent.userId, rate:n, notes });
    setOpen(false);
  };

  if (!open) return (
    <button onClick={()=>setOpen(true)}
      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-bold hover:bg-blue-100 transition-colors">
      <Pencil className="w-2.5 h-2.5"/>
      {subAgent.customRate != null ? `${subAgent.customRate}%` : "8%"}
    </button>
  );

  return (
    <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}}
      className="flex items-center gap-2 bg-white rounded-xl border border-blue-200 p-2 shadow-lg">
      <div className="relative">
        <Input value={rate} onChange={e=>setRate(e.target.value)} type="number" min="0" max="25" step="0.5"
          className="w-20 h-7 text-xs rounded-lg text-center pr-5" />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
      </div>
      <button onClick={handleSave} disabled={saving}
        className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center">
        <Check className="w-3 h-3"/>
      </button>
      <button onClick={()=>setOpen(false)}
        className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center">
        <X className="w-3 h-3"/>
      </button>
    </motion.div>
  );
}

/* ─── Sub-agent row ─── */
function SubAgentRow({ agent, onSetRate, saving }:any) {
  const initials = agent.name?.split(" ").map((w:string)=>w[0]).join("").slice(0,2).toUpperCase();
  const sales = Number(agent.totalNetworkSales)||0;
  const earnings = Number(agent.totalEarnings)||0;

  return (
    <motion.div initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}}
      className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1428A0] to-[#0077C8] flex items-center justify-center text-white text-xs font-black flex-shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-gray-900 truncate">{agent.name}</p>
        <p className="text-[10px] text-gray-400 truncate">{agent.email}</p>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-[10px] text-gray-500">Ventas: <strong>${sales.toLocaleString()}</strong></span>
          {agent.networkSize>0&&<span className="text-[10px] text-gray-400">Red: {agent.networkSize}</span>}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <p className="text-xs font-black text-green-600">${earnings.toLocaleString()}</p>
        <RateEditor subAgent={agent} onSave={onSetRate} saving={saving} />
      </div>
    </motion.div>
  );
}

/* ─── Referral code card ─── */
function ReferralCard({ code }:{ code:string|null }) {
  const copy = () => { navigator.clipboard.writeText(code ?? ""); toast.success("Código copiado"); };
  const url  = `${window.location.origin}/login?ref=${code}`;

  if(!code) return (
    <div className="bg-gray-50 rounded-2xl p-4 text-center text-sm text-gray-400">
      Cargando código...
    </div>
  );

  return (
    <div className="bg-gradient-to-br from-[#1428A0] to-[#0077C8] rounded-2xl p-5 text-white">
      <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-2">Tu código de referido</p>
      <div className="flex items-center gap-3 mb-4">
        <p className="text-3xl font-black tracking-widest">{code}</p>
        <button onClick={copy} className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center hover:bg-white/30">
          <Copy className="w-4 h-4"/>
        </button>
      </div>
      <p className="text-[10px] opacity-60 mb-3 truncate">{url}</p>
      <button onClick={()=>{ navigator.clipboard.writeText(url); toast.success("Link copiado"); }}
        className="flex items-center gap-2 px-3 py-2 bg-white/15 rounded-xl text-xs font-bold hover:bg-white/25 w-full justify-center">
        <Share2 className="w-3.5 h-3.5"/> Compartir link de referido
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════ */
export default function AgentDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [tab, setTab] = useState("ventas");
  const [joinCode, setJoinCode] = useState("");

  /* queries */
  const { data: orders }         = trpc.order.list.useQuery();
  const { data: products }       = trpc.product.list.useQuery();
  const { data: myReferral }     = trpc.referral.getMyReferral.useQuery();
  const { data: networkData, refetch:refetchNet } = trpc.referral.getMyNetwork.useQuery();
  const { data: commissionsData }= trpc.referral.getMyCommissions.useQuery();
  const { data: netStats, refetch:refetchStats } = trpc.referral.getNetworkStats.useQuery();

  /* mutations */
  const joinMutation = trpc.referral.joinWithCode.useMutation({
    onSuccess:()=>{ toast.success("¡Te uniste exitosamente!"); refetchNet(); refetchStats(); },
    onError:(e:any)=>toast.error(e.message),
  });
  const setRateMutation = trpc.referral.setSubAgentRate.useMutation({
    onSuccess:()=>{ toast.success("Tasa actualizada ✓"); refetchNet(); refetchStats(); },
    onError:(e:any)=>toast.error(e.message),
  });

  /* derived */
  const myOrders   = (orders||[]).filter(o=>o.agentId===user?.id);
  const totalSales = myOrders.reduce((s,o)=>s+Number(o.total||0),0);
  const totalEarnings  = Number(commissionsData?.totalPending||0)+Number(commissionsData?.totalPaid||0);
  const pendingPay = Number(commissionsData?.totalPending||0);

  const subAgents  = netStats?.subAgents ?? networkData?.network ?? [];
  const subCount   = subAgents.length;
  const subLimit   = netStats?.subAgentLimit ?? MAX_SUB_AGENTS;
  const pct        = Math.min(100, (subCount/subLimit)*100);

  const tier = useMemo(()=> [...MLM_TIERS].reverse().find(t=>subCount>=t.min)||MLM_TIERS[0], [subCount]);
  const nextTier = useMemo(()=> MLM_TIERS.find(t=>t.min>subCount), [subCount]);

  const salesData = [
    {dia:"Lun",ventas:14500,comision:1160},{dia:"Mar",ventas:8200,comision:656},
    {dia:"Mié",ventas:19800,comision:1584},{dia:"Jue",ventas:24200,comision:1936},
    {dia:"Vie",ventas:18100,comision:1448},{dia:"Sáb",ventas:35500,comision:2840},
    {dia:"Dom",ventas:28200,comision:2256},
  ];

  const TierIcon = tier.icon;

  const TABS = [
    { id:"ventas",   label:"Ventas",   icon:BarChart3 },
    { id:"red",      label:"Mi Red",   icon:Users     },
    { id:"comisiones",label:"Comisiones",icon:Wallet  },
    { id:"catalogo", label:"Catálogo", icon:ShoppingCart },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#0077C8] to-[#1428A0] text-white sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={()=>navigate("/")} className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center hover:bg-white/25">
              <ArrowLeft className="w-4 h-4"/>
            </button>
            <BadgeCheck className="w-4 h-4 opacity-80"/>
            <span className="font-black tracking-wider text-sm">PORTAL AGENTE</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/15 text-[10px] font-bold`}>
              <TierIcon className="w-3 h-3"/>{tier.name}
            </div>
            <span className="text-xs hidden sm:block opacity-80">{user?.name}</span>
            <button onClick={()=>{logout();navigate("/login");}}
              className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center hover:bg-white/25">
              <LogOut className="w-4 h-4"/>
            </button>
          </div>
        </div>
        {/* tabs */}
        <div className="max-w-5xl mx-auto px-4 flex gap-0">
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
                tab===t.id?"border-white text-white":"border-transparent text-white/50 hover:text-white/80"
              }`}>
              <t.icon className="w-3.5 h-3.5"/>{t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-5">

        {/* ══ VENTAS ══ */}
        {tab==="ventas"&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-5">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard icon={DollarSign}    label="Ventas totales" value={`$${totalSales.toLocaleString()}`} color={B} trend={8}/>
              <StatCard icon={Wallet}        label="Comisiones" value={`$${Math.round(totalEarnings).toLocaleString()}`} color="#28a745"/>
              <StatCard icon={ShoppingCart}  label="Mis órdenes" value={myOrders.length} sub={`${myOrders.filter(o=>o.status==="pending").length} pendientes`} color={A}/>
              <StatCard icon={Users}         label="Mi red" value={subCount} sub={`de ${subLimit} máx`} color="#FF6900"/>
            </div>

            {/* Tier + progreso */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tier.bg} flex items-center justify-center text-white`}>
                    <TierIcon className="w-5 h-5"/>
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-900">Nivel {tier.name}</p>
                    <p className="text-[10px] text-gray-400">{tier.rate}% comisión base · hasta {tier.maxSubs} sub-agentes</p>
                  </div>
                </div>
                {nextTier&&(
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400">Siguiente nivel</p>
                    <p className="text-xs font-bold text-gray-700">{nextTier.name} ({nextTier.min} sub-agentes)</p>
                  </div>
                )}
              </div>
              {nextTier&&(
                <div>
                  <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                    <span>{subCount} sub-agentes</span><span>Meta: {nextTier.min}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div initial={{width:0}} animate={{width:`${(subCount/nextTier.min)*100}%`}}
                      className={`h-full bg-gradient-to-r ${tier.bg} rounded-full`} transition={{duration:1,ease:"easeOut"}}/>
                  </div>
                </div>
              )}
            </div>

            {/* Chart */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <p className="text-sm font-bold text-gray-900 mb-4">Ventas esta semana</p>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={salesData}>
                  <defs><linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={B} stopOpacity={0.15}/><stop offset="95%" stopColor={B} stopOpacity={0}/>
                  </linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                  <XAxis dataKey="dia" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}}/>
                  <Tooltip formatter={(v:any)=>`$${v.toLocaleString()}`}/>
                  <Area type="monotone" dataKey="ventas" stroke={B} fill="url(#gA)" strokeWidth={2}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* ══ MI RED (MLM) ══ */}
        {tab==="red"&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-5">

            {/* Código de referido */}
            <ReferralCard code={myReferral?.referralCode??networkData?.myCode??null}/>

            {/* Capacidad de sub-agentes */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-gray-900">Capacidad de red</p>
                <span className={`text-xs font-black ${subCount>=subLimit?"text-red-500":"text-gray-700"}`}>
                  {subCount}/{subLimit}
                </span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
                <motion.div initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:1,ease:"easeOut"}}
                  className={`h-full rounded-full ${pct>=90?"bg-red-500":pct>=70?"bg-amber-500":"bg-gradient-to-r from-[#1428A0] to-[#0077C8]"}`}/>
              </div>
              <div className="flex items-center justify-between text-[10px] text-gray-400">
                <span>{subLimit-subCount} espacios disponibles</span>
                <span className={pct>=90?"text-red-500 font-bold":""}>
                  {pct>=100?"¡Límite alcanzado!":pct>=90?"Casi lleno":""}
                </span>
              </div>
            </div>

            {/* Estructura de comisiones */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <p className="text-sm font-bold text-gray-900 mb-3">Estructura de comisiones</p>
              <div className="space-y-2">
                {LEVEL_DESC.map(l=>(
                  <div key={l.level} className="flex items-center gap-3 p-3 rounded-xl" style={{background:`${l.color}08`}}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-black flex-shrink-0"
                      style={{background:l.color}}>N{l.level}</div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-gray-900">{l.label}</p>
                      <p className="text-[10px] text-gray-400">{l.desc}</p>
                    </div>
                    <span className="text-lg font-black" style={{color:l.color}}>{l.pct}%</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-3 flex items-center gap-1">
                <AlertCircle className="w-3 h-3"/> Las tasas pueden ser personalizadas por sub-agente (0%–25%)
              </p>
            </div>

            {/* Lista de sub-agentes */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <p className="text-sm font-bold text-gray-900">
                  Mis sub-agentes
                  <span className="ml-2 text-[10px] font-normal text-gray-400">({subCount} activos)</span>
                </p>
                {/* Unirse a una red si no tiene referidor */}
                {!myReferral?.referrerId && (
                  <div className="flex items-center gap-2">
                    <Input value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase())}
                      placeholder="Código SAM..." className="h-8 w-28 rounded-xl text-xs text-center font-mono"/>
                    <Button onClick={()=>{ if(!joinCode.trim()){toast.error("Ingresa un código");return;} joinMutation.mutate({code:joinCode.trim()}); }}
                      disabled={joinMutation.isPending} className="h-8 px-3 rounded-xl text-xs text-white" style={{background:B}}>
                      Unirse
                    </Button>
                  </div>
                )}
              </div>

              {subAgents.length > 0 ? (
                <div className="divide-y divide-gray-50 p-2">
                  {subAgents.map((a:any)=>(
                    <SubAgentRow key={a.userId} agent={a}
                      onSave={(d:any)=>setRateMutation.mutate(d)}
                      saving={setRateMutation.isPending}/>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Users className="w-10 h-10 text-gray-200 mx-auto mb-3"/>
                  <p className="text-sm text-gray-400 mb-1">Aún no tienes sub-agentes</p>
                  <p className="text-xs text-gray-400">Comparte tu código para que otros se unan a tu red</p>
                </div>
              )}
            </div>

            {/* Stats de red */}
            {netStats&&(
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
                  <p className="text-lg font-black text-gray-900">{netStats.networkSize}</p>
                  <p className="text-[10px] text-gray-400">Red total</p>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
                  <p className="text-lg font-black text-green-600">${Number(netStats.totalEarnings).toLocaleString()}</p>
                  <p className="text-[10px] text-gray-400">Ganancias red</p>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
                  <p className="text-lg font-black text-[#1428A0]">${Number(netStats.totalNetworkSales).toLocaleString()}</p>
                  <p className="text-[10px] text-gray-400">Ventas red</p>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ══ COMISIONES ══ */}
        {tab==="comisiones"&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-5">
            {/* Resumen */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center mb-3">
                  <Wallet className="w-4 h-4 text-amber-600"/>
                </div>
                <p className="text-2xl font-black text-amber-600">${pendingPay.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Pendiente de pago</p>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center mb-3">
                  <Check className="w-4 h-4 text-green-600"/>
                </div>
                <p className="text-2xl font-black text-green-600">${Number(commissionsData?.totalPaid||0).toLocaleString()}</p>
                <p className="text-xs text-gray-500">Total pagado</p>
              </div>
            </div>

            {/* Historial */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <p className="text-sm font-bold text-gray-900">Historial de comisiones</p>
              </div>
              <div className="divide-y divide-gray-50">
                {(commissionsData?.commissions||[]).length > 0 ? (
                  (commissionsData.commissions).map((c:any)=>(
                    <div key={c.id} className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black text-white"
                          style={{background:LEVEL_DESC[Math.min(c.level-1,2)]?.color??B}}>
                          N{c.level}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900">{Number(c.percentage)}% comisión</p>
                          <p className="text-[10px] text-gray-400">{c.createdAt?new Date(c.createdAt).toLocaleDateString("es-MX"):""}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-green-600">+${Number(c.amount).toLocaleString()}</p>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                          c.status==="paid"?"bg-green-50 text-green-700":
                          c.status==="cancelled"?"bg-red-50 text-red-700":"bg-amber-50 text-amber-700"
                        }`}>{c.status}</span>
                      </div>
                    </div>
                  ))
                ):(
                  <div className="p-8 text-center text-sm text-gray-400">No hay comisiones registradas aún</div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ══ CATÁLOGO ══ */}
        {tab==="catalogo"&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-4">
            <p className="text-sm text-gray-500">Comparte estos productos con tu link de referido para ganar comisiones.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(products||[]).map((p:any)=>(
                <div key={p.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex">
                  <div className="w-24 flex-shrink-0 bg-gray-50">
                    {p.imageUrl
                      ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover"/>
                      : <div className="w-full h-full flex items-center justify-center"><ShoppingCart className="w-6 h-6 text-gray-200"/></div>}
                  </div>
                  <div className="flex-1 p-3 flex flex-col justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-900 line-clamp-2">{p.name}</p>
                      <p className="text-[10px] text-gray-400 font-mono">{p.model}</p>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div>
                        <p className="text-sm font-black text-[#1428A0]">${Number(p.price).toLocaleString()}</p>
                        <p className="text-[10px] text-green-600 font-bold">
                          Tu comisión: ${Math.round(Number(p.price)*0.08).toLocaleString()}
                        </p>
                      </div>
                      <button onClick={()=>{
                        const url=`${window.location.origin}/login?ref=${myReferral?.referralCode??""}`;
                        navigator.clipboard.writeText(url);
                        toast.success("Link copiado con tu referido");
                      }} className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-[10px] font-bold hover:bg-blue-100">
                        <Share2 className="w-3 h-3"/> Compartir
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
