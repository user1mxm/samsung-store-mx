import { useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { Button } from '@/components/ui/button'
import { ShimmerImage } from './ShimmerImage'
import { StockPulse } from './StockPulse'
import { TiltCard } from './TiltCard'
import {
  ShoppingCart, Heart, TrendingUp, ZoomIn, Box, Eye,
  Flame, Star, ChevronLeft, ChevronRight
} from 'lucide-react'

const springTransition = { type: 'spring' as const, stiffness: 400, damping: 25 }

interface Product {
  id: number
  name: string
  model: string
  category: string
  price: string
  imageUrl: string
  description: string
  features?: string
  rating?: string
  stock: number
  featured?: string
}

interface SwipeCatalogProps {
  products: Product[]
  loading: boolean
  darkMode: boolean
  wishlist: number[]
  compareList: number[]
  onToggleWishlist: (id: number) => void
  onToggleCompare: (id: number) => void
  onAddToCart: (p: Product) => void
  onViewProduct: (p: Product) => void
  onZoom: (p: Product) => void
  onSpecSheet: (p: Product) => void
  onQuickView: (p: Product) => void
}

export function SwipeCatalog({
  products, loading, darkMode, wishlist, compareList,
  onToggleWishlist, onToggleCompare, onAddToCart, onViewProduct, onZoom, onSpecSheet, onQuickView
}: SwipeCatalogProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [prevBtnEnabled, setPrevBtnEnabled] = useState(false)
  const [nextBtnEnabled, setNextBtnEnabled] = useState(true)

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: false, align: 'start', slidesToScroll: 1, containScroll: 'trimSnaps' },
    [Autoplay({ delay: 4000, stopOnInteraction: true })]
  )

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
    setPrevBtnEnabled(emblaApi.canScrollPrev())
    setNextBtnEnabled(emblaApi.canScrollNext())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
    onSelect()
  }, [emblaApi, onSelect])

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  if (loading) {
    return (
      <div className="flex gap-4 overflow-hidden px-4">
        {[1, 2, 3].map(i => (
          <div key={i} className={`min-w-[85%] sm:min-w-[45%] lg:min-w-[31%] rounded-2xl h-[420px] ${darkMode ? 'bg-[#1a1a2a]' : 'bg-gray-100'} animate-pulse`} />
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No se encontraron productos</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Navigation Arrows */}
      <button
        onClick={scrollPrev}
        className={`absolute -left-2 sm:left-0 top-1/3 -translate-y-1/2 z-10 w-10 h-10 rounded-full shadow-lg backdrop-blur flex items-center justify-center transition-all ${
          prevBtnEnabled ? 'bg-white/90 text-gray-800 hover:scale-110' : 'bg-white/40 text-gray-300 cursor-not-allowed'
        } ${darkMode ? 'bg-[#1a1a2a]/90 text-white' : ''}`}
        disabled={!prevBtnEnabled}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={scrollNext}
        className={`absolute -right-2 sm:right-0 top-1/3 -translate-y-1/2 z-10 w-10 h-10 rounded-full shadow-lg backdrop-blur flex items-center justify-center transition-all ${
          nextBtnEnabled ? 'bg-white/90 text-gray-800 hover:scale-110' : 'bg-white/40 text-gray-300 cursor-not-allowed'
        } ${darkMode ? 'bg-[#1a1a2a]/90 text-white' : ''}`}
        disabled={!nextBtnEnabled}
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Embla Carousel */}
      <div className="overflow-hidden px-6" ref={emblaRef}>
        <div className="flex gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex-[0_0_85%] sm:flex-[0_0_45%] lg:flex-[0_0_31%] min-w-0"
            >
              <TiltCard className="h-full">
                <motion.div
                  whileHover={{ y: -8 }}
                  transition={springTransition}
                  className={`group cursor-pointer h-full flex flex-col overflow-hidden rounded-2xl border transition-all duration-300 ${
                    darkMode
                      ? 'bg-[#14141f] border-gray-800/60 hover:border-[#1428A0]/50 shadow-lg shadow-black/20'
                      : 'bg-white border-gray-100 hover:shadow-2xl hover:shadow-blue-900/8'
                  }`}
                  onClick={() => onViewProduct(product)}
                >
                  {/* Image */}
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <ShimmerImage src={product.imageUrl} alt={product.name} className="aspect-[4/3]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {product.featured === 'yes' && (
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute top-3 left-3 bg-gradient-to-r from-[#1428A0] to-[#0077C8] text-white text-[9px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg"
                      >
                        <Flame className="w-2.5 h-2.5" /> 2026
                      </motion.div>
                    )}

                    <div className="absolute top-3 right-3 bg-black/50 backdrop-blur rounded-full px-2 py-0.5">
                      <StockPulse stock={product.stock} featured={product.featured === 'yes'} />
                    </div>

                    {/* Hover Actions */}
                    <div className="absolute top-3 right-3 mt-8 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-3 group-hover:translate-x-0">
                      {[
                        { icon: Heart, action: () => onToggleWishlist(product.id), active: wishlist.includes(product.id), activeColor: 'text-red-500 fill-red-500' },
                        { icon: TrendingUp, action: () => onToggleCompare(product.id), active: compareList.includes(product.id), activeColor: 'text-[#1428A0]' },
                        { icon: ZoomIn, action: (e: React.MouseEvent) => { e.stopPropagation(); onZoom(product); }, active: false, activeColor: '' },
                        { icon: Box, action: (e: React.MouseEvent) => { e.stopPropagation(); onSpecSheet(product); }, active: false, activeColor: '' },
                      ].map((btn, i) => (
                        <motion.button
                          key={i}
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.85 }}
                          onClick={btn.action}
                          className="w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center hover:bg-white shadow-lg transition-colors"
                        >
                          <btn.icon className={`w-3.5 h-3.5 ${btn.active ? btn.activeColor : 'text-gray-600'}`} />
                        </motion.button>
                      ))}
                    </div>

                    <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => { e.stopPropagation(); onQuickView(product); }}
                        className="px-3 py-1.5 bg-white/90 backdrop-blur rounded-full text-[10px] font-bold text-[#1428A0] hover:bg-white shadow-lg flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" /> Vista Rapida
                      </motion.button>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[#1428A0] bg-[#1428A0]/8 px-2 py-0.5 rounded">
                        {product.category}
                      </span>
                      <div className="flex items-center gap-0.5">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span className={`text-[10px] font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {product.rating || '4.5'}
                        </span>
                      </div>
                    </div>

                    <h3 className={`font-bold text-sm mb-0.5 leading-tight tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {product.name}
                    </h3>
                    <p className={`text-[11px] mb-2 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                      {product.model}
                    </p>
                    <p className={`text-xs mb-3 flex-1 line-clamp-2 leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {product.description}
                    </p>

                    <p className="text-xl font-black text-[#1428A0] mb-3 tracking-tight">
                      ${Number(product.price).toLocaleString()}
                      <span className="text-[10px] font-normal text-gray-400 ml-1">MXN</span>
                    </p>

                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        className="w-full h-10 samsung-btn-primary text-[11px] font-bold rounded-xl"
                        onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
                        disabled={product.stock === 0}
                      >
                        {product.stock === 0 ? 'Agotado' : (
                          <><ShoppingCart className="w-3.5 h-3.5 mr-1.5" /> Agregar al Carrito</>
                        )}
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>
              </TiltCard>
            </div>
          ))}
        </div>
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-1.5 mt-5">
        {products.map((_, i) => (
          <button
            key={i}
            onClick={() => emblaApi?.scrollTo(i)}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i === selectedIndex
                ? 'w-6 bg-[#1428A0]'
                : darkMode ? 'w-1.5 bg-gray-700' : 'w-1.5 bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
