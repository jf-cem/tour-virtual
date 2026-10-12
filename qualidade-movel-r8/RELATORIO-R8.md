# Ronda de correções · qualidade móvel r8

12/10/2026. Revisão separada da r7, com P01–P13 e as 19 referências D5 conservadas. Masters, revisões anteriores e tour principal preservados.

| Problema | Correção |
|---|---|
| Banco com faces negras | Recuperação da geometria COLLADA precisa, remoção de faces duplicadas, madeira real disponível e estrutura antracite com iluminação baked |
| Sanita e lavatório partidos | Recuperação das curvas e UVs originais, redução controlada do detalhe, cerâmica branca e torneira cromada; removida a atribuição errada de madeira à sanita |
| Riscas no pavimento | Eliminação de sobreposições e fissuras nas margens, triangulação com normais corretas, chart contínuo de iluminação e sincronização da malha de execução com a autoria |
| Carregadores serrilhados | Geometria original precisa, cabos contínuos, painéis com UVs originais e acabamento com mapas disponíveis |
| Água opaca | Superfície própria com sonda estática 128, ondulação suave e reflexos; reduzida a contribuição difusa que a fazia parecer tinta |

A malha simplificada anterior tinha coordenadas arredondadas numa grelha de aproximadamente 3,5 cm. Foram recuperadas peças de CEM BENFICA4.dae, não de info.json. Removidas 103 183 faces duplicadas antes da redução de detalhe. A casa real recuperada na r6, os MUPIs, cartazes, QR e navegação mantêm-se. Alterados apenas seis conjuntos de autoria/execução afetados e as peças corrigidas. Recalculados os respetivos atlas e sombras; geometria e UVs dos restantes nós verificadas. O pavimento conserva as superfícies gráficas protegidas. As margens cortadas foram regularizadas com uma faixa de até 8 cm, mascarada pelos lancis e recortes protegidos. A iluminação r7 dos 4 676 polígonos gráficos preservados foi transferida para o novo chart, evitando alterações à sua aparência.

[Auditoria dos materiais](MATERIAIS.md). Cinco recursos disponíveis acrescentados; não se afirma que todos os materiais da biblioteca sejam usados.

| Custo do modelo | r7 | r8 |
|---|---:|---:|
| bytes | 37 777 920 | 42 929 656 |
| triangles | 586 927 | 608 345 |
| primitives | 132 | 137 |
| materials | 104 | 104 |
| textures | 45 | 46 |

Incremento: 5 151 736 bytes de GLB e 21 418 triângulos. Mapas externos de normal/rugosidade: 202 004 bytes adicionais. Imagens de comparação e referências carregam apenas quando consultadas.

| Caminhada desktop | Recursos únicos bytes | Chamadas na amostra | Triângulos visíveis | Texturas estimadas bytes | Média ms | p95 ms | p99 ms |
|---|---:|---:|---:|---:|---:|---:|---:|
| r7-mixed | 43 402 382 | 65 | 225 340 | 120 853 623 | 128.2 | 360.0 | 460.5 |
| pilot-mixed | 48 756 122 | 67 | 220 438 | 124 271 473 | 138.2 | 400.0 | 489.8 |

Same 55 s P01â€“P13 original camera transition and return with yaw/pitch, then 10 s water detail with rotation; fixed 960Ã—540 DPR1, 5 s warmup; 15 FPS recording; sequential SwiftShader software diagnostic, not physical mobile performance or collision validation. Capturas r7/r8: câmaras, exposição, FOV e resolução iguais. As vistas de detalhe são adicionais, sem atribuição inventada a uma origem D5. Chamadas nas capturas: r7-mixed 36–133; pilot-mixed 38–138. Desktop/SwiftShader não valida o iPhone; meta móvel 30 FPS por medir nesta r8.

Limites: reflexos da água usam uma sonda estática, sem refração ou reflexão planar dinâmica. O pavilhão conserva a aproximação geométrica anterior e algumas diferenças de acabamento face ao D5. O QR antigo continua encoberto pela casa mas disponível em Cartazes e QR. A transição automática é uma prova visual e de integração, sem certificar colisões.

Entrega local: tour-editavel-candidato.blend, assets, avaliador, scripts, comparações, vídeo e provas de integridade. Publicação separada r8; .blend, fontes e relatórios privados de ensaio não são publicados.
