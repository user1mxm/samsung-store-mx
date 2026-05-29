// @ts-nocheck
// src/components/auth/SocialAuthButtons.tsx
// Wired to the REAL backend endpoints in api/index.ts:
//   /api/auth/google · /api/auth/facebook · /api/auth/twitter   (accept ?role=)
import { useState } from "react";
import { motion } from "framer-motion";
import { GoogleLogo, FacebookLogo, TwitterLogo, Spinner } from "@phosphor-icons/react";

type Provider = "google" | "facebook" | "twitter";

interface Props {
  /** Role passed to the OAuth start endpoint: cliente | agente | embajador. */
  role?: string;
  layout?: "stacked" | "compact";
  providers?: Provider[];
  darkMode?: boolean;
}

const META: Record<Provider, { label: string; bg: string; hover: string; text: string; border: string; Icon: typeof GoogleLogo }> = {
  google:   { label: "Continuar con Google",   bg: "bg-white",      hover: "hover:bg-gray-50",   text: "text-gray-700", border: "border border-gray-300", Icon: GoogleLogo },
  facebook: { label: "Continuar con Facebook", bg: "bg-[#1877F2]",  hover: "hover:bg-[#166FE5]", text: "text-white",    border: "",                       Icon: FacebookLogo },
  twitter:  { label: "Continuar con X",        bg: "bg-black",      hover: "hover:bg-gray-900",  text: "text-white",    border: "",                       Icon: TwitterLogo },
};

function url(provider: Provider, role: string) {
  return `/api/auth/${provider}?role=${encodeURIComponent(role)}`;
}

export function SocialAuthButtons({ role = "cliente", layout = "stacked", providers = ["google", "facebook", "twitter"], darkMode = false }: Props) {
  const [loading, setLoading] = useState<Provider | null>(null);
  const go = (p: Provider) => { setLoading(p); window.location.href = url(p, role); };

  if (layout === "compact") {
    return (
      <div className="flex items-center justify-center gap-3">
        {providers.map((p) => {
          const m = META[p]; const Icon = m.Icon; const busy = loading === p;
          return (
            <motion.button key={p} type="button" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              disabled={loading !== null} onClick={() => go(p)} aria-label={m.label}
              className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm transition-all ${m.bg} ${m.hover} ${m.text} ${m.border} disabled:opacity-50`}>
              {busy ? <Spinner size={20} className="animate-spin" weight="bold" /> : <Icon size={22} weight="bold" />}
            </motion.button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      {providers.map((p) => {
        const m = META[p]; const Icon = m.Icon; const busy = loading === p;
        return (
          <motion.button key={p} type="button" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
            disabled={loading !== null} onClick={() => go(p)}
            className={`w-full h-12 rounded-lg flex items-center justify-center gap-3 font-medium text-sm transition-all ${m.bg} ${m.hover} ${m.text} ${m.border} disabled:opacity-50`}>
            {busy ? <><Spinner size={20} className="animate-spin" weight="bold" /><span>Redirigiendo…</span></>
                  : <><Icon size={20} weight="bold" /><span>{m.label}</span></>}
          </motion.button>
        );
      })}
    </div>
  );
}

export function AuthDivider({ darkMode = false, label = "o" }: { darkMode?: boolean; label?: string }) {
  return (
    <div className="flex items-center gap-4 my-6">
      <div className={`flex-1 h-px ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
      <span className={`text-xs uppercase tracking-wider ${darkMode ? "text-gray-500" : "text-gray-400"}`}>{label}</span>
      <div className={`flex-1 h-px ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
    </div>
  );
}
