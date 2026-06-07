import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react'

const testimonials = [
  { name: 'Carlos Mendez', city: 'CDMX', text: 'El Neo QLED 8K supero todas mis expectativas. La calidad de imagen es increible y el servicio de entrega fue rapidisimo. 100% recomendado.', rating: 5, avatar: 'CM' },
  { name: 'Ana Laura Garcia', city: 'Guadalajara', text: 'Compre The Frame para mi sala y es una obra de arte. Cuando no veo TV, muestra pinturas impresionantes. El soporte tecnico mexicano excelente.', rating: 5, avatar: 'AL' },
  { name: 'Luis Fernando Ruiz', city: 'Monterrey', text: 'El Odyssey G9 cambio mi experiencia gaming. 240Hz, colores vibrantes, curvatura perfecta. Nunca habia jugado asi.', rating: 5, avatar: 'LF' },
  { name: 'Sofia Hernandez', city: 'Puebla', text: 'Excelente atencion del agente de ventas. Me ayudo a elegir el TV perfecto para mi familia. La garantia de 5 anos me dio tranquilidad.', rating: 5, avatar: 'SH' },
  { name: 'Pedro Jimenez', city: 'Queretaro', text: 'El OLED S95D con anti-reflejo es perfecto para mi sala con mucha luz. Los negros son perfectos. Entrega en 24h como prometieron.', rating: 5, avatar: 'PJ' },
]

export function TestimonialCarousel() {
  const [current, setCurrent] = useState(0)

  const next = useCallback(() => setCurrent((prev) => (prev + 1) % testimonials.length), [])
  const prev = useCallback(() => setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length), [])

  return (
    <div className="relative max-w-3xl mx-auto">
      <div className="overflow-hidden rounded-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4 }}
            className="p-8 bg-white dark:bg-[#1a1a2a] rounded-2xl border border-gray-100 dark:border-gray-700/50 text-center"
          >
            <Quote className="w-8 h-8 text-[#1428A0]/20 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-6 leading-relaxed">
              "{testimonials[current].text}"
            </p>
            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1428A0] to-[#00BFFF] flex items-center justify-center text-white font-bold">
                {testimonials[current].avatar}
              </div>
              <div className="text-left">
                <p className="font-bold text-sm">{testimonials[current].name}</p>
                <p className="text-xs text-gray-500">{testimonials[current].city}</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="flex items-center justify-center gap-4 mt-6">
        <button onClick={prev} className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex gap-1.5">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-all ${i === current ? 'bg-[#1428A0] w-6' : 'bg-gray-300 dark:bg-gray-600'}`}
            />
          ))}
        </div>
        <button onClick={next} className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
