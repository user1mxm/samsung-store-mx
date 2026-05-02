import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

interface SizeOption {
  size: string
  price: number
  sku: string
}

const sizeMap: Record<string, SizeOption[]> = {
  'S95H': [
    { size: '55"', price: 2499.99, sku: 'QN55S95H' },
    { size: '65"', price: 3399.99, sku: 'QN65S95H' },
    { size: '77"', price: 4499.99, sku: 'QN77S95H' },
    { size: '83"', price: 6499.99, sku: 'QN83S95H' },
  ],
  'S90H': [
    { size: '42"', price: 1399.99, sku: 'QN42S90H' },
    { size: '48"', price: 1599.99, sku: 'QN48S90H' },
    { size: '55"', price: 1999.99, sku: 'QN55S90H' },
    { size: '65"', price: 2699.99, sku: 'QN65S90H' },
  ],
  'QN80H': [
    { size: '55"', price: 1299.99, sku: 'QN55QN80H' },
    { size: '65"', price: 1599.99, sku: 'QN65QN80H' },
    { size: '75"', price: 1999.99, sku: 'QN75QN80H' },
    { size: '85"', price: 3299.99, sku: 'QN85QN80H' },
  ],
  'QN70H': [
    { size: '43"', price: 599.99, sku: 'QN43QN70H' },
    { size: '55"', price: 899.99, sku: 'QN55QN70H' },
    { size: '65"', price: 1199.99, sku: 'QN65QN70H' },
    { size: '75"', price: 1499.99, sku: 'QN75QN70H' },
  ],
  'Frame': [
    { size: '55"', price: 1499.99, sku: 'QN55LS03H' },
    { size: '65"', price: 1999.99, sku: 'QN65LS03H' },
    { size: '75"', price: 2799.99, sku: 'QN75LS03H' },
  ],
  'G95SD': [
    { size: '49"', price: 1899.99, sku: 'LS49G95SD' },
  ],
  'S85H': [
    { size: '48"', price: 1199.99, sku: 'QN48S85H' },
    { size: '55"', price: 1499.99, sku: 'QN55S85H' },
    { size: '65"', price: 1999.99, sku: 'QN65S85H' },
  ],
  'M80H': [
    { size: '55"', price: 699.99, sku: 'QN55M80H' },
    { size: '65"', price: 799.99, sku: 'QN65M80H' },
    { size: '75"', price: 1199.99, sku: 'QN75M80H' },
  ],
}

function getSizeKey(model: string): string {
  if (model.includes('S95H')) return 'S95H'
  if (model.includes('S90H')) return 'S90H'
  if (model.includes('QN80H')) return 'QN80H'
  if (model.includes('QN70H')) return 'QN70H'
  if (model.includes('LS03')) return 'Frame'
  if (model.includes('G95')) return 'G95SD'
  if (model.includes('S85H')) return 'S85H'
  if (model.includes('M80H')) return 'M80H'
  return ''
}

export function SizeSelector({ model, darkMode = false, onSizeChange }: { model: string; darkMode?: boolean; onSizeChange?: (size: SizeOption) => void }) {
  const key = getSizeKey(model)
  const sizes = sizeMap[key] || []
  const [selected, setSelected] = useState(0)

  if (sizes.length <= 1) return null

  const handleSelect = (index: number) => {
    setSelected(index)
    onSizeChange?.(sizes[index])
  }

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Selecciona tamano</p>
      <div className="flex flex-wrap gap-2">
        {sizes.map((s, i) => (
          <motion.button
            key={s.sku}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleSelect(i)}
            className={`relative px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
              selected === i
                ? 'bg-[#1428A0] text-white border-[#1428A0] shadow-md shadow-blue-900/20'
                : darkMode
                  ? 'bg-[#1a1a2a] text-gray-300 border-gray-700 hover:border-gray-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}
          >
            {selected === i && (
              <motion.span
                layoutId="sizeCheck"
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center"
              >
                <Check className="w-2.5 h-2.5 text-white" />
              </motion.span>
            )}
            <span className="block">{s.size}</span>
            <span className="block text-[9px] opacity-70 font-normal">${s.price.toLocaleString()}</span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}

export { sizeMap, getSizeKey }
export type { SizeOption }
