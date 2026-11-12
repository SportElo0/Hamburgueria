-- Ligações não atendidas: o serviço de telefonia avisa, o sistema responde pelo WhatsApp e cria a tarefa de retornar.
alter table integracoes drop constraint if exists integracoes_tipo_check;
alter table integracoes add constraint integracoes_tipo_check check (tipo in ('whatsapp', 'ia', 'telefonia'));
-- A chave do serviço de telefonia identifica uma única empresa (guardada só como hash).
create unique index integracoes_chave_telefonia on integracoes ((config ->> 'chave_hash')) where tipo = 'telefonia';

create table ligacoes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  -- Identificador da chamada no serviço de telefonia: o mesmo aviso repetido não vira duas mensagens.
  id_externo text not null,
  telefone text not null,
  contato_id uuid not null,
  oportunidade_id uuid not null,
  recebida_em timestamptz not null,
  resultado text not null default '',
  simulada boolean not null default false,
  criado_em timestamptz not null default now(),
  unique (empresa_id, id_externo),
  foreign key (empresa_id, contato_id) references contatos (empresa_id, id) on delete cascade,
  foreign key (empresa_id, oportunidade_id) references oportunidades (empresa_id, id) on delete cascade
);
create index on ligacoes (empresa_id, contato_id, recebida_em);

-- Empresas de demonstração no simulador: modelo fictício para a resposta da ligação (como os outros modelos da demonstração).
update integracoes i set config = i.config || '{"modelo_ligacao": "demo_ligacao"}'::jsonb
from empresas e where e.id = i.empresa_id and e.demonstracao and i.tipo = 'whatsapp' and i.config ->> 'modo' = 'simulador' and coalesce(i.config ->> 'modelo_ligacao', '') = '';
