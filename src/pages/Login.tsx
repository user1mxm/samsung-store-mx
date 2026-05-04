// @ts-nocheck
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/providers/trpc";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { Globe, Lock, Mail, User, Sparkles, ArrowLeft, Eye, EyeOff, Users, Briefcase, ShieldCheck, Gift } from "lucide-react";

function getOAuthUrl() {
  const kimiAuthUrl = import.meta.env.VITE_KIMI_AUTH_URL;
  const appID = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);
  const url = new URL(`${kimiAuthUrl}/api/oauth/authorize`);
  url.searchParams.set("client_id", appID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "profile");
  url.searchParams.set("state", state);
  return url.toString();
}

type TabType = "cliente" | "embajador" | "agente" | "admin";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get("ref") || "";
  const [tab, setTab] = useState<TabType>("cliente");
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPass, setShowPass] = useState(false);

  const loginMutation = trpc.localAuth.login.useMutation({
    onSuccess: (data) => {
      toast.success(`Bienvenido ${data.user?.name || ''}`);
      if (data.user?.role === 'admin') window.location.href = "/admin";
      else if (data.user?.role === 'agent') window.location.href = "/agent";
      else window.location.href = "/";
    },
    onError: (err) => toast.error(err.message),
  });

  const registerMutation = trpc.localAuth.register.useMutation({
    onSuccess: () => {
      toast.success("Cuenta creada exitosamente");
      window.location.href = "/";
    },
    onError: (err) => toast.error(err.message),
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const role = tab === "agente" ? "agent" : "client";
    registerMutation.mutate({ name, email, password, role: role as "client" | "agent" });
  };

  const tabs = [
    { id: "cliente" as TabType, label: "Cliente", icon: User, desc: "Compra los mejores TVs Samsung" },
    { id: "embajador" as TabType, label: "Embajador", icon: Gift, desc: "Gana comisiones compartiendo tu codigo" },
    { id: "agente" as TabType, label: "Agente", icon: Briefcase, desc: "Acceso para comisionistas autorizados" },
    { id: "admin" as TabType, label: "Admin", icon: ShieldCheck, desc: "Panel administrativo · Acceso restringido" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#1428A0]/20 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div animate={{ y: [0, -15, 0], opacity: [0.05, 0.1, 0.05] }} transition={{ duration: 6, repeat: Infinity }}
          className="absolute top-20 left-10 w-72 h-72 bg-[#1428A0] rounded-full blur-[100px]" />
        <motion.div animate={{ y: [0, 15, 0], opacity: [0.03, 0.08, 0.03] }} transition={{ duration: 8, repeat: Infinity }}
          className="absolute bottom-20 right-10 w-96 h-96 bg-[#00BFFF] rounded-full blur-[100px]" />
      </div>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative z-10 w-full max-w-md">
        <Card className="shadow-2xl border-0 bg-white/95 dark:bg-[#12121f]/95 backdrop-blur-xl overflow-hidden">
          <CardHeader className="text-center pb-2 relative">
            <button onClick={() => navigate('/')} className="absolute left-4 top-4 w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
            <div className="flex items-center justify-center gap-2 mb-2 mt-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1428A0] to-[#0077C8] flex items-center justify-center shadow-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-black tracking-wider text-[#1428A0] dark:text-white block">SAMSUNG</span>
                <span className="text-[9px] font-bold tracking-[0.2em] text-gray-400 block">STORE MX</span>
              </div>
            </div>
            <CardTitle className="text-sm text-gray-500 dark:text-gray-400 font-normal">
              {isRegister ? "Crea tu cuenta" : "Inicia sesion en tu cuenta"}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* 4 Tab Selector */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-gray-100 dark:bg-[#1a1a2a] rounded-xl">
              {tabs.map((t) => (
                <button key={t.id} onClick={() => { setTab(t.id); setIsRegister(false); }}
                  className={`py-2 rounded-lg text-[9px] font-bold transition-all flex flex-col items-center gap-0.5 ${
                    tab === t.id
                      ? t.id === "admin"
                        ? "bg-red-600 text-white shadow-md"
                        : "bg-[#1428A0] text-white shadow-md"
                      : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}>
                  <t.icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab description */}
            <AnimatePresence mode="wait">
              <motion.p key={tab} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                className="text-center text-[11px] text-gray-400">
                {tabs.find(t => t.id === tab)?.desc}
                {refCode && tab === "embajador" && <span className="block mt-1 text-[#1428A0] font-bold">Codigo de referido: {refCode}</span>}
              </motion.p>
            </AnimatePresence>

            {/* Login/Register Toggle – hidden for admin */}
            {tab !== "admin" && (
              <div className="flex gap-1">
                <button onClick={() => setIsRegister(false)} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${!isRegister ? 'bg-gray-200 dark:bg-white/10 text-gray-800 dark:text-white' : 'text-gray-400'}`}>Iniciar Sesion</button>
                <button onClick={() => setIsRegister(true)} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${isRegister ? 'bg-gray-200 dark:bg-white/10 text-gray-800 dark:text-white' : 'text-gray-400'}`}>Crear Cuenta</button>
              </div>
            )}
            {tab === "admin" && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                <ShieldCheck className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-[10px] text-red-600 dark:text-red-400 font-medium">Acceso exclusivo para administradores del sistema. Las cuentas admin son creadas internamente.</p>
              </div>
            )}

            <AnimatePresence mode="wait">
              {(!isRegister || tab === "admin") ? (
                <motion.form key="login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleLogin} className="space-y-3">
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input placeholder="Correo electronico" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-11 rounded-xl bg-gray-50 dark:bg-[#1a1a2a] border-gray-200 dark:border-gray-700" required />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input placeholder="Contrasena" type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10 h-11 rounded-xl bg-gray-50 dark:bg-[#1a1a2a] border-gray-200 dark:border-gray-700" required />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <Button type="submit"
                    className={`w-full h-11 rounded-xl font-bold ${tab === "admin" ? "bg-red-600 hover:bg-red-700 text-white" : "samsung-btn-primary"}`}
                    disabled={loginMutation.isPending}>
                    {loginMutation.isPending ? "Entrando..." : `Iniciar como ${tabs.find(t => t.id === tab)?.label}`}
                  </Button>
                  {tab !== "admin" && (
                    <>
                      <Separator className="my-2" />
                      <Button type="button" variant="outline" className="w-full h-11 rounded-xl border-gray-200 dark:border-gray-700" onClick={() => (window.location.href = getOAuthUrl())}>
                        <Globe className="mr-2 h-4 w-4 text-[#1428A0]" /> Continuar con OAuth
                      </Button>
                    </>
                  )}
                </motion.form>
              ) : (
                <motion.form key="register" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleRegister} className="space-y-3">
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input placeholder="Nombre completo" value={name} onChange={(e) => setName(e.target.value)} className="pl-10 h-11 rounded-xl bg-gray-50 dark:bg-[#1a1a2a] border-gray-200 dark:border-gray-700" required />
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input placeholder="Correo electronico" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-11 rounded-xl bg-gray-50 dark:bg-[#1a1a2a] border-gray-200 dark:border-gray-700" required />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input placeholder="Contrasena (min 6 caracteres)" type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10 h-11 rounded-xl bg-gray-50 dark:bg-[#1a1a2a] border-gray-200 dark:border-gray-700" required />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <Button type="submit" className="w-full h-11 samsung-btn-primary rounded-xl font-bold" disabled={registerMutation.isPending}>
                    {registerMutation.isPending ? "Creando..." : `Crear Cuenta de ${tabs.find(t => t.id === tab)?.label}`}
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>

            <p className="text-center text-[10px] text-gray-400 pt-1">Al continuar, aceptas nuestros terminos y politica de privacidad</p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
