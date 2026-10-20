// Percentages use actual decoded model bytes; preparation has its own honest phase.
export function createModelProgress(expectedBytes,onUpdate=()=>{}){
 let loaded=0,percent=0,phase='download';
 const emit=()=>onUpdate({phase,loaded,total:expectedBytes||null,percent});
 emit();
 return {
  download(event){if(phase!=='download')return;loaded=Math.max(loaded,Number(event.loaded)||0);const total=expectedBytes||Number(event.total)||0;percent=total?Math.max(percent??0,Math.min(99,Math.floor(loaded/total*100))):null;emit()},
  preparing(){phase='preparing';percent=99;emit()},
  ready(){phase='ready';percent=100;emit()}
 };
}
export function progressLabel(state){
 if(state.phase==='ready')return 'Modelo pronto · 100%';
 if(state.phase==='preparing')return 'A preparar materiais e imagens · 99%';
 return state.percent===null?'A carregar o modelo…':`A carregar o modelo · ${state.percent}%`;
}
