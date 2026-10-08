import * as THREE from 'three';
export const pathSegments=points=>points.slice(1).map((p,i)=>p.distanceTo(points[i]));
export function pathPosition(points,segments,distance){
 let remaining=Math.max(0,distance);
 for(let i=0;i<segments.length;i++){
  if(remaining<=segments[i]||i===segments.length-1)return points[i].clone().lerp(points[i+1],THREE.MathUtils.clamp(remaining/segments[i],0,1));
  remaining-=segments[i];
 }
 return points[0].clone();
}
export function createPlanner({canvas,camera,scene,bounds,height,canEdit,onUse,onOriginal}){
 const $=id=>document.getElementById(id),group=new THREE.Group();scene.add(group);
 let drawing=false,draft=[],active=null,pointer=null;
 const ray=new THREE.Raycaster(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),-height);
 function redraw(){
  for(const child of [...group.children]){group.remove(child);child.geometry.dispose();child.material.dispose();}
  const points=drawing?draft:active;
  if(points?.length){
   const material=new THREE.LineBasicMaterial({color:drawing?0xf18b29:0x197a59,depthTest:false});
   const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),material);line.renderOrder=10;group.add(line);
   for(const [i,p]of points.entries()){if(i!==0&&i!==points.length-1)continue;const m=new THREE.Mesh(new THREE.SphereGeometry(.4,12,8),new THREE.MeshBasicMaterial({color:i===0?0x197a59:0xf18b29,depthTest:false}));m.position.copy(p);m.renderOrder=11;group.add(m);}
  }
  $('draw-route').hidden=drawing;$('undo-route').hidden=!drawing;$('use-route').hidden=!drawing;$('cancel-route').hidden=!drawing;
  $('undo-route').disabled=!draft.length;$('use-route').disabled=draft.length<2;
  $('original-route').hidden=!active;
  $('planner-status').textContent=drawing?draft.length<2?'Toca em dois ou mais pontos, ou arrasta para traçar.':`${draft.length} pontos · ${pathSegments(draft).reduce((a,b)=>a+b,0).toLocaleString('pt-PT',{maximumFractionDigits:1})} m · pronto para usar.`:active?'Percurso personalizado ativo. Podes desenhar outro ou voltar a P01–P03.':'Desenha na planta o percurso que queres percorrer.';
  canvas.classList.toggle('drawing-route',drawing);
 }
 function addPoint(e){
  const rect=canvas.getBoundingClientRect();ray.setFromCamera(new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,1-(e.clientY-rect.top)/rect.height*2),camera);
  const p=ray.ray.intersectPlane(plane,new THREE.Vector3());
  if(!p||p.x<bounds.minX||p.x>bounds.maxX||p.z<bounds.minZ||p.z>bounds.maxZ||draft.length>=500)return;
  if(!draft.length||p.distanceTo(draft.at(-1))>=.4){draft.push(p);redraw();}
 }
 $('draw-route').onclick=()=>{if(!canEdit())return;drawing=true;draft=[];redraw();};
 $('undo-route').onclick=()=>{draft.pop();redraw();};
 $('cancel-route').onclick=()=>{drawing=false;draft=[];pointer=null;redraw();};
 $('use-route').onclick=()=>{if(!canEdit()||draft.length<2)return;active=draft.map(p=>p.clone());drawing=false;pointer=null;redraw();onUse(active);};
 $('original-route').onclick=()=>{if(!canEdit())return;active=null;draft=[];drawing=false;pointer=null;redraw();onOriginal();};
 canvas.addEventListener('pointerdown',e=>{if(!drawing||!canEdit()||pointer!==null)return;e.preventDefault();pointer=e.pointerId;canvas.setPointerCapture(pointer);addPoint(e);});
 canvas.addEventListener('pointermove',e=>{if(drawing&&canEdit()&&pointer===e.pointerId)addPoint(e);});
 for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,e=>{if(pointer===e.pointerId)pointer=null;});
 return {setView(plan){group.visible=plan&&canEdit();if(!plan){drawing=false;draft=[];pointer=null;}for(const id of ['draw-route','original-route'])$(id).disabled=!canEdit();redraw();},state:()=>({drawing,draft:draft.map(p=>p.toArray()),active:active?.map(p=>p.toArray())??null})};
}
