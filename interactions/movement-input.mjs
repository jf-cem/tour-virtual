const codes={KeyW:'w',KeyA:'a',KeyS:'s',KeyD:'d',ArrowUp:'ArrowUp',ArrowDown:'ArrowDown',ArrowLeft:'ArrowLeft',ArrowRight:'ArrowRight'};
const names=new Set(Object.values(codes));
function keyOf(e){const key=e.key?.length===1?e.key.toLowerCase():e.key;return codes[e.code]||(names.has(key)?key:null);}
const editable=e=>Boolean(e.target?.matches?.('input,textarea,select,[contenteditable]'));
export function installMovementInput({target=window,documentTarget=document,canvas,canMove,onMoveKey=()=>{},onCancel=()=>{}}){
 const keys=new Set(),pointers=new Set();
 function cancel(){keys.clear();pointers.clear();onCancel();}
 target.addEventListener('keydown',e=>{const key=keyOf(e);if(!key||!canMove()||editable(e)||e.ctrlKey||e.metaKey||e.altKey)return;
  // A repeat cannot re-arm movement after a cancelled gesture or lost focus.
  if(e.repeat&&!keys.has(key))return;onMoveKey(key);keys.add(key);e.preventDefault();
 },true);
 // Capture releases even when a control consumes the event; code is stable if key changes.
 target.addEventListener('keyup',e=>{const key=keyOf(e);if(key)keys.delete(key);},true);
 for(const type of ['blur','pagehide'])target.addEventListener(type,cancel,true);
 documentTarget.addEventListener('visibilitychange',()=>{if(documentTarget.hidden)cancel();});
 documentTarget.addEventListener('focusin',e=>{if(editable(e))cancel();},true);
 documentTarget.addEventListener('dragstart',cancel,true);
 canvas.addEventListener('pointerdown',e=>{if(e.button!==0||!canMove())return;if(editable({target:documentTarget.activeElement}))documentTarget.activeElement.blur();pointers.add(e.pointerId);e.preventDefault();},true);
 // A normal release ends looking, while a held movement key remains held.
 target.addEventListener('pointerup',e=>pointers.delete(e.pointerId),true);
 canvas.addEventListener('pointercancel',cancel,true);
 canvas.addEventListener('lostpointercapture',e=>{if(pointers.has(e.pointerId))cancel();},true);
 return keys;
}
