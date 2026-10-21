import * as THREE from 'three';
// Split existing triangles, interpolating EVERY vertex attribute. This keeps UVs
// and the fixed glazing above the measured transom instead of moving the roof.
export function splitSurfaceGeometry(geometry,select,cutY=Infinity){
 const src=geometry.index?geometry.toNonIndexed():geometry,attrs=Object.entries(src.attributes),fixed=[],moving=[];
 const vertex=i=>Object.fromEntries(attrs.map(([name,a])=>[name,Array.from({length:a.itemSize},(_,k)=>a.array[i*a.itemSize+k]) ]));
 const mix=(a,b,t)=>Object.fromEntries(attrs.map(([n])=>[n,a[n].map((v,k)=>v+(b[n][k]-v)*t)]));
 function clip(poly,below){const result=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],ia=below?a.position[1]<=cutY:a.position[1]>=cutY,ib=below?b.position[1]<=cutY:b.position[1]>=cutY;if(ia)result.push(a);if(ia!==ib)result.push(mix(a,b,(cutY-a.position[1])/(b.position[1]-a.position[1])));}return result;}
 const emit=(poly,target,material)=>{for(let i=1;i<poly.length-1;i++)target.push({vertices:[poly[0],poly[i],poly[i+1]],material});};
 for(let i=0;i<src.attributes.position.count;i+=3){const v=[0,1,2].map(k=>vertex(i+k)),material=(src.groups.find(g=>i>=g.start&&i<g.start+g.count)||{}).materialIndex||0;if(select(v.map(v=>v.position))){emit(clip(v,true),moving,material);emit(clip(v,false),fixed,material);}else emit(v,fixed,material);}
 function build(triangles){const g=new THREE.BufferGeometry();for(const [name,a]of attrs){const data=[];for(const t of triangles)for(const v of t.vertices)data.push(...v[name]);g.setAttribute(name,new THREE.BufferAttribute(new a.array.constructor(data),a.itemSize,a.normalized));}let start=0,last=null;for(const t of triangles){if(t.material!==last){g.addGroup(start,3,t.material);last=t.material;}else g.groups.at(-1).count+=3;start+=3;}g.computeBoundingBox();g.computeBoundingSphere();return g;}
 const result={fixed:build(fixed),moving:build(moving),selectedTriangles:moving.length};if(src!==geometry)src.dispose();return result;
}
export function installSimpleDoor(houseGroup){
 const hinge=new THREE.Group();hinge.name='CeM_Simple_Door_Hinge';houseGroup.add(hinge);houseGroup.updateMatrixWorld(true);
 // Front panel source m572: x[-42.04702,-41.98046], z[.43081,1.43143].
 // Original front transom m171 starts at Y=3.4263747 m; keep the upper glass fixed.
 const worldHinge=new THREE.Vector3(-41.989,1.426106,1.438);hinge.position.copy(houseGroup.worldToLocal(worldHinge.clone()));houseGroup.updateMatrixWorld(true);
 const parts=[],meshes=[];houseGroup.traverse(o=>{if(o.isMesh)meshes.push(o);});
 for(const mesh of meshes){const names=(Array.isArray(mesh.material)?mesh.material:[mesh.material]).map(m=>m.name);let selected;
  if(names.includes('R6_House_Glass'))selected=vs=>vs.every(p=>p[0]>=-42.048&&p[0]<=-41.979&&p[2]>=.4307&&p[2]<=1.4316);
  else if(names.includes('R6_House_Painted_Dielectric'))selected=vs=>vs.every(p=>p[0]>=-42.08&&p[0]<=-41.99&&p[1]>=2.20&&p[1]<=2.50&&p[2]>=.48&&p[2]<=.53);
  else continue;
  const split=splitSurfaceGeometry(mesh.geometry,selected,names.includes('R6_House_Glass')?3.4263747:Infinity);if(!split.selectedTriangles){split.fixed.dispose();split.moving.dispose();continue;}
  const leaf=new THREE.Mesh(split.moving,mesh.material);leaf.name=mesh.name+'_DoorLeaf';leaf.position.copy(mesh.position);leaf.quaternion.copy(mesh.quaternion);leaf.scale.copy(mesh.scale);mesh.parent.add(leaf);houseGroup.updateMatrixWorld(true);hinge.attach(leaf);leaf.visible=false;parts.push({mesh,original:mesh.geometry,fixed:split.fixed,leaf,triangles:split.selectedTriangles});
 }
 let openness=0,target=0;
 function update(dt){openness+=Math.sign(target-openness)*Math.min(Math.abs(target-openness),Math.max(0,dt)/1.6);const eased=openness*openness*(3-2*openness);hinge.rotation.y=-Math.PI/2*eased;const open=openness>0;for(const p of parts){p.mesh.geometry=open?p.fixed:p.original;p.leaf.visible=open;}hinge.updateMatrixWorld(true);}
 return {update,toggle:()=>{target=target?0:1;},setOpen:value=>{target=value?1:0;},state:()=>({implemented:parts.length>0,openness,target,pivot:worldHinge.toArray(),parts:parts.map(p=>({mesh:p.mesh.name,triangles:p.triangles})),extraGeometryBytes:parts.reduce((sum,p)=>sum+[p.fixed,p.leaf.geometry].reduce((s,g)=>s+Object.values(g.attributes).reduce((a,v)=>a+v.array.byteLength,0),0),0),mode:'abertura simples lateral; sem braço mecânico',source:'painel frontal m572 e puxadores m599/m600; corte sob travessa m171',hingeStatus:'eixo vertical de abertura simples inferido no bordo lateral, por revisão visual'})};
}
