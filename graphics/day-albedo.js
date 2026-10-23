import * as THREE from 'three';
import {KTX2Loader} from './vendor/loaders/KTX2Loader.js';
export async function loadDayAlbedos(renderer){
 const rows=await fetch(new URL('../textures/day-albedo/manifest.json',import.meta.url)).then(r=>{if(!r.ok)throw Error('Manifesto de albedo em falta');return r.json();});
 const loader=new KTX2Loader().setTranscoderPath(new URL('./vendor/libs/basis/',import.meta.url).href).setWorkerLimit(2).detectSupport(renderer),maps=new Map();
 try{await Promise.all(rows.map(async row=>{const t=await loader.loadAsync(new URL('../textures/day-albedo/'+row.file,import.meta.url).href);if(!t.isCompressedTexture)throw Error('Albedo sem compressão GPU');t.name='DAY_Albedo_'+row.object;t.colorSpace=THREE.SRGBColorSpace;t.channel=1;t.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());for(const target of row.targets)maps.set(target,t);}));}finally{loader.dispose();}
 return maps;
}
