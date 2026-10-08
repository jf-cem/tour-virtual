(() => {
  const panel = document.querySelector('.controls');
  const body = document.getElementById('controls-body');
  const toggle = document.getElementById('panel-toggle');
  const compact = document.getElementById('compact-status');
  function setExpanded(expanded) {
    if (!expanded && body.contains(document.activeElement)) toggle.focus();
    body.hidden = !expanded;
    compact.hidden = expanded;
    panel.classList.toggle('minimized', !expanded);
    toggle.setAttribute('aria-expanded', String(expanded));
    toggle.querySelector('[aria-hidden]').textContent = expanded ? '⌄' : '⌃';
    document.getElementById('panel-toggle-label').textContent = expanded ? 'Minimizar' : 'Expandir';
  }
  toggle.addEventListener('click', () => setExpanded(body.hidden));
  const accuracy = document.getElementById('gps-accuracy');
  function updateCompact() {
    const mode=document.getElementById('manual-mode').value;
    compact.textContent = mode==='route'?accuracy.textContent:mode==='keyboard'?'Movimento livre · WASD':'Movimento livre · setas';
    compact.title = document.getElementById('tracking-status').textContent;
  }
  new MutationObserver(updateCompact).observe(accuracy, {childList:true, subtree:true, characterData:true});
  new MutationObserver(updateCompact).observe(document.getElementById('tracking-status'), {childList:true, subtree:true, characterData:true});
  document.addEventListener('navigationmodechange',updateCompact);
  const location=document.getElementById('tracking-options'),locationToggle=document.getElementById('location-toggle');
  function closeLocation(){location.hidden=true;locationToggle.setAttribute('aria-expanded','false');}
  locationToggle.onclick=()=>{location.hidden=!location.hidden;locationToggle.setAttribute('aria-expanded',String(!location.hidden));document.getElementById('help-panel').hidden=true;document.getElementById('help').setAttribute('aria-expanded','false');};
  document.addEventListener('click',e=>{if(!location.contains(e.target)&&!locationToggle.contains(e.target))closeLocation();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!location.hidden){closeLocation();locationToggle.focus();}});
  updateCompact();
})();
