import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";
import { Home, ArrowLeft, Search, Tv } from "lucide-react";
import { motion } from "framer-motion";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#1428A0]/20 text-white overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ y: [0, -20, 0], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 5, repeat: Infinity }}
          className="absolute top-20 left-10 w-64 h-64 bg-[#1428A0]/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ y: [0, 20, 0], opacity: [0.1, 0.15, 0.1] }}
          transition={{ duration: 6, repeat: Infinity }}
          className="absolute bottom-20 right-10 w-80 h-80 bg-[#00BFFF]/10 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 text-center px-4">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="mb-8"
        >
          <div className="w-28 h-28 mx-auto rounded-3xl bg-gradient-to-br from-[#1428A0] to-[#00BFFF] flex items-center justify-center shadow-2xl shadow-blue-900/40">
            <Tv className="w-14 h-14 text-white" />
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-7xl sm:text-9xl font-black mb-2 bg-gradient-to-r from-white via-[#00BFFF] to-[#1428A0] bg-clip-text text-transparent"
        >
          404
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-xl sm:text-2xl font-bold text-gray-300 mb-2"
        >
          Pantalla no encontrada
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="text-sm text-gray-500 mb-8 max-w-md mx-auto"
        >
          Parece que esta pagina se desconecto. No te preocupes, te reconectamos al inicio.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <Button
            className="h-12 px-8 bg-[#1428A0] hover:bg-[#0f1f7a] text-white rounded-full font-bold text-sm"
            onClick={() => navigate("/")}
          >
            <Home className="w-4 h-4 mr-2" /> Volver al Inicio
          </Button>
          <Button
            variant="outline"
            className="h-12 px-8 border-gray-700 text-gray-300 hover:bg-white/5 rounded-full font-bold text-sm"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Pagina Anterior
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-10"
        >
          <p className="text-[10px] text-gray-600 mb-3">Buscar productos populares:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {['Neo QLED 8K', 'OLED S95D', 'Odyssey G9', 'The Frame'].map((product) => (
              <button
                key={product}
                onClick={() => navigate('/?search=' + encodeURIComponent(product))}
                className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-[11px] text-gray-400 hover:bg-[#1428A0]/20 hover:text-white hover:border-[#1428A0]/30 transition-all"
              >
                <Search className="w-2.5 h-2.5 inline mr-1" />
                {product}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
