// @ts-nocheck
// src/pages/AgentLogin.tsx — /login/agent
// Real React agent login wired to localAuth.login({ email, password, isAdmin:false }).
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Envelope, Lock, Eye, EyeSlash, ArrowRight, Spinner, ShieldCheck, Users, Trophy, ChartLineUp } from "@phosphor-icons/react";
import { trpc } from "@/providers/trpc";
import { SocialAuthButtons, AuthDivider } from "@/components/auth/SocialAuthButtons";
import { ForgotPasswordModal } from "@/components/auth/ForgotPasswordModal";

const BENEFITS = [
  { icon: ChartLineUp, label: "Panel de ventas en tiempo real" },
  { icon: Trophy,      label: "Comisiones multinivel hasta 3 niveles" },
  { icon: Users,       label: "Red de comisionistas con seguimiento" },
  { icon: ShieldCheck, label: "Pagos protegidos con Stripe y SPEI" },
];

export default function AgentLogin() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const oauthError = params.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  useEffect(() => {
    if (oauthError) {
      const map = { denied: "Cancelaste la autorización.", email_required: "El proveedor no compartió tu correo.", account_disabled: "Cuenta suspendida. Contacta al administrador.", provider_error: "El proveedor no pudo verificar tu identidad." };
      toast.error(map[oauthError] ?? "No pudimos iniciar sesión con ese proveedor.");
    }
  }, [oauthError]);

  const loginMutation = trpc.localAuth.login.useMutation({
    onSuccess: (data) => {
      if (data.user?.role === "admin") { toast.error("Las cuentas de administrador acceden por /login/admin"); return; }
      if (data.mustChangePassword) { toast.info("Debes cambiar tu contraseña temporal"); window.location.href = "/change-password"; return; }
      toast.success(`¡Bienvenido ${data.user?.name || ""}!`);
      window.location.href = data.user?.role === "agent" ? "/agent" : "/";
    },
    onError: (err) => toast.error(err.message || "No pudimos iniciar sesión."),
  });

  const submit = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error("Ingresa un correo válido"); return; }
    if (password.length < 1) { toast.error("Ingresa tu contraseña"); return; }
    loginMutation.mutate({ email, password, isAdmin: false });
  };

  const loading = loginMutation.isPending;

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* LEFT marketing */}
      <aside className="hidden md:flex md:w-5/12 lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#001E5C] via-[#0d3aa8] to-[#0077C8] text-white p-8 lg:p-12 flex-col justify-between">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-white blur-3xl" />
          <div className="absolute -bottom-32 -right-32 w-[28rem] h-[28rem] rounded-full bg-cyan-400 blur-3xl" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-9 h-9 rounded-lg bg-white text-[#1428A0] flex items-center justify-center font-bold">S</div>
            <span className="font-bold tracking-wide">SAMSUNG STORE MX</span>
          </div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl xl:text-5xl font-bold leading-tight mb-4">Portal de Agentes</motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-blue-100 text-lg max-w-md">
            Gestiona tus ventas, comisiones y red de comisionistas desde un solo lugar.
          </motion.p>
        </div>
        <ul className="relative space-y-4">
          {BENEFITS.map((b, i) => { const Icon = b.icon; return (
            <motion.li key={b.label} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.08 }} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/10 backdrop-blur flex items-center justify-center"><Icon size={18} weight="duotone" /></div>
              <span className="text-blue-50">{b.label}</span>
            </motion.li>
          ); })}
        </ul>
        <div className="relative text-xs text-blue-200/80">© {new Date().getFullYear()} Samsung Premium Store México · Distribuidor Autorizado</div>
      </aside>

      {/* RIGHT form */}
      <main className="flex-1 flex items-center justify-center px-4 py-10 sm:py-12 bg-gray-50">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="md:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-8 h-8 rounded-lg bg-[#1428A0] text-white flex items-center justify-center font-bold text-sm">S</div>
            <span className="font-bold text-gray-900">SAMSUNG STORE MX</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Iniciar sesión</h2>
          <p className="text-sm text-gray-600 mb-6">Accede a tu portal de agente.</p>

          <SocialAuthButtons role="agente" />
          <AuthDivider label="o con tu correo" />

          <label className="block text-xs font-medium text-gray-700 mb-1.5">Correo electrónico</label>
          <div className="relative mb-4">
            <Envelope size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="tu@correo.com" disabled={loading}
              className="w-full pl-10 pr-3 h-11 rounded-lg border border-gray-300 focus:border-[#0077C8] focus:ring-2 focus:ring-[#0077C8]/20 outline-none transition-all bg-white disabled:bg-gray-100" />
          </div>

          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-gray-700">Contraseña</label>
            <button type="button" onClick={() => setShowForgot(true)} className="text-xs text-[#0077C8] hover:underline">¿Olvidaste tu contraseña?</button>
          </div>
          <div className="relative mb-5">
            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="••••••••" disabled={loading}
              className="w-full pl-10 pr-10 h-11 rounded-lg border border-gray-300 focus:border-[#0077C8] focus:ring-2 focus:ring-[#0077C8]/20 outline-none transition-all bg-white disabled:bg-gray-100" />
            <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" aria-label={showPassword ? "Ocultar" : "Mostrar"}>
              {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button type="button" disabled={loading} onClick={submit}
            className="w-full h-12 rounded-lg font-medium text-white flex items-center justify-center gap-2 bg-gradient-to-r from-[#0077C8] to-[#00BFFF] hover:from-[#0066AC] hover:to-[#00A8E8] transition-all shadow-sm hover:shadow-md disabled:opacity-50">
            {loading ? <><Spinner size={18} className="animate-spin" /> Iniciando sesión…</> : <>Entrar al portal <ArrowRight size={18} /></>}
          </button>

          <div className="mt-6 text-center text-xs text-gray-500">
            ¿No tienes cuenta? <Link to="/login" className="text-[#0077C8] font-medium hover:underline">Regístrate</Link>
            <span className="mx-2">·</span>
            ¿Admin? <Link to="/login/admin" className="text-[#1428A0] font-medium hover:underline">Acceso</Link>
          </div>
          <p className="mt-8 text-center text-[10px] text-gray-400 leading-relaxed">
            Al continuar aceptas nuestros <a href="/terminos" className="underline hover:text-gray-600">Términos</a> y la <a href="/privacidad" className="underline hover:text-gray-600">Política de Privacidad</a>.
          </p>
        </motion.div>
      </main>

      <ForgotPasswordModal open={showForgot} onClose={() => setShowForgot(false)} initialEmail={email} role="agent" />
    </div>
  );
}
