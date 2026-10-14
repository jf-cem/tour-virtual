// Pure horizontal GPS correction; confidence thresholds are operational assumptions.
const metres=(a,b)=>({x:(a.lng-b.lng)*Math.PI/180*6371000*Math.cos(b.lat*Math.PI/180),z:(a.lat-b.lat)*Math.PI/180*6371000});
const length=p=>Math.hypot(p.x,p.z);
export function createGpsCorrection({mode='relative',route}){
 let anchor=null,angle=null,fix=null,lastStamp=-Infinity,lastRaw=null;
 const offset={x:0,z:0};let reason='A aguardar GPS',accuracy=null;
 const a=route.gps[0],b=route.gps.at(-1),v=route.stops.at(-1).position,u=route.stops[0].position;
 const physical=metres(b,a),virtual={x:v[0]-u[0],z:v[2]-u[2]};
 const siteAngle=Math.atan2(virtual.z,virtual.x)-Math.atan2(physical.z,physical.x);
 const rotate=(p,r)=>({x:p.x*Math.cos(r)-p.z*Math.sin(r),z:p.x*Math.sin(r)+p.z*Math.cos(r)});
 function gps(g,slam,now){
  if(!slam)return;
  if(![g.lat,g.lng,g.accuracy,g.stamp].every(Number.isFinite)||Math.abs(g.lat)>90||Math.abs(g.lng)>180||g.accuracy<0||g.accuracy>10||now-g.stamp>10000||g.stamp>now+1000||g.stamp<=lastStamp){reason='GPS rejeitado: precisão, idade ou duplicação';return;}
  lastStamp=g.stamp;accuracy=g.accuracy;
  if(lastRaw){const distance=length(metres(g,lastRaw));if(distance>3*Math.max(0,(g.stamp-lastRaw.stamp)/1000)+g.accuracy+lastRaw.accuracy){reason='Salto GPS rejeitado';return;}}
  lastRaw=g;
  let target;
  if(mode==='site'){
   const p=rotate(metres(g,a),siteAngle);target={x:u[0]+p.x,z:u[2]+p.z};
  }else{
   if(!anchor){anchor={gps:g,slam:{x:slam.x,z:slam.z}};reason='Origem GPS local guardada; caminha em linha reta para alinhar';return;}
   const p=metres(g,anchor.gps),s={x:slam.x-anchor.slam.x,z:slam.z-anchor.slam.z};
   if(angle===null){
    const threshold=Math.max(8,2*(g.accuracy+anchor.gps.accuracy));
    if(length(p)<threshold||length(s)<8||length(s)/length(p)<.7||length(s)/length(p)>1.3){reason='GPS a alinhar com SLAM; continua em linha reta';return;}
    angle=Math.atan2(s.z,s.x)-Math.atan2(p.z,p.x);
   }
   const mapped=rotate(p,angle);target={x:anchor.slam.x+mapped.x,z:anchor.slam.z+mapped.z};
  }
  if(length({x:target.x-slam.x-offset.x,z:target.z-slam.z-offset.z})>30){reason='GPS demasiado diferente; correção suspensa';fix=null;return;}
  fix={desiredOffset:{x:target.x-slam.x,z:target.z-slam.z},t:now,deadband:Math.max(2,g.accuracy+(mode==='relative'?anchor.gps.accuracy:3))};reason='GPS alinhado; correção gradual disponível';
 }
 function update(slam,dt,now,moving){
  if(fix&&now-fix.t<=10000&&moving){
   const error={x:fix.desiredOffset.x-offset.x,z:fix.desiredOffset.z-offset.z},distance=length(error);
   if(distance>fix.deadband){const amount=Math.min(distance-fix.deadband,.15*Math.min(dt,.1));offset.x+=error.x/distance*amount;offset.z+=error.z/distance*amount;}
  }else if(fix&&now-fix.t>10000)reason='GPS antigo; SLAM continua sem correção';
  return {x:slam.x+offset.x,z:slam.z+offset.z};
 }
 return {gps,update,diagnostics:()=>({reason,accuracy,offset:{...offset},correctionMetres:length(offset),aligned:!!fix})};
}
