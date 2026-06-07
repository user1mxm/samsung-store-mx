import { useEffect } from 'react'
import { toast } from 'sonner'
import { ShoppingCart } from 'lucide-react'

export function SocialProofToasts() {
  const names = ['Carlos R.', 'Maria G.', 'Ana L.', 'Luis M.', 'Sofia H.', 'Pedro J.', 'Fernanda T.', 'Diego V.']
  const cities = ['CDMX', 'Guadalajara', 'Monterrey', 'Puebla', 'Tijuana', 'Queretaro', 'Merida', 'Cancun']
  const products = ['Neo QLED 8K', 'OLED S95D', 'The Frame 2024', 'Odyssey G9', 'QLED Q80D', 'Crystal UHD']

  useEffect(() => {
    const interval = setInterval(() => {
      const name = names[Math.floor(Math.random() * names.length)]
      const city = cities[Math.floor(Math.random() * cities.length)]
      const product = products[Math.floor(Math.random() * products.length)]
      toast.info(`${name} de ${city} compro un ${product}`, { icon: <ShoppingCart className="w-4 h-4 text-green-500" />, duration: 4000 })
    }, 25000)
    return () => clearInterval(interval)
  }, [])
  return null
}
