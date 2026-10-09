import { viewerProduct } from '@/lib/viewer-product.mjs'
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { RotateCcw, Maximize2, Layers, Box, Sun, Moon, Home } from 'lucide-react'

type Env  = 'studio' | 'dark' | 'showroom'
type Mode = 'normal' | 'wire' | 'xray'
interface TV3DViewerProps { product?: { name?: string; model?: string; imageUrl?: string; specs?: unknown } }

function haptic(s: 'light'|'medium'|'heavy'='light') {
  if ('vibrate' in navigator) navigator.vibrate(s==='light'?8:s==='medium'?15:25)
}

/* ── Generate screen texture ───────────────────────────────────────── */
function useScreenUrl() {
  const [url, setUrl] = useState('')
  useEffect(() => {
    const W=2048,H=1152,c=document.createElement('canvas')
    c.width=W;c.height=H
    const x=c.getContext('2d')!
    // Deep space
    const bg=x.createLinearGradient(0,0,W,H)
    bg.addColorStop(0,'#000420');bg.addColorStop(.5,'#000b28');bg.addColorStop(1,'#020014')
    x.fillStyle=bg;x.fillRect(0,0,W,H)
    // 3 spiral arms
    for(let arm=0;arm<3;arm++){
      for(let a=0;a<Math.PI*9;a+=.018){
        const r=380*(a/(Math.PI*9))
        const angle=a+(arm*Math.PI*2/3)
        const px=1024+Math.cos(angle)*r,py=576+Math.sin(angle)*r*.58
        const alpha=(1-a/(Math.PI*9))*.85
        x.beginPath();x.arc(px,py,Math.random()*2.2+.3,0,Math.PI*2)
        x.fillStyle=`rgba(${185+Math.random()*70},${215+Math.random()*40},255,${alpha*Math.random()})`
        x.fill()
      }
    }
    // Star field with glows
    for(let i=0;i<1400;i++){
      const sx=Math.random()*W,sy=Math.random()*H,ss=Math.random()*1.8+.2
      const br=Math.random()
      x.beginPath();x.arc(sx,sy,ss,0,Math.PI*2)
      x.fillStyle=br>.95?`rgba(220,238,255,${Math.random()*.9+.1})`:`rgba(255,255,255,${Math.random()*.35+.04})`
      x.fill()
      if(br>.975){
        const g=x.createRadialGradient(sx,sy,0,sx,sy,ss*8)
        g.addColorStop(0,'rgba(200,225,255,.38)');g.addColorStop(1,'transparent')
        x.fillStyle=g;x.fillRect(sx-ss*8,sy-ss*8,ss*16,ss*16)
      }
    }
    // Blue gas giant
    const p1=x.createRadialGradient(420,740,0,420,740,185)
    p1.addColorStop(0,'#7ad4fc');p1.addColorStop(.22,'#3a98ea');p1.addColorStop(.62,'#1658b2');p1.addColorStop(1,'#04102c')
    x.beginPath();x.arc(420,740,185,0,Math.PI*2);x.fillStyle=p1;x.fill()
    x.save();x.beginPath();x.arc(420,740,185,0,Math.PI*2);x.clip()
    for(let b=-5;b<=5;b++){x.beginPath();x.ellipse(420,740+b*42,190,18,.04,0,Math.PI*2);x.fillStyle=`rgba(${b>0?'60,175,255':'125,215,255'},.13)`;x.fill()}
    x.restore()
    x.save();x.translate(420,740);x.rotate(-.42);x.scale(1,.26)
    x.beginPath();x.arc(0,0,252,0,Math.PI*2);x.strokeStyle='rgba(155,218,255,.5)';x.lineWidth=28;x.stroke()
    x.beginPath();x.arc(0,0,292,0,Math.PI*2);x.strokeStyle='rgba(115,195,255,.24)';x.lineWidth=13;x.stroke()
    x.beginPath();x.arc(0,0,315,0,Math.PI*2);x.strokeStyle='rgba(95,175,255,.12)';x.lineWidth=7;x.stroke()
    x.restore()
    // Orange planet with atmosphere
    const p2=x.createRadialGradient(1720,260,0,1720,260,98)
    p2.addColorStop(0,'#ffc070');p2.addColorStop(.35,'#e85a20');p2.addColorStop(1,'#3c0a05')
    x.beginPath();x.arc(1720,260,98,0,Math.PI*2);x.fillStyle=p2;x.fill()
    // Atmosphere glow
    const atm=x.createRadialGradient(1720,260,85,1720,260,125)
    atm.addColorStop(0,'transparent');atm.addColorStop(1,'rgba(255,120,40,.12)')
    x.beginPath();x.arc(1720,260,125,0,Math.PI*2);x.fillStyle=atm;x.fill()
    // Nebulae
    ;[[1024,576,480,'0,70,220',.1],[400,200,320,'90,0,215',.07],[1520,820,300,'0,155,115',.08],[200,500,200,'150,60,0',.05]].forEach(([nx,ny,nr,nc,na]:any[])=>{
      const ng=x.createRadialGradient(nx,ny,0,nx,ny,nr)
      ng.addColorStop(0,`rgba(${nc},${na})`);ng.addColorStop(1,'transparent')
      x.fillStyle=ng;x.fillRect(0,0,W,H)
    })
    // Galaxy core
    const core=x.createRadialGradient(1024,576,0,1024,576,95)
    core.addColorStop(0,'rgba(255,248,215,.3)');core.addColorStop(.4,'rgba(215,195,255,.13)');core.addColorStop(1,'transparent')
    x.fillStyle=core;x.fillRect(0,0,W,H)
    setUrl(c.toDataURL('image/jpeg',.93))
  },[])
  return url
}

