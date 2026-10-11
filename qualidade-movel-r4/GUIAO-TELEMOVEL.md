# Ensaio decisivo P01–P03 · r4 no Pages

Abrir no iPhone/Safari: https://jf-cem.github.io/tour-virtual/qualidade-movel-r4/avaliador/?asset=pilot-mixed&view=P01&dpr=1.25&test=1

1. Antes de iniciar, explorar P01/P02/P03 e comparar r2/r3/r4 nas mesmas vistas. Rever árvore inteira e copa inferior, arbustos de frente/lado, luz/sombra e rotação. Não alterar exposição/FOV para compensar defeitos.
2. Em “Condições e medição”, preencher modelo do aparelho, versão iOS/Android, browser, rede e cache. Indicar que a pré-visualização já carregou os assets. O Pages usa cache HTTP normal: cinco recarregamentos não são cinco downloads frios. Uma primeira abertura com cache limpa deve ser registada separadamente, sem prometer cache fria automática.
3. Selecionar r4 comprimida, DPR 1,25. Tocar “Iniciar ensaio neste aparelho”. Seguem cinco recarregamentos completos, 5 s de aquecimento e 10 min medidos de ida/volta com rotação.
4. Manter orientação e página visível; não gravar durante a medição. Fazer gravação separada para análise visual. Mudança de resolução, segundo plano, erro, crash ou perda de contexto impedem aprovação. Se ocorrer crash e desaparecer também o estado guardado, registá-lo manualmente.
5. No final, rever as quatro condições visuais e tocar “Descarregar resultado JSON”. Guardar o ficheiro do Safari/Chrome para análise. Não há servidor de recolha no Pages. Resultado válido apenas neste aparelho/perfil.

Critérios: primeira vista em até 5 s nas cinco aberturas sob as condições declaradas; 10 min contínuos; zero erro/perda de contexto/interrupção; média e todas as janelas completas de 10 s ≥30 FPS; quatro verificações visuais positivas. p95/p99/pausas >100 ms ficam no relatório. Copas e arbustos devem ter profundidade sem massas negras, sem cintilação/folhas soltas incomodativas, preservando gráficos e caminhos/sombras.

Repetir separadamente num Android/Chrome; aprovação iPhone não valida Android. Se o DPR 1,25 falhar, repetir como novo teste explícito em https://jf-cem.github.io/tour-virtual/qualidade-movel-r4/avaliador/?asset=pilot-mixed&view=P01&dpr=1&test=1, comparando primeiro a qualidade. Não existe adaptação automática de resolução/LOD.

Medições desktop/SwiftShader não certificam o telefone. Estimativa de texturas não é memória total. Localmente, alternativa na mesma Wi-Fi: http://192.168.1.73:8770/avaliador/?asset=pilot-mixed&view=P01&dpr=1.25&test=1, com HTTP no-store e coletor no PC. Essas condições diferem do Pages e devem ser identificadas como tal.
