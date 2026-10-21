import * as THREE from 'three';
export function createPlanCamera({canvas,camera,isActive,isDrawing,getPosition}){
 const center=new THREE.Vector3(-27,1.4,0),initialHeight=36;
 let height=initialHeight,drag=null;
 const ray=new THREE.Raycaster(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),-center.y);
 function apply(){camera.position.copy(center).add(new THREE.Vector3(0,height,.01));camera.up.set(0,0,-1);camera.lookAt(center);camera.updateMatrixWorld(true);}
 function ground(x,y){const r=canvas.getBoundingClientRect();ray.setFromCamera(new THREE.Vector2((x-r.left)/r.width*2-1,1-(y-r.top)/r.height*2),camera);return ray.ray.intersectPlane(plane,new THREE.Vector3());}
 function zoom(factor,x,y){if(!isActive())return;apply();const before=x===undefined?null:ground(x,y);height=THREE.MathUtils.clamp(height*factor,6,160);apply();const after=before?ground(x,y):null;if(after){center.add(before.sub(after));apply();}}
 canvas.addEventListener('wheel',e=>{if(!isActive()||!e.ctrlKey)return;e.preventDefault();zoom(Math.exp(THREE.MathUtils.clamp(e.deltaY,-500,500)*.0015),e.clientX,e.clientY);},{passive:false});
 canvas.addEventListener('pointerdown',e=>{if(!isActive()||isDrawing()||e.button!==0)return;e.preventDefault();apply();const point=ground(e.clientX,e.clientY);if(!point)return;drag={id:e.pointerId,point};canvas.setPointerCapture(e.pointerId);});
 canvas.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId||!isActive()||isDrawing())return;apply();const p=ground(e.clientX,e.clientY);if(p){center.add(drag.point.clone().sub(p));apply();}});
 for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,e=>{if(drag?.id===e.pointerId)drag=null;});
 const controls=document.createElement('nav');controls.id='plan-camera-controls';controls.setAttribute('aria-label','Navegar na planta');controls.hidden=true;
 controls.innerHTML='<button id="plan-zoom-in" aria-label="Aproximar planta">+</button><button id="plan-zoom-out" aria-label="Afastar planta">−</button><button id="plan-center">Centrar em mim</button><button id="plan-reset">Repor planta</button><span>Arrasta para mover · Ctrl + roda para zoom</span>';
 document.body.append(controls);controls.querySelector('#plan-zoom-in').onclick=()=>zoom(.8);controls.querySelector('#plan-zoom-out').onclick=()=>zoom(1.25);
 controls.querySelector('#plan-center').onclick=()=>{const p=getPosition();center.x=p[0];center.z=p[2];apply();};controls.querySelector('#plan-reset').onclick=()=>{center.set(-27,1.4,0);height=initialHeight;apply();};
 return {apply,update(){controls.hidden=!isActive();canvas.classList.toggle('plan-panning',isActive()&&!isDrawing());},state:()=>({height,center:center.toArray(),initialHeight}),zoom};
}
