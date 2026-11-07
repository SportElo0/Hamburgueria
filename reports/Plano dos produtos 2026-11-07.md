# Plano dos produtos (07/11/2026)

O Repasse Certo saiu: a pesquisa de viabilidade (`Repasse Certo viabilidade 2026-11-07.md`) achou concorrentes e
pouco dinheiro provável para recuperar. Ficam dois produtos. Os preços são hipóteses
(`Preços dos produtos 2026-11-07.md`) e passam pelo `revisor-legal` antes de anunciar.

## Produto 1: Restaurante (quase tudo pronto)

**Já existe no painel:**
- **Pedidos e pagamento:** pedido próprio sem comissão (Pix, entrega, retirada, cupom), tela da loja e relatório.
- **Salão:** mesa por QR, fila, reservas com sinal e pagar na mesa.
- **3D:** prato em 3D e realidade aumentada.
- **Clientes:** Clube, 12 campanhas, pedido de avaliação e o envio para o Saipos.
- **Sites modelo:** Downtown e El Patron.

**Falta:**
1. **Pacotes:** montar Essencial e Completo no site da Growlift e na apresentação, no lugar de Start, Grow e
   Scale. Mesa 3D avulso para quem já tem sistema.
2. **3D sem gastar crédito:** testar o escaneamento com o iPhone (app Object Capture) numa sobremesa de verdade.
   Se ficar bom, vira o jeito padrão; o Higgsfield fica só para emergência.
3. **Piloto:** The Burguest com 2 ou 3 sobremesas em 3D e o QR "hora da sobremesa", medindo 4 semanas
   (plano em `Produto Growlift decisão 2026-11-07.md`).
4. **Atendente no WhatsApp:** entra no Completo quando o Produto 2 estiver pronto (é a mesma peça).

## Produto 2: Serviços locais (construir)

Primeiro nicho: ar-condicionado (instalação e manutenção). Depois: dedetização, eletricista, desentupidora,
limpeza de estofado.

### Etapa 1: site modelo de serviços

- **O que o site tem:** serviços com "a partir de" (só preço que o cliente confirmar), área atendida, fotos
  reais do cliente, avaliações do Google, perguntas frequentes.
- **Contato:** formulário de orçamento curto (serviço, bairro, melhor horário) e botão de WhatsApp com a mensagem
  já escrita.
- **Modelo:** um modelo só que troca cor, logo, serviços e cidade, para fazer cada cliente em pouco tempo.
- **Exemplo:** um "Projeto conceito" fictício para o portfólio.

### Etapa 2: atendente de IA (primeiro só texto)

- **Onde roda:** no WhatsApp oficial do cliente (API da Meta). O cliente paga a Meta; a IA (Claude, que o painel
  já usa em `src/lib/vendas/ia.ts`) entra no custo da Growlift.
- **O que ela faz:**
  - responde dúvidas só com o que o cliente cadastrou (serviços, preços, área, horário);
  - monta o orçamento;
  - oferece horários;
  - passa para a equipe quando não sabe ou quando o cliente pede uma pessoa (avisa o dono no WhatsApp dele).
- **No painel:** conversas, orçamentos, agenda e o cadastro das informações do cliente.
- **Limites:** segue a regra da atendente no `CLAUDE.md`. Dentro das 24 h depois que o cliente chamou, a resposta
  não custa nada na Meta.
- **Antes de ligar:**
  - `revisor-seguranca`, porque guarda conversa e telefone de cliente final;
  - limite mensal de gasto com IA por cliente.

### Etapa 3: áudio e pós-serviço

- **Áudio:** entende o áudio que o cliente manda e responde em áudio com voz brasileira (ouvir a amostra antes;
  regra do `CLAUDE.md`).
- **Pós-serviço:** mensagem de pedido de avaliação no Google para todos, sem filtrar quem gostou (mensagem de
  serviço da Meta, cerca de R$ 0,04 a R$ 0,08 cada, paga pelo cliente).
- **Lembrete de manutenção:** por exemplo, a limpeza do ar a cada 6 meses, só para quem aceitou receber.

## O que é preciso de vocês

- **Cliente piloto:**
  - um de ar-condicionado (ou outro serviço) que aceite testar por um preço de lançamento;
  - os dados dele: serviços, preços, área e horários.
- **Meta:**
  - conta da Meta Business do cliente e um número para o WhatsApp oficial;
  - a Growlift como parceira na conta dele, com a chave nas variáveis da Vercel, nunca no repositório;
  - conferir na hora se o número pode continuar no app do WhatsApp Business ao mesmo tempo.
- **Claude:** chave da API (`ANTHROPIC_API_KEY`) na Vercel, se ainda não estiver, e o teto mensal de gasto que
  vocês aceitam.
- **Restaurante:** a sobremesa e um horário no The Burguest para o teste de escaneamento.
