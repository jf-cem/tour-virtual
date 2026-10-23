const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
export function sampleDay(value){
 if(!Number.isFinite(value))throw new TypeError('Hora inválida');
 const hour=((value%24)+24)%24,phase=(hour-6)*Math.PI/12,elevation=Math.sin(phase);
 const daylight=smooth(-.12,.42,elevation),sunlight=smooth(0,.25,elevation),night=1-smooth(-.15,.16,elevation);
 return {hour,elevation,daylight,sunlight,night,warmth:smooth(-.2,.1,elevation)*(1-smooth(.05,.65,elevation)),direction:[-Math.cos(phase),elevation,Math.max(0,elevation)*.45]};
}
export function createDayClock(){
 let hour=12,playing=false;
 return {state:()=>({hour,playing,secondsPerDay:120}),setHour:value=>{hour=sampleDay(value).hour;playing=false;},setPlaying:value=>{playing=Boolean(value);},update:(dt,hidden=false)=>{if(playing&&!hidden&&Number.isFinite(dt)&&dt>0)hour=sampleDay(hour+dt*24/120).hour;return sampleDay(hour);}};
}


