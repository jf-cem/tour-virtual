> **v1.4.2:** preparação automática parado, sem marcar segundo ponto. Ver [guião atual](GUIAO-GPS-v1.4.2.md). O texto abaixo descreve a versão anterior.

> **Histórico v1.4:** substituído pelo [guião GPS v1.4.1](GUIAO-GPS-v1.4.1.md). A opção sem GPS abaixo já foi retirada.

# Guião curto — João, iPhone via HTTPS

Usar o Safari no link HTTPS da **tour existente**, quando o integrador publicar v1.4. Localhost do computador não é o URL do telefone. Não é necessário instalar aplicação. Chrome Android é uma segunda ronda.

1. Medir fisicamente uma linha reta de 5–6 m, marcar início/fim e contar passos manualmente. Escolher céu aberto. O limite sem fix é 6 m/12 s; testes maiores precisam de GPS/eixo útil. Não contornar limites por cliques sem saber a posição física.
2. Em Local do teste, escolher GPS + passos ou GPS + atividade, ativar recolha local e iniciar parado. Permitir localização, movimento e orientação separadamente. Confirmar P01 depois de receber GPS recente. Para ensaio sem GPS, escolher explicitamente passos ancorados.
3. No teste remoto com correção GPS, marcar um segundo ponto para o eixo suficientemente longe (o diagnóstico exige >=8 m e uma distância maior que a incerteza), regressar ao início e confirmar P01. Esta preparação não conta como avanço virtual. Se não for possível estabelecer o eixo, usar passos com sentido confirmado dentro dos limites, sem correção GPS remota.
4. Confirmar Avançar/Recuar só quando corresponde à marcha. A confirmação dura 5 s; renovar se necessário e sabido. Não rodar o telefone para declarar uma inversão. Marcar início, paragem, inversão e chegada nos botões do popover.
5. Fazer três repetições: 60 s parado; ida/regresso; marcha lenta; parar/retomar; olhar livre enquanto anda; mover/rodar o telefone parado; andar de lado; sinal fraco; mudar de aplicação e regressar. Após sair da página, reiniciar/reancorar explicitamente. Não testar curvas como se a linha remota as validasse.
6. Exportar JSON **antes de começar outra sessão**. O ficheiro inclui localização e fica local; não há envio automático. Guardar junto a uma nota com distância medida, passos contados, tempo aproximado das marcações, modelo do iPhone/iOS, método e observações de atraso/saltos/suspensões. Se indicar registo truncado, recolher uma sessão mais curta.
7. Para calibração opcional, usar distância medida ÷ passos detetados em marcha regular. O detetor omite alguns ciclos iniciais enquanto confirma cadência; repetir um trecho de calibração mais longo com referência física/GPS e verificar esse viés antes de aplicar. Não calibrar com um pequeno delta GPS.
8. Importar o JSON em ensaio.html ou usar `node tests/replay.cjs <sessao.json>`. Comparar GPS legado/fusão nos mesmos sinais com a nota física: erro final, deriva parado, passos falsos/em falta, atraso de início/paragem/inversão, correções e suspensões. Separar sessões usadas para ajustar parâmetros das sessões reservadas para validar.

A primeira entrega permite medir e melhorar o motor. Ainda não demonstra que GPS + sensores é mais preciso no teu iPhone; não há promessa de precisão de 1 m.
