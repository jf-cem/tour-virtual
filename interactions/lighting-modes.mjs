// Visual effect periods in seconds for the browser prototype, independent of hardware.
export const LIGHTING_MODES=['solid','flash','strobe','fade','rainbow'];
export function sampleLightingMode(mode,seconds){
 const t=Math.max(0,Number(seconds)||0);
 if(mode==='flash')return {level:t%1<.5?1:0,hue:null};
 if(mode==='strobe')return {level:t%.2<.05?1:0,hue:null};
 if(mode==='fade')return {level:.5-.5*Math.cos(2*Math.PI*t/3),hue:null};
 if(mode==='rainbow')return {level:1,hue:(t%8)/8};
 return {level:1,hue:null};
}
