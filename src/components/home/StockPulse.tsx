import { motion } from 'framer-motion'

export function StockPulse({ stock, featured = false }: { stock: number; featured?: boolean }) {
  if (stock === 0) {
    return (
      <div className="flex items-center gap-1.5 text-gray-400">
        <span className="w-2 h-2 rounded-full bg-gray-400" />
        <span className="text-[10px] font-bold">AGOTADO</span>
      </div>
    )
  }

  if (stock < 5) {
    return (
      <div className="flex items-center gap-1.5">
        <motion.span
          className="w-2 h-2 rounded-full bg-orange-500"
          animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <span className="text-[10px] font-bold text-orange-500">{stock} RESTANTES</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      <motion.span
        className={`w-2 h-2 rounded-full ${featured ? 'bg-[#00BFFF]' : 'bg-green-500'}`}
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
      <span className={`text-[10px] font-bold ${featured ? 'text-[#00BFFF]' : 'text-green-500'}`}>
        {stock} DISPONIBLES
      </span>
    </div>
  )
}
