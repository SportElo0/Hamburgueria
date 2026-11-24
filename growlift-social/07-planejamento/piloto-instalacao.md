# Piloto do sistema de salão: equipamento e instalação

Guia para colocar o sistema para rodar num restaurante-piloto: pedido pelo QR da mesa, garçom no celular, cozinha e bar separados com impressão, fechamento do dia. Use junto com o **Roteiro de visita** (para a primeira conversa) e o **Termo de piloto** (para combinar por escrito).

**Regra do piloto:** começar simples. O garçom fecha a conta e marca se foi Pix, cartão ou dinheiro, e o fechamento do dia soma tudo. **O Pix pago pelo celular na mesa fica desligado no começo**: o Pix real pelo Mercado Pago ainda não foi testado com dinheiro. Ele entra numa segunda fase, depois de um teste com a conta do próprio restaurante.

## 1. Perguntas ao dono antes de marcar a instalação

A resposta de cada uma muda o plano. Anote as respostas no cadastro da loja.

- **Qual sistema de caixa (PDV) vocês usam? Emitem nota fiscal por ele?** O pedido do nosso sistema não entra no caixa dele. Se ele emite nota pelo PDV, alguém vai lançar duas vezes. Combine antes como fazer (por exemplo, lançar no PDV só a conta fechada). Se for Saipos, a integração está pronta, mas falta a credencial de parceiro (não diga ao dono que "já funciona com o Saipos" enquanto ela não sair).
- **Quantas mesas? Elas têm número?** O QR de cada mesa leva o número dela.
- **O Wi-Fi pega bem no salão, na cozinha e no bar?** Sem internet, o pedido pelo QR não chega. Teste com o celular em cada canto.
- **Tem impressora na cozinha? Qual?** O ticket é feito para impressora térmica de 80 mm.
- **Quem vai usar:** quantos garçons, quem fica na cozinha, quem fica no bar, quem fecha o caixa.
- **O cardápio está atualizado?** Foto ou PDF servem: o painel importa (ver passo 3).
- **Dias e horário de movimento.** O ensaio e a estreia precisam ser em dia calmo.

## 2. Equipamento

| Onde | O quê | Observação |
| --- | --- | --- |
| Cozinha | Computador, notebook ou tablet com tela de pelo menos 10" | Para a impressão sair sozinha, precisa ser **computador ou notebook com Chrome** (ver passo 6). Tablet mostra os pedidos e toca o alerta, mas pede para tocar em imprimir. |
| Cozinha | Impressora térmica 80 mm (USB ou rede) | A que o restaurante já tiver costuma servir. |
| Bar | Tablet ou celular | Se o bar também imprime, o mesmo caso da cozinha. |
| Salão | Celular de cada garçom | O celular dele mesmo serve: só abre o painel no navegador. |
| Mesas | Placa com o QR de cada mesa | Folha A4 pronta para imprimir no painel (passo 5). Plastificar ou usar suporte de acrílico. |
| Caixa | Celular ou computador | Para fechar contas e ver o fechamento do dia. |

Leve uma extensão e um carregador sobrando no dia da instalação.

## 3. Montar a loja no painel (antes de ir)

1. **Painel › Lojas › Nova loja** (ou aprove o cadastro, se o dono se cadastrou sozinho em "Sou restaurante").
2. **Cardápio:** no Painel do dono › **Preços e custos** › **Importar de foto ou PDF**. Confira a prévia (categorias, nomes, preços e as linhas sem preço) antes de importar.
3. **Mesas:** Painel do dono › **Mesas** › quantas mesas o restaurante tem. Taxa de serviço e couvert só se o restaurante já cobra. A taxa aparece como **opcional** para o cliente, e o garçom pode tirar. Couvert e taxa precisam estar no cardápio com o valor, **antes** do cliente pedir. Se o restaurante não costuma cobrar, deixe desligado. Nunca trate a taxa como obrigatória nem deixe o valor aparecer só na conta.
4. **Dados de teste** (Lojas › loja › Pedidos online › Dados de teste) servem para mostrar o painel do dono com movimento (são nomes e números inventados; nunca coloque nome ou telefone de pessoa real em teste). Só funcionam numa loja que **ainda não foi ao ar**: use antes de publicar e **apague antes da estreia**. Para o ensaio da equipe (passo 7), use pedidos de verdade feitos por vocês e cancele no fim.
5. **Pix na mesa: desligado** no piloto.

## 4. Logins da equipe

Em **Lojas › loja › Pedidos online › Acesso da loja**, um login para cada pessoa, com a função certa:

