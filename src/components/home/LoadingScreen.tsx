import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const PARTICLES = Array.from({ length: 8 }, (_, i) => ({
  id: i,
  angle: (i / 8) * 360,
  delay: i * 0.12,
  size: i % 2 === 0 ? 3 : 2,
}))

export function LoadingScreen({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2400)
    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.04 }}
            transition={{ duration: 0.7, ease: 'easeInOut' }}
            className="fixed inset-0 z-[100] bg-[#06060d] flex flex-col items-center justify-center overflow-hidden"
          >
            {/* Aurora background orbs */}
            <motion.div
              className="absolute w-[600px] h-[600px] rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, #1428A040 0%, transparent 70%)', top: '10%', left: '20%' }}
              animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute w-[400px] h-[400px] rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, #00BFFF25 0%, transparent 70%)', bottom: '15%', right: '20%' }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            />

            {/* Logo container */}
            <motion.div
              initial={{ scale: 0.6, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex items-center justify-center mb-8"
            >
              {/* Outer orbit ring */}
              <motion.div
                className="absolute w-[120px] h-[120px] rounded-full"
                style={{ border: '1px solid rgba(20,40,160,0.3)' }}
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              >
                <motion.div
                  className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#1428A0]"
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>

              {/* Inner orbit ring */}
              <motion.div
                className="absolute w-[88px] h-[88px] rounded-full"
                style={{ border: '1px solid rgba(0,191,255,0.25)' }}
                animate={{ rotate: -360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              >
                <motion.div
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#00BFFF]"
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                />
              </motion.div>

              {/* Glow ring */}
              <motion.div
                className="absolute w-[72px] h-[72px] rounded-2xl"
                style={{ boxShadow: '0 0 30px rgba(20,40,160,0.5), 0 0 60px rgba(0,191,255,0.2)' }}
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />

              {/* Logo box */}
              <motion.div
                className="relative w-[68px] h-[68px] rounded-2xl bg-gradient-to-br from-[#1428A0] via-[#0055A5] to-[#00BFFF] flex items-center justify-center shadow-2xl"
                animate={{ boxShadow: ['0 0 20px #1428A060', '0 0 40px #1428A080', '0 0 20px #1428A060'] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              >
                <motion.span
                  className="text-white text-3xl font-black tracking-tight select-none"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  S
                </motion.span>
              </motion.div>

              {/* Floating particles */}
              {PARTICLES.map(p => (
                <motion.div
                  key={p.id}
                  className="absolute rounded-full bg-[#00BFFF]"
                  style={{
                    width: p.size,
                    height: p.size,
                    left: `calc(50% + ${Math.cos((p.angle * Math.PI) / 180) * 56}px)`,
                    top: `calc(50% + ${Math.sin((p.angle * Math.PI) / 180) * 56}px)`,
                  }}
                  animate={{ opacity: [0, 1, 0], scale: [0, 1.4, 0] }}
                  transition={{ duration: 1.8, repeat: Infinity, delay: p.delay }}
                />
              ))}
            </motion.div>

            {/* Brand text */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="text-center"
            >
              <p className="logo-shimmer text-lg font-black tracking-[0.25em] uppercase mb-1">
                SAMSUNG
              </p>
              <p className="text-gray-500 text-[11px] tracking-[0.35em] font-semibold uppercase">
                STORE MX
              </p>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-gray-600 text-[10px] mt-3 tracking-widest font-medium"
            >
              Cargando experiencia premium...
            </motion.p>

            {/* Progress bar */}
            <div className="mt-5 w-40 h-[2px] bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#1428A0] via-[#0077C8] to-[#00BFFF]"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 2.1, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {!loading && children}
    </>
  )
}
