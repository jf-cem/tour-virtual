import * as THREE from 'three';
// Continue the native Archimedean stone bands in world metres. Camera-independent.
export function installWaveShader(material,shader){
 shader.vertexShader='varying vec3 r15World;\n'+shader.vertexShader;
 shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nr15World=(modelMatrix*vec4(position,1.)).xyz;');
 shader.fragmentShader='varying vec3 r15World;\nvec2 r15UV,r15DX,r15DY,r15TangentUV;\n'+shader.fragmentShader;
 const projection=`
 vec2 r15D=vec2(r15World.x+38.69157385,-r15World.z-.18484614);
 float r15R=length(r15D),r15A=atan(r15D.y,r15D.x);
 float r15Q=r15R-(.9/6.28318530718)*r15A-.25096532;
 float r15Dist=abs(mod(r15Q-.2+.45,.9)-.45)-.2;
 float r15AA=max(.0008,min(.15,fwidth(r15R)+.14324*length(fwidth(r15D))/max(r15R,.1)));
 float r15Dark=1.-smoothstep(-r15AA,r15AA,r15Dist);
 float r15Row=floor(r15R/.1),r15RM=(r15Row+.5)*.1;
 float r15Circ=.5*max(1.,floor(6.28318530718*r15RM/.5+.5));
 float r15Arc=r15A/6.28318530718*r15Circ+.05*mod(r15Row,2.);
 float r15R2=max(dot(r15D,r15D),.01),r15CourseRadius=r15Circ/6.28318530718;
 r15DX=vec2(r15CourseRadius*(r15D.x*dFdx(r15D.y)-r15D.y*dFdx(r15D.x))/r15R2,dFdx(r15R));
 r15DY=vec2(r15CourseRadius*(r15D.x*dFdy(r15D.y)-r15D.y*dFdy(r15D.x))/r15R2,dFdy(r15R));
 r15TangentUV=vec2(r15A*r15R,r15R);
 vec2 r15WhiteUV=vec2(.02+.46*fract(r15Arc/.5),r15R);
 vec2 r15DarkUV=r15WhiteUV+vec2(.5,0.);
 r15UV=r15WhiteUV;
 vec4 r15Albedo=textureGrad(map,r15WhiteUV,r15DX,r15DY);
 r15Albedo.rgb*=mix(vec3(1.),vec3(.075,.076,.074),r15Dark);
 diffuseColor*=r15Albedo;
 `;
 shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',projection);
 shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_begin>',THREE.ShaderChunk.normal_fragment_begin.replaceAll('vNormalMapUv','r15TangentUV'));
 shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',THREE.ShaderChunk.normal_fragment_maps.replaceAll('vNormalMapUv','r15UV').replaceAll('texture2D( normalMap, r15UV )','textureGrad( normalMap, r15UV, r15DX, r15DY )'));
 material.userData.r15WaveCompiled=true;
}
