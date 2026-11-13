-- Proposta online: o vendedor monta, manda o link, o cliente abre e aceita ou recusa.
create table propostas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  oportunidade_id uuid not null,
  numero int not null,
  titulo text not null,
  itens jsonb not null default '[]',
  condicoes text not null default '',
  validade date not null,
  total_centavos bigint not null check (total_centavos >= 0),
  estado text not null default 'rascunho' check (estado in ('rascunho', 'enviada', 'aceita', 'recusada', 'cancelada')),
  -- Só o hash do link fica guardado.
  token_hash text unique,
  enviada_em timestamptz,
  vista_em timestamptz,
  visualizacoes int not null default 0,
  respondida_em timestamptz,
  -- Prova do aceite: nome digitado, quando e um hash do endereço (não o endereço).
  aceite_nome text not null default '',
  aceite_ip_hash text not null default '',
  motivo_recusa text not null default '',
  criado_por text references "user"(id) on delete set null,
  criado_em timestamptz not null default now(),
  unique (empresa_id, numero),
  unique (empresa_id, id),
  foreign key (empresa_id, oportunidade_id) references oportunidades (empresa_id, id) on delete cascade
);
create index on propostas (empresa_id, oportunidade_id);
