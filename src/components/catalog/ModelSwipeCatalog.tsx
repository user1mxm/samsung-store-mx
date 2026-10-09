import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ShimmerImage } from '@/components/home/ShimmerImage'
import { TV3DViewer } from '@/components/home/TV3DViewer'
import { ChevronLeft, ChevronRight, Heart, TrendingUp, ShoppingCart, ZoomIn, FileText } from 'lucide-react'

type Product = { id:number; name:string; model:string; category:string; imageUrl:string; price:string; description?:string; stock:number; unitProfile?:{gallery:string[];condition:string;accessories:string[];unitCode:string;warranty:string} }
type Props = {
  products:Product[]; loading:boolean; darkMode:boolean; wishlist:number[]; compareList:number[]
  onToggleWishlist:(id:number)=>void; onToggleCompare:(id:number)=>void; onAddToCart:(p:Product)=>void
  onViewProduct:(p:Product)=>void; onZoom:(p:Product)=>void; onSpecSheet:(p:Product)=>void; onQuickView:(p:Product)=>void
}
export default function ModelSwipeCatalog(props:Props) {
  const {products,loading,wishlist,compareList}=props
  const track=useRef<HTMLDivElement>(null)
  const [index,setIndex]=useState(0)
  const [photo,setPhoto]=useState(0)
  const [media,setMedia]=useState<'image'|'details'|'360'>('image')
  const keys=products.map(p=>p.id).join(',')
  useEffect(()=>{setIndex(0);setMedia('image');setPhoto(0);track.current?.scrollTo({left:0,behavior:'instant'})},[keys])
  const select=(next:number)=>{
    const target=Math.max(0,Math.min(next,products.length-1))
    setIndex(target);setMedia('image');setPhoto(0)
    const slide=track.current?.children[target] as HTMLElement|undefined
    if(slide&&track.current)track.current.scrollTo({left:slide.offsetLeft-track.current.offsetLeft,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})
  }
  if(loading)return <div role="status" className="model-swipe-empty">Cargando modelos…</div>
  if(!products.length)return <div className="model-swipe-empty">No se encontraron productos. Ajusta la búsqueda o los filtros.</div>
  const active=products[Math.min(index,products.length-1)]
  return <section className="model-swipe" aria-label="Catálogo deslizable por modelos">
    <div className="model-swipe-toolbar">
      <label>Selecciona un modelo<select aria-label="Seleccionar modelo" value={active.id} onChange={e=>select(products.findIndex(p=>p.id===Number(e.target.value)))}>{products.map(p=><option key={p.id} value={p.id}>{p.model} · {p.name}</option>)}</select></label>
      <div className="model-swipe-navigation"><span aria-live="polite">{index+1} / {products.length}</span><button aria-label="Modelo anterior" disabled={index===0} onClick={()=>select(index-1)}><ChevronLeft size={20}/></button><button aria-label="Modelo siguiente" disabled={index===products.length-1} onClick={()=>select(index+1)}><ChevronRight size={20}/></button></div>
    </div>
    <div className="model-swipe-track" ref={track} tabIndex={0} aria-label="Desliza para cambiar de modelo" onKeyDown={e=>{if(e.target!==e.currentTarget)return;if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();select(index+(e.key==='ArrowRight'?1:-1))}}} onScroll={()=>{
      const el=track.current;if(!el)return
      const next=Math.max(0,Math.min(products.length-1,Math.round(el.scrollLeft/el.clientWidth)))
      if(next!==index){setIndex(next);setMedia('image');setPhoto(0)}
    }}>
      {products.map((p,i)=><article key={p.id} className="model-swipe-slide" aria-label={`Modelo ${i+1}: ${p.model}`} inert={i!==index} aria-hidden={i!==index}>
        <div className="model-swipe-media">
          <div className="model-media-tabs" aria-label={`Multimedia ${p.model}`}>
            <button aria-pressed={i===index&&media==='image'} onClick={()=>{setMedia('image');setPhoto(0)}}>Imagen</button>
            <button aria-pressed={i===index&&media==='details'} onClick={()=>setMedia('details')}>Detalles</button>
            {/^(UN|QN|UE|QE)\d/i.test(p.model)&&<button aria-pressed={i===index&&media==='360'} onClick={()=>setMedia('360')}>Vista 360°</button>}
          </div>
          {i===index&&media==='360'?<TV3DViewer product={p}/>:i===index&&media==='details'?<div className="model-description"><span>{p.model}</span><h3>{p.name}</h3><p>{p.description||'Consulta la ficha del producto para conocer sus características.'}</p><button onClick={()=>props.onSpecSheet(p)}><FileText size={17}/> Abrir ficha técnica</button></div>:Math.abs(i-index)<=1?<div className="model-photo"><ShimmerImage src={p.unitProfile?.gallery?.[photo]||p.imageUrl} alt={p.name} className="model-photo-image"/><button aria-label={`Ampliar imagen: ${p.name}`} onClick={()=>props.onZoom(p)}><ZoomIn size={18}/></button></div>:<div className="model-photo"/>}
        {p.unitProfile && p.unitProfile.gallery.length>0&&<div className="model-thumbnails">{p.unitProfile.gallery.map((url,n)=><button key={url} aria-label={`Foto ${n+1} de ${p.model}`} aria-pressed={photo===n} onClick={()=>{setPhoto(n);setMedia('image')}}><img src={url} alt="" loading="lazy"/></button>)}</div>}
        </div>
        <div className="model-swipe-info"><span className="model-category">{p.category}</span><h3>{p.name}</h3><p className="model-code">{p.model}</p><p className="model-summary">{p.description}</p><strong>${Number(p.price).toLocaleString('es-MX')} <small>MXN</small></strong><p className="model-stock">{p.stock>0?`${p.stock} ${p.stock===1?'unidad disponible':'unidades disponibles'}`:'Agotado'}</p>
          <Button className="samsung-btn-primary" disabled={p.stock<=0} onClick={()=>props.onAddToCart(p)}><ShoppingCart size={17}/> {p.stock<=0?'Agotado':'Agregar al Carrito'}</Button>
          <div className="model-actions"><button onClick={()=>props.onViewProduct(p)}>Ver producto</button><button onClick={()=>props.onQuickView(p)}>Vista rápida</button><button onClick={()=>props.onSpecSheet(p)}>Ficha técnica</button></div>
          {p.unitProfile&&<div className="model-unit-profile"><h4>Unidad {p.unitProfile.unitCode}</h4><p>{p.unitProfile.condition}</p><p>Incluye: {p.unitProfile.accessories.join(', ')||'Consultar'}</p><p>Garantía: {p.unitProfile.warranty||'Consultar antes de comprar'}</p></div>}
          <div className="model-save"><button aria-pressed={wishlist.includes(p.id)} onClick={()=>props.onToggleWishlist(p.id)}><Heart size={16}/> {wishlist.includes(p.id)?'Guardado':'Favorito'}</button><button aria-pressed={compareList.includes(p.id)} onClick={()=>props.onToggleCompare(p.id)}><TrendingUp size={16}/> Comparar</button></div>
        </div>
      </article>)}
    </div>
    <div className="model-mobile-purchase"><div><strong>${Number(active.price).toLocaleString('es-MX')}</strong><small>{active.stock} disponibles · {active.model}</small></div><button disabled={active.stock<=0} onClick={()=>props.onAddToCart(active)}>{active.stock>0?'Agregar':'Agotado'}</button></div>
    <p className="model-swipe-hint">Desliza horizontalmente, usa las flechas o elige un modelo en el menú.</p>
  </section>
}
