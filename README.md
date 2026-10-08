# CEM Benfica — Tour Virtual v1.3.2

Protótipo P01–P03 para telemóvel, com navegação 3D contínua, orientação do iPhone e deslocação experimental por GPS.

v1.3.2 reúne progresso, Reiniciar e Minimizar na mesma linha; move **Local do teste** para o cabeçalho e remove a etiqueta dos materiais. Conserva Liquid Glass e o comportamento de tracking da v1.3.

Em **Exploração manual**, existem três modos: **Teclado WASD** (W/S em frente/atrás, A/D de lado), **Setas no ecrã** (manter premidas, com diagonais por dois dedos) e **Percurso guiado** (Avançar/Percorrer/Recuar e seleção P01–P03). Nos modos livres, arrastar orienta o olhar; a orientação do telemóvel também pode ser usada. Movimento horizontal a 2 m/s, limitado à área do modelo, sem colisões com mobiliário ou paredes. Regressar ao percurso guiado coloca a posição no ponto mais próximo do percurso. Iniciar GPS volta ao modo guiado; controlos manuais ficam bloqueados durante a caminhada.

## Testar no iPhone

1. Abrir https://jf-cem.github.io/tour-virtual/?v=1.3.2 no Safari.
2. Tocar em **Olhar com o telemóvel** e autorizar a orientação. Segurar o telemóvel à frente; a primeira leitura ancora o olhar atual.
3. Em **Local do teste**, manter **Teste onde estou** para experimentar fora de Benfica.
4. Tocar em **Iniciar caminhada**, autorizar a localização e ficar parado durante a preparação (pelo menos 10 segundos e 5 leituras estáveis).
5. Quando aparecer **P01 guardado aqui**, caminhar em linha reta cerca de 16 m. Regressar pelo mesmo caminho para recuar na tour.

No modo de teste remoto, o afastamento radial do ponto inicial determina o avanço. Não distingue deslocação lateral de avanço, nem mede a distância total de um passeio com curvas. No modo **Percurso real em Benfica**, a posição é projetada sobre o percurso geográfico da tour anterior e mapeada para os segmentos 3D.

A deslocação tem a incerteza original reportada pelo GPS, visível no ecrã. Leituras acima de 20 m, antigas e localizações fora do trecho suspendem o avanço. A preparação estável não torna o GPS mais preciso. Depois de 30 segundos, se existir uma leitura recente aceitável, pode ser escolhida manualmente. A margem de erro pode ser comparável ao comprimento deste trecho.

Confirmações consecutivas e transições limitadas a 1.5 m/s reduzem oscilações e saltos visuais; não recuperam precisão física. A posição virtual pode atrasar-se relativamente à posição estimada. Esta versão não integra aceleração para inventar deslocações, nem conta passos. Para tracking preciso de deslocações pequenas, avaliar uma app iOS com ARKit; não está implementado aqui.

Sair da página interrompe o GPS. **Parar caminhada** termina o acompanhamento. Um novo teste volta a preparar e ancorar o ponto inicial. **Exploração manual** conserva os controlos de demonstração, recolhidos por defeito. **Render D5** permite comparar as referências nos pontos fixos, fora de uma caminhada ativa.

## Geometria

GLB de aproximadamente 20.5 MB, 232 mil triângulos e 29 texturas incorporadas. Unidade: metro. Materiais base SketchUp; árvores, carros, pessoas e materiais exclusivos do D5 podem faltar.

P01 usa Tour 01; P02 usa Tour 02; P03 usa Tour 03.2. Percurso 3D: 16.38 m. Transformação inicial validada visualmente: `SketchUp (m) = (D5.y/100, D5.x/100, D5.z/100)`. Altura da câmara acima do piso: aproximadamente 1.65 m. As coordenadas geográficas do percurso anterior não são um levantamento validado no terreno.

## Publicação e dados

GitHub Pages neste repositório, independente de `jf-cem/tour-r02-teste`. Modelo e referências publicados com o protótipo. Sem telemetria implementada; as coordenadas são usadas em memória pelo navegador, não são guardadas nem enviadas pelo código da tour. As permissões são pedidas apenas depois de tocar nos respetivos botões. A biblioteca Three.js e a licença estão na pasta `vendor`.

Validação automatizada com GPS e orientação simulados. A precisão e o desempenho num iPhone real dependem do teste no aparelho.
