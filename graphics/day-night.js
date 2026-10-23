import * as THREE from 'three';
import {createDayClock} from './day-cycle.mjs';
import {installWaveShader} from './r15-waves.js';
import {loadDayAlbedos} from './day-albedo.js';

// Applied after all R21 material replacements and the house RGB installation.
// Every former irradiance bake is removed before adding any dynamic lighting.
export async function installDayNight({scene,renderer,model,house,camera,sun,hemisphere,textures}){
 const clock=createDayClock(),inventory=[],materials=new Set(),env=[];
 const U={envTint:{value:new THREE.Color(1,1,1)}};
 const albedos=await loadDayAlbedos(renderer),retired=new Set();
 const sourceWood=textures.find(t=>t.name==='R6_D5_Wood_Albedo');
 const wood=sourceWood.clone();wood.channel=0;wood.repeat.set(2,2);wood.needsUpdate=true;
 const grass=textures.find(t=>t.name==='R2_D5_Ground_Albedo'),skyEnvironment=textures.find(t=>t.name==='R2_Static_Environment');
 const plain={R8_Charger_Rubber_BAKED_UNLIT:[[.024,.029,.033],.85,0],R8_Charger_Trim_BAKED_UNLIT:[[.042,.052,.062],.57,0],R8_Bench_Frame_BAKED_UNLIT:[[.042,.052,.062],.57,0],R8_Ceramic_STATIC_PBR:[[.82,.80,.75],.2,0],R8_Chrome_STATIC_PBR:[[.64,.67,.70],.18,.85]};
 const replacements=new Map();
 function remember(m,n,mode){for(const t of [m.map,m.lightMap])if(t&&t!==n.map)retired.add(t);inventory.push({name:m.name,mode,bakeRemoved:true});n.userData.cemDynamicAlbedo=true;replacements.set(m,n);return n;}
 model.traverse(o=>{if(!o.isMesh)return;const convert=m=>{
  if(replacements.has(m))return replacements.get(m);
  if(['R6_Wood_Lighting_BAKED_UNLIT','R12_Pavilion_Wood_BAKED_UNLIT'].includes(m.name)){
   const n=new THREE.MeshStandardMaterial({name:m.name,map:wood,color:new THREE.Color(...(m.name.startsWith('R6')?[.584078,.539479,.439657]:[.69,.6325,.5175])),roughness:.82,side:m.side});
   return remember(m,n,'source-albedo-dynamic');
  }
  if(albedos.has(m.name)||plain[m.name]){
   const spec=plain[m.name],n=new THREE.MeshStandardMaterial({name:m.name,map:albedos.get(m.name)||null,color:spec?new THREE.Color(...spec[0]):new THREE.Color(1,1,1),roughness:spec?spec[1]:m.name.includes('Ground')?.92:m.name.includes('Seats')?.65:m.name.includes('Charger')?.7:.75,metalness:spec?spec[2]:m.name.includes('Charger')?.35:0,side:m.side});
   if(m.envMap){n.envMap=m.envMap;n.envMapIntensity=m.envMapIntensity;}
   return remember(m,n,albedos.has(m.name)?'Blender-base-colour-EMIT-no-light':'source-solid-albedo');
  }
  if(['R2_Lawn_BAKED_LIGHTING','R5_Lawn_BAKED_LIGHTING'].includes(m.name)){
   const n=new THREE.MeshStandardMaterial({name:m.name,map:grass,roughness:1,color:new THREE.Color(.65,.7,.58),side:m.side});
   n.onBeforeCompile=s=>{s.vertexShader='varying vec2 cemGrassUV;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ncemGrassUV=(modelMatrix*vec4(transformed,1.)).xz/1.1;');s.fragmentShader='varying vec2 cemGrassUV;\n'+s.fragmentShader.replace('#include <map_fragment>','diffuseColor*=texture2D(map,cemGrassUV);');};n.customProgramCacheKey=()=> 'cem-grass-source-albedo-dynamic-v1';
   return remember(m,n,'grass-source-albedo-no-irradiance');
  }
  // R9 circle was authored with an EMIT colour bake: keep its native pattern, relight once.
  if(m.name==='R9_Circle_BAKED_UNLIT'||m.name==='R18_EnvioJoao_Grass_UNLIT'){
   const n=new THREE.MeshStandardMaterial({name:m.name,map:m.map,color:m.color,roughness:.95,side:m.side,alphaTest:m.alphaTest,transparent:m.transparent,opacity:m.opacity,depthWrite:m.depthWrite});return remember(m,n,'existing-colour-only-map-dynamic');
  }
  return m;
 };o.material=Array.isArray(o.material)?o.material.map(convert):convert(o.material);for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);});
 // Restore direct light where R10 explicitly replaced it with the static irradiance.
 for(const m of materials){
  if(/^R10_.*Ground_Paving_REAL_MAPS/.test(m.name)){
   if(m.lightMap)retired.add(m.lightMap);m.lightMap=null;m.envMapIntensity=.18;
   m.onBeforeCompile=s=>{if(m.userData.r15WaveCompiled)installWaveShader(m,s);};
   m.customProgramCacheKey=()=>m.userData.r15WaveCompiled?'cem-day-paving-wave-v1':'cem-day-paving-v1';m.needsUpdate=true;
   inventory.push({name:m.name,mode:'source-albedo-dynamic',bakeRemoved:true});
  }
  if(m.envMap){retired.add(m.envMap);m.envMap=skyEnvironment;env.push({m,intensity:m.envMapIntensity??1});}
  if(m.lightMap||(/BAKED|Lighting/.test(m.name)&&m.isMeshBasicMaterial))throw Error('Material ainda contém iluminação fixa: '+m.name);
 }
 const used=new Set();for(const m of materials)for(const t of Object.values(m))if(t?.isTexture)used.add(t);for(const t of retired)if(!used.has(t)){t.userData.cemRetired=true;t.dispose();}
 for(const {m} of env){const previous=m.onBeforeCompile,key=m.customProgramCacheKey();m.onBeforeCompile=function(s,r){previous.call(this,s,r);s.uniforms.cemEnvTint=U.envTint;s.fragmentShader='uniform vec3 cemEnvTint;\n'+s.fragmentShader.replace('#include <envmap_physical_pars_fragment>',THREE.ShaderChunk.envmap_physical_pars_fragment.replaceAll('envMapColor.rgb * envMapIntensity','envMapColor.rgb * envMapIntensity * cemEnvTint'));};m.customProgramCacheKey=()=>key+'-daily-environment-v1';m.needsUpdate=true;}
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-46,right:46,top:35,bottom:-35,near:.5,far:180});sun.shadow.camera.updateProjectionMatrix();sun.shadow.bias=-.00015;sun.shadow.normalBias=.035;sun.shadow.autoUpdate=false;
 scene.add(sun.target);const centre=new THREE.Vector3(-30,2,0),box=new THREE.Box3();
 let casters=0,receivers=0;
 model.updateMatrixWorld(true);
 model.traverse(o=>{if(!o.isMesh)return;const ms=Array.isArray(o.material)?o.material:[o.material];box.setFromObject(o);const c=box.getCenter(new THREE.Vector3());
  // Avoid the city-wide mesh and transparent glass shadowing the whole pavilion.
  o.castShadow=c.distanceTo(centre)<51&&box.getSize(new THREE.Vector3()).length()<85&&ms.every(m=>!m.transparent&&!/Poster|QR|LED|Water/i.test(m.name));
  o.receiveShadow=ms.some(m=>m.isMeshStandardMaterial&&!m.lightMap);casters+=Number(o.castShadow);receivers+=Number(o.receiveShadow);
 });
 const warm=[[-1.1,2.0,-.7],[1.2,2,.6]].map(p=>{const l=new THREE.PointLight(0xffcfa0,0,4.5,2);l.position.fromArray(p);l.name='CeM_Automatic_Night';house.group.add(l);return l;});
 // Small procedural sky. No network assets, cube-camera animation or new renderer.
 const skyU={zenith:{value:new THREE.Color()},horizon:{value:new THREE.Color()},sunDir:{value:new THREE.Vector3()},disc:{value:1}};
 const sky=new THREE.Mesh(new THREE.SphereGeometry(360,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:skyU,
 vertexShader:'varying vec3 skyDirection;void main(){skyDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:'varying vec3 skyDirection;uniform vec3 zenith,horizon,sunDir;uniform float disc;void main(){vec3 d=normalize(skyDirection);float h=smoothstep(-.08,.75,d.y);vec3 col=mix(horizon,zenith,h);float s=max(0.,dot(d,sunDir));col+=disc*(vec3(1.,.75,.4)*pow(s,600.)*.22+vec3(2.,1.6,1.)*smoothstep(.999985,.999991,s));gl_FragColor=vec4(col,1.);#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'.replace(';#include',';\n#include')
 }));sky.name='CeM_Daily_Sky';sky.frustumCulled=false;sky.renderOrder=-10;scene.add(sky);
 const dayZenith=new THREE.Color('#387fb8'),nightZenith=new THREE.Color('#030817'),dayHorizon=new THREE.Color('#c5dce9'),nightHorizon=new THREE.Color('#111c32'),sunset=new THREE.Color('#ef9361');
 const white=new THREE.Color('#fff6df'),orange=new THREE.Color('#ffac62'),daySky=new THREE.Color('#e8f4ff'),nightSky=new THREE.Color('#8faee0');
 let lastShadow=-Infinity,lastAngle=NaN,lastDoor=NaN,shadowUpdates=0,sample;
 function update(dt=0){
  sample=clock.update(dt,document.hidden);const {daylight:d,night:n,warmth:w}=sample;
  U.envTint.value.setRGB(.45+.55*d,.58+.42*d,.9+.1*d).multiply(new THREE.Color(1,1-.16*w,1-.35*w));
  hemisphere.intensity=.34+1.0*d;hemisphere.color.copy(nightSky).lerp(daySky,d);hemisphere.groundColor.setRGB(.10+.10*d,.11+.12*d,.14+.035*d);
  sun.intensity=3.0*sample.sunlight;sun.color.copy(white).lerp(orange,w);sun.target.position.copy(centre);sun.position.copy(centre).addScaledVector(new THREE.Vector3(...sample.direction).normalize(),90);
  sun.visible=true;skyU.sunDir.value.copy(sun.position).sub(centre).normalize();skyU.disc.value=sample.sunlight;
  skyU.zenith.value.copy(nightZenith).lerp(dayZenith,d);skyU.horizon.value.copy(nightHorizon).lerp(dayHorizon,d).lerp(sunset,w*.7);sky.position.copy(camera.position);
  if(scene.fog)scene.fog.color.copy(skyU.horizon.value);
  for(const l of warm){l.intensity=n*8*(house.rgbLighting.state().enabled?.12:1);l.visible=true;}
  for(const {m,intensity} of env)m.envMapIntensity=intensity*(.055+.945*d);
  // Solar cache capped at 10 Hz during playback; platform/door movement also invalidates it.
  const moving=lastAngle!==house.group.rotation.y||lastDoor!==house.door.state().openness;
  const now=performance.now();if(sample.sunlight>.001&&(Math.abs(sample.hour-lastShadow)>.015||moving||lastAngle!==house.group.rotation.y)&&now-(update.lastAt||0)>100){sun.shadow.needsUpdate=true;lastShadow=sample.hour;lastAngle=house.group.rotation.y;lastDoor=house.door.state().openness;update.lastAt=now;shadowUpdates++;}
  syncUI();
 }
 const section=document.createElement('details');section.className='control-section day-controls';section.innerHTML='<summary>Hora do dia · <span id="day-summary">12:00</span></summary><label for="day-hour">Hora no espaço virtual</label><div class="day-row"><input id="day-hour" type="range" min="0" max="1439" step="1" value="720"><output id="day-time" for="day-hour">12:00</output></div><div class="day-presets"><button type="button" data-hour="8">Manhã</button><button type="button" data-hour="12">Dia</button><button type="button" data-hour="17.5">Entardecer</button><button type="button" data-hour="22">Noite</button></div><button type="button" id="day-play" aria-pressed="false">▶ Ciclo de 24 horas</button><p>Um dia em 2 minutos. Escolher uma hora pausa o ciclo. O sol nasce atrás da casa (este).</p>';
 document.querySelector('#controls-body').prepend(section);
 const slider=section.querySelector('#day-hour'),time=section.querySelector('#day-time'),summary=section.querySelector('#day-summary'),play=section.querySelector('#day-play');
 slider.setAttribute('aria-label','Hora no espaço virtual');slider.oninput=()=>setHour(Number(slider.value)/60);section.querySelectorAll('[data-hour]').forEach(b=>b.onclick=()=>setHour(Number(b.dataset.hour)));play.onclick=()=>clock.setPlaying(!clock.state().playing);
 let lastLabel='';function syncUI(){const s=clock.state(),minutes=Math.floor(s.hour*60),label=String(Math.floor(minutes/60)).padStart(2,'0')+':'+String(minutes%60).padStart(2,'0');if(label!==lastLabel){time.textContent=summary.textContent=label;slider.value=minutes;slider.setAttribute('aria-valuetext',label);lastLabel=label;}play.textContent=s.playing?'Ⅱ Pausar ciclo':'▶ Ciclo de 24 horas';play.setAttribute('aria-pressed',String(s.playing));section.hidden=document.querySelector('#reference')?.getAttribute('aria-pressed')==='true';}
 function setHour(h){clock.setHour(h);lastShadow=-Infinity;update();}
 update();
 await renderer.compileAsync(scene,camera);renderer.render(scene,camera);
 return {update,setHour,setPlaying:clock.setPlaying,state:()=>({...clock.state(),sample,casters,receivers,shadowSize:2048,shadowUpdates,inventory,materials:[...materials].map(m=>({name:m.name,type:m.type,baked:!!m.lightMap,dayCompiled:!!m.userData.cemDayCompiled})),automaticWarmLights:warm.map(l=>l.intensity),exposure:renderer.toneMappingExposure}),textures:()=>[wood,...new Set(albedos.values())]};
}






