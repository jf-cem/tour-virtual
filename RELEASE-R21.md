# Tour R21 integrada — 21/10/2026

Gráficos R21 integrados com todas as interações aprovadas: caminhada WASD e olhar, planta com zoom/arrasto, percurso, GPS/SLAM, transporte pela plataforma rotativa completa, porta simples, luzes interiores com cinco modos, cartazes e telemóvel opcional com tabs. As novas mesas acompanham a rotação, conservando as transformações da R21.

## Bases e autoria

Base gráfica: `qualidade-movel-r21-interior/site`, GLB de 54 727 260 bytes, SHA256 `477201d92cbeab3c8ff0900a4db99f7ef48d6ff94e9b26b4499302fef48b9eac`. Loader, texturas e modelo preservados byte a byte. Textos, cartazes e QR não foram redesenhados. Three r180, ACES, exposição 1,3.

Base funcional: `integracao-r17-interacoes-v1/site`. Runtime integrado: `integracao-r21-interacoes-v1/site`. Editável gráfico recuperável em `../qualidade-movel-r21-interior/tour-editavel-candidato.blend`; esta integração não altera o mestre Blender. Não foi necessário abrir o MCP Blender.

## Verificação técnica e visual

29 testes Node aprovados, incluindo seleção das cinco novas peças da mesa e conservação das transformações. Revisão independente sem problemas P1/P2.

Sete vistas comparadas com as mesmas câmaras, FOV, resolução 1280×720 e DPR 1: mesa-referencia, exterior-correcao, P01, P03, P13, arvore-canteiro e vegetacao-alta. Chamadas de desenho e triângulos visíveis iguais à referência R21; diferenças médias por canal inferiores a 0,006/255. Capturas examinadas em `avaliacao/capturas/` e comparação em `COMPARACAO.html`.

Regressão Chromium com GPU NVIDIA RTX 4060 Laptop/D3D11: WASD com arrasto e libertação de teclas, plataforma, cinco peças de mobiliário, planta, porta (90 triângulos móveis), luzes, cartazes, tabs/telemóvel, interface móvel 390×844 e controlos com SLAM simulado. Sete grupos passaram, sem erros JavaScript/shader/HTTP. Foram registados 11 cancelamentos net::ERR_ABORTED; a cena carregou e completou todos os testes. O teste físico de GPS/SLAM e desempenho em iPhone/Safari permanece pendente.

## Custos comparáveis

Uma medição local por versão, cache desativada, GPU e câmaras iguais. Até à primeira vista: referência 96 815 067 bytes; integrada 97 153 567 bytes (+338 500, cerca de 0,35%). Tempo local observado 2161 ms / 1757 ms, sem conclusão estatística. P03: 188 chamadas, 1 279 017 triângulos visíveis e estimativa de texturas GPU 166 564 593 bytes em ambas. Intervalo de frames p50 10,0/10,0 ms, p95 10,1/10,2 ms. Dados completos em `avaliacao/costs.json`.

## Publicação e estados

Integração implementada e verificada tecnicamente; publicação autorizada pelo utilizador na raiz https://jf-cem.github.io/tour-virtual/. Aceitação visual final da integração permanece para revisão do utilizador. Histórico das subpastas preservado e raiz anterior recuperável pelo Git. Resultado do deploy e verificação pública em `PUBLICACAO.json`.
