-- Resumo diário dos e-mails da Growlift (caixa de entrada do Gmail da equipe): só a classificação e o assunto,
-- nunca o corpo do e-mail. Apagado depois de 90 dias pela limpeza diária.
create table resumos_email (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  criado_em timestamptz not null default now(),
  desde timestamptz not null,
  ate timestamptz not null,
  total int not null default 0,
  importantes jsonb not null default '[]',
  outros jsonb not null default '{}',
  erro text
);
create index on resumos_email (empresa_id, criado_em desc);
