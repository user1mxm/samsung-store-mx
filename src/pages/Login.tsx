// @ts-nocheck
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/providers/trpc";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import {
  Mail, Lock, User, Eye, EyeOff, ArrowLeft, Phone,
  ShieldCheck, Gift, Briefcase, Sparkles, Globe,
  Chrome, Facebook, Hash, Check, ChevronRight, AlertCircle,
} from "lucide-react";

/* ─── OAuth helpers ─── */
function oauthUrl(provider: "google" | "facebook" | "twitter", role: string) {
  return `/api/oauth/${provider}?role=${role}`;
}

/* ─── Social Button ─── */
function SocialBtn({ provider, role, label, icon: Icon, color }: any) {
  return (
    <a href={oauthUrl(provider, role)}
      className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
      style={{ borderColor: color, color }}>
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1 text-center">{label}</span>
    </a>
  );
}

/* ─── Password strength ─── */
function PasswordStrength({ value }: { value: string }) {
  const checks = [
    { label: "6+ caracteres", ok: value.length >= 6 },
    { label: "Mayúscula", ok: /[A-Z]/.test(value) },
    { label: "Número", ok: /[0-9]/.test(value) },
    { label: "Especial", ok: /[^A-Za-z0-9]/.test(value) },
  ];
  const score = checks.filter(c => c.ok).length;
  const colors = ["bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-green-400", "bg-green-500"];

  if (!value) return null;
  return (
    <div className="space-y-2 mt-1">
      <div className="flex gap-1">
        {[0,1,2,3].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < score ? colors[score] : "bg-gray-200"}`} />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {checks.map(c => (
          <span key={c.label} className={`text-[10px] flex items-center gap-1 ${c.ok ? "text-green-600" : "text-gray-400"}`}>
            <Check className={`w-2.5 h-2.5 ${c.ok ? "opacity-100" : "opacity-0"}`} />{c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════ */
type TabType = "cliente" | "agente";
type Mode = "login" | "register";

export default function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const refCode = params.get("ref") ?? "";
  const roleParam = params.get("role") ?? "";

  const [tab, setTab] = useState<TabType>(roleParam === "agent" ? "agente" : "cliente");
  const [mode, setMode] = useState<Mode>("login");
  const [showPass, setShowPass] = useState(false);

  // Form fields
  const [name, setName]     = useState("");
  const [email, setEmail]   = useState("");
  const [phone, setPhone]   = useState("");
  const [pass, setPass]     = useState("");
  const [ref, setRef]       = useState(refCode);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => { if (refCode) { setTab("agente"); setMode("register"); } }, [refCode]);

  const role = tab === "agente" ? "agent" : "client";

  const loginMut = trpc.localAuth.login.useMutation({
    onSuccess: (d) => {
      toast.success(`¡Bienvenido, ${d.user?.name}!`);
      if (d.user?.role === "admin")  window.location.href = "/admin";
      else if (d.user?.role === "agent") window.location.href = "/agent";
      else window.location.href = "/";
    },
    onError: (e) => toast.error(e.message === "Invalid credentials" ? "Correo o contraseña incorrectos" : e.message),
  });

  const registerMut = trpc.localAuth.register.useMutation({
    onSuccess: (d) => {
      toast.success("¡Cuenta creada! Revisa tu correo.");
      if (d.role === "agent") window.location.href = "/agent";
      else window.location.href = "/";
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "login") {
      loginMut.mutate({ email, password: pass });
    } else {
      if (!agreed) { toast.error("Acepta los términos para continuar"); return; }
      registerMut.mutate({ name, email, password: pass, phone: phone || undefined, role: role as any, referralCode: ref || undefined });
    }
  };

  const isPending = loginMut.isPending || registerMut.isPending;

  const TABS = [
    { id:"cliente", label:"Cliente",       icon:User,      desc:"Compra los mejores TVs Samsung en México" },
    { id:"agente",  label:"Agente / Embajador", icon:Briefcase, desc:"Gana comisiones vendiendo y referiendo" },
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050a1f] via-[#0d1535] to-[#1428A0]/30 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div animate={{y:[0,-20,0],opacity:[0.06,0.12,0.06]}} transition={{duration:7,repeat:Infinity}}
          className="absolute top-10 left-[10%] w-80 h-80 bg-[#1428A0] rounded-full blur-[100px]"/>
        <motion.div animate={{y:[0,20,0],opacity:[0.04,0.08,0.04]}} transition={{duration:9,repeat:Infinity,delay:2}}
          className="absolute bottom-10 right-[10%] w-96 h-96 bg-[#0077C8] rounded-full blur-[120px]"/>
      </div>

      <motion.div initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{duration:0.5}}
        className="relative z-10 w-full max-w-md">

        {/* Back button */}
        <button onClick={()=>navigate("/")}
          className="flex items-center gap-2 text-white/50 hover:text-white text-xs font-bold mb-4 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5"/> Regresar a la tienda
        </button>

        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">

          {/* Header */}
          <div className="bg-gradient-to-r from-[#1428A0] to-[#0077C8] px-6 py-5 text-white text-center">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6"/>
            </div>
            <h1 className="text-lg font-black tracking-wide">SAMSUNG STORE MX</h1>
            <p className="text-xs text-white/60 mt-1">Distribuidor Autorizado Samsung en México</p>
          </div>

          <div className="p-6 space-y-5">
            {/* Tab selector */}
            <div className="flex gap-1 p-1 bg-black/20 rounded-2xl">
              {TABS.map(t=>(
                <button key={t.id} onClick={()=>setTab(t.id)}
                  className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl text-xs font-bold transition-all ${
                    tab===t.id ? "bg-white text-[#1428A0] shadow-lg" : "text-white/50 hover:text-white/80"
                  }`}>
                  <t.icon className="w-4 h-4"/>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab desc */}
            <AnimatePresence mode="wait">
              <motion.p key={tab} initial={{opacity:0,y:4}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-4}}
                className="text-center text-xs text-white/40">
                {TABS.find(t=>t.id===tab)?.desc}
                {refCode && tab==="agente" && (
                  <span className="block mt-1 text-[#00BFFF] font-bold">
                    🎁 Código de referido: <strong>{refCode}</strong>
                  </span>
                )}
              </motion.p>
            </AnimatePresence>

            {/* Login / Register toggle */}
            <div className="flex gap-1 p-1 bg-black/20 rounded-xl">
              {(["login","register"] as Mode[]).map(m=>(
                <button key={m} onClick={()=>setMode(m)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                    mode===m ? "bg-[#1428A0] text-white" : "text-white/40 hover:text-white/70"
                  }`}>
                  {m==="login"?"Iniciar sesión":"Crear cuenta"}
                </button>
              ))}
            </div>

            {/* Form */}
            <AnimatePresence mode="wait">
              <motion.form key={`${tab}-${mode}`} initial={{opacity:0,x:mode==="register"?16:-16}}
                animate={{opacity:1,x:0}} exit={{opacity:0}} onSubmit={handleSubmit} className="space-y-3">

                {mode==="register" && (
                  <div className="relative">
                    <User className="absolute left-3 top-3.5 w-4 h-4 text-white/30"/>
                    <Input value={name} onChange={e=>setName(e.target.value)} placeholder="Nombre completo"
                      required className="pl-10 h-11 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#1428A0]"/>
                  </div>
                )}

                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 w-4 h-4 text-white/30"/>
                  <Input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Correo electrónico"
                    type="email" required className="pl-10 h-11 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#1428A0]"/>
                </div>

                {mode==="register" && tab==="agente" && (
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 w-4 h-4 text-white/30"/>
                    <Input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Teléfono / WhatsApp (+52...)"
                      type="tel" className="pl-10 h-11 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#1428A0]"/>
                  </div>
                )}

                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 w-4 h-4 text-white/30"/>
                  <Input value={pass} onChange={e=>setPass(e.target.value)} placeholder="Contraseña"
                    type={showPass?"text":"password"} required
                    className="pl-10 pr-10 h-11 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#1428A0]"/>
                  <button type="button" onClick={()=>setShowPass(s=>!s)}
                    className="absolute right-3 top-3.5 text-white/30 hover:text-white/60">
                    {showPass ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                  </button>
                </div>

                {mode==="register" && <PasswordStrength value={pass}/>}

                {mode==="register" && (
                  <div className="relative">
                    <Hash className="absolute left-3 top-3.5 w-4 h-4 text-white/30"/>
                    <Input value={ref} onChange={e=>setRef(e.target.value.toUpperCase())} placeholder="Código de referido (opcional)"
                      className="pl-10 h-11 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/30 font-mono uppercase focus:border-[#1428A0]"/>
                  </div>
                )}

                {mode==="register" && (
                  <label className="flex items-start gap-2 cursor-pointer">
                    <div onClick={()=>setAgreed(a=>!a)}
                      className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                        agreed ? "bg-[#1428A0] border-[#1428A0]" : "border-white/20"
                      }`}>
                      {agreed && <Check className="w-2.5 h-2.5 text-white"/>}
                    </div>
                    <span className="text-[10px] text-white/40">
                      Acepto los <a href="#" className="text-[#0077C8] underline">términos de servicio</a> y la <a href="#" className="text-[#0077C8] underline">política de privacidad</a>
                    </span>
                  </label>
                )}

                <Button type="submit" disabled={isPending}
                  className="w-full h-12 rounded-xl font-bold text-sm text-white shadow-lg"
                  style={{background:"linear-gradient(135deg,#1428A0,#0077C8)"}}>
                  {isPending ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                      {mode==="login"?"Entrando...":"Creando cuenta..."}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      {mode==="login"
                        ? `Iniciar como ${tab==="agente"?"Agente":"Cliente"}`
                        : `Crear cuenta de ${tab==="agente"?"Agente":"Cliente"}`}
                      <ChevronRight className="w-4 h-4"/>
                    </span>
                  )}
                </Button>
              </motion.form>
            </AnimatePresence>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10"/>
              <span className="text-[10px] text-white/30 font-bold">O continúa con</span>
              <div className="flex-1 h-px bg-white/10"/>
            </div>

            {/* Social login */}
            <div className="grid grid-cols-1 gap-2">
              <a href={`/api/oauth/google?role=${role}`}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-bold hover:bg-white/10 transition-all">
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continuar con Google
              </a>
              <a href={`/api/oauth/facebook?role=${role}`}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-bold hover:bg-white/10 transition-all">
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Continuar con Facebook
              </a>
            </div>

            {/* Agente benefits box */}
            {tab==="agente" && (
              <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
                className="bg-gradient-to-br from-[#1428A0]/20 to-[#0077C8]/10 border border-[#1428A0]/30 rounded-2xl p-4">
                <p className="text-xs font-bold text-[#0077C8] mb-2 flex items-center gap-1.5">
                  <Gift className="w-3.5 h-3.5"/> Beneficios como Agente
                </p>
                <div className="space-y-1.5">
                  {[
                    "8% de comisión por venta directa",
                    "4% de comisión por nivel 2 de tu red",
                    "Hasta 40 sub-agentes en tu equipo",
                    "Acceso a portal exclusivo con métricas",
                    "Soporte prioritario vía WhatsApp",
                  ].map((b,i)=>(
                    <div key={i} className="flex items-center gap-2 text-[11px] text-white/60">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#0077C8] flex-shrink-0"/>
                      {b}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            <p className="text-center text-[10px] text-white/20">
              Al continuar aceptas nuestros términos y política de privacidad.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
