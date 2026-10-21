import * as THREE from 'three';
import {belongsToHouse} from './house-membership.mjs';
import {createPlatform} from './platform.mjs';
import {installSimpleDoor} from './door.js';
import {installInteriorLights} from './interior-lights.js';
export function createHouse(model){
 const pivot=[-44.93030,1.372316,-.13499],group=new THREE.Group();group.name='CeM_House_Rotation';group.position.fromArray(pivot);model.add(group);model.updateMatrixWorld(true);
 const nodes=[];model.traverse(o=>{if(belongsToHouse(o)&&o.parent===model)nodes.push(o);});
 // GLTFLoader may add a scene-level wrapper: use the highest matching ancestor only.
 if(!nodes.length)model.traverse(o=>{if(belongsToHouse(o)&&!belongsToHouse(o.parent||{name:''}))nodes.push(o);});
 for(const node of nodes)group.attach(node);
 const door=installSimpleDoor(group);
 const platform=createPlatform({pivot,floor:pivot[1],supportRadius:5,alignment:.0494897366,footprint:{minX:-2.95,maxX:2.87,minZ:-2.7,maxZ:2.7},portal:{x:2.87,minZ:.72,maxZ:1.75}});
 const materials=new Set();group.traverse(o=>{if(o.isMesh)for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);});
 const rgbLighting=installInteriorLights(group);
 const posterMaterials=new Set();model.traverse(o=>{if(o.isMesh)for(const m of Array.isArray(o.material)?o.material:[o.material])if(m.name.startsWith('Poster_Original_')&&m.map)posterMaterials.add(m);});
 const posters=[...posterMaterials].map(m=>({m,map:m.map})),images=[...new Set(posters.map(p=>p.map))];
 let angle=0,speed=0,elapsed=0,interval=8,automatic=false,index=0,order=images.map((_,i)=>i),lastRaw=null;
 function restorePosters(){for(const p of posters){p.m.map=p.map;p.m.needsUpdate=true;}index=0;elapsed=0;}
 function cycle(){index=(index+1)%order.length;posters.forEach((p,i)=>{p.m.map=images[order[(index+i)%order.length]];p.m.needsUpdate=true;});}
 function step(raw,dt,{manualInteriorEntry=false}={}){
  lastRaw=raw;const visible=!document.hidden;angle+=visible?speed*Math.min(dt,.06):0;group.rotation.y=angle;door.update(visible?Math.min(dt,.06):0);group.updateMatrixWorld(true);rgbLighting.update(visible?Math.max(0,dt):0);
  if(visible&&automatic){elapsed+=Math.max(0,dt);if(elapsed>=interval){elapsed%=interval;cycle();}}
  return platform.update(raw,angle,{canEnter:door.state().openness>.65,allowInteriorEntry:manualInteriorEntry});
 }
 return {step,group,platform,door,resetPose:raw=>platform.reset(raw,angle),setSpeed:degrees=>{speed=THREE.MathUtils.degToRad(Math.max(-12,Math.min(12,Number(degrees)||0)));},rgbLighting,setColor:rgbLighting.setColor,restoreColor:rgbLighting.restore,setRgbEnabled:rgbLighting.setEnabled,setRgbMode:rgbLighting.setMode,setRgbIntensity:rgbLighting.setIntensity,setPosters:(enabled,seconds=interval,sequence=order)=>{if(!Number.isFinite(seconds)||seconds<2)throw Error('Intervalo mínimo: 2 segundos');if(!sequence.length||sequence.some(i=>!Number.isInteger(i)||i<0||i>=images.length))throw Error('Ordem de imagens inválida');interval=seconds;order=[...sequence];automatic=enabled;elapsed=0;if(!enabled)restorePosters();},nextPoster:cycle,state:()=>({angle,speedDegrees:THREE.MathUtils.radToDeg(speed),pivot,rotationPivotStatus:'centro geométrico provisório da plataforma; eixo mecânico por confirmar',nodes:nodes.map(n=>n.name),rgbMaterials:rgbLighting.materials(),rgbLighting:rgbLighting.state(),posterMaterials:posters.map(p=>p.m.name),images:images.map((t,i)=>({id:i,name:t.name,width:t.image?.width,height:t.image?.height})),posterIndex:index,automatic,interval,order,raw:lastRaw,platform:platform.state(),door:door.state()})};
}
