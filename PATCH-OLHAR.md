# Patch de olhar com o telemóvel · v1.4.4

## Revisão e integração pelo agente principal

O patch inicial precisou de três correções antes da integração: sinal do azimute que invertia a rotação horizontal; handler inválido `#motion-toggle.onclick`; referências antigas à v1.4.3. Corrigidos estes pontos na cópia de publicação. A versão visível mantém-se v1.4.4, com revisão de cache `1.4.4-look2`.

Passaram os testes de continuidade acrescidos de uma verificação do sentido horizontal. Passou também o teste Playwright na câmara 3D real: frente/baixo/frente, direção horizontal, botão de 40 px, painel compacto em retrato/paisagem e página de ensaio sem Recentrar. A captura real `tests/look-panel-mobile.png` foi inspecionada. Passou a regressão de preparação, GPS + atividade e GPS + passos. Os ficheiros do motor de movimento, GPS, percurso e modelo não foram alterados nesta integração.

Continua necessária a confirmação física no iPhone. As secções seguintes preservam o relatório inicial do agente.

## Diagnóstico e solução

A implementação v1.4.3 convertia cada leitura do sensor em ângulos Euler `YXZ` e subtraía heading e inclinação desses ângulos. Perto da vertical, o heading deixa de ter uma solução única; a decomposição Euler troca de ramo e a câmara pode rodar mesmo que o telefone esteja a regressar pelo mesmo movimento. O limite de inclinação existente também impedia olhar totalmente para baixo.

O patch calcula a direção de visão diretamente do quaternion de orientação do dispositivo. A elevação vem do vetor de visão sem limite artificial. A azimute mantém o último valor válido dentro de 5° do eixo vertical, onde a direção horizontal fica matematicamente indefinida. O heading acumula diferenças curtas para atravessar 360° sem inversão. A câmara é reconstruída com roll zero, preservando eixos nivelados. Ao mudar a orientação do ecrã, a referência é renovada sobre a vista atual para evitar saltos.

Esta solução reproduz o movimento pan/tilt observado na tour confirmada sem copiar o player Pano2VR.

## Ficheiros alterados

- `phone-look.js`: novo cálculo por vetor, heading estável junto à vertical e heading acumulado.
- `phone.js`: mantém as permissões de orientação do iPhone e remove o handler de recentragem.
- `app.js`, `index.html`: remove o callback e o botão «Recentrar»; atualiza a versão dos módulos.
- `ensaio.js`, `ensaio.html`: remove o callback e o botão do ensaio.
- `style.css`: remove regras do botão removido; reduz 14 px aproximados de espaçamento vertical na secção e preserva o alvo tátil de 40 px.
- `tests/test-look-v143.cjs`: removido, pois validava a recentragem e aceitava as leituras Euler anteriores.
- `tests/test-look-continuity.cjs`: cobre os movimentos pedidos e verificações estruturais do painel a 390 px.
- `tests/run-browser.cjs`, `README.md`: atualizam o nome do teste e o comportamento descrito.

Não foram editados GPS + atividade, GPS + passos, preparação da caminhada, percurso, modelos 3D ou materiais. A tour de referência não foi alterada.

## Validação inicial do agente

Executado `node tests/test-look-continuity.cjs` na cópia de trabalho: passou frente → baixo → frente, cinco inclinações para rotação horizontal, passagem de 360°, volta completa de 360°, retrato/paisagem, roll zero, ausência do botão/handler e alvo tátil mínimo de 40 px.

O teste Playwright de browser não foi concluído neste ambiente: o Chromium fecha durante o arranque e o runner não alcançou o servidor local de teste. A verificação do painel a 390 × 844 px foi feita pelas regras responsivas/markup; não houve medição de layout por browser. Por isso, o esquema abaixo mostra a mudança de controlos e uma estimativa de altura calculada a partir do CSS, não uma captura real.

![Comparação esquemática do painel antes e depois](tests/panel-before-after.svg)

## Falta validar num iPhone real

- Permissão e leitura `deviceorientation` no Safari/iOS.
- Descida até à vertical e regresso lento/rápido, observando continuidade e estabilidade do heading.
- Rotação física contínua do telefone, incluindo mais de uma volta, em retrato e paisagem.
- Gesto de toque no panorama e altura/área tátil do painel em ecrãs reais com safe area.
