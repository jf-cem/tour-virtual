(function(root){
'use strict';
const finite=Number.isFinite, clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
// Initial engineering hypotheses, NOT physical accuracy guarantees.
const PARAMETERS=Object.freeze({stepMeters:.65,sensorGapMs:300,minStepMs:300,maxStepMs:1500,peak:1.05,release:.35,rotationLimit:240,stationaryMs:1800,directionMs:5000,gpsAgeMs:10000,maxWithoutFixMs:12000,maxPredictionMeters:6,maxUncertaintyMeters:12,correctionRate:.6,reanchorMeters:10,maxAccuracy:20,maxSpeed:3});
function createDetector(params={}){
 const p={...PARAMETERS,...params};let last=null,gravity=9.81,mean=0,energy=0,armed=true,lastPeak=null,intervals=[],lastStep=-Infinity,steps=0,validAt=-Infinity,rate=0;
 return {add(s){
  const t=s.t,dt=last===null?0:(t-last)/1000;
  if(!finite(t)||last!==null&&t<=last)return {step:false,activity:'uncertain',steps};
  last=t;const a=s.acceleration,g=s.gravity;
  const vector=v=>v&&[v.x,v.y,v.z].every(finite);
  if(!vector(a)&&!vector(g)){intervals=[];return {step:false,activity:'uncertain',steps};}
  if(!dt||dt*1000>p.sensorGapMs){mean=0;energy=0;armed=true;lastPeak=null;intervals=[];validAt=t;return {step:false,activity:'uncertain',steps};}
  rate=rate?rate*.9+.1/dt:1/dt;validAt=t;
  const norm=v=>Math.hypot(v.x,v.y,v.z),alpha=1-Math.exp(-dt/.7);
  let raw;if(vector(g)){const magnitude=norm(g);gravity+=alpha*(magnitude-gravity);raw=magnitude-gravity;}else raw=norm(a);
  mean+=(1-Math.exp(-dt/1.5))*(raw-mean);const signal=raw-mean;
  energy+=(1-Math.exp(-dt/.4))*(signal*signal-energy);
  const rotation=s.rotation,rot=rotation?Math.hypot(...['alpha','beta','gamma'].map(k=>finite(rotation[k])?rotation[k]:0)):0;
  let step=false;
  if(signal<p.release)armed=true;
  if(armed&&signal>p.peak){armed=false;const period=lastPeak===null?Infinity:t-lastPeak;lastPeak=t;
   if(rot>p.rotationLimit||period<p.minStepMs||period>p.maxStepMs)intervals=[];
   else {intervals.push(period);intervals=intervals.slice(-3);if(intervals.length>=2&&Math.max(...intervals)/Math.min(...intervals)<1.7){step=true;steps++;lastStep=t;}}
  }
  return {step,steps,activity:t-lastStep<1600?'walking':energy<.12&&t-lastStep>p.stationaryMs?'stationary':'uncertain',energy,rate,rotation:rot,quality:rot>p.rotationLimit?'gesture':'usable'};
 },snapshot(t){return {steps,rate,activity:t-validAt>p.sensorGapMs?'uncertain':t-lastStep<1600?'walking':energy<.12?'stationary':'uncertain'};}};
}
function createEstimator(options={}){
 const p={...PARAMETERS,...options.params},mode=options.mode||'steps',total=options.total??16.38;
 let x=0,direction=0,directionAt=-Infinity,directionSource='unknown',uncertainty=0,steps=0,predicted=0,correction=0,lastFix=null,lastInput=-Infinity,lastTick=null,pending=null,activity='uncertain',sensorAt=-Infinity,reason='anchor-required',anchored=false,blocked=false,anchorAt=options.start??0,gpsGate='',reverseCandidate=null,gpsActivityUntil=-Infinity;
 const suspend=r=>{reason=r;pending=null;return snapshot(lastInput);};
 function snapshot(t){const age=lastFix?Math.max(0,t-lastFix.t+lastFix.age):null;return {alongMeters:x,direction:t-directionAt<=p.directionMs?direction:0,directionSource:direction===0?directionSource:t-directionAt<=p.directionMs?directionSource:'expired',uncertaintyMeters:uncertainty,confidenceLevel:uncertainty<=3?'operational-within-budget':'operational-uncertain',status:reason?'suspended':'tracking',sourceMode:mode,lastFixAgeMs:age,steps,predictedDistanceMeters:predicted,correctionMeters:correction,activity,reason,anchored};}
 function input(e){if(!finite(e.t)||e.t<lastInput)return snapshot(lastInput);lastInput=e.t;
  if(e.type==='anchor'){x=clamp(e.along??0,0,total);uncertainty=e.uncertainty??0;anchored=true;blocked=false;anchorAt=e.t;gpsGate='';reverseCandidate=null;gpsActivityUntil=-Infinity;predicted=0;pending=null;lastFix=null;lastTick=e.t;direction=0;reason='direction-required';return snapshot(e.t);}
  if(e.type==='direction'){if(!anchored)return suspend('anchor-required');direction=e.direction===-1?-1:e.direction===1?1:0;reverseCandidate=null;directionAt=e.t;directionSource='confirmed';reason=direction?'':'direction-required';return snapshot(e.t);}
  if(e.type==='pause'){blocked=true;pending=null;direction=0;return suspend('explicit-reanchor-required');}
  if(e.type==='activity'){activity=e.activity==='stationary'&&e.t<gpsActivityUntil?'uncertain':e.activity;sensorAt=e.t;return snapshot(e.t);}
  if(!anchored)return suspend('anchor-required');
  if(e.type==='gps'){
   if(!finite(e.along)||!finite(e.accuracy)||e.accuracy<0||e.accuracy>p.maxAccuracy||!finite(e.stamp)||!finite(e.age)||e.age<0||e.age>p.gpsAgeMs||!finite(e.cross)||lastFix&&e.stamp<=lastFix.stamp)return suspend('gps-invalid-or-old');
   if(e.along< -Math.max(3,e.accuracy)||e.along>total+Math.max(3,e.accuracy)||e.cross>Math.max(5,e.accuracy)){gpsGate='outside-route';pending=null;return suspend(gpsGate);}
   if(lastFix){const dt=(e.stamp-lastFix.stamp)/1000;if(dt<=0||Math.abs(e.along-lastFix.along)>p.maxSpeed*dt+Math.max(3,e.accuracy,lastFix.accuracy))return suspend('gps-outlier');}
   const innovation=e.along-x;
   if(Math.abs(innovation)>p.reanchorMeters){blocked=true;pending=null;return suspend('explicit-reanchor-required');}
   if(blocked)return suspend('explicit-reanchor-required');
   // Informative displacement establishes travel direction; phone orientation never does.
   if(lastFix){const delta=e.along-lastFix.along,gate=Math.max(1.5,(e.accuracy+lastFix.accuracy)*.5);
    if(Math.abs(delta)>gate){const candidate=Math.sign(delta),expected=(e.tangentHeading+(candidate<0?180:0)+360)%360;
     const headingConflict=finite(e.heading)&&finite(e.speed)&&e.speed>=.8&&finite(e.tangentHeading)&&Math.abs(((e.heading-expected+540)%360)-180)>45;
     if(headingConflict){direction=0;reverseCandidate=null;directionSource='gps-heading-conflict';}
     else if(direction&&candidate!==direction){reverseCandidate={direction:candidate,t:e.t};direction=0;directionSource='gps-candidate';pending=null;}
     else if(reverseCandidate&&(reverseCandidate.direction!==candidate||e.t-reverseCandidate.t>p.directionMs)){reverseCandidate={direction:candidate,t:e.t};direction=0;directionSource='gps-candidate';}
     else {direction=candidate;reverseCandidate=null;directionAt=e.t-e.age;directionSource='gps-displacement';}
     gpsActivityUntil=e.t-e.age+1500;activity='uncertain';
    }
   }
   gpsGate='';lastFix={...e};predicted=0;uncertainty=Math.max(1,e.accuracy);reason='';
   // accuracy is an operational horizontal bound, not a statistical sigma.
   if(finite(e.speed)&&e.speed>.8&&e.speed<p.maxSpeed&&activity==='stationary'){gpsActivityUntil=e.t-e.age+1500;activity='uncertain';}
   pending=activity==='stationary'&&Math.abs(innovation)<Math.max(2,e.accuracy)?null:clamp(e.along,0,total);
   return snapshot(e.t);
  }
  if(e.type==='step'){steps++;if(mode!=='steps'&&mode!=='anchored')return snapshot(e.t);
   if(blocked)return suspend('explicit-reanchor-required');
   if(e.t-directionAt>p.directionMs||!direction){pending=null;return suspend('direction-required');}
   if(e.t-sensorAt>p.sensorGapMs)return suspend('motion-unavailable');
   if(mode==='steps'&&gpsGate)return suspend(gpsGate);
   const distance=p.stepMeters;
   const anchorAge=lastFix?e.t-lastFix.t+lastFix.age:e.t-anchorAt;
   if(predicted+distance>p.maxPredictionMeters||anchorAge>p.maxWithoutFixMs||uncertainty+distance*.3>p.maxUncertaintyMeters){pending=null;return suspend('prediction-budget-exceeded');}
   x=clamp(x+direction*distance,0,total);if(pending!==null)pending=clamp(pending+direction*distance,0,total);predicted+=distance;uncertainty+=distance*.3;reason='';return snapshot(e.t);
  }
  if(e.type==='tick'){
   const dt=lastTick===null?0:clamp((e.t-lastTick)/1000,0,.25);lastTick=e.t;
   if(e.t-sensorAt>p.sensorGapMs)activity='uncertain';
   if(blocked)return suspend('explicit-reanchor-required');
   if(mode!=='anchored'&&lastFix&&e.t-lastFix.t+lastFix.age>p.gpsAgeMs&&mode==='activity'){pending=null;return suspend('gps-unavailable');}
   if(pending!==null&&activity!=='stationary'){const d=clamp(pending-x,-p.correctionRate*dt,p.correctionRate*dt);x=clamp(x+d,0,total);correction+=d;if(Math.abs(pending-x)<.01)pending=null;}
   if(mode==='steps'||mode==='anchored'){
    if(e.t-directionAt>p.directionMs){direction=0;if(pending===null)reason='direction-required';}
    if((lastFix?e.t-lastFix.t+lastFix.age:e.t-anchorAt)>p.maxWithoutFixMs||predicted>=p.maxPredictionMeters||uncertainty>p.maxUncertaintyMeters){pending=null;reason='prediction-budget-exceeded';}
    else if(e.t-sensorAt>p.sensorGapMs&&pending===null)reason='motion-unavailable';
   }
  }
  return snapshot(e.t);
 }
 return {input,snapshot,params:p};
}
function enu(origin,p){const rad=Math.PI/180;return {x:(p.lng-origin.lng)*rad*6371000*Math.cos(origin.lat*rad),y:(p.lat-origin.lat)*rad*6371000};}
function createProjector({origin,originAccuracy=0,axis=null,nodes=null,cumulative=null,total=16.38}){
 let segment=0,lastAlong=null;
 const points=nodes?.map(n=>enu(nodes[0],n));
 return {setAxis(endpoint,accuracy){const v=enu(origin,endpoint),length=Math.hypot(v.x,v.y);if(length<Math.max(8,2*(accuracy+originAccuracy)))return false;axis={x:v.x/length,y:v.y/length};return true;},hasAxis:()=>!!axis||!!nodes,accept(p){if(nodes&&p){segment=p.segment;lastAlong=p.along;}},
 project(position,accuracy){
  if(!nodes){if(!axis)return null;const v=enu(origin,position);return {along:v.x*axis.x+v.y*axis.y,cross:Math.abs(v.x*axis.y-v.y*axis.x),accuracy:accuracy+originAccuracy,tangentHeading:(Math.atan2(axis.x,axis.y)*180/Math.PI+360)%360};}
  const v=enu(nodes[0],position),candidates=[];
  for(let i=0;i<points.length-1;i++){const a=points[i],b=points[i+1],dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);if(!length)continue;const raw=((v.x-a.x)*dx+(v.y-a.y)*dy)/(length*length),f=clamp(raw,0,1),cross=Math.hypot(v.x-a.x-f*dx,v.y-a.y-f*dy),scale=(cumulative[i+1]-cumulative[i])/length;
   const along=cumulative[i]+raw*(cumulative[i+1]-cumulative[i]);candidates.push({segment:i,along,cross,accuracy:accuracy*Math.max(1,scale),tangentHeading:(Math.atan2(dx,dy)*180/Math.PI+360)%360,score:cross+(lastAlong===null?0:Math.abs(along-lastAlong)*.2)});}
  // Continuity limits jumps between neighbouring/overlapping segments.
  const available=lastAlong===null?candidates:candidates.filter(c=>Math.abs(c.segment-segment)<=1&&Math.abs(c.along-lastAlong)<=Math.max(8,accuracy*2));
  const best=available.sort((a,b)=>a.score-b.score)[0];return best||null;
 }};
}
function createRecorder(limit=24000){let events=[],enabled=false,truncated=false,meta={};return {start(m={}){events=[];enabled=true;truncated=false;meta=m;},stop(){enabled=false;},add(e){if(!enabled)return;if(events.length>=limit){enabled=false;truncated=true;return;}events.push(JSON.parse(JSON.stringify(e)));},data:()=>({schema:'cem-movement-1',meta,parameters:PARAMETERS,truncated,events}),enabled:()=>enabled};}
function replay(events,options){const detector=createDetector(options?.params),estimator=createEstimator(options);return events.map(e=>{if(e.type==='motion'){const d=detector.add(e);estimator.input({type:'activity',t:e.t,activity:d.activity});if(d.step)estimator.input({type:'step',t:e.t});}else if(['anchor','direction','gps','tick','pause','activity','step'].includes(e.type))estimator.input(e);return estimator.snapshot(e.t);});}
const api={PARAMETERS,createDetector,createEstimator,createProjector,createRecorder,replay,enu};if(typeof module==='object'&&module.exports)module.exports=api;else root.CemMovement=api;
})(typeof window==='undefined'?globalThis:window);
