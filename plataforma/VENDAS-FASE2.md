# Growlift Sales Agent: plano da fase 2 (e-mail de verdade)

**Situação: só plano. Envio real NÃO autorizado.** Começa depois que a fase 1 estiver publicada e validada.

Objetivo: o agente aborda empresas por e-mail a partir de `contato@growlift.com.br` (Umbler), lê as respostas, aponta os
leads quentes e entrega ao WhatsApp comercial, sem arriscar a reputação do domínio nem a caixa de contato.

## 1. Como fica

```
Rascunho aprovado (fase 1)
   │  pessoa clica "Enviar" (ou agenda para o horário comercial)
   ▼
[Envio]  SMTP Umbler, porta 587 + STARTTLS, usuário contato@growlift.com.br
   │  confere ANTES de cada envio: lista de bloqueio, etapa, teto do dia (5), janela (dias úteis, 9h-17h),
   │  interruptor geral VENDAS_ENVIO=ligado
   │  cabeçalhos: Message-ID próprio, List-Unsubscribe (link + mailto), List-Unsubscribe-Post (um clique)
   │  rodapé: Equipe Comercial | Growlift, CNPJ, endereço, fonte do e-mail, descadastro, política
   │  cópia na pasta "Enviados" da Umbler (IMAP APPEND), para a equipe ver no webmail
   ▼
[Leitura]  cron-job.org chama /api/vendas/tick a cada 10 min (com CRON_SECRET, igual ao Instagram)
   │  IMAP Umbler, porta 993 (TLS), lê só mensagens novas (por UID) e SEM marcar como lida (BODY.PEEK)
   │  só trata o que é resposta nossa: In-Reply-To / References com o nosso Message-ID, ou remetente = contato do CRM
   │  todo o resto da caixa (clientes, privacidade, fornecedores) é ignorado e continua como está
   ├─ devolvido (MAILER-DAEMON, relatório de entrega) → marca "devolvido", tira da fila, conta para a pausa automática
   ├─ resposta automática (Auto-Submitted, "ausência") → só registra, não muda etapa
   ├─ "sair", "descadastre", Procon, advogado... → bloqueio na hora, por regra fixa (já existe na fase 1)
   └─ resposta de verdade → etapa "Respondeu" + sugestão da IA (quente/morno/frio/fora do perfil) para uma pessoa confirmar
   ▼
[Lead quente]  aparece em "Falar hoje" (já existe) + aviso por e-mail interno para a equipe
   └─ WhatsApp: o cliente abre a conversa pelo link do nosso número, ou a equipe chama se ele pediu por escrito (já existe)
```

## 2. Configuração (vocês, sem passar senha pelo chat)

| Onde | O que | Observação |
| --- | --- | --- |
| Umbler | Confirmar a caixa `contato@growlift.com.br`, o plano, e os endereços de SMTP e IMAP | Normalmente `smtp.umbler.com:587` e `imap.umbler.com:993`; **conferir no painel da Umbler** |
| Umbler | Limite de envio por hora/dia do plano | O nosso teto (5/dia) precisa ficar bem abaixo |
| Umbler | Senha forte só para esta caixa (não a senha pessoal de ninguém) | Se a Umbler tiver "senha de aplicativo", usar ela |
| DNS (Registro.br/Umbler) | **SPF** com o `include` da Umbler; **DKIM** ligado no painel da Umbler; **DMARC** começando em `p=none` com relatório | Eu confiro com vocês depois (a rede deste ambiente não consulta DNS) |
| Vercel (Production, Sensitive) | `UMBLER_SMTP_HOST`, `UMBLER_SMTP_USER`, `UMBLER_SMTP_PASS`, `UMBLER_IMAP_HOST`, `VENDAS_ENVIO` (desligado até o piloto) | Nunca em Preview/Development |
| cron-job.org | Despertador de 10 min para `/api/vendas/tick` | Igual ao do Instagram, com o mesmo `CRON_SECRET` |