/* ── Roughness/normal-like canvas maps ─────────────────────────────── */
function useBezelGrad() {
  return useMemo(()=>{
    const c=document.createElement('canvas');c.width=4;c.height=64
    const x=c.getContext('2d')!
    const g=x.createLinearGradient(0,0,0,64)
    g.addColorStop(0,'#f4f4fc');g.addColorStop(.3,'#d0d0e4');g.addColorStop(.5,'#9898b0');g.addColorStop(.8,'#585870');g.addColorStop(1,'#383850')
    x.fillStyle=g;x.fillRect(0,0,4,64)
    return c.toDataURL()
  },[])
}

/* ══════════════════════════════════════════════════════════════════════ */
export function TV3DViewer({ product }: TV3DViewerProps) {
  const screenUrl = useScreenUrl()
  const bezelGrad = useBezelGrad()

  const [rotX, setRotX]     = useState(14)
  const [rotY, setRotY]     = useState(28)
  const [autoRot, setAutoRot] = useState(true)
  const [immersive, setImmersive] = useState(false)
  const [env, setEnv]       = useState<Env>('studio')
  const [mode, setMode]     = useState<Mode>('normal')
  const [size, setSize]     = useState(65)
  const [zoom, setZoom]     = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [activeView, setActiveView] = useState('3/4')
  const [rotDeg, setRotDeg] = useState(28)

  const drag    = useRef(false)
  const lastXY  = useRef({x:0,y:0})
  const vel     = useRef({x:0,y:0})
  const tRotX   = useRef(14)
  const tRotY   = useRef(28)
  const rRotX   = useRef(14)
  const rRotY   = useRef(28)
  const autoRef = useRef(true)
  const rafRef  = useRef(0)
  const momRef  = useRef({x:0,y:0})
  const pinchRef= useRef(0)

  useEffect(()=>{
    const tick=()=>{
      if(autoRef.current) tRotY.current+=.28
      else if(!drag.current){
        momRef.current.x*=.90; momRef.current.y*=.90
        tRotY.current+=momRef.current.x
        tRotX.current=Math.max(-70,Math.min(70,tRotX.current+momRef.current.y))
      }
      rRotX.current+=(tRotX.current-rRotX.current)*.075
      rRotY.current+=(tRotY.current-rRotY.current)*.075
      setRotX(rRotX.current); setRotY(rRotY.current)
      setRotDeg(Math.round(((rRotY.current%360)+360)%360))
      rafRef.current=requestAnimationFrame(tick)
    }
    rafRef.current=requestAnimationFrame(tick)
    return()=>cancelAnimationFrame(rafRef.current)
  },[])

  const onDown=useCallback((cx:number,cy:number)=>{
    drag.current=true;lastXY.current={x:cx,y:cy}
    vel.current={x:0,y:0};momRef.current={x:0,y:0}
    autoRef.current=false;setAutoRot(false);setIsDragging(true);haptic('light')
  },[])
  const onMove=useCallback((cx:number,cy:number)=>{
    if(!drag.current)return
    const dx=cx-lastXY.current.x,dy=cy-lastXY.current.y
    vel.current={x:dx*.6,y:dy*.35}
    tRotY.current+=dx*.65
    tRotX.current=Math.max(-70,Math.min(70,tRotX.current+dy*.38))
    lastXY.current={x:cx,y:cy}
  },[])
  const onUp=useCallback(()=>{
    if(!drag.current)return
    drag.current=false;setIsDragging(false)
    momRef.current={...vel.current};haptic('light')
  },[])

  const snap=useCallback((rx:number,ry:number,label:string)=>{
    autoRef.current=false;setAutoRot(false)
    tRotX.current=rx;tRotY.current=ry;setActiveView(label);haptic('medium')
  },[])
  const reset=useCallback(()=>{
    tRotX.current=14;tRotY.current=28
    autoRef.current=true;setAutoRot(true);setActiveView('3/4');haptic('medium')
  },[])

  const onTouchStart=useCallback((e:React.TouchEvent)=>{
    if(e.touches.length===2){pinchRef.current=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY)}
    else onDown(e.touches[0].clientX,e.touches[0].clientY)
  },[onDown])
  const onTouchMove=useCallback((e:React.TouchEvent)=>{
    e.preventDefault()
    if(e.touches.length===2){
      const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY)
      setZoom(z=>Math.max(.4,Math.min(2.8,z*(d/pinchRef.current))));pinchRef.current=d
    } else onMove(e.touches[0].clientX,e.touches[0].clientY)
  },[onMove])

  // Dims — large, cinematic proportions
  const TW=480, TH=270   // ~16:9, 65" base
  const D=20             // realistic depth
  const scale=(size/65)*zoom

  const op   = mode==='xray'?.15:1
  const wire = mode==='wire'
  const wBorder = wire?'1.5px solid rgba(0,180,255,.85)':undefined

  // Bezel material colors (metallic silver)
  const bezelTop    = 'linear-gradient(to top, #f6f6fe, #dcdcf0, #a8a8c4, #686880)'
  const bezelBottom = 'linear-gradient(to bottom, #585870, #888898, #c8c8dc)'
  const bezelRight  = 'linear-gradient(to right, #404058, #686880, #b0b0c8, #d8d8ec, #b0b0c8, #686880, #404058)'
  const bezelLeft   = 'linear-gradient(to left, #404058, #686880, #b0b0c8, #d8d8ec, #b0b0c8, #686880, #404058)'

  // Environment backgrounds
  const envBg:Record<Env,string>={
    studio: 'radial-gradient(ellipse 110% 65% at 50% 105%, rgba(20,40,180,.32) 0%, transparent 62%), radial-gradient(ellipse 55% 35% at 18% 18%, rgba(40,80,220,.08) 0%, transparent 50%), linear-gradient(180deg,#070b1c 0%,#030610 100%)',
    dark:   'radial-gradient(ellipse 85% 55% at 50% 95%, rgba(0,20,130,.38) 0%, transparent 62%), linear-gradient(180deg,#010208 0%,#000004 100%)',
    showroom: 'radial-gradient(ellipse 65% 42% at 22% 14%, rgba(255,215,145,.07) 0%, transparent 52%), radial-gradient(ellipse 50% 32% at 82% 88%, rgba(20,40,180,.12) 0%, transparent 52%), linear-gradient(180deg,#0c1022 0%,#060912 100%)',
  }

  // Floor reflection color
  const floorColor:Record<Env,string>={
    studio:'rgba(20,40,180,.18)',dark:'rgba(0,20,130,.25)',showroom:'rgba(255,180,80,.06)',
  }

  const { name, model, specs } = viewerProduct(product)

  const F=(extra:React.CSSProperties):React.CSSProperties=>({
    position:'absolute',backfaceVisibility:'hidden',willChange:'transform',opacity:op,...extra,
  })

  return(
    <div className={immersive?'fixed inset-0 z-[80] bg-black':'relative w-full max-w-[1100px] mx-auto select-none'}>
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          height:immersive?'100vh':'clamp(520px,62vw,740px)',
          background:envBg[env],
          boxShadow:'inset 0 0 140px rgba(0,0,0,.85),0 0 0 1px rgba(255,255,255,.03)',
          cursor:isDragging?'grabbing':'grab',
          touchAction:'none',
        }}
        onMouseDown={e=>onDown(e.clientX,e.clientY)}
        onMouseMove={e=>onMove(e.clientX,e.clientY)}
        onMouseUp={onUp} onMouseLeave={onUp}
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onUp}
        onDoubleClick={reset}
        onWheel={e=>{e.preventDefault();setZoom(z=>Math.max(.4,Math.min(2.8,z-e.deltaY*.0008)))}}
      >
        {/* Dust particles */}
        {Array.from({length:22}).map((_,i)=>(
          <motion.div key={i} className="absolute rounded-full pointer-events-none"
            style={{
              width:.7+(i%4)*.38,height:.7+(i%4)*.38,
              top:`${4+(i*6)%62}%`,left:`${2+(i*14)%94}%`,
              background:i%4===0?'#1428A0':i%4===1?'#00BFFF':i%4===2?'#4060ff':'#fff',
              filter:`blur(${i%3===0?.5:0}px)`,
            }}
            animate={{opacity:[.02,.6,.02],y:[0,-22,0],scale:[1,1.9,1]}}
            transition={{duration:2.2+(i%5)*.75,repeat:Infinity,delay:i*.26,ease:'easeInOut'}}
          />
        ))}

        {/* Studio key light cone */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background:'radial-gradient(ellipse 50% 65% at 50% -8%, rgba(255,255,255,.045) 0%, transparent 58%)',
        }}/>
        {/* Fill light left */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background:'radial-gradient(ellipse 35% 50% at 0% 40%, rgba(30,60,255,.06) 0%, transparent 55%)',
        }}/>

        {/* Floor reflection plane */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{
          height:'32%',
          background:`linear-gradient(to top, ${floorColor[env]} 0%, transparent 100%)`,
          transform:'perspective(380px) rotateX(70deg)',
          transformOrigin:'bottom center',
          filter:'blur(1px)',
        }}/>

        {/* ═══ 3D TV ════════════════════════════════════════════════ */}
        <div
          className="absolute top-1/2 left-1/2"
          style={{
            transform:`translate(-50%,-53%) perspective(3200px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${scale})`,
            transformStyle:'preserve-3d',
            width:TW,height:TH,
          }}
        >
          {/* ── FRONT: Screen ─── */}
          <div style={F({
            inset:0,
            transform:`translateZ(${D/2}px)`,
            border:wire?wBorder:`2.8px solid #9898b4`,
            borderRadius:4,overflow:'hidden',background:'#000014',
            boxShadow:wire?'none':`inset 0 0 35px rgba(0,0,16,.75), 0 0 0 .5px rgba(255,255,255,.05)`,
          })}>
            {screenUrl
              ?<img src={screenUrl} style={{width:'100%',height:'100%',objectFit:'cover',display:'block',filter:'contrast(1.07) saturate(1.1) brightness(1.04)'}} draggable={false}/>
              :<div style={{width:'100%',height:'100%',background:'radial-gradient(ellipse at center, #001240 0%, #000014 100%)'}}/>
            }
            {/* OLED emissive glow */}
            <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 72% 58% at 47% 44%, rgba(20,40,200,.2) 0%, transparent 62%)',mixBlendMode:'screen'}}/>
            {/* Studio reflection */}
            <div style={{position:'absolute',inset:0,background:'linear-gradient(145deg,rgba(255,255,255,.1) 0%,transparent 22%,transparent 62%,rgba(255,255,255,.04) 100%)'}}/>
            {/* Side reflections */}
            <div style={{position:'absolute',inset:0,background:'linear-gradient(to right,rgba(255,255,255,.04) 0%,transparent 8%,transparent 92%,rgba(255,255,255,.03) 100%)'}}/>
            {/* Corner glints */}
            <div style={{position:'absolute',top:0,left:0,width:40,height:40,background:'radial-gradient(ellipse at top left, rgba(255,255,255,.1) 0%, transparent 70%)'}}/>
            <div style={{position:'absolute',top:0,right:0,width:40,height:40,background:'radial-gradient(ellipse at top right, rgba(255,255,255,.07) 0%, transparent 70%)'}}/>
            {/* Vignette */}
            <div style={{position:'absolute',inset:0,boxShadow:'inset 0 0 32px rgba(0,0,0,.65)'}}/>
            {/* Bezel bottom strip */}
            <div style={{position:'absolute',bottom:0,left:0,right:0,height:16,background:'rgba(7,7,15,.97)',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 14px'}}>
              <div style={{width:3,height:3,borderRadius:'50%',background:'#0a0a1c',border:'.5px solid #252540'}}/>
              <span style={{fontSize:5.8,fontWeight:800,letterSpacing:'.38em',color:'rgba(180,200,255,.32)',fontFamily:'sans-serif'}}>SAMSUNG</span>
              <motion.div style={{width:3.5,height:3.5,borderRadius:'50%',background:'#00BFFF'}}
                animate={{opacity:[1,.3,1],boxShadow:['0 0 5px #00BFFF,0 0 12px rgba(0,191,255,.5)','0 0 2px #00BFFF','0 0 5px #00BFFF,0 0 12px rgba(0,191,255,.5)']}}
                transition={{duration:2.6,repeat:Infinity}}/>
            </div>
          </div>

          {/* ── BACK ─── */}
          <div style={F({
            inset:0,
            transform:`translateZ(-${D/2}px) rotateY(180deg)`,
            borderRadius:4,overflow:'hidden',
            background:wire?'transparent':'linear-gradient(152deg,#1e1e28 0%,#111120 42%,#171724 100%)',
            border:wire?wBorder:'1px solid #1c1c2e',
          })}>
            {!wire&&<>
              {/* Brushed metal */}
              <div style={{position:'absolute',inset:0,opacity:.045,background:'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,.1) 2px,rgba(255,255,255,.1) 3px)'}}/>
              {/* Spine */}
              <div style={{position:'absolute',top:'9%',bottom:'9%',left:'50%',width:6,transform:'translateX(-50%)',background:'linear-gradient(to bottom,#1e1e2c,#131320,#1e1e2c)',borderRadius:3}}/>
              {/* Cable mgmt hole */}
              <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%) translateY(30px)',width:20,height:28,border:'1px solid #242440',borderRadius:3,background:'rgba(8,8,18,.9)'}}/>
              {/* Vents */}
              {Array.from({length:11}).map((_,i)=>(
                <div key={i} style={{position:'absolute',left:'16%',right:'16%',top:`${14+i*6.5}%`,height:2.2,background:'#0c0c18',borderRadius:1}}/>
              ))}
              {/* VESA */}
              <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%) translateY(-18px)',width:58,height:42,border:'1px solid #262640',borderRadius:3,background:'rgba(9,9,18,.95)'}}>
                {[[4,4],[50,4],[4,34],[50,34]].map(([vx,vy],i)=>(
                  <div key={i} style={{position:'absolute',top:vy,left:vx,width:7,height:7,borderRadius:'50%',background:'#1a1a2c',border:'.5px solid #323248'}}/>
                ))}
                <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',fontSize:3.8,color:'#383858',fontFamily:'monospace',fontWeight:'bold',whiteSpace:'nowrap'}}>VESA 400×400</div>
              </div>
              {/* HDMI */}
              {[0,1,2,3].map(i=>(
                <div key={i} style={{position:'absolute',bottom:'16%',right:`${9+i*11}%`,width:18,height:11,borderRadius:2,background:'#141420',border:'.5px solid #282840'}}>
                  <div style={{position:'absolute',inset:'2.5px 2px',background:'#050510',borderRadius:1}}/>
                </div>
              ))}
              {/* USB */}
              {[0,1].map(i=>(
                <div key={i} style={{position:'absolute',bottom:'16%',left:`${18+i*11}%`,width:14,height:10,borderRadius:1.5,background:'#141420',border:'.5px solid #282840'}}>
                  <div style={{position:'absolute',inset:'2px 1.5px',background:'#050510'}}/>
                </div>
              ))}
              {/* Samsung back logo */}
              <div style={{position:'absolute',bottom:'34%',left:'50%',transform:'translateX(-50%)',fontSize:8,fontWeight:800,letterSpacing:'.42em',color:'#242438',fontFamily:'sans-serif',whiteSpace:'nowrap',textTransform:'uppercase'}}>SAMSUNG</div>
              {/* Power jack */}
              <div style={{position:'absolute',bottom:'9%',right:'7%',width:11,height:11,borderRadius:'50%',border:'1px solid #262640',background:'#131322'}}/>
            </>}
          </div>

          {/* ── RIGHT SIDE ─── */}
          <div style={F({
            top:0,left:TW-2.8,width:D,height:TH,
            transform:'rotateY(90deg)',transformOrigin:'left center',
            borderRadius:'0 3px 3px 0',
            background:wire?'transparent':bezelRight,
            border:wire?wBorder:'none',
          })}>
            {!wire&&<>
              <div style={{position:'absolute',top:'16%',width:'100%',height:'22%',background:'linear-gradient(to bottom,transparent,rgba(255,255,255,.24),transparent)'}}/>
              {[0,1,2].map(i=>(
                <div key={i} style={{position:'absolute',bottom:`${19+i*9}%`,right:0,width:'82%',height:7,borderRadius:'2px 0 0 2px',background:'#111120',border:'.5px solid #1e1e30'}}/>
              ))}
            </>}
          </div>

          {/* ── LEFT SIDE ─── */}
          <div style={F({
            top:0,left:2.8-D,width:D,height:TH,
            transform:'rotateY(-90deg)',transformOrigin:'right center',
            borderRadius:'3px 0 0 3px',
            background:wire?'transparent':bezelLeft,
            border:wire?wBorder:'none',
          })}>
            {!wire&&<div style={{position:'absolute',top:'20%',width:'100%',height:'18%',background:'linear-gradient(to bottom,transparent,rgba(255,255,255,.16),transparent)'}}/>}
          </div>

          {/* ── TOP ─── */}
          <div style={F({
            top:2.8-D,left:0,width:TW,height:D,
            transform:'rotateX(90deg)',transformOrigin:'bottom center',
            background:wire?'transparent':bezelTop,
            border:wire?wBorder:'none',
            boxShadow:wire?'none':'inset 0 3px 7px rgba(255,255,255,.2)',
          })}/>

          {/* ── BOTTOM ─── */}
          <div style={F({
            bottom:2.8-D,left:0,width:TW,height:D,
            transform:'rotateX(-90deg)',transformOrigin:'top center',
            background:wire?'transparent':bezelBottom,
            border:wire?wBorder:'none',
          })}>
            {!wire&&[0,1,2].map(i=>(
              <div key={i} style={{position:'absolute',bottom:3,left:`${34+i*10}%`,width:17,height:7,borderRadius:2,background:'#131322',border:'.5px solid #242440'}}/>
            ))}
          </div>

          {/* ── Chamfer edges (glint) ─── */}
          {!wire&&[
            {s:`translateZ(${D/2}px) rotateX(45deg)`,w:TW,h:6,t:-3,l:0,bg:'linear-gradient(to top,rgba(255,255,255,.12),rgba(255,255,255,.04))'},
            {s:`translateZ(${D/2}px) rotateX(-45deg)`,w:TW,h:6,t:TH-3,l:0,bg:'linear-gradient(to bottom,rgba(255,255,255,.08),rgba(255,255,255,.02))'},
          ].map((e,i)=>(
            <div key={i} style={{position:'absolute',top:e.t,left:e.l,width:e.w,height:e.h,transform:e.s,transformOrigin:'center',background:e.bg,pointerEvents:'none'}}/>
          ))}

          {/* ── OLED glow ─── */}
          <motion.div style={{position:'absolute',inset:-5,borderRadius:9,pointerEvents:'none',transform:`translateZ(${D/2-1}px)`,background:'transparent'}}
            animate={{boxShadow:['0 0 28px rgba(20,40,200,.3),0 0 60px rgba(20,40,160,.12)','0 0 45px rgba(20,40,220,.5),0 0 100px rgba(20,40,180,.22)','0 0 28px rgba(20,40,200,.3),0 0 60px rgba(20,40,160,.12)']}}
            transition={{duration:3.5,repeat:Infinity,ease:'easeInOut'}}/>

          {/* ── STAND ─── */}
          {/* Neck */}
          <div style={{position:'absolute',top:TH+1,left:'50%',transform:'translateX(-50%) translateZ(-7px)',width:26,height:68,background:`linear-gradient(to bottom,#606078,#383850)`,clipPath:'polygon(7% 0%,93% 0%,100% 100%,0% 100%)',boxShadow:'inset 2px 0 5px rgba(255,255,255,.07),inset -2px 0 5px rgba(0,0,0,.35)'}}/>
          {/* Neck side depth */}
          <div style={{position:'absolute',top:TH+1,left:'50%',transform:'translateX(-50%) translateZ(-7px) rotateY(90deg) translateZ(4px)',width:12,height:68,background:`linear-gradient(to right,#282840,#484860)`,clipPath:'polygon(0% 0%,100% 0%,85% 100%,15% 100%)',transformOrigin:'left center'}}/>
          {/* Base plate */}
          <div style={{position:'absolute',top:TH+66,left:'50%',transform:'translateX(-50%) translateZ(-9px)',width:188,height:11,background:`linear-gradient(180deg,#606078 0%,#383850 100%)`,borderRadius:'6px 6px 4px 4px',boxShadow:'0 8px 28px rgba(0,0,0,.85),inset 0 1px 3px rgba(255,255,255,.09)'}}>
            {/* Base side */}
            <div style={{position:'absolute',bottom:-4,left:'50%',transform:'translateX(-50%)',width:186,height:4,background:'#28283a',borderRadius:'0 0 4px 4px'}}/>
            {[-70,70].map(fx=>(
              <div key={fx} style={{position:'absolute',bottom:-5,left:`calc(50% + ${fx}px)`,width:16,height:5,borderRadius:'0 0 4px 4px',background:'#0e0e1a'}}/>
            ))}
          </div>
          {/* Floor shadow */}
          <div style={{position:'absolute',top:TH+80,left:'50%',transform:'translateX(-50%) translateZ(-11px)',width:220,height:16,background:'radial-gradient(ellipse at center,rgba(0,0,0,.6) 0%,transparent 70%)',filter:'blur(6px)',pointerEvents:'none'}}/>
          {/* Floor reflection of TV */}
          <div style={{position:'absolute',top:TH+97,left:'50%',transform:'translateX(-50%) translateZ(-12px) scaleY(-1)',width:TW*.75,height:TH*.18,background:'linear-gradient(to bottom,rgba(20,40,180,.12),transparent)',filter:'blur(8px)',opacity:.5,pointerEvents:'none'}}/>
        </div>

        {/* ═══ HUD ════════════════════════════════════════════════ */}
        <div className="absolute top-4 left-4 pointer-events-none">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-2.5" style={{background:'rgba(20,40,160,.55)',backdropFilter:'blur(14px)',border:'1px solid rgba(80,120,255,.28)'}}>
            <motion.span className="block rounded-full" style={{width:6,height:6,background:'#00e5a0'}}
              animate={{opacity:[1,.2,1],boxShadow:['0 0 7px #00e5a0','none','0 0 7px #00e5a0']}}
              transition={{duration:2,repeat:Infinity}}/>
            <span className="text-[10px] font-bold tracking-[1.5px] uppercase" style={{color:'#7ab4ff'}}>Vista CSS 3D</span>
          </div>
          <div className="font-black text-white" style={{fontSize:27,letterSpacing:'-0.5px',lineHeight:1,textShadow:'0 0 40px rgba(20,40,220,.85)'}}>{name}</div>
          <div className="text-[11px] mt-1" style={{color:'rgba(160,190,255,.65)',letterSpacing:'.3px'}}>{model} · Modelo 3D ilustrativo</div>
        </div>

        {/* Size */}
        <div className="absolute top-4 right-4 flex gap-1.5 pointer-events-auto">
          {([55,65,77,85] as const).map(s=>(
            <button key={s} onClick={()=>{setSize(s);haptic('medium')}}
              className="text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all duration-150"
              style={{background:size===s?'rgba(20,40,160,.92)':'rgba(5,12,35,.78)',backdropFilter:'blur(10px)',border:size===s?'1px solid rgba(74,124,255,.88)':'1px solid rgba(80,120,255,.18)',color:size===s?'#fff':'rgba(140,170,255,.6)',transform:size===s?'scale(1.06)':'scale(1)'}}>
              Escala {s}/65
            </button>
          ))}
          {immersive&&<button onClick={()=>{setImmersive(false);haptic('heavy')}} className="ml-1 px-3 py-1 text-[11px] font-bold text-white rounded-lg" style={{background:'rgba(200,30,30,.78)',border:'1px solid rgba(255,80,80,.32)',backdropFilter:'blur(8px)'}}>✕</button>}
        </div>

        {/* Specs */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 pointer-events-none">
          {specs.map(([l,v])=>(
            <div key={l} className="text-right px-3 py-1.5 rounded-xl" style={{background:'rgba(4,10,30,.78)',backdropFilter:'blur(12px)',border:'1px solid rgba(80,120,255,.1)',minWidth:94}}>
              <div className="text-[9px] uppercase tracking-wider" style={{color:'rgba(130,165,255,.4)'}}>{l}</div>
              <div className="text-[13px] font-bold mt-0.5" style={{color:'#c5daff'}}>{v}</div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1 flex-wrap justify-center pointer-events-auto">
          <button onClick={()=>{autoRef.current=!autoRef.current;setAutoRot(v=>!v);haptic('medium')}}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all"
            style={{background:autoRot?'rgba(20,40,160,.92)':'rgba(5,12,35,.78)',backdropFilter:'blur(10px)',border:`1px solid ${autoRot?'rgba(74,124,255,.88)':'rgba(80,120,255,.2)'}`,color:autoRot?'#fff':'rgba(150,185,255,.7)'}}>
            <RotateCcw className={`w-3 h-3 ${autoRot?'animate-spin':''}`} style={{animationDuration:'3s'}}/>Auto
          </button>
          <div className="w-px h-5 mx-0.5" style={{background:'rgba(80,120,255,.2)'}}/>
          {([['Frente',6,0],['3/4',18,32],['Lateral',6,90],['Trasero',6,180],['Superior',-72,0]] as [string,number,number][]).map(([l,rx,ry])=>(
            <button key={l} onClick={()=>snap(rx,ry,l)}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all"
              style={{background:activeView===l?'rgba(20,40,160,.88)':'rgba(5,12,35,.78)',backdropFilter:'blur(10px)',border:`1px solid ${activeView===l?'rgba(74,124,255,.82)':'rgba(80,120,255,.18)'}`,color:activeView===l?'#fff':'rgba(140,170,255,.65)'}}>
              {l}
            </button>
          ))}
          <div className="w-px h-5 mx-0.5" style={{background:'rgba(80,120,255,.2)'}}/>
          <button onClick={()=>{setMode(m=>m==='wire'?'normal':'wire');haptic('light')}}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all"
            style={{background:mode==='wire'?'rgba(20,40,160,.88)':'rgba(5,12,35,.78)',backdropFilter:'blur(10px)',border:`1px solid ${mode==='wire'?'rgba(74,124,255,.85)':'rgba(80,120,255,.18)'}`,color:mode==='wire'?'#fff':'rgba(140,170,255,.65)'}}>
            <Box className="w-3 h-3"/>Wire
          </button>
          <button onClick={()=>{setMode(m=>m==='xray'?'normal':'xray');haptic('light')}}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all"
            style={{background:mode==='xray'?'rgba(20,40,160,.88)':'rgba(5,12,35,.78)',backdropFilter:'blur(10px)',border:`1px solid ${mode==='xray'?'rgba(74,124,255,.85)':'rgba(80,120,255,.18)'}`,color:mode==='xray'?'#fff':'rgba(140,170,255,.65)'}}>
            <Layers className="w-3 h-3"/>Xray
          </button>
          <div className="w-px h-5 mx-0.5" style={{background:'rgba(80,120,255,.2)'}}/>
          <button onClick={()=>{setImmersive(v=>!v);haptic('heavy')}}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold"
            style={{background:'rgba(20,40,160,.62)',backdropFilter:'blur(10px)',border:'1px solid rgba(80,120,255,.4)',color:'#fff'}}>
            <Maximize2 className="w-3 h-3"/>Inmersivo
          </button>
        </div>

        {/* Env */}
        <div className="absolute bottom-5 right-4 flex gap-1 pointer-events-auto">
          {([['studio','Estudio',Sun],['dark','Dark',Moon],['showroom','Sala',Home]] as [Env,string,any][]).map(([e,l,Icon])=>(
            <button key={e} onClick={()=>{setEnv(e);haptic('light')}}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all"
              style={{background:env===e?'rgba(20,40,160,.82)':'rgba(5,12,35,.72)',backdropFilter:'blur(8px)',border:`1px solid ${env===e?'rgba(74,124,255,.78)':'rgba(80,120,255,.14)'}`,color:env===e?'#fff':'rgba(125,158,255,.55)'}}>
              <Icon className="w-3 h-3"/>{l}
            </button>
          ))}
        </div>

        {/* Degree */}
        <div className="absolute bottom-5 left-4 pointer-events-none">
          <span className="text-[10px] font-mono tabular-nums px-2 py-1 rounded-lg" style={{background:'rgba(4,10,30,.72)',backdropFilter:'blur(6px)',border:'1px solid rgba(80,120,255,.14)',color:'rgba(130,165,255,.45)'}}>
            {rotDeg}°
          </span>
        </div>
        <p className="absolute bottom-14 left-1/2 -translate-x-1/2 text-[10px] pointer-events-none whitespace-nowrap" style={{color:'rgba(130,165,255,.32)',letterSpacing:'.4px'}}>
          {isDragging?'Rotando…':'Modelo ilustrativo · Arrastra · Zoom · Doble toque reset'}
        </p>
      </div>
    </div>
  )
}

export default TV3DViewer
