import * as THREE from 'three';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {createPhone} from './phone.js?v=1.4';
import {moveFree,projectToRoute} from './manual.js';
import {createPlanner,pathSegments,pathPosition} from './planner.js';
const $=s=>document.querySelector(s),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const scene=new THREE.Scene();scene.background=new THREE.Color('#c6deeb');scene.fog=new THREE.Fog('#c6deeb',100,240);
const camera=new THREE.PerspectiveCamera(72,innerWidth/innerHeight,.05,500);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.3;$('#viewport').append(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xe8f4ff,0x7a8168,2.4));const sun=new THREE.DirectionalLight(0xfff6df,2.5);sun.position.set(-30,80,35);scene.add(sun);
let model,route,points,segments,total,travel=0,yaw=-Math.PI/2,pitch=-.06,view='walk',playing=false,hold=0,ready=false,referenceSphere,referenceToken=0;
let phone=null,manualMode='route',customPoints=null,customSegments=null,planner=null;
const routePoints=()=>customPoints&&!phone?.active()?customPoints:points;
const routeSegments=()=>customPoints&&!phone?.active()?customSegments:segments;
const routeLength=()=>routeSegments().reduce((a,b)=>a+b,0);
const freePosition=new THREE.Vector3(),padPointers=new Map();
const bounds={minX:-100,maxX:34,minZ:-75,maxZ:90};
function navigationUI(){
 $('#manual-mode option[value=route]').textContent=customPoints&&!phone?.active()?'Percurso guiado · personalizado':'Percurso guiado · P01–P03';
 $('#guided-controls .stops').hidden=Boolean(customPoints&&!phone?.active());
 $('#edit-route').disabled=Boolean(phone?.active());
 $('#guided-controls').hidden=manualMode!=='route';
 $('#direction-pad').hidden=manualMode!=='arrows'||view!=='walk'||phone?.active();
 $('#manual-mode').value=manualMode;
 $('#manual-hint').textContent=manualMode==='keyboard'?'W/S: em frente e atrás · A/D: de lado. Arrasta para olhar.':manualMode==='arrows'?'Mantém uma seta premida para andar. Arrasta o modelo para olhar.':'Segue o percurso com os controlos abaixo.';
 $('#hint').textContent=view==='plan'?'Vista de cima da posição atual':manualMode==='keyboard'&&view==='walk'?'WASD para andar · arrasta para olhar':'Arrasta para olhar à volta';
 document.dispatchEvent(new Event('navigationmodechange'));
}
function clearMovement(){keys.clear();padPointers.clear();for(const b of document.querySelectorAll('#direction-pad .held'))b.classList.remove('held');hold=0;playing=false;}
function setManualMode(mode){
 if(!ready||phone?.active())return;
 clearMovement();
 if(manualMode==='route'&&mode!=='route')freePosition.copy(positionAt(travel));
 if(manualMode!=='route'&&mode==='route')travel=projectToRoute(freePosition,routePoints(),routeSegments());
 manualMode=mode;setView('walk');navigationUI();updateUI();
}
$('#manual-mode').onchange=e=>setManualMode(e.target.value);
let wasTracking=false;
new MutationObserver(()=>{
 if(!ready||!phone)return;
 const tracking=phone.active();
 if(wasTracking&&!tracking&&customPoints)travel=projectToRoute(pathPosition(points,segments,travel),customPoints,customSegments);
 wasTracking=tracking;navigationUI();updateUI();planner?.setView(view==='plan');
}).observe($('#gps-toggle'),{attributes:true,attributeFilter:['aria-pressed']});
for(const b of document.querySelectorAll('[data-direction]')){
 b.addEventListener('pointerdown',e=>{if(!ready||manualMode!=='arrows'||view!=='walk'||phone?.active())return;e.preventDefault();b.setPointerCapture(e.pointerId);padPointers.set(e.pointerId,b.dataset.direction);b.classList.add('held');});
 for(const type of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(type,e=>{padPointers.delete(e.pointerId);b.classList.remove('held');});
}
document.addEventListener('visibilitychange',()=>{if(document.hidden)clearMovement();});

const routeGroup=new THREE.Group();scene.add(routeGroup);const textureLoader=new THREE.TextureLoader();const textures=new Map();
function positionAt(distance){return pathPosition(routePoints(),routeSegments(),distance);}
function nearest(){const pos=manualMode==='route'?positionAt(travel):freePosition;return points.map((p,i)=>({d:p.distanceToSquared(pos),i})).sort((a,b)=>a.d-b.d)[0].i;}
function stopName(){if(customPoints&&!phone?.active())return 'Personalizado';if(travel<.05)return 'P01';if(Math.abs(travel-segments[0])<.05)return 'P02';if(total-travel<.05)return 'P03';return travel<segments[0]?'P01 → P02':'P02 → P03';}
function updateUI(){if(!ready)return;$('#progress').value=Math.round(travel/routeLength()*1000);$('#distance').textContent=`${travel.toLocaleString('pt-PT',{maximumFractionDigits:1,minimumFractionDigits:1})} / ${routeLength().toLocaleString('pt-PT',{maximumFractionDigits:1})} m`;$('#position').textContent=view==='reference'?`Referência · P0${nearest()+1}`:stopName();if(manualMode!=='route'&&view!=='reference'){$('#position').textContent='Livre';$('#distance').textContent=`${freePosition.distanceTo(points[0]).toLocaleString('pt-PT',{maximumFractionDigits:1})} m de P01`;}$('#play').textContent=playing?'Ⅱ Pausar':'▶ Percorrer';$('#play').setAttribute('aria-pressed',String(playing));}
function setTravel(value){if(!ready)return;travel=clamp(value,0,routeLength());if(view==='reference')setView('walk');updateUI();}
async function showReference(){const token=++referenceToken;const i=nearest();if(!customPoints||phone?.active())travel=[0,segments[0],total][i];updateUI();$('#loading').hidden=false;$('#loading').textContent='A carregar o render de referência…';try{let tex=textures.get(i);if(!tex){tex=await textureLoader.loadAsync(route.stops[i].image);tex.colorSpace=THREE.SRGBColorSpace;textures.set(i,tex);}if(token!==referenceToken||view!=='reference')return;if(!referenceSphere){const geometry=new THREE.SphereGeometry(120,64,32);geometry.scale(-1,1,1);referenceSphere=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({depthWrite:false,toneMapped:false}));scene.add(referenceSphere);}referenceSphere.material.map=tex;referenceSphere.material.needsUpdate=true;referenceSphere.position.copy(points[i]);referenceSphere.rotation.y=route.stops[i].reference_rotation_rad??0;referenceSphere.visible=true;}catch(e){$('#notice').textContent='Não foi possível carregar o render D5.';setView('walk');console.error(e);}finally{if(token===referenceToken)$('#loading').hidden=true;}}
function setView(mode){if(!ready)return;clearMovement();if(phone?.active()){manualMode='route';travel=clamp(travel,0,total);}if(mode!=='reference')$('#loading').hidden=true;view=mode;playing=false;hold=0;referenceToken++;if(referenceSphere)referenceSphere.visible=false;model.visible=mode!=='reference';routeGroup.visible=mode==='plan';scene.fog=mode==='reference'?null:new THREE.Fog('#c6deeb',100,240);for(const id of ['walk','plan','reference'])$('#'+id).setAttribute('aria-pressed',String(mode===id));$('.controls').classList.toggle('planning',mode==='plan');$('#route-planner').hidden=mode!=='plan';planner?.setView(mode==='plan');if(mode==='plan')document.dispatchEvent(new Event('expandcontrols'));navigationUI();if(mode==='reference')showReference();updateUI();}
$('#help').onclick=()=>{const panel=$('#help-panel');$('#tracking-options').hidden=true;$('#location-toggle').setAttribute('aria-expanded','false');panel.hidden=!panel.hidden;$('#help').setAttribute('aria-expanded',String(!panel.hidden));};
for(const id of ['walk','plan','reference'])$('#'+id).onclick=()=>setView(id);
$('#edit-route').onclick=()=>setView('plan');
$('#progress').addEventListener('input',e=>{playing=false;setTravel(Number(e.target.value)/1000*routeLength());});
document.querySelectorAll('[data-stop]').forEach(b=>b.onclick=()=>{playing=false;const mode=view;setTravel([0,segments[0],total][Number(b.dataset.stop)]);if(mode==='reference')setView('reference');});
$('#play').onclick=()=>{if(view==='reference')setView('walk');if(travel>=routeLength()-.01)travel=0;playing=!playing;updateUI();};
$('#reset').onclick=()=>{clearMovement();setTravel(0);freePosition.copy(points[0]);yaw=-Math.PI/2;pitch=-.06;setView('walk');};
for(const [id,direction]of [['back',-1],['forward',1]]){const b=$('#'+id);b.addEventListener('pointerdown',e=>{if(!ready)return;e.preventDefault();b.setPointerCapture(e.pointerId);if(view==='reference')setView('walk');playing=false;hold=direction;});for(const type of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(type,()=>hold=0);}
const keys=new Set();addEventListener('keydown',e=>{if(e.target.matches('input,textarea,select,[contenteditable]')||view==='reference'||!ready)return;const key=e.key.length===1?e.key.toLowerCase():e.key;if(['w','s','a','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(key)){keys.add(key);e.preventDefault();}});addEventListener('keyup',e=>keys.delete(e.key.length===1?e.key.toLowerCase():e.key));addEventListener('blur',()=>{clearMovement();updateUI();});
let drag=null;const canvas=renderer.domElement;canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);drag={id:e.pointerId,x:e.clientX,y:e.clientY};});canvas.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id||view==='plan')return;yaw-=(e.clientX-drag.x)*.004;pitch=clamp(pitch-(e.clientY-drag.y)*.003,-1.4,1.4);drag.x=e.clientX;drag.y=e.clientY;});for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,()=>drag=null);
const target=new THREE.Vector3();let last=performance.now(),frameStats={count:0,start:last,fps:0};
function frame(now){const dt=Math.min((now-last)/1000,.06);last=now;if(ready){if(view!=='reference'){const gpsTarget=phone?.target();if(gpsTarget!==null&&gpsTarget!==undefined){const delta=gpsTarget-travel;setTravel(travel+Math.sign(delta)*Math.min(Math.abs(delta),dt*(phone?.experimental()?4:1.5)));}phone?.present?.(travel);const moving=(manualMode==='route'&&!phone?.active()?1:0)*(hold+(keys.has('w')||keys.has('ArrowUp')?1:0)-(keys.has('s')||keys.has('ArrowDown')?1:0)+(playing?1:0));if(moving){setTravel(travel+moving*dt);if(travel>=routeLength()||travel<=0){playing=false;updateUI();}}if(manualMode==='route')yaw+=(keys.has('a')||keys.has('ArrowLeft')?dt:0)-(keys.has('d')||keys.has('ArrowRight')?dt:0);}
 if(manualMode!=='route'&&view==='walk'&&!phone?.active()){
 const directions=manualMode==='arrows'?new Set(padPointers.values()):new Set([...keys].map(k=>({w:'forward',s:'back',a:'left',d:'right',ArrowUp:'forward',ArrowDown:'back',ArrowLeft:'left',ArrowRight:'right'})[k]));
 const f=Number(directions.has('forward'))-Number(directions.has('back')),r=Number(directions.has('right'))-Number(directions.has('left'));
 const look=phone?.quaternion()??new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch,-yaw,0,'YXZ'));
 if(moveFree(freePosition,look,f,r,dt,bounds))updateUI();
 }
 const pos=view==='reference'?points[nearest()]:manualMode==='route'?positionAt(travel):freePosition;if(view==='plan'){const mid=points[0].clone().lerp(points[2],.5);camera.position.copy(mid).add(new THREE.Vector3(0,43,.01));camera.up.set(0,0,-1);camera.lookAt(mid);marker.position.copy(pos).setY(pos.y+.8);}else{camera.up.set(0,1,0);camera.position.copy(pos);target.set(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch)).add(pos);camera.lookAt(target);const sensorLook=phone?.quaternion();if(sensorLook)camera.quaternion.copy(sensorLook);}
 renderer.render(scene,camera);frameStats.count++;if(now-frameStats.start>1000){frameStats.fps=frameStats.count*1000/(now-frameStats.start);frameStats.count=0;frameStats.start=now;}}
 requestAnimationFrame(frame);}
