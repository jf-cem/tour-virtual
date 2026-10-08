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
    compact.textContent = accuracy.textContent;
    compact.title = document.getElementById('tracking-status').textContent;
  }
  new MutationObserver(updateCompact).observe(accuracy, {childList:true, subtree:true, characterData:true});
  new MutationObserver(updateCompact).observe(document.getElementById('tracking-status'), {childList:true, subtree:true, characterData:true});
  updateCompact();
})();
