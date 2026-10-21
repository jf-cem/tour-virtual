(function(root){
 const geo=typeof module==='object'&&module.exports?require('./geo.js'):root.TourGeo;
 function mapAlong(position,physical,virtual){const projected=geo.routePosition(position,physical);const i=projected.along<=projected.cumulative[1]?0:1;const fraction=(projected.along-projected.cumulative[i])/(projected.cumulative[i+1]-projected.cumulative[i]);return {along:virtual[i]+fraction*(virtual[i+1]-virtual[i]),cross:projected.meters};}
 function createFilter(initial=0,maximum=Infinity){let accepted=initial,samples=[],candidate=null,last=-Infinity;return {add(along,accuracy,timestamp,now=Date.now()){
  if(!Number.isFinite(along)||!Number.isFinite(accuracy)||accuracy<0||accuracy>20||!Number.isFinite(timestamp)||timestamp<=last||now-timestamp>10000||timestamp>now+1000)return {accepted,changed:false,rejected:true};last=timestamp;
  samples=samples.filter(s=>timestamp-s.t<=10000);samples.push({v:along,t:timestamp});samples=samples.slice(-3);const values=samples.map(s=>s.v).sort((a,b)=>a-b),value=values[Math.floor(values.length/2)];const band=value<=0||value>=maximum?.25:Math.max(1.2,Math.min(4,accuracy*.25));
  if(Math.abs(value-accepted)<=band){candidate=null;return {accepted,changed:false};}
  if(candidate&&timestamp-candidate.t>=1500&&Math.abs(value-candidate.v)<=Math.max(2,band)){accepted=value;candidate=null;return {accepted,changed:true};}
  if(!candidate||Math.abs(value-candidate.v)>Math.max(2,band))candidate={v:value,t:timestamp};return {accepted,changed:false,pending:true};
 },value:()=>accepted};}
 const api={mapAlong,createFilter};if(typeof module==='object'&&module.exports)module.exports=api;else root.VirtualTrackingCore=api;
})(typeof window==='undefined'?globalThis:window);
