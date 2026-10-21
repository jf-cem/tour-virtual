// Pure decision logic shared by the evaluator and its verification script.
export function decideTest(result){
 const failures=[];
 if(result.interrupted)failures.push('Sessão interrompida/recarregada');
 if(result.openings.length!==5||result.openings.some(r=>!r.ready||!Number.isFinite(r.loadMs)||r.loadMs>5000))failures.push('Cinco aberturas completas em até 5 s não confirmadas');
 if(result.profile&&result.openings.some(r=>r.pixelRatio!==result.profile.dpr||JSON.stringify(r.viewport)!==JSON.stringify(result.profile.viewport)||JSON.stringify(r.effectiveResolution)!==JSON.stringify(result.profile.resolution)))failures.push('Perfil/resolução diferentes entre aberturas');
 if(!result.endurance||!Number.isFinite(result.endurance.measurementSeconds)||result.endurance.measurementSeconds<605||result.endurance.contextLosses)failures.push('Dez minutos contínuos sem perda de contexto não confirmados');
 if(result.events.length)failures.push('Mudança de resolução, saída da página ou erro durante o ensaio');
 if(result.windows.length<59||result.windows.some(w=>!Number.isFinite(w.fps)||w.fps<30)||!Number.isFinite(result.endurance?.frameTimes.meanMs)||result.endurance?.frameTimes.meanMs>1000/30)failures.push('30 FPS sustentados nas janelas de 10 s não atingidos');
 const mobile=/iPhone|Android|iPad/.test(result.userAgent)||(/Macintosh/.test(result.userAgent)&&result.touchPoints>1);
 if(!mobile||!result.device.trim())return {status:'INCONCLUSIVO',failures:['Usar aparelho físico identificado com browser móvel',...failures]};
 if(failures.length)return {status:'REPROVADO',failures};
 if(!result.visual||!Object.values(result.visual).every(Boolean)||Object.keys(result.visual).length!==4)return {status:'PENDENTE DE AVALIAÇÃO VISUAL',failures:[]};
 return {status:'APROVADO NESTE APARELHO E PERFIL',failures:[]};
}
