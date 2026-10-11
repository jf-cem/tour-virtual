# Qualidade móvel r5 · extensão P01–P09

11/10/2026. O utilizador aprovou a qualidade r4 no iPhone e pediu a aplicação às restantes zonas. Essa confirmação é uma avaliação de utilização/qualidade; não inclui relatório medido de 30 FPS nem identificação completa do aparelho. A expansão r5 permanece sujeita ao ensaio físico do percurso completo, também em Android/Chrome.

## Alterações

Acrescentadas quatro árvores e cinco arbustos com a receita aprovada r4. Total: nove árvores e doze arbustos, nos centros existentes. Folhas dobradas opacas em sprays ligados a ramos, agrupamentos e vazios, iluminação estática por vértice com 16 raios de oclusão ambiente e três raios solares por folha. Rebentos avermelhados apenas nas pontas. Uma primitiva por planta, culling individual; sem novos cartões alpha, BLEND, vento ou transições LOD. Troncos e ramos principais preservados.

Relva D5 com a mesma escala 1,1 m e shader r2/r4 nos canteiros restantes. Um atlas de iluminação neutra r5 substitui o antigo atlas colorido desses canteiros; o atlas do piloto mantém-se. Bakes afetados: R5_Lawn_Lighting, P01_P03_Ground_Lighting (só UVs da extensão; texels do piloto preservados antes da compressão), P01_P03_Fixtures_Lighting (só UVs da extensão; texels do piloto preservados antes da compressão), P04_P05_Ground_Lighting, P04_P05_Fixtures_Lighting. Exposição, FOV, sol e nevoeiro conservados. Cartazes/QR, círculo, carregadores, mobiliário, pavilhão, vidro, implantação e navegação de produção preservados. A altura livre mínima das novas plantas sobre caminhos é 2.37 m; todos os arbustos ficam dentro dos canteiros.

## Reutilização e aproximações

Base canónica r4, mesma receita procedural, materiais r2 e albedo D5 existente; metadados de implantação e espécies em inventario-03-cem e p01-p07-vegetation. As malhas de biblioteca D5 continuam ausentes; info.json não é geometria. Os equivalentes próprios de árvores de folha larga e Photinia não são reproduções botânicas exatas. A máscara rbikD_4K_Opacity0.jpg continua sem uso. Não foram acrescentadas plantas novas em localizações D5 não validadas. P08/P09 beneficiam da vegetação envolvente; revestimentos/vidro/geométrica do pavilhão conservam as aproximações anteriores. P09 D5 continua fora do pavilhão importado e a câmara não foi deslocada para esconder essa diferença.

## Custo

| Comprimido | GLB bytes | Triângulos | Primitivas | Materiais | Texturas embutidas |
|---|---:|---:|---:|---:|---:|
| r4-mixed.glb | 20414496 | 405090 | 110 | 92 | 36 |
| pilot-mixed.glb | 24673624 | 499350 | 119 | 92 | 36 |

r5/r4: +4 259 128 bytes (+20,86%), +94 260 triângulos (+23,27%) e nove primitivas. Número de texturas embutidas igual: o atlas neutro novo substitui o atlas antigo da relva restante. O ficheiro completo ultrapassa as metas indicativas iniciais de 20 MB e 300 mil triângulos; não baixar silenciosamente a qualidade aprovada. O ensaio físico completo é o próximo ponto de decisão.

| Variante | Recursos de arranque, bytes codificados | Chamadas na amostra | Triângulos visíveis na amostra | Estimativa texturas, bytes | Média ms | p95 ms | p99 ms |
|---|---:|---:|---:|---:|---:|---:|---:|
| r4-mixed | 24919773 | 42 | 228188 | 78897771 | 422.9 | 591.7 | 875.1 |
| pilot-mixed | 29178901 | 42 | 207568 | 79946347 | 492.4 | 641.7 | 941.7 |

Condições: Same 71 s P01–P09 traversal and beginning of return, all nine original camera positions, head rotation, 5 s warmup, 960x540 DPR1, recording 15 FPS, software SwiftShader; NOT physical iPhone/Android validation. Execuções sequenciais no mesmo browser/software, sem erros (0). Inclui gravação; é diagnóstico desktop, não benchmark de iPhone/Android. A estimativa de texturas inclui mipmaps/ambiente, não a memória total do processo. Recursos incluem GLB, módulos, decoders e mapas externos; os bytes de rede no Pages dependem da cache. Chamadas nas vistas fixas: r4-mixed 40–110; pilot-mixed 43–119.

## Evidência, integridade e entrega

Comparações r4/r5 nas mesmas câmaras P01/P03/P04/P05/P06/P07/P08/P09, árvores, arbustos de frente/lado, entrada/interior e círculo/QR. Vídeos atravessam todas as posições originais e iniciam o regresso, com rotação repetível. As referências D5 P04–P09 foram acrescentadas ao avaliador; as câmaras de origem são distintas da altura pedonal. As câmaras P01–P03 conservam-se. Sem alteração dos sensores/GPS ou produção.

Posições, UVs, transformações e atributos dos nós protegidos, incluindo toda a vegetação r4, passam na comparação numérica. Só 20 620 triângulos da folhagem antiga da extensão foram removidos; seis exigiram correspondência de coordenadas com tolerância de 0,00002 m entre autoria/exportação, sem modificar atributos canónicos. Meshopt sem perdas verificado e bytes de imagens originais/protegidas conservados, excetuando os bakes declarados e o atlas de relva substituído. Autoria contém 74 imagens packed. Mestres e r1–r4 preservados; SHA em avaliacao/integridade-custos.json. Autoria: tour-editavel-candidato.blend (179088352 bytes); execução: pilot-mixed.glb e avaliador vendorizado. Scripts e REPRODUZIR.ps1 locais.

Pages: https://jf-cem.github.io/tour-virtual/qualidade-movel-r5/. Avaliador: https://jf-cem.github.io/tour-virtual/qualidade-movel-r5/avaliador/?asset=pilot-mixed&view=P01&dpr=1.25&test=1. Publicação em pasta separada, preservando a tour principal e o piloto r4. Ficheiros .blend e relatórios privados de aparelhos não são publicados.

Repetir no iPhone/Safari: cinco aberturas completas, 5 s de aquecimento + 10 min de ida/volta P01–P09, resolução constante, quatro verificações visuais. Guardar JSON. Critérios: primeira vista ≤5 s em cada abertura na rede/cache declaradas, 30 FPS de média e em cada janela completa de 10 s, zero erro/perda de contexto/interrupção. Pages usa cache normal e guarda apenas por download; não chamar cinco recarregamentos a cinco downloads frios. Android/Chrome exige sessão própria. Aprovação r4 não certifica automaticamente o custo adicional r5.
