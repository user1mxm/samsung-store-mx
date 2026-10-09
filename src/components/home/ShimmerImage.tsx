import { useEffect, useState } from 'react'
import imageManifest from '@/generated/image-manifest.json'

export function ShimmerImage({ src, alt, className, onClick }: { src: string; alt: string; className?: string; onClick?: () => void }) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  useEffect(() => { setLoaded(false); setFailed(false) }, [src])
  const variants = (imageManifest as Record<string, { src: string; width: number }[]>)[src]
  return (
    <div className={`relative overflow-hidden ${className || ''}`} onClick={onClick}>
      {!loaded && <div className="absolute inset-0 bg-gray-200 animate-pulse" />}
      {failed ? <div className="absolute inset-0 flex items-center justify-center bg-slate-100 px-5 text-center text-xs text-slate-500">Imagen no disponible</div> : <img key={src} src={variants?.at(-1)?.src || src} srcSet={variants?.map(v => `${v.src} ${v.width}w`).join(', ')} sizes="(max-width: 639px) 90vw, (max-width: 900px) 45vw, (max-width: 1199px) 30vw, 23vw" alt={alt} loading="lazy" decoding="async" width="960" height="720" className={`w-full h-full object-contain transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`} onLoad={() => setLoaded(true)} onError={() => { setFailed(true); setLoaded(true) }} draggable={false} />}
    </div>
  )
}
