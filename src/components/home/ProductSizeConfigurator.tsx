/* ═══════════════════════════════════════════════════════════
   Product Size Configurator — Extraordinary Upgrade #3
   Visual TV size comparison tool with room context
   ═══════════════════════════════════════════════════════════ */
import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Ruler, X, Sofa, Info, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TVSize {
  name: string
  inches: number
  width: number
  height: number
  price: string
  recommended: string
}

const TV_SIZES: TVSize[] = [
  { name: 'S85D OLED', inches: 55, width: 122.5, height: 70.8, price: '$22,999', recommended: 'Recamara, estudio' },
  { name: 'S95D OLED', inches: 65, width: 144.4, height: 83.0, price: '$47,999', recommended: 'Sala mediana' },
  { name: 'QN90D Neo QLED', inches: 75, width: 166.8, height: 95.7, price: '$54,999', recommended: 'Sala grande' },
  { name: 'QN90D Neo QLED', inches: 85, width: 189.3, height: 108.5, price: '$72,999', recommended: 'Home theater' },
]

const ROOM_TEMPLATES = [
  { name: 'Sala Pequena', width: 300, desc: '3m de ancho · Sofa 2 plazas' },
  { name: 'Sala Mediana', width: 400, desc: '4m de ancho · Sofa 3 plazas' },
  { name: 'Sala Grande', width: 500, desc: '5m de ancho · Seccionales' },
  { name: 'Home Theater', width: 600, desc: '6m+ · Butacas dedicadas' },
]

