// @ts-nocheck
import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/providers/trpc";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { Lock, Eye, EyeOff, KeyRound, Sparkles } from "lucide-react";

export default function ChangePassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get("token");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const changeMutation = trpc.localAuth.changePassword.useMutation({
    onSuccess: () => {
      toast.success("Contraseña cambiada exitosamente");
      navigate("/");
    },
    onError: (err) => toast.error(err.message),
  });

  const resetMutation = trpc.localAuth.resetPasswordByToken.useMutation({
    onSuccess: () => {
      toast.success("Contraseña restablecida exitosamente");
      navigate("/login");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas nuevas no coinciden");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (resetToken) {
      resetMutation.mutate({ token: resetToken, newPassword });
    } else {
      changeMutation.mutate({ currentPassword, newPassword });
    }
  };

  const isPending = changeMutation.isPending || resetMutation.isPending;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#1428A0]/20 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ y: [0, -15, 0], opacity: [0.05, 0.1, 0.05] }}
          transition={{ duration: 6, repeat: Infinity }}
          className="absolute top-20 left-10 w-72 h-72 bg-[#1428A0] rounded-full blur-[100px]"
        />
        <motion.div
          animate={{ y: [0, 15, 0], opacity: [0.03, 0.08, 0.03] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute bottom-20 right-10 w-96 h-96 bg-[#00BFFF] rounded-full blur-[100px]"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-sm"
      >
        <Card className="shadow-2xl border-0 bg-white/95 dark:bg-[#12121f]/95 backdrop-blur-xl overflow-hidden">
          <CardHeader className="text-center pb-2">
            <div className="flex items-center justify-center gap-2 mb-2 mt-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1428A0] to-[#0077C8] flex items-center justify-center shadow-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-black tracking-wider text-[#1428A0] dark:text-white block">SAMSUNG</span>
                <span className="text-[9px] font-bold tracking-[0.2em] text-gray-400 block">STORE MX</span>
              </div>
            </div>
            <CardTitle className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center justify-center gap-2">
              <KeyRound className="w-4 h-4" />
              {resetToken ? "Restablecer contraseña" : "Cambia tu contraseña"}
            </CardTitle>
            {!resetToken && (
              <p className="text-[11px] text-amber-500 mt-1 font-medium">
                Por seguridad debes cambiar tu contraseña temporal
              </p>
            )}
          </CardHeader>

          <CardContent className="space-y-4 pt-2">
            <form onSubmit={handleSubmit} className="space-y-3">
              {!resetToken && (
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Contraseña temporal actual"
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="pl-10 pr-10 h-11 rounded-xl bg-gray-50 dark:bg-[#1a1a2a] border-gray-200 dark:border-gray-700"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              )}

              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Nueva contraseña (min 6 caracteres)"
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 rounded-xl bg-gray-50 dark:bg-[#1a1a2a] border-gray-200 dark:border-gray-700"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Confirmar nueva contraseña"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 h-11 rounded-xl bg-gray-50 dark:bg-[#1a1a2a] border-gray-200 dark:border-gray-700"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11 samsung-btn-primary rounded-xl font-bold"
                disabled={isPending}
              >
                {isPending ? "Guardando..." : "Guardar nueva contraseña"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
