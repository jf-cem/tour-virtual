# GPS + passos — v1.4.4

Corrigidos três problemas reproduzidos: limiar demasiado alto para passos suaves; descarte de eventos entregues após o temporizador; proteção contra ruído GPS mesmo sem passos recentes.

O modo passos usa agora limiar adaptativo e aplica os eventos por ordem de chegada, preservando o tempo de aquisição para calcular cadência. O GPS pode atualizar a posição quando faltam passos. GPS + atividade conserva os seus parâmetros e continua a ser a base preferida pelo utilizador. O olhar aguarda a correção do outro agente.

Validação: testes sintéticos de marcha suave, ruído e gestos; testes do estimador e preparação; navegador com eventos atrasados e movimento real da câmara 3D. Não substitui um teste físico no iPhone.

Para repetir: selecionar GPS + passos, iniciar, permitir movimento, esperar parado até «Pronto» e caminhar em frente. Manter 0,65 m por passo no primeiro teste. Os primeiros ciclos confirmam a cadência. Se falhar, recolher uma sessão local para diagnóstico.
