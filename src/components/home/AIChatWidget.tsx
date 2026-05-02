import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, X, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function AIChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<{ role: 'assistant' | 'user'; text: string }[]>([{ role: 'assistant', text: 'Hola! Soy tu asistente Samsung AI. Puedo ayudarte a encontrar el TV perfecto, comparar especificaciones o resolver dudas. En que puedo ayudarte?' }])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }) }, [messages, isTyping])

  const sendMessage = useCallback(() => {
    if (!input.trim()) return
    const userText = input.trim()
    setMessages(prev => [...prev, { role: 'user', text: userText }])
    setInput('')
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      const lower = userText.toLowerCase()
      let response = ''
      if (lower.includes('qled') || lower.includes('neo') || lower.includes('8k')) response = 'El Neo QLED 8K QN900D es nuestra joya de la corona. Con resolucion 8K real, procesador NQ8 AI Gen3 y tecnologia Quantum Matrix Pro. Precio: $3,499.99 MXN.'
      else if (lower.includes('oled') || lower.includes('s95')) response = 'El OLED S95D ofrece negros perfectos con tecnologia anti-reflejo unica. 144Hz para gaming. Precio: $2,799.99 MXN.'
      else if (lower.includes('precio') || lower.includes('barato')) response = 'El Crystal UHD DU9000 es nuestra opcion mas accesible a $699.99 MXN. Excelente calidad 4K con PurColor y Gaming Hub.'
      else if (lower.includes('gaming') || lower.includes('juego')) response = 'Para gaming pro: Odyssey OLED G9 (49", 240Hz, 0.03ms) a $1,799.99 MXN, o Neo QLED con 144Hz y FreeSync Premium Pro.'
      else if (lower.includes('frame') || lower.includes('arte')) response = 'The Frame 2024 se convierte en arte cuando no lo usas. Modo Art Store, pantalla mate anti-reflejo. $1,199.99 MXN.'
      else if (lower.includes('comparar')) response = 'Usa nuestro comparador! Selecciona hasta 3 TVs y compara lado a lado. Busca el icono de grafico en cada tarjeta.'
      else response = 'Puedo ayudarte con recomendaciones personalizadas. Dime: que tamaño buscas, cual es tu presupuesto, y para que lo usaras (cine, gaming, trabajo)?'
      setMessages(prev => [...prev, { role: 'assistant', text: response }])
    }, 1200)
  }, [input])

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.9 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-24 right-4 sm:right-6 w-[360px] max-w-[calc(100vw-2rem)] z-50 bg-white rounded-2xl shadow-2xl shadow-blue-900/10 border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-[#1428A0] to-[#0077C8] p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"><Brain className="w-5 h-5 text-white" /></div>
              <div className="flex-1">
                <p className="text-sm font-bold text-white">Samsung AI Assistant</p>
                <p className="text-[10px] text-white/70 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> En linea</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white p-1"><X className="w-4 h-4" /></button>
            </div>
            <div ref={scrollRef} className="h-80 overflow-y-auto p-4 space-y-3">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[88%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${m.role === 'user' ? 'bg-[#1428A0] text-white rounded-br-sm' : 'bg-gray-100 text-gray-700 rounded-bl-sm'}`}>{m.text}</div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
            </div>
            <div className="p-3 border-t border-gray-100 flex gap-2">
              <Input placeholder="Escribe tu pregunta..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} className="h-10 rounded-full text-xs" />
              <Button size="icon" className="h-10 w-10 rounded-full bg-[#1428A0] shrink-0" onClick={sendMessage}><Send className="w-3.5 h-3.5" /></Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-4 sm:right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-[#1428A0] to-[#0077C8] text-white shadow-xl shadow-blue-900/30 flex items-center justify-center">
        {open ? <X className="w-5 h-5" /> : <Send className="w-5 h-5" />}
      </motion.button>
    </>
  )
}
