// Advisory camera-image diagnostics, not a measure of tracking confidence or lux.
export function imageQuality({pixels,rows,cols,rowBytes}){
 if(!pixels||!Number.isInteger(rows)||!Number.isInteger(cols)||rows<2||cols<2||rowBytes<cols||pixels.length<(rows-1)*rowBytes+cols)return null;
 let sum=0,squares=0,bright=0,dark=0,edges=0,edgeCount=0;const count=rows*cols;
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
  const i=y*rowBytes+x,v=pixels[i];sum+=v;squares+=v*v;bright+=v>=240;dark+=v<=15;
  if(x){edges+=Math.abs(v-pixels[i-1]);edgeCount++;}if(y){edges+=Math.abs(v-pixels[i-rowBytes]);edgeCount++;}
 }
 const mean=sum/count,contrast=Math.sqrt(Math.max(0,squares/count-mean*mean)),detail=edges/edgeCount;
 const code=bright/count>.3&&mean>180?'bright':dark/count>.6&&mean<50?'dark':contrast<14&&detail<4?'low-detail':'ok';
 return {mean,contrast,detail,brightFraction:bright/count,darkFraction:dark/count,code};
}
export function createCameraGuide(){
 const panel=document.createElement('aside');panel.id='camera-guide';panel.hidden=true;
 panel.innerHTML='<strong>Câmara</strong><div id="camera-preview"></div><p id="camera-hint" role="status" aria-live="polite">Chão com detalhes.</p>';
 const notice=document.createElement('p');notice.id='recalibration-notice';notice.hidden=true;notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');
 document.body.append(panel,notice);let phase='idle',canvas=null,lastMeasure=-Infinity,pending=null,streak=0,code='waiting',noticeTimer=null;
 const hint=panel.querySelector('#camera-hint'),preview=panel.querySelector('#camera-preview');
 const messages={waiting:'Chão com detalhes.',ok:'Chão com detalhes.',bright:'Muito claro. Procura sombra.',dark:'Muito escuro. Procura luz.', 'low-detail':'Poucos detalhes. Procura textura.'};
 function render(){const acquiring=['calibrating','recalibrating','recovering'].includes(phase);const warning=!['ok','waiting'].includes(code);panel.hidden=!canvas||(!acquiring&&!(phase==='walking'&&warning));panel.classList.toggle('hint-only',!acquiring);panel.dataset.quality=code;hint.textContent=messages[code];}
 return {
  attach(c){canvas=c;c.setAttribute('role','img');c.setAttribute('aria-label','Imagem em direto da câmara');preview.replaceChildren(c);lastMeasure=-Infinity;pending=null;streak=0;code='waiting';render();},
  state(p){const previous=phase;phase=p;clearTimeout(noticeTimer);noticeTimer=null;
   if(['recalibrating','recovering'].includes(p)){notice.innerHTML='<strong>Recalibra no local</strong><span>Fica no mesmo sítio e move suavemente o telemóvel. Aguarda antes de continuar a andar.</span>';notice.hidden=false;}
   else if(p==='walking'&&['recalibrating','recovering'].includes(previous)){notice.innerHTML='<strong>Podes continuar a andar</strong>';notice.hidden=false;noticeTimer=setTimeout(()=>{notice.hidden=true;},2500);}
   else notice.hidden=true;render();},
  clear(){clearTimeout(noticeTimer);noticeTimer=null;notice.hidden=true;canvas=null;preview.replaceChildren();panel.hidden=true;},
  measure(data,t){if(t-lastMeasure<500)return null;const quality=imageQuality(data);if(!quality)return null;lastMeasure=t;if(pending===quality.code)streak++;else{pending=quality.code;streak=1;}if(streak>=2)code=pending;render();return {...quality,shownCode:code};},
  previewVisible:()=>!panel.hidden&&!panel.classList.contains('hint-only')
 };
}
