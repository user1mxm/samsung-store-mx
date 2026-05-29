// @ts-nocheck
// src/pages/AdminLoginEnhanced.tsx — /login/admin
// Hardened admin portal wired to localAuth.login({ email, password, isAdmin:true }).
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Envelope, Lock, Eye, EyeSlash, ArrowRight, Spinner, ShieldCheck, Warning } from "@phosphor-icons/react";
import { trpc } from "@/providers/trpc";
import { ForgotPasswordModal } from "@/components/auth/ForgotPasswordModal";

export default function AdminLoginEnhanced() {
  const [params] = useSearchParams();
  const oauthError = params.get("error");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (oauthError) toast.error("No pudimos verificar tu identidad.");
  }, [oauthError]);

  const loginMutation = trpc.localAuth.login.useMutation({
    onSuccess: (data) => {
      if (data.user?.role !== "admin") { toast.error("Esta cuenta no tiene permisos administrativos."); return; }
      if (data.mustChangePassword) { window.location.href = "/change-password"; return; }
      toast.success("Acceso administrativo concedido");
      window.location.href = "/admin";
    },
    onError: (err) => { setAttempts((a) => a + 1); toast.error(err.message || "Credenciales incorrectas. El intento ha sido registrado."); },
  });

  const submit = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error("Ingresa un correo válido"); return; }
    if (password.length < 1) { toast.error("Ingresa tu contraseña"); return; }
    loginMutation.mutate({ email, password, isAdmin: true });
  };

  const loading = loginMutation.isPending;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#0a0a0a] via-[#1a0a0a] to-[#2a0606] relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-md">
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-red-500/20 via-red-500/40 to-red-500/20 blur-sm" />
        <div className="relative bg-gray-950 border border-red-900/50 rounded-2xl p-7 sm:p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-lg shadow-red-900/50"><ShieldCheck size={20} className="text-white" weight="fill" /></div>
            <div><div className="text-xs uppercase tracking-widest text-red-400 font-medium">Panel restringido</div><div className="text-white font-bold">Administrador</div></div>
          </div>

          <div className="mb-6 p-3 rounded-lg bg-red-950/40 border border-red-900/50 flex items-start gap-2">
            <Warning size={16} className="text-red-400 mt-0.5 shrink-0" />
            <p className="text-xs text-red-200 leading-relaxed">Todos los accesos son registrados. Solo personal autorizado de Samsung Premium Store México.</p>
          </div>

          <label className="block text-xs font-medium text-gray-300 mb-1.5">Correo administrativo</label>
          <div className="relative mb-4">
            <Envelope size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="admin@samsungstoremx.com" disabled={loading}
              className="w-full pl-10 pr-3 h-11 rounded-lg bg-gray-900 border border-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all text-white placeholder:text-gray-600 disabled:opacity-50" />
          </div>

          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-gray-300">Contraseña</label>
            <button type="button" onClick={() => setShowForgot(true)} className="text-xs text-red-400 hover:text-red-300">¿Olvidaste tu contraseña?</button>
          </div>
          <div className="relative mb-5">
            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="••••••••••••" disabled={loading}
              className="w-full pl-10 pr-10 h-11 rounded-lg bg-gray-900 border border-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all text-white placeholder:text-gray-600 disabled:opacity-50" />
            <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">{showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}</button>
          </div>

          <button type="button" disabled={loading} onClick={submit}
            className="w-full h-12 rounded-lg font-medium text-white flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 transition-all shadow-lg shadow-red-900/40 disabled:opacity-40">
            {loading ? <><Spinner size={18} className="animate-spin" /> Verificando…</> : <>Acceder <ArrowRight size={18} /></>}
          </button>

          {attempts >= 2 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5 p-3 rounded-lg bg-yellow-950/40 border border-yellow-900/50">
              <p className="text-xs text-yellow-200">Múltiples intentos fallidos detectados. El acceso queda registrado.</p>
            </motion.div>
          )}

          <div className="mt-7 pt-5 border-t border-gray-900 text-center">
            <p className="text-[10px] text-gray-600 leading-relaxed">Conexión cifrada · Auditoría activa · IP registrada<br />
              <span className="text-gray-700">¿No eres administrador?</span> <a href="/login/agent" className="text-gray-400 hover:text-white underline">Portal de agentes</a></p>
          </div>
        </div>
      </motion.div>
      <ForgotPasswordModal open={showForgot} onClose={() => setShowForgot(false)} initialEmail={email} role="admin" darkMode />
    </div>
  );
}
