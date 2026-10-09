const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/joaof/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Users/joaof/AppData/Local/ms-playwright/chromium-1223/chrome-win64/chrome.exe',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.mock={t:1000,gps:null};Object.defineProperty(performance,'now',{value:()=>mock.t});Date.now=()=>1800000000000+mock.t;Object.defineProperty(navigator,'geolocation',{value:{watchPosition(cb){mock.gps=cb;return 0},clearWatch(){mock.gps=null}}});for(const api of [DeviceMotionEvent,DeviceOrientationEvent])Object.defineProperty(api,'requestPermission',{configurable:true,value:()=>Promise.resolve('granted')});});
 await page.goto(process.env.TOUR_URL||'http://127.0.0.1:8790/');await page.waitForFunction(()=>window.prototypeDebug?.state().ready,null,{timeout:90000});
 await page.click('#location-toggle');await page.selectOption('#fusion-mode','steps');await page.evaluate(()=>document.querySelector('#record-session').checked=true);await page.click('#location-toggle');await page.click('#gps-toggle');
 await page.evaluate(()=>{for(let i=0;i<=5;i++){mock.t=1000+i*2000;mock.gps({coords:{latitude:41,longitude:-8,accuracy:3,speed:null,heading:null},timestamp:Date.now()});}});
 assert.equal((await page.evaluate(()=>movementDebug.diagnostics())).phase,'walking');
 await page.evaluate(async()=>{const start=mock.t;for(let i=0;i<160;i++){
  mock.t+=33;
  // Allow the real 50 ms estimator timer to run before delivering an event
  // whose acquisition timestamp is slightly older than that timer.
  await new Promise(resolve=>setTimeout(resolve,60));
  const event=new Event('devicemotion');for(const[k,v]of Object.entries({timeStamp:mock.t-20,accelerationIncludingGravity:{x:0,y:0,z:9.81+.35*Math.sin(2*Math.PI*(mock.t-start)/600)},rotationRate:{alpha:40,beta:0,gamma:0},interval:33}))Object.defineProperty(event,k,{value:v});dispatchEvent(event);
  if(i%30===0)mock.gps({coords:{latitude:41,longitude:-8,accuracy:3,speed:null,heading:null},timestamp:Date.now()});
 }});
 const d=await page.evaluate(()=>movementDebug.diagnostics());assert.ok(d.detector.steps>=5,'Gentle steps detected despite delivery lag');assert.equal(d.estimate.steps,d.detector.steps,'Detector events must all reach estimator');assert.ok(d.estimate.alongMeters>2,'Step prediction advances');assert.ok(d.detector.eventLagMs>=20);
 const session=await page.evaluate(()=>movementDebug.recording()),comparison=require('../movement-replay.js').compare(session);
 assert.equal(comparison.results.steps.final.steps,d.estimate.steps,'Replay reproduces accepted delayed steps');
 assert.ok(Math.abs(comparison.results.steps.final.alongMeters-d.estimate.alongMeters)<.01,'Replay reproduces predicted distance');
 await page.waitForFunction(()=>prototypeDebug.state().travel>1.5);assert.deepEqual(errors,[]);
 console.log('PASS delayed 33 ms sensor samples after 50 ms timer: gentle steps reach estimator and move actual 3D camera; fresh GPS does not undo steps.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
