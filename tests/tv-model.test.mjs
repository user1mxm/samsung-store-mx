import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { tvProfile, preferredViewerProduct } from '../src/lib/tv-model.mjs';
import { buildTelevision, disposeTelevision } from '../src/lib/tv-geometry.mjs';

test('the 75-inch DU8000 exterior follows documented dimensions and stand span',()=>{
  const p=tvProfile({model:'UN75DU8000FXZX'});
  assert.equal(p.documented,true);assert.equal(p.width,1.6767);assert.equal(p.height,.9603);assert.equal(p.depth,.0266);
  const group=buildTelevision(p,new THREE.Texture());
  const bounds=new THREE.Box3().setFromObject(group);const size=bounds.getSize(new THREE.Vector3());
  assert.ok(Math.abs(size.x-p.width)<.001);assert.ok(Math.abs(size.y-p.totalHeight)<.005);
  assert.equal(group.children.filter(m=>m.name==='flat lift foot').length,2);
  assert.ok(Math.abs(size.z-p.standDepth)<.001);
  assert.equal(group.children.filter(m=>m.name==='mounting screw').length,4);
  disposeTelevision(group);
});
test('an unrelated size or unknown model never inherits verified 75-inch specifications',()=>{
  for(const model of ['UN65DU8000','QN77S90D','FAKE-UN75DU8000','']){
    const p=tvProfile({model});assert.equal(p.documented,false);assert.equal(p.reference,null);assert.equal(p.vesa,null);
  }
  assert.equal(preferredViewerProduct([{id:1,model:'RF29DB9950',name:'Refrigerador'},{id:2,model:'UN75DU8000'}]).id,2);
  assert.equal(preferredViewerProduct([{model:'RF29DB9950',name:'Refrigerador'}]),undefined);
});
