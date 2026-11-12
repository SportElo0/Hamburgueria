-- Avisos no celular (app instalado pelo painel): cada aparelho que ligou os avisos.
create table inscricoes_push (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  user_id text not null references "user"(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  aparelho text not null default '',
  falhas int not null default 0,
  criado_em timestamptz not null default now(),
  ultimo_envio_em timestamptz
);
create index on inscricoes_push (empresa_id, user_id);

-- Quando o aviso de cada notificação saiu para os celulares (null = ainda não).
alter table notificacoes add column push_em timestamptz;
update notificacoes set push_em = now() where push_em is null;
create index notificacoes_push_pendente on notificacoes (criado_em) where push_em is null;
