# Roteiro de demonstração (cerca de 8 minutos)

Tudo aqui é fictício: a Lumivale e a Sol do Vale não existem, e nenhum número é resultado de cliente. Diga isso no começo. Na tela aparece “Simulação — nenhuma mensagem externa enviada”.

Antes: `npm run reiniciar-banco` e `npm run dev`. Senha de todos: `demonstracao-2026`.

1. **O pedido chega.** No celular, abra `/s/lumivale-demo`, vá em “Pedir orçamento” e envie com um telefone fictício (ex.: 11 90000-0200). Mostre que o formulário aponta o que falta e só confirma depois de salvar.
2. **A dúvida na hora.** No chat que aparece, pergunte “Funciona em dia nublado?” (resposta do conteúdo aprovado) e depois “Quanto custa?” (ela não inventa preço). Peça “atendente”: ela avisa a equipe e para.
3. **O vendedor vê.** Entre como `vendas@lumivale.demo`. Visão geral: aviso do pedido novo. Atendimento: a conversa está “Aguardando humano”, com o resumo. Responda: a conversa passa a “Humano atendendo” e a assistente não volta sozinha.
4. **A negociação anda.** Abra a oportunidade, mova para “Proposta enviada” com um valor. Mostre o histórico e a tarefa de retorno criada sozinha em Tarefas.
5. **As automações.** Como `admin@lumivale.demo`, abra Automações: a confirmação do pedido que você acabou de enviar aparece como feita (simulada), e os retornos da proposta aparecem agendados. Mensagens automáticas só saem das 8h às 20h; fora disso ficam agendadas.
6. **Automações próprias.** Em Automações › Seus fluxos, mostre “Proposta sem resposta” (ligado): espera 2 dias, para se o cliente respondeu, manda a mensagem, espera 3 dias e cria a tarefa de ligar. Crie um fluxo novo a partir de um modelo, mude um passo, ligue e veja a execução no histórico quando mover uma oportunidade para “Proposta enviada”.
7. **O dono acompanha.** Entre como `admin@lumivale.demo`: quadro por etapas, números do período (contados, não estimados), Conhecimento (o que a assistente pode dizer) e Configurações (regras, equipe, WhatsApp oficial ainda por ligar).
8. **Cada cliente no seu canto.** Entre como `admin@soldovale.demo`: nada da Lumivale aparece. Como `equipe@growlift.demo`: só o cadastro e a saúde das integrações; para ver dados é preciso entrar com motivo, e isso fica registrado.

O que **não** dizer: que gera clientes, que aumenta vendas em X%, que o WhatsApp já está ligado ou que a IA já é o modelo real (na demonstração é o simulador).

# Os 5 serviços para uma pousada (cerca de 5 minutos, no celular)

Abra `/demonstracao` no ambiente de demonstração. É uma página guiada com a Pousada Maré Calma, que não existe: cada serviço tem um botão que mostra a cena acontecendo. Nada é enviado e nada fica salvo. Diga isso no começo.

1. **Site com IA.** Aperte “Ver a conversa”: às 23h o hóspede pergunta, a Ana responde só com o que a pousada informou, não dá preço e passa o pedido para a recepção. Se o dono quiser testar de verdade, abra o site de exemplo (`/s/pousada-demo`).
2. **Google.** Marque os itens um por um (ou “Deixar tudo pronto”) e mostre o perfil e a busca se completando. Diga a frase do rodapé: ninguém garante 1º lugar.
3. **Ligações.** Escolha o horário, aperte “Simular a ligação” e deixe o dono escolher “Apertar 1” ou “Não apertar”. Sem o 1, nenhuma mensagem sai: fica só a tarefa de retornar.
4. **Retomada.** “Ver o pedido andar”: a recepção envia os valores pelo painel com um modelo aprovado (chega mesmo que a Juliana só tenha pedido pelo site), o cartão anda no quadro, a retomada sai em 1 dia e para quando a Juliana responde; no fim, o sinal de R$ 800 aparece como recebido e o resto em aberto. Troque para “Não responde mais” para mostrar a tarefa de 3 dias. No painel de verdade (`admin@marecalma.demo`), abra o pedido da Renata e use “Enviar pelo WhatsApp”; depois registre um recebimento e mostre “Vendas pagas”.
5. **Avaliações.** “Marcar estadia como concluída”, abra o convite e escolha uma nota baixa: o botão de avaliar no Google continua lá. Todo hóspede recebe o mesmo convite.
6. **Resumo.** Mostra o que aconteceu nesta simulação. Feche com “o que a gente não promete”.

Para mostrar o painel da pousada depois: entre como `admin@marecalma.demo` (senha `demonstracao-2026`).

O que não dizer: número de reservas, faturamento ou posição no Google; que o WhatsApp ou o telefone já estão ligados na pousada dele; que os valores da cena são preços de verdade.
