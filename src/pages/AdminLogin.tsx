// @ts-nocheck
import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/providers/trpc";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Lock, Mail, ShieldCheck, Eye, EyeOff } from "lucide-react";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const loginMutation = trpc.localAuth.login.useMutation({
    onSuccess: (data) => {
      if (data.user?.role !== "admin") {
        toast.error("Acceso denegado: solo administradores");
        return;
      }
      toast.success(`Bienvenido, ${data.user.name}`);
      window.location.href = "/admin";
    },
    onError: (err) => toast.error(err.message),
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password, isAdmin: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#1428A0]/20 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ y: [0, -15, 0], opacity: [0.05, 0.1, 0.05] }}
          transition={{ duration: 6, repeat: Infinity }}
          className="absolute top-20 left-10 w-72 h-72 bg-[#1428A0] rounded-full blur-[100px]"
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
            <div className="flex items-center justify-center gap-2 mb-3 mt-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1428A0] to-[#0077C8] flex items-center justify-center shadow-lg">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-base font-bold text-gray-800 dark:text-white">
              Acceso Administrador
            </CardTitle>
            <p className="text-[11px] text-gray-400 mt-1">Samsung Store MX — Panel de control</p>
          </CardHeader>

          <CardContent className="space-y-4 pt-2">
            <form onSubmit={handleLogin} className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Correo administrador"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 rounded-xl bg-gray-50 dark:bg-[#1a1a2a] border-gray-200 dark:border-gray-700"
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Contraseña"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 rounded-xl bg-gray-50 dark:bg-[#1a1a2a] border-gray-200 dark:border-gray-700"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <Button
                type="submit"
                className="w-full h-11 rounded-xl font-bold bg-[#1428A0] hover:bg-[#0f1f80] text-white"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Verificando..." : "Ingresar al panel"}
              </Button>
            </form>

            <p className="text-center text-[10px] text-gray-400 pt-1">
              Esta página es de uso exclusivo para administradores.{" "}
              <button
                onClick={() => navigate("/login")}
                className="text-[#1428A0] hover:underline"
              >
                Ir al login principal
              </button>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
