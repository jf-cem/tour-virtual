import {createGpsCorrection} from './slam-gps.js';
import * as THREE from 'three';
// Official XR Engine binary remains unmodified. Recovery never integrates unobserved motion.
export function createSpatial({onStart,onPose,onStop,isReady}){
 const $=id=>document.getElementById(id),button=$('spatial-toggle'),status=$('spatial-status');
 const resume=document.createElement('button');resume.id='spatial-resume';resume.hidden=true;button.after(resume);
 let active=false,poseValue=null,run=0,canvas=null,watchdog=null,gpsWatch=null,gpsEngine=null,rawSlam=null;
 let events=[],recording=false,sessionMeta={},mode='slam',phase='idle',gpsFault=null;
 const copy=p=>({position:p.position.clone(),quaternion:p.quaternion.clone()});
 function record(event){if(!recording)return;if(events.length>=20000){recording=false;sessionMeta.truncated=true;return;}events.push({t:performance.now(),...event});$('spatial-export').disabled=false;}
 function state(next,message){if(phase!==next)record({type:'state',from:phase,to:next,message});phase=next;document.body.dataset.walkPhase=next;status.textContent=message;resume.hidden=next!=='recalibrate';resume.textContent='Recalibrar e continuar daqui';}
 function cleanup(){run++;clearInterval(watchdog);watchdog=null;if(gpsWatch!==null)navigator.geolocation?.clearWatch(gpsWatch);gpsWatch=null;
  try{window.XR8?.stop();window.XR8?.clearCameraPipelineModules();}catch(e){console.warn(e);}canvas?.remove();canvas=null;active=false;document.body.classList.remove('spatial-active');button.setAttribute('aria-pressed','false');$('spatial-mode').disabled=false;
 }
 function stop(message='Caminhada terminada.') {record({type:'stop',position:poseValue?.position.toArray()});cleanup();state('idle',message);recording=false;onStop();}
 function interrupt(message){cleanup();state(poseValue?'recalibrate':'error',message);onStop();}
 function start(continuing=false){
  if(!isReady())return;const XR8=window.XR8;
  if(!isSecureContext||!XR8?.XrController){state('error',!isSecureContext?'Abre a ligação HTTPS para usar a câmara.':'O motor ainda está a carregar. Aguarda e tenta novamente.');return;}
  const saved=continuing&&poseValue?copy(poseValue):null;cleanup();
  if(!saved){mode=$('spatial-mode').value;events=[];recording=$('spatial-record').checked;sessionMeta={truncated:false,mode,place:'relative',start:'P01'};$('spatial-export').disabled=true;poseValue=null;}
  const base=saved||onStart();poseValue=copy(base);onPose(poseValue);
  const token=++run;active=true;gpsFault=null;rawSlam=null;gpsEngine=mode==='slam-gps'?createGpsCorrection({mode:'relative',route:window.spatialGeoRoute}):null;
  button.setAttribute('aria-pressed','true');$('spatial-mode').disabled=true;document.body.classList.add('spatial-active');
  state('calibrating','Aponta para uma zona com detalhes, como chão e fachadas. Evita o céu. Move suavemente o telemóvel para a frente e para trás.');
  record({type:saved?'resume':'start',base:base.position.toArray(),quaternion:base.quaternion.toArray(),gpsAnchorReset:Boolean(saved)});
  if(gpsEngine&&navigator.geolocation)gpsWatch=navigator.geolocation.watchPosition(p=>{if(token!==run)return;gpsFault=null;const g={lat:p.coords.latitude,lng:p.coords.longitude,accuracy:p.coords.accuracy,stamp:p.timestamp};gpsEngine.gps(g,rawSlam,Date.now());record({type:'gps',...g});},e=>{if(token!==run)return;gpsFault='GPS indisponível; o movimento continua.';record({type:'gps-error',code:e.code});$('spatial-gps-status').textContent=gpsFault;},{enableHighAccuracy:true,maximumAge:0,timeout:20000});
  $('spatial-gps-status').textContent=gpsEngine?'GPS a aguardar.':'Movimento com a câmara e os sensores.';
  let origin=null,rotation=null,previous=null,last=null,stableSince=null,candidate=null,recoverySince=null,lastMoving=0,lastSample=performance.now(),ui=0,log=0;
  const freeze=(t,message)=>{if(phase!=='recovering'){recoverySince=t;stableSince=null;candidate=null;state('recovering',message);}};
  const requireRecalibration=reason=>{record({type:'recalibration-required',reason});interrupt('A tua posição foi guardada. Fica parado e recalibra para continuar daqui.');};
  const anchor=(p,q)=>{const forward=new THREE.Vector3(0,0,-1).applyQuaternion(q),virtual=new THREE.Vector3(0,0,-1).applyQuaternion(base.quaternion);
   if(Math.hypot(forward.x,forward.z)<.3)return false;
   const angle=Math.atan2(virtual.x,-virtual.z)-Math.atan2(forward.x,-forward.z);rotation=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),-angle);origin=p.clone();return true;};
  canvas=document.createElement('canvas');canvas.width=640;canvas.height=480;canvas.style.cssText='position:fixed;inset:0;width:100%;height:100%;z-index:-1;pointer-events:none';document.body.append(canvas);
  watchdog=setInterval(()=>{if(token!==run)return;const t=performance.now();if(origin&&t-lastSample>700)freeze(t,'A recuperar o movimento. Para um momento e aponta para uma zona com detalhes.');if(origin&&phase==='recovering'&&t-recoverySince>6000)requireRecalibration('timeout');},500);
  try{
   XR8.XrController.configure({disableWorldTracking:false,scale:'absolute',enableWorldPoints:false,enableLighting:false});
   window.CoachingOverlay?.configure({promptText:'Move suavemente o telemóvel para a frente e para trás',disablePrompt:false});
   XR8.addCameraPipelineModules([XR8.XrController.pipelineModule(),...(window.CoachingOverlay?[window.CoachingOverlay.pipelineModule()]:[]),{
    name:'cem-local-motion',
    listeners:[{event:'coaching-overlay.show',process:()=>{if(token===run)record({type:'calibration-guidance',visible:true});}},{event:'coaching-overlay.hide',process:()=>{if(token===run)record({type:'calibration-guidance',visible:false});}}],
    onException:e=>{if(token!==run)return;record({type:'exception',message:e?.message||String(e)});interrupt('Não foi possível acompanhar o movimento. Verifica as permissões e tenta novamente.');},
    onCameraStatusChange:({status:s})=>{if(token!==run)return;record({type:'camera',status:s});if(s==='failed')interrupt('A câmara não iniciou. Verifica as permissões e tenta novamente.');},
    onUpdate:({processCpuResult})=>{
     if(token!==run)return;const r=processCpuResult?.reality,t=performance.now();lastSample=t;
     if(t-log>200){log=t;record({type:'tracking',status:r?.trackingStatus??'MISSING',reason:r?.trackingReason??null,position:r?.position??null,rotation:r?.rotation??null,phase});}
     if(!r||r.trackingStatus!=='NORMAL'){stableSince=null;candidate=null;if(origin)freeze(t,'A recuperar o movimento. Para um momento e aponta para uma zona com detalhes.');return;}
     const p=new THREE.Vector3(r.position?.x,r.position?.y,r.position?.z),q=new THREE.Quaternion(r.rotation?.x,r.rotation?.y,r.rotation?.z,r.rotation?.w);
     if(![...p.toArray(),...q.toArray()].every(Number.isFinite)||q.lengthSq()<.5){if(origin)requireRecalibration('invalid-pose');return;}q.normalize();
     if(!origin){
      if(candidate&&(p.distanceTo(candidate)>.15)){stableSince=null;}candidate=p.clone();stableSince??=t;
      if(t-stableSince<500)return;if(!anchor(p,q)){status.textContent='Aponta o telemóvel em frente, aproximadamente na vertical.';return;}
      previous=p.clone();last=t;rawSlam={x:base.position.x,z:base.position.z};state('walking','Caminhada em curso.');return;
     }
     if(phase==='walking'&&(t-last>700||p.distanceTo(previous)>Math.max(.35,3*(t-last)/1000)))freeze(t,'A recuperar o movimento. Para um momento.');
     if(phase==='recovering'){
      // Same-origin recovery requires a short gap, a near pose and stable samples.
      if(t-last>2500||p.distanceTo(previous)>.35){requireRecalibration('gap-or-jump');return;}
      if(candidate&&p.distanceTo(candidate)>.06)stableSince=null;candidate=p.clone();stableSince??=t;if(t-stableSince<400)return;
      // Discard the unseen displacement and keep the displayed world pose exactly.
      const delta=p.clone().sub(origin).applyQuaternion(rotation);delta.y=0;
      const rawAtRecovery=base.position.clone().add(delta),shift=new THREE.Vector3(rawSlam.x-rawAtRecovery.x,0,rawSlam.z-rawAtRecovery.z).applyQuaternion(rotation.clone().invert());origin.sub(shift);
      previous=p.clone();last=t;record({type:'automatic-recovery',discardedMovement:true});state('walking','Caminhada em curso.');return;
     }
     const dt=(t-last)/1000;if(Math.hypot(p.x-previous.x,p.z-previous.z)>.005)lastMoving=t;previous=p.clone();last=t;
     const delta=p.clone().sub(origin).applyQuaternion(rotation);delta.y=0;const position=base.position.clone().add(delta);rawSlam={x:position.x,z:position.z};
     if(gpsEngine){const corrected=gpsEngine.update(rawSlam,dt,Date.now(),t-lastMoving<500);position.x=corrected.x;position.z=corrected.z;const d=gpsEngine.diagnostics();$('spatial-gps-status').textContent=gpsFault||`${d.accuracy===null?'GPS a aguardar':'GPS ±'+d.accuracy.toFixed(1)+' m'} · ${d.reason} · correção ${d.correctionMetres.toFixed(2)} m`;}
     poseValue={position,quaternion:rotation.clone().multiply(q)};onPose(poseValue);
     if(t-ui>200){ui=t;record({type:'pose',rawSlam:{...rawSlam},presented:position.toArray(),quaternion:poseValue.quaternion.toArray(),gps:gpsEngine?.diagnostics()??null});status.textContent=`${mode==='slam-gps'?'Movimento + GPS':'Movimento'} · caminhada em curso`;}
    }
   }]);
   XR8.run({canvas,allowedDevices:XR8.XrConfig.device().MOBILE})?.catch?.(e=>{if(token===run){record({type:'run-error',message:e.message});interrupt('Não foi possível iniciar. Verifica as permissões e tenta novamente.');}});
  }catch(e){record({type:'run-error',message:e.message});interrupt('Não foi possível iniciar. Verifica as permissões e tenta novamente.');}
 }
 button.onclick=()=>active?stop():start(false);resume.onclick=()=>start(true);
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&active)interrupt('A tua posição foi guardada. Recalibra para continuar daqui.');});window.addEventListener('pagehide',()=>{if(active)interrupt('A tua posição foi guardada.');});
 $('spatial-export').onclick=()=>{if(!events.length)return;const url=URL.createObjectURL(new Blob([JSON.stringify({schema:'cem-movement-v3',events,...sessionMeta,exportedAt:new Date().toISOString()})],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='cem-movimento-'+Date.now()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 return {active:()=>active,stop,pose:()=>poseValue,state:()=>phase};
}
