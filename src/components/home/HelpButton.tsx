import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HelpCircle, X, MessageSquare, Phone, Mail, FileText, ExternalLink } from 'lucide-react'

const helpOptions = [
  { icon: MessageSquare, label: 'Chat en Vivo', desc: 'Agente en linea', action: () => window.open('#', '_self') },
  { icon: Phone, label: 'Llamar', desc: '800-SAMSUNG', action: () => window.location.href = 'tel:8007267864' },
  { icon: Mail, label: 'Correo', desc: 'soporte@samsung.mx', action: () => window.location.href = 'mailto:soporte@samsung.mx' },
  { icon: FileText, label: 'Centro de Ayuda', desc: 'FAQ y guias', action: () => {} },
]

export function HelpButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className="fixed bottom-24 right-4 sm:right-6 z-[55] w-[260px] rounded-2xl overflow-hidden shadow-2xl shadow-black/20 border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#12121f]"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#1428A0] to-[#0077C8] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white">Centro de Ayuda</p>
                  <p className="text-[10px] text-white/70">Samsung Store MX</p>
                </div>
                <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            </div>

            {/* Options */}
            <div className="p-3 space-y-1">
              {helpOptions.map((opt, i) => (
                <motion.button
                  key={opt.label}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={opt.action}
                  className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors hover:bg-gray-50 dark:hover:bg-white/5 group"
                >
                  <div className="w-9 h-9 rounded-lg bg-[#1428A0]/8 flex items-center justify-center shrink-0 group-hover:bg-[#1428A0]/15 transition-colors">
                    <opt.icon className="w-4 h-4 text-[#1428A0]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{opt.label}</p>
                    <p className="text-[10px] text-gray-400">{opt.desc}</p>
                  </div>
                  <ExternalLink className="w-3 h-3 text-gray-300 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.button>
              ))}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#0a0a14]">
              <p className="text-[9px] text-gray-400 text-center">Horario: Lun-Vie 8am-8pm, Sab 9am-5pm</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setOpen(!open)}
        className="fixed bottom-24 right-4 sm:right-6 z-[56] w-14 h-14 rounded-2xl bg-white dark:bg-[#1a1a2a] text-[#1428A0] dark:text-white shadow-xl shadow-black/15 border border-gray-100 dark:border-gray-700 flex items-center justify-center hover:shadow-2xl hover:border-[#1428A0]/30 transition-all"
        style={{ bottom: open ? undefined : 100 }}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div key="help" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <HelpCircle className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  )
}
