import * as THREE from 'three';
const clamp=v=>Math.max(-1.35,Math.min(1.35,v));
const wrap=v=>Math.atan2(Math.sin(v),Math.cos(v));
const angles=q=>new THREE.Euler().setFromQuaternion(q,'YXZ');
const quaternion=(pitch,yaw)=>new THREE.Quaternion().setFromEuler(new THREE.Euler(clamp(pitch),yaw,0,'YXZ'));

// Align heading and elevation independently. A full relative quaternion would
// rotate the camera axes with the handset's initial tilt and introduce roll.
export function createFixedLook(){
 let anchor=null,base=null,last=null,current=null;
 function align(view){base=angles(view);anchor=last;current=quaternion(base.x,base.y);return current.clone();}
 function sample(event,screenAngle,view){
  if(![event.alpha,event.beta,event.gamma].every(Number.isFinite))return null;
  const rad=Math.PI/180;
  const sensor=new THREE.Quaternion().setFromEuler(new THREE.Euler(event.beta*rad,event.alpha*rad,-event.gamma*rad,'YXZ'));
  sensor.multiply(new THREE.Quaternion(-Math.SQRT1_2,0,0,Math.SQRT1_2));
  sensor.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),-screenAngle*rad));
  last=angles(sensor);
  if(!anchor||!base)align(view);
  current=quaternion(base.x+wrap(last.x-anchor.x),base.y+wrap(last.y-anchor.y));
  return current.clone();
 }
 return {sample,recenter:align,reanchor:()=>{anchor=null;},reset:()=>{anchor=base=last=current=null;}};
}
