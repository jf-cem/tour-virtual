# Ensaio decisivo P01–P12 · r6 no Pages

Abrir no iPhone/Safari: https://jf-cem.github.io/tour-virtual/qualidade-movel-r6/avaliador/?asset=pilot-mixed&view=P10&dpr=1.25&test=1

1. Antes de iniciar, explorar P01–P12 e comparar r5/r6 nas mesmas vistas. Rever MUPIs, madeira, teto, assentos, vidro e reflexos, incluindo rotação. Não alterar exposição/FOV para compensar defeitos.
2. Em “Condições e medição”, preencher modelo do aparelho, versão iOS/Android, browser, rede e cache. Indicar que a pré-visualização já carregou os assets. O Pages usa cache HTTP normal: cinco recarregamentos não são cinco downloads frios. Uma primeira abertura com cache limpa deve ser registada separadamente, sem prometer cache fria automática.
3. Selecionar r6 comprimida, DPR 1,25. Tocar “Iniciar ensaio neste aparelho”. Seguem cinco recarregamentos completos, 5 s de aquecimento e 10 min medidos de ida/volta com rotação.
4. Manter orientação e página visível; não gravar durante a medição. Fazer gravação separada para análise visual. Mudança de resolução, segundo plano, erro, crash ou perda de contexto impedem aprovação. Se ocorrer crash e desaparecer também o estado guardado, registá-lo manualmente.
5. No final, rever as quatro condições visuais e tocar “Descarregar resultado JSON”. Guardar o ficheiro do Safari/Chrome para análise. Não há servidor de recolha no Pages. Resultado válido apenas neste aparelho/perfil.

Critérios: primeira vista em até 5 s nas cinco aberturas sob as condições declaradas; 10 min contínuos; zero erro/perda de contexto/interrupção; média e todas as janelas completas de 10 s ≥30 FPS; quatro verificações visuais positivas. p95/p99/pausas >100 ms ficam no relatório. Casa e MUPIs devem manter detalhe e iluminação legíveis; rotação sem defeitos graves, preservando as sombras e acesso aos cartazes e QR.

Repetir separadamente num Android/Chrome; aprovação iPhone não valida Android. Se o DPR 1,25 falhar, repetir como novo teste explícito em https://jf-cem.github.io/tour-virtual/qualidade-movel-r6/avaliador/?asset=pilot-mixed&view=P10&dpr=1&test=1, comparando primeiro a qualidade. Não existe adaptação automática de resolução/LOD.

Medições desktop/SwiftShader não certificam o telefone. Estimativa de texturas não é memória total. A confirmação anterior de qualidade r4 no iPhone foi registada. Repetir o percurso completo r6 para avaliar o custo adicional. A tour principal permanece intacta.

Prioridade P10–P12: legibilidade dos MUPIs, madeira/teto, assentos, vidro e reflexos durante rotação. A casa D5 cobre o QR antigo no piso; verificar acesso à imagem original no avaliador. Reflexos e conversão de luz são aproximações descritas no relatório.
