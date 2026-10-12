# Revisão completa P01–P13 · qualidade móvel r7

12/10/2026. Todos os 13 panoramas numerados presentes em 03_CeM estão acessíveis; inventariados os 19 renders D5 originais, incluindo variantes. Continuação cumulativa da r6, com prioridade à casa e aos MUPIs. Vegetação, relva e geometria r6 mantidas. A tour principal e as revisões anteriores não foram alteradas.

## O que foi completado

P13 colocado na origem real de renderQueueInfo, Tour 13_1.png, com referência 33344Tour 13.png. P01–P12 conservam as posições e alinhamentos anteriores. As variantes 01.1/01.2, 03, 06.2, 08.2/08.3 estão acessíveis como imagens de consulta; não são inventadas novas origens de câmara quando não há correspondência demonstrada. Galeria com r6/r7/D5 nas 13 vistas e detalhes da casa/MUPIs. FOV, exposição e resolução r6/r7 iguais; D5 é um render com tratamento de imagem incorporado, não uma medição de igualdade de exposição.

Corrigida no avaliador a escolha do piso interior: o raycast passa a escolher faces horizontais perto do piso esperado, evitando colocar a caminhada no telhado da casa. Origens dos panoramas fixos preservadas. A transição automática não certifica colisões ou um percurso fisicamente livre; GPS/sensores da tour principal continuam intactos.

## Materiais reais reutilizados

Casa/lambert3.jpg, tecido 2500² disponível em 03_CeM, ligado às UVs originais dos assentos. O relevo e a variação de luminância da imagem foram reutilizados com tonalidade terracota ajustada às referências P11/P13. É um equivalente do cache D5 Burgundy linen cloth, que não é um bitmap legível; não se afirma ter recuperado esse cache. Cascas claras dos assentos e equipamento foram aproximados ao branco quente do render D5.

Mantidos da r6: madeira African red bean tree real D5 com albedo 1024² e bake neutro 2048²; cortiça original; mapas solares; cartazes azul/energia originais 887×1774, bytes preservados; pintura antracite dos MUPIs e vidro com reflexos económicos. O cilindro passou do metal cinzento a um acabamento claro quente, com reflexão reduzida, guiado por P11/P13; continua uma aproximação de revestimento, sem novos mapas ou transparência. O pavilhão mantém os seus materiais exportados de 03_CeM: bake aumentado de 512² para 2048², sem aumentar polígonos ou mudar UVs. Proveniência e hashes em authoring-import.json e REUTILIZACAO.json locais.

Recalculados apenas cinco atlas afetados: R6_Wood_Lighting 2048×2048 / 4096 amostras; R6_Seats_Lighting 1024×1024 / 2048 amostras; R6_Cork_Lighting 512×512 / 1024 amostras; R6_Equipment_Lighting 1024×1024 / 2048 amostras; P08_P09_Pavilion_Lighting 2048×2048 / 2048 amostras. Os restantes bakes, texturas, todos os nós, índices, atributos, UVs e transformações r6 passaram nas verificações de integridade. Autoria Blender com 87 imagens incorporadas. A geometria D5 da casa, já recuperada na r6, mantém-se; metadados não são apresentados como novas malhas.

## Custo e validação

| Variante | GLB bytes | Triângulos | Primitivas | Materiais | Imagens |
|---|---:|---:|---:|---:|---:|
| r6 | 36 056 040 | 586 927 | 132 | 104 | 45 |
| r7 | 37 777 920 | 586 927 | 132 | 104 | 45 |

Incremento GLB 1 721 880 bytes, sem incremento de triângulos. Mapas externos de relva/microdetalhe/madeira idênticos à r6; o tecido de autoria não é carregado à parte no browser. Referências e comparações são carregadas quando consultadas.

| Diagnóstico desktop | Recursos de arranque bytes | Chamadas na amostra | Triângulos visíveis | Estimativa texturas bytes | Média ms | p95 ms | p99 ms |
|---|---:|---:|---:|---:|---:|---:|---:|
| r6-mixed | 41 674 832 | 120 | 490 106 | 115 610 743 | 139.2 | 370.0 | 450.0 |
| pilot-mixed | 43 396 712 | 119 | 489 993 | 120 853 623 | 136.4 | 370.1 | 440.0 |

Same 65 s P01–P13 original camera transition and return with yaw/pitch; fixed 960×540 DPR1, 5 s warmup; 15 FPS recording; sequential SwiftShader software diagnostic, not physical mobile performance or collision validation. Câmaras fixas: r6-mixed 51–133 chamadas; pilot-mixed 51–133 chamadas. Desktop/SwiftShader com gravação não valida iPhone ou Android. Estimativa de texturas não é memória total. A meta 30 FPS permanece por medir no aparelho físico para esta revisão completa.

## Limites preservados e entrega

O QR original no piso continua encoberto pela casa D5, como na r6; malha/imagem intactas e acesso separado em “Cartazes e QR”. Reflexos da sonda estática 128 são aproximados, sem espelho planar por observador. O pavilhão pequeno conserva a geometria simplificada anterior; a configuração/acabamento e as vistas através do vidro diferem das referências P08–P10. A geometria/contexto exterior e a vegetação económica não reproduzem todos os detalhes do D5. O equipamento ativo do asset D5 contém marca Huawei, enquanto alguns renders mostram Tesla: não foi inventado ou substituído um logótipo. Intensidades de iluminação e acabamentos de caches ilegíveis são equivalentes documentados.

Entrega local: tour-editavel-candidato.blend com 13 câmaras e proveniência D5 incorporada, assets de execução, avaliador P01–P13, scripts de reprodução, provas de integridade, imagens de comparação e vídeo. Publicação separada qualidade-movel-r7; sem .blend nem resultados privados. O iPhone/Safari foi aprovado qualitativamente numa revisão anterior; r7 requer novo ensaio, e Android/Chrome um ensaio separado.
