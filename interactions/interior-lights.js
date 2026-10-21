import * as THREE from 'three';
import {LIGHTING_MODES,sampleLightingMode} from './lighting-modes.mjs';
// Existing baked diffuse remains the baseline. Point lights affect PBR once;
// a local additive term supplies their approximation on unlit interior surfaces.
export function installInteriorLights(group){
 const color=new THREE.Color('#456aff'),inverse=new THREE.Matrix4(),strength={value:0};
 const positions=[new THREE.Vector3(-1.1,1.9,-.7),new THREE.Vector3(1.2,1.9,.6)];
 const pointLights=positions.map((p,i)=>{const light=new THREE.PointLight(color,0,4.5,2);light.name='CeM_Interior_RGB_'+i;light.position.copy(p);light.visible=false;group.add(light);return light;});
 const materials=new Set();group.traverse(o=>{if(o.isMesh)for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);});
 const leds=[...materials].filter(m=>m.name.startsWith('R12_LED_')).map(m=>({m,color:m.color.clone(),emissive:m.emissive?.clone()}));
 const baked=[...materials].filter(m=>/^R6_(Wood|Seats|Cork|Equipment)_Lighting_BAKED_UNLIT$/.test(m.name));
 for(const m of baked){const previous=m.onBeforeCompile,key=m.customProgramCacheKey();
  m.onBeforeCompile=function(shader,renderer){previous.call(this,shader,renderer);shader.uniforms.cemRgbInverse={value:inverse};shader.uniforms.cemRgbColor={value:color};shader.uniforms.cemRgbStrength=strength;
   shader.vertexShader='uniform mat4 cemRgbInverse; varying vec3 cemRgbPosition; varying vec3 cemRgbNormal;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ncemRgbPosition=(cemRgbInverse*modelMatrix*vec4(transformed,1.)).xyz;cemRgbNormal=normalize(mat3(cemRgbInverse*modelMatrix)*normal);');
   shader.fragmentShader='uniform vec3 cemRgbColor; uniform float cemRgbStrength; varying vec3 cemRgbPosition; varying vec3 cemRgbNormal;\n'+shader.fragmentShader.replace('#include <opaque_fragment>',`if(cemRgbStrength>0.){
    vec3 n=normalize(cemRgbNormal)*(gl_FrontFacing?1.:-1.);
    vec3 a=vec3(-1.1,1.9,-.7)-cemRgbPosition,b=vec3(1.2,1.9,.6)-cemRgbPosition;
    float lightA=pow(max(0.,1.-length(a)/4.5),2.)*max(0.,dot(n,normalize(a)));
    float lightB=pow(max(0.,1.-length(b)/4.5),2.)*max(0.,dot(n,normalize(b)));
    float interior=(1.-smoothstep(2.65,2.95,abs(cemRgbPosition.x)))*(1.-smoothstep(2.35,2.7,abs(cemRgbPosition.z)));
    outgoingLight+=cemRgbColor*cemRgbStrength*(lightA+lightB)*interior;
   }\n#include <opaque_fragment>`);m.userData.cemRgbReady=true;
  };m.customProgramCacheKey=()=>key+'-cem-interior-rgb-v1';m.needsUpdate=true;
 }
 const baseColor=color.clone();let enabled=false,intensity=1,mode='solid',clock=0,effectiveIntensity=0;
 function update(dt=0){if(enabled)clock+=Math.max(0,Number(dt)||0);const sample=sampleLightingMode(mode,clock);if(sample.hue===null)color.copy(baseColor);else color.setHSL(sample.hue,1,.5);effectiveIntensity=enabled?intensity*sample.level:0;group.updateWorldMatrix(true,false);inverse.copy(group.matrixWorld).invert();strength.value=effectiveIntensity*1.25;for(const l of pointLights){l.visible=effectiveIntensity>0;l.intensity=effectiveIntensity*5;l.color.copy(color);}for(const p of leds){if(enabled){p.m.color.copy(color).multiplyScalar(effectiveIntensity);p.m.emissive?.copy(color).multiplyScalar(effectiveIntensity);}else{p.m.color.copy(p.color);if(p.emissive)p.m.emissive.copy(p.emissive);}}}
 return {update,setMode:value=>{if(!LIGHTING_MODES.includes(value))throw Error('Modo de luz inválido');mode=value;clock=0;update();},setColor:hex=>{baseColor.set(hex);enabled=true;update();},setEnabled:value=>{enabled=Boolean(value);update();},setIntensity:value=>{intensity=THREE.MathUtils.clamp(Number(value)||0,0,2);update();},restore:()=>{enabled=false;mode='solid';clock=0;update();},materials:()=>leds.map(p=>p.m.name),state:()=>({enabled,intensity,mode,clock,effectiveIntensity,color:'#'+baseColor.getHexString(),effectiveColor:'#'+color.getHexString(),bakedApproximation:baked.map(m=>m.name),pointLights:pointLights.map(l=>({position:l.position.toArray(),visible:l.visible,intensity:l.intensity}))})};
}
