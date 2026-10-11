import * as THREE from 'three';
// Optional one-surface pilot detail. The baked base retains all direct/indirect
// illumination; this neutral colour multiplier adds no runtime light or shadow.
export function attachMicrodetail(material,texture,enabled=true){
 material.userData.microdetail=true;
 texture.colorSpace=THREE.NoColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
 material.onBeforeCompile=shader=>{
  shader.uniforms.qmDetail={value:texture};shader.uniforms.qmDetailOn={value:enabled?1:0};material.userData.detailShader=shader;
  shader.vertexShader='varying vec2 qmMeters;\n'+shader.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\n qmMeters = (modelMatrix * vec4(transformed,1.0)).xz;');
  shader.fragmentShader='uniform sampler2D qmDetail;\nuniform float qmDetailOn;\nvarying vec2 qmMeters;\n'+shader.fragmentShader.replace('#include <opaque_fragment>','float qmGain = texture2D(qmDetail,qmMeters).r;\n outgoingLight *= mix(1.0,mix(0.91,1.04,qmGain),qmDetailOn);\n#include <opaque_fragment>');
 };
 material.customProgramCacheKey=()=> 'QM-ground-microdetail-v1';material.needsUpdate=true;
}
