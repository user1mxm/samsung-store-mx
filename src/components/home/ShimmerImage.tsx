import { useState } from 'react'

export function ShimmerImage({ src, alt, className, onClick }: { src: string; alt: string; className?: string; onClick?: () => void }) {
  const [loaded, setLoaded] = useState(false)
  return (
    <div className={`relative overflow-hidden ${className || ''}`} onClick={onClick}>
      {!loaded && <div className="absolute inset-0 bg-gray-200 animate-pulse" />}
      <img src={src} alt={alt} className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`} onLoad={() => setLoaded(true)} draggable={false} />
    </div>
  )
}
