import {installR12} from './r12-surfaces.js';
import {installR16} from './r16-surfaces.js';
import {installR11} from './r11-surfaces.js';
import {installR10} from './r10-surfaces.js';
import {installSurfaces} from './r8-surfaces.js';
import {attachWood} from './wood-material.js';
import * as THREE from 'three';
import {GLTFLoader} from './vendor/loaders/GLTFLoader.js';
import {KTX2Loader} from './vendor/loaders/KTX2Loader.js';
import {MeshoptDecoder} from './vendor/libs/meshopt_decoder.module.js';
import {attachMicrodetail} from './quality-materials.js';
import {attachGrass,environment} from './r2-materials.js';

export async function loadR19(scene,renderer){
const config=await fetch(new URL('./presentation.json',import.meta.url)).then(r=>r.json()),id='pilot-mixed';
const mats=root=>{const set=new Set();root.traverse(o=>{if(o.isMesh)for(const m of Array.isArray(o.material)?o.material:[o.material])set.add(m)});return [...set]};
const ktx=new KTX2Loader().setTranscoderPath(new URL('./vendor/libs/basis/',import.meta.url).href).setWorkerLimit(2).detectSupport(renderer);
const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).setKTX2Loader(ktx);
let model,asset,grassmap,envTarget,houseEnvTarget,woodmap,r8Aux,r8Surfaces;
const micromap=await new THREE.TextureLoader().loadAsync(new URL('../textures/microdetail.png',import.meta.url).href);
micromap.name='QM_Microdetail_Data';micromap.colorSpace=THREE.NoColorSpace;micromap.wrapS=micromap.wrapT=THREE.RepeatWrapping;micromap.anisotropy=config.anisotropy;
const attachDetail=m=>attachMicrodetail(m,micromap,true);
const gltf=await loader.loadAsync(new URL('../model-r19.glb',import.meta.url).href);model=gltf.scene;asset=id;scene.add(model);if(id.startsWith('pilot')||id.startsWith('r2')||id.startsWith('r7')||id.startsWith('r8')||id.startsWith('r9')){grassmap=await ktx.loadAsync(new URL('../textures/ground-albedo.ktx2',import.meta.url).href);grassmap.name='R2_D5_Ground_Albedo';grassmap.userData.qmBasis=true;if(!grassmap.isCompressedTexture)throw new Error('Albedo KTX2 sem compressão GPU');grassmap.colorSpace=THREE.SRGBColorSpace;grassmap.wrapS=grassmap.wrapT=THREE.RepeatWrapping;grassmap.anisotropy=config.anisotropy;envTarget=environment(renderer);envTarget.texture.name="R2_Static_Environment";}
  const basisImages=new Set((gltf.parser.json.textures||[]).filter(t=>t.extensions?.KHR_texture_basisu).map(t=>t.extensions.KHR_texture_basisu.source));
  await Promise.all([...basisImages].map(async i=>{const tex=await gltf.parser.getDependency('texture',(gltf.parser.json.textures||[]).findIndex(t=>t.extensions?.KHR_texture_basisu?.source===i));tex.userData.qmBasis=true;if(!tex.isCompressedTexture)throw new Error('KTX2 descodificado sem compressão GPU: '+i)}));
  if(mats(model).some(m=>m.name==='R6_Wood_Lighting_BAKED_UNLIT')){woodmap=await ktx.loadAsync(new URL('../textures/R6_wood-albedo.ktx2',import.meta.url).href);woodmap.name='R6_D5_Wood_Albedo';woodmap.colorSpace=THREE.SRGBColorSpace;woodmap.wrapS=woodmap.wrapT=THREE.RepeatWrapping;woodmap.anisotropy=config.anisotropy;if(!woodmap.isCompressedTexture)throw Error('Wood KTX2 without GPU compression')}
  for(const m of mats(model)){if(/^R9_.*Paving_BAKED/.test(m.name)){attachDetail(m)}if(m.name==='R6_Wood_Lighting_BAKED_UNLIT')attachWood(m,woodmap);if(m.name.startsWith('Poster_Original_')||/DS0244989|Ekran|material_10/.test(m.name))m.toneMapped=false;for(const t of [m.map,m.emissiveMap])if(t)t.anisotropy=Math.min(config.anisotropy,renderer.capabilities.getMaxAnisotropy());if(m.name.startsWith('P01_P03_Ground_BAKED'))attachDetail(m);if(['R2_Lawn_BAKED_LIGHTING','R5_Lawn_BAKED_LIGHTING'].includes(m.name))attachGrass(m,grassmap);if(['R2_MUPI_Painted_Dielectric','R6_House_Painted_Dielectric','R6_House_Mirror_Approximate','R6_House_Glass'].includes(m.name)){m.envMap=envTarget.texture;m.envMapIntensity=m.name==='R6_House_Glass'?.2:.7}if(m.name==='R6_House_Glass')m.depthWrite=false;if(['R6_D5_Image2','R6_D5_Image3','R6_D5_I07_Midnight_Hue'].includes(m.name)){m.toneMapped=false;m.polygonOffset=true;m.polygonOffsetFactor=-1;m.polygonOffsetUnits=-1}}
  if(true){
 const hidden=[];model.traverse(o=>{if(o.isMesh&&o.name.includes('R6_House_Mirror')){hidden.push([o,o.visible]);o.visible=false}});
 const target=new THREE.WebGLCubeRenderTarget(128,{type:THREE.HalfFloatType,generateMipmaps:true,minFilter:THREE.LinearMipmapLinearFilter}),probe=new THREE.CubeCamera(.08,100,target);probe.position.set(-44.9,2.65,.27);scene.add(probe);probe.update(renderer,scene);scene.remove(probe);
 const pmrem=new THREE.PMREMGenerator(renderer);houseEnvTarget=pmrem.fromCubemap(target.texture);houseEnvTarget.texture.name='R6_Static_Interior_Probe_128';pmrem.dispose();target.dispose();for(const [o,v] of hidden)o.visible=v;
 for(const m of mats(model))if(['R6_House_Mirror_Approximate','R6_House_Glass','R6_House_Painted_Dielectric'].includes(m.name)){m.envMap=houseEnvTarget.texture;m.envMapIntensity=m.name==='R6_House_Glass'?.25:.8;m.needsUpdate=true}
 }
 if(id.startsWith('pilot')||id.startsWith('r8')||id.startsWith('r9')){const texloader=new THREE.TextureLoader();const [normal,roughness]=await Promise.all(['R8_metal-normal.png','R8_metal-roughness.png'].map(f=>texloader.loadAsync(new URL('../textures/',import.meta.url).href+f)));for(const t of [normal,roughness]){t.colorSpace=THREE.NoColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=2}normal.name='R8_Source_Metal_Normal';roughness.name='R8_Source_Metal_Roughness';r8Aux={normal,roughness};r8Surfaces=installSurfaces(model,scene,renderer,envTarget,r8Aux)}if(id.startsWith('pilot'))await installR10(model,ktx,envTarget,houseEnvTarget,r8Aux,renderer);if(id==='pilot-mixed')installR11(model,envTarget,houseEnvTarget);installR12(model,woodmap);if(mats(model).some(m=>m.userData.r16Asphalt))await installR16(model,renderer,ktx);
return {model,update:time=>r8Surfaces?.update(time),textures:()=>{const set=new Set([micromap,grassmap,woodmap,envTarget?.texture,houseEnvTarget?.texture].filter(Boolean));for(const m of mats(model))for(const t of Object.values(m))if(t?.isTexture)set.add(t);return [...set];}};
}

