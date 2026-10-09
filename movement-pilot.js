const $=s=>document.querySelector(s);
const labels={'anchor-required':'Guarda o ponto inicial.','direction-required':'Escolhe Avançar ou Recuar para indicar o sentido da caminhada.','motion-unavailable':'Sem amostras de movimento recentes.','prediction-budget-exceeded':'Avanço suspenso: precisamos de uma leitura GPS útil para continuar.','explicit-reanchor-required':'Posição demasiado diferente ou sessão interrompida. Para e guarda novamente o início.','gps-invalid-or-old':'GPS inválido, antigo ou de baixa qualidade.','outside-route':'Fora da linha do teste ou GPS desviado.','gps-outlier':'Salto GPS rejeitado.','gps-unavailable':'Sem GPS recente.'};
export function createPilot({getState,setTravel,setView,legacy}){
 const core=window.CemMovement,sensors=window.cemSensors,recorder=core.createRecorder();
 let active=false,session=0,phase='idle',estimator=null,detector=null,projector=null,latestFix=null,unsub=null,unGps=null,timer=null,output=null,shown=0,mode='steps',start=0,params={},lastPresentation=0,lastDetail=0;
 const baselineClick=$('#gps-toggle').onclick;
 // Keep the actions beside the live status, outside the settings popover.
 const setup=document.createElement('div');setup.id='walking-setup';
 for(const id of ['confirm-anchor','axis-end','return-origin','direction-controls'])setup.append($('#'+id));
 const progress=document.createElement('p');progress.id='walking-feedback';setup.append(progress);
 $('#tracking-status').after(setup);
 function record(e){recorder.add(e);}
 function input(e){if(e.type!=='activity'&&e.type!=='step')record(e);output=estimator.input(e);return output;}
 function lock(value){for(const e of document.querySelectorAll('#progress,#back,#forward,#play,#reset,#manual-mode,[data-stop],#tracking-mode,#fusion-mode,#reference,#step-length'))e.disabled=value;}
 function ui(){if(!active)return;const needed=Math.max(8,2*((projector?.originAccuracy??latestFix?.accuracy??0)+(latestFix?.accuracy??0)));
 $('#tracking-status').textContent=phase==='anchoring'?'1. Fica parado. Quando recebermos GPS, toca em «Guardar início».':phase==='axis'?`2. Caminha em linha reta e marca o segundo ponto. Com este GPS, precisamos de cerca de ${Math.ceil(needed)} m de separação.`:phase==='returning'?'3. Regressa ao ponto inicial e toca em «Estou de volta ao início».':labels[output?.reason]||'A acompanhar a caminhada. Posição estimada; precisão por validar.';
 $('#confirm-anchor').hidden=phase!=='anchoring'||!latestFix;$('#axis-end').hidden=phase!=='axis';$('#direction-controls').hidden=phase!=='walking'||mode==='activity';if(latestFix)$('#gps-accuracy').textContent=`GPS ±${Math.round(latestFix.accuracy)} m`;
 if(phase==='walking')$('#walking-feedback').textContent=`${output?.steps??0} passos detetados · ${(output?.alongMeters??0).toFixed(1)} m estimados${output?.reason==='prediction-budget-exceeded'?' · A aguardar GPS útil; não é preciso iniciar de novo se o sinal recuperar.':''}`;
  const t=performance.now();if(t-lastDetail>300){lastDetail=t;$('#movement-diagnostics').textContent=JSON.stringify(diagnostics(),null,2);}
 }
 function diagnostics(){return {experimental:true,mode,phase,sensors:sensors.diagnostics(),estimate:output,presentedMeters:shown,presentationLagMeters:output?output.alongMeters-shown:null,fps:getState().fps??null,assumedStepMeters:params.stepMeters,axisReady:projector?.hasAxis()??false,recording:recorder.enabled(),recordingTruncated:recorder.data().truncated};}
 function stop(message='Caminhada experimental parada. Reinicia para reancorar.'){
  if(!active)return;input({type:'pause',t:performance.now()});record({type:'mark',t:performance.now(),label:'session-stop'});active=false;session++;unsub?.();unGps?.();unsub=unGps=null;clearInterval(timer);timer=null;phase='idle';lock(false);$('#gps-toggle').textContent='Iniciar caminhada';$('#gps-toggle').setAttribute('aria-pressed','false');for(const id of ['confirm-anchor','axis-end','return-origin','direction-controls'])$('#'+id).hidden=true;$('#walking-feedback').textContent='';$('#tracking-status').textContent=message;recorder.stop();$('#movement-diagnostics').textContent=JSON.stringify(diagnostics(),null,2);
 }
 function anchor(){const t=performance.now();input({type:'anchor',t,along:0,uncertainty:mode==='anchored'?1:latestFix.accuracy});phase='walking';shown=0;setTravel(0);
  const state=getState(),site=$('#tracking-mode').value==='site';projector=core.createProjector({origin:latestFix||{lat:0,lng:0},originAccuracy:latestFix?.accuracy??0,nodes:site&&mode!=='anchored'?state.gps:null,cumulative:state.cumulative,total:state.total});
  if(!site)phase='axis';
  if(site&&mode!=='anchored'){const projected=projector.project(latestFix,latestFix.accuracy);if(!projected||projected.cross>Math.max(12,latestFix.accuracy)||Math.abs(projected.along)>Math.max(10,latestFix.accuracy)){stop('Não estás no início do percurso de Benfica. Usa teste remoto ou passos ancorados.');return;}}
  $('#walking-feedback').textContent='';
  if(site){const projected=projector.project(latestFix,latestFix.accuracy);if(projected)input({type:'gps',t,stamp:latestFix.stamp,age:latestFix.age+t-latestFix.t,...projected,speed:latestFix.speed,heading:latestFix.heading});}
  $('#gps-toggle').textContent='Parar caminhada';record({type:'mark',t,label:'physical-start'});ui();
 }
 function onFix(f,id){if(!active||id!==session)return;record(f);if(![f.lat,f.lng,f.accuracy,f.stamp].every(Number.isFinite)||Math.abs(f.lat)>90||Math.abs(f.lng)>180||f.accuracy<0||f.accuracy>20||f.age<0||f.age>10000||latestFix&&f.stamp<=latestFix.stamp)return;latestFix=f;
  if(phase==='walking'&&projector?.hasAxis()){const projected=projector.project(f,f.accuracy);if(projected){input({type:'gps',t:f.t,stamp:f.stamp,age:f.age,...projected,speed:f.speed,heading:f.heading});if(!output.reason)projector.accept(projected);}}ui();
 }
 async function begin(){
  if(!getState().ready)return;if(!window.isSecureContext){$('#tracking-status').textContent='Abre o URL HTTPS para usar os sensores.';return;}const id=++session;active=true;phase='anchoring';mode=$('#fusion-mode').value;start=performance.now();latestFix=null;shown=0;lastPresentation=0;params={stepMeters:Math.max(.2,Math.min(1.5,Number($('#step-length').value)||.65))};estimator=core.createEstimator({mode,total:getState().total,start,params});detector=core.createDetector(params);output=estimator.snapshot(start);
  if($('#record-session').checked)recorder.start({startedCivil:Date.now(),startedMonotonic:start,userAgent:navigator.userAgent,mode,total:getState().total,start,params,location:$('#tracking-mode').value,geoNodes:getState().gps,virtualCumulative:getState().cumulative});
  // Permission calls before awaiting, while the click's user activation is current.
  const permission=sensors.request(['motion','orientation']);lock(true);$('#use-fix').hidden=true;$('#gps-toggle').textContent='Cancelar preparação';$('#gps-toggle').setAttribute('aria-pressed','true');setView('walk');
  unsub=sensors.subscribe('walking',['motion','orientation'],s=>{if(id!==session||!active)return;record(s);if(s.type==='motion'){const d=detector.add(s);record({type:'detection',t:s.t,processedAt:performance.now(),...d});input({type:'activity',t:s.t,activity:d.activity});if(d.step)input({type:'step',t:s.t});}});
  unGps=sensors.gps('walking',f=>onFix(f,id),e=>{if(id!==session)return;stop(e.code===1?'Localização recusada. Autoriza a localização ou usa a exploração manual.':'GPS indisponível. Tenta ao ar livre ou usa a exploração manual.');});
  timer=setInterval(()=>{if(id!==session||!active)return;if(phase==='walking')input({type:'tick',t:performance.now()});ui();},100);ui();
  const result=await permission;if(id!==session||!active)return;record({type:'permissions',t:performance.now(),result});ui();
 }
 $('#gps-toggle').onclick=()=>{if(active){stop();return;}if(legacy?.active()||$('#fusion-mode').value==='baseline'){baselineClick?.();return;}begin().catch(e=>stop(e.message));};
 $('#confirm-anchor').onclick=()=>{if(active&&latestFix&&latestFix.age+performance.now()-latestFix.t<=3000)anchor();else $('#tracking-status').textContent='Aguarda uma leitura recente para confirmar o início.';};
 $('#axis-end').onclick=()=>{if(!latestFix||latestFix.age+performance.now()-latestFix.t>3000){$('#walking-feedback').textContent='A aguardar uma leitura GPS recente para marcar este ponto.';return;}const ok=projector.setAxis(latestFix,latestFix.accuracy);if(!ok){$('#walking-feedback').textContent='Ainda estás demasiado perto, ou o GPS está impreciso. Continua na mesma linha e tenta novamente.';return;}
  // Axis setup is a separate physical walk. Restart at its origin; never turn setup travel into progress.
  phase='returning';input({type:'pause',t:performance.now()});ui();record({type:'axis',t:performance.now(),endpoint:latestFix,originAccuracy:latestFix.accuracy});$('#tracking-status').textContent='Eixo definido. Regressa ao início e confirma que estás em P01.';$('#return-origin').hidden=false;$('#axis-end').hidden=true;
 };
 $('#return-origin').onclick=()=>{if(!latestFix||latestFix.age+performance.now()-latestFix.t>3000){$('#walking-feedback').textContent='Aguarda GPS recente antes de confirmar o regresso.';return;}phase='walking';input({type:'anchor',t:performance.now(),along:0,uncertainty:latestFix.accuracy});shown=0;setTravel(0);const projected=projector.project(latestFix,latestFix.accuracy);if(projected)input({type:'gps',t:performance.now(),stamp:latestFix.stamp,age:latestFix.age+performance.now()-latestFix.t,...projected,speed:latestFix.speed,heading:latestFix.heading});$('#return-origin').hidden=true;ui();};
 for(const [id,direction]of [['confirm-forward',1],['confirm-back',-1]])$('#'+id).onclick=()=>{if(active){input({type:'direction',t:performance.now(),direction});record({type:'mark',t:performance.now(),label:direction===1?'forward-confirmed':'reverse-confirmed'});ui();}};
 $('#fusion-mode').onchange=()=>{$('#pilot-options').hidden=$('#fusion-mode').value==='baseline';};
 $('#record-session').onchange=()=>{if(active){$('#record-session').checked=recorder.enabled();}};
 $('#export-session').onclick=()=>{const data=recorder.data(),blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`cem-movimento-${new Date().toISOString().replaceAll(':','-')}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 $('#mark-event').onclick=()=>record({type:'mark',t:performance.now(),label:$('#marker-kind').value,presentedMeters:shown,estimate:output?.alongMeters});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop('Sessão interrompida. Reinicia e confirma novamente o início.');});addEventListener('pagehide',()=>stop());
 function target(){if(!active||phase!=='walking')return null;if(output.reason||output.activity==='stationary')return null;return output.alongMeters;}
 function present(meters){shown=meters;const t=performance.now();if(active&&t-lastPresentation>200){lastPresentation=t;record({type:'presentation',t,along:meters,estimated:output?.alongMeters,fps:getState().fps??null});}}
 window.movementDebug={diagnostics,recording:()=>recorder.data()};
 return {active:()=>active,phase:()=>phase,target,stop,present,diagnostics};
}