export function ProductSizeConfigurator() {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedSize, setSelectedSize] = useState(1) // 65" default
  const [selectedRoom, setSelectedRoom] = useState(1) // Sala Mediana
  const [viewingDistance, setViewingDistance] = useState(250) // cm
  const canvasRef = useRef<HTMLCanvasElement>(null)

  /* Draw room visualization */
  const drawScene = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height
    const tv = TV_SIZES[selectedSize]
    const room = ROOM_TEMPLATES[selectedRoom]

    /* Clear */
    ctx.clearRect(0, 0, w, h)

    /* Background - room wall */
    const grad = ctx.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, '#1a1a2e')
    grad.addColorStop(1, '#14141f')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)

    /* Floor */
    ctx.fillStyle = '#252535'
    ctx.fillRect(0, h * 0.75, w, h * 0.25)

    /* Floor perspective lines */
    ctx.strokeStyle = '#333344'
    ctx.lineWidth = 1
    for (let i = 0; i < 5; i++) {
      const px = (w / 4) * i
      ctx.beginPath()
      ctx.moveTo(px, h * 0.75)
      ctx.lineTo(px + (px - w / 2) * 0.3, h)
      ctx.stroke()
    }

    /* Scale factor: fit room width into canvas */
    const padding = 60
    const scale = (w - padding * 2) / room.width

    /* TV dimensions in pixels */
    const tvW = tv.width * scale
    const tvH = tv.height * scale
    const tvX = (w - tvW) / 2
    const tvY = h * 0.38

    /* TV stand / console */
    const consoleW = tvW * 1.4
    const consoleH = 12
    const consoleX = (w - consoleW) / 2
    const consoleY = tvY + tvH + 4

    ctx.fillStyle = '#2a2a3e'
    roundRectPath(ctx, consoleX, consoleY, consoleW, consoleH, 3)
    ctx.fill()

    /* TV shadow */
    ctx.shadowColor = 'rgba(0,0,0,0.3)'
    ctx.shadowBlur = 30
    ctx.shadowOffsetY = 10

    /* TV bezel */
    const bezel = 4
    ctx.fillStyle = '#0a0a0f'
    roundRectPath(ctx, tvX - bezel, tvY - bezel, tvW + bezel * 2, tvH + bezel * 2, 6)
    ctx.fill()

    /* Reset shadow */
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetY = 0

    /* TV screen gradient */
    const screenGrad = ctx.createLinearGradient(tvX, tvY, tvX + tvW, tvY + tvH)
    screenGrad.addColorStop(0, '#1a1a3e')
    screenGrad.addColorStop(0.5, '#0f0f2e')
    screenGrad.addColorStop(1, '#1a1a3e')
    ctx.fillStyle = screenGrad
    roundRectPath(ctx, tvX, tvY, tvW, tvH, 4)
    ctx.fill()

    /* Screen glow effect */
    const glowGrad = ctx.createRadialGradient(tvX + tvW / 2, tvY + tvH / 2, 0, tvX + tvW / 2, tvY + tvH / 2, tvW * 0.6)
    glowGrad.addColorStop(0, 'rgba(20, 40, 160, 0.15)')
    glowGrad.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = glowGrad
    ctx.fillRect(tvX - 20, tvY - 20, tvW + 40, tvH + 40)

    /* Screen content - abstract image */
    const imgGrad = ctx.createLinearGradient(tvX, tvY, tvX + tvW, tvY + tvH)
    imgGrad.addColorStop(0, '#1428A0')
    imgGrad.addColorStop(0.3, '#0077C8')
    imgGrad.addColorStop(0.6, '#00BFFF')
    imgGrad.addColorStop(1, '#1428A0')
    ctx.fillStyle = imgGrad
    ctx.save()
    roundRectPath(ctx, tvX + 2, tvY + 2, tvW - 4, tvH - 4, 2)
    ctx.clip()
    ctx.fillRect(tvX, tvY, tvW, tvH)

    /* Abstract landscape on screen */
    ctx.fillStyle = 'rgba(255,255,255,0.05)'
    ctx.beginPath()
    ctx.moveTo(tvX, tvY + tvH * 0.6)
    ctx.lineTo(tvX + tvW * 0.3, tvY + tvH * 0.45)
    ctx.lineTo(tvX + tvW * 0.6, tvY + tvH * 0.55)
    ctx.lineTo(tvX + tvW, tvY + tvH * 0.4)
    ctx.lineTo(tvX + tvW, tvY + tvH)
    ctx.lineTo(tvX, tvY + tvH)
    ctx.closePath()
    ctx.fill()
    ctx.restore()

    /* Screen reflection */
    const reflGrad = ctx.createLinearGradient(tvX, tvY, tvX + tvW, tvY)
    reflGrad.addColorStop(0, 'rgba(255,255,255,0.06)')
    reflGrad.addColorStop(0.15, 'rgba(255,255,255,0.02)')
    reflGrad.addColorStop(0.5, 'rgba(255,255,255,0)')
    reflGrad.addColorStop(0.85, 'rgba(255,255,255,0.02)')
    reflGrad.addColorStop(1, 'rgba(255,255,255,0.06)')
    ctx.fillStyle = reflGrad
    ctx.fillRect(tvX, tvY, tvW, tvH)

    /* Samsung logo on TV */
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.font = `bold ${Math.max(8, tvW * 0.04)}px sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText('SAMSUNG', tvX + tvW / 2, tvY + tvH + 14)

    /* Dimension lines */
    const dimColor = '#1428A0'
    ctx.strokeStyle = dimColor
    ctx.lineWidth = 1
    ctx.setLineDash([4, 3])

    /* Width dimension */
    const dimY = tvY - 25
    ctx.beginPath()
    ctx.moveTo(tvX, dimY)
    ctx.lineTo(tvX + tvW, dimY)
    ctx.stroke()
    ctx.setLineDash([])

    /* Width arrows */
    ctx.beginPath()
    ctx.moveTo(tvX, dimY - 3)
    ctx.lineTo(tvX, dimY + 3)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(tvX + tvW, dimY - 3)
    ctx.lineTo(tvX + tvW, dimY + 3)
    ctx.stroke()

    /* Width label */
    ctx.fillStyle = dimColor
    ctx.font = 'bold 10px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`${tv.width} cm`, tvX + tvW / 2, dimY - 6)

    /* Height dimension */
    const dimX = tvX + tvW + 25
    ctx.setLineDash([4, 3])
    ctx.beginPath()
    ctx.moveTo(dimX, tvY)
    ctx.lineTo(dimX, tvY + tvH)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.beginPath()
    ctx.moveTo(dimX - 3, tvY)
    ctx.lineTo(dimX + 3, tvY)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(dimX - 3, tvY + tvH)
    ctx.lineTo(dimX + 3, tvY + tvH)
    ctx.stroke()

    /* Height label */
    ctx.save()
    ctx.translate(dimX + 12, tvY + tvH / 2)
    ctx.rotate(Math.PI / 2)
    ctx.fillText(`${tv.height} cm`, 0, 0)
    ctx.restore()

    /* Diagonal size badge */
    ctx.fillStyle = '#1428A0'
    roundRectPath(ctx, tvX + tvW - 50, tvY + 8, 44, 18, 9)
    ctx.fill()
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 9px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`${tv.inches}"`, tvX + tvW - 28, tvY + 20)

    /* Viewing distance indicator */
    const sofaY = h * 0.82
    ctx.fillStyle = '#3a3a4e'
    roundRectPath(ctx, w * 0.25, sofaY, w * 0.5, h * 0.1, 8)
    ctx.fill()

    /* Sofa detail */
    ctx.fillStyle = '#4a4a5e'
    roundRectPath(ctx, w * 0.28, sofaY - 5, w * 0.44, 8, 4)
    ctx.fill()

    /* Distance label */
    const distM = (viewingDistance / 100).toFixed(1)
    ctx.fillStyle = '#8888a0'
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`Distancia: ${distM}m`, w / 2, sofaY + 35)

    /* Size comparison pills at bottom */
    const allSizes = TV_SIZES.map((t) => ({
      scaledW: t.width * scale,
      index: TV_SIZES.indexOf(t),
    }))

    const startX = (w - allSizes.reduce((s, t) => s + t.scaledW + 20, 0)) / 2
    let cx = startX
    const compY = h - 35

    allSizes.forEach((t, i) => {
      const isSelected = i === selectedSize
      ctx.globalAlpha = isSelected ? 1 : 0.25
      ctx.fillStyle = isSelected ? '#1428A0' : '#888'
      roundRectPath(ctx, cx, compY, t.scaledW, t.scaledW * 0.563, 2)
      ctx.fill()

      if (isSelected) {
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 8px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(`${TV_SIZES[i].inches}"`, cx + t.scaledW / 2, compY - 4)
      }
      cx += t.scaledW + 20
    })
    ctx.globalAlpha = 1

  }, [selectedSize, selectedRoom, viewingDistance])

  /* Helper for cross-browser rounded rectangles */
  function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    if ((ctx as any).roundRect) {
      (ctx as any).roundRect(x, y, w, h, r)
    } else {
      ctx.beginPath()
      ctx.moveTo(x + r, y)
      ctx.lineTo(x + w - r, y)
      ctx.quadraticCurveTo(x + w, y, x + w, y + r)
      ctx.lineTo(x + w, y + h - r)
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
      ctx.lineTo(x + r, y + h)
      ctx.quadraticCurveTo(x, y + h, x, y + h - r)
      ctx.lineTo(x, y + r)
      ctx.quadraticCurveTo(x, y, x + r, y)
      ctx.closePath()
    }
  }

  /* Redraw on changes */
  useEffect(() => {
    if (!isOpen) return
    const canvas = canvasRef.current
    if (!canvas) return

    const handleResize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      canvas.width = parent.clientWidth
      canvas.height = parent.clientHeight
      drawScene()
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isOpen, drawScene])

  /* Viewing distance recommendation */
  const tv = TV_SIZES[selectedSize]
  const optimalMin = Math.round(tv.inches * 2.54 * 1.5)
  const optimalMax = Math.round(tv.inches * 2.54 * 2.5)
  const isOptimal = viewingDistance >= optimalMin && viewingDistance <= optimalMax

  return (
    <>
      {/* Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[11px] font-bold transition-all shadow-lg bg-gradient-to-r from-[#0077C8] to-[#00BFFF] text-white hover:shadow-cyan-500/30"
      >
        <Ruler className="w-3.5 h-3.5" />
        Comparador de Tamanos
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="w-full max-w-4xl bg-[#14141f] rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1428A0] to-[#0077C8] flex items-center justify-center">
                    <Ruler className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white">Visualizador de Tamanos</h3>
                    <p className="text-[11px] text-gray-500">Compara tamanos de TV en contexto de sala</p>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)}
                  className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Controls */}
              <div className="px-6 py-4 border-b border-gray-800 space-y-4">
                {/* TV Size selector */}
                <div>
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Tamano del TV</p>
                  <div className="flex gap-2 flex-wrap">
                    {TV_SIZES.map((tvItem, i) => (
                      <button
                        key={tvItem.inches}
                        onClick={() => { setSelectedSize(i); setViewingDistance(Math.round(tvItem.inches * 2.54 * 2)) }}
                        className={`px-4 py-2 rounded-xl text-[11px] font-bold transition-all ${
                          selectedSize === i
                            ? 'bg-[#1428A0] text-white shadow-md'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                      >
                        {tvItem.inches}" · {tvItem.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Room selector */}
                <div>
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Tamano de Sala</p>
                  <div className="flex gap-2 flex-wrap">
                    {ROOM_TEMPLATES.map((room, i) => (
                      <button
                        key={room.name}
                        onClick={() => setSelectedRoom(i)}
                        className={`px-4 py-2 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                          selectedRoom === i
                            ? 'bg-[#1428A0]/10 text-[#1428A0] border border-[#1428A0]/20'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                      >
                        <Sofa className="w-3 h-3" />
                        {room.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Viewing distance slider */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Distancia al sofa</p>
                    <span className="text-[11px] font-bold text-[#1428A0]">{(viewingDistance / 100).toFixed(1)}m</span>
                  </div>
                  <input
                    type="range"
                    min={150}
                    max={500}
                    step={10}
                    value={viewingDistance}
                    onChange={(e) => setViewingDistance(Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-full appearance-none cursor-pointer accent-[#1428A0]"
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-[9px] text-gray-500">1.5m</span>
                    <span className="text-[9px] text-gray-500">5.0m</span>
                  </div>
                </div>
              </div>

              {/* Canvas Visualization */}
              <div className="flex-1 min-h-[300px] relative bg-[#0a0a0f]">
                <canvas
                  ref={canvasRef}
                  className="w-full h-full"
                  style={{ display: 'block' }}
                />
              </div>

              {/* Info Footer */}
              <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-[#1428A0]" />
                    <span className="text-[11px] font-medium text-gray-300">{tv.width} x {tv.height} cm</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Maximize2 className="w-3.5 h-3.5 text-[#1428A0]" />
                    <span className="text-[11px] font-medium text-gray-300">{tv.inches}" diagonal</span>
                  </div>
                  <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${isOptimal ? 'bg-emerald-900/30 text-emerald-400' : 'bg-yellow-900/30 text-yellow-400'}`}>
                    <span className="text-[10px] font-bold">{isOptimal ? 'Distancia ideal' : 'Ajusta distancia'}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-[#1428A0]">{tv.price}</p>
                  <p className="text-[9px] text-gray-500">MXN · Envio incluido</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
