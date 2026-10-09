const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/joaof/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Users/joaof/AppData/Local/ms-playwright/chromium-1223/chrome-win64/chrome.exe',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{Object.defineProperty(DeviceOrientationEvent,'requestPermission',{value:()=>Promise.resolve('granted'),configurable:true});});
  await page.goto(process.env.TOUR_URL||'http://127.0.0.1:8790/');
  await page.waitForFunction(()=>window.prototypeDebug?.state().ready,null,{timeout:90000});
  // Test physical yaw at several handset inclinations: same horizontal turn,
  // unchanged elevation and no roll, including the north wrap at 360 degrees.
  const result=await page.evaluate(async()=>{
   const THREE=await import('three'),{createFixedLook}=await import('./phone-look.js?v=1.4.3');
   const out=[];
   for(const beta of [30,60,90,120])for(const gamma of [-25,0,25]){
    const look=createFixedLook(),view=new THREE.Quaternion();
    look.sample({alpha:350,beta,gamma},0,view);
    const q=look.sample({alpha:20,beta,gamma},0,view),e=new THREE.Euler().setFromQuaternion(q,'YXZ');out.push([e.x,e.y,e.z]);
   }
   for(const screenAngle of [90,-90,180]){
    const look=createFixedLook(),view=new THREE.Quaternion();look.sample({alpha:350,beta:60,gamma:20},screenAngle,view);
    const e=new THREE.Euler().setFromQuaternion(look.sample({alpha:20,beta:60,gamma:20},screenAngle,view),'YXZ');out.push([e.x,e.y,e.z]);
   }
   const look=createFixedLook(),view=new THREE.Quaternion();look.sample({alpha:0,beta:70,gamma:0},0,view);
   const turned=look.sample({alpha:30,beta:70,gamma:0},0,view);look.reanchor();
   const rotated=look.sample({alpha:30,beta:70,gamma:0},90,turned);
   if(rotated.angleTo(turned)>1e-6)throw Error('Screen rotation must preserve current view');
   return out;
  });
  for(const [pitch,yaw,roll]of result){assert(Math.abs(pitch)<1e-6);assert(Math.abs(yaw-Math.PI/6)<1e-6);assert(Math.abs(roll)<1e-6);}
  const emit=(alpha,beta=45,gamma=20)=>page.evaluate(v=>{const e=new Event('deviceorientation');for(const[k,x]of Object.entries(v))Object.defineProperty(e,k,{value:x});window.dispatchEvent(e);},{alpha,beta,gamma});
  const initial=await page.evaluate(()=>prototypeDebug.state().quaternion);
  await page.click('#motion-toggle');await emit(350);await emit(20);
  await page.waitForFunction(q=>prototypeDebug.state().quaternion.some((v,i)=>Math.abs(v-q[i])>.05),initial);
  await page.click('#recenter');
  await page.waitForFunction(q=>prototypeDebug.state().quaternion.every((v,i)=>Math.abs(v-q[i])<1e-5),initial);
  // Recentring takes effect without a sensor event and remains after the next.
  await emit(20);await page.waitForTimeout(150);
  assert(await page.evaluate(q=>prototypeDebug.state().quaternion.every((v,i)=>Math.abs(v-q[i])<1e-5),initial));
  await emit(50);await page.waitForFunction(q=>prototypeDebug.state().quaternion.some((v,i)=>Math.abs(v-q[i])>.05),initial);
  await page.click('#motion-toggle');
  await page.evaluate(()=>prototypeDebug.setLook(.5,.3));
  await page.waitForFunction(q=>prototypeDebug.state().quaternion.some((v,i)=>Math.abs(v-q[i])>.05),initial);
  await page.click('#recenter');await page.waitForFunction(q=>prototypeDebug.state().quaternion.every((v,i)=>Math.abs(v-q[i])<1e-5),initial);
  assert.deepEqual(errors,[]);console.log('PASS v1.4.3: fixed axes at 12 inclinations, heading wrap, immediate recenter, next reading anchored, subsequent rotation, manual recenter.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
