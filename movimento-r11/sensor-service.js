(function(root){
'use strict';
function createService(env=root){
 const clients=new Map(),stats={},permissions={motion:'unknown',orientation:'unknown'},attached=new Set(),started={};let epoch=0,watch=null,gpsUsers=new Map(),gpsEpoch=0;
 const now=()=>env.performance.now(),civil=()=>Date.now(),number=x=>Number.isFinite(x)?x:null;
 const vector=(v,keys)=>Object.fromEntries(keys.map(k=>[k,number(v?.[k])]));
 function time(stamp,arrival){if(!Number.isFinite(stamp))return {t:arrival,clock:'arrival'};const mono=stamp>1e12?stamp-env.performance.timeOrigin:stamp;return Math.abs(mono-arrival)<=1000?{t:mono,clock:stamp>1e12?'epoch':'monotonic'}:{t:arrival,clock:'arrival-invalid-event-time'};}
 function emit(kind,event){const arrival=now(),clock=time(event.timeStamp,arrival),s=stats[kind]??{count:0,first:arrival,last:arrival,hz:0};s.count++;s.last=arrival;s.hz=s.count>1?(s.count-1)*1000/(arrival-s.first||1):0;stats[kind]=s;
  const sample={type:kind,t:clock.t,arrival,clock:clock.clock,civil:civil()};
  if(kind==='motion')Object.assign(sample,{acceleration:vector(event.acceleration,['x','y','z']),gravity:vector(event.accelerationIncludingGravity,['x','y','z']),rotation:vector(event.rotationRate,['alpha','beta','gamma']),interval:number(event.interval),units:'m/s2; degrees/s',frame:'device'});
  else Object.assign(sample,{alpha:number(event.alpha),beta:number(event.beta),gamma:number(event.gamma),absolute:event.absolute===true,compass:number(event.webkitCompassHeading),compassAccuracy:number(event.webkitCompassAccuracy),units:'degrees',frame:event.absolute?'absolute-device':'relative-device'});
  const complete=v=>v&&['x','y','z'].every(k=>Number.isFinite(v[k]));
  const usable=kind==='motion'?complete(sample.acceleration)||complete(sample.gravity):['alpha','beta','gamma'].every(k=>Number.isFinite(sample[k]));
  s.validCount=(s.validCount||0)+(usable?1:0);s.partialCount=(s.partialCount||0)+(usable?0:1);if(usable)s.lastValid=arrival;
  for(const c of clients.values())if(c.kinds.includes(kind))c.callback(sample,event);
 }
 const motion=e=>emit('motion',e),orientation=e=>emit('orientation',e);
 function sync(){const wanted=new Set(env.document?.hidden?[]:[...clients.values()].flatMap(c=>c.kinds));for(const kind of ['motion','orientation']){if(wanted.has(kind)===attached.has(kind))continue;const callback=kind==='motion'?motion:orientation;if(wanted.has(kind)){attached.add(kind);started[kind]=now();delete stats[kind];env.addEventListener('device'+kind,callback);}else {attached.delete(kind);env.removeEventListener('device'+kind,callback);}}}
 // Both supported permission calls occur synchronously within the user's gesture.
 function request(kinds){const promises=kinds.map(kind=>{const api=env[kind==='motion'?'DeviceMotionEvent':'DeviceOrientationEvent'];if(!env.isSecureContext){permissions[kind]='insecure';return Promise.resolve();}if(!api){permissions[kind]='unavailable';return Promise.resolve();}try {return Promise.resolve(typeof api.requestPermission==='function'?api.requestPermission():'unknown').then(value=>permissions[kind]=value,e=>permissions[kind]='error');}catch(e){permissions[kind]='error';return Promise.resolve();}});return Promise.all(promises).then(()=>({...permissions}));}
 function subscribe(key,kinds,callback){const id=++epoch;clients.set(key,{kinds,callback,id});sync();return ()=>{if(clients.get(key)?.id===id)clients.delete(key);sync();};}
 function clearGps(){gpsEpoch++;if(watch!==null)env.navigator.geolocation?.clearWatch(watch);watch=null;}
 function gps(key,callback,error){gpsUsers.set(key,{callback,error});if(watch===null){const id=++gpsEpoch;const geolocation=env.navigator.geolocation;if(!geolocation){error({code:0,message:'unavailable'});return ()=>gpsUsers.delete(key);}watch=geolocation.watchPosition(p=>{if(id!==gpsEpoch)return;const c=p.coords,arrival=now(),age=civil()-p.timestamp;const sample={type:'fix',t:arrival,arrival,civil:civil(),stamp:p.timestamp,age,lat:number(c.latitude),lng:number(c.longitude),accuracy:number(c.accuracy),speed:number(c.speed),heading:number(c.heading),clock:'epoch-to-arrival',units:'degrees; meters; m/s'};const s=stats.gps??{count:0,first:arrival};s.count++;s.last=arrival;s.hz=s.count>1?(s.count-1)*1000/(arrival-s.first||1):0;stats.gps=s;for(const u of gpsUsers.values())u.callback(sample);},e=>{if(id!==gpsEpoch)return;for(const u of gpsUsers.values())u.error(e);},{enableHighAccuracy:true,maximumAge:0,timeout:20000});}let done=false;return ()=>{if(done)return;done=true;gpsUsers.delete(key);if(!gpsUsers.size)clearGps();};}
 function hide(){if(!env.document.hidden)return;clients.clear();sync();gpsUsers.clear();clearGps();}
 env.document?.addEventListener('visibilitychange',hide);env.addEventListener('pagehide',()=>{clients.clear();sync();gpsUsers.clear();clearGps();});
 return {request,subscribe,gps,diagnostics(){const t=now(),streams={};for(const kind of ['motion','orientation']){const s=stats[kind],permission=permissions[kind];streams[kind]={...s,ageMs:s?t-s.last:null,validAgeMs:s?.lastValid!==undefined?t-s.lastValid:null,status:!attached.has(kind)?'off':['denied','unavailable','insecure','error'].includes(permission)?permission:!s?t-(started[kind]??t)>3000?'no-events':'waiting':!s.validCount?'partial-fields':t-s.lastValid>1000?'stale':'receiving'};}if(stats.gps)streams.gps={...stats.gps,ageMs:t-stats.gps.last};return {permissions:{...permissions},streams,subscriptions:clients.size,gpsSubscriptions:gpsUsers.size};},dispose(){clients.clear();sync();gpsUsers.clear();clearGps();env.document?.removeEventListener('visibilitychange',hide);}};
}
const api={createService};if(typeof module==='object'&&module.exports)module.exports=api;else {root.CemSensors=api;root.cemSensors=createService(root);}
})(typeof window==='undefined'?globalThis:window);
