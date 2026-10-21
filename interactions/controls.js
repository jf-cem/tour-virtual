import {installPhonePanel} from './phone-panel.js';
export function installHouseControls(house){
 const section=document.createElement('details');section.id='house-controls';section.className='glass';
 section.innerHTML=`<summary>Controlar a casa</summary><div class="house-content">
 <section class="house-section" data-phone-pane="casa"><h2>Orientação da casa <output id="house-angle">0°</output></h2>
 <div class="phone-orientation" aria-hidden="true">
        <div id="house-mini" class="radar-dial" role="img" aria-label="Corpo da maquete e eixo de rotação">
          <span class="cardinal north">0°</span>
          <span class="cardinal west">−90°</span>
          <span class="cardinal east">+90°</span>
          <div class="orbit orbit-a"></div>
          <div class="orbit orbit-b"></div>
          <div class="house-shadow" aria-hidden="true"></div>
          <div  class="radar-body" aria-hidden="true">
            <div class="house-3d">
              <div class="house-volume">
                <div class="house-face house-front"><span class="house-door"></span><span class="house-window"></span></div>
                <div class="house-face house-back"></div>
                <div class="house-face house-left"></div>
                <div class="house-face house-right"><span class="side-window"></span></div>
              </div>
              <div class="house-roof">
                <div class="roof-plane roof-left"></div>
                <div class="roof-plane roof-right"></div>
                <div class="roof-gable roof-front"></div>
                <div class="roof-gable roof-back"></div>
              </div>
            </div>
          </div>
        </div>
      </div><button id="house-door">Abrir porta</button><label for="house-speed">Rodar a casa <output id="house-speed-value">0°/s</output></label><input id="house-speed" type="range" min="-12" max="12" value="0" step="1"><div class="house-actions"><button id="house-stop">Parar</button><button id="house-reverse">Inverter</button></div></section>
 <section class="house-section" data-phone-pane="luzes"><h2>Luzes interiores</h2><label class="house-check"><input id="house-lights" type="checkbox"> Ligar luz RGB</label><label for="house-mode">Modo</label><select id="house-mode"><option value="solid">Fixa</option><option value="flash">Flash</option><option value="strobe">Strobe</option><option value="fade">Fade</option><option value="rainbow">Arco-íris</option></select><div class="house-color-row"><label for="house-color">Cor da luz</label><input id="house-color" type="color" value="#456aff"></div><label for="house-intensity">Intensidade <output id="house-intensity-value">100%</output></label><input id="house-intensity" type="range" min="0" max="2" value="1" step=".05"><button id="house-color-reset">Repor iluminação original</button></section>
 <section class="house-section" data-phone-pane="cartazes"><h2>Cartazes</h2><label class="house-check"><input id="house-posters" type="checkbox"> Trocar automaticamente</label><label for="house-interval">Intervalo em segundos</label><input id="house-interval" type="number" min="2" max="300" value="8"><details class="house-order-options"><summary>Escolher a ordem</summary><label for="house-order">Ordem dos cartazes</label><input id="house-order" type="text" value="${house.state().order.map(i=>i+1).join(',')}" aria-describedby="house-images"><small id="house-images">Cartazes de 1 a 7, separados por vírgulas.</small></details></section>
 <p id="house-status" role="status">Controlos disponíveis durante a caminhada.</p></div>`;
 section.querySelector('#house-door').disabled=!house.door.state().implemented;document.body.append(section);
 const $=id=>document.getElementById(id);let lastSpeed=6;
 function speed(v){$('house-speed').value=v;$('house-speed-value').value=v+'°/s';house.setSpeed(v);if(Number(v))lastSpeed=Number(v);}
 $('house-speed').oninput=e=>speed(e.target.value);$('house-stop').onclick=()=>speed(0);$('house-reverse').onclick=()=>speed(-(Number($('house-speed').value)||lastSpeed));
 $('house-mode').onchange=e=>{house.setRgbMode(e.target.value);$('house-color').disabled=e.target.value==='rainbow';};
 $('house-lights').onchange=e=>house.setRgbEnabled(e.target.checked);
 $('house-color').oninput=e=>{house.setColor(e.target.value);$('house-lights').checked=true;};
 $('house-intensity').oninput=e=>{house.setRgbIntensity(Number(e.target.value));$('house-intensity-value').value=Math.round(Number(e.target.value)*100)+'%';};
 $('house-color-reset').onclick=()=>{house.restoreColor();$('house-lights').checked=false;$('house-mode').value='solid';$('house-color').disabled=false;};
 $('house-door').onclick=()=>{house.door.toggle();$('house-door').textContent=house.door.state().target?'Fechar porta':'Abrir porta';};
 function posters(){try{house.setPosters($('house-posters').checked,Number($('house-interval').value),$('house-order').value.split(',').map(s=>Number(s.trim())-1));$('house-status').textContent='Configuração dos cartazes aplicada.';}catch(e){$('house-status').textContent=e.message;}}
 for(const id of ['house-posters','house-interval','house-order'])$(id).onchange=posters;
 const presentation=installPhonePanel(section);let previous='';return {presentation,update(){const angle=house.group.rotation.y*180/Math.PI;const degrees=((angle+180)%360+360)%360-180;$('house-angle').value=Math.round(degrees)+'°';$('house-mini').style.setProperty('--angle',(-degrees)+'deg');const current=house.platform.state().onboard?'Na plataforma · acompanhas a rotação.':'Fora da plataforma · posição independente.';if(current!==previous){$('house-status').textContent=current;previous=current;}}};
}
