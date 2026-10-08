# Integração da v1.4 no repositório existente

Base: `00494b345ba6cb1ab0fdd49c8de9dee2d0ac8078` (v1.3.4). Piloto: `C:/Users/joaof/Documents/ChatGPT/CeM_Virtual_Tour/outputs/movimento-piloto`. Patch: `C:/Users/joaof/Documents/ChatGPT/CeM_Virtual_Tour/outputs/MOVIMENTO-v1.4.patch`.

1. Integrar numa branch do mesmo repositório `jf-cem/tour-virtual`, conservando a publicação GitHub Pages main/raiz. Este agente não fez commit, push ou publicação. O integrador decide o momento de publicar.
2. Numa cópia limpa da base, executar `git apply --check <caminho-do-patch>` e depois `git apply <caminho-do-patch>`. O patch contém apenas código, documentação e testes, sem GLB/imagens/route.json/vendor.
3. Se houver mudanças do agente gráfico, não substituir app.js/index.html/style.css por inteiro. Em app.js, integrar só `phone.experimental()` no limite de apresentação e `phone.present(travel)`. Em index.html, adicionar os dois scripts de núcleo/serviço antes de app.js e as opções no popover `tracking-options`. Em style.css, acrescentar apenas as regras do piloto. Não tocar em luzes, materiais, modelo ou referências.
4. Acrescentar os novos módulos movement/sensor/ensaio e atualizar phone.js com o wrapper e subscrição do olhar. `tracking-core.js`, `gps-start.js`, `geo.js`, `manual.js` e `planner.js` conservam os bytes da base.
5. Executar os testes do README-MOVIMENTO na versão integrada. Confirmar início em WASD/setas/desenho → percurso original ao ligar caminhada → regresso ao desenho ao parar. Confirmar olhar e caminhada separadamente, página oculta, avanço/regresso, diagnóstico e exportação.
6. A versão do index é v1.4 e os URLs de cache são `v=1.4`; usar um identificador de cache novo na publicação final. Não alterar route.json só para mudar a versão.
7. Publicar a versão de ensaio no **mesmo GitHub Pages**, quando o integrador estiver autorizado. João abre `https://jf-cem.github.io/tour-virtual/?v=1.4` e, para recolha leve, `https://jf-cem.github.io/tour-virtual/ensaio.html?v=1.4`. Estes URLs são os destinos previstos; não foram publicados por este agente.
8. Manter GPS atual como comparação inicial. João escolhe GPS + sensores em Local do teste. Após sessões reais de ajuste e validação separadas, decidir o método predefinido e a promoção v1.4. Não converter testes sintéticos em garantia de precisão.

Para rollback do ensaio, repor os ficheiros originais app.js/phone.js/index.html/style.css/README.md do commit base e remover os módulos novos da versão publicada. Assets e route.json não requerem rollback.
