import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const PARTICLES = [
  { x: '15%',  y: '20%', size: 4,  dur: 3.8, delay: 0,    color: '#1428A0' },
  { x: '80%',  y: '15%', size: 3,  dur: 4.5, delay: 0.6,  color: '#00BFFF' },
  { x: '70%',  y: '75%', size: 5,  dur: 3.2, delay: 1.0,  color: '#0077C8' },
  { x: '20%',  y: '70%', size: 3,  dur: 5.0, delay: 0.3,  color: '#00BFFF' },
  { x: '50%',  y: '85%', size: 4,  dur: 4.1, delay: 0.8,  color: '#1428A0' },
  { x: '88%',  y: '50%', size: 3,  dur: 3.6, delay: 1.4,  color: '#0077C8' },
  { x: '10%',  y: '45%', size: 5,  dur: 4.8, delay: 0.2,  color: '#00BFFF' },
]

export function LoadingScreen({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2200)
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
            className="fixed inset-0 z-[100] bg-[#05050e] flex flex-col items-center justify-center overflow-hidden"
          >
            {/* Ambient radial glow */}
            <div className="absolute inset-0 pointer-events-none">
              <motion.div
                className="absolute inset-0"
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(20,40,160,0.25) 0%, transparent 65%)' }}
              />
              <motion.div
                className="absolute inset-0"
                animate={{ opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(0,191,255,0.15) 0%, transparent 50%)' }}
              />
            </div>

            {/* Floating particles */}
            {PARTICLES.map((p, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full pointer-events-none"
                style={{
                  left: p.x,
                  top: p.y,
                  width: p.size,
                  height: p.size,
                  backgroundColor: p.color,
                  ['--dur' as string]: `${p.dur}s`,
                  ['--delay' as string]: `${p.delay}s`,
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 0.8, 0.5, 0.8, 0], scale: [0, 1, 0.8, 1, 0] }}
                transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
              />
            ))}

            {/* Logo block */}
            <motion.div
              initial={{ scale: 0.7, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="relative mb-7"
            >
              {/* Outer spinning ring */}
              <motion.div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{ margin: '-10px', border: '1.5px solid transparent', backgroundImage: 'linear-gradient(#05050e,#05050e), linear-gradient(135deg,#1428A0,#00BFFF,#0077C8,#1428A0)', backgroundOrigin: 'border-box', backgroundClip: 'padding-box, border-box', borderRadius: '20px' }}
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              />
              {/* Inner pulsing glow */}
              <motion.div
                className="absolute inset-0 rounded-2xl blur-xl pointer-events-none"
                style={{ margin: '-8px', background: 'linear-gradient(135deg,rgba(20,40,160,0.6),rgba(0,191,255,0.4))' }}
                animate={{ opacity: [0.4, 0.9, 0.4], scale: [0.9, 1.05, 0.9] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              />
              {/* Logo box */}
              <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-[#1428A0] via-[#0d1e80] to-[#0077C8] flex items-center justify-center shadow-2xl shadow-blue-900/60">
                <motion.span
                  className="text-white text-3xl font-black tracking-tight select-none"
                  animate={{ scale: [1, 1.06, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                >S</motion.span>
              </div>
              {/* Corner accent dot */}
              <motion.div
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#00BFFF]"
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>

            {/* Brand text */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.5 }}
              className="text-center"
            >
              <p className="text-shimmer text-base font-black tracking-[0.18em] uppercase select-none">Samsung Store MX</p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-gray-500 text-[10px] mt-1.5 tracking-[0.12em] uppercase"
              >
                Cargando experiencia premium...
              </motion.p>
            </motion.div>

            {/* Progress bar */}
            <div className="mt-7 w-36 h-[3px] bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full shimmer-border"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 2.0, ease: [0.4, 0, 0.2, 1], delay: 0.2 }}
              />
            </div>
            {/* Dot trail under bar */}
            <div className="mt-3 flex gap-1.5">
              {[0, 0.3, 0.6, 0.9, 1.2].map((d, i) => (
                <motion.div
                  key={i}
                  className="w-1 h-1 rounded-full bg-[#1428A0]"
                  animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.3, 0.8] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: d, ease: 'easeInOut' }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {!loading && children}
    </>
  )
}
