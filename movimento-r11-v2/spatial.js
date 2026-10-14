import * as THREE from 'three';

// Local metric tracking. No GPS, step length or geographic alignment is inferred.
export function createSpatial({onStart,onPose,onStop,isReady}){
 const button=document.querySelector('#spatial-toggle'),status=document.querySelector('#spatial-status');
 let generation=0,session=null,gl=null,active=false,pending=false,poseValue=null;
 function stop(message='Tracking espacial terminado.'){
  generation++;const old=session;session=null;pending=false;active=false;poseValue=null;
  old?.end().catch(()=>{});gl?.getExtension('WEBGL_lose_context')?.loseContext();gl=null;
  document.body.classList.remove('spatial-active');button.textContent='Iniciar movimento espacial';button.setAttribute('aria-pressed','false');
  status.textContent=message;onStop();
 }
 async function start(){
  if(active||pending){stop();return;}
  if(!isReady())return;
  if(!window.isSecureContext||!navigator.xr){status.textContent='Este browser não disponibiliza WebXR espacial. Safari/iPhone ainda precisa de uma integração própria. Os controlos manuais e GPS continuam disponíveis.';return;}
  const run=++generation;pending=true;button.textContent='Cancelar início';status.textContent='Autoriza a câmara e aponta o telefone no sentido da visita.';
  try{
   const xr=await navigator.xr.requestSession('immersive-ar',{requiredFeatures:['local','dom-overlay'],domOverlay:{root:document.body}});
   if(run!==generation){await xr.end();return;}
   session=xr;xr.addEventListener('end',()=>{if(run===generation)stop();});
   if(!xr.domOverlayState)throw Error('Sem suporte de interface sobre WebXR.');
   const canvas=document.createElement('canvas');gl=canvas.getContext('webgl',{xrCompatible:true,alpha:true});
   if(!gl)throw Error('Não foi possível iniciar WebXR.');
   await gl.makeXRCompatible();if(run!==generation)return;
   xr.updateRenderState({baseLayer:new XRWebGLLayer(xr,gl)});
   const space=await xr.requestReferenceSpace('local');if(run!==generation)return;
   space.addEventListener('reset',()=>{if(run===generation)stop('A origem mudou. Recomeça para alinhar o mundo.');});
   const base=onStart();pending=false;active=true;document.body.classList.add('spatial-active');
   button.textContent='Terminar movimento espacial';button.setAttribute('aria-pressed','true');
   let origin=null,rotation=null,previous=null,last=null,missingSince=null,lastUi=0;
   const started=performance.now();
   function frame(t,f){
    if(run!==generation)return;
    xr.requestAnimationFrame(frame);
    gl.bindFramebuffer(gl.FRAMEBUFFER,xr.renderState.baseLayer.framebuffer);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    const pose=f.getViewerPose(space);
    if(!pose||pose.emulatedPosition){
     poseValue=null;missingSince??=t;status.textContent='Tracking suspenso. Mantém a câmara voltada para detalhes do ambiente.';
     if(origin||t-missingSince>10000)stop('Tracking perdido. Recomeça para definir uma nova origem.');return;
    }
    missingSince=null;
    const p=new THREE.Vector3(pose.transform.position.x,pose.transform.position.y,pose.transform.position.z);
    const q=new THREE.Quaternion(pose.transform.orientation.x,pose.transform.orientation.y,pose.transform.orientation.z,pose.transform.orientation.w);
    if(![...p.toArray(),...q.toArray()].every(Number.isFinite)){stop('Posição inválida. Recomeça.');return;}
    if(!origin){
     const forward=new THREE.Vector3(0,0,-1).applyQuaternion(q),virtual=new THREE.Vector3(0,0,-1).applyQuaternion(base.quaternion);
     if(Math.hypot(forward.x,forward.z)<.3){status.textContent='Mantém o telefone na vertical, apontado no sentido da visita.';return;}
     const angle=Math.atan2(virtual.x,-virtual.z)-Math.atan2(forward.x,-forward.z);
     rotation=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),-angle);origin=p.clone();
    }
    if(last!==null&&(t-last>500||p.distanceTo(previous)>Math.max(.25,3*(t-last)/1000))){stop('Interrupção ou salto de posição. Recomeça para alinhar a origem.');return;}
    previous=p.clone();last=t;
    const delta=p.clone().sub(origin).applyQuaternion(rotation);
    if(delta.length()>15||t-started>120000){stop('Limite experimental: 15 metros ou dois minutos. Recomeça para continuar.');return;}
    // Keep eye height fixed; physical horizontal translation and rotation are tracked.
    delta.y=0;
    const position=base.position.clone().add(delta);
    if(position.x < -100||position.x>34||position.z< -75||position.z>90){stop('Chegaste ao limite do espaço de ensaio.');return;}
    poseValue={position,quaternion:rotation.clone().multiply(q)};onPose(poseValue);
    if(t-lastUi>200){lastUi=t;status.textContent=`Movimento espacial · ${delta.length().toFixed(2)} m desde o início · experimental`;}
   }
   xr.requestAnimationFrame(frame);
  }catch(e){if(run===generation)stop(e.name==='NotAllowedError'?'Acesso ao tracking recusado.':`Tracking indisponível: ${e.message}`);}
 }
 button.onclick=start;
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&(active||pending))stop('Ensaio terminado ao sair da página. Recomeça para alinhar a origem.');});
 window.addEventListener('pagehide',()=>stop());
 return {stop,active:()=>active||pending,pose:()=>poseValue};
}
