# Qualidade móvel r6 · P10–P12: casa e MUPIs

11/10/2026. Continuação cumulativa da r5, com prioridade aos MUPIs e à casa. Vegetação r5 conservada. Revisão separada; tour principal, mestres e candidatos anteriores preservados.

## Resultado e origem

Recuperada a malha efetiva do asset D5 Casa.skp ativo, ID 4745B22AB18148C3A9DC860133ABD038. O ficheiro binário 1.d5mesh contém 253 malhas e 713 instâncias, 168 123 triângulos; o descodificador consumiu exatamente os 4 211 648 bytes. Não é geometria inferida de info.json. Usados o pivô zeroPointOffset e a transformação da instância ativa de 1.save, com o mesmo referencial em metros da tour. O pavilhão antigo conserva-se; a casa adicional inclui os MUPIs, assentos, revestimentos, caixilharia, vidro e equipamento que faltavam na r5.

P10/P12: câmaras renderQueueInfo. P11: spinePoint da cena Tour11 em 1.save, pois falta entrada P11 na fila de render. Os três panoramas PNG originais foram usados como referência visual. Comparações r5/r6 com posições, orientação, exposição, FOV e resolução iguais; D5 apresentado como bitmap de referência, com o tratamento de imagem já incorporado no render original.

## Qualidade e custo económico

Cartazes azul e energia: PNG originais D5, 887×1774, bytes idênticos antes/depois da compressão. UVs convertidos para o sentido V correto; sem compressão destrutiva, bake de cor, exposição artificial ou imagem gerada. Disponíveis também em tamanho completo no avaliador. Estruturas com o acabamento dielétrico r2 reaproveitado e cor antracite local; caixilharia e suportes reais da casa D5.

Madeira: albedo D5 real, derivado 1024² UASTC com mipmaps, UV0/escala D5; iluminação estática neutra em UV1, independente do veio. União de vértices coincidentes nos grupos baked mantém as formas e melhora a continuidade das UVs. Quatro atlas interiores: madeira 2048², assentos 1024², cortiça 512² e equipamento 1024². Refinamento de amostras registado em bake-refinement.json. Luzes D5 locais usadas apenas no bake; conversão de intensidade para Cycles aproximada. Vidro e reflexos com uma sonda estática do interior de 128, calculada uma vez por carregamento. Sem luzes ou sombras interiores recalculadas por frame.

Reduzidos apenas elementos curvos do mobiliário: Cork 73 675 → 11 788 triângulos; Seats 36 049 → 19 826 triângulos. Geometria r5 não simplificada. Removidos pequenos triângulos degenerados do asset recuperado. Logótipo secundário 9309×2048 reduzido a 1024×225 e célula solar 1843² a 1024²; cartazes não reduzidos. Os ficheiros de cache de Black Iron, tecido e algumas madeiras não são bitmaps legíveis no Blender: equivalentes dielétricos/tecido mate documentados em authoring-import.json. A geometria da casa foi recuperada; as bibliotecas de vegetação .d5ax continuam ausentes.

Sombras afetadas recalculadas nos cinco atlas exteriores declarados em bakes.json. Texels do piloto protegidos antes da recompressão dos atlas parciais P01. Atlas do pavilhão anterior conservado. Todos os nós r5, posições, índices, UVs e atributos passam na comparação numérica; imagens originais preservadas, salvo os cinco bakes declarados. Meshopt sem perdas verificado. Autoria com 86 imagens incorporadas e 13 grupos novos.

## Medições

| Variante | GLB bytes | Triângulos totais | Primitivas | Materiais | Imagens embutidas |
|---|---:|---:|---:|---:|---:|
| r5 | 24 673 624 | 499 350 | 119 | 92 | 36 |
| r6 | 36 056 040 | 586 927 | 132 | 104 | 45 |

Incremento GLB: 11 382 416 bytes; triângulos: +87 577; primitivas: +13. Mapa externo de madeira novo: 1 106 635 bytes. Albedo de relva e microdetalhe r5 conservados. O custo adicional é maior do que na expansão de vegetação: inclui uma casa completa que antes estava ausente.

| Diagnóstico desktop | Recursos de arranque, bytes | Chamadas na amostra | Triângulos visíveis | Estimativa texturas, bytes | Média ms | p95 ms | p99 ms |
|---|---:|---:|---:|---:|---:|---:|---:|
| r5-mixed | 29 184 197 | 74 | 425 442 | 79 946 347 | 92.0 | 133.3 | 141.7 |
| pilot-mixed | 41 673 248 | 87 | 502 990 | 115 610 743 | 272.2 | 458.3 | 508.2 |

Condições: Same 50 s P09–P12 original camera transition and return with yaw/pitch; fixed 960×540 DPR1, 5 s warmup; 15 FPS recording; sequential SwiftShader software diagnostic, not physical mobile performance or collision validation. Inclui gravação; não é benchmark do iPhone/Android, nem validação de colisões. Câmaras fixas: r5-mixed 40–119 chamadas; pilot-mixed 51–133 chamadas. Estimativa de texturas inclui os mapas externos e a sonda; exclui a memória total do processo. Meta móvel de 30 FPS permanece por medir na r6.

## Aproximações e conflito de implantação

Reflexos da sonda são estáticos e aproximados: não equivalem a reflexos D5 por raios, nem a espelhos planares corretos para cada observador. Pequenas diferenças nos acabamentos, nas intensidades de luz e no vidro permanecem. O pavilhão antigo e o contexto exterior mantêm as aproximações anteriores. A transição automática do avaliador é um percurso de câmaras; não certifica navegação física ou colisões.

A casa D5 sobrepõe a posição do QR do piso da r5. Essa malha e imagem continuam intactas, mas ficam encobertas pela nova casa. O avaliador disponibiliza o QR original separadamente em “Cartazes e QR”; não foi inventada uma nova implantação no exterior. A comparação círculo/QR explicita este conflito. A navegação GPS/sensores e a tour principal não foram alteradas.

## Entrega e ensaio

tour-editavel-candidato.blend, pilot-mixed.glb, mapa de madeira, avaliador, fontes de reprodução e provas de integridade locais. Galeria com pares r5/r6, três referências D5 e vídeos de transição P09–P12. Pages em pasta independente: https://jf-cem.github.io/tour-virtual/qualidade-movel-r6/.

O utilizador confirmou anteriormente a qualidade r4 no iPhone/Safari; isso não valida o custo r6. Avaliar agora P10–P12: texto dos MUPIs, madeira/assentos, reflexos, vidro e rotação; depois executar o ensaio de cinco aberturas e dez minutos P01–P12. Android/Chrome requer uma sessão própria. O Pages descarrega JSON; não recolhe dados do aparelho. .blend e resultados privados não publicados.
