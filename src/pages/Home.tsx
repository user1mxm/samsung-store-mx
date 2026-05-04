// @ts-nocheck
/* ═══════════════════════════════════════════════════════════
   Samsung Store MX — Home Page
   Estructura limpia, balanceada, sin errores de JSX
   ═══════════════════════════════════════════════════════════ */
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { Toaster, toast } from 'sonner'
import confetti from 'canvas-confetti'
import Marquee from 'react-fast-marquee'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { trpc } from '@/providers/trpc'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router'
import {
  ShoppingCart, Brain, X, Plus, Minus, Sparkles, ArrowRight, Check, CheckCircle2,
  Heart, Star, Search, Eye, Copy, Share2, Flame,
  RotateCcw, Box, Lock, ZoomIn, Banknote, Receipt, CreditCard, TrendingUp,
  Zap, Shield, Clock, Award,
  Menu, Moon, Sun, Filter, SortAsc, Truck, BadgeCheck,
  MapPin, Phone, Mail, ExternalLink, Globe, ArrowUpRight,
  Facebook, Instagram, Youtube, Twitter
} from 'lucide-react'

/* ─── Componentes home ─── */
import {
  AnimatedCounter, SkeletonCard, ShimmerImage, VRViewer,
  AIChatWidget, CountdownTimer, SocialProofToasts, VoiceSearch, FloatingCartBar,
  TiltCard, TypewriterText, TestimonialCarousel, ScrollProgress, BackToTop,
  SpecSheet, StockPulse, SizeSelector, InnovationBanner, HelpButton,
  ARPhotoPreview, LiveAgentChat, ProductSizeConfigurator
} from '@/components/home'

/* ═══════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════ */
interface CartItem { product: any; quantity: number }

/* ═══════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════ */
const SORT_OPTIONS = [
  { value: 'newest', label: 'Mas nuevos' },
  { value: 'price-asc', label: 'Precio: menor' },
  { value: 'price-desc', label: 'Precio: mayor' },
  { value: 'rating', label: 'Mejor valorados' },
] as const

const NAV_LINKS = [
  { label: 'Catalogo', href: '#catalogo' },
  { label: 'Innovacion', href: '#tecnologia' },
  { label: 'Resenas', href: '#resenas' },
]

const SPRING = { type: 'spring' as const, stiffness: 400, damping: 25 }
const SPRING_GENTLE = { type: 'spring' as const, stiffness: 300, damping: 30 }

/* ═══════════════════════════════════════════════════════════
   SWIPE CATALOG COMPONENT (inline para evitar imports rotos)
   ═══════════════════════════════════════════════════════════ */
function SwipeCatalogSection({
  products, loading, darkMode, wishlist, compareList,
  onToggleWishlist, onToggleCompare, onAddToCart,
  onViewProduct, onZoom, onSpecSheet, onQuickView,
}: {
  products: any[]; loading: boolean; darkMode: boolean
  wishlist: number[]; compareList: number[]
  onToggleWishlist: (id: number) => void
  onToggleCompare: (id: number) => void
  onAddToCart: (p: any) => void
  onViewProduct: (p: any) => void
  onZoom: (p: any) => void
  onSpecSheet: (p: any) => void
  onQuickView: (p: any) => void
}) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [prevEnabled, setPrevEnabled] = useState(false)
  const [nextEnabled, setNextEnabled] = useState(true)

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: false, align: 'start', slidesToScroll: 1, containScroll: 'trimSnaps' },
    [Autoplay({ delay: 4000, stopOnInteraction: true })]
  )

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
    setPrevEnabled(emblaApi.canScrollPrev())
    setNextEnabled(emblaApi.canScrollNext())
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

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-16">
        <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No se encontraron productos</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Arrows */}
      <button onClick={scrollPrev} disabled={!prevEnabled}
        className={`absolute -left-2 sm:left-0 top-1/3 -translate-y-1/2 z-10 w-10 h-10 rounded-full shadow-lg backdrop-blur flex items-center justify-center transition-all ${
          prevEnabled ? 'bg-white/90 text-gray-800 hover:scale-110' : 'bg-white/40 text-gray-300 cursor-not-allowed'
        } ${darkMode ? 'bg-[#1a1a2a]/90 text-white' : ''}`}>
        <ArrowRight className="w-5 h-5 rotate-180" />
      </button>
      <button onClick={scrollNext} disabled={!nextEnabled}
        className={`absolute -right-2 sm:right-0 top-1/3 -translate-y-1/2 z-10 w-10 h-10 rounded-full shadow-lg backdrop-blur flex items-center justify-center transition-all ${
          nextEnabled ? 'bg-white/90 text-gray-800 hover:scale-110' : 'bg-white/40 text-gray-300 cursor-not-allowed'
        } ${darkMode ? 'bg-[#1a1a2a]/90 text-white' : ''}`}>
        <ArrowRight className="w-5 h-5" />
      </button>

      {/* Carousel */}
      <div className="overflow-hidden px-6" ref={emblaRef}>
        <div className="flex gap-4">
          {products.map((product: any) => (
            <div key={product.id} className="flex-[0_0_85%] sm:flex-[0_0_45%] lg:flex-[0_0_31%] min-w-0">
              <TiltCard className="h-full">
                <motion.div whileHover={{ y: -8 }} transition={SPRING}
                  className={`group cursor-pointer h-full flex flex-col overflow-hidden rounded-2xl border transition-all duration-300 ${
                    darkMode ? 'bg-[#14141f] border-gray-800/60 hover:border-[#1428A0]/50 shadow-lg shadow-black/20' : 'bg-white border-gray-100 hover:shadow-2xl hover:shadow-blue-900/8'
                  }`}
                  onClick={() => onViewProduct(product)}>
                  {/* Image */}
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <ShimmerImage src={product.imageUrl} alt={product.name} className="aspect-[4/3]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    {product.featured === 'yes' && (
                      <div className="absolute top-3 left-3 bg-gradient-to-r from-[#1428A0] to-[#0077C8] text-white text-[9px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg">
                        <Flame className="w-2.5 h-2.5" /> 2026
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-black/50 backdrop-blur rounded-full px-2 py-0.5">
                      <StockPulse stock={product.stock} featured={product.featured === 'yes'} />
                    </div>
                    {/* Hover actions */}
                    <div className="absolute top-3 right-3 mt-8 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-3 group-hover:translate-x-0">
                      <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.85 }} onClick={(e) => { e.stopPropagation(); onToggleWishlist(product.id) }}
                        className="w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center hover:bg-white shadow-lg">
                        <Heart className={`w-3.5 h-3.5 ${wishlist.includes(product.id) ? 'text-red-500 fill-red-500' : 'text-gray-600'}`} />
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.85 }} onClick={(e) => { e.stopPropagation(); onToggleCompare(product.id) }}
                        className="w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center hover:bg-white shadow-lg">
                        <TrendingUp className={`w-3.5 h-3.5 ${compareList.includes(product.id) ? 'text-[#1428A0]' : 'text-gray-600'}`} />
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.85 }} onClick={(e) => { e.stopPropagation(); onZoom(product) }}
                        className="w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center hover:bg-white shadow-lg">
                        <ZoomIn className="w-3.5 h-3.5 text-gray-600" />
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.85 }} onClick={(e) => { e.stopPropagation(); onSpecSheet(product) }}
                        className="w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center hover:bg-white shadow-lg">
                        <Box className="w-3.5 h-3.5 text-gray-600" />
                      </motion.button>
                    </div>
                    <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={(e) => { e.stopPropagation(); onQuickView(product) }}
                        className="px-3 py-1.5 bg-white/90 backdrop-blur rounded-full text-[10px] font-bold text-[#1428A0] hover:bg-white shadow-lg flex items-center gap-1">
                        <Eye className="w-3 h-3" /> Vista Rapida
                      </motion.button>
                    </div>
                  </div>
                  {/* Info */}
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[#1428A0] bg-[#1428A0]/8 px-2 py-0.5 rounded">{product.category}</span>
                      <div className="flex items-center gap-0.5">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span className={`text-[10px] font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{product.rating || '4.5'}</span>
                      </div>
                    </div>
                    <h3 className={`font-bold text-sm mb-0.5 leading-tight tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>{product.name}</h3>
                    <p className={`text-[11px] mb-2 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{product.model}</p>
                    <p className={`text-xs mb-3 flex-1 line-clamp-2 leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{product.description}</p>
                    <p className="text-xl font-black text-[#1428A0] mb-3 tracking-tight">${Number(product.price).toLocaleString()}<span className="text-[10px] font-normal text-gray-400 ml-1">MXN</span></p>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
                      <Button className="w-full h-10 samsung-btn-primary text-[11px] font-bold rounded-xl" onClick={(e) => { e.stopPropagation(); onAddToCart(product) }} disabled={product.stock === 0}>
                        {product.stock === 0 ? 'Agotado' : <><ShoppingCart className="w-3.5 h-3.5 mr-1.5" /> Agregar al Carrito</>}
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>
              </TiltCard>
            </div>
          ))}
        </div>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-1.5 mt-5">
        {products.map((_, i) => (
          <button key={i} onClick={() => emblaApi?.scrollTo(i)}
            className={`h-1.5 rounded-full transition-all duration-500 ${i === selectedIndex ? 'w-6 bg-[#1428A0]' : darkMode ? 'w-1.5 bg-gray-700' : 'w-1.5 bg-gray-300'}`} />
        ))}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   MAIN HOME COMPONENT
   ═══════════════════════════════════════════════════════════ */
