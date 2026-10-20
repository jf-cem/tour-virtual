import * as THREE from 'three';
export function installSurfaces(model,scene,renderer,environment,aux){
 const mapped=new Map(),water=[];
 model.traverse(o=>{if(!o.isMesh)return;const convert=m=>{
  if(mapped.has(m))return mapped.get(m);
  if(/^R8_(Ceramic|Chrome|Charger_Body)_BAKED/.test(m.name)){
   const tex=m.map;tex.channel=1;const chrome=m.name.includes('Chrome'),metal=m.name.includes('Charger_Body'),n=new THREE.MeshStandardMaterial({name:m.name.replace('BAKED_UNLIT','STATIC_PBR'),color:0xffffff,roughness:chrome?.18:metal?.38:.20,metalness:chrome?.85:metal?.35:0,lightMap:tex,lightMapIntensity:1,envMap:environment.texture,envMapIntensity:.65,side:THREE.FrontSide});
   if(metal&&aux){n.normalMap=aux.normal;n.normalScale.set(.10,.10);n.roughness=.70;n.roughnessMap=aux.roughness}
   n.onBeforeCompile=s=>{s.fragmentShader=s.fragmentShader.replace('#include <lights_fragment_end>','#include <lights_fragment_end>\nreflectedLight.directDiffuse=vec3(0.0);reflectedLight.indirectDiffuse=texture2D(lightMap,vLightMapUv).rgb;')};n.customProgramCacheKey=()=> 'r8-static-diffuse-pbr-reflection-v1';mapped.set(m,n);m.dispose();return n;
  }
  if(m.name==='R8_Water'){
   const n=new THREE.MeshPhysicalMaterial({name:'R8_Water_Surface',color:new THREE.Color(.035,.18,.14),roughness:.10,metalness:.05,ior:1.333,clearcoat:.8,clearcoatRoughness:.12,transparent:true,opacity:.82,depthWrite:false,envMap:environment.texture,envMapIntensity:.85});
   n.onBeforeCompile=s=>{s.uniforms.r8WaterTime={value:0};n.userData.uniforms=s.uniforms;s.vertexShader='varying vec3 r8WaterWorld;\n'+s.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nr8WaterWorld=(modelMatrix*vec4(transformed,1.0)).xyz;');s.fragmentShader='varying vec3 r8WaterWorld;\nuniform float r8WaterTime;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_begin>','#include <normal_fragment_begin>\nvec3 waterN=normalize(vec3(.018*cos(r8WaterWorld.x*4.2+r8WaterTime*.38)+.010*sin(r8WaterWorld.z*6.3-r8WaterTime*.24),1.,.018*sin(r8WaterWorld.z*4.8+r8WaterTime*.31)+.009*cos(r8WaterWorld.x*5.1-r8WaterTime*.27)));normal=normalize(mat3(viewMatrix)*waterN);');s.fragmentShader=s.fragmentShader.replace('#include <lights_fragment_end>','#include <lights_fragment_end>\nreflectedLight.directDiffuse*=.15;reflectedLight.indirectDiffuse*=.15;').replace('#include <clearcoat_normal_fragment_begin>','#include <clearcoat_normal_fragment_begin>\n#ifdef USE_CLEARCOAT\nclearcoatNormal=normal;\n#endif')};n.customProgramCacheKey=()=> 'r8-water-small-world-waves-v2';mapped.set(m,n);water.push([o,n]);m.dispose();return n;
  }
  return m;
 };o.material=Array.isArray(o.material)?o.material.map(convert):convert(o.material)});
 let probeTarget=null;
 if(water.length){const visibility=water.map(([o])=>[o,o.visible]);for(const [o] of visibility)o.visible=false;const target=new THREE.WebGLCubeRenderTarget(128,{type:THREE.HalfFloatType,generateMipmaps:true,minFilter:THREE.LinearMipmapLinearFilter}),camera=new THREE.CubeCamera(.08,100,target);camera.position.set(-44.8,1.70,-4.0);scene.add(camera);camera.update(renderer,scene);scene.remove(camera);const pmrem=new THREE.PMREMGenerator(renderer);probeTarget=pmrem.fromCubemap(target.texture);probeTarget.texture.name='R8_Static_Water_Probe_128';pmrem.dispose();target.dispose();for(const [o,v] of visibility)o.visible=v;for(const [,m] of water){m.envMap=probeTarget.texture;m.needsUpdate=true}}
 return {update:t=>{for(const [,m] of water)if(m.userData.uniforms)m.userData.uniforms.r8WaterTime.value=t},dispose:()=>probeTarget?.dispose()};
}
