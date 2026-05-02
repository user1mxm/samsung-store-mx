import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function LoadingScreen({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="fixed inset-0 z-[100] bg-[#0a0a0f] flex flex-col items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative"
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#1428A0] to-[#00BFFF] flex items-center justify-center mb-6 shadow-2xl shadow-blue-900/40">
                <span className="text-white text-2xl font-black tracking-tight">S</span>
              </div>
              <motion.div
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#00BFFF]"
                animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-white font-bold text-sm tracking-[0.15em] uppercase"
            >
              Samsung Store MX
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-gray-500 text-[10px] mt-2 tracking-wider"
            >
              Cargando experiencia premium...
            </motion.p>
            <div className="mt-6 w-32 h-[2px] bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#1428A0] to-[#00BFFF]"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 1.8, ease: 'easeInOut' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {!loading && children}
    </>
  )
}