## 3. Proteção do domínio (reputação)

- **Volume baixíssimo:** no máximo 5 por dia (contados no servidor, não no botão), só dias úteis, horário comercial,
  intervalo de alguns minutos entre um e outro.
- **Pausa automática:** se 2 e-mails voltarem em 7 dias, ou qualquer resposta citar spam/denúncia, o envio para sozinho
  e o painel avisa. Só uma pessoa religa.
- **Texto limpo:** sem link no corpo (só no rodapé), sem imagem, sem anexo, assunto sem palavras de promoção.
- **Caixa compartilhada:** como é o `contato@`, um problema de reputação afeta também os e-mails com clientes.
  Por isso o volume é mínimo e a pausa é automática. Se crescer, o caminho é um subdomínio só para prospecção
  (ex.: `comercial.growlift.com.br`).
- **Primeiro teste:** os 5 primeiros envios vão só para endereços da equipe (Gmail, Outlook) para ver se caem na caixa
  de entrada e se SPF/DKIM/DMARC passam.

## 4. Segurança

- Senhas só na Vercel (Production). O código nunca imprime nem grava a senha.
- O leitor da caixa não apaga, não move e não marca como lida nenhuma mensagem; guarda só o trecho da resposta
  (até 2.000 caracteres) no contato.
- Texto recebido é **dado, nunca instrução**: vai para a IA só na classificação, com saída em formato fixo, e nunca no
  prompt que escreve e-mails. A classificação é sugestão; uma pessoa confirma.
- Prévias não enviam e não leem (a trava de ambiente já cobre; o envio terá a sua própria trava também).
- Revisão de segurança e legal antes de ligar.

## 5. Requisitos legais (da revisão de 02/11; bloqueiam o envio)

1. Política de privacidade com a seção "E-mails comerciais para empresas": dados tratados, fonte (canal público do
   negócio, nunca o Google), finalidade (no máximo 1 e-mail e 1 acompanhamento), base legal (legítimo interesse),
   como se opor, lista de bloqueio com código irreversível, prazo de guarda, operadores (Umbler, Vercel, Supabase e,
   se ligada, Anthropic), transferência internacional e encarregado (sugestão: Lucas, pelo `contato@`).
2. Documento de legítimo interesse (1 página) e registro das operações.
3. Prazo de guarda: contato sem resposta apagado em até 12 meses; pedido de apagamento atendido em até 15 dias.
4. Atender "sair" em até 2 dias úteis (o painel faz na hora quando lê a resposta).
5. Consulta curta a um advogado de LGPD antes do piloto.

## 6. Custos estimados

| Item | Custo |
| --- | --- |
| Caixa na Umbler | O que vocês já pagam (conferir se o plano inclui SMTP/IMAP sem custo extra) |
| Bibliotecas (envio, leitura e leitura de e-mail) | Grátis (código aberto) |
| cron-job.org | Grátis |
| IA econômica (`claude-haiku-5-5`) para rascunho e classificação | Menos de US$ 1 por mês no volume do piloto (só com a chave criada por vocês e limite mensal) |
| Vercel | Igual a hoje. Lembrete: o plano Hobby é para uso não comercial; o Pro custa US$ 20/mês |

## 7. Ordem de trabalho (quando autorizarem)

1. **2a – Envio de teste:** envio pelo SMTP com todas as travas, só para endereços da equipe; conferir cabeçalhos,
   SPF/DKIM/DMARC e caixa de entrada.
2. **2b – Leitura:** tick de 10 min, ligação resposta → contato, devolvidos, automáticas, "sair".
3. **2c – Qualificação e aviso:** sugestão da IA + confirmação + aviso interno do lead quente.
4. **2d – Piloto:** 10 empresas reais, 5 por dia, 2 semanas, com relatório (respostas, quentes, descadastros, devolvidos).
   Só depois disso pensar em aumentar.

Cada etapa com testes automáticos sem rede real (servidores de e-mail simulados), revisões e aprovação de vocês antes de
publicar.
