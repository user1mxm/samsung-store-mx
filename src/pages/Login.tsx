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
import { Lock, Mail, User, Sparkles, ArrowLeft, Eye, EyeOff, Briefcase, Gift } from "lucide-react";

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

function TwitterIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

function getSocialUrl(provider: "google" | "facebook" | "twitter", role: string): string {
  return `/api/auth/${provider}?role=${encodeURIComponent(role)}`;
}

type TabType = "cliente" | "embajador" | "agente";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get("ref") || "";
  const oauthError = searchParams.get("error");

  const [tab, setTab] = useState<TabType>("cliente");
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  const loginMutation = trpc.localAuth.login.useMutation({
    onSuccess: (data) => {
      if (data.user?.role === "admin") {
        toast.error("Las cuentas de administrador deben acceder por /login/admin");
        return;
      }
      if (data.mustChangePassword) {
        toast.info("Debes cambiar tu contraseña temporal");
        window.location.href = "/change-password";
        return;
      }
      toast.success(`Bienvenido ${data.user?.name || ""}`);
      if (data.user?.role === "agent") window.location.href = "/agent";
      else window.location.href = "/";
    },
    onError: (err) => toast.error(err.message),
  });

  const registerMutation = trpc.localAuth.register.useMutation({
    onSuccess: () => {
      toast.success("Cuenta creada. Revisa tu correo para obtener tu contraseña temporal.");
      setIsRegister(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const forgotMutation = trpc.localAuth.forgotPassword.useMutation({
    onSuccess: () => {
      toast.success("Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.");
      setShowForgot(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password, isAdmin: false });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const role = tab === "agente" ? "agent" : "client";
    registerMutation.mutate({ name, email, role: role as "client" | "agent" });
  };

  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault();
    forgotMutation.mutate({ email: forgotEmail });
  };

  const socialRole = tab === "agente" ? "agent" : "client";

  const tabs = [
    { id: "cliente" as TabType, label: "Cliente", icon: User, desc: "Compra los mejores TVs Samsung" },
    { id: "embajador" as TabType, label: "Embajador", icon: Gift, desc: "Gana comisiones compartiendo tu codigo" },
    { id: "agente" as TabType, label: "Agente de Ventas", icon: Briefcase, desc: "Acceso para comisionistas autorizados" },
  ];

  if (showForgot) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#1428A0]/20 flex items-center justify-center p-4 relative overflow-hidden">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="relative z-10 w-full max-w-sm">
          <Card className="shadow-2xl border-0 bg-white/95 dark:bg-[#12121f]/95 backdrop-blur-xl">
            <CardHeader className="text-center pb-2 relative">
              <button onClick={() => setShowForgot(false)} className="absolute left-4 top-4 w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
                <ArrowLeft className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
              <CardTitle className="text-base font-bold text-gray-800 dark:text-white pt-4">Recuperar contraseña</CardTitle>
              <p className="text-[11px] text-gray-400">Te enviaremos un enlace a tu correo</p>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <form onSubmit={handleForgot} className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input placeholder="Correo electronico" type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)}
                    className="pl-10 h-11 rounded-xl bg-gray-50 dark:bg-[#1a1a2a] border-gray-200 dark:border-gray-700" required />
                </div>
                <Button type="submit" className="w-full h-11 samsung-btn-primary rounded-xl font-bold" disabled={forgotMutation.isPending}>
                  {forgotMutation.isPending ? "Enviando..." : "Enviar enlace"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

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
            <button onClick={() => navigate("/")} className="absolute left-4 top-4 w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
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
            {oauthError && (
              <p className="text-[11px] text-red-500 mt-1">Error al conectar con la red social. Intenta de nuevo.</p>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            {/* 3 Tab Selector */}
            <div className="flex gap-1 p-1 bg-gray-100 dark:bg-[#1a1a2a] rounded-xl">
              {tabs.map((t) => (
                <button key={t.id} onClick={() => { setTab(t.id); setIsRegister(false); }}
                  className={`flex-1 py-2.5 rounded-lg text-[10px] font-bold transition-all flex flex-col items-center gap-0.5 ${
                    tab === t.id ? "bg-[#1428A0] text-white shadow-md" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
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
                {tabs.find((t) => t.id === tab)?.desc}
                {refCode && tab === "embajador" && <span className="block mt-1 text-[#1428A0] font-bold">Codigo de referido: {refCode}</span>}
              </motion.p>
            </AnimatePresence>

            {/* Login/Register Toggle */}
            <div className="flex gap-1">
              <button onClick={() => setIsRegister(false)} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${!isRegister ? "bg-gray-200 dark:bg-white/10 text-gray-800 dark:text-white" : "text-gray-400"}`}>Iniciar Sesion</button>
              <button onClick={() => setIsRegister(true)} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${isRegister ? "bg-gray-200 dark:bg-white/10 text-gray-800 dark:text-white" : "text-gray-400"}`}>Crear Cuenta</button>
            </div>

            <AnimatePresence mode="wait">
              {!isRegister ? (
                <motion.div key="login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-3">
                  <form onSubmit={handleLogin} className="space-y-3">
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
                    <div className="flex justify-end">
                      <button type="button" onClick={() => setShowForgot(true)} className="text-[11px] text-[#1428A0] hover:underline">
                        ¿Olvidaste tu contraseña?
                      </button>
                    </div>
                    <Button type="submit" className="w-full h-11 samsung-btn-primary rounded-xl font-bold" disabled={loginMutation.isPending}>
                      {loginMutation.isPending ? "Entrando..." : `Iniciar como ${tabs.find((t) => t.id === tab)?.label}`}
                    </Button>
                  </form>

                  <Separator className="my-1" />

                  <div className="space-y-2">
                    <p className="text-center text-[10px] text-gray-400">O continua con</p>
                    <div className="grid grid-cols-3 gap-2">
                      <a href={getSocialUrl("google", socialRole)}
                        className="flex items-center justify-center gap-1.5 h-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a2a] hover:bg-gray-50 dark:hover:bg-[#22223a] transition-colors text-[11px] font-medium text-gray-700 dark:text-gray-300">
                        <GoogleIcon /><span>Google</span>
                      </a>
                      <a href={getSocialUrl("facebook", socialRole)}
                        className="flex items-center justify-center gap-1.5 h-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a2a] hover:bg-gray-50 dark:hover:bg-[#22223a] transition-colors text-[11px] font-medium text-gray-700 dark:text-gray-300">
                        <FacebookIcon /><span>Facebook</span>
                      </a>
                      <a href={getSocialUrl("twitter", socialRole)}
                        className="flex items-center justify-center gap-1.5 h-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a2a] hover:bg-gray-50 dark:hover:bg-[#22223a] transition-colors text-[11px] font-medium text-gray-700 dark:text-gray-300">
                        <TwitterIcon /><span>X</span>
                      </a>
                    </div>
                  </div>
                </motion.div>
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
                  <p className="text-[11px] text-gray-500 flex items-start gap-1.5 bg-blue-50 dark:bg-blue-950/30 p-2.5 rounded-lg">
                    <Mail className="w-3.5 h-3.5 text-[#1428A0] mt-0.5 shrink-0" />
                    Recibirás una contraseña temporal en tu correo para activar tu cuenta.
                  </p>
                  <Button type="submit" className="w-full h-11 samsung-btn-primary rounded-xl font-bold" disabled={registerMutation.isPending}>
                    {registerMutation.isPending ? "Creando..." : `Crear Cuenta de ${tabs.find((t) => t.id === tab)?.label}`}
                  </Button>

                  <Separator className="my-1" />

                  <div className="space-y-2">
                    <p className="text-center text-[10px] text-gray-400">O regístrate con</p>
                    <div className="grid grid-cols-3 gap-2">
                      <a href={getSocialUrl("google", socialRole)}
                        className="flex items-center justify-center gap-1.5 h-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a2a] hover:bg-gray-50 dark:hover:bg-[#22223a] transition-colors text-[11px] font-medium text-gray-700 dark:text-gray-300">
                        <GoogleIcon /><span>Google</span>
                      </a>
                      <a href={getSocialUrl("facebook", socialRole)}
                        className="flex items-center justify-center gap-1.5 h-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a2a] hover:bg-gray-50 dark:hover:bg-[#22223a] transition-colors text-[11px] font-medium text-gray-700 dark:text-gray-300">
                        <FacebookIcon /><span>Facebook</span>
                      </a>
                      <a href={getSocialUrl("twitter", socialRole)}
                        className="flex items-center justify-center gap-1.5 h-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a2a] hover:bg-gray-50 dark:hover:bg-[#22223a] transition-colors text-[11px] font-medium text-gray-700 dark:text-gray-300">
                        <TwitterIcon /><span>X</span>
                      </a>
                    </div>
                  </div>
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
