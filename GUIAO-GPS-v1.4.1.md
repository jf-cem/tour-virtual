> **v1.4.2:** preparação automática parado, sem marcar segundo ponto. Ver [guião atual](GUIAO-GPS-v1.4.2.md). O texto abaixo descreve a versão anterior.

# Teste dos dois modos GPS — v1.4.1

Abrir https://jf-cem.github.io/tour-virtual/?v=1.4.1 no Safari, ao ar livre.

1. Em Local do teste, escolher Teste onde estou e GPS + atividade ou GPS + passos. Deixar 0,65 e os ajustes avançados como estão.
2. Fechar Local do teste. Iniciar caminhada e permitir localização/movimento.
3. Os botões aparecem junto ao estado da caminhada: guardar início parado, caminhar em linha reta até ao segundo ponto e marcá-lo, regressar ao início e confirmar o regresso. A distância necessária depende do GPS e aparece no estado; com ±6 m nos dois pontos são aproximadamente 24 m. Esta preparação define a linha física, não melhora a precisão GPS. Se não se conseguir definir a linha com confiança, o teste remoto fundido não está pronto; usar manual ou aguardar melhores condições.
4. GPS + atividade acompanha leituras GPS e tenta reduzir deriva quando parado. GPS + passos pede Avançar/Recuar para confirmar marcha e estima deslocamento entre fixes. Confirmação humana não prova direção automaticamente: indicar Recuar antes de regressar, e Avançar antes de voltar a avançar.
5. Fazer ida, parar e regressar pelo mesmo caminho. Ver o contador de passos e distância junto ao estado. Com GPS recente, a confirmação manual não expira a cada 5 segundos. Se perder GPS, continuam os limites de previsão de 12 s/6 m e de incerteza. A previsão suspende ao exceder os limites; uma leitura útil pode recuperar o estado, mas discrepância grande exige novo início.
6. Repetir com o outro método, em condições semelhantes. Avaliar atraso ao começar/parar/regressar, avanço parado e diferença entre distância física e virtual. Métodos ainda experimentais; os testes automáticos não provam precisão no iPhone.

Opcional: antes de iniciar, abrir Registos e ajustes do teste e ativar Recolher sessão local. Marcar acontecimentos/exportar JSON após o ensaio; o registo inclui localização, sem envio automático.

O modo sem GPS foi retirado do seletor. A v1.4 contava o limite de 12 s desde início/âncora mesmo sem passos, incluindo permissões e operação do menu; a nova preparação remota só alimenta ticks do estimador na fase de caminhada. A causa concreta de ausência de passos no aparelho requer registo real, não pode ser inferida só da mensagem de limite.
