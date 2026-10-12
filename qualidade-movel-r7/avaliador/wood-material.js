// Original D5 albedo over neutral static lighting. UV0 retains D5 tiling;
// the map bound to this unlit material uses the independent BakedUV channel.
export function attachWood(material,albedo){
 material.onBeforeCompile=shader=>{
  shader.uniforms.r6WoodAlbedo={value:albedo};
  shader.vertexShader='varying vec2 vR6WoodUV;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvR6WoodUV=uv*2.0;');
  shader.fragmentShader='uniform sampler2D r6WoodAlbedo;\nvarying vec2 vR6WoodUV;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\ndiffuseColor.rgb*=texture2D(r6WoodAlbedo,vR6WoodUV).rgb*vec3(0.584078,0.539479,0.439657);');
 };
 material.customProgramCacheKey=()=> 'R6_D5_wood_neutral_static_v1';material.needsUpdate=true;
}
