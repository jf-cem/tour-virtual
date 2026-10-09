const $=s=>document.querySelector(s);
const labels={'anchor-required':'Guarda o ponto inicial.','direction-required':'Escolhe Avançar ou Recuar para indicar o sentido da caminhada.','motion-unavailable':'Sem amostras de movimento recentes.','prediction-budget-exceeded':'Avanço suspenso: precisamos de uma leitura GPS útil para continuar.','explicit-reanchor-required':'Posição demasiado diferente ou sessão interrompida. Para e guarda novamente o início.','gps-invalid-or-old':'GPS inválido, antigo ou de baixa qualidade.','outside-route':'Fora da linha do teste ou GPS desviado.','gps-outlier':'Salto GPS rejeitado.','gps-unavailable':'Sem GPS recente.'};
export function createPilot({getState,setTravel,setView,legacy}){
 const core=window.CemMovement,sensors=window.cemSensors,recorder=core.createRecorder();
 let active=false,session=0,phase='idle',preparation=null,estimator=null,detector=null,projector=null,latestFix=null,unsub=null,unGps=null,timer=null,output=null,shown=0,mode='steps',start=0,params={},lastPresentation=0,lastDetail=0;
 const baselineClick=$('#gps-toggle').onclick;
 let lastStepAt=null,stepSpeed=1.3,lastDetection=null;
 function presentationSpeed(){if(mode!=='steps')return 4;const lag=Math.abs((output?.alongMeters??shown)-shown);return Math.min(4,Math.max(.4,stepSpeed*1.15+Math.max(0,lag-(params.stepMeters??.65))*.8));}
 // Keep the actions beside the live status, outside the settings popover.
 const setup=document.createElement('div');setup.id='walking-setup';
 for(const id of ['confirm-anchor','axis-end','return-origin'])setup.append($('#'+id));
 $('#pilot-options details').append($('#direction-controls'));
 const progress=document.createElement('p');progress.id='walking-feedback';setup.append(progress);
 $('#tracking-status').after(setup);
 function record(e){recorder.add(e);}
 function input(e){if(e.type!=='activity'&&e.type!=='step')record(e);output=estimator.input(e);return output;}
 function lock(value){for(const e of document.querySelectorAll('#progress,#back,#forward,#play,#reset,#manual-mode,[data-stop],#tracking-mode,#fusion-mode,#reference,#step-length'))e.disabled=value;}
 function ui(){if(!active)return;const prep=phase==='preparing'?preparation.snapshot(Date.now()):null;
 $('#tracking-status').textContent=prep?`Fica parado enquanto preparamos o GPS · ${prep.count}/5 leituras. A caminhada começa automaticamente quando estiver pronto.`:labels[output?.reason]||'Pronto. Caminha em frente, em linha reta. Para regressar, volta pelo mesmo caminho.';
 for(const id of ['confirm-anchor','axis-end','return-origin'])$('#'+id).hidden=true;
 $('#use-fix').hidden=!prep?.fallback;
 if(prep?.fallback)$('#use-fix').textContent=`Usar leitura atual (±${Math.round(prep.fallback.accuracy)} m)`;
 $('#direction-controls').hidden=phase!=='walking'||mode==='activity';if(latestFix)$('#gps-accuracy').textContent=`GPS ±${Math.round(latestFix.accuracy)} m`;
 if(phase==='walking')$('#walking-feedback').textContent=`${output?.steps??0} passos detetados · ${(output?.alongMeters??0).toFixed(1)} m estimados${output?.reason==='prediction-budget-exceeded'?' · A aguardar GPS útil; não é preciso iniciar de novo se o sinal recuperar.':''}`;
  const t=performance.now();if(t-lastDetail>300){lastDetail=t;$('#movement-diagnostics').textContent=JSON.stringify(diagnostics(),null,2);}
 }
 function diagnostics(){return {experimental:true,mode,phase,sensors:sensors.diagnostics(),detector:lastDetection,estimate:output,presentedMeters:shown,presentationLagMeters:output?output.alongMeters-shown:null,fps:getState().fps??null,assumedStepMeters:params.stepMeters,axisReady:projector?.hasAxis()??false,recording:recorder.enabled(),recordingTruncated:recorder.data().truncated};}
 function stop(message='Caminhada experimental parada. Reinicia para reancorar.'){
  if(!active)return;input({type:'pause',t:performance.now()});record({type:'mark',t:performance.now(),label:'session-stop'});active=false;session++;unsub?.();unGps?.();unsub=unGps=null;clearInterval(timer);timer=null;phase='idle';lock(false);document.getElementById("use-fix").hidden=true;$('#gps-toggle').textContent='Iniciar caminhada';$('#gps-toggle').setAttribute('aria-pressed','false');for(const id of ['confirm-anchor','axis-end','return-origin','direction-controls'])$('#'+id).hidden=true;$('#walking-feedback').textContent='';$('#tracking-status').textContent=message;recorder.stop();$('#movement-diagnostics').textContent=JSON.stringify(diagnostics(),null,2);
 }
 function anchor(prep){const t=performance.now();input({type:'anchor',t,along:0,uncertainty:prep.accuracy});phase='walking';shown=0;setTravel(0);detector=core.createDetector(params);
  const state=getState(),site=$('#tracking-mode').value==='site';projector=core.createProjector({origin:prep.position,originAccuracy:prep.accuracy,radial:!site,nodes:site?state.gps:null,cumulative:state.cumulative,total:state.total});
  if(site){const projected=projector.project(latestFix,latestFix.accuracy);if(!projected||projected.cross>Math.max(12,latestFix.accuracy)||Math.abs(projected.along)>Math.max(10,latestFix.accuracy)){stop('Não estás no início do percurso de Benfica. Escolhe «Teste onde estou».');return;}}
  $('#walking-feedback').textContent='';
  const projected=projector.project(latestFix,latestFix.accuracy);if(projected)input({type:'gps',t,stamp:latestFix.stamp,age:latestFix.age+t-latestFix.t,...projected,speed:latestFix.speed,heading:latestFix.heading});
  if(mode==='steps')input({type:'direction',t,direction:1,source:'start-forward'});
  $('#gps-toggle').textContent='Parar caminhada';record({type:'mark',t,label:'physical-start'});ui();
 }
 function prepare(){if(!active||phase!=='preparing')return;const prep=preparation.snapshot(Date.now());if(prep.ready)anchor(prep);}
 function onFix(f,id){if(!active||id!==session)return;record(f);if(![f.lat,f.lng,f.accuracy,f.stamp].every(Number.isFinite)||Math.abs(f.lat)>90||Math.abs(f.lng)>180||f.accuracy<0||f.accuracy>20||f.age<0||f.age>10000||latestFix&&f.stamp<=latestFix.stamp)return;latestFix=f;
  if(phase==='preparing'){preparation.add({timestamp:f.stamp,coords:{latitude:f.lat,longitude:f.lng,accuracy:f.accuracy}},Date.now());prepare();ui();return;}
  if(phase==='walking'&&projector?.hasAxis()){const projected=projector.project(f,f.accuracy);if(projected){input({type:'gps',t:f.t,stamp:f.stamp,age:f.age,...projected,speed:f.speed,heading:f.heading});if(!output.reason)projector.accept(projected);}}ui();
 }
 async function begin(){
  if(!getState().ready)return;if(!window.isSecureContext){$('#tracking-status').textContent='Abre o URL HTTPS para usar os sensores.';return;}const id=++session;active=true;phase='preparing';mode=$('#fusion-mode').value;start=performance.now();preparation=TourGpsStart.createPreparation(Date.now());latestFix=null;shown=0;lastPresentation=0;params={adaptiveSteps:mode==='steps',stepMeters:Math.max(.2,Math.min(1.5,Number($('#step-length').value)||.65)),correctionRate:mode==='activity'?2:.6};estimator=core.createEstimator({mode,total:getState().total,start,params});detector=core.createDetector(params);output=estimator.snapshot(start);
  if($('#record-session').checked)recorder.start({startedCivil:Date.now(),startedMonotonic:start,userAgent:navigator.userAgent,mode,total:getState().total,start,params,location:$('#tracking-mode').value,geoNodes:getState().gps,virtualCumulative:getState().cumulative});
  // Permission calls before awaiting, while the click's user activation is current.
  const permission=sensors.request(['motion','orientation']);lock(true);$('#use-fix').hidden=true;$('#gps-toggle').textContent='Cancelar preparação';$('#gps-toggle').setAttribute('aria-pressed','true');setView('walk');
  lastStepAt=null;stepSpeed=1.3;lastDetection=null;
  unsub=sensors.subscribe('walking',['motion','orientation'],s=>{if(id!==session||!active)return;record(s);if(s.type==='motion'){
   const processedAt=performance.now();if(mode==='steps'&&processedAt-s.t>core.PARAMETERS.sensorGapMs)return;
   const d=detector.add(s);lastDetection={...d,eventLagMs:processedAt-s.t};record({type:'detection',t:s.t,processedAt,...d});
   // Cadence uses acquisition time; estimator mutations use processing order.
   // A 50 ms tick may already be newer than a sensor event delivered late.
   const t=mode==='steps'?processedAt:s.t;input({type:'activity',t,activity:d.activity});
   if(d.step){if(lastStepAt!==null&&s.t-lastStepAt<=core.PARAMETERS.maxStepMs)stepSpeed=params.stepMeters*1000/(s.t-lastStepAt);lastStepAt=s.t;input({type:'step',t});}
  }});
  unGps=sensors.gps('walking',f=>onFix(f,id),e=>{if(id!==session)return;stop(e.code===1?'Localização recusada. Autoriza a localização ou usa a exploração manual.':'GPS indisponível. Tenta ao ar livre ou usa a exploração manual.');});
  timer=setInterval(()=>{if(id!==session||!active)return;prepare();if(phase==='walking')input({type:'tick',t:performance.now()});ui();},50);ui();
  const result=await permission;if(id!==session||!active)return;record({type:'permissions',t:performance.now(),result});ui();
 }
 $('#gps-toggle').onclick=()=>{if(active){stop();return;}if(legacy?.active()||$('#fusion-mode').value==='baseline'){baselineClick?.();return;}begin().catch(e=>stop(e.message));};
 const baselineUseFix=$('#use-fix').onclick;
 $('#use-fix').onclick=()=>{if(!active){baselineUseFix?.();return;}const prep=preparation?.snapshot(Date.now());if(phase==='preparing'&&prep?.fallback)anchor({position:{lat:prep.fallback.lat,lng:prep.fallback.lng},accuracy:prep.fallback.accuracy});};
 for(const [id,direction]of [['confirm-forward',1],['confirm-back',-1]])$('#'+id).onclick=()=>{if(active){input({type:'direction',t:performance.now(),direction});record({type:'mark',t:performance.now(),label:direction===1?'forward-confirmed':'reverse-confirmed'});ui();}};
 $('#fusion-mode').onchange=()=>{$('#pilot-options').hidden=$('#fusion-mode').value==='baseline';};
 $('#record-session').onchange=()=>{if(active){$('#record-session').checked=recorder.enabled();}};
 $('#export-session').onclick=()=>{const data=recorder.data(),blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`cem-movimento-${new Date().toISOString().replaceAll(':','-')}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 $('#mark-event').onclick=()=>record({type:'mark',t:performance.now(),label:$('#marker-kind').value,presentedMeters:shown,estimate:output?.alongMeters});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop('Sessão interrompida. Reinicia e confirma novamente o início.');});addEventListener('pagehide',()=>stop());
 function target(){if(!active||phase!=='walking')return null;if(output.reason||output.activity==='stationary')return null;return output.alongMeters;}
 function present(meters){shown=meters;const t=performance.now();if(active&&t-lastPresentation>200){lastPresentation=t;record({type:'presentation',t,along:meters,estimated:output?.alongMeters,fps:getState().fps??null});}}
 window.movementDebug={diagnostics,recording:()=>recorder.data()};
 return {active:()=>active,phase:()=>phase,target,stop,present,presentationSpeed,diagnostics};
}
