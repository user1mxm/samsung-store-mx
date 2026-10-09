import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { RotateCcw, Pause, Play, Minus, Plus } from 'lucide-react'
import { tvProfile } from '@/lib/tv-model.mjs'
import { buildTelevision, disposeTelevision } from '@/lib/tv-geometry.mjs'
import { TVPoster } from './TV3DViewer'
import type { TVProduct } from './TV3DViewer'

type Studio = 'pearl' | 'night'
type Runtime = { view: (angle:number)=>void; zoom: (factor:number)=>void; auto:(on:boolean)=>void; light:(studio:Studio)=>void }

export default function TVScene({ product }: { product?: TVProduct }) {
  const mount = useRef<HTMLDivElement>(null)
  const runtime = useRef<Runtime | null>(null)
  const [failed,setFailed]=useState(false)
  const [ready,setReady]=useState(false)
  const [auto,setAuto]=useState(false)
  const [studio,setStudio]=useState<Studio>('pearl')
  const [view,setView]=useState('3/4')
  const [retry,setRetry]=useState(0)

  useEffect(()=>{
    const host=mount.current
    if(!host)return
    setFailed(false);setReady(false);setAuto(false);setStudio('pearl');setView('3/4')
    let renderer:THREE.WebGLRenderer
    try { renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'}) }
    catch { setFailed(true);return }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth<640?1.5:2))
    renderer.outputColorSpace=THREE.SRGBColorSpace
    renderer.toneMapping=THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure=1.15
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap
    renderer.domElement.setAttribute('aria-label','Modelo 3D del televisor: arrastra horizontalmente para girar')
    host.appendChild(renderer.domElement)
    const scene=new THREE.Scene()
    const profile=tvProfile(product)
    const camera=new THREE.PerspectiveCamera(35,1,.01,30)
    const controls=new OrbitControls(camera,renderer.domElement)
    controls.target.set(0,profile.totalHeight*.50,0)
    controls.enablePan=false;controls.enableDamping=true;controls.dampingFactor=.12
    controls.minDistance=profile.width*1.0;controls.maxDistance=profile.width*3.8
    controls.minPolarAngle=.25;controls.maxPolarAngle=Math.PI*.64
    controls.autoRotateSpeed=.9
    // Horizontal rotation leaves ordinary vertical touch scrolling available.
    renderer.domElement.style.touchAction='pan-y'
    const radius=profile.totalHeight*2.1
    camera.position.set(Math.sin(.40)*radius,profile.totalHeight*.78,Math.cos(.40)*radius)
    const pmrem=new THREE.PMREMGenerator(renderer)
    const room=new RoomEnvironment()
    const env=pmrem.fromScene(room,.04);scene.environment=env.texture;room.dispose();pmrem.dispose()
    scene.add(new THREE.HemisphereLight(0xeaf4ff,0x777c87,2.4))
    const key=new THREE.DirectionalLight(0xfff5e9,4.8);key.position.set(-2,4,3);key.castShadow=true
    key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-2;key.shadow.camera.right=2;key.shadow.camera.top=2;key.shadow.camera.bottom=-2;key.shadow.bias=-.0003;scene.add(key)
    const rim=new THREE.DirectionalLight(0xb8d8ff,3);rim.position.set(3,2,-2);scene.add(rim)
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(20,20),new THREE.ShadowMaterial({opacity:.18}));floor.rotation.x=-Math.PI/2;floor.position.y=-.002;floor.receiveShadow=true;scene.add(floor)
    let alive=true,visible=true,raf=0,last=0,settle=0,loaded=false
    const render=(time=0)=>{
      raf=0
      if(!alive||!visible||document.hidden)return
      const delta=last?Math.min((time-last)/1000,.05):1/60;last=time
      const changed=controls.update(delta)
      renderer.render(scene,camera)
      if(controls.autoRotate||changed||settle-->0)raf=requestAnimationFrame(render)
    }
    const invalidate=()=>{if(alive&&visible&&!document.hidden&&!raf){settle=3;last=0;raf=requestAnimationFrame(render)}}
    const resize=()=>{
      const width=host.clientWidth,height=host.clientHeight
      if(!width||!height)return
      camera.aspect=width/height;camera.updateProjectionMatrix()
      // Keep the same exterior fully framed on narrow portrait screens.
      const targetRadius=Math.max(radius,profile.width/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*camera.aspect*.82))
      if(!loaded){camera.position.copy(controls.target).add(new THREE.Vector3(Math.sin(.4)*targetRadius,profile.totalHeight*.28,Math.cos(.4)*targetRadius))}
      renderer.setSize(width,height,false);invalidate()
    }
    const change=()=>invalidate()
    const interaction=()=>{controls.autoRotate=false;setAuto(false);setView('Libre');invalidate()}
    controls.addEventListener('change',change);controls.addEventListener('start',interaction)
    const observer=new ResizeObserver(resize);observer.observe(host);resize()
    const intersection=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting??false;if(!visible){cancelAnimationFrame(raf);raf=0}else invalidate()},{threshold:.02});intersection.observe(host)
    const visibility=()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0}else invalidate()}
    document.addEventListener('visibilitychange',visibility)
    const loss=(event:Event)=>{event.preventDefault();setFailed(true)}
    renderer.domElement.addEventListener('webglcontextlost',loss)
    // Keep a local texture; no remote HDR/model download or cross-origin dependency.
    const texture=new THREE.TextureLoader().load('/viewer/alpine-screen-v1.webp',()=>{if(alive){loaded=true;setReady(true);invalidate()}},undefined,()=>{if(alive){setFailed(true)}})
    texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy())
    const model=buildTelevision(profile,texture);scene.add(model)
    runtime.current={
      view:(angle)=>{controls.autoRotate=false;const distance=camera.position.distanceTo(controls.target);camera.position.copy(controls.target).add(new THREE.Vector3(Math.sin(angle)*distance,profile.totalHeight*.24,Math.cos(angle)*distance));controls.update();invalidate()},
      zoom:(factor)=>{const offset=camera.position.clone().sub(controls.target);offset.setLength(THREE.MathUtils.clamp(offset.length()*factor,controls.minDistance,controls.maxDistance));camera.position.copy(controls.target).add(offset);invalidate()},
      auto:(on)=>{controls.autoRotate=on;invalidate()},
      light:(value)=>{renderer.toneMappingExposure=value==='night'?.85:1.15;key.intensity=value==='night'?2:4.8;invalidate()},
    }
    invalidate()
    return ()=>{
      alive=false;runtime.current=null;cancelAnimationFrame(raf);observer.disconnect();intersection.disconnect()
      document.removeEventListener('visibilitychange',visibility);renderer.domElement.removeEventListener('webglcontextlost',loss)
      controls.dispose();disposeTelevision(scene);env.dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove()
    }
  },[product?.model,retry])

  const snap=(label:string,angle:number)=>{runtime.current?.view(angle);setView(label);setAuto(false)}
  return <div className={`tv-live studio-${studio}`}>
    <div className="tv-stage" ref={mount} tabIndex={0} role="region" aria-label="Visor interactivo. Flechas para rotar; más y menos para zoom." onKeyDown={e=>{
      if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();snap(e.key==='ArrowLeft'?'Lateral izquierdo':'Lateral',e.key==='ArrowLeft'?-Math.PI/2:Math.PI/2)}
      if(e.key==='+'||e.key==='='){e.preventDefault();runtime.current?.zoom(.9)}
      if(e.key==='-'){e.preventDefault();runtime.current?.zoom(1.1)}
    }}>
      {(!ready||failed)&&<div className="tv-scene-fallback"><TVPoster name={product?.name||'Samsung'} />{failed?<div className="tv-preview-action"><p>Vista previa disponible. El visor 3D no pudo iniciarse.</p><button className="studio-primary" onClick={()=>setRetry(n=>n+1)}>Reintentar 3D</button></div>:<p role="status">Preparando el estudio…</p>}</div>}
      {ready&&!failed&&<span className="tv-gesture-hint">Arrastra para girar · pellizca para acercar</span>}
    </div>
    <div className="studio-controls" aria-label="Controles del televisor">
      <div className="studio-view-buttons">{[['Frente',0],['3/4',.4],['Lateral',Math.PI/2],['Trasero',Math.PI]] .map(([label,angle])=><button key={label} aria-pressed={view===label} onClick={()=>snap(String(label),Number(angle))}>{label}</button>)}</div>
      <div className="studio-tools"><button aria-label={auto?'Pausar rotación':'Rotar automáticamente'} aria-pressed={auto} onClick={()=>{runtime.current?.auto(!auto);setAuto(!auto)}}>{auto?<Pause size={16}/>:<Play size={16}/>}</button><button aria-label="Alejar" onClick={()=>runtime.current?.zoom(1.15)}><Minus size={17}/></button><button aria-label="Acercar" onClick={()=>runtime.current?.zoom(.87)}><Plus size={17}/></button><button aria-label="Restablecer vista" onClick={()=>{setRetry(n=>n+1)}}><RotateCcw size={16}/></button></div>
      <div className="studio-light-buttons">{(['pearl','night'] as const).map(value=><button key={value} aria-pressed={studio===value} onClick={()=>{setStudio(value);runtime.current?.light(value)}}>{value==='pearl'?'Perla':'Noche'}</button>)}</div>
    </div>
  </div>
}
