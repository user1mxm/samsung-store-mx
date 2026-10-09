import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Metres. Group origin at the floor; +Z is the front of the panel.
export function buildTelevision(profile, screenTexture) {
  const group = new THREE.Group();
  group.name = 'Samsung exterior recreation';
  const { width:w, height:h, depth:d, totalHeight, standDepth, standSpan } = profile;
  const lift = totalHeight - h;
  const center = lift + h / 2;
  const edge = new THREE.MeshStandardMaterial({ color:0x363b40, metalness:.72, roughness:.28 });
  const back = new THREE.MeshStandardMaterial({ color:0x171b20, metalness:.15, roughness:.68 });
  const inset = new THREE.MeshStandardMaterial({ color:0x050708, roughness:.83 });
  const screen = new THREE.MeshPhysicalMaterial({ color:0xffffff, map:screenTexture, emissive:0xffffff, emissiveMap:screenTexture, emissiveIntensity:.36, metalness:0, roughness:.16, clearcoat:1, clearcoatRoughness:.13 });
  const box = (name, x,y,z, px,py,pz, material, radius=.001) => {
    const mesh = new THREE.Mesh(new RoundedBoxGeometry(x,y,z,2,Math.min(radius,x/3,y/3,z/3)), material);
    mesh.name = name; mesh.position.set(px,py,pz); mesh.castShadow=true; mesh.receiveShadow=true; group.add(mesh); return mesh;
  };
  box('thin titanium frame',w,h,d,0,center,0,edge,.003);
  box('rear shell',w-.013,h-.013,d*.52,0,center,-d*.3,back,.004);
  // Continuous front glass, narrow upper/side bezels and a slightly deeper lower edge.
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(w-.010,h-.017),screen);
  glass.name='display glass'; glass.position.set(0,center+.002,d/2+.0008); group.add(glass);
  box('lower bezel',w,.009,.002,0,lift+.0045,d/2+.001,edge);
  for (const sign of [-1,1]) {
    const x = sign*(standSpan/2-.028);
    box('flat lift foot',.052,.014,standDepth,x,.008,0,edge,.003);
    box('foot upright',.031,lift+.036,.065,x,lift/2+.016,-.021,edge,.002);
    box('rubber pad',.045,.003,standDepth*.87,x,.0015,0,inset);
  }
  // Subtle horizontal grooves, mounting screws and recessed connector silhouette.
  for(let i=0;i<18;i++) box('rear ventilation groove',w*.73,.0018,.001,0,lift+h*.18+i*h*.037,-d*.568,inset,.0003);
  if(profile.vesa) for(const x of [-profile.vesa/2,profile.vesa/2]) for(const y of [-profile.vesa/2,profile.vesa/2]) {
    const screw = new THREE.Mesh(new THREE.CylinderGeometry(.004,.004,.0015,12),edge);
    screw.name='mounting screw'; screw.rotation.x=Math.PI/2; screw.position.set(x,center+y,-d*.575); group.add(screw);
  }
  box('rear connection recess',.17,.14,.004,w*.30,lift+h*.30,-d*.59,inset,.002);
  for(let i=0;i<3;i++) box('connector detail',.024,.013,.001,w*.30,lift+h*.26+i*.028,-d*.70,edge);
  box('power recess',.032,.023,.002,-w*.32,lift+h*.26,-d*.60,inset);
  const logoCanvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
  if(logoCanvas) {
    logoCanvas.width=512; logoCanvas.height=96;
    const ctx=logoCanvas.getContext('2d');
    if(ctx){ctx.fillStyle='#b6bcc2';ctx.font='600 45px sans-serif';ctx.textAlign='center';ctx.fillText('SAMSUNG',256,60);
      const logo=new THREE.CanvasTexture(logoCanvas);logo.colorSpace=THREE.SRGBColorSpace;
      const plaque=new THREE.Mesh(new THREE.PlaneGeometry(.065,.012),new THREE.MeshBasicMaterial({map:logo,transparent:true,depthWrite:false}));
      plaque.position.set(w*.40,lift+.006,d/2+.0025);group.add(plaque);
    }
  }
  return group;
}

export function disposeTelevision(root) {
  const geometries=new Set(),materials=new Set(),textures=new Set();
  root.traverse(obj=>{if(obj.geometry)geometries.add(obj.geometry);if(obj.material)for(const m of Array.isArray(obj.material)?obj.material:[obj.material])materials.add(m);});
  for(const m of materials) for(const value of Object.values(m)) if(value?.isTexture) textures.add(value);
  geometries.forEach(g=>g.dispose());textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());
}
