# Teste de fluidez — v1.4.2

Abrir https://jf-cem.github.io/tour-virtual/?v=1.4.2 no Safari, ao ar livre.

1. Em Local do teste, escolher Teste onde estou e GPS + passos (ou GPS + atividade para comparar). Fechar o menu.
2. Iniciar caminhada, permitir os sensores e ficar parado aproximadamente 10 segundos. São as mesmas cinco leituras estáveis da preparação GPS original; se o sinal demorar, a preparação pode durar mais. Existe fallback manual após 30 segundos com leitura aceitável, como no GPS anterior.
3. Quando aparecer Pronto, caminhar em frente, em linha reta. Não marcar segundo ponto, confirmar P01 ou confirmar Avançar. O modo de passos assume inicialmente avanço.
4. Parar e regressar pelo mesmo caminho. O GPS ajuda a determinar o sentido; movimentos laterais também aumentam afastamento no teste remoto radial, por isso evitar desvios/curvas. A preparação simples não mede eixo físico nem melhora a precisão GPS.
5. Comparar atraso ao começar/parar/regressar, passos detetados, distância física/virtual e avanço enquanto parado. GPS + atividade usa atividade para limitar deriva, mas posição continua a depender das leituras de localização. GPS + passos prevê deslocamento entre leituras, ainda sujeito à qualidade da deteção e da estimativa do passo.

Registos/calibração e confirmação de sentido em caso de ambiguidade ficam em Registos e ajustes do teste, opcionais. Não é necessário alterar 0,65 para este primeiro ensaio.

Mudanças técnicas: preparação automática partilhada com TourGpsStart; localização remota radial em torno da origem mediana; arranque forward explícito; previsão/correção processada a cada 50 ms; correção de GPS + atividade limitada a 2 m/s (antes 0,6); correção GPS + passos mantém 0,6 m/s mas ignora diferenças dentro da margem operacional da leitura, evitando desfazer passos por ruído. Evidência de direção acumula deslocamentos pequenos; quando sensores indicam paragem, oscilações de posição não são por si só prova de retoma.

O navegador continua a decidir frequência de Geolocation: processar a cada 50 ms não cria leituras GPS a 20 Hz. Detetor exige cadência e pode omitir passos iniciais. Inversões pequenas face à incerteza GPS podem continuar ambíguas; não são garantidas instantaneamente. Permanecem orçamentos de perda de GPS, incerteza, limites e reancoragem perante discrepância grande. Movimento/olhar livres e percursos da planta preservados. Sem alteração dos assets gráficos.

A apresentação dos passos usa velocidade estimada da cadência, com margem para recuperar atraso e limite de 4 m/s. Nunca extrapola para além da posição estimada; para quando a atividade indica paragem ou a previsão é suspensa. Esta interpolação visual pode reduzir a sensação de avanços rápidos separados por pausas; precisa de avaliação real.

Os testes automatizados validam preparação e lógica, incluindo ±3 m simulados. Não constituem validação física ou promessa de precisão/fluidez no iPhone.
