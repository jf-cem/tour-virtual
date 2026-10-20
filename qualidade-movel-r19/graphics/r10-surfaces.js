import {installWaveShader} from './r15-waves.js';
import * as THREE from 'three';
export async function installR10(model,ktx,env,interior,aux,renderer){
 let base,norm;model.traverse(o=>{if(o.isMesh)for(const m of Array.isArray(o.material)?o.material:[o.material])if(/^R10_.*Ground_Paving_STATIC_PBR/.test(m.name)){base=m.map;norm=m.normalMap}});
 for(const t of [base,norm]){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());t.channel=0;t.repeat.set(1,1)}base.colorSpace=THREE.SRGBColorSpace;norm.colorSpace=THREE.NoColorSpace;base.name='R10_Real_Aggregate_Albedo';norm.name='R10_Real_Aggregate_Normal';
 const converted=new Map();model.traverse(o=>{if(!o.isMesh)return;const convert=m=>{
  if(converted.has(m))return converted.get(m);
  if(/^R10_.*Ground_Paving_STATIC_PBR/.test(m.name)){
   const r14=!!m.userData.r14Calcada;const mb=r14?m.map:base,mn=r14?m.normalMap:norm;if(r14){for(const t of [mb,mn]){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());t.channel=0;t.repeat.set(1.8,1.8);t.rotation=0}mb.colorSpace=THREE.SRGBColorSpace;mn.colorSpace=THREE.NoColorSpace;}const light=m.emissiveMap;light.channel=1;const n=new THREE.MeshStandardMaterial({name:m.name.replace('STATIC_PBR','REAL_MAPS'),color:r14?new THREE.Color(1,1,1):new THREE.Color(.45,.445,.425),map:mb,normalMap:mn,normalScale:new THREE.Vector2(r14?.28:.17,r14?.28:.17),roughness:r14?.92:.90,metalness:0,lightMap:light,envMap:env.texture,envMapIntensity:.15});
   n.onBeforeCompile=s=>{s.fragmentShader=s.fragmentShader.replace('#include <lights_fragment_end>','#include <lights_fragment_end>\nvec3 worldDetailN=normalize(inverseTransformDirection(normal,viewMatrix));\nfloat subtleRelief=clamp(dot(worldDetailN,normalize(vec3(-30.,80.,35.)))/.88,.88,1.12);\nreflectedLight.directDiffuse=vec3(0.);reflectedLight.indirectDiffuse=texture2D(lightMap,vLightMapUv).rgb*diffuseColor.rgb*subtleRelief;')};const previous=n.onBeforeCompile;if(m.userData.r15Wave)n.onBeforeCompile=s=>{previous(s);installWaveShader(n,s)};n.customProgramCacheKey=()=>m.userData.r15Wave?'r15-polar-waves-v1':'r10-real-maps-irradiance-v1';converted.set(m,n);return n;
  }
  if(m.name.startsWith('R10_MUPI_')){m.envMap=(m.name.includes('Interior')?interior:env).texture;m.envMapIntensity=m.name.includes("Interior")?1.0:.7;m.normalMap=aux.normal;m.normalScale.set(.18,.18);m.roughnessMap=aux.roughness;m.roughness=.58;m.userData.roughnessRange=[.42,.60];m.onBeforeCompile=s=>{const source=THREE.ShaderChunk.roughnessmap_fragment,chunk=source.replace("roughnessFactor *= texelRoughness.g;","roughnessFactor = .42 + .18 * texelRoughness.g;");if(chunk===source)throw Error("R10 roughness chunk did not match");s.fragmentShader=s.fragmentShader.replace("#include <roughnessmap_fragment>",chunk);m.userData.roughnessRemapApplied=s.fragmentShader.includes("roughnessFactor = .42 + .18")};m.customProgramCacheKey=()=> "r10-painted-roughness-map-v3";if(m.map){m.map.wrapS=m.map.wrapT=THREE.RepeatWrapping;m.map.anisotropy=4}m.needsUpdate=true;return m}
  return m;
 };o.material=Array.isArray(o.material)?o.material.map(convert):convert(o.material)});
 return {base,norm};
}




