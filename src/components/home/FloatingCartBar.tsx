import { motion } from 'framer-motion'
import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CartItemLocal { product: any; quantity: number }

export function FloatingCartBar({ cart, cartTotal, cartCount, onClick }: { cart: CartItemLocal[]; cartTotal: number; cartCount: number; onClick: () => void }) {
  if (cart.length === 0) return null
  return (
    <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-gray-200 shadow-2xl md:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="relative"><ShoppingCart className="w-5 h-5 text-[#1428A0]" /><span className="absolute -top-2 -right-2 w-4 h-4 bg-[#1428A0] text-white text-[9px] rounded-full flex items-center justify-center font-bold">{cartCount}</span></div>
          <div><p className="text-xs font-bold">${cartTotal.toLocaleString()} MXN</p><p className="text-[10px] text-gray-500">{cart.length} productos</p></div>
        </div>
        <Button className="h-9 px-4 samsung-btn-primary text-xs" onClick={onClick}>Ver Carrito</Button>
      </div>
    </motion.div>
  )
}
