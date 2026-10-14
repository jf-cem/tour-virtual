import * as THREE from 'three';
export function installR11(model,env,interior){
 const seen=new Set();model.traverse(o=>{if(!o.isMesh)return;for(const m of Array.isArray(o.material)?o.material:[o.material]){
  if(seen.has(m))continue;seen.add(m);
  if(m.name.startsWith('R11_Pavilion_')){m.envMap=(m.name.includes('Mirror')?interior:env)?.texture;m.envMapIntensity=m.name.includes('Glass')?.35:.7;m.needsUpdate=true;if(m.name.includes('Glass'))m.depthWrite=false;}
  if(m.name==='R6_House_Mirror_Approximate'){m.metalness=.99;m.roughness=.28;m.envMap=interior?.texture;m.envMapIntensity=.7;m.needsUpdate=true;}
 }});
}
