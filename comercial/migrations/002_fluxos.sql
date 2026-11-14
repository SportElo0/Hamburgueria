-- Construtor de automações: fluxos que o administrador monta (gatilho + passos) e suas execuções.
create table fluxos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  nome text not null,
  ativo boolean not null default false,
  gatilho jsonb not null,
  passos jsonb not null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (empresa_id, id)
);
create index on fluxos (empresa_id, ativo);

-- Cada execução guarda uma cópia dos passos do momento em que começou: editar o fluxo não muda o que já está rodando.
create table fluxo_execucoes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null,
  fluxo_id uuid not null,
  oportunidade_id uuid not null,
  contato_id uuid not null,
  estado text not null default 'ativa' check (estado in ('ativa', 'concluida', 'parada', 'falhou')),
  passos jsonb not null,
  etapa_inicial text not null,
  log jsonb not null default '[]',
  criado_em timestamptz not null default now(),
  concluido_em timestamptz,
  foreign key (empresa_id, fluxo_id) references fluxos (empresa_id, id) on delete cascade,
  foreign key (empresa_id, oportunidade_id) references oportunidades (empresa_id, id) on delete cascade
);
create index on fluxo_execucoes (empresa_id, fluxo_id, criado_em desc);
create index on fluxo_execucoes (empresa_id, oportunidade_id) where estado = 'ativa';
