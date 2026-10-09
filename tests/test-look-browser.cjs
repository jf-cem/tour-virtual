const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/joaof/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Users/joaof/AppData/Local/ms-playwright/chromium-1223/chrome-win64/chrome.exe',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[];
 page.on('pageerror',e=>{errors.push(e.message);console.error('Browser:',e.message);});page.on('console',m=>{if(m.type()==='error')console.error('Console:',m.text());});page.on('response',r=>{if(r.status()>=400){errors.push(r.status()+' '+r.url());console.error('HTTP:',r.status(),r.url());}});
 await page.addInitScript(()=>{Object.defineProperty(DeviceOrientationEvent,'requestPermission',{configurable:true,value:()=>Promise.resolve('granted')});});
 const url=process.env.TOUR_URL||'http://127.0.0.1:8790/';await page.goto(url);await page.waitForFunction(()=>window.prototypeDebug?.state().ready,null,{timeout:90000});
 assert.equal(await page.locator('#recenter').count(),0);
 const bounds=await page.locator('#motion-toggle').boundingBox();assert(bounds.height>=40);assert(bounds.x>=0&&bounds.x+bounds.width<=390);
 const section=await page.locator('.look-section').boundingBox();assert(section.height<110);
 await page.screenshot({path:'tests/look-panel-mobile.png'});
 await page.click('#motion-toggle');
 await page.evaluate(async()=>{
  const THREE=await import('three');
  const angle=(a,b)=>new THREE.Quaternion(...a).angleTo(new THREE.Quaternion(...b));
  const emit=async(alpha,beta)=>{const event=new Event('deviceorientation');for(const[k,v]of Object.entries({alpha,beta,gamma:0}))Object.defineProperty(event,k,{value:v});dispatchEvent(event);await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));return prototypeDebug.state().quaternion;};
  const first=await emit(0,90);const turned=await emit(20,90);
  const expected=new THREE.Quaternion().setFromEuler(new THREE.Euler(-.06,Math.PI/2+20*Math.PI/180,0,'YXZ'));
  if(angle(turned,expected.toArray())>1e-5)throw Error('Horizontal camera direction reversed');
  let previous=turned;
  for(const beta of [...Array.from({length:19},(_,i)=>90-i*5),...Array.from({length:18},(_,i)=>(i+1)*5)]){const q=await emit(20,beta);if(angle(previous,q)>.12)throw Error('Camera jumped near vertical');previous=q;}
  if(angle(previous,turned)>1e-5)throw Error('Looking down and back changed heading');
  if(angle(first,turned)<.1)throw Error('Sensor did not turn camera');
 });
 await page.click('#motion-toggle');await page.setViewportSize({width:844,height:390});await page.waitForTimeout(200);
 const panel=await page.locator('.controls').boundingBox();assert(panel.y>=0&&panel.y+panel.height<=391);await page.screenshot({path:'tests/look-panel-landscape.png'});
 await page.goto(new URL('ensaio.html',url).href);await page.waitForFunction(()=>window.movementDebug);assert.equal(await page.locator('#recenter').count(),0);assert.deepEqual(errors,[]);
 console.log('PASS real 3D camera: rotation direction, continuous front/down/front, 40 px toggle, compact mobile panel, landscape and standalone page without Recentrar.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
