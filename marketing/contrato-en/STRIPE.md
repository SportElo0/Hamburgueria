# Cobrança dos clientes de fora no Stripe

Para os clientes do site em inglês: US$ 40/mês por 12 meses (o site) + US$ 47/mês (hospedagem e suporte).
Primeira cobrança de US$ 87 no aceite; depois todo mês, na mesma data, no cartão.

## 1. Criar a conta (uma vez)

1. Entrar em stripe.com/br e criar a conta com o e-mail da Growlift.
2. Tipo de empresa: o MEI do Lucas (CNPJ 69.611.450/0001-17). O Lucas é o representante e confirma a identidade dele.
3. Conta bancária para receber: a do CNPJ. O Stripe recebe em dólar e manda para a conta em reais.
4. Ligar a verificação em duas etapas no login.
5. Conferir as taxas para cartão internacional e conversão de moeda em stripe.com/br/pricing antes do primeiro cliente, para saber quanto sobra de cada US$ 87.

Nada de senha, chave ou token do Stripe vai para o repositório ou para a conversa.

## 2. Criar os dois produtos (uma vez)

Em Catálogo de produtos, clique em Adicionar produto:

| Produto | Preço | Tipo |
| --- | --- | --- |
| Website (12 installments) | US$ 40,00 | Recorrente, mensal, em USD |
| Hosting, updates and support | US$ 47,00 | Recorrente, mensal, em USD |

## 3. Para cada cliente novo

1. Em Payment Links, criar um link com os dois produtos (quantidade 1 cada). Total: US$ 87/mês.
2. Marcar a coleta do nome da empresa e do endereço de cobrança.
3. Mandar o link junto com a proposta e o contrato. A primeira cobrança é o aceite (cláusula 3.2).
4. Quando o cliente pagar, a assinatura aparece em Assinaturas. Anotar a data: as 12 parcelas do site contam a partir dela.

## 4. Depois de 12 meses: tirar os US$ 40

Na assinatura do cliente, use Atualizar assinatura para remover o produto "Website (12 installments)",
agendando a mudança para depois da 12ª cobrança. Se o painel não mostrar a opção de agendar,
coloque um lembrete no calendário para o dia seguinte à 12ª cobrança e remova na mão.
Daí em diante fica só US$ 47/mês.

## 5. Se o cliente cancelar (cláusula 5.3)

- **Nos primeiros 7 dias:** cancelar a assinatura e reembolsar tudo pelo Stripe (Pagamentos > Reembolsar).
- **Quer ficar com o site:** remover o produto de US$ 47 e deixar o de US$ 40 até completar as 12 parcelas;
  depois cancelar. Mandar os arquivos do site.
- **Não quer ficar com o site:** cancelar a assinatura no fim do período atual, sem reembolso, e tirar o site do ar.
- **Não respondeu qual opção quer:** pausar a cobrança da assinatura (Pausar cobrança) e manter o site no ar.
  Depois de 15 dias, mandar o lembrete por e-mail e WhatsApp com a data-limite (cláusula 5.4).
  Se escolher ficar com o site, voltar a cobrar: as parcelas de US$ 40 desse período entram juntas na próxima data.
  Se não responder em 10 dias depois do lembrete, cancelar e tirar o site do ar.
- **A Growlift encerrar sem motivo (cláusula 5.6):** cancelar a assinatura, não cobrar as parcelas restantes,
  entregar os arquivos em até 10 dias úteis. Se o site ainda não estava no ar, reembolsar tudo.

## 6. Pagamento recusado (cláusula 3.4)

Em Configurações > Cobrança > Assinaturas e e-mails, ligar as novas tentativas automáticas e o e-mail
avisando o cliente do cartão recusado. Se continuar sem pagar 15 dias depois do vencimento, mandar aviso por e-mail; 5 dias depois do aviso,
pode pausar a hospedagem até pagar. Sem juros nem multa.
