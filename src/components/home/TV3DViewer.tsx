import { lazy, Suspense, useState } from 'react'
import { Box, ArrowUpRight } from 'lucide-react'
import { viewerProduct } from '@/lib/viewer-product.mjs'
import { tvProfile } from '@/lib/tv-model.mjs'

const TVScene = lazy(() => import('./TVScene'))
export interface TVProduct { name?: string; model?: string; imageUrl?: string; specs?: unknown; unitProfile?:unknown }
export function TVPoster({ name }: { name: string }) {
  return <div className="tv-poster" aria-label={`Vista previa de ${name}`}>
    <div className="tv-poster-screen"><img src="/viewer/alpine-screen-v1-960.webp" srcSet="/viewer/alpine-screen-v1-960.webp 960w, /viewer/alpine-screen-v1.webp 1600w" sizes="(max-width: 900px) 80vw, 44vw" width="1600" height="900" alt="Paisaje de demostración en pantalla" decoding="async" fetchPriority="high" /></div>
    <span className="tv-poster-foot tv-poster-foot-left" /><span className="tv-poster-foot tv-poster-foot-right" />
  </div>
}
export function TV3DViewer({ product }: { product?: TVProduct }) {
  const [active, setActive] = useState(false)
  const { name, model } = viewerProduct(product)
  const profile = tvProfile(product)
  return <section className="tv-viewer" aria-label="Estudio del televisor en 360 grados">
    <div className="tv-viewer-header"><div><span className="studio-eyebrow"><span /> ESTUDIO 360°</span><h2>{name}</h2><p>{model} · {profile.documented ? 'Proporciones basadas en Samsung' : profile.configured ? 'Medidas de ficha · base ilustrativa' : 'Recreación ilustrativa'}</p></div><span className="studio-tag">{profile.documented ? '75″ · AirSlim' : 'Vista de producto'}</span></div>
    {active ? <Suspense fallback={<div className="tv-stage tv-loading"><TVPoster name={name} /><p role="status">Preparando iluminación y materiales…</p></div>}><TVScene product={product} /></Suspense>
      : <div className="tv-stage tv-preview"><TVPoster name={name} /><div className="tv-preview-action"><button onClick={() => setActive(true)} className="studio-primary"><Box size={17} /> Explorar en 360° <ArrowUpRight size={16} /></button><p>Gira, acerca y descubre cada ángulo.</p></div></div>}
    <div className="tv-viewer-note"><span>Recreación 3D · imagen de demostración</span>{profile.reference && <a href={profile.reference} target="_blank" rel="noreferrer">Fuente de medidas <ArrowUpRight size={12} /></a>}</div>
  </section>
}
export default TV3DViewer
