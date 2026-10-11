# P01–P03 completo · qualidade móvel r4

11/10/2026. Candidato separado, preparado para ensaio físico no iPhone/Safari e, em sessão distinta, Android/Chrome. Publicação autorizada pelo utilizador, numa pasta própria do Pages existente. A tour principal, os mestres, r1/r2/r3 e P04–P09 foram preservados. Desempenho físico e aprovação visual do utilizador pendentes.

## Resultado

Cinco árvores e sete arbustos receberam a construção r3: agrupamentos de ramos secundários e folhas dobradas, espaços vazios naturais, cor local e iluminação estática por vértice. As árvores conservam os troncos/ramos principais existentes. Arbustos com interior sombreado e exterior iluminado; rebentos avermelhados restritos aos terminais. Uma primitiva opaca por planta permite culling individual. Não há recorte alpha, BLEND, PBR por folha, vento ou mudança de LOD. A geometria adicional sustenta ramificação e volume; não representa por si só prova de qualidade.

Folhagem iluminada com oclusão suave BVH e direção do sol da cena, independente da câmara. Só três bakes afetados foram recalculados: relva neutra, pavimento e mobiliário P01–P03. Textura/escala/cor de relva e acabamento dos MUPIs r2 mantidos. Cartazes, QR, implantação, geometria funcional e navegação de produção preservados. Todos os arbustos ficam no canteiro; altura livre mínima da folhagem sobre caminhos 2.34 m.

## Reutilização e limites

Base canónica r2, receita demonstrativa r3, implantação existente, troncos principais, albedo D5 da relva e materiais r2 dos MUPIs. Referências: levantamento inventario-03-cem/RELATORIO-REUTILIZACAO.md, panoramas D5 em D:/Workspace/03_CeM, metadados de espécies e comparações anteriores. As bibliotecas D5 continuam sem malhas recuperadas: info.json é metadado. Árvores de folhagem larga e arbustos tipo Photinia são equivalentes procedurais próprios; não são os modelos D5 originais nem uma reprodução botânica exata. A máscara rbikD_4K_Opacity0.jpg é branca e não foi usada. Não houve ensaio de cartões alpha: falta um atlas válido que justificasse substituir a solução opaca. Os troncos existentes e o contexto permanecem simplificados.

## Custo

| Candidato comprimido | GLB, bytes | Triângulos | Primitivas | Texturas embutidas |
|---|---:|---:|---:|---:|
| r2 | 19 376 224 | 338 250 | 110 | 36 |
| r3 | 19 462 184 | 347 170 | 111 | 36 |
| r4 | 20 414 496 | 405 090 | 110 | 36 |

r4/r2: +1 038 272 bytes (+5,36%) e +66 840 triângulos (+19,76%); zero texturas adicionais. r4/r3: +952 312 bytes e +57 920 triângulos; menos uma primitiva. O total de download inclui módulos, descodificadores e mapas externos, além do GLB. Valores observados de arranque na tabela; o Pages utiliza a cache HTTP do browser e os bytes de transferência podem variar. Não confundir tamanho de recursos com bytes realmente transmitidos numa abertura em cache.

| Variante | Média ms | p95 ms | p99 ms | Chamadas na amostra | Triângulos visíveis na amostra | Recursos de arranque, bytes codificados | Estimativa texturas, bytes |
|---|---:|---:|---:|---:|---:|---:|---:|
| r2-mixed | 132.7 | 300.0 | 416.6 | 102 | 300877 | 23878040 | 78897771 |
| r3-mixed | 166.1 | 416.7 | 666.7 | 104 | 309910 | 23964000 | 78897771 |
| pilot-mixed | 425.0 | 741.8 | 5816.4 | 105 | 349990 | 24916312 | 78897771 |

Condições: Same 40 second whole P01–P03 roundtrip with head rotation, 5 second warmup, 960x540 DPR1, WebM recording 15 FPS, software SwiftShader; NOT physical iPhone/Android validation. Três execuções sequenciais, mesmas câmaras, exposição, FOV, resolução e caminho. Zero erros: true. Chamadas nas vistas fixas: r3-mixed 34–110; pilot-mixed 34–110. A estimativa de texturas inclui mipmaps e ambiente; não é memória total GPU/processo. SwiftShader não valida iPhone nem Android, nem permite concluir cumprimento móvel dos 30 FPS.

## Evidência e ensaio decisivo

COMPARACAO.html: vistas idênticas r3/r4, árvore inteira/copa inferior, arbusto próximo, P01/P02/P03, zonas de luz/sombra e vídeos r2/r3/r4 com ida/volta e rotação. Avaliador permite comparar também r2 na mesma câmara. Exposição e nevoeiro conservados, sem alterações para esconder defeitos.

Abrir https://jf-cem.github.io/tour-virtual/qualidade-movel-r4/avaliador/?asset=pilot-mixed&view=P01&dpr=1.25&test=1. Identificar modelo/sistema/browser e rede. Cinco recarregamentos completos e 5 s de aquecimento + 10 min medidos. Aprovação exige primeira vista até 5 s em cada abertura, zero erro/perda/interrupção, média e todas as janelas de 10 s ≥30 FPS, quatro verificações visuais positivas. No Pages o relatório JSON é descarregado, sem coletor remoto; cache não é forçada a fria. Android/Chrome exige resultado próprio. Repetir DPR 1 como sessão distinta se necessário. A integração desktop verificou cinco recarregamentos, observador e rejeição de sessão interrompida, sem ser apresentada como ensaio físico.

Integridade numérica: posições, UVs, atributos, transformações e triângulos das superfícies protegidas verificados; exceção circunscrita às folhas/arbustos simplificados substituídos. Compressão Meshopt sem perda e imagens não afetadas idênticas; 73 imagens packed na autoria. SHA dos mestres e versões anteriores registados em avaliacao/integridade-custos.json. .blend editável: tour-editavel-candidato.blend, 159683344 bytes. Assets de execução e scripts locais reproduzíveis. Nenhuma expansão de P04–P09.
