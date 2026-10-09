# Teste real do utilizador — v1.4.3, 9 de outubro de 2026

João testou GPS + atividade e GPS + passos no iPhone.

- GPS + atividade foi de longe o melhor modo. A fluidez e a taxa de atualização foram apreciadas e representam uma melhoria significativa face ao GPS anterior.
- GPS + passos teve deteção de passos muito má nesta sessão. Não promover esse modo como base do movimento.
- Direção pretendida: continuar a evoluir GPS + atividade.
- Limitação atual sentida: movimento apenas em linha reta, para a frente e para trás. O percurso pedonal real tem curvas e deve permitir acompanhar mudanças de direção para a esquerda e para a direita.
- Explorar a geometria conhecida do percurso, incluindo as curvas, para melhorar a estimativa. Avaliar Sensor Zoo como componente comparável à solução atual, sem pressupor superioridade.

Este registo é qualitativo, com base no relato do utilizador; não contém uma gravação dos sensores ou medições de erro. Não altera o modo predefinido nem publica uma nova versão.

## Próxima avaliação proposta

Representar o trajeto pedonal real por uma linha geográfica com pontos nas curvas, distinta das posições dos panoramas. Ligar a posição ao longo dessa linha à navegação visual. Preservar a preparação simples e a independência entre olhar e marcha.

Comparar o filtro atual com o Route Position Filter do Sensor Zoo sobre o mesmo percurso e as mesmas leituras: curvas, paragens, inversões, desvios, segmentos próximos e ruído GPS. Um teste remoto com curvas necessita de um percurso de teste conhecido; um único ponto de início não determina a geometria desse percurso.

Referência verificada: https://github.com/tszheichoi/sensor-zoo/blob/main/README.md
