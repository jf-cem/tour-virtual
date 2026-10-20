// Source D5 pine bitmap on the native UV0, with separately baked irradiance.
// Shared with the existing house albedo; no extra full-resolution colour texture.
export function installR12(model,woodAlbedo){
  model.traverse(o=>{
    if(!o.isMesh)return;
    for(const m of Array.isArray(o.material)?o.material:[o.material]){
      if(m.name!=='R12_Pavilion_Wood_BAKED_UNLIT')continue;
      m.onBeforeCompile=s=>{
        s.uniforms.r12Wood={value:woodAlbedo};
        s.vertexShader='varying vec2 r12UV;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nr12UV=uv*2.0;');
        s.fragmentShader='varying vec2 r12UV;\nuniform sampler2D r12Wood;\n'+s.fragmentShader;
        s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\ndiffuseColor.rgb*=texture2D(r12Wood,r12UV).rgb*vec3(.69,.6325,.5175);');
      };
      m.customProgramCacheKey=()=> 'r12-source-wood-static-irradiance-v1';m.needsUpdate=true;
      m.userData.r12={source:'D5 wall/roof albedo',tiling:2,tint:[.69,.6325,.5175],illumination:'neutral Cycles diffuse irradiance, separate UV1'};
    }
  });
}
