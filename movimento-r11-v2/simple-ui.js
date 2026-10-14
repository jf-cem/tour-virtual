(()=>{
const el=id=>document.getElementById(id),section=el('spatial-controls');
const originals={};for(const id of ['spatial-mode','spatial-place','spatial-start','spatial-record','spatial-gps-status','spatial-export','spatial-toggle','spatial-status'])originals[id]=el(id);
section.replaceChildren();
section.innerHTML='<div id="simple-setup"><p class="visit-intro">Caminha com o telemóvel na mão para explorar a visita.</p><h2><span class="step-number">1</span> Como queres caminhar?</h2><div id="walk-choices" class="mode-choices"><button type="button" data-walk="slam" aria-pressed="true"><strong>Usar o movimento do telemóvel</strong><span>Funciona no interior e no exterior.</span></button><button type="button" data-walk="slam-gps" aria-pressed="false"><strong>Ajudar com a localização</strong><span>Para comparar ao ar livre.</span></button></div><div id="simple-place"><h2><span class="step-number">2</span> Onde vais caminhar?</h2><div class="mode-choices"><button type="button" data-place="relative" aria-pressed="true"><strong>Quero experimentar aqui</strong><span>Começar onde estou.</span></button><button type="button" data-place="site" aria-pressed="false"><strong>Estou em Benfica</strong><span>Localização ainda em teste.</span></button></div></div><div id="simple-start"><label for="spatial-start">Ponto de partida na visita</label></div><label id="simple-record" class="check">Guardar este teste para enviar depois</label><p class="privacy-note">O registo fica no teu telemóvel. Só é partilhado se o enviares.</p></div><details id="simple-help"><summary>Como começar?</summary><p>Fica parado e aponta o telemóvel para a frente. Ao começar, permite a câmara e o movimento.</p><p>Move suavemente o telemóvel para a frente e para trás. Depois podes caminhar e olhar à volta.</p><p>Mantém esta página aberta. O teste não tem limite de tempo ou distância.</p><p id="gps-help" hidden>Com localização, começa por caminhar em linha reta. O sinal pode não ser suficientemente preciso para ajudar.</p></details><details id="simple-advanced"><summary>Detalhes do teste</summary><p>Estes dados ajudam a perceber o que aconteceu se o movimento parar.</p><div id="simple-diagnostics"></div><div id="simple-legacy"><details><summary>Outros métodos e ferramentas</summary><div id="legacy-content"></div></details></div></details><div id="simple-export"></div>';
el('simple-start').append(originals['spatial-start']);
el('simple-record').prepend(originals['spatial-record']);
el('simple-export').append(originals['spatial-export']);originals['spatial-export'].textContent='Descarregar registo do teste';
el('simple-diagnostics').append(originals['spatial-status'],originals['spatial-gps-status']);
for(const id of ['spatial-mode','spatial-place']){originals[id].hidden=true;section.append(originals[id]);}
const legacy=el('legacy-content');legacy.append(document.querySelector('.phone-controls'),el('manual-controls'));
const modes=el('tracking-options');modes.hidden=false;legacy.append(modes);el('location-toggle').hidden=true;
const nav=document.querySelector('.view-switch');nav.parentNode.insertBefore(nav,document.querySelector('.controls'));legacy.append(nav);
el('walk').textContent='Visita';el('plan').textContent='Mapa';el('reference').textContent='Imagem original';
el('help-panel').innerHTML='<strong>Como explorar</strong><p>Arrasta a vista com o dedo para olhar à volta. Para andar fisicamente, toca em Começar caminhada.</p>';
document.querySelector('header').hidden=true;document.querySelector('.context').hidden=true;
const head=document.querySelector('.progress-head');const title=document.createElement('div');title.className='simple-title';title.innerHTML='<strong>Visita virtual</strong><span id="walk-state">A carregar a visita…</span>';head.prepend(title);
const friendly=document.createElement('p');friendly.id='walk-message';friendly.setAttribute('role','status');friendly.setAttribute('aria-live','polite');
const controls=document.querySelector('.controls');controls.append(friendly,originals['spatial-toggle'],el('simple-export'));
let walking=false;
function render(){
 const button=originals['spatial-toggle'],text=originals['spatial-status'].textContent;walking=button.getAttribute('aria-pressed')==='true';
 let message='Quando estiveres pronto, toca em Começar caminhada.',state='Pronto para começar';
 if(button.disabled){state='A carregar a visita…';message='A preparar o espaço. Aguarda um momento.';}
 else if(walking){state='A preparar a caminhada';message='Permite a câmara e o movimento. Move suavemente o telemóvel para a frente e para trás.';if(/^(SLAM|8th Wall) ·/.test(text)||/^SLAM \+ GPS ·/.test(text)){state='Caminhada em curso';message='Podes caminhar, parar, recuar e olhar à volta.';}}
 else if(/perdido|Salto|interrupção/i.test(text)){state='A caminhada foi interrompida';message='O telefone deixou de acompanhar o movimento. Fica parado e começa novamente.';}
 else if(/recus|permiss|câmara não|Não foi possível|Erro no/.test(text)){state='Não foi possível começar';message='Verifica as permissões da câmara e do movimento e tenta novamente. Os detalhes estão em Detalhes do teste.';}
 else if(/terminado/i.test(text)){state='Caminhada terminada';message='Podes explorar com o dedo ou começar outra caminhada.';}
 else if(/ainda está a carregar/.test(text)){state='A preparar o movimento';message='Aguarda um momento e toca novamente em Começar caminhada.';}
 if(el('walk-state').textContent!==state)el('walk-state').textContent=state;if(friendly.textContent!==message)friendly.textContent=message;
 const label=walking?'Terminar caminhada':'Começar caminhada';if(button.textContent!==label)button.textContent=label;
 el('simple-setup').hidden=walking;el('simple-help').hidden=walking;el('simple-advanced').hidden=walking;
 const combined=originals['spatial-mode'].value==='slam-gps';el('simple-place').hidden=!combined;el('gps-help').hidden=!combined;
 document.querySelectorAll('[data-walk]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.walk===originals['spatial-mode'].value)));
 document.querySelectorAll('[data-place]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.place===originals['spatial-place'].value)));
 el('simple-export').hidden=originals['spatial-export'].disabled;
 el('panel-toggle-label').textContent=el('controls-body').hidden?'Mostrar opções':'Recolher';
}
document.querySelectorAll('[data-walk]').forEach(b=>b.onclick=()=>{if(walking)return;originals['spatial-mode'].value=b.dataset.walk;render();});
document.querySelectorAll('[data-place]').forEach(b=>b.onclick=()=>{if(walking)return;originals['spatial-place'].value=b.dataset.place;render();});
new MutationObserver(()=>{for(const o of originals['spatial-start'].options)o.textContent='Ponto '+Number(o.value.replace('P',''));}).observe(originals['spatial-start'],{childList:true});
const observer=new MutationObserver(render);
observer.observe(originals['spatial-toggle'],{attributes:true,attributeFilter:['disabled','aria-pressed'],childList:true,subtree:true,characterData:true});
observer.observe(originals['spatial-status'],{childList:true,subtree:true,characterData:true});
observer.observe(originals['spatial-export'],{attributes:true,attributeFilter:['disabled']});
observer.observe(el('controls-body'),{attributes:true,attributeFilter:['hidden']});
document.addEventListener('navigationmodechange',render);render();
})();
