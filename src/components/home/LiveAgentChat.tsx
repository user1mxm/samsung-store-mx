/* ═══════════════════════════════════════════════════════════
   Live Agent Chat — Extraordinary Upgrade #2
   Real-time chat with Samsung sales agents
   ═══════════════════════════════════════════════════════════ */
import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Bot, User, Minus, Sparkles, Clock, CheckCheck, Headphones } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Message {
  id: string
  text: string
  sender: 'user' | 'agent' | 'system'
  timestamp: Date
  agentName?: string
}

const AGENT_PROFILES = [
  { name: 'Valeria M.', avatar: 'VM', status: 'online', specialty: 'OLED & Neo QLED' },
  { name: 'Carlos R.', avatar: 'CR', status: 'online', specialty: 'Gaming & Monitores' },
  { name: 'Ana L.', avatar: 'AL', status: 'busy', specialty: 'The Frame & Lifestyle' },
]

const QUICK_REPLIES = [
  'Cual TV recomiendan para sala?',
  'Tienen Meses Sin Intereses?',
  'Cuanto tarda el envio?',
  'Necesito factura CFDI',
]

const AGENT_RESPONSES: Record<string, string> = {
  'Cual TV recomiendan para sala?': 'Para sala te recomiendo el S95D OLED 65" — negro perfecto, colores vibrantes y solo 11mm de grosor. Si buscas algo mas accesible, el QN85D Neo QLED tiene excelente relacion precio-calidad. Te gustaria ver comparativas?',
  'Tienen Meses Sin Intereses?': 'Si! Tenemos hasta 12 MSI con tarjetas participantes (BBVA, Santander, American Express). Tambien contamos con 3 MSI en OXXO Pay. Te puedo pasar el link de pago?',
  'Cuanto tarda el envio?': 'Envio express 24-48h en CDMX y area metropolitana. 3-5 dias en el resto de la Republica. Envio gratis en compras mayores a $5,000 MXN. Tambien puedes recoger en nuestra sucursal.',
  'Necesito factura CFDI': 'Claro que si! Emitimos factura CFDI 4.0 en automatico al completar tu compra. Puedes agregar tus datos fiscales en el checkout o enviarlos despues por aqui mismo. RFC, razon social y uso CFDI.',
  'default': 'Gracias por tu mensaje! Nuestros agentes estan revisando tu consulta. Mientras tanto, puedo ayudarte con: disponibilidad de stock, precios actualizados, especificaciones tecnicas, o guiarte en tu compra. Que necesitas?',
}

