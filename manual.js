import * as THREE from 'three';
// Horizontal movement uses the current look direction; diagonal input keeps one speed.
export function moveFree(position, quaternion, forward, sideways, dt, bounds, speed=2){
 const length=Math.hypot(forward,sideways);if(!length||dt<=0)return false;
 if(length>1){forward/=length;sideways/=length;}
 const direction=new THREE.Vector3(0,0,-1).applyQuaternion(quaternion);direction.y=0;
 if(direction.lengthSq()<.0001)direction.set(0,0,-1);direction.normalize();
 const right=new THREE.Vector3().crossVectors(direction,new THREE.Vector3(0,1,0));
 const x=position.x,z=position.z;
 position.addScaledVector(direction,forward*dt*speed).addScaledVector(right,sideways*dt*speed);
 position.x=THREE.MathUtils.clamp(position.x,bounds.minX,bounds.maxX);position.z=THREE.MathUtils.clamp(position.z,bounds.minZ,bounds.maxZ);
 return x!==position.x||z!==position.z;
}
export function projectToRoute(position,points,segments){
 let best=Infinity,along=0,cumulative=0;
 for(let i=0;i<segments.length;i++){
  const delta=points[i+1].clone().sub(points[i]);
  const t=THREE.MathUtils.clamp(position.clone().sub(points[i]).dot(delta)/delta.lengthSq(),0,1);
  const distance=position.distanceToSquared(points[i].clone().addScaledVector(delta,t));
  if(distance<best){best=distance;along=cumulative+t*segments[i];}cumulative+=segments[i];
 }
 return along;
}
