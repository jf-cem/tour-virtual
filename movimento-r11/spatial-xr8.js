import * as THREE from 'three';
// XR Engine binary kept unmodified in xr8/ with its LICENSE and copyright.
export function createSpatial({onStart,onPose,onStop,isReady}){
 const button=document.querySelector('#spatial-toggle'),status=document.querySelector('#spatial-status');
 let active=false,poseValue=null,run=0,canvas=null,watchdog=null;
 function stop(message='Movimento espacial terminado.'){
  run++;active=false;poseValue=null;clearInterval(watchdog);watchdog=null;
  try{window.XR8?.stop();window.XR8?.clearCameraPipelineModules();}catch(e){console.warn(e);}
  canvas?.remove();canvas=null;document.body.classList.remove('spatial-active');
  button.textContent='Iniciar movimento espacial';button.setAttribute('aria-pressed','false');status.textContent=message;onStop();
 }
 button.onclick=()=>{
  if(active){stop();return;}if(!isReady())return;
  const XR8=window.XR8;
  if(!isSecureContext){status.textContent='Abre a ligação HTTPS para usar a câmara.';return;}
  if(!XR8?.XrController){status.textContent='O motor espacial ainda está a carregar. Aguarda e toca novamente.';return;}
  const token=++run;active=true;button.textContent='Cancelar movimento espacial';button.setAttribute('aria-pressed','true');
  const base=onStart();document.body.classList.add('spatial-active');
  status.textContent='Autoriza a câmara e movimento. Move o telefone suavemente para a frente e para trás para determinar a escala.';
  let origin=null,rotation=null,previous=null,last=null,lastGood=performance.now(),ui=0;const started=lastGood;
  canvas=document.createElement('canvas');canvas.width=640;canvas.height=480;
  canvas.style.cssText='position:fixed;left:0;top:0;width:100%;height:100%;z-index:-1;pointer-events:none';document.body.append(canvas);
  const fail=message=>{if(token===run)stop(message);};
  watchdog=setInterval(()=>{if(performance.now()-lastGood>15000)fail('Sem tracking fiável. Recomeça num ambiente iluminado e com detalhes.');},1000);
  try{
   XR8.XrController.configure({disableWorldTracking:false,scale:'absolute',enableWorldPoints:false,enableLighting:false});
   XR8.addCameraPipelineModules([XR8.XrController.pipelineModule(),{
    name:'cem-local-motion',
    onException:error=>fail('Erro no tracking: '+(error?.message||String(error))),
    onCameraStatusChange:({status:s})=>{if(s==='failed')fail('A câmara não iniciou. Verifica as permissões do Safari/Chrome.');},
    onUpdate:({processCpuResult})=>{
     if(token!==run)return;
     const r=processCpuResult?.reality,t=performance.now();
     if(!r||r.trackingStatus!=='NORMAL'){
      poseValue=null;if(origin)fail('Tracking perdido. Recomeça para definir nova origem.');return;
     }
     lastGood=t;const p=new THREE.Vector3(r.position.x,r.position.y,r.position.z),q=new THREE.Quaternion(r.rotation.x,r.rotation.y,r.rotation.z,r.rotation.w);
     if(![...p.toArray(),...q.toArray()].every(Number.isFinite)){fail('Posição inválida. Recomeça.');return;}
     if(!origin){
      const forward=new THREE.Vector3(0,0,-1).applyQuaternion(q),virtual=new THREE.Vector3(0,0,-1).applyQuaternion(base.quaternion);
      if(Math.hypot(forward.x,forward.z)<.3){status.textContent='Aponta o telefone em frente, aproximadamente na vertical.';return;}
      const angle=Math.atan2(virtual.x,-virtual.z)-Math.atan2(forward.x,-forward.z);
      rotation=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),-angle);origin=p.clone();
     }
     if(last!==null&&(t-last>1000||p.distanceTo(previous)>Math.max(.35,3*(t-last)/1000))){fail('Salto ou interrupção de tracking. Recomeça para alinhar a origem.');return;}
     previous=p.clone();last=t;const delta=p.clone().sub(origin).applyQuaternion(rotation);delta.y=0;
     if(delta.length()>15||t-started>120000){fail('Limite do ensaio: 15 metros ou dois minutos. Recomeça.');return;}
     const position=base.position.clone().add(delta);
     if(position.x< -100||position.x>34||position.z< -75||position.z>90){fail('Limite do espaço de ensaio.');return;}
     poseValue={position,quaternion:rotation.clone().multiply(q)};onPose(poseValue);
     if(t-ui>200){ui=t;status.textContent=`8th Wall · ${delta.length().toFixed(2)} m desde o início · escala absoluta experimental`;}
    }
   }]);
   const result=XR8.run({canvas,allowedDevices:XR8.XrConfig.device().MOBILE});
   result?.catch?.(e=>fail('Não foi possível iniciar: '+e.message));
  }catch(e){fail('Não foi possível iniciar: '+e.message);}
 };
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&active)stop('Ensaio terminado ao sair da página. Recomeça.');});
 window.addEventListener('pagehide',()=>{if(active)stop();});
 return {active:()=>active,stop,pose:()=>poseValue};
}
