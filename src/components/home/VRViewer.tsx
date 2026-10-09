// @ts-nocheck
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  RotateCcw, Eye, ZoomIn, ZoomOut, Maximize2, Minimize2,
  Sparkles, Box, Sun, Moon, RefreshCw, MousePointer2,
} from 'lucide-react'

/* ═══════════════════════════════════════════════════════════════════
   Samsung TV 360° Photorealistic Viewer v5
   - GPU-accelerated transforms via transform3d
   - rAF-throttled drag handlers (no setState spam)
   - Spring physics on rotation
   - Image with shadow/glow isolation
   - Studio lighting environment
   - Refined glassmorphism controls
   ═══════════════════════════════════════════════════════════════════ */

const SPRING = { type: 'spring', stiffness: 120, damping: 22, mass: 0.6 }

export function VRViewer({ product }: { product: any }) {
  /* ── State ── */
  const [rotY, setRotY] = useState(0)
  const [rotX, setRotX] = useState(-10)
  const [zoom, setZoom] = useState(1)
  const [autoRotate, setAutoRotate] = useState(true)
  const [immersive, setImmersive] = useState(false)
  const [lightMode, setLightMode] = useState<'studio' | 'cinema'>('studio')
  const [isDragging, setIsDragging] = useState(false)
  const [showHints, setShowHints] = useState(true)

  /* ── Refs (avoid re-renders on drag) ── */
  const tvRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef({ x: 0, y: 0, rotY: 0, rotX: 0 })
  const rafRef = useRef<number>()
  const lastUpdateRef = useRef(0)

  /* ── Product data ── */
  const imageUrl = product?.imageUrl || '/products/s95f.jpg'
  const modelName = product?.model || 'QN65S95FAFXZX'
  const productName = product?.name || 'Samsung S95F OLED 65"'
  const isOled = (product?.category || '').toLowerCase().includes('oled')
  const isFrame = (product?.category || '').toLowerCase().includes('frame')

  /* ── Hint auto-dismiss ── */
  useEffect(() => {
    const t = setTimeout(() => setShowHints(false), 5000)
    return () => clearTimeout(t)
  }, [])

  /* ── Auto-rotation (rAF, smooth, GPU-friendly) ── */
  useEffect(() => {
    if (!autoRotate || isDragging) return
    let raf: number
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(now - last, 32) // cap at 32ms to prevent jumps
      last = now
      setRotY(prev => (prev + dt * 0.03) % 360)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [autoRotate, isDragging])

  /* ── Drag handlers — rAF throttled, direct DOM update for performance ── */
  const handleStart = useCallback((clientX: number, clientY: number) => {
    setIsDragging(true)
    setAutoRotate(false)
    setShowHints(false)
    dragRef.current = { x: clientX, y: clientY, rotY, rotX }
  }, [rotY, rotX])

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging) return
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      const now = performance.now()
      if (now - lastUpdateRef.current < 16) return // ~60fps cap
      lastUpdateRef.current = now
      const dx = clientX - dragRef.current.x
      const dy = clientY - dragRef.current.y
      const newRotY = dragRef.current.rotY + dx * 0.5
      const newRotX = Math.max(-45, Math.min(35, dragRef.current.rotX - dy * 0.35))
      setRotY(newRotY)
      setRotX(newRotX)
    })
  }, [isDragging])

  const handleEnd = useCallback(() => {
    setIsDragging(false)
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
  }, [])

  const resetView = () => {
    setRotY(0)
    setRotX(-10)
    setZoom(1)
  }

  const handleDoubleClick = () => {
    if (autoRotate) setAutoRotate(false)
    else { resetView(); setAutoRotate(true) }
  }

  /* ── Derived for visual effects ── */
  const normRot = ((rotY % 360) + 360) % 360
  const isBackVisible = normRot > 90 && normRot < 270
  const sideness = Math.abs(Math.sin((rotY * Math.PI) / 180))
  const frontness = Math.max(0, Math.cos((rotY * Math.PI) / 180))
  const viewLabel = isBackVisible ? 'Posterior' : sideness > 0.65 ? 'Lateral' : 'Frontal'

  /* ── Studio/cinema palettes ── */
  const env = useMemo(() => {
    if (lightMode === 'cinema') {
      return {
        bg: 'from-[#000] via-[#0a0518] to-[#02000a]',
        floor: `
          radial-gradient(ellipse 70% 50% at center 100%, rgba(80,20,180,0.18), transparent 70%),
          radial-gradient(ellipse 30% 20% at center 75%, rgba(20,40,160,0.12), transparent 60%)
        `,
        spotlight: 'rgba(255,180,200,0.06)',
        ambient: 'rgba(120,60,255,0.04)',
        particleColor: 'bg-purple-400/40',
      }
    }
    return {
      bg: 'from-[#040814] via-[#0a1228] to-[#02050f]',
      floor: `
        radial-gradient(ellipse 80% 50% at center 100%, rgba(20,60,200,0.22), transparent 70%),
        radial-gradient(ellipse 40% 25% at center 75%, rgba(0,150,255,0.15), transparent 60%)
      `,
      spotlight: 'rgba(200,220,255,0.08)',
      ambient: 'rgba(20,80,200,0.05)',
      particleColor: 'bg-blue-400/40',
    }
  }, [lightMode])

  return (
    <div className={immersive ? 'fixed inset-0 z-[100] bg-black' : 'relative w-full'}>
      <div
        onMouseDown={e => handleStart(e.clientX, e.clientY)}
        onMouseMove={e => handleMove(e.clientX, e.clientY)}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={e => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchMove={e => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={handleEnd}
        onDoubleClick={handleDoubleClick}
        className={`relative w-full overflow-hidden ${immersive ? 'h-screen' : 'rounded-3xl'}
          bg-gradient-to-b ${env.bg} select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}
          transition-all duration-700`}
        style={{
          minHeight: immersive ? '100vh' : '600px',
          aspectRatio: immersive ? undefined : '16 / 11',
          willChange: 'transform',
        }}
      >
        {/* ─── Studio lighting (top spotlight + side fills) ─── */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Top spotlight */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[60%]"
            style={{
              background: `radial-gradient(ellipse at top, ${env.spotlight}, transparent 60%)`,
              transition: 'all 0.7s',
            }}
          />
          {/* Side rim lights */}
          <div className="absolute left-0 top-1/4 w-[40%] h-[60%]"
            style={{
              background: `radial-gradient(circle at left center, ${env.ambient}, transparent 60%)`,
              transition: 'all 0.7s',
            }}
          />
          <div className="absolute right-0 top-1/4 w-[40%] h-[60%]"
            style={{
              background: `radial-gradient(circle at right center, ${env.ambient}, transparent 60%)`,
              transition: 'all 0.7s',
            }}
          />
        </div>

        {/* ─── Floor showroom ─── */}
        <div className="absolute bottom-0 left-0 right-0 h-2/5 pointer-events-none"
          style={{ background: env.floor, transition: 'all 0.7s' }} />

        {/* ─── Floor grid (subtle perspective lines) ─── */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[30%] pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage: `
              linear-gradient(to right, white 1px, transparent 1px),
              linear-gradient(to bottom, white 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
            transform: 'perspective(800px) rotateX(70deg)',
            transformOrigin: 'center bottom',
            maskImage: 'linear-gradient(to top, black, transparent)',
            WebkitMaskImage: 'linear-gradient(to top, black, transparent)',
          }}
        />

        {/* ─── Ambient particles ─── */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(14)].map((_, i) => (
            <motion.div
              key={i}
              className={`absolute w-[2px] h-[2px] rounded-full ${env.particleColor}`}
              style={{
                left: `${(i * 47) % 100}%`,
                top: `${(i * 31 + 5) % 90}%`,
              }}
              animate={{
                opacity: [0.1, 0.6, 0.1],
                scale: [0.8, 1.6, 0.8],
              }}
              transition={{
                duration: 4 + (i % 4),
                repeat: Infinity,
                delay: i * 0.4,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>

        {/* ═══════════ HUD: HEADER ═══════════ */}
        <div className="absolute top-4 left-4 z-30 flex items-center gap-2 px-3 py-1.5 rounded-full
          bg-black/40 backdrop-blur-xl border border-white/10 shadow-lg shadow-black/30">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-[10px] font-black tracking-[0.18em] text-white uppercase">360° View</span>
          <span className="text-[9px] text-white/40 font-mono ml-0.5">{modelName}</span>
        </div>

        {/* ═══════════ HUD: CONTROLS RIGHT ═══════════ */}
        <div className="absolute top-4 right-4 z-30 flex items-center gap-1.5 flex-wrap justify-end">
          {/* Light toggle */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setLightMode(m => m === 'studio' ? 'cinema' : 'studio')}
            className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-xl border border-white/10
              flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all">
            {lightMode === 'studio' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </motion.button>

          {/* Auto rotate */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setAutoRotate(p => !p)}
            className={`flex items-center gap-1.5 h-9 px-3 rounded-full backdrop-blur-xl border text-[10px] font-bold transition-all ${
              autoRotate
                ? 'bg-blue-500/30 border-blue-400/50 text-white shadow-lg shadow-blue-500/20'
                : 'bg-black/40 border-white/10 text-white/70 hover:text-white hover:bg-white/10'
            }`}>
            <RotateCcw className={`w-3 h-3 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '8s' }} />
            <span>Auto</span>
          </motion.button>

          {/* Zoom out */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setZoom(z => Math.max(0.7, z - 0.15))}
            disabled={zoom <= 0.7}
            className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-xl border border-white/10
              flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10
              disabled:opacity-30 disabled:cursor-not-allowed transition-all">
            <ZoomOut className="w-3.5 h-3.5" />
          </motion.button>

          {/* Zoom indicator */}
          <div className="h-9 px-3 rounded-full bg-black/40 backdrop-blur-xl border border-white/10
            flex items-center text-[10px] font-mono text-white/70 min-w-[44px] justify-center">
            {Math.round(zoom * 100)}%
          </div>

          {/* Zoom in */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setZoom(z => Math.min(1.6, z + 0.15))}
            disabled={zoom >= 1.6}
            className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-xl border border-white/10
              flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10
              disabled:opacity-30 disabled:cursor-not-allowed transition-all">
            <ZoomIn className="w-3.5 h-3.5" />
          </motion.button>

          {/* Reset */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={resetView}
            className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-xl border border-white/10
              flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all"
            title="Reset view">
            <RefreshCw className="w-3.5 h-3.5" />
          </motion.button>

          {/* VR */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setImmersive(p => !p)}
            className="flex items-center gap-1.5 h-9 px-3 rounded-full
              bg-gradient-to-r from-[#1428A0] to-[#0077C8] text-white text-[10px] font-bold
              shadow-lg shadow-blue-900/40 hover:shadow-blue-900/60 transition-all">
            {immersive ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
            <span>{immersive ? 'Cerrar' : 'VR'}</span>
          </motion.button>
        </div>

        {/* ═══════════ View label (top center) ═══════════ */}
        <AnimatePresence mode="wait">
          <motion.div
            key={viewLabel}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-1
              rounded-full bg-black/40 backdrop-blur-xl border border-white/10"
          >
            <Box className="w-3 h-3 text-blue-400" />
            <span className="text-[10px] font-bold text-white/80 tracking-wider">VISTA {viewLabel.toUpperCase()}</span>
          </motion.div>
        </AnimatePresence>

        {/* ═══════════ Angle indicator (bottom-right) ═══════════ */}
        <div className="absolute bottom-4 right-4 z-30 px-3 py-1.5 rounded-full
          bg-black/40 backdrop-blur-xl border border-white/10 flex items-center gap-2">
          <span className="text-[10px] font-mono text-blue-400">Y</span>
          <span className="text-[11px] font-mono font-bold text-white tabular-nums">
            {String(Math.round(((rotY % 360) + 360) % 360)).padStart(3, '0')}°
          </span>
          <span className="text-white/20">·</span>
          <span className="text-[10px] font-mono text-blue-400">X</span>
          <span className="text-[11px] font-mono font-bold text-white tabular-nums">
            {String(Math.round(rotX)).padStart(3, ' ')}°
          </span>
        </div>

        {/* ═══════════════ STAGE 3D ═══════════════ */}
        <div className="absolute inset-0 flex items-center justify-center p-8"
          style={{ perspective: '1800px', perspectiveOrigin: '50% 40%' }}>

          {/* Ground shadow */}
          <motion.div
            className="absolute pointer-events-none"
            animate={{
              width: `${45 + sideness * 25}%`,
              x: Math.sin((rotY * Math.PI) / 180) * 60,
            }}
            transition={SPRING}
            style={{
              bottom: '14%',
              maxWidth: '700px',
              height: '24px',
              background: 'radial-gradient(ellipse, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 40%, transparent 70%)',
              filter: 'blur(14px)',
            }}
          />

          {/* Floor reflection */}
          <motion.div
            className="absolute pointer-events-none"
            animate={{ rotateY: rotY }}
            transition={isDragging ? { duration: 0 } : SPRING}
            style={{
              top: '63%',
              width: '60%',
              maxWidth: '720px',
              aspectRatio: '16 / 9',
              transformStyle: 'preserve-3d',
              transform: `rotateX(${-rotX - 180}deg) scale(${zoom * 0.95})`,
              opacity: Math.max(0, 0.22 - Math.abs(rotX) / 120),
              filter: 'blur(3px)',
              maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 75%)',
              WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 75%)',
              willChange: 'transform',
            }}
          >
            <img src={imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" draggable={false}
              style={{ borderRadius: '6px' }} />
          </motion.div>

          {/* ═══════════ TV 3D BOX ═══════════ */}
          <motion.div
            ref={tvRef}
            animate={{ rotateY: rotY, rotateX: rotX, scale: zoom }}
            transition={isDragging ? { duration: 0 } : SPRING}
            className="relative"
            style={{
              transformStyle: 'preserve-3d',
              width: '62%',
              maxWidth: immersive ? '950px' : '760px',
              aspectRatio: '16 / 9',
              willChange: 'transform',
              filter: `
                drop-shadow(0 35px 70px rgba(0,0,0,0.85))
                drop-shadow(0 15px 40px rgba(20,60,200,0.35))
                drop-shadow(0 0 60px rgba(0,119,200,${0.15 + frontness * 0.15}))
              `,
            }}
          >
            {/* ═══ FRONT (screen) ═══ */}
            <div className="absolute inset-0 overflow-hidden"
              style={{
                transform: 'translateZ(24px)',
                background: '#000',
                borderRadius: '6px',
                boxShadow: `
                  inset 0 0 0 4px #0d0d12,
                  inset 0 0 0 5px #2a2a35,
                  inset 0 0 0 6px #1a1a22,
                  0 0 0 1px rgba(255,255,255,0.06)
                `,
              }}>
              <img
                src={imageUrl}
                alt={productName}
                className="w-full h-full object-cover"
                draggable={false}
                style={{
                  filter: `brightness(${0.95 + frontness * 0.15}) contrast(1.08) saturate(1.12)`,
                  transition: 'filter 0.3s',
                }}
              />

              {/* Subpixel glow OLED */}
              {isOled && (
                <div className="absolute inset-0 pointer-events-none mix-blend-screen opacity-50"
                  style={{
                    background: 'radial-gradient(ellipse at center, rgba(0,150,255,0.08) 0%, transparent 70%)',
                  }}
                />
              )}

              {/* Anti-glare film + dynamic reflection */}
              <div className="absolute inset-0 pointer-events-none mix-blend-screen"
                style={{
                  background: `
                    linear-gradient(${100 + rotY * 0.4}deg,
                      rgba(255,255,255,${0.12 + frontness * 0.1}) 0%,
                      rgba(255,255,255,${0.04 + frontness * 0.04}) 25%,
                      transparent 50%,
                      transparent 75%,
                      rgba(0,150,255,${0.08 + frontness * 0.04}) 100%)
                  `,
                  opacity: 0.8 + frontness * 0.2,
                  transition: 'opacity 0.3s',
                }}
              />

              {/* OLED watermark */}
              {isOled && (
                <div className="absolute bottom-[6%] right-[5%] font-black tracking-tight text-white pointer-events-none"
                  style={{
                    fontSize: 'clamp(16px, 4vw, 32px)',
                    textShadow: '0 0 30px rgba(255,255,255,0.4), 0 2px 4px rgba(0,0,0,0.6)',
                    opacity: frontness * 0.95,
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                  }}>
                  OLED
                </div>
              )}
            </div>

            {/* ═══ BACK panel ═══ */}
            <div className="absolute inset-0 flex flex-col items-center justify-center"
              style={{
                transform: 'translateZ(-24px) rotateY(180deg)',
                background: `
                  radial-gradient(ellipse at center, #1c1c28 0%, #0a0a14 100%),
                  linear-gradient(135deg, #0f0f1a 0%, #1a1a28 50%, #0f0f1a 100%)
                `,
                borderRadius: '6px',
                boxShadow: 'inset 0 0 80px rgba(0,0,0,0.7), inset 0 0 0 2px #1a1a28',
              }}>
              {/* Diagonal panel pattern */}
              <div className="absolute inset-0 opacity-[0.08]"
                style={{
                  backgroundImage: `repeating-linear-gradient(45deg, transparent 0, transparent 8px,
                    rgba(255,255,255,0.04) 8px, rgba(255,255,255,0.04) 9px)`,
                }} />

              {/* Heat vents grid */}
              <div className="absolute top-[20%] left-1/2 -translate-x-1/2 grid grid-cols-12 gap-[3px]">
                {[...Array(48)].map((_, i) => (
                  <div key={i} className="w-1 h-0.5 bg-black/50 rounded-full" />
                ))}
              </div>

              {/* VESA mount */}
              <div className="relative mt-4">
                <div className="w-24 h-24 border-2 border-white/15 rounded-xl flex items-center justify-center
                  bg-black/30 shadow-inner">
                  <div className="grid grid-cols-2 gap-14">
                    {[0,1,2,3].map(i => (
                      <div key={i} className="w-2 h-2 rounded-full bg-white/30 shadow-sm" />
                    ))}
                  </div>
                </div>
                <div className="text-center mt-2">
                  <div className="text-white/40 text-[9px] font-mono tracking-wider">VESA 400×400</div>
                </div>
              </div>

              {/* HDMI ports */}
              <div className="absolute bottom-[12%] left-[12%] flex flex-col gap-1.5">
                {[0,1].map(i => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className="w-4 h-2 bg-black/80 rounded-sm border border-white/15 shadow-inner" />
                    <span className="text-white/30 text-[7px] font-mono">HDMI {i+1}</span>
                  </div>
                ))}
              </div>

              {/* USB/Power */}
              <div className="absolute bottom-[12%] right-[12%] flex flex-col gap-1.5 items-end">
                <div className="flex items-center gap-1.5">
                  <span className="text-white/30 text-[7px] font-mono">USB</span>
                  <div className="w-4 h-2 bg-black/80 rounded-sm border border-white/15" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-white/30 text-[7px] font-mono">PWR</span>
                  <div className="w-3 h-3 bg-black rounded-full border border-white/15" />
                </div>
              </div>

              {/* SAMSUNG logo */}
              <div className="absolute top-[10%] left-1/2 -translate-x-1/2 text-white/45 text-sm font-black tracking-[0.4em]">
                SAMSUNG
              </div>

              {/* Model */}
              <div className="absolute bottom-[5%] left-1/2 -translate-x-1/2 text-white/30 text-[9px] font-mono">
                {modelName} · Made in Mexico
              </div>
            </div>

            {/* ═══ RIGHT side ═══ */}
            <div className="absolute top-0 bottom-0 right-0"
              style={{
                width: '48px',
                transform: 'rotateY(90deg) translateZ(24px)',
                transformOrigin: 'right center',
                background: 'linear-gradient(90deg, #050508 0%, #1f1f2a 50%, #0a0a14 100%)',
                borderRadius: '0 6px 6px 0',
                boxShadow: 'inset 0 0 25px rgba(0,0,0,0.7), inset -2px 0 4px rgba(255,255,255,0.04)',
              }} />

            {/* ═══ LEFT side ═══ */}
            <div className="absolute top-0 bottom-0 left-0"
              style={{
                width: '48px',
                transform: 'rotateY(-90deg) translateZ(24px)',
                transformOrigin: 'left center',
                background: 'linear-gradient(-90deg, #050508 0%, #1f1f2a 50%, #0a0a14 100%)',
                borderRadius: '6px 0 0 6px',
                boxShadow: 'inset 0 0 25px rgba(0,0,0,0.7), inset 2px 0 4px rgba(255,255,255,0.04)',
              }} />

            {/* ═══ TOP ═══ */}
            <div className="absolute left-0 right-0 top-0"
              style={{
                height: '48px',
                transform: 'rotateX(90deg) translateZ(24px)',
                transformOrigin: 'top center',
                background: 'linear-gradient(180deg, #1f1f2a 0%, #0a0a14 100%)',
                borderRadius: '6px 6px 0 0',
                boxShadow: 'inset 0 0 25px rgba(0,0,0,0.7), inset 0 2px 4px rgba(255,255,255,0.04)',
              }} />

            {/* ═══ BOTTOM ═══ */}
            <div className="absolute left-0 right-0 bottom-0"
              style={{
                height: '48px',
                transform: 'rotateX(-90deg) translateZ(24px)',
                transformOrigin: 'bottom center',
                background: 'linear-gradient(0deg, #1f1f2a 0%, #050508 100%)',
                borderRadius: '0 0 6px 6px',
                boxShadow: 'inset 0 0 25px rgba(0,0,0,0.7)',
              }} />

            {/* ═══ Stand ═══ */}
            <div className="absolute left-1/2 -translate-x-1/2"
              style={{
                bottom: '-15%',
                width: '22%',
                height: '14%',
                transform: 'translateZ(0px)',
                background: 'linear-gradient(180deg, #2a2a38 0%, #15151c 50%, #050508 100%)',
                clipPath: 'polygon(18% 0%, 82% 0%, 95% 100%, 5% 100%)',
                boxShadow: '0 6px 12px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08)',
              }}>
              <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 rounded-full"
                style={{
                  background: '#00ff88',
                  boxShadow: '0 0 10px rgba(0,255,136,0.9), 0 0 20px rgba(0,255,136,0.5)',
                }}
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
          </motion.div>
        </div>

        {/* ═══════════ Hint (auto-dismiss) ═══════════ */}
        <AnimatePresence>
          {showHints && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-4 py-2
                rounded-full bg-black/50 backdrop-blur-xl border border-white/10 shadow-lg shadow-black/30"
            >
              <MousePointer2 className="w-3 h-3 text-blue-400" />
              <p className="text-[10px] text-white/80 font-medium">
                Arrastra para rotar · Doble click para auto · Botón VR para inmersivo
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default VRViewer
