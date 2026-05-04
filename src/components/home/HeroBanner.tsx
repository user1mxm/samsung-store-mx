import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, ShoppingCart, Eye, Sparkles } from 'lucide-react'

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

  const textVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0, filter: 'blur(4px)' }),
    center: { x: 0, opacity: 1, filter: 'blur(0px)' },
    exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0, filter: 'blur(4px)' }),
  }

  const imageVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0, scale: 0.96 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0, scale: 0.96 }),
  }

  return (
    <section className={`relative overflow-hidden ${darkMode ? 'bg-[#0a0a14]' : 'bg-[#f8f9ff]'}`}>
      {/* Animated aurora background */}
      <AnimatePresence>
        <motion.div
          key={`bg-${current}`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2 }}
          className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 70% 50%, ${slide.accent} 0%, transparent 60%)` }}
        />
      </AnimatePresence>
      {/* Secondary ambient glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ opacity: [0.04, 0.08, 0.04] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{ background: `radial-gradient(ellipse at 20% 80%, ${slide.accent} 0%, transparent 50%)` }}
      />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[400px] sm:min-h-[450px]">
          {/* Text content */}
          <div className="relative z-10 order-2 lg:order-1">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={current}
                custom={direction}
                variants={textVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Badge */}
                <motion.div
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
                  style={{ backgroundColor: `${slide.accent}18`, border: `1px solid ${slide.accent}30` }}
                  animate={{ boxShadow: [`0 0 0px ${slide.accent}00`, `0 0 12px ${slide.accent}40`, `0 0 0px ${slide.accent}00`] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                >
                  <Sparkles className="w-3 h-3" style={{ color: slide.accent }} />
                  <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: slide.accent }}>{slide.badge}</span>
                </motion.div>

                <h2 className={`text-3xl sm:text-4xl lg:text-[52px] font-black leading-[1.1] mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {slide.name}
                </h2>
                <p className="text-sm font-bold mb-3" style={{ color: slide.accent }}>{slide.subtitle}</p>
                <p className={`text-sm mb-6 max-w-md leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {slide.description}
                </p>

                <div className="flex flex-wrap items-center gap-4 mb-6">
                  <p className="text-2xl font-black" style={{ color: slide.accent }}>{slide.price} <span className="text-xs font-normal text-gray-400">MXN</span></p>
                  <div className="flex gap-2">
                    <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                      <Button className="h-11 px-5 samsung-btn-primary text-xs" onClick={onScrollToProducts}>
                        <ShoppingCart className="w-3.5 h-3.5 mr-1.5" /> Comprar
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                      <Button variant="outline" className={`h-11 px-5 rounded-full text-xs ${darkMode ? 'border-gray-700 text-gray-300' : 'samsung-btn-outline'}`} onClick={onScrollToProducts}>
                        <Eye className="w-3.5 h-3.5 mr-1.5" /> Ver
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Slide indicators */}
            <div className="flex items-center gap-3 mt-4">
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={prev}
                className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${darkMode ? 'border-gray-700 hover:bg-white/5' : 'border-gray-200 hover:bg-gray-50'}`}>
                <ChevronLeft className="w-3.5 h-3.5" />
              </motion.button>
              <div className="flex gap-1.5">
                {slides.map((s, i) => (
                  <motion.button
                    key={i}
                    onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i) }}
                    animate={{ width: i === current ? 28 : 6 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className={`h-1.5 rounded-full transition-colors duration-300 ${i === current ? '' : darkMode ? 'bg-gray-700' : 'bg-gray-300'}`}
                    style={i === current ? { backgroundColor: slide.accent } : undefined}
                  />
                ))}
              </div>
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={next}
                className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${darkMode ? 'border-gray-700 hover:bg-white/5' : 'border-gray-200 hover:bg-gray-50'}`}>
                <ChevronRight className="w-3.5 h-3.5" />
              </motion.button>
              <span className={`text-[10px] font-mono ml-1 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{current + 1}/{slides.length}</span>
            </div>
          </div>

          {/* Image */}
          <div className="relative order-1 lg:order-2 flex items-center justify-center">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={current}
                custom={direction}
                variants={imageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="relative w-full max-w-lg"
              >
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <div className="relative aspect-[16/10] rounded-2xl overflow-hidden shadow-2xl"
                    style={{ boxShadow: `0 25px 60px -15px ${slide.accent}50, 0 0 0 1px ${slide.accent}25` }}>
                    <img src={slide.image} alt={slide.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/30 via-transparent to-white/10" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                    {/* Sheen sweep on slide change */}
                    <motion.div
                      key={`sheen-${current}`}
                      className="absolute inset-0 pointer-events-none"
                      initial={{ x: '-100%', opacity: 0.5 }}
                      animate={{ x: '200%', opacity: 0 }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%)' }}
                    />

                    <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                      <div>
                        <p className="text-white font-bold text-sm">{slide.name}</p>
                        <p className="text-white/70 text-[10px]">{slide.subtitle}</p>
                      </div>
                      <motion.span
                        className="px-2 py-1 rounded-full text-[10px] font-bold text-white"
                        style={{ backgroundColor: slide.accent }}
                        animate={{ scale: [1, 1.06, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {slide.badge}
                      </motion.span>
                    </div>
                  </div>
                </motion.div>

                {/* Glow under image */}
                <motion.div
                  className="absolute -bottom-6 left-[10%] right-[10%] h-8 rounded-full blur-2xl opacity-40"
                  style={{ backgroundColor: slide.accent }}
                  animate={{ opacity: [0.3, 0.55, 0.3] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}
