import {createGpsCorrection} from './slam-gps.js';
import * as THREE from 'three';
// XR Engine binary kept unmodified in xr8/ with its LICENSE and copyright.
export function createSpatial({onStart,onPose,onStop,isReady}){
 const button=document.querySelector('#spatial-toggle'),status=document.querySelector('#spatial-status');
 let gpsFault=null,sessionMeta=null;let gpsWatch=null,gpsEngine=null,rawSlam=null,lastMoving=0,events=[],recording=false,lastRecorded=0;
 let active=false,poseValue=null,run=0,canvas=null,watchdog=null;
 function stop(message='Movimento espacial terminado.'){
  run++;if(gpsWatch!==null)navigator.geolocation?.clearWatch(gpsWatch);gpsWatch=null;recording=false;document.querySelector('#spatial-export').disabled=!events.length;document.querySelector('#spatial-mode').disabled=false;document.querySelector('#spatial-place').disabled=false;active=false;poseValue=null;clearInterval(watchdog);watchdog=null;
  try{window.XR8?.stop();window.XR8?.clearCameraPipelineModules();}catch(e){console.warn(e);}
  canvas?.remove();canvas=null;document.body.classList.remove('spatial-active');
  button.textContent='Iniciar movimento espacial';button.setAttribute('aria-pressed','false');status.textContent=message;onStop();
 }
 button.onclick=()=>{
  if(active){stop();return;}if(!isReady())return;
  const XR8=window.XR8;
  if(!isSecureContext){status.textContent='Abre a ligação HTTPS para usar a câmara.';return;}
  if(!XR8?.XrController){status.textContent='O motor espacial ainda está a carregar. Aguarda e toca novamente.';return;}
  const token=++run;active=true;const mode=document.querySelector('#spatial-mode').value;recording=document.querySelector('#spatial-record').checked;events=[];document.querySelector('#spatial-mode').disabled=true;document.querySelector('#spatial-place').disabled=true;gpsEngine=null;gpsFault=null;sessionMeta={mode,place:document.querySelector('#spatial-place').value,start:document.querySelector('#spatial-start').value};rawSlam=null;lastMoving=performance.now();lastRecorded=0;button.textContent='Cancelar movimento espacial';button.setAttribute('aria-pressed','true');
  const base=onStart();
  if(mode==='slam-gps'){
   gpsEngine=createGpsCorrection({mode:document.querySelector('#spatial-place').value,route:window.spatialGeoRoute});
   if(navigator.geolocation)gpsWatch=navigator.geolocation.watchPosition(p=>{if(token!==run)return;gpsFault=null;const g={lat:p.coords.latitude,lng:p.coords.longitude,accuracy:p.coords.accuracy,stamp:p.timestamp};gpsEngine.gps(g,rawSlam,Date.now());if(recording&&events.length<20000)events.push({type:'gps',t:performance.now(),...g});},e=>{if(token!==run)return;gpsFault=e.code===1?'GPS recusado; SLAM continua.':'GPS indisponível; SLAM continua.';document.querySelector('#spatial-gps-status').textContent=gpsFault;},{enableHighAccuracy:true,maximumAge:0,timeout:20000});
   else document.querySelector('#spatial-gps-status').textContent='Sem GPS; SLAM continua.';
  }else document.querySelector('#spatial-gps-status').textContent='Só SLAM · sem pedido de localização.';document.body.classList.add('spatial-active');
  status.textContent='Autoriza a câmara e movimento. Move o telefone suavemente para a frente e para trás para determinar a escala.';
  let origin=null,rotation=null,previous=null,last=null,lastGood=performance.now(),ui=0;
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
     if(previous&&Math.hypot(p.x-previous.x,p.z-previous.z)>.005)lastMoving=t;const dt=last===null?0:(t-last)/1000;previous=p.clone();last=t;const delta=p.clone().sub(origin).applyQuaternion(rotation);delta.y=0;
     const position=base.position.clone().add(delta);
     rawSlam={x:position.x,z:position.z};
     if(gpsEngine){const corrected=gpsEngine.update(rawSlam,dt,Date.now(),t-lastMoving<500);position.x=corrected.x;position.z=corrected.z;const d=gpsEngine.diagnostics();document.querySelector('#spatial-gps-status').textContent=gpsFault||((d.accuracy===null?'GPS a aguardar':('GPS ±'+d.accuracy.toFixed(1)+' m'))+' · '+d.reason+' · correção '+d.correctionMetres.toFixed(2)+' m');}
     if(recording&&t-lastRecorded>200){lastRecorded=t;if(events.length<20000)events.push({type:'pose',t,rawSlam:{...rawSlam},presented:position.toArray(),gps:gpsEngine?.diagnostics()??null});else {recording=false;document.querySelector('#spatial-gps-status').textContent+=' · Registo cheio';}}
     poseValue={position,quaternion:rotation.clone().multiply(q)};onPose(poseValue);
     if(t-ui>200){ui=t;status.textContent=`${mode==='slam-gps'?'SLAM + GPS':'SLAM'} · ${delta.length().toFixed(2)} m desde o início · escala absoluta experimental`;}
    }
   }]);
   const result=XR8.run({canvas,allowedDevices:XR8.XrConfig.device().MOBILE});
   result?.catch?.(e=>fail('Não foi possível iniciar: '+e.message));
  }catch(e){fail('Não foi possível iniciar: '+e.message);}
 };
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&active)stop('Ensaio terminado ao sair da página. Recomeça.');});
 window.addEventListener('pagehide',()=>{if(active)stop();});
 document.querySelector('#spatial-export').onclick=()=>{if(!events.length)return;const url=URL.createObjectURL(new Blob([JSON.stringify({schema:'cem-slam-gps-v2',events,...sessionMeta,exportedAt:new Date().toISOString()})],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='cem-slam-'+Date.now()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 return {active:()=>active,stop,pose:()=>poseValue};
}