export function LiveAgentChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: 'Hola! Bienvenido a Samsung Store MX. Soy Valeria, asesora de ventas. En que puedo ayudarte hoy?',
      sender: 'agent',
      timestamp: new Date(),
      agentName: 'Valeria M.',
    },
  ])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState(AGENT_PROFILES[0])
  const [unreadCount, setUnreadCount] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  /* Auto-scroll */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  /* Focus input when opened */
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300)
      setUnreadCount(0)
    }
  }, [isOpen])

  /* Send message */
  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      text: text.trim(),
      sender: 'user',
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMsg])
    setInputText('')
    setIsTyping(true)

    /* Agent response simulation */
    const responseText = AGENT_RESPONSES[text.trim()] || AGENT_RESPONSES['default']
    const typingDelay = Math.min(800 + text.length * 15, 2500)

    setTimeout(() => {
      setIsTyping(false)
      const agentMsg: Message = {
        id: `agent-${Date.now()}`,
        text: responseText,
        sender: 'agent',
        timestamp: new Date(),
        agentName: selectedAgent.name,
      }
      setMessages(prev => [...prev, agentMsg])
      if (!isOpen) setUnreadCount(prev => prev + 1)
    }, typingDelay)
  }, [isOpen, selectedAgent])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(inputText)
  }, [inputText, sendMessage])

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })

  return (
    <>
      {/* Chat Bubble */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-[88px] right-4 sm:right-6 z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-colors ${
          isOpen
            ? 'bg-gray-800 hover:bg-gray-700'
            : 'bg-gradient-to-br from-[#1428A0] to-[#0077C8] hover:from-[#0f1f7a] hover:to-[#005fa0]'
        }`}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X className="w-6 h-6 text-white" />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} className="relative">
              <MessageCircle className="w-6 h-6 text-white" />
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed bottom-[160px] right-4 sm:right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[70vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col bg-white dark:bg-[#14141f] border border-gray-200 dark:border-gray-800"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#1428A0] to-[#0077C8] px-4 py-3 flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Headphones className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm">Samsung Asistencia</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[10px] text-white/80">Agente en linea</span>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors">
                <Minus className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Agent Selector */}
            <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800 flex gap-2 overflow-x-auto shrink-0">
              {AGENT_PROFILES.map(agent => (
                <button
                  key={agent.name}
                  onClick={() => setSelectedAgent(agent)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-all shrink-0 ${
                    selectedAgent.name === agent.name
                      ? 'bg-[#1428A0]/10 text-[#1428A0] border border-[#1428A0]/20'
                      : 'bg-gray-50 dark:bg-white/5 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${agent.status === 'online' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  {agent.name}
                  <span className="text-[9px] text-gray-400 font-normal">· {agent.specialty}</span>
                </button>
              ))}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-2 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                    {/* Avatar */}
                    {msg.sender === 'agent' && (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1428A0] to-[#0077C8] flex items-center justify-center text-white text-[9px] font-bold shrink-0 self-end">
                        {msg.agentName?.split(' ').map(n => n[0]).join('')}
                      </div>
                    )}
                    {msg.sender === 'user' && (
                      <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 shrink-0 self-end">
                        <User className="w-3 h-3" />
                      </div>
                    )}

                    {/* Bubble */}
                    <div className={`px-3 py-2 rounded-2xl text-[11px] leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-[#1428A0] text-white rounded-br-sm'
                        : msg.sender === 'system'
                        ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-center w-full'
                        : 'bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-gray-200 rounded-bl-sm'
                    }`}>
                      {msg.text}
                      <div className={`flex items-center gap-1 mt-1 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                        <span className="text-[9px] opacity-50">{formatTime(msg.timestamp)}</span>
                        {msg.sender === 'user' && <CheckCheck className="w-2.5 h-2.5 opacity-50" />}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              <AnimatePresence>
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1428A0] to-[#0077C8] flex items-center justify-center text-white text-[9px] font-bold">
                      {selectedAgent.avatar}
                    </div>
                    <div className="bg-gray-100 dark:bg-white/10 px-4 py-2.5 rounded-2xl rounded-bl-sm">
                      <div className="flex gap-1">
                        <motion.span
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.5, repeat: Infinity, delay: 0 }}
                          className="w-1.5 h-1.5 rounded-full bg-gray-400"
                        />
                        <motion.span
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.5, repeat: Infinity, delay: 0.15 }}
                          className="w-1.5 h-1.5 rounded-full bg-gray-400"
                        />
                        <motion.span
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.5, repeat: Infinity, delay: 0.3 }}
                          className="w-1.5 h-1.5 rounded-full bg-gray-400"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies */}
            {messages.length < 3 && (
              <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 flex gap-2 overflow-x-auto shrink-0">
                {QUICK_REPLIES.map(reply => (
                  <button
                    key={reply}
                    onClick={() => sendMessage(reply)}
                    className="px-3 py-1.5 bg-[#1428A0]/5 hover:bg-[#1428A0]/10 text-[#1428A0] rounded-full text-[10px] font-medium whitespace-nowrap transition-colors shrink-0"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <form onSubmit={handleSubmit} className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex gap-2 shrink-0">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Escribe tu mensaje..."
                className="flex-1 h-10 px-4 rounded-full bg-gray-100 dark:bg-white/5 border-0 text-sm focus:outline-none focus:ring-2 focus:ring-[#1428A0]/30 dark:text-white placeholder:text-gray-400"
              />
              <Button
                type="submit"
                disabled={!inputText.trim() || isTyping}
                className="w-10 h-10 rounded-full p-0 samsung-btn-primary disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>

            {/* Footer */}
            <div className="px-4 py-1.5 border-t border-gray-100 dark:border-gray-800 text-center shrink-0">
              <span className="text-[9px] text-gray-400 flex items-center justify-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> Respuestas con IA Samsung · Tiempo respuesta ~2 min
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
