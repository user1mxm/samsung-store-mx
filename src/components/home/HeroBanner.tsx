import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, ShoppingCart, Eye } from 'lucide-react'

const slides = [
  {
    name: 'Samsung S95H OLED',
    subtitle: 'FloatLayer Design 2026',
    description: 'El OLED mas avanzado del mundo. 165Hz Motion Xcelerator, Glare Free, Art Store con 5000+ obras y procesador NQ8 AI Gen3.',
    price: 'Desde $2,499.99',
    image: 'https://images.unsplash.com/photo-1593784690070-05421c8197c2?w=1200&q=80',
    accent: '#1428A0',
    badge: 'NUEVO 2026',
  },
  {
    name: 'Odyssey OLED G9',
    subtitle: 'Gaming Super-Ultrawide',
    description: '49" Dual QHD OLED, 240Hz, 0.03ms GTG, DisplayHDR 400 True Black. La experiencia gaming definitiva.',
    price: '$1,899.99',
    image: 'https://images.unsplash.com/photo-1547394765-185e1e68f34e?w=1200&q=80',
    accent: '#00BFFF',
    badge: 'GAMING PRO',
  },
  {
    name: 'The Frame Pro 65"',
    subtitle: 'Neo QLED Art TV',
    description: 'Arte y tecnologia sin limites. Pantalla mate anti-reflejo, Wireless One Connect a 30 pies, sensor de movimiento.',
    price: '$1,999.99',
    image: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=1200&q=80',
    accent: '#A50034',
    badge: 'ART TV',
  },
  {
    name: 'QN80H Neo QLED 75"',
    subtitle: 'Mini LED 2026',
    description: 'Quantum Matrix Technology con Mini LED mejorado. Glare Free para cualquier ambiente. NQ4 AI Gen2.',
    price: '$1,999.99',
    image: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=1200&q=80',
    accent: '#0077C8',
    badge: 'POPULAR',
  },
]

interface HeroBannerProps {
  darkMode: boolean
  onViewProduct?: (index: number) => void
  onScrollToProducts?: () => void
}

export function HeroBanner({ darkMode, onScrollToProducts }: HeroBannerProps) {
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState(1)

  const next = useCallback(() => {
    setDirection(1)
    setCurrent((prev) => (prev + 1) % slides.length)
  }, [])

  const prev = useCallback(() => {
    setDirection(-1)
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length)
  }, [])

  useEffect(() => {
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [next])

  const slide = slides[current]

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
  }

  return (
    <section className={`relative overflow-hidden ${darkMode ? 'bg-[#0a0a14]' : 'bg-[#f8f9ff]'}`}>
      {/* Background gradient */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          key={`bg-${current}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.15 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
          style={{ background: `radial-gradient(ellipse at 70% 50%, ${slide.accent} 0%, transparent 60%)` }}
        />
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[400px] sm:min-h-[450px]">
          {/* Text content */}
          <div className="relative z-10 order-2 lg:order-1">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={current}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4, ease: 'easeOut' }}
              >
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
                  style={{ backgroundColor: `${slide.accent}15` }}>
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: slide.accent }} />
                  <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: slide.accent }}>{slide.badge}</span>
                </div>

                <h2 className={`text-3xl sm:text-4xl lg:text-[52px] font-black leading-[1.1] mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {slide.name}
                </h2>
                <p className="text-sm font-bold mb-3" style={{ color: slide.accent }}>{slide.subtitle}</p>
                <p className={`text-sm mb-6 max-w-md leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {slide.description}
                </p>

                <div className="flex flex-wrap items-center gap-4 mb-6">
                  <p className="text-2xl font-black text-[#1428A0]">{slide.price} <span className="text-xs font-normal text-gray-400">MXN</span></p>
                  <div className="flex gap-2">
                    <Button className="h-11 px-5 samsung-btn-primary text-xs" onClick={onScrollToProducts}>
                      <ShoppingCart className="w-3.5 h-3.5 mr-1.5" /> Comprar
                    </Button>
                    <Button variant="outline" className={`h-11 px-5 rounded-full text-xs ${darkMode ? 'border-gray-700 text-gray-300' : 'samsung-btn-outline'}`} onClick={onScrollToProducts}>
                      <Eye className="w-3.5 h-3.5 mr-1.5" /> Ver
                    </Button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Slide indicators */}
            <div className="flex items-center gap-3 mt-4">
              <button onClick={prev} className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${darkMode ? 'border-gray-700 hover:bg-white/5' : 'border-gray-200 hover:bg-gray-50'}`}>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <div className="flex gap-1.5">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i) }}
                    className={`h-1.5 rounded-full transition-all duration-500 ${i === current ? 'w-8' : 'w-1.5'} ${i === current ? 'bg-[#1428A0]' : darkMode ? 'bg-gray-700' : 'bg-gray-300'}`}
                  />
                ))}
              </div>
              <button onClick={next} className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${darkMode ? 'border-gray-700 hover:bg-white/5' : 'border-gray-200 hover:bg-gray-50'}`}>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <span className={`text-[10px] font-mono ml-1 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{current + 1}/{slides.length}</span>
            </div>
          </div>

          {/* Image */}
          <div className="relative order-1 lg:order-2 flex items-center justify-center">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={current}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="relative w-full max-w-lg"
              >
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <div className="relative aspect-[16/10] rounded-2xl overflow-hidden shadow-2xl"
                    style={{ boxShadow: `0 25px 60px -15px ${slide.accent}40, 0 0 0 1px ${slide.accent}20` }}>
                    <img src={slide.image} alt={slide.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/30 via-transparent to-white/10" />
                    <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                      <div>
                        <p className="text-white font-bold text-sm">{slide.name}</p>
                        <p className="text-white/70 text-[10px]">{slide.subtitle}</p>
                      </div>
                      <span className="px-2 py-1 rounded-full text-[10px] font-bold text-white"
                        style={{ backgroundColor: slide.accent }}>{slide.badge}</span>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}
