-- O que cada pessoa quer receber no celular e no WhatsApp (no painel, todo aviso continua aparecendo).
create table preferencias_avisos (
  empresa_id uuid not null references empresas(id) on delete cascade,
  user_id text not null references "user"(id) on delete cascade,
  grupos_desligados text[] not null default '{}',
  -- Horário de silêncio na hora local da empresa (das X às Y, pode passar da meia-noite). Null = sem silêncio.
  silencio_inicio int check (silencio_inicio between 0 and 23),
  silencio_fim int check (silencio_fim between 0 and 23),
  atualizado_em timestamptz not null default now(),
  primary key (empresa_id, user_id)
);

-- Avisos criados antes de existir o tipo: classifica pelo título (os textos fixos do sistema).
update notificacoes set tipo = case
  when titulo like 'Novo pedido:%' then 'tarefa:atender_pedido'
  when titulo like 'Pedido sem atendimento:%' then 'sla'
  when titulo like 'Retornar a ligação:%' then 'tarefa:retornar_ligacao'
  when titulo like 'Tarefa vencida há mais de%' then 'tarefa_vencida'
  when titulo in ('Nova mensagem do cliente', 'Nova mensagem no chat do site') then 'conversa'
  when titulo = 'Uma oportunidade foi atribuída a você' then 'atribuicao'
  when titulo like 'Visita marcada para você:%' then 'agenda'
  when titulo like 'O cliente abriu a proposta%' then 'proposta'
  when titulo in ('Resumo do dia da empresa', 'Seu resumo do dia') then 'resumo'
  when titulo like 'Cliente pediu para falar%' or titulo in ('Cliente quer negociar', 'Cliente com reclamação', 'Nova mensagem de cliente (assistente desligada)')
    or titulo like 'Pergunta sem resposta%' or titulo like 'A assistente não entendeu%' or titulo like 'Assistente indisponível%'
    or titulo like 'Limite mensal da assistente%' or titulo like 'Cliente enviou mídia%' then 'tarefa:assumir_conversa'
  else tipo end
where tipo = 'geral';
