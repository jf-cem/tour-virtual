import * as THREE from 'three';
export function attachGrass(material,texture){
 material.onBeforeCompile=shader=>{
  shader.uniforms.r2Grass={value:texture};
  shader.vertexShader='varying vec2 r2GrassUV;\n'+shader.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nr2GrassUV=(modelMatrix*vec4(transformed,1.0)).xz / 1.1;');
  shader.fragmentShader='uniform sampler2D r2Grass;\nvarying vec2 r2GrassUV;\n'+shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\ndiffuseColor.rgb *= texture2D(r2Grass,r2GrassUV).rgb;');
 };material.customProgramCacheKey=()=> 'r2-grass-lighting-albedo-v1';material.needsUpdate=true;
}
export function environment(renderer){
 const s=new THREE.Scene();const g=new THREE.SphereGeometry(50,32,16);
 const m=new THREE.ShaderMaterial({side:THREE.BackSide,vertexShader:'varying vec3 v;void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'varying vec3 v;void main(){float t=normalize(v).y;vec3 c=mix(vec3(.22,.25,.20),vec3(.64,.79,.92),smoothstep(-.3,.5,t));gl_FragColor=vec4(c,1.0);}'});
 s.add(new THREE.Mesh(g,m));const gen=new THREE.PMREMGenerator(renderer);const target=gen.fromScene(s,.06,.1,100,{size:128});gen.dispose();g.dispose();m.dispose();return target;
}