export default function Home() {
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()
  const { scrollYProgress } = useScroll()
  const heroOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0])
  const heroY = useTransform(scrollYProgress, [0, 0.12], [0, -60])

  /* Dark mode */
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })

  /* Data queries */
  const { data: products, isLoading: productsLoading } = trpc.product.list.useQuery(
    { category: 'all' },
    { retry: 1, refetchOnWindowFocus: false, refetchOnReconnect: false }
  )

  /* Fallback products for static deployments (no backend) */
  const [fallbackProducts, setFallbackProducts] = useState<any[]>([])
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!products || products.length === 0) setFallbackProducts([
        { id: 1, name: "Samsung S95D OLED 65\"", model: "QN65S95DAFXZA", category: "oled", price: "47999", rating: 4.9, stock: 12, imageUrl: "/tv-s95d-real.jpg", badge: "FLAGSHIP", description: "OLED 4K con procesador NQ4 AI Gen3. Brillo perfecto con tecnologia OLED. One Connect Box. Pantalla anti reflejo. 144Hz para gaming. SmartThings integrado." },
        { id: 2, name: "Samsung S90D OLED 55\"", model: "QN55S90DAFXZA", category: "oled", price: "29999", rating: 4.8, stock: 8, imageUrl: "/tv-s95d-real.jpg", badge: "POPULAR", description: "OLED 4K con procesador NQ4 AI Gen2. Colores vibrantes con tecnologia Quantum Dot. 144Hz VRR. SmartThings y Alexa integrados." },
        { id: 3, name: "Samsung QN90D Neo QLED 75\"", model: "QN75QN90DAFXZA", category: "neo-qled", price: "54999", rating: 4.9, stock: 5, imageUrl: "/tv-neo-real.jpg", badge: "PREMIUM", description: "Neo QLED 4K con Mini LED y procesador NQ4 AI Gen3. Brillo intenso, negros profundos. 144Hz VRR. Anti reflejo. One Connect Box." },
        { id: 4, name: "Samsung The Frame 65\" 2024", model: "QN65LS03DAFXZA", category: "frame", price: "39999", rating: 4.7, stock: 7, imageUrl: "/tv-frame-real.jpg", badge: "ART", description: "TV que se convierte en obra de arte. Pantalla mate anti reflejo. Modo Arte con 2,000+ obras. Samsung Collection incluida." },
        { id: 5, name: "Odyssey OLED G9 49\"", model: "LS49CG954SNXGO", category: "gaming", price: "34999", rating: 4.8, stock: 4, imageUrl: "/tv-odyssey-real.jpg", badge: "GAMING", description: "Monitor curvo super ultrawide OLED 240Hz. Dual QHD 32:9. Respuesta 0.03ms. FreeSync Premium Pro. Hub USB-C 90W." },
        { id: 6, name: "Samsung QN85D Neo QLED 65\"", model: "QN65QN85DAFXZA", category: "neo-qled", price: "24999", rating: 4.6, stock: 10, imageUrl: "/tv-neo-real.jpg", description: "Neo QLED 4K con Mini LED. Excelente relacion precio-calidad. 120Hz. HDR10+ Adaptive. Ambient Mode+." },
        { id: 7, name: "Samsung S85D OLED 55\"", model: "QN55S85DAFXZA", category: "oled", price: "22999", rating: 4.5, stock: 9, imageUrl: "/tv-s95d-real.jpg", description: "OLED 4K accesible con colores Quantum Dot. 120Hz. Tizen OS completo. SmartThings y Gaming Hub." },
        { id: 8, name: "Samsung DU8000 Crystal UHD 65\"", model: "UN65DU8000FXZA", category: "crystal", price: "13999", rating: 4.3, stock: 15, imageUrl: "/tv-neo-real.jpg", description: "Crystal UHD 4K con procesador Crystal 4K. PurColor. Motion Xcelerator. Tizen OS con Samsung TV Plus. Entrada 4K economica." },
      ])
    }, 1500)
    return () => clearTimeout(timer)
  }, [products])
  const effectiveProducts = (products && products.length > 0) ? products : fallbackProducts
  const { data: categories } = trpc.product.categories.useQuery()
  const { data: reviews } = trpc.review.list.useQuery()

  /* tRPC mutations */
  const createOrderMutation = trpc.order.create.useMutation()
  const generateCommissionsMutation = trpc.referral.generateCommissions.useMutation()
  const cartAddMutation = trpc.cart.add.useMutation()
  const cartRemoveMutation = trpc.cart.remove.useMutation()
  const cartUpdateQtyMutation = trpc.cart.updateQty.useMutation()
  const cartClearMutation = trpc.cart.clear.useMutation()

  /* Load DB cart on login */
  const { data: dbCart } = trpc.cart.list.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
    refetchOnWindowFocus: false,
  })
  useEffect(() => {
    if (dbCart && dbCart.length > 0) {
      setCart(dbCart.map((item: any) => ({ product: item.product, quantity: item.quantity })))
    }
  }, [dbCart])

  /* State */
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [voiceSearchResult, setVoiceSearchResult] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [priceRange, setPriceRange] = useState([0, 100000])
  const [cart, setCart] = useState<CartItem[]>(() => {
    try { return JSON.parse(localStorage.getItem('cart') || '[]') } catch { return [] }
  })
  const [wishlist, setWishlist] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem('wishlist') || '[]') } catch { return [] }
  })
  const [compareList, setCompareList] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem('compare') || '[]') } catch { return [] }
  })

  /* Modals */
  const [cartOpen, setCartOpen] = useState(false)
  const [wishlistOpen, setWishlistOpen] = useState(false)
  const [viewProduct, setViewProduct] = useState<any>(null)
  const [compareOpen, setCompareOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [checkoutStep, setCheckoutStep] = useState(1)
  const [aiProduct, setAiProduct] = useState<any>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [magnifierProduct, setMagnifierProduct] = useState<any>(null)
  const [specSheetProduct, setSpecSheetProduct] = useState<any>(null)
  const [quickViewProduct, setQuickViewProduct] = useState<any>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  /* Persist cart */
  useEffect(() => { localStorage.setItem('cart', JSON.stringify(cart)) }, [cart])
  useEffect(() => { localStorage.setItem('wishlist', JSON.stringify(wishlist)) }, [wishlist])
  useEffect(() => { localStorage.setItem('compare', JSON.stringify(compareList)) }, [compareList])

  /* Search suggestions */
  useEffect(() => {
    const query = voiceSearchResult || searchQuery
    if (!query.trim()) { setSearchSuggestions([]); return }
    const all = (effectiveProducts || FALLBACK_PRODUCTS).map(p => p.name)
    const filtered = all.filter(n => n.toLowerCase().includes(query.toLowerCase())).slice(0, 5)
    setSearchSuggestions(filtered)
  }, [searchQuery, voiceSearchResult, effectiveProducts])

  /* Click outside search */
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSuggestions(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  /* Voice search */
  const handleVoiceResult = useCallback((text: string) => {
    setVoiceSearchResult(text)
    setSearchQuery(text)
    toast.success(`Buscando: "${text}"`, { icon: <Search className="w-4 h-4 text-[#1428A0]" /> })
  }, [])

  /* Cart actions */
  const addToCart = useCallback((product: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id)
      if (existing) {
        return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { product, quantity: 1 }]
    })
    if (isAuthenticated) {
      cartAddMutation.mutate({ productId: product.id, quantity: 1 }, {
        onError: () => {
          // Revert local state on DB failure
          setCart(prev => {
            const item = prev.find(i => i.product.id === product.id)
            if (!item) return prev
            if (item.quantity > 1) return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity - 1 } : i)
            return prev.filter(i => i.product.id !== product.id)
          })
        },
      })
    }
    confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 }, colors: ['#1428A0', '#0077C8', '#00BFFF'] })
    toast.success(`${product.name} agregado`, { icon: <ShoppingCart className="w-4 h-4" /> })
  }, [isAuthenticated])

  const removeFromCart = useCallback((productId: number) => {
    setCart(prev => prev.filter(i => i.product.id !== productId))
    if (isAuthenticated) {
      cartRemoveMutation.mutate({ productId }, {
        onError: () => toast.error('Error al sincronizar el carrito'),
      })
    }
  }, [isAuthenticated])

  const updateQty = useCallback((productId: number, qty: number) => {
    if (qty <= 0) { removeFromCart(productId); return }
    setCart(prev => prev.map(i => i.product.id === productId ? { ...i, quantity: qty } : i))
    if (isAuthenticated) {
      cartUpdateQtyMutation.mutate({ productId, quantity: qty }, {
        onError: () => toast.error('Error al sincronizar el carrito'),
      })
    }
  }, [removeFromCart, isAuthenticated])

  /* Wishlist */
  const toggleWishlist = useCallback((productId: number) => {
    setWishlist(prev => {
      const exists = prev.includes(productId)
      toast.info(exists ? 'Eliminado' : 'Agregado a favoritos')
      return exists ? prev.filter(id => id !== productId) : [...prev, productId]
    })
  }, [])

  /* Compare */
  const toggleCompare = useCallback((productId: number) => {
    setCompareList(prev => {
      const exists = prev.includes(productId)
      if (exists) { toast.info('Eliminado'); return prev.filter(id => id !== productId) }
      if (prev.length >= 3) { toast.error('Maximo 3'); return prev }
      toast.success('Agregado'); return [...prev, productId]
    })
  }, [])

  /* Derived values */
  const cartTotal = cart.reduce((sum, i) => sum + Number(i.product.price) * i.quantity, 0)
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0)

  /* Filtered products */
  const filtered = useMemo(() => {
    let list = (effectiveProducts || FALLBACK_PRODUCTS).filter((p: any) => {
      const query = voiceSearchResult || searchQuery
      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false
      if (query && !p.name.toLowerCase().includes(query.toLowerCase())) return false
      const price = Number(p.price)
      if (price < priceRange[0] || price > priceRange[1]) return false
      return true
    })
    switch (sortBy) {
      case 'price-asc': list = [...list].sort((a, b) => Number(a.price) - Number(b.price)); break
      case 'price-desc': list = [...list].sort((a, b) => Number(b.price) - Number(a.price)); break
      case 'rating': list = [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0)); break
      default: break
    }
    return list
  }, [effectiveProducts, selectedCategory, searchQuery, voiceSearchResult, priceRange, sortBy])

  const compareProducts = useMemo(() => (effectiveProducts || FALLBACK_PRODUCTS).filter((p: any) => compareList.includes(p.id)), [effectiveProducts, compareList])

  /* Helpers */
  const scrollTo = (id: string) => {
    const el = document.getElementById(id.replace('#', ''))
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setMobileMenuOpen(false)
  }

  const themeClasses = darkMode ? 'bg-[#0a0a0f] text-white' : 'bg-white text-gray-900'
  const pillInactive = darkMode ? 'bg-[#1a1a2a] text-gray-400 hover:bg-[#252535]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'

  /* ═══════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════ */
  return (
    <div className={`min-h-screen overflow-x-hidden transition-colors duration-500 ${themeClasses} ${darkMode ? 'dark' : ''}`}>
      <Toaster position="top-center" richColors closeButton />
      <SocialProofToasts />
      <ScrollProgress />

      {/* ═══ PROMO TICKER ═══ */}
      <div className="bg-[#1428A0] text-white">
        <Marquee speed={40} gradient={false} className="py-1.5">
          <span className="mx-6 text-[11px] font-medium flex items-center gap-2"><Truck className="w-3 h-3" /> Envio gratis +$5,000 MXN</span>
          <span className="mx-6 text-[11px] font-medium flex items-center gap-2"><CreditCard className="w-3 h-3" /> 12 MSI</span>
          <span className="mx-6 text-[11px] font-medium flex items-center gap-2"><BadgeCheck className="w-3 h-3" /> Garantia 5 anos Samsung</span>
          <span className="mx-6 text-[11px] font-medium flex items-center gap-2"><Flame className="w-3 h-3 text-orange-400" /> Ofertas Flash <CountdownTimer /></span>
        </Marquee>
      </div>

      {/* ═══ NAVIGATION ═══ */}
      <nav className={`sticky top-0 z-50 backdrop-blur-xl border-b transition-colors duration-300 ${darkMode ? 'bg-[#0a0a0f]/90 border-white/5' : 'bg-white/90 border-gray-100/80'}`}>
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[56px]">
            {/* Logo */}
            <motion.button
              onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              className="flex items-center gap-2.5 shrink-0 group"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <motion.div
                className="relative"
                whileHover={{ rotate: [0, -6, 6, 0] }}
                transition={{ duration: 0.5 }}
              >
                <img src="/logo-samsung-mx.png" alt="Samsung Store MX" className="w-8 h-8 object-contain relative z-10" />
                <motion.div
                  className="absolute inset-0 rounded-lg blur-md opacity-0 group-hover:opacity-60 transition-opacity duration-300 bg-[#1428A0]"
                />
              </motion.div>
              <div className="hidden sm:block">
                <span className={`text-[12px] font-black tracking-[0.12em] leading-none logo-shimmer`}>SAMSUNG</span>
                <span className={`text-[8px] font-bold tracking-[0.2em] block leading-none mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>STORE MX</span>
              </div>
            </motion.button>

            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-6">
              {NAV_LINKS.map((link, i) => (
                <motion.button
                  key={link.label}
                  onClick={() => scrollTo(link.href)}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 + i * 0.07, ease: 'easeOut' }}
                  className={`text-[11px] font-semibold transition-colors relative group ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-[#1428A0]'}`}>
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-[#1428A0] transition-all duration-300 group-hover:w-full" />
                </motion.button>
              ))}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-0.5">
              <button onClick={() => setDarkMode(!darkMode)} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                {darkMode ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-gray-500" />}
              </button>
              <button onClick={() => setWishlistOpen(true)} className="relative w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                <Heart className="w-4 h-4 text-gray-500" />
                {wishlist.length > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">{wishlist.length}</span>}
              </button>
              <button onClick={() => setCartOpen(true)} className="relative w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                <ShoppingCart className="w-4 h-4 text-gray-500" />
                {cartCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#1428A0] text-white text-[9px] rounded-full flex items-center justify-center font-bold">{cartCount}</span>}
              </button>
              {!isAuthenticated ? (
                <Button onClick={() => navigate('/login')} className="h-8 px-3 ml-1 bg-[#1428A0] hover:bg-[#0f1f7a] text-white text-[10px] font-bold rounded-full">
                  Acceso
                </Button>
              ) : (
                <div className="flex items-center gap-1 ml-1">
                  <button onClick={() => navigate('/mis-pedidos')}
                    className={`hidden sm:flex items-center h-8 px-3 rounded-full text-[10px] font-semibold transition-colors ${darkMode ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-[#1428A0] hover:bg-gray-100'}`}>
                    Pedidos
                  </button>
                  <button onClick={() => navigate(user?.role === 'admin' ? '/admin' : user?.role === 'agent' ? '/agent' : '/mi-red')}
                    className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1428A0] to-[#0077C8] flex items-center justify-center text-white text-xs font-bold">
                    {(user?.name || 'U')[0]}
                  </button>
                </div>
              )}
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-gray-100 dark:hover:bg-white/10">
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className={`md:hidden border-t overflow-hidden ${darkMode ? 'border-white/5 bg-[#0a0a0f]' : 'border-gray-100 bg-white'}`}>
              <div className="px-4 py-3 space-y-1">
                {NAV_LINKS.map(link => (
                  <button key={link.label} onClick={() => scrollTo(link.href)}
                    className={`block w-full text-left px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${darkMode ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-[#1428A0] hover:bg-gray-50'}`}>
                    {link.label}
                  </button>
                ))}
                <Separator className="my-2" />
                <button onClick={() => { setCartOpen(true); setMobileMenuOpen(false) }}
                  className={`block w-full text-left px-3 py-2.5 text-sm font-medium rounded-lg ${darkMode ? 'text-gray-400 hover:bg-white/5' : 'text-gray-600 hover:bg-gray-50'}`}>
                  Carrito ({cartCount})
                </button>
                {isAuthenticated ? (
                  <>
                    <button onClick={() => { navigate('/mis-pedidos'); setMobileMenuOpen(false) }}
                      className={`block w-full text-left px-3 py-2.5 text-sm font-medium rounded-lg ${darkMode ? 'text-gray-400 hover:bg-white/5' : 'text-gray-600 hover:bg-gray-50'}`}>
                      Mis Pedidos
                    </button>
                    <button onClick={() => { navigate('/mi-red'); setMobileMenuOpen(false) }}
                      className={`block w-full text-left px-3 py-2.5 text-sm font-medium rounded-lg ${darkMode ? 'text-gray-400 hover:bg-white/5' : 'text-gray-600 hover:bg-gray-50'}`}>
                      Mi Red
                    </button>
                  </>
                ) : (
                  <button onClick={() => { navigate('/login'); setMobileMenuOpen(false) }}
                    className="block w-full text-left px-3 py-2.5 text-sm font-medium rounded-lg text-[#1428A0] font-bold">
                    Iniciar Sesion
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ═══ HERO: VR 360° ═══ */}
      <motion.section style={{ opacity: heroOpacity, y: heroY }} className="relative overflow-hidden">
        <div className={`${darkMode ? 'bg-gradient-to-b from-[#0a0a14] via-[#0a0a0f] to-[#0a0a0f]' : 'bg-gradient-to-b from-[#f4f6ff] via-white to-white'}`}>
          {/* Aurora orbs */}
          <motion.div
            className="absolute top-8 right-[8%] w-[550px] h-[550px] rounded-full pointer-events-none aurora-orb"
            style={{ background: 'radial-gradient(circle, #1428A018 0%, transparent 70%)' }}
          />
          <motion.div
            className="absolute -bottom-20 left-[3%] w-[380px] h-[380px] rounded-full pointer-events-none aurora-orb-2"
            style={{ background: 'radial-gradient(circle, #00BFFF12 0%, transparent 70%)' }}
          />
          <motion.div
            className="absolute top-[30%] left-[40%] w-[220px] h-[220px] rounded-full pointer-events-none aurora-orb-3"
            style={{ background: 'radial-gradient(circle, #0077C80c 0%, transparent 70%)' }}
          />

          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-10 sm:pb-16">
            {/* Hero Text */}
            <div className="text-center mb-8 sm:mb-10">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Animated badge */}
                <motion.div
                  className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-[#1428A0]/10 to-[#0077C8]/10 rounded-full mb-5 border border-[#1428A0]/20"
                  animate={{ boxShadow: ['0 0 0px #1428A000', '0 0 16px #1428A035', '0 0 0px #1428A000'] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                >
                  <motion.span
                    className="w-1.5 h-1.5 rounded-full bg-[#1428A0]"
                    animate={{ scale: [1, 1.6, 1], opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#1428A0]">Samsung 2026 · FloatLayer Design</span>
                  <Zap className="w-3 h-3 text-[#0077C8]" />
                </motion.div>

                <motion.h1
                  className={`text-3xl sm:text-5xl lg:text-6xl font-black leading-[1.05] mb-3 max-w-3xl mx-auto ${darkMode ? 'text-white' : 'text-gray-900'}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.15 }}
                >
                  <TypewriterText texts={['S95H OLED · El Futuro Visual', 'Neo QLED 8K · Realidad Total', 'Odyssey G9 · Gaming Definitivo']} speed={55} delay={2800} />
                </motion.h1>

                <motion.p
                  className={`text-sm max-w-lg mx-auto mb-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  Rotacion 360° interactiva. Arrastra para explorar cada angulo del TV mas avanzado de Samsung.
                </motion.p>

                <motion.div
                  className="flex flex-wrap items-center justify-center gap-5 mb-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  {[{ icon: Shield, label: '5 Anos Garantia' }, { icon: Clock, label: '24h Express' }, { icon: Award, label: 'CES 2024' }].map((b, i) => (
                    <motion.div
                      key={b.label}
                      className="flex items-center gap-1.5 text-gray-400"
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.45 + i * 0.08 }}
                    >
                      <b.icon className="w-3.5 h-3.5 text-[#1428A0]" /><span className="text-[10px] font-medium">{b.label}</span>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            </div>

            {/* VR Viewer */}
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }}
              className="max-w-4xl mx-auto">
              <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
                <VRViewer product={effectiveProducts?.[0] || { name: 'Samsung S95D OLED', model: 'QN65S95D', imageUrl: '/tv-s95d-real.jpg' }} />
              </motion.div>
            </motion.div>

            {/* CTAs */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.5 }}
              className="flex flex-wrap items-center justify-center gap-3 mt-8">
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                <Button className="h-11 px-7 samsung-btn-primary text-xs shadow-lg shadow-blue-900/25" onClick={() => scrollTo('#catalogo')}>
                  Ver Catalogo <ArrowRight className="ml-2 w-3.5 h-3.5" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                <Button variant="outline" className={`h-11 px-5 rounded-full text-xs ${darkMode ? 'border-gray-700 text-gray-300' : 'samsung-btn-outline'}`} onClick={() => scrollTo('#tecnologia')}>
                  Innovacion Samsung
                </Button>
              </motion.div>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
              className="flex flex-wrap items-center justify-center gap-3 mt-4">
              <ARPhotoPreview productImage={effectiveProducts?.[0]?.imageUrl || '/tv-s95d-real.jpg'} productName={effectiveProducts?.[0]?.name || 'Samsung S95D OLED'} darkMode={darkMode} />
              <ProductSizeConfigurator />
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* ═══ CATALOG ═══ */}
      <section id="catalogo" className={`py-10 sm:py-16 ${darkMode ? 'bg-[#0a0a0f]' : 'bg-[#fafbfc]'}`}>
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1428A0] mb-2">Lineup 2026</p>
            <h2 className={`text-2xl sm:text-4xl font-black mb-2 tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>Catalogo Samsung</h2>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Descubre la nueva generacion de displays con IA integrada</p>
          </motion.div>

          {/* Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6" ref={searchRef}>
            <div className="relative flex-1 max-w-md mx-auto w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder="Buscar modelos 2026..." value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); setVoiceSearchResult('') }}
                onFocus={() => setShowSuggestions(true)}
                className={`pl-11 pr-10 h-11 rounded-full text-sm ${darkMode ? 'bg-[#1a1a2a] border-gray-700 text-white' : ''}`} />
              <div className="absolute right-3 top-1/2 -translate-y-1/2"><VoiceSearch onResult={handleVoiceResult} /></div>
              <AnimatePresence>
                {showSuggestions && searchSuggestions.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                    className={`absolute z-20 top-12 left-0 right-0 rounded-xl shadow-xl border overflow-hidden ${darkMode ? 'bg-[#1a1a2a] border-gray-700' : 'bg-white border-gray-100'}`}>
                    {searchSuggestions.map((s, i) => (
                      <button key={i} className={`block w-full text-left px-4 py-2.5 text-xs transition-colors ${darkMode ? 'hover:bg-white/5 text-gray-300' : 'hover:bg-gray-50 text-gray-600'}`}
                        onClick={() => { setSearchQuery(s); setShowSuggestions(false) }}>
                        <Search className="w-3 h-3 inline mr-2 text-gray-400" />{s}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
            <button onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full text-[11px] font-bold transition-all ${selectedCategory === 'all' ? 'bg-[#1428A0] text-white shadow-md' : pillInactive}`}>
              Todos
            </button>
            {(categories || []).map((cat: any) => (
              <button key={cat.id} onClick={() => setSelectedCategory(cat.slug)}
                className={`px-4 py-2 rounded-full text-[11px] font-bold transition-all ${selectedCategory === cat.slug ? 'bg-[#1428A0] text-white shadow-md' : pillInactive}`}>
                {cat.name}
              </button>
            ))}
            <div className="relative ml-auto">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                className={`appearance-none text-[11px] pl-3 pr-7 h-9 rounded-full border cursor-pointer ${darkMode ? 'bg-[#1a1a2a] border-gray-700 text-gray-300' : 'bg-white border-gray-200 text-gray-600'}`}>
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <SortAsc className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
            </div>
            <button onClick={() => setShowFilters(!showFilters)}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${darkMode ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
              <Filter className="w-4 h-4" />
            </button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mb-6">
                <div className={`p-4 rounded-2xl border max-w-md mx-auto ${darkMode ? 'bg-[#1a1a2a] border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                  <p className="text-[11px] font-bold mb-3 text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rango de Precio</p>
                  <div className="flex items-center gap-3">
                    <input type="range" min={0} max={100000} step={1000} value={priceRange[1]}
                      onChange={(e) => setPriceRange([0, Number(e.target.value)])}
                      className="flex-1 h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-[#1428A0]" />
                    <span className="text-xs font-bold text-[#1428A0] w-24 text-right">Hasta ${priceRange[1].toLocaleString()}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Swipe Catalog */}
          <SwipeCatalogSection
            products={filtered}
            loading={productsLoading}
            darkMode={darkMode}
            wishlist={wishlist}
            compareList={compareList}
            onToggleWishlist={toggleWishlist}
            onToggleCompare={toggleCompare}
            onAddToCart={addToCart}
            onViewProduct={setViewProduct}
            onZoom={setMagnifierProduct}
            onSpecSheet={setSpecSheetProduct}
            onQuickView={setQuickViewProduct}
          />

          {compareList.length > 0 && (
            <div className="flex justify-center mt-6">
              <button onClick={() => setCompareOpen(true)}
                className="px-4 py-2 bg-[#1428A0]/10 text-[#1428A0] rounded-full text-xs font-bold flex items-center gap-1.5 hover:bg-[#1428A0]/20 transition-colors">
                <TrendingUp className="w-3.5 h-3.5" /> Comparar {compareList.length} productos
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ═══ INNOVATION ═══ */}
      <InnovationBanner darkMode={darkMode} />

      {/* ═══ STATS ═══ */}
      <section className={`py-10 sm:py-14 ${darkMode ? 'bg-[#0a0a0f]' : 'bg-[#fafbfc]'}`}>
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { label: 'Clientes Satisfechos', value: 50000, suffix: '+' },
              { label: 'Nucleos AI NQ4 Gen2', value: 512, suffix: '' },
              { label: 'Satisfaccion', value: 99, suffix: '%' },
              { label: 'Soporte', value: 24, suffix: '/7' },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 24, scale: 0.92 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                whileHover={{ scale: 1.04 }}
                transition={{ delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                viewport={{ once: true }}
                className={`p-4 rounded-2xl ${darkMode ? 'bg-[#0f0f1a]' : 'bg-white'} shadow-sm`}
              >
                <p className="text-3xl sm:text-4xl font-black text-[#1428A0] glow-text"><AnimatedCounter value={s.value} suffix={s.suffix} /></p>
                <p className={`text-[11px] mt-1 font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section id="resenas" className={`py-12 sm:py-20 ${darkMode ? 'bg-[#0f0f1a]' : 'bg-white'}`}>
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1428A0] mb-2">Experiencias Reales</p>
            <h2 className={`text-2xl sm:text-4xl font-black mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Lo Que Dicen Nuestros Clientes</h2>
            <p className="text-sm text-gray-500 max-w-lg mx-auto">Miles de mexicanos ya disfrutan de la mejor tecnologia Samsung.</p>
          </motion.div>
          <TestimonialCarousel />
        </div>
      </section>

      {/* ═══ NEWSLETTER ═══ */}
      <section className="bg-gradient-to-r from-[#1428A0] to-[#0f1f7a]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h3 className="text-xl sm:text-2xl font-black text-white mb-1">Unete a Samsung MX</h3>
              <p className="text-sm text-white/70">Ofertas exclusivas, lanzamientos anticipados y contenido premium.</p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Input placeholder="Tu correo electronico" className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-full min-w-[280px]" />
              <Button className="h-12 px-6 bg-white text-[#1428A0] hover:bg-gray-100 rounded-full font-bold text-sm shrink-0">Suscribirse</Button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ EMBAJADORES BANNER ═══ */}
      <section className={`py-10 sm:py-14 ${darkMode ? 'bg-[#0f0f1a]' : 'bg-white'}`}>
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className={`relative overflow-hidden rounded-2xl p-6 sm:p-10 ${darkMode ? 'bg-gradient-to-r from-[#1428A0]/20 to-[#0077C8]/10 border border-[#1428A0]/20' : 'bg-gradient-to-r from-[#1428A0] to-[#0077C8]'}`}>
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className={`w-4 h-4 ${darkMode ? 'text-[#00BFFF]' : 'text-white'}`} />
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-[#00BFFF]' : 'text-white/80'}`}>Programa de Embajadores</span>
                </div>
                <h3 className={`text-xl sm:text-2xl font-black mb-1 ${darkMode ? 'text-white' : 'text-white'}`}>Gana hasta 8% por cada venta</h3>
                <p className={`text-xs max-w-md ${darkMode ? 'text-gray-400' : 'text-white/80'}`}>Unete a Samsung Embajadores MX. Comparte tu codigo, construye tu red multinivel y gana comisiones de 3 niveles de profundidad.</p>
              </div>
              <div className="flex gap-3 shrink-0">
                <Button onClick={() => navigate('/mi-red')} className={`h-11 px-6 rounded-full font-bold text-xs ${darkMode ? 'bg-[#1428A0] hover:bg-[#0f1f7a] text-white' : 'bg-white text-[#1428A0] hover:bg-gray-100'}`}>
                  Unirme Ahora <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="bg-[#0d0d0d] text-white">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {/* Brand */}
            <div className="col-span-2 lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <img src="/logo-samsung-mx.png" alt="" className="w-10 h-10" />
                <div>
                  <span className="text-sm font-black tracking-[0.1em] block">SAMSUNG</span>
                  <span className="text-[9px] font-bold tracking-[0.2em] text-gray-500 block">STORE MX</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed max-w-xs">Displays premium con IA integrada para el mercado mexicano. Garantia oficial Samsung 5 anos.</p>
              <div className="flex gap-2 mb-4">
                {[Facebook, Instagram, Youtube, Twitter].map((Icon, i) => (
                  <button key={i} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#1428A0] transition-all hover:scale-110">
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-gray-500"><MapPin className="w-3 h-3 text-[#00BFFF]" /> CDMX, Mexico</div>
                <div className="flex items-center gap-2 text-xs text-gray-500"><Phone className="w-3 h-3 text-[#00BFFF]" /> 800-SAMSUNG</div>
                <div className="flex items-center gap-2 text-xs text-gray-500"><Mail className="w-3 h-3 text-[#00BFFF]" /> soporte@samsung.mx</div>
              </div>
            </div>

            {/* Products */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider mb-3 text-gray-300">Productos 2026</h4>
              <ul className="space-y-2">
                {['S95H OLED', 'S90H OLED', 'QN80H Neo QLED', 'The Frame Pro', 'Odyssey G9', 'QN70H'].map(item => (
                  <li key={item}>
                    <span className="text-xs text-gray-500 hover:text-white transition-colors cursor-pointer flex items-center gap-1">
                      <ArrowUpRight className="w-2.5 h-2.5" />{item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider mb-3 text-gray-300">Soporte</h4>
              <ul className="space-y-2">
                {['Centro Ayuda', 'Garantia MX', 'Servicio Tecnico', 'FAQ'].map(item => (
                  <li key={item}><span className="text-xs text-gray-500 hover:text-white transition-colors cursor-pointer">{item}</span></li>
                ))}
              </ul>
            </div>

            {/* Embajadores */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider mb-3 text-gray-300">Embajadores</h4>
              <ul className="space-y-2">
                <li><button onClick={() => navigate('/mi-red')} className="text-xs text-gray-500 hover:text-white transition-colors flex items-center gap-1"><Sparkles className="w-3 h-3 text-[#00BFFF]" /> Programa Embajadores</button></li>
                <li><span className="text-xs text-gray-500">Gana hasta 8% por venta</span></li>
                <li><span className="text-xs text-gray-500">3 niveles de comisiones</span></li>
              </ul>
            </div>

            {/* Admin Access */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider mb-3 text-gray-300">Acceso Administrativo</h4>
              <ul className="space-y-2">
                <li><button onClick={() => navigate('/login')} className="text-xs text-gray-500 hover:text-white transition-colors flex items-center gap-1"><Shield className="w-3 h-3 text-[#00BFFF]" /> Panel Admin</button></li>
                <li><span className="text-[9px] text-gray-600">Acceso exclusivo para administradores</span></li>
              </ul>
            </div>

            {/* Account */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider mb-3 text-gray-300">Cuenta</h4>
              <ul className="space-y-2">
                <li>
                  {isAuthenticated ? (
                    <div className="space-y-1.5">
                      <span className="text-xs text-gray-400 block flex items-center gap-1"><Globe className="w-3 h-3" /> {user?.name}</span>
                      {user?.role === 'admin' && <button onClick={() => navigate('/admin')} className="text-xs text-[#00BFFF] hover:text-white transition-colors flex items-center gap-1">Panel Admin <ExternalLink className="w-2.5 h-2.5" /></button>}
                      {user?.role === 'agent' && <button onClick={() => navigate('/agent')} className="text-xs text-[#00BFFF] hover:text-white transition-colors flex items-center gap-1">Portal Agente <ExternalLink className="w-2.5 h-3" /></button>}
                      <button onClick={logout} className="text-xs text-red-400 hover:text-red-300 transition-colors">Cerrar Sesion</button>
                    </div>
                  ) : (
                    <button onClick={() => navigate('/login')} className="text-xs text-[#00BFFF] hover:text-white transition-colors font-bold flex items-center gap-1">Iniciar Sesion <ExternalLink className="w-2.5 h-2.5" /></button>
                  )}
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-white/5">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-2">
            <p className="text-[10px] text-gray-600"> Samsung Store MX. Todos los derechos reservados.</p>
            <div className="flex gap-4">
              <span className="text-[10px] text-gray-600 hover:text-gray-400 cursor-pointer">Privacidad</span>
              <span className="text-[10px] text-gray-600 hover:text-gray-400 cursor-pointer">Terminos</span>
              <span className="text-[10px] text-gray-600 hover:text-gray-400 cursor-pointer">Legal</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ═══ FLOATING ELEMENTS ═══ */}
      <AIChatWidget />
      <LiveAgentChat />
      <HelpButton />
      <FloatingCartBar cart={cart} cartTotal={cartTotal} cartCount={cartCount} onClick={() => setCartOpen(true)} />
      <BackToTop />

      {/* ═══ MODALS ═══ */}
      {/* Quick View */}
      <Sheet open={!!quickViewProduct} onOpenChange={() => setQuickViewProduct(null)}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader><SheetTitle className="flex items-center gap-2"><Eye className="w-5 h-5 text-[#1428A0]" /> Vista Rapida</SheetTitle></SheetHeader>
          {quickViewProduct && (
            <div className="mt-4 space-y-4">
              <ShimmerImage src={quickViewProduct.imageUrl} alt={quickViewProduct.name} className="w-full aspect-video rounded-2xl" />
              <div>
                <Badge className="bg-[#1428A0]/10 text-[#1428A0] text-[11px] mb-2">{quickViewProduct.category}</Badge>
                <h3 className="text-xl font-black text-gray-900 dark:text-white">{quickViewProduct.name}</h3>
                <p className="text-sm text-gray-500">{quickViewProduct.model}</p>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{quickViewProduct.description}</p>
              <p className="text-2xl font-black text-[#1428A0]">${Number(quickViewProduct.price).toLocaleString()} <span className="text-sm font-normal text-gray-400">MXN</span></p>
              <div className="flex gap-2">
                <Button className="flex-1 h-11 samsung-btn-primary" onClick={() => { addToCart(quickViewProduct); setQuickViewProduct(null) }} disabled={quickViewProduct.stock === 0}>
                  <ShoppingCart className="w-4 h-4 mr-2" /> {quickViewProduct.stock === 0 ? 'Agotado' : 'Agregar'}
                </Button>
                <Button variant="outline" className="h-11 w-11 rounded-full" onClick={() => { setQuickViewProduct(null); setViewProduct(quickViewProduct) }}><ZoomIn className="w-4 h-4" /></Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Cart */}
      <Dialog open={cartOpen} onOpenChange={setCartOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-base"><ShoppingCart className="w-5 h-5" /> Tu Carrito</DialogTitle></DialogHeader>
          <div className="mt-4 space-y-3">
            {cart.length === 0 ? (
              <div className="text-center py-10"><ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" /><p className="text-sm text-gray-400">Tu carrito esta vacio</p></div>
            ) : (
              <>
                {cart.map(item => (
                  <div key={item.product.id} className="flex gap-3 items-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                    <img src={item.product.imageUrl} alt={item.product.name} className="w-14 h-14 object-cover rounded-lg" />
                    <div className="flex-1 min-w-0"><p className="font-semibold text-sm truncate">{item.product.name}</p><p className="text-xs text-gray-500">${Number(item.product.price).toLocaleString()}</p></div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateQty(item.product.id, item.quantity - 1)} className="w-7 h-7 rounded-full bg-white dark:bg-gray-700 border flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                      <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                      <button onClick={() => updateQty(item.product.id, item.quantity + 1)} className="w-7 h-7 rounded-full bg-white dark:bg-gray-700 border flex items-center justify-center"><Plus className="w-3 h-3" /></button>
                    </div>
                    <button onClick={() => removeFromCart(item.product.id)} className="w-7 h-7 rounded-full hover:bg-red-50 flex items-center justify-center text-red-400"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between items-center py-2"><span className="font-bold text-sm">Subtotal:</span><span className="font-black text-xl text-[#1428A0]">${cartTotal.toLocaleString()} MXN</span></div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2"><Truck className="w-3 h-3" />{cartTotal >= 5000 ? 'Envio gratis!' : `Te faltan $${(5000 - cartTotal).toLocaleString()}`}</div>
                <Button className="w-full h-12 samsung-btn-primary text-sm" onClick={() => { setCartOpen(false); setCheckoutOpen(true); setCheckoutStep(1) }}>Proceder al Pago <ArrowRight className="w-4 h-4 ml-2" /></Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Wishlist */}
      <Dialog open={wishlistOpen} onOpenChange={setWishlistOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Heart className="w-5 h-5 text-red-500" /> Favoritos ({wishlist.length})</DialogTitle></DialogHeader>
          <div className="mt-4 space-y-3">
            {wishlist.length === 0 ? (
              <div className="text-center py-10"><Heart className="w-12 h-12 mx-auto mb-3 text-gray-300" /><p className="text-sm text-gray-400">No tienes favoritos</p></div>
            ) : (
              (effectiveProducts || FALLBACK_PRODUCTS).filter((p: any) => wishlist.includes(p.id)).map((p: any) => (
                <div key={p.id} className="flex gap-3 items-center p-3 bg-gray-50 rounded-xl">
                  <img src={p.imageUrl} alt={p.name} className="w-14 h-14 object-cover rounded-lg" />
                  <div className="flex-1 min-w-0"><p className="font-semibold text-sm truncate">{p.name}</p><p className="text-xs text-gray-500">${Number(p.price).toLocaleString()}</p></div>
                  <Button size="sm" className="bg-[#1428A0] text-white rounded-full text-xs h-8" onClick={() => addToCart(p)}>Agregar</Button>
                  <button onClick={() => toggleWishlist(p.id)} className="w-7 h-7 rounded-full hover:bg-red-50 flex items-center justify-center text-red-400"><X className="w-3.5 h-3.5" /></button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Product Detail */}
      <Dialog open={!!viewProduct} onOpenChange={() => setViewProduct(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {viewProduct && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="relative">
                <ShimmerImage src={viewProduct.imageUrl} alt={viewProduct.name} className="w-full h-64 md:h-80 object-cover rounded-2xl" />
                <button onClick={() => toggleWishlist(viewProduct.id)} className="absolute top-3 right-3 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                  <Heart className={`w-4 h-4 ${wishlist.includes(viewProduct.id) ? 'text-red-500 fill-red-500' : 'text-gray-600'}`} />
                </button>
                <button onClick={() => setMagnifierProduct(viewProduct)} className="absolute bottom-3 right-3 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                  <ZoomIn className="w-4 h-4 text-gray-600" />
                </button>
              </div>
              <div className="space-y-3">
                <Badge className="bg-[#1428A0]/10 text-[#1428A0] text-[11px]">{viewProduct.category}</Badge>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">{viewProduct.name}</h2>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < Math.round(viewProduct.rating || 4.5) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                  ))}
                  <span className="text-xs text-gray-500 ml-1">({viewProduct.rating || 4.5})</span>
                </div>
                <p className="text-3xl font-black text-[#1428A0]">${Number(viewProduct.price).toLocaleString()} <span className="text-sm font-normal text-gray-400">MXN</span></p>
                <SizeSelector model={viewProduct.model} darkMode={darkMode} />
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{viewProduct.description}</p>
                {viewProduct.specs && (
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl text-xs space-y-1.5">
                    {Object.entries(typeof viewProduct.specs === 'string' ? JSON.parse(viewProduct.specs) : viewProduct.specs).map(([k, v]: [any, any]) => (
                      <div key={k} className="flex justify-between"><span className="text-gray-500">{k}</span><span className="font-semibold dark:text-gray-300">{v}</span></div>
                    ))}
                  </div>
                )}
                {viewProduct.features && (
                  <div className="flex flex-wrap gap-1.5">
                    {(typeof viewProduct.features === 'string' ? JSON.parse(viewProduct.features) : viewProduct.features).map((f: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-[10px]">{f}</Badge>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button className="flex-1 h-12 samsung-btn-primary" onClick={() => addToCart(viewProduct)}>Agregar al Carrito</Button>
                  <Button variant="outline" className="h-12 w-12 rounded-full" onClick={() => setAiProduct(viewProduct)}><Brain className="w-4 h-4" /></Button>
                  <Button variant="outline" className="h-12 w-12 rounded-full" onClick={() => setSpecSheetProduct(viewProduct)}><Box className="w-4 h-4" /></Button>
                </div>
                <button onClick={() => { navigator.clipboard?.writeText(window.location.href); toast.success('Enlace copiado!') }}
                  className="text-xs text-gray-500 flex items-center gap-1 hover:text-[#1428A0] transition-colors">
                  <Share2 className="w-3 h-3" /> Compartir
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Magnifier */}
      <Dialog open={!!magnifierProduct} onOpenChange={() => setMagnifierProduct(null)}>
        <DialogContent className="max-w-4xl p-1">
          {magnifierProduct && <img src={magnifierProduct.imageUrl} alt={magnifierProduct.name} className="w-full h-auto max-h-[70vh] object-contain rounded-xl" />}
        </DialogContent>
      </Dialog>

      {/* Compare */}
      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-[#1428A0]" /> Comparador ({compareProducts.length}/3)</DialogTitle></DialogHeader>
          <div className="mt-4 overflow-x-auto">
            {compareProducts.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-8">Selecciona productos</p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <th className="text-left p-2 sticky left-0 bg-white dark:bg-[#0a0a0f]">Caracteristica</th>
                    {compareProducts.map((p: any) => (
                      <th key={p.id} className="p-2 text-center min-w-[140px]">
                        <img src={p.imageUrl} alt="" className="w-16 h-16 object-cover rounded-lg mx-auto mb-2" />
                        <p className="font-bold text-sm">{p.name}</p>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {['Categoria', 'Precio', 'Stock', 'Calificacion', 'Modelo'].map(attr => (
                    <tr key={attr} className={`border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                      <td className={`p-2 font-medium sticky left-0 bg-white dark:bg-[#0a0a0f] ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{attr}</td>
                      {compareProducts.map((p: any) => (
                        <td key={p.id} className="p-2 text-center">
                          {attr === 'Precio' ? `$${Number(p.price).toLocaleString()}` :
                           attr === 'Stock' ? `${p.stock} uds` :
                           attr === 'Calificacion' ? `${p.rating || '4.5'}/5` :
                           attr === 'Modelo' ? p.model : p.category}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Analysis */}
      <Dialog open={!!aiProduct} onOpenChange={() => setAiProduct(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Brain className="w-5 h-5 text-[#1428A0]" /> Analisis IA</DialogTitle></DialogHeader>
          <div className="mt-2 space-y-4">
            <div className="flex gap-3 items-center p-3 bg-gray-50 rounded-xl">
              <img src={aiProduct?.imageUrl} alt="" className="w-16 h-16 object-cover rounded-lg" />
              <div><p className="font-bold text-sm">{aiProduct?.name}</p><p className="text-xs text-gray-500">{aiProduct?.model}</p></div>
            </div>
            <div className="space-y-2">
              {[{ label: 'Calidad Imagen', val: '98%' }, { label: 'Precio/Valor', val: '94%' }, { label: 'Durabilidad', val: '10+ anos' }, { label: 'Satisfaccion', val: '4.9/5' }, { label: 'Eco Eficiencia', val: '42% mejor' }].map(m => (
                <div key={m.label} className="flex justify-between p-2.5 bg-gray-50 rounded-lg">
                  <span className="text-xs text-gray-600">{m.label}</span>
                  <span className="text-xs font-bold text-[#1428A0]">{m.val}</span>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Checkout */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Lock className="w-5 h-5" /> Finalizar Compra</DialogTitle></DialogHeader>
          <div className="mt-2">
            <div className="flex items-center justify-between mb-6 px-2">
              {['Carrito', 'Envio', 'Pago', 'Confirmacion'].map((label, i) => (
                <div key={label} className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i + 1 <= checkoutStep ? 'bg-[#1428A0] text-white' : 'bg-gray-200 text-gray-500'}`}>
                    {i + 1 < checkoutStep ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={`text-[9px] font-medium ${i + 1 <= checkoutStep ? 'text-[#1428A0]' : 'text-gray-400'}`}>{label}</span>
                </div>
              ))}
            </div>
            <Progress value={(checkoutStep / 4) * 100} className="mb-6 h-1" />

            {checkoutStep === 1 && (
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs font-bold mb-2">Resumen</p>
                  {cart.map(item => (
                    <div key={item.product.id} className="flex justify-between text-xs py-1">
                      <span>{item.product.name} x{item.quantity}</span>
                      <span>${(Number(item.product.price) * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                  <Separator className="my-2" />
                  <div className="flex justify-between font-black text-sm"><span>Total</span><span>${cartTotal.toLocaleString()} MXN</span></div>
                </div>
                <Button className="w-full h-11 samsung-btn-primary" onClick={() => setCheckoutStep(2)}>Continuar <ArrowRight className="w-4 h-4 ml-2" /></Button>
              </div>
            )}

            {checkoutStep === 2 && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Input placeholder="Nombre completo" className="h-11 rounded-xl text-sm" />
                  <Input placeholder="Correo" type="email" className="h-11 rounded-xl text-sm" />
                  <Input placeholder="Telefono" type="tel" className="h-11 rounded-xl text-sm" />
                  <Input placeholder="Direccion" className="h-11 rounded-xl text-sm" />
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Ciudad" className="h-11 rounded-xl text-sm" />
                    <Input placeholder="CP" className="h-11 rounded-xl text-sm" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 h-11 rounded-full" onClick={() => setCheckoutStep(1)}>Atras</Button>
                  <Button className="flex-1 h-11 samsung-btn-primary" onClick={() => setCheckoutStep(3)}>Continuar</Button>
                </div>
              </div>
            )}

            {checkoutStep === 3 && (
              <div className="space-y-3">
                <div className="flex gap-2 mb-3">
                  <div className="flex-1 p-3 border-2 border-[#1428A0] rounded-xl text-center">
                    <CreditCard className="w-5 h-5 mx-auto mb-1 text-[#1428A0]" />
                    <p className="text-[10px] font-bold">Tarjeta</p>
                  </div>
                  <div className="flex-1 p-3 border border-gray-200 rounded-xl text-center opacity-50">
                    <Banknote className="w-5 h-5 mx-auto mb-1" />
                    <p className="text-[10px] font-bold">OXXO</p>
                  </div>
                  <div className="flex-1 p-3 border border-gray-200 rounded-xl text-center opacity-50">
                    <Receipt className="w-5 h-5 mx-auto mb-1" />
                    <p className="text-[10px] font-bold">SPEI</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Input placeholder="Numero tarjeta" className="h-11 rounded-xl text-sm" />
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="MM/AA" className="h-11 rounded-xl text-sm" />
                    <Input placeholder="CVV" className="h-11 rounded-xl text-sm" />
                  </div>
                  <Input placeholder="Nombre tarjeta" className="h-11 rounded-xl text-sm" />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 h-11 rounded-full" onClick={() => setCheckoutStep(2)}>Atras</Button>
                  <Button className="flex-1 h-11 samsung-btn-primary" disabled={createOrderMutation.isPending}
                    onClick={async () => {
                      if (!isAuthenticated) { toast.error('Inicia sesion para comprar'); return }
                      try {
                        const result = await createOrderMutation.mutateAsync({
                          total: cartTotal,
                          items: cart.map(i => ({ productId: i.product.id, quantity: i.quantity, price: Number(i.product.price) })),
                        })
                        if (result.orderId && user?.id) {
                          generateCommissionsMutation.mutate({ orderId: result.orderId, buyerId: user.id, total: cartTotal })
                        }
                        if (isAuthenticated) await cartClearMutation.mutateAsync()
                        setCheckoutStep(4)
                      } catch (e: any) {
                        toast.error(e.message || 'Error al procesar el pago')
                      }
                    }}>
                    {createOrderMutation.isPending ? 'Procesando...' : `Pagar $${cartTotal.toLocaleString()}`}
                  </Button>
                </div>
              </div>
            )}

            {checkoutStep === 4 && (
              <div className="text-center space-y-4">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                </motion.div>
                <div>
                  <p className="text-lg font-black">Pedido Confirmado!</p>
                  <p className="text-sm text-gray-500">Orden #SAM-{Date.now().toString().slice(-6)}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl text-left">
                  <p className="text-xs font-bold mb-2">Resumen:</p>
                  {cart.map(item => (
                    <div key={item.product.id} className="flex justify-between text-xs py-1">
                      <span>{item.product.name} x{item.quantity}</span>
                      <span>${(Number(item.product.price) * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                  <Separator className="my-2" />
                  <div className="flex justify-between font-black text-sm">
                    <span>Total</span>
                    <span className="text-[#1428A0]">${cartTotal.toLocaleString()} MXN</span>
                  </div>
                </div>
                <Button className="w-full h-11 samsung-btn-primary" onClick={() => { setCart([]); localStorage.removeItem('cart'); setCheckoutOpen(false); setCheckoutStep(1); confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } }) }}>
                  Finalizar
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Spec Sheet */}
      <SpecSheet product={specSheetProduct} open={!!specSheetProduct} onClose={() => setSpecSheetProduct(null)} />
    </div>
  )
}
