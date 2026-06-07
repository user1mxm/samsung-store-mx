import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Monitor, Cpu, Wifi, Volume2, Gamepad2, HardDrive, Palette, Weight } from 'lucide-react'

const iconMap: Record<string, React.ElementType> = {
  Resolucion: Monitor,
  Procesador: Cpu,
  Conectividad: Wifi,
  Audio: Volume2,
  Gaming: Gamepad2,
  Diseno: Palette,
  Peso: Weight,
  Retroiluminacion: HardDrive,
  Panel: Monitor,
  Tasa: Cpu,
  Tiempo: Cpu,
  HDR: Monitor,
  Curvatura: Monitor,
  Smart: Cpu,
  Incluye: Palette,
}

export function SpecSheet({ product, open, onClose }: { product: any; open: boolean; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState('display')

  if (!product) return null

  const specs = product.specs ? (typeof product.specs === 'string' ? JSON.parse(product.specs) : product.specs) : {}

  const tabs = [
    { id: 'display', label: 'Pantalla', keys: ['Resolucion', 'Panel', 'Tasa Refresco', 'HDR', 'Curvatura', 'Retroiluminacion'] },
    { id: 'audio', label: 'Audio/Smart', keys: ['Audio', 'Smart', 'Conectividad'] },
    { id: 'gaming', label: 'Gaming/Design', keys: ['Gaming', 'Diseno', 'Procesador', 'Peso', 'Incluye', 'Tiempo Respuesta'] },
  ]

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 30, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="w-full max-w-lg bg-white dark:bg-[#12121f] rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#1428A0] to-[#0077C8] p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Monitor className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{product.name}</p>
                  <p className="text-[10px] text-white/70">{product.model} · Ficha Tecnica</p>
                </div>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-2 bg-gray-50 dark:bg-[#0a0a14]">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-2 rounded-lg text-[11px] font-bold transition-all ${
                    activeTab === tab.id
                      ? 'bg-[#1428A0] text-white shadow-md'
                      : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Specs Grid */}
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              <div className="grid gap-2">
                {tabs.find(t => t.id === activeTab)?.keys.map((key) => {
                  const value = specs[key]
                  if (!value) return null
                  const Icon = iconMap[key] || HardDrive
                  return (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-[#1a1a2a] border border-gray-100 dark:border-gray-800"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#1428A0]/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="w-4 h-4 text-[#1428A0]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">{key}</p>
                        <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{value}</p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 bg-gray-50 dark:bg-[#0a0a14] border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <p className="text-[10px] text-gray-400">Samsung Store MX · Especificaciones oficiales 2026</p>
              <p className="text-[10px] font-bold text-[#1428A0]">Garantia 5 anos</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
