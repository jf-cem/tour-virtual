(function(root){
  'use strict';
  const geo=typeof module==='object'&&module.exports?require('./geo.js'):root.TourGeo;
  // Stability is not a new GPS accuracy estimate: keep the device's uncertainty.
  function createPreparation(start=Date.now()) {
    let samples=[], lastStamp=-Infinity;
    function snapshot(now) {
      samples=samples.filter(s=>now-s.timestamp<=15000);
      const fresh=samples.filter(s=>now-s.timestamp<=10000);
      // Spread the selected readings in time, even if the device updates rapidly.
      const recent=[];
      for(let i=samples.length-1;i>=0&&recent.length<5;i--){if(!recent.length||recent.at(-1).timestamp-samples[i].timestamp>=2000)recent.push(samples[i]);}
      recent.reverse();
      const median=values=>values.sort((a,b)=>a-b)[Math.floor(values.length/2)];
      const center=recent.length?{lat:median(recent.map(s=>s.lat)),lng:median(recent.map(s=>s.lng))}:null;
      const spread=center?Math.max(...recent.map(s=>geo.distance(s,center))):Infinity;
      const stable=recent.length===5 && recent.at(-1).timestamp-recent[0].timestamp>=8000 && spread<=6 && now-recent.at(-1).timestamp<=3000;
      const best=fresh.reduce((a,b)=>!a||b.accuracy<a.accuracy?b:a,null);
      return {elapsed:Math.max(0,now-start),count:recent.length,spread,
        ready:now-start>=10000&&stable,
        position:center,accuracy:recent.length?Math.max(...recent.map(s=>s.accuracy)):null,
        fallback:now-start>=30000?best:null};
    }
    return {
      add(position,now=Date.now()) {
        const c=position.coords,t=position.timestamp;
        if(!Number.isFinite(t)||now-t>10000||t>now+1000||t<=lastStamp)return snapshot(now);
        lastStamp=t;
        if(!Number.isFinite(c.latitude)||!Number.isFinite(c.longitude)||Math.abs(c.latitude)>90||Math.abs(c.longitude)>180||!Number.isFinite(c.accuracy)||c.accuracy<0||c.accuracy>20){samples=[];return snapshot(now);}
        if(samples.length&&t-samples.at(-1).timestamp<500)return snapshot(now);
        samples.push({lat:c.latitude,lng:c.longitude,accuracy:c.accuracy,timestamp:t});
        return snapshot(now);
      },snapshot
    };
  }
  const api={createPreparation};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.TourGpsStart=api;
})(typeof window==='undefined'?globalThis:window);
