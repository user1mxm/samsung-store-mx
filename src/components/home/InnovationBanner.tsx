import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap, Shield, Clock, Award, Layers, Radio, Wifi, Battery,
  ChevronLeft, ChevronRight, Smartphone, Cpu, Globe, Leaf
} from 'lucide-react'

const pages = [
  {
    title: 'Por Que Elegir Samsung Store MX',
    subtitle: 'Tecnologia de punta, garantia mexicana y experiencia de compra sin igual.',
    items: [
      { icon: Zap, title: 'NQ8 AI Gen3', desc: 'Procesador neural que optimiza cada pixel en tiempo real con aprendizaje profundo.', color: '#1428A0' },
      { icon: Shield, title: 'Garantia 5 Anos', desc: 'Cobertura completa en Mexico con servicio tecnico nacional y respaldo oficial.', color: '#00BFFF' },
      { icon: Clock, title: 'Entrega 24h Express', desc: 'Envio prioritario a CDMX, Guadalajara, Monterrey y ciudades principales.', color: '#0077C8' },
      { icon: Award, title: 'Premio CES 2024', desc: 'Reconocimiento internacional por innovacion en display y experiencia usuario.', color: '#FF6900' },
    ],
  },
  {
    title: 'NQ8 AI Gen3 Neural Processor',
    subtitle: '512 nucleos de IA procesando cada pixel en tiempo real. Upscaling automatico a 8K con reduccion de ruido por IA.',
    items: [
      { icon: Cpu, title: '512 Nucleos AI', desc: 'Procesamiento neural masivo para optimizacion de imagen en tiempo real.', color: '#1428A0' },
      { icon: Layers, title: '8K Upscaling', desc: 'Convierte contenido 4K a 8K con IA generativa sin perdida de calidad.', color: '#0077C8' },
      { icon: Smartphone, title: 'Auto HDR', desc: 'Analisis escena por escena para HDR perfecto en cada frame.', color: '#00BFFF' },
      { icon: Globe, title: 'Deep Learning', desc: 'Mejora continua del algoritmo con miles de horas de entrenamiento.', color: '#A50034' },
    ],
  },
  {
    title: 'Conectividad y Ecosistema',
    subtitle: 'Controla todo tu hogar inteligente desde tu TV con la ultima tecnologia de conexion.',
    items: [
      { icon: Radio, title: 'SmartThings Hub', desc: 'Control centralizado de dispositivos IoT, luces, termostatos y mas.', color: '#1428A0' },
      { icon: Wifi, title: 'WiFi 6E / 7 Ready', desc: 'Conectividad de ultima generacion sin latencia para streaming 8K.', color: '#00BFFF' },
      { icon: Battery, title: 'Eco-Friendly 42%', desc: 'Eficiencia energetica mejorada un 42% con IA. Certificado Energy Star.', color: '#28a745' },
      { icon: Leaf, title: 'Solar Cell Remote', desc: 'Control remoto con carga solar integrada. Sin pilas, sin cables.', color: '#FF6900' },
    ],
  },
]

export function InnovationBanner({ darkMode }: { darkMode: boolean }) {
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState(1)

  const next = useCallback(() => {
    setDirection(1)
    setCurrent(p => (p + 1) % pages.length)
  }, [])

  const prev = useCallback(() => {
    setDirection(-1)
    setCurrent(p => (p - 1 + pages.length) % pages.length)
  }, [])

  useEffect(() => {
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [next])

  const page = pages[current]

  return (
    <section className={`py-12 sm:py-20 overflow-hidden ${darkMode ? 'bg-[#0a0a14]' : 'bg-white'}`}>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={`header-${current}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1428A0] mb-2">Innovacion Samsung</p>
              <h2 className={`text-2xl sm:text-4xl font-black mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{page.title}</h2>
              <p className={`text-sm max-w-2xl mx-auto ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{page.subtitle}</p>
            </motion.div>
          </AnimatePresence>

          {/* Dots + controls */}
          <div className="flex items-center justify-center gap-3 mt-5">
            <button onClick={prev} className={`w-7 h-7 rounded-full border flex items-center justify-center transition-colors ${darkMode ? 'border-gray-700 hover:bg-white/5' : 'border-gray-200 hover:bg-gray-50'}`}>
              <ChevronLeft className="w-3 h-3" />
            </button>
            <div className="flex gap-1.5">
              {pages.map((_, i) => (
                <button key={i} onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i) }}
                  className={`h-1.5 rounded-full transition-all duration-500 ${i === current ? 'w-8 bg-[#1428A0]' : darkMode ? 'w-1.5 bg-gray-700' : 'w-1.5 bg-gray-300'}`} />
              ))}
            </div>
            <button onClick={next} className={`w-7 h-7 rounded-full border flex items-center justify-center transition-colors ${darkMode ? 'border-gray-700 hover:bg-white/5' : 'border-gray-200 hover:bg-gray-50'}`}>
              <ChevronRight className="w-3 h-3" />
            </button>
            <span className={`text-[10px] font-mono ml-1 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{current + 1}/{pages.length}</span>
          </div>
        </div>

        {/* Cards grid */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            initial={{ opacity: 0, x: direction * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -40 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {page.items.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className={`group p-6 rounded-2xl border cursor-default transition-all duration-300 ${
                  darkMode
                    ? 'bg-[#12121f] border-gray-800 hover:border-gray-600'
                    : 'bg-white border-gray-100 hover:shadow-lg hover:border-gray-200'
                }`}
              >
                <motion.div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${item.color}15` }}
                  whileHover={{ scale: 1.1, rotate: 3 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                >
                  <item.icon className="w-6 h-6" style={{ color: item.color }} />
                </motion.div>
                <h3 className={`font-bold text-base mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.title}</h3>
                <p className={`text-xs leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{item.desc}</p>
                <div className="mt-3 h-[2px] rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: item.color }}
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 1.5, delay: i * 0.2 + 0.3 }}
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}
