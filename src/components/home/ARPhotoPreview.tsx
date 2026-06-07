/* ═══════════════════════════════════════════════════════════
   AR Photo Preview — Extraordinary Upgrade #1
   Take a photo of your wall/space and see how the TV looks
   Uses getUserMedia API + Canvas overlay rendering
   ═══════════════════════════════════════════════════════════ */
import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, X, RotateCcw, ZoomIn, ZoomOut, Download, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ARPhotoPreviewProps {
  productImage?: string
  productName?: string
  darkMode?: boolean
}

const TV_SIZES = [
  { label: '55"', scale: 0.6, diagonal: 55 },
  { label: '65"', scale: 0.75, diagonal: 65 },
  { label: '75"', scale: 0.9, diagonal: 75 },
  { label: '85"', scale: 1.05, diagonal: 85 },
]

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

export function ARPhotoPreview({ productImage = '/tv-s95d-real.jpg', productName = 'Samsung TV', darkMode = false }: ARPhotoPreviewProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [tvSize, setTvSize] = useState(TV_SIZES[1])
  const [tvPosition, setTvPosition] = useState({ x: 50, y: 50 })
  const [tvScale, setTvScale] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  /* Start camera stream */
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setHasPermission(true)
    } catch (err) {
      console.error('Camera error:', err)
      setHasPermission(false)
    }
  }, [facingMode])

  /* Stop camera */
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }, [])

  /* Open AR modal */
  const openAR = useCallback(async () => {
    setIsOpen(true)
    setCapturedImage(null)
    setTvPosition({ x: 50, y: 50 })
    setTvScale(1)
    await startCamera()
  }, [startCamera])

  /* Close and cleanup */
  const closeAR = useCallback(() => {
    stopCamera()
    setIsOpen(false)
    setCapturedImage(null)
  }, [stopCamera])

  /* Capture photo */
  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return
    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 720
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95)
    setCapturedImage(dataUrl)
    stopCamera()
  }, [stopCamera])

  /* Retake photo */
  const retakePhoto = useCallback(async () => {
    setCapturedImage(null)
    await startCamera()
  }, [startCamera])

  /* Switch camera */
  const switchCamera = useCallback(async () => {
    stopCamera()
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')
    await new Promise(r => setTimeout(r, 300))
    await startCamera()
  }, [stopCamera, startCamera])

  /* Draw TV overlay on canvas */
  useEffect(() => {
    if (!capturedImage || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      // Draw TV overlay
      const baseW = img.width * 0.4 * tvSize.scale * tvScale
      const baseH = baseW * 0.563
      const centerX = (tvPosition.x / 100) * img.width
      const centerY = (tvPosition.y / 100) * img.height
      const x = centerX - baseW / 2
      const y = centerY - baseH / 2

      // TV shadow
      ctx.shadowColor = 'rgba(0,0,0,0.5)'
      ctx.shadowBlur = 40
      ctx.shadowOffsetY = 20

      // TV bezel
      const bezel = baseW * 0.012
      ctx.fillStyle = '#1a1a2e'
      roundRectPath(ctx, x - bezel, y - bezel, baseW + bezel * 2, baseH + bezel * 2, 6)
      ctx.fill()

      // Reset shadow
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetY = 0

      // TV screen
      const tvImg = new Image()
      tvImg.onload = () => {
        ctx.save()
        roundRectPath(ctx, x, y, baseW, baseH, 4)
        ctx.clip()
        ctx.drawImage(tvImg, x, y, baseW, baseH)

        // Screen reflection
        const grad = ctx.createLinearGradient(x, y, x + baseW, y + baseH)
        grad.addColorStop(0, 'rgba(255,255,255,0.08)')
        grad.addColorStop(0.3, 'rgba(255,255,255,0.02)')
        grad.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.fillStyle = grad
        ctx.fillRect(x, y, baseW, baseH)
        ctx.restore()

        // Samsung logo
        ctx.fillStyle = '#ffffff'
        ctx.font = `bold ${Math.max(10, baseW * 0.04)}px sans-serif`
        ctx.textAlign = 'center'
        ctx.fillText('SAMSUNG', centerX, y + baseH + bezel * 4)
      }
      tvImg.src = productImage

      // Size indicator ring
      ctx.strokeStyle = 'rgba(20, 40, 160, 0.6)'
      ctx.lineWidth = 2
      ctx.setLineDash([8, 6])
      ctx.beginPath()
      ctx.arc(centerX, centerY, Math.max(baseW, baseH) * 0.55, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])
    }
    img.src = capturedImage
  }, [capturedImage, tvPosition, tvScale, tvSize, productImage])

  /* Drag handlers */
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true)
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    setDragStart({ x: clientX, y: clientY })
  }, [])

  const handleDragMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !canvasRef.current) return
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    const rect = canvasRef.current.getBoundingClientRect()
    const dx = ((clientX - dragStart.x) / rect.width) * 100
    const dy = ((clientY - dragStart.y) / rect.height) * 100
    setTvPosition(prev => ({
      x: Math.max(10, Math.min(90, prev.x + dx)),
      y: Math.max(10, Math.min(90, prev.y + dy))
    }))
    setDragStart({ x: clientX, y: clientY })
  }, [isDragging, dragStart])

  const handleDragEnd = useCallback(() => setIsDragging(false), [])

  /* Download result */
  const downloadImage = useCallback(() => {
    if (!canvasRef.current) return
    const link = document.createElement('a')
    link.download = `samsung-ar-preview-${Date.now()}.jpg`
    link.href = canvasRef.current.toDataURL('image/jpeg', 0.95)
    link.click()
  }, [])

  /* Cleanup on unmount */
  useEffect(() => {
    return () => stopCamera()
  }, [stopCamera])

  return (
    <>
      {/* Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        onClick={openAR}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[11px] font-bold transition-all shadow-lg bg-gradient-to-r from-[#1428A0] to-[#0077C8] text-white hover:shadow-[#1428A0]/30"
      >
        <Camera className="w-3.5 h-3.5" />
        Prueba en tu Espacio AR
      </motion.button>

      {/* AR Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/95 backdrop-blur-xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Monitor className="w-5 h-5 text-[#00BFFF]" />
                <span className="text-white font-bold text-sm">Samsung AR Preview</span>
                <span className="text-[10px] text-gray-500 ml-2">{productName}</span>
              </div>
              <button onClick={closeAR} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Camera / Preview Area */}
            <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-black">
              {!capturedImage ? (
                <>
                  {hasPermission === true && (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  )}
                  {hasPermission === false && (
                    <div className="text-center p-8">
                      <Camera className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                      <p className="text-white font-bold mb-2">No se pudo acceder a la camara</p>
                      <p className="text-gray-500 text-xs mb-4">Permite el acceso a la camara para usar AR</p>
                      <Button onClick={startCamera} className="samsung-btn-primary">Reintentar</Button>
                    </div>
                  )}
                  {hasPermission === null && (
                    <div className="text-center p-8">
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <Camera className="w-16 h-16 mx-auto mb-4 text-[#1428A0]" />
                      </motion.div>
                      <p className="text-white font-bold">Iniciando camara...</p>
                    </div>
                  )}

                  {hasPermission === true && (
                    <>
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-1/4 left-1/4 w-8 h-8 border-l-2 border-t-2 border-[#1428A0]/60 rounded-tl-lg" />
                        <div className="absolute top-1/4 right-1/4 w-8 h-8 border-r-2 border-t-2 border-[#1428A0]/60 rounded-tr-lg" />
                        <div className="absolute bottom-1/4 left-1/4 w-8 h-8 border-l-2 border-b-2 border-[#1428A0]/60 rounded-bl-lg" />
                        <div className="absolute bottom-1/4 right-1/4 w-8 h-8 border-r-2 border-b-2 border-[#1428A0]/60 rounded-br-lg" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 border border-white/40 rounded-full" />
                      </div>
                      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {TV_SIZES.map(size => (
                          <button
                            key={size.label}
                            onClick={() => setTvSize(size)}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${
                              tvSize.label === size.label
                                ? 'bg-[#1428A0] text-white'
                                : 'bg-black/50 text-white/70 backdrop-blur'
                            }`}
                          >
                            {size.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="relative w-full h-full flex items-center justify-center">
                  <canvas
                    ref={canvasRef}
                    onMouseDown={handleDragStart}
                    onMouseMove={handleDragMove}
                    onMouseUp={handleDragEnd}
                    onMouseLeave={handleDragEnd}
                    onTouchStart={handleDragStart}
                    onTouchMove={handleDragMove}
                    onTouchEnd={handleDragEnd}
                    className={`max-w-full max-h-full object-contain ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                    style={{ touchAction: 'none' }}
                  />
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3">
                    <button onClick={() => setTvScale(s => Math.max(0.5, s - 0.1))}
                      className="w-10 h-10 rounded-full bg-black/60 backdrop-blur flex items-center justify-center text-white hover:bg-black/80 transition-colors">
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <div className="px-4 py-2 bg-black/60 backdrop-blur rounded-full text-white text-[10px] font-bold">
                      {tvSize.label} · Arrastra para mover
                    </div>
                    <button onClick={() => setTvScale(s => Math.min(2, s + 0.1))}
                      className="w-10 h-10 rounded-full bg-black/60 backdrop-blur flex items-center justify-center text-white hover:bg-black/80 transition-colors">
                      <ZoomIn className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {TV_SIZES.map(size => (
                      <button
                        key={size.label}
                        onClick={() => setTvSize(size)}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${
                          tvSize.label === size.label
                            ? 'bg-[#1428A0] text-white'
                            : 'bg-black/50 text-white/70 backdrop-blur hover:bg-black/70'
                        }`}
                      >
                        {size.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Controls */}
            <div className="px-4 py-4 border-t border-white/10 bg-black/80 backdrop-blur">
              {!capturedImage ? (
                <div className="flex items-center justify-center gap-4">
                  <button onClick={switchCamera}
                    className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                    <RotateCcw className="w-5 h-5" />
                  </button>
                  <button onClick={capturePhoto}
                    className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center hover:scale-105 transition-transform active:scale-95">
                    <div className="w-12 h-12 rounded-full bg-white" />
                  </button>
                  <div className="w-12" />
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  <Button onClick={retakePhoto} variant="outline"
                    className="h-11 px-5 rounded-full border-gray-600 text-white hover:bg-white/10 text-xs font-bold">
                    <RotateCcw className="w-4 h-4 mr-1.5" /> Volver a tomar
                  </Button>
                  <Button onClick={downloadImage}
                    className="h-11 px-6 samsung-btn-primary rounded-full text-xs font-bold">
                    <Download className="w-4 h-4 mr-1.5" /> Guardar
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
