// Rigid virtual mapping only. Never mutates or reanchors the input tracking pose.
const rotate=(x,z,a)=>[Math.cos(a)*x+Math.sin(a)*z,-Math.sin(a)*x+Math.cos(a)*z];
const map=(p,o)=>{const [x,z]=rotate(p[0],p[2],o.angle);return [x+o.x,p[1],z+o.z];};
const orient=(q,a)=>{const s=Math.sin(a/2),c=Math.cos(a/2);return [c*q[0]+s*q[2],c*q[1]+s*q[3],c*q[2]-s*q[0],c*q[3]-s*q[1]];};
export function createPlatform({pivot,floor,footprint,portal,alignment=0,supportRadius=null}){
 let offset={angle:0,x:0,z:0},previous=null,previousAngle=0,onboard=false,transitions=[];
 function local(p,a){const [x,z]=rotate(p[0]-pivot[0],p[2]-pivot[2],-a-alignment);return [x,p[1],z];}
 function inside(p,margin=0){const horizontal=supportRadius!==null?Math.hypot(p[0],p[2])<=supportRadius+margin:p[0]>=footprint.minX-margin&&p[0]<=footprint.maxX+margin&&p[2]>=footprint.minZ-margin&&p[2]<=footprint.maxZ+margin;return horizontal&&p[1]-floor>=1.2&&p[1]-floor<=2.2;}
 function result(raw){return {position:map(raw.position,offset),quaternion:orient(raw.quaternion,offset.angle)};}
 function reset(raw,angle=0){offset={angle:0,x:0,z:0};previous={position:[...raw.position],quaternion:[...raw.quaternion]};previousAngle=angle;onboard=inside(local(raw.position,angle));transitions=[];}
 function update(raw,angle,{canEnter=true,allowInteriorEntry=false}={}){
  if(!previous)reset(raw,angle);
  const before=map(previous.position,offset),current=map(raw.position,offset),a=local(before,previousAngle),b=local(current,previousAngle);
  if(onboard&&!inside(b,.08)){onboard=false;transitions.push({type:'leave',angle:previousAngle});}
  else if(onboard){
   const delta=angle-previousAngle,[x,z]=rotate(offset.x-pivot[0],offset.z-pivot[2],delta);
   offset={angle:offset.angle+delta,x:x+pivot[0],z:z+pivot[2]};
  }else{
   // Both ends use the OLD platform pose: rotation sweeping over a stationary
   // visitor cannot count as entering. Only the measured motion crosses the portal.
   const dx=b[0]-a[0],t=dx?(portal.x-a[0])/dx:-1,z=a[2]+t*(b[2]-a[2]);
   const throughPortal=canEnter&&a[0]>portal.x&&b[0]<=portal.x&&t>=0&&t<=1&&z>=portal.minZ&&z<=portal.maxZ;
   // Keyboard exploration has no collisions: a visitor can walk through closed
   // glass. Recognise deliberate movement inside, never rotation sweeping a still visitor.
   const freeEntry=allowInteriorEntry&&Math.hypot(b[0]-a[0],b[2]-a[2])>1e-8;
   const throughPlatformEdge=supportRadius!==null&&!inside(a)&&Math.hypot(b[0]-a[0],b[2]-a[2],b[1]-a[1])>1e-8;
   if((throughPlatformEdge||throughPortal||freeEntry)&&inside(b)){
    onboard=true;transitions.push({type:'enter',angle});
   }
  }
  previous={position:[...raw.position],quaternion:[...raw.quaternion]};previousAngle=angle;
  return result(raw);
 }
 return {reset,update,state:()=>({onboard,supportRadius,offset:{...offset},previousAngle,transitions:transitions.slice(-20)})};
}
