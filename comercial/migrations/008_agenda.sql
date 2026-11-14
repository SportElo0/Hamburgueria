-- Agenda de visitas: marcadas pela equipe ou pela assistente, com lembrete pelo WhatsApp para quem aceitou.
create table visitas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  oportunidade_id uuid not null,
  contato_id uuid not null,
  responsavel_id text references "user"(id) on delete set null,
  inicio timestamptz not null,
  fim timestamptz not null,
  estado text not null default 'marcada' check (estado in ('marcada', 'confirmada', 'realizada', 'faltou', 'cancelada')),
  endereco text not null default '',
  observacao text not null default '',
  -- Quem marcou: uma pessoa da equipe ou a assistente.
  origem text not null check (origem in ('usuario', 'ia')),
  criado_por text references "user"(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  check (fim > inicio),
  unique (empresa_id, id),
  foreign key (empresa_id, oportunidade_id) references oportunidades (empresa_id, id) on delete cascade,
  foreign key (empresa_id, contato_id) references contatos (empresa_id, id) on delete cascade
);
create index on visitas (empresa_id, inicio);
create index on visitas (empresa_id, oportunidade_id);

-- Endereço secreto de cada pessoa para ver as visitas no Google Agenda (assinatura de calendário). Só o hash fica guardado.
create table agenda_feeds (
  user_id text primary key references "user"(id) on delete cascade,
  empresa_id uuid not null references empresas(id) on delete cascade,
  token_hash text not null unique,
  criado_em timestamptz not null default now()
);

-- Demonstração: agenda ligada e modelo fictício do lembrete.
update empresas set config = jsonb_set(config, '{agenda}', coalesce(config -> 'agenda', '{}'::jsonb) || '{"ativa": true}'::jsonb) where demonstracao;
update integracoes i set config = i.config || '{"modelo_lembrete_visita": "demo_lembrete_visita"}'::jsonb
from empresas e where e.id = i.empresa_id and e.demonstracao and i.tipo = 'whatsapp' and i.config ->> 'modo' = 'simulador' and coalesce(i.config ->> 'modelo_lembrete_visita', '') = '';
