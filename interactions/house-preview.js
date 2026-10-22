import * as THREE from 'three';

// Reuse only the actual envelope/platform geometry; no second GLB or texture load.
export function installHousePreview(container,house,section){
 let renderer,scene,camera,root,lastKey='',frames=0,unavailable=false;const parts=[],materials=new Map(),inverse=new THREE.Matrix4();
 function init(){
  scene=new THREE.Scene();root=new THREE.Group();scene.add(root);
  camera=new THREE.OrthographicCamera(-7.6,7.6,4,-4,.1,60);camera.position.set(12,9,12);camera.lookAt(0,.8,0);
  renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(280,148,false);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor(0x000000,0);renderer.domElement.setAttribute('aria-hidden','true');container.append(renderer.domElement);
  scene.add(new THREE.HemisphereLight(0xe3edff,0x34466c,2.4));const sun=new THREE.DirectionalLight(0xffffff,2);sun.position.set(6,12,8);scene.add(sun);
  house.group.updateWorldMatrix(true,true);inverse.copy(house.group.matrixWorld).invert();
  house.group.traverse(source=>{
   if(!source.isMesh||Array.isArray(source.material))return;
   const name=source.material.name;
   if(!/^(R6_House_Painted_Dielectric|R6_House_Glass|R6_Wood_Lighting_BAKED_UNLIT|R21_Platform_Source_PBR|R6_D5_\*2)$/.test(name))return;
   let material=materials.get(name);
   if(!material){const glass=name==='R6_House_Glass',wood=name.includes('Wood'),platform=name.includes('Platform'),solar=name.includes('*2');material=new THREE.MeshLambertMaterial({color:glass?0x9ec9ee:wood?0xc6a77f:platform?0x966e4f:solar?0x29476b:0x536986,transparent:glass,opacity:glass?.22:1,depthWrite:!glass,side:THREE.DoubleSide});materials.set(name,material);}
   const mesh=new THREE.Mesh(source.geometry,material);mesh.visible=source.visible;mesh.matrixAutoUpdate=false;mesh.matrix.multiplyMatrices(inverse,source.matrixWorld);root.add(mesh);parts.push({source,mesh});
  });
 }
 return {
  update(){
   if(unavailable||!section.open||section.dataset.presentation!=='phone'||section.dataset.phoneTab!=='casa')return;
   const angle=house.group.rotation.y,key=Math.round(angle*360/Math.PI)+'/'+Math.round(house.door.state().openness*40)+'/'+(house.door.state().openness>0);
   if(renderer&&key===lastKey)return;
   if(!renderer)try{init();}catch{unavailable=true;container.append(document.createTextNode('Miniatura indisponÃ­vel'));return;}
   house.group.updateWorldMatrix(true,true);inverse.copy(house.group.matrixWorld).invert();for(const {source,mesh} of parts){mesh.geometry=source.geometry;mesh.visible=source.visible;mesh.matrix.multiplyMatrices(inverse,source.matrixWorld);}
   root.rotation.y=angle;renderer.render(scene,camera);lastKey=key;frames++;
  },
  state:()=>({initialized:!!renderer,parts:parts.map(p=>({source:p.source.name,material:p.source.material.name,sharedGeometry:p.source.geometry===p.mesh.geometry,visibilityMatches:p.source.visible===p.mesh.visible})),frames,triangles:renderer?.info.render.triangles||0,angle:root?.rotation.y||0,textureCount:renderer?.info.memory.textures||0})
 };
}
