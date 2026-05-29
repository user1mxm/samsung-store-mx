// @ts-nocheck
// src/components/auth/ForgotPasswordModal.tsx
// Uses the REAL backend flow: localAuth.forgotPassword({ email }) emails a reset
// LINK (token), then the user lands on the reset page handled by
// localAuth.resetPasswordByToken. This modal only triggers the email send.
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Envelope, X, ArrowRight, CheckCircle, Spinner } from "@phosphor-icons/react";
import { trpc } from "@/providers/trpc";

interface Props {
  open: boolean;
  onClose: () => void;
  initialEmail?: string;
  role?: "agent" | "admin" | "customer";
  darkMode?: boolean;
}

export function ForgotPasswordModal({ open, onClose, initialEmail = "", role = "customer", darkMode = false }: Props) {
  const [email, setEmail] = useState(initialEmail);
  const [sent, setSent] = useState(false);
  const accent = role === "admin" ? "#DC2626" : role === "agent" ? "#0077C8" : "#1428A0";

  const forgot = trpc.localAuth.forgotPassword.useMutation({
    onSuccess: () => { setSent(true); },
    onError: () => { setSent(true); }, // anti-enumeration: always show success
  });

  useEffect(() => {
    if (!open) { const t = setTimeout(() => { setSent(false); }, 250); return () => clearTimeout(t); }
  }, [open]);

  const submit = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error("Ingresa un correo válido"); return; }
    forgot.mutate({ email });
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
        <motion.div initial={{ y: 20, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 20, opacity: 0, scale: 0.98 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }} onClick={(e) => e.stopPropagation()}
          className={`relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${darkMode ? "bg-gray-900 text-gray-100" : "bg-white text-gray-900"}`}>
          <div className="h-1" style={{ background: accent }} />
          <button onClick={onClose} className={`absolute top-4 right-4 p-1 rounded-full ${darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"}`} aria-label="Cerrar"><X size={18} /></button>
          <div className="p-7">
            {!sent ? (
              <>
                <h2 className="text-xl font-bold mb-1">Recuperar contraseña</h2>
                <p className={`text-sm mb-5 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Te enviaremos un enlace para restablecerla a tu correo.</p>
                <label className="block text-xs font-medium mb-1.5">Correo electrónico</label>
                <div className="relative mb-4">
                  <Envelope size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? "text-gray-500" : "text-gray-400"}`} />
                  <input type="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="tu@correo.com"
                    className={`w-full pl-10 pr-3 h-11 rounded-lg border outline-none ${darkMode ? "bg-gray-800 border-gray-700 focus:border-gray-500" : "bg-white border-gray-300 focus:border-gray-500"}`} />
                </div>
                <button type="button" disabled={forgot.isPending} onClick={submit}
                  className="w-full h-11 rounded-lg font-medium text-white flex items-center justify-center gap-2 disabled:opacity-60" style={{ background: accent }}>
                  {forgot.isPending ? <Spinner size={18} className="animate-spin" /> : <>Enviar enlace <ArrowRight size={16} /></>}
                </button>
              </>
            ) : (
              <div className="text-center py-2">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12 }}
                  className="inline-flex w-16 h-16 rounded-full items-center justify-center mb-4" style={{ background: `${accent}20`, color: accent }}>
                  <CheckCircle size={36} weight="fill" />
                </motion.div>
                <h2 className="text-xl font-bold mb-1">Revisa tu correo</h2>
                <p className={`text-sm mb-6 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  Si <span className="font-medium">{email}</span> está registrado, te enviamos un enlace para restablecer tu contraseña. Revisa tu bandeja y spam.
                </p>
                <button type="button" onClick={onClose} className="w-full h-11 rounded-lg font-medium text-white" style={{ background: accent }}>Entendido</button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
