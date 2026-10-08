# Tour Virtual v1.4 — piloto do motor de movimento

Atualização da tour v1.3.4 existente, baseada em `00494b345ba6cb1ab0fdd49c8de9dee2d0ac8078`. Mantém modelo, renders D5, percurso, controlos, planta, layout principal e destino GitHub Pages. Não foi publicada. As opções adicionais estão em **Local do teste**, no popover existente. A página `ensaio.html` é um instrumento auxiliar, não substitui a tour.

O método **GPS atual · referência** continua selecionado inicialmente, conforme a restrição de não promover o novo motor sem validação física. Para testar o upgrade, selecionar **GPS + atividade** ou **GPS + passos** no mesmo popover. A intenção da v1.4 é melhorar o motor; os parâmetros ainda são hipóteses. A promoção do método deve seguir as sessões do iPhone, não os testes sintéticos.

## Código

- `sensor-service.js`: aquisição partilhada, permissões separadas por gesto, normalização de tempos/unidades, frequências reais, campos parciais, subscrições independentes, teardown e sessões GPS.
- `movement-core.js`: detetor de ciclos/cadência, atividade, estimador puro 1D, projeção assinada remota/polilinha, incerteza operacional e limites.
- `movement-pilot.js`: integração do motor no botão existente, âncora explícita, eixo físico, confirmação de sentido, diagnóstico e exportação local opt-in.
- `phone.js`: mantém o GPS legado e o quaternion do olhar. O olhar passa pelo serviço partilhado; o wrapper escolhe o motor de caminhada.
- `app.js`: conserva toda a navegação. Só altera a velocidade de apresentação experimental para 4 m/s e regista apresentação; a correção física GPS continua limitada a 0,6 m/s. Um passo de 0,65 m pode ser apresentado em aproximadamente 0,16 s a esta velocidade, antes de custos de renderização. Isto é um limite de animação, não latência física medida.
- `movement-replay.js`, `ensaio.html`, `ensaio.js`: instrumento com o mesmo núcleo e comparação local de sessões. O replay legado usa fixes brutos e o filtro original, mas substitui a preparação pela âncora explícita da sessão e não reproduz a animação 3D.

## Sensores e fallbacks

Usa Geolocation (coordenadas/accuracy/timestamp; speed e heading quando informativos), DeviceMotion (aceleração, incluindo gravidade e rotationRate) e DeviceOrientation (olhar e diagnóstico). O detetor prefere magnitude com gravidade e separação temporal; usa aceleração sem gravidade quando a primeira não é completa. Não integra aceleração duas vezes para obter distância.

Heading de deslocamento só verifica coerência com deslocamento projetado e velocidade >=0,8 m/s; não é somado como uma medida independente. Bússola/absolute são recolhidos quando expostos, mas não definem marcha nem eixo. Não usa Generic Sensor, código externo de detetores, câmara, ML, APIs nativas ou apps instaladas.

Permissão de movimento não é inferida de orientação. Sem eventos ou com campos nulos, mostra esse estado e não fabrica passos. GPS + atividade pode funcionar com GPS quando a atividade é desconhecida. GPS + passos pode continuar brevemente com passos e sentido válido, dentro dos limites. Sem GPS, selecionar explicitamente passos ancorados: confirmar P01/sentido e aceitar distância estimada. Sem sinais suficientes, parar e usar manual. Ocultar a página termina a sessão e desliga subscrições; reinício exige nova âncora.

## Parâmetros iniciais por validar

| Parâmetro | Hipótese inicial |
|---|---:|
| Metros por passo detetado | 0,65 m; calibração manual 0,2–1,5 m |
| Gap máximo de movimento | 300 ms |
| Período entre picos | 300–1500 ms; consistência em pelo menos 2 intervalos |
| Pico / libertação | 1,05 / 0,35 m/s² |
| Rotação suspeita | >240 graus/s |
| Paragem | energia <0,12; histerese temporal |
| Horizonte de sentido | 5 s |
| Idade GPS máxima | 10 s, incluindo atraso de aquisição |
| Previsão sem fix | máximo 12 s e 6 m acumulados, incluindo ida/regresso |
| Incerteza operacional máxima | 12 m |
| Correção GPS | máximo 0,6 m/s |
| Discrepância para reancorar | >10 m |
| Accuracy máxima | 20 m; origem remota também contribui |
| Gate de salto GPS | 3 m/s + margem de accuracy |
| Eixo remoto | >=8 m e >=2 × soma das accuracies dos extremos |
| Registo local | máximo 24 000 eventos; pára ao encher |

Incerteza é um orçamento de engenharia: soma conservadora de accuracy/origem/escala e 30% da distância prevista. Não é sigma, intervalo estatístico ou promessa de erro físico. O clamp nos extremos não reduz incerteza. Com origem de ±6–7 m, o limite de 12 m pode impedir previsão por passos; o ensaio deve mostrar esta limitação.

A direção vem de deslocamento informativo no percurso ou confirmação humana. Inversão GPS pede duas evidências coerentes; rotação do olhar nunca inverte a marcha. Quando desconhecida/expirada, os passos contam no diagnóstico e são descartados para posição, sem salto posterior. GPS ainda pode corrigir posição absoluta. Lateralidade só é observável com eixo e fixes úteis; passos com sentido confirmado dependem da confirmação humana.

## Testes reproduzíveis

Na pasta do piloto, com Node 24 (ou versão compatível):

```powershell
node tests/core.cjs
node tests/edge-cases.cjs
node tests/sensors.cjs
node tests/test-tracking-core.cjs
node tests/replay.cjs tests/synthetic-session.json
node tests/serve.cjs
```

O comando `node tests/run-browser.cjs` inicia e termina o servidor e executa as quatro suites de browser. Noutro terminal, os testes de browser precisam de Playwright/Chromium. Os caminhos locais da sessão são os defaults; podem ser substituídos por `PLAYWRIGHT_MODULE` e `CHROME_PATH` (nos testes legados, ajustar executablePath se necessário). `TOUR_URL` pode substituir a porta local.

```powershell
$env:TOUR_URL='http://127.0.0.1:8786/'
node tests/pilot-browser.cjs
node tests/test-virtual-phone.cjs
node tests/test-planner-v134.cjs
node tests/test-manual-v132.cjs
```

Resultados: 14 cenários do núcleo + 6 casos de fronteira; serviço de sensores; núcleo GPS legado; browser do piloto; regressões de orientação/GPS, manual e editor. Sensores/GPS foram simulados em Chromium com SwiftShader. Não medem precisão/FPS no iPhone. `tests/synthetic-session.json` é uma sessão simulada, não caminhada real.

Limitações por validar: falsos passos em gestos periódicos lentos, passos iniciais omitidos para confirmar cadência, orientação livre em uso real, comprimento variável do passo, erro de origem/eixo, atraso e recuperação em sinal fraco, Safari/Chrome físicos. Eixo reto remoto não valida curvas de Benfica. As coordenadas de Benfica continuam sem levantamento validado.

Referências primárias consultadas: [W3C Device Orientation and Motion](https://www.w3.org/TR/orientation-event/) e [W3C Geolocation](https://www.w3.org/TR/geolocation/). Os limites/filtros são decisões deste piloto, não resultados dessas especificações.
