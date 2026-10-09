const assert=require('node:assert/strict'),C=require('../movement-core.js');
function count({amplitude=.35,period=600,rotation=40,axis='z',dt=20,linear=false}={}){
 const detector=C.createDetector({adaptiveSteps:true});let steps=0;
 for(let t=0;t<10000;t+=dt){const wave=amplitude*Math.sin(2*Math.PI*t/period),v={x:0,y:0,z:0};v[axis]=linear?wave:9.81+wave;
  if(detector.add({t,[linear?'acceleration':'gravity']:v,rotation:{alpha:rotation,beta:0,gamma:0}}).step)steps++;
 }
 return steps;
}
for(const amplitude of [.35,.6,2])for(const axis of ['x','y','z'])for(const dt of [16,33,100])assert.ok(count({amplitude,axis,dt})>=10,'Gentle walking across sensor rates and device axes');
assert.ok(count({amplitude:.6,period:1100})>=5,'Slow cadence');
assert.ok(count({amplitude:.6,linear:true})>=10,'Linear acceleration fallback');
assert.equal(count({amplitude:.08}),0,'Small stationary noise');
assert.equal(count({amplitude:2,rotation:350}),0,'Rapid phone gestures');
assert.equal(count({amplitude:2,period:100}),0,'Non-walking rapid oscillation');
const detector=C.createDetector({adaptiveSteps:true});
for(let t=0;t<=2000;t+=20)assert.equal(detector.add({t,gravity:{x:0,y:0,z:t===500?12:9.81}}).step,false,'Single isolated gesture');
const e=C.createEstimator({mode:'steps'});e.input({type:'anchor',t:0});e.input({type:'direction',t:0,direction:1,source:'start-forward'});
e.input({type:'gps',t:100,stamp:100,age:0,along:0,accuracy:6,cross:0});
e.input({type:'gps',t:1000,stamp:1000,age:0,along:2,accuracy:6,cross:0});
for(let t=1100;t<=2500;t+=100)e.input({type:'tick',t});
assert.ok(e.snapshot(2500).alongMeters>.5,'Valid GPS advances when no steps can be predicted, even inside GPS noise band');
e.input({type:'activity',t:2600,activity:'stationary'});
assert.ok(e.input({type:'step',t:2600}).alongMeters>.65,'Accepted step activates walking instead of remaining blocked as stationary');
console.log('PASS adaptive gentle steps, axes and sample rates, idle noise, gesture rejection, linear fallback, GPS fallback and accepted step activity. Synthetic signals; physical validation pending.');