| Função | Entra em | Vê |
| --- | --- | --- |
| Dono | Painel do dono | tudo da loja |
| Cozinha | Tela de pedidos | pedidos, abrir e fechar a loja, esgotados |
| Garçom | Tela do salão | mesas, chamados, lançar pedido, marcar entregue |

A senha aparece **uma vez só**. Entregue na mão para cada pessoa, nunca num grupo. Cada um usa só o seu acesso e não empresta (isso está no Termo de piloto). Quem esquecer pede uma **Nova senha** à Growlift, na mesma tela. Nunca usem a senha pessoal de vocês para criar acesso. Se alguém sair da equipe, remova o login no mesmo dia.

## 5. QR das mesas

Na tela de **Mesas** da loja, imprima a folha A4 com o QR de todas as mesas. Confira, antes de colar, se cada QR abre a mesa certa: leia três ou quatro com o celular. Se mudar o número de mesas depois, imprima de novo.

## 6. Impressão automática na cozinha e no bar

1. No aparelho da cozinha, abra a tela de pedidos e escolha o setor: **Cozinha** (só comida), **Bar** (só bebidas) ou **Tudo**. A escolha fica guardada naquele aparelho.
2. Ligue **Imprimir sozinho**.
3. Para o Chrome não abrir a janela de impressão a cada pedido, ele precisa ser aberto com `--kiosk-printing`:
   - **Windows:** botão direito no atalho do Chrome › Propriedades › no fim do campo "Destino", acrescente um espaço e `--kiosk-printing`. Feche todos os Chrome e abra pelo atalho.
   - **Mac:** feche o Chrome e abra pelo Terminal: `open -a "Google Chrome" --args --kiosk-printing`
4. Defina a térmica como **impressora padrão** do computador, com papel de 80 mm.
5. Faça um pedido de teste e confira se sai um ticket por setor, legível, com as observações (SEM, COM).

## 7. Ensaio (um dia antes, fora do horário)

Com a equipe toda, 30 a 40 minutos:

- [ ] Cliente lê o QR de uma mesa, faz um pedido com observação ("sem cebola").
- [ ] O pedido aparece na cozinha com alerta e imprime. A bebida vai para o bar.
- [ ] Garçom lança um pedido pelo celular para outra mesa.
- [ ] Cliente chama o garçom e pede a conta pelo celular; o garçom vê e marca "Já atendido".
- [ ] Garçom fecha uma conta como Pix, outra como cartão, outra como dinheiro.
- [ ] O fechamento do dia mostra os três valores certos.
- [ ] Item esgotado: a cozinha marca e ele some do cardápio da mesa.
- [ ] Desligar o Wi-Fi por um minuto e ver o que a equipe faz (plano B da tela do salão).
- [ ] Cancelar os pedidos de teste e liberar as mesas.

## 8. Estreia e plantão

- Estrear num dia **calmo** (terça ou quarta), nunca numa sexta.
- Alguém da Growlift **no restaurante** na primeira noite e de **plantão pelo WhatsApp** nos fins de semana do piloto, com nome e horário combinados.
- **Monitor de queda:** crie no UptimeRobot (grátis) um monitor para `https://<endereço do painel>/api/saude`, com alerta no celular de quem estiver de plantão.
- Se travar no meio do serviço: a equipe volta para o papel na hora (combinar isso no ensaio), e a Growlift resolve depois. O restaurante nunca pode parar por causa do sistema.

## 9. O que medir (com autorização para usar os números)

Anote **antes** (uma semana sem o sistema) e **durante** as 4 semanas:

- tempo do cliente sentar até o primeiro pedido;
- ticket médio por mesa;
- quantas mesas giraram no pico;
- quantos pedidos saíram errados;
- o que a equipe achou (uma conversa de 10 minutos por semana).

Números do piloto **só** vão para post, site ou proposta com a autorização **por escrito** do dono (ver o Termo de piloto). Sem ela, não usar nem sem o nome do restaurante.

- A opinião da equipe é de pessoas: não vira depoimento com nome de funcionário sem a autorização dele, por escrito.
- Nunca arredondar ou "melhorar" os números. Se forem usados, sempre como fato daquele restaurante, com o período ("em 4 semanas de novembro de 2026"), e nunca como promessa para outro restaurante.

## 10. Depois das 4 semanas

Conversa com o dono: o que funcionou, o que travou, se ele quer continuar e em qual plano. Atualize este guia com o que aprendeu antes do próximo piloto.