const marker=new THREE.Mesh(new THREE.SphereGeometry(.4,16,12),new THREE.MeshBasicMaterial({color:0x2077f0}));routeGroup.add(marker);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
new ResizeObserver(entries=>{document.documentElement.style.setProperty('--controls-height',`${entries[0].target.offsetHeight}px`);}).observe($('.controls'));
requestAnimationFrame(frame);
try{route=await(await fetch('./route.json')).json();points=route.stops.map(s=>new THREE.Vector3(...s.position));segments=[points[0].distanceTo(points[1]),points[1].distanceTo(points[2])];total=segments[0]+segments[1];document.documentElement.style.setProperty('--p02',`${segments[0]/total*100}%`);const gltf=await new GLTFLoader().loadAsync('./model.glb');model=gltf.scene;scene.add(model);
 const groundLine=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points.map(p=>p.clone().setY(p.y+.5))),new THREE.LineBasicMaterial({color:0x2ba977}));routeGroup.add(groundLine);for(const p of points){const m=new THREE.Mesh(new THREE.SphereGeometry(.3,16,12),new THREE.MeshBasicMaterial({color:0xe1a949}));m.position.copy(p);routeGroup.add(m);}routeGroup.visible=false;ready=true;planner=createPlanner({canvas:renderer.domElement,camera,scene,bounds,height:points[0].y,canEdit:()=>view==='plan'&&!phone?.active(),onUse:path=>{clearMovement();customPoints=path;customSegments=pathSegments(path);manualMode='route';travel=0;const d=path[1].clone().sub(path[0]);yaw=Math.atan2(d.x,-d.z);pitch=-.06;setView('walk');$('#manual-controls').open=true;},onOriginal:()=>{clearMovement();customPoints=null;customSegments=null;travel=0;manualMode='route';navigationUI();updateUI();}});planner.setView(false);freePosition.copy(points[0]);$('#manual-mode').disabled=false;navigationUI();phone=createPhone({getState:()=>({ready,total,fps:frameStats.fps,gps:route.gps,cumulative:[0,segments[0],total]}),setTravel,setView,lookQuaternion:()=>camera.quaternion.clone()});$('#gps-toggle').disabled=false;$('#motion-toggle').disabled=false;$('#loading').hidden=true;for(const id of ['progress','back','play','forward'])$('#'+id).disabled=false;updateUI();
 // Read-only inspection endpoint for local browser verification.
 window.prototypeDebug={state:()=>({ready,view,manualMode,customRoute:planner?.state(),guidedLength:ready?routeLength():0,freePosition:freePosition.toArray(),travel,total,position:camera.position.toArray(),fps:frameStats.fps,triangles:renderer.info.render.triangles,drawCalls:renderer.info.render.calls,quaternion:camera.quaternion.toArray(),tracking:phone?.phase(),motion:phone?.motionEnabled()}),setTravel,setView,setManualMode,setLook:(y,p)=>{yaw=y;pitch=p;},groundAt:(x,z)=>{const r=new THREE.Raycaster(new THREE.Vector3(x,30,z),new THREE.Vector3(0,-1,0));return r.intersectObject(model,true).slice(0,8).map(h=>({point:h.point.toArray(),material:h.object.material?.name}));},renderer,scene,camera};
}catch(e){console.error(e);$('#loading').textContent='O espaço 3D não carregou. Reabre o protótipo pelo servidor local.';$('#notice').textContent=e.message;}
