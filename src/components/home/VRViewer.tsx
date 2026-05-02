import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { RotateCcw, Eye, ZoomIn, Maximize2, Rotate3D } from 'lucide-react'

/* ═══════════════════════════════════════════════════════════════
   Samsung S95D OLED — Photorealistic 3D Viewer v2
   Seamless lifelike render with FloatLayer, One Connect Box,
   metallic bezel, ambient glow, and realistic screen content.
   ═══════════════════════════════════════════════════════════════ */

export function VRViewer({ product }: { product: any }) {
  const [rotation, setRotation] = useState(0)
  const [tiltX, setTiltX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [startY, setStartY] = useState(0)
  const [autoRotate, setAutoRotate] = useState(true)
  const [zoom, setZoom] = useState(false)
  const [immersive, setImmersive] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  /* Smooth auto-rotate */
  useEffect(() => {
    if (!autoRotate || isDragging) return
    let raf: number
    let last = performance.now()
    const tick = (now: number) => {
      const dt = now - last
      last = now
      setRotation(prev => (prev + dt * 0.05) % 360)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [autoRotate, isDragging])

  /* Tilt recovery */
  useEffect(() => {
    if (isDragging) return
    const timer = setTimeout(() => setTiltX(0), 400)
    return () => clearTimeout(timer)
  }, [isDragging])

  const handleStart = useCallback((clientX: number, clientY: number) => {
    setIsDragging(true)
    setAutoRotate(false)
    setStartX(clientX)
    setStartY(clientY)
  }, [])

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging) return
    const dx = clientX - startX
    const dy = clientY - startY
    setRotation(prev => prev + dx * 0.5)
    setTiltX(prev => Math.max(-25, Math.min(25, prev + dy * 0.3)))
    setStartX(clientX)
    setStartY(clientY)
  }, [isDragging, startX, startY])

  const handleEnd = useCallback(() => setIsDragging(false), [])

  const imageUrl = product?.imageUrl || '/tv-s95d-real.jpg'
  const modelName = product?.model || 'QN65S95D'
  const productName = product?.name || 'Samsung S95D OLED 65"'

  /* Samsung S95D proportions */
  const tvW = immersive ? 520 : zoom ? 400 : 320
  const tvH = Math.round(tvW * 0.5625)
  const bezelW = 2.5
  const bezelH = 3.0
  const depth = 12
  const rotY = rotation % 360

  /* Metallic bezel palette — Samsung titanium silver */
  const bShine = '#f5f5fa'
  const bLight = '#e8e8f0'
  const bMid   = '#c8c8d4'
  const bDark  = '#9898a8'
  const bDeep  = '#686878'

  /* Screen glow colors */
  const screenGlow = 'rgba(20, 40, 160, 0.35)'
  const ambientGlow = 'rgba(0, 191, 255, 0.08)'

  /* 3D cube face styles */
  const faceCommon: React.CSSProperties = {
    position: 'absolute',
    backfaceVisibility: 'hidden' as const,
    willChange: 'transform',
  }

  return (
    <div className={`relative w-full mx-auto select-none ${
      immersive ? 'fixed inset-0 z-[70] bg-[#05050a] flex items-center justify-center p-4' : 'max-w-[840px]'
    }`}>

      {immersive && (
        <button onClick={() => setImmersive(false)}
          className="absolute top-5 right-5 z-50 bg-black/60 backdrop-blur-xl px-4 py-2.5 rounded-full text-xs text-white font-bold flex items-center gap-2 hover:bg-black/80 transition-all border border-white/10">
          <Maximize2 className="w-3.5 h-3.5" /> Cerrar VR
        </button>
      )}

      {/* Main viewport */}
      <div
        ref={containerRef}
        className={`relative rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing touch-none ${immersive ? 'w-full max-w-5xl' : ''}`}
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 50% 80%, rgba(20,40,160,0.15) 0%, transparent 70%),
            radial-gradient(ellipse 50% 40% at 30% 30%, rgba(0,191,255,0.06) 0%, transparent 60%),
            linear-gradient(180deg, #0d0d18 0%, #0a0a14 40%, #06060c 100%)
          `,
          aspectRatio: immersive ? '16/9' : '16/10',
          boxShadow: immersive ? 'none' : 'inset 0 0 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)'
        }}
        onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
        onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={handleEnd}
        onDoubleClick={() => setAutoRotate(!autoRotate)}
      >
        {/* === AMBIENT ENVIRONMENT === */}

        {/* Floor plane */}
        <div style={{
          position: 'absolute',
          bottom: '-15%',
          left: '5%',
          right: '5%',
          height: '50%',
          background: 'linear-gradient(to top, rgba(20,40,160,0.08), transparent)',
          transform: 'perspective(800px) rotateX(75deg)',
          transformOrigin: 'center bottom',
          pointerEvents: 'none',
        }} />

        {/* Floor reflection of TV */}
        <div style={{
          position: 'absolute',
          top: '58%',
          left: '50%',
          width: tvW * 0.9,
          height: tvH * 0.25,
          transform: `translateX(-50%) perspective(600px) rotateX(75deg) scaleY(-0.35)`,
          background: 'linear-gradient(to bottom, rgba(20,40,160,0.15), transparent)',
          filter: 'blur(12px)',
          opacity: 0.6,
          borderRadius: 8,
          pointerEvents: 'none',
        }} />

        {/* Ambient floating particles */}
        {Array.from({ length: 14 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 1 + (i % 4) * 0.5,
              height: 1 + (i % 4) * 0.5,
              top: `${8 + (i * 7) % 55}%`,
              left: `${5 + (i * 11) % 90}%`,
              background: i % 3 === 0 ? '#1428A0' : i % 3 === 1 ? '#00BFFF' : '#ffffff',
              boxShadow: `0 0 ${4 + i % 6}px ${i % 3 === 0 ? '#1428A0' : '#00BFFF'}`,
            }}
            animate={{
              opacity: [0.05, 0.6, 0.05],
              y: [0, -15, 0],
              scale: [1, 1.8, 1],
            }}
            transition={{
              duration: 3 + (i % 4) * 0.8,
              repeat: Infinity,
              delay: i * 0.35,
              ease: 'easeInOut',
            }}
          />
        ))}

        {/* Subtle light cone from above */}
        <div style={{
          position: 'absolute',
          top: '-20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '60%',
          height: '70%',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.03) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* ═══ 3D TV MODEL — Samsung S95D FloatLayer ═══ */}
        <div className="absolute top-1/2 left-1/2"
          style={{
            transform: `translate(-50%, -58%) perspective(2000px) rotateY(${rotY}deg) rotateX(${tiltX}deg) ${zoom || immersive ? 'scale(1.08)' : 'scale(1)'}`,
            transformStyle: 'preserve-3d',
            transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}>

          <div className="relative" style={{ width: tvW, height: tvH }}>

            {/* ── Wall mount shadow (FloatLayer illusion) ── */}
            <div style={{
              ...faceCommon,
              width: tvW - 35,
              height: tvH - 28,
              left: 17,
              top: 14,
              transform: 'translateZ(-30px)',
              background: 'rgba(0,0,0,0.6)',
              borderRadius: 6,
              filter: 'blur(22px)',
            }} />

            {/* ── Ambient glow behind TV ── */}
            <div style={{
              ...faceCommon,
              width: tvW + 40,
              height: tvH + 40,
              left: -20,
              top: -20,
              transform: 'translateZ(-40px)',
              background: `radial-gradient(ellipse at center, ${screenGlow} 0%, transparent 70%)`,
              borderRadius: 20,
              filter: 'blur(30px)',
              opacity: 0.7,
            }} />

            {/* ── Wall mount arm (metallic) ── */}
            <div style={{
              ...faceCommon,
              left: '50%',
              top: '28%',
              width: 5,
              height: '44%',
              transform: 'translateX(-50%) translateZ(-10px)',
              background: 'linear-gradient(to bottom, #3a3a4e 0%, #1a1a2e 50%, #3a3a4e 100%)',
              borderRadius: 3,
              boxShadow: '0 0 8px rgba(0,0,0,0.4)',
            }} />

            {/* ═══════════════════════════════════════
               FRONT FACE — Screen with realistic content
               ═══════════════════════════════════════ */}
            <div style={{
              ...faceCommon,
              inset: 0,
              transform: `translateZ(${depth / 2}px)`,
              borderRadius: 3,
              border: `${bezelW}px solid ${bMid}`,
              boxShadow: `
                inset 0 0 30px rgba(0,0,0,0.4),
                0 0 0 0.5px rgba(255,255,255,0.08),
                0 2px 20px rgba(0,0,0,0.3)
              `,
              overflow: 'hidden',
              background: '#000',
            }}>
              {/* Main screen image */}
              <img
                src={imageUrl}
                alt={productName}
                className="w-full h-full object-cover"
                draggable={false}
                style={{ filter: 'contrast(1.08) saturate(1.05)' }}
              />

              {/* Screen ON glow — OLED emissive look */}
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(20,40,160,0.12) 0%, transparent 60%)',
                mixBlendMode: 'screen',
              }} />

              {/* Diagonal reflection (studio light) */}
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, transparent 30%, transparent 60%, rgba(255,255,255,0.03) 100%)',
              }} />

              {/* Edge-to-edge micro-vignette */}
              <div style={{
                position: 'absolute',
                inset: 0,
                boxShadow: 'inset 0 0 18px rgba(0,0,0,0.5)',
              }} />

              {/* Inner bezel rim light */}
              <div style={{
                position: 'absolute',
                inset: 0,
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 1,
              }} />
            </div>

            {/* ═══════════════════════════════════════
               RIGHT SIDE — Bezel + edge thickness
               ═══════════════════════════════════════ */}
            <div style={{
              ...faceCommon,
              top: 0,
              right: -bezelW,
              width: depth,
              height: tvH,
              borderRadius: '0 2px 2px 0',
              transform: 'rotateY(90deg)',
              transformOrigin: 'left center',
              background: `linear-gradient(to right, ${bDeep}, ${bDark}, ${bMid}, ${bDark})`,
              boxShadow: 'inset 0 0 8px rgba(0,0,0,0.2)',
            }}>
              {/* Metallic highlight stripe */}
              <div style={{
                position: 'absolute',
                top: '15%',
                left: 0,
                width: '100%',
                height: '25%',
                background: `linear-gradient(to bottom, transparent, ${bLight}40, transparent)`,
              }} />
            </div>

            {/* ═══════════════════════════════════════
               LEFT SIDE — Bezel + edge thickness
               ═══════════════════════════════════════ */}
            <div style={{
              ...faceCommon,
              top: 0,
              left: bezelW - depth,
              width: depth,
              height: tvH,
              borderRadius: '2px 0 0 2px',
              transform: 'rotateY(-90deg)',
              transformOrigin: 'right center',
              background: `linear-gradient(to left, ${bDeep}, ${bDark}, ${bMid}, ${bDark})`,
              boxShadow: 'inset 0 0 8px rgba(0,0,0,0.2)',
            }}>
              <div style={{
                position: 'absolute',
                top: '20%',
                left: 0,
                width: '100%',
                height: '20%',
                background: `linear-gradient(to bottom, transparent, ${bLight}30, transparent)`,
              }} />
            </div>

            {/* ═══════════════════════════════════════
               TOP EDGE — Metallic shine
               ═══════════════════════════════════════ */}
            <div style={{
              ...faceCommon,
              top: bezelH - depth,
              left: 0,
              width: tvW,
              height: depth,
              borderRadius: '2px 2px 0 0',
              transform: 'rotateX(90deg)',
              transformOrigin: 'bottom center',
              background: `linear-gradient(to bottom, ${bShine}, ${bLight}, ${bMid}, ${bDark})`,
              boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.15)',
            }} />

            {/* ═══════════════════════════════════════
               BOTTOM EDGE — Darker, has ports area
               ═══════════════════════════════════════ */}
            <div style={{
              ...faceCommon,
              bottom: bezelH - depth,
              left: 0,
              width: tvW,
              height: depth,
              borderRadius: '0 0 2px 2px',
              transform: 'rotateX(-90deg)',
              transformOrigin: 'top center',
              background: `linear-gradient(to bottom, ${bDark}, ${bMid}, ${bLight})`,
            }}>
              {/* Bottom ports indicator */}
              <div style={{
                position: 'absolute',
                bottom: 2,
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: 4,
                alignItems: 'flex-end',
              }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 12,
                    height: 4,
                    borderRadius: 1,
                    background: '#1e1e32',
                    border: '0.5px solid #3e3e52',
                  }} />
                ))}
              </div>
            </div>

            {/* ═══════════════════════════════════════
               BACK PANEL — Full realistic back
               ═══════════════════════════════════════ */}
            <div style={{
              ...faceCommon,
              inset: 0,
              borderRadius: 3,
              transform: `translateZ(-${depth / 2}px)`,
              background: 'linear-gradient(170deg, #222236 0%, #161628 30%, #1a1a2e 60%, #131325 100%)',
              border: '1px solid #2e2e42',
              boxShadow: 'inset 0 0 20px rgba(0,0,0,0.4)',
            }}>
              {/* Brushed metal texture overlay */}
              <div style={{
                position: 'absolute',
                inset: 0,
                opacity: 0.03,
                background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 3px)',
                borderRadius: 3,
              }} />

              {/* VESA mount plate */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 60,
                height: 42,
                border: '1.5px solid #3e3e52',
                borderRadius: 4,
                background: 'rgba(25,25,40,0.9)',
                boxShadow: 'inset 0 0 6px rgba(0,0,0,0.3), 0 1px 2px rgba(255,255,255,0.03)',
              }}>
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  fontSize: 5,
                  color: '#505068',
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                  letterSpacing: '0.05em',
                }}>VESA 400x400</div>
                {/* 4 mount holes */}
                {[[3,3], [53,3], [3,33], [53,33]].map(([x, y], i) => (
                  <div key={i} style={{
                    position: 'absolute',
                    top: y,
                    left: x,
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#2a2a3e',
                    border: '0.5px solid #4a4a5e',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.4)',
                  }} />
                ))}
              </div>

              {/* One Connect Box port (miniature) */}
              <div style={{
                position: 'absolute',
                bottom: 10,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 30,
                height: 14,
                borderRadius: 3,
                background: '#1e1e32',
                border: '1px solid #3e3e52',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
              }}>
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#00BFFF', boxShadow: '0 0 3px #00BFFF' }} />
                <span style={{ fontSize: 4, color: '#505068', fontFamily: 'monospace' }}>ONE CONNECT</span>
              </div>

              {/* Ports row (HDMI, USB, etc) */}
              <div style={{
                position: 'absolute',
                bottom: 32,
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: 3,
              }}>
                {[0, 1, 2, 3].map(i => (
                  <div key={i} style={{
                    width: 16,
                    height: 6,
                    borderRadius: 1.5,
                    background: '#2a2a3e',
                    border: '0.5px solid #3e3e52',
                    boxShadow: 'inset 0 0 3px rgba(0,0,0,0.3)',
                  }}>
                    <div style={{
                      width: '100%',
                      height: 1,
                      background: '#4a4a5e',
                      marginTop: 2,
                      opacity: 0.5,
                    }} />
                  </div>
                ))}
              </div>

              {/* Samsung logo embossed */}
              <div style={{
                position: 'absolute',
                bottom: 54,
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: 6,
                fontWeight: 'bold',
                letterSpacing: '0.35em',
                color: '#3a3a4e',
                fontFamily: 'sans-serif',
                textShadow: '0 1px 0 rgba(255,255,255,0.03)',
              }}>SAMSUNG</div>

              {/* Power input jack */}
              <div style={{
                position: 'absolute',
                bottom: 14,
                right: 24,
                width: 12,
                height: 12,
                borderRadius: '50%',
                border: '1px solid #3e3e52',
                background: '#2a2a3e',
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)',
              }} />

              {/* Ventilation grilles */}
              <div style={{
                position: 'absolute',
                top: '20%',
                right: 18,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} style={{
                    width: 20,
                    height: 1.5,
                    borderRadius: 1,
                    background: '#2e2e42',
                  }} />
                ))}
              </div>
            </div>

            {/* ── FRONT SAMSUNG LOGO ── */}
            <div style={{
              ...faceCommon,
              left: '50%',
              bottom: -bezelH - 8,
              transform: 'translateX(-50%) translateZ(2px)',
            }}>
              <span style={{
                fontSize: 8,
                fontWeight: 'bold',
                letterSpacing: '0.3em',
                color: '#9090a0',
                fontFamily: 'sans-serif',
                textShadow: '0 1px 2px rgba(0,0,0,0.3)',
              }}>SAMSUNG</span>
            </div>

            {/* ── FRONT POWER LED ── */}
            <div style={{
              ...faceCommon,
              bottom: -bezelH - 3,
              right: 24,
              width: 3,
              height: 3,
              borderRadius: '50%',
              background: '#00BFFF',
              boxShadow: '0 0 5px #00BFFF, 0 0 12px rgba(0,191,255,0.4), 0 0 20px rgba(0,191,255,0.2)',
              transform: 'translateZ(2px)',
            }} />

            {/* ── FRONT IR SENSOR ── */}
            <div style={{
              ...faceCommon,
              bottom: -bezelH - 3,
              left: 24,
              width: 2.5,
              height: 2.5,
              borderRadius: '50%',
              background: '#1a1a2e',
              border: '0.5px solid #3a3a4e',
              transform: 'translateZ(2px)',
            }} />

            {/* ── Ambient edge glow (OLED signature) ── */}
            <div style={{
              ...faceCommon,
              inset: -2,
              borderRadius: 5,
              transform: `translateZ(${depth / 2 - 1}px)`,
              background: 'transparent',
              boxShadow: `
                0 0 ${20 + Math.sin(rotation * Math.PI / 180) * 10}px ${ambientGlow},
                0 0 ${40 + Math.cos(rotation * Math.PI / 180) * 15}px rgba(20,40,160,0.06),
                inset 0 0 20px rgba(0,191,255,0.03)
              `,
              pointerEvents: 'none',
            }} />

            {/* ── Stand / Base (when not wall mounted) ── */}
            <div style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%) translateZ(-8px)',
              width: tvW * 0.5,
              height: 6,
              background: 'linear-gradient(to bottom, #3a3a4e, #2a2a3e)',
              borderRadius: '0 0 4px 4px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 20,
                height: 14,
                background: 'linear-gradient(to bottom, #2a2a3e, #1a1a2e)',
                borderRadius: '0 0 2px 2px',
                marginTop: -14,
              }} />
            </div>
          </div>
        </div>

        {/* ═══ HUD OVERLAYS ═══ */}

        {/* Top-left badge */}
        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-xl px-3.5 py-2 rounded-full flex items-center gap-2 border border-white/[0.06]">
          <Eye className="w-3 h-3 text-[#00BFFF]" />
          <span className="text-[10px] text-white font-bold tracking-wider">360° INTERACTIVO</span>
          <span className="text-[9px] text-gray-500">· {modelName}</span>
        </div>

        {/* Top-right controls */}
        <div className="absolute top-4 right-4 flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => { e.stopPropagation(); setAutoRotate(!autoRotate) }}
            className="bg-black/50 backdrop-blur-xl px-3 py-2 rounded-full flex items-center gap-2 hover:bg-white/10 transition-all border border-white/[0.06]">
            <RotateCcw className={`w-3 h-3 text-white ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
            <span className="text-[10px] text-white font-medium">{autoRotate ? 'Auto' : 'Manual'}</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => { e.stopPropagation(); setZoom(!zoom) }}
            className="bg-black/50 backdrop-blur-xl px-3 py-2 rounded-full flex items-center gap-2 hover:bg-white/10 transition-all border border-white/[0.06]">
            <ZoomIn className="w-3 h-3 text-white" />
            <span className="text-[10px] text-white font-medium">{zoom ? '100%' : '130%'}</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => { e.stopPropagation(); setImmersive(!immersive) }}
            className="bg-[#1428A0]/40 backdrop-blur-xl px-3 py-2 rounded-full flex items-center gap-2 hover:bg-[#1428A0]/60 transition-all border border-[#1428A0]/20">
            <Maximize2 className="w-3 h-3 text-white" />
            <span className="text-[10px] text-white font-medium">VR</span>
          </motion.button>
        </div>

        {/* Bottom instruction bar */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-xl px-6 py-2.5 rounded-full border border-white/[0.06] max-w-[90%]">
          <p className="text-[11px] text-white/70 text-center whitespace-nowrap">
            {isDragging
              ? 'Suelta para detener · Arrastra horizontal para 360° · Vertical para inclinar'
              : 'Arrastra para rotar 360° · Doble click para auto-rotar · Boton VR para inmersivo'
            }
          </p>
        </div>

        {/* Rotation degree indicator */}
        <div className="absolute bottom-5 right-5 bg-black/50 backdrop-blur-xl px-3 py-2 rounded-full border border-white/[0.06]">
          <p className="text-[10px] text-white/50 font-mono tabular-nums">{Math.round(rotY)}°</p>
        </div>

        {/* Product name overlay (immersive mode only) */}
        {immersive && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-16 left-1/2 -translate-x-1/2 text-center"
          >
            <p className="text-xs text-white/40 tracking-widest uppercase mb-1">Samsung Store MX</p>
            <p className="text-sm font-bold text-white/80">{productName}</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
