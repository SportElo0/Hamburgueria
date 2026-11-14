-- Growlift Comercial: esquema inicial.
-- As tabelas de login ("user", session, account, verification) são criadas pelo Better Auth antes deste arquivo.
-- Toda tabela de negócio tem empresa_id; as chaves estrangeiras compostas (empresa_id, id) impedem,
-- no próprio banco, que um registro aponte para dados de outra empresa.

create table empresas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text not null unique check (slug ~ '^[a-z0-9-]{3,40}$'),
  segmento text not null default 'energia-solar',
  chave_publica text not null unique,
  demonstracao boolean not null default false,
  ativa boolean not null default true,
  config jsonb not null default '{}',
  responsavel_padrao text references "user"(id) on delete set null,
  criada_em timestamptz not null default now()
);

create table admins_plataforma (
  user_id text primary key references "user"(id) on delete cascade
);

-- Um login pertence a uma única empresa.
create table membros (
  user_id text primary key references "user"(id) on delete cascade,
  empresa_id uuid not null references empresas(id) on delete cascade,
  papel text not null check (papel in ('admin', 'vendedor')),
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);
create index on membros (empresa_id);

create table convites (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  email text not null,
  papel text not null check (papel in ('admin', 'vendedor')),
  token_hash text not null unique,
  expira_em timestamptz not null,
  aceito_em timestamptz,
  criado_por text references "user"(id) on delete set null,
  criado_em timestamptz not null default now()
);

-- Acesso de um administrador Growlift aos dados de uma empresa: sempre explícito, com motivo e prazo.
create table acessos_admin (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references "user"(id) on delete cascade,
  empresa_id uuid not null references empresas(id) on delete cascade,
  motivo text not null check (length(motivo) >= 5),
  inicio timestamptz not null default now(),
  fim timestamptz not null
);
create index on acessos_admin (user_id, fim);

create table contatos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  nome text not null default '',
  telefone text not null,
  cidade text not null default '',
  preferencia_contato text not null default '',
  dados jsonb not null default '{}',
  nao_contatar_em timestamptz,
  criado_em timestamptz not null default now(),
  unique (empresa_id, telefone),
  unique (empresa_id, id)
);

create table consentimentos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null,
  contato_id uuid not null,
  canal text not null,
  texto text not null,
  origem text not null,
  criado_em timestamptz not null default now(),
  revogado_em timestamptz,
  foreign key (empresa_id, contato_id) references contatos (empresa_id, id) on delete cascade
);
create index on consentimentos (empresa_id, contato_id);

create table oportunidades (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  contato_id uuid not null,
  necessidade text not null default '',
  origem text not null default 'desconhecida',
  campanha jsonb not null default '{}',
  etapa text not null default 'novo' check (etapa in ('novo', 'atendimento', 'qualificado', 'proposta', 'negociacao', 'ganho', 'perdido')),
  responsavel_id text references "user"(id) on delete set null,
  proxima_acao text not null default '',
  proxima_acao_em timestamptz,
  valor_proposta_centavos bigint check (valor_proposta_centavos is null or valor_proposta_centavos >= 0),
  motivo_perda text not null default '',
  interesse_visita text not null default '',
  entrada_em timestamptz not null default now(),
  ultima_interacao_em timestamptz not null default now(),
  confirmacao_auto_em timestamptz,
  primeiro_humano_em timestamptz,
  proposta_em timestamptz,
  fechada_em timestamptz,
  servico_concluido_em timestamptz,
  unique (empresa_id, id),
  foreign key (empresa_id, contato_id) references contatos (empresa_id, id) on delete cascade
);
create index on oportunidades (empresa_id, etapa);
create index on oportunidades (empresa_id, contato_id);

-- Cada envio do formulário; a chave de idempotência impede que o mesmo envio abra duas oportunidades.
create table pedidos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null,
  chave_idempotencia text not null,
  oportunidade_id uuid not null,
  origem text not null,
  criado_em timestamptz not null default now(),
  unique (empresa_id, chave_idempotencia),
  foreign key (empresa_id, oportunidade_id) references oportunidades (empresa_id, id) on delete cascade
);

create table conversas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  contato_id uuid,
  oportunidade_id uuid,
  canal text not null check (canal in ('site', 'whatsapp')),
  estado text not null default 'ia_ativa' check (estado in ('ia_ativa', 'aguardando_humano', 'humano_atendendo', 'encerrada')),
  assumida_por text references "user"(id) on delete set null,
  assumida_em timestamptz,
  ultima_entrada_em timestamptz,
  falhas_ia int not null default 0,
  resumo text not null default '',
  dados jsonb not null default '{}',
  token_hash text unique,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (empresa_id, id),
  foreign key (empresa_id, contato_id) references contatos (empresa_id, id) on delete cascade,
  foreign key (empresa_id, oportunidade_id) references oportunidades (empresa_id, id) on delete set null (oportunidade_id)
);
create unique index conversas_whatsapp_unica on conversas (empresa_id, contato_id) where canal = 'whatsapp';
create index on conversas (empresa_id, atualizado_em desc);

create table mensagens (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null,
  conversa_id uuid not null,
  direcao text not null check (direcao in ('entrada', 'saida')),
  autor text not null check (autor in ('contato', 'ia', 'humano', 'sistema')),
  autor_id text references "user"(id) on delete set null,
  corpo text not null,
  -- na_fila → enviando → enviada → entregue → lida; falhou; incerta (sem resposta do provedor); cancelada
  estado text not null check (estado in ('recebida', 'na_fila', 'enviando', 'enviada', 'entregue', 'lida', 'falhou', 'incerta', 'cancelada')),
  automatica boolean not null default false,
  simulada boolean not null default false,
  ia_simulada boolean not null default false,
  modelo_mensagem text,
  id_provedor text,
  erro text,
  versao_conhecimento int,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (empresa_id, id_provedor),
  unique (empresa_id, id),
  foreign key (empresa_id, conversa_id) references conversas (empresa_id, id) on delete cascade
);
create index on mensagens (empresa_id, conversa_id, criado_em);

create table eventos (
  id bigserial primary key,
  empresa_id uuid not null references empresas(id) on delete cascade,
  oportunidade_id uuid,
  contato_id uuid,
  conversa_id uuid,
  ator_tipo text not null check (ator_tipo in ('usuario', 'admin_growlift', 'ia', 'sistema', 'visitante')),
  ator_id text,
  tipo text not null,
  dados jsonb not null default '{}',
  criado_em timestamptz not null default now()
);
create index on eventos (empresa_id, oportunidade_id, criado_em);
create index on eventos (empresa_id, criado_em);

create table tarefas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  oportunidade_id uuid,
  conversa_id uuid,
  tipo text not null,
  titulo text not null,
  detalhe text not null default '',
  prazo timestamptz,
  responsavel_id text references "user"(id) on delete set null,
  concluida_em timestamptz,
  concluida_por text references "user"(id) on delete set null,
  chave text,
  criado_em timestamptz not null default now(),
  unique (empresa_id, chave),
  foreign key (empresa_id, oportunidade_id) references oportunidades (empresa_id, id) on delete cascade,
  foreign key (empresa_id, conversa_id) references conversas (empresa_id, id) on delete cascade
);
create index on tarefas (empresa_id, concluida_em, prazo);

create table notificacoes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  -- sem destinatário = administradores da empresa (fila sem responsável)
  user_id text references "user"(id) on delete cascade,
  titulo text not null,
  corpo text not null default '',
  link text not null default '',
  lida_em timestamptz,
  criado_em timestamptz not null default now()
);
create index on notificacoes (empresa_id, user_id, lida_em);

create table conhecimento (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  versao int not null,
  dados jsonb not null,
  criado_por text references "user"(id) on delete set null,
  criado_em timestamptz not null default now(),
  unique (empresa_id, versao)
);

create table integracoes (
  empresa_id uuid not null references empresas(id) on delete cascade,
  tipo text not null check (tipo in ('whatsapp', 'ia')),
  config jsonb not null default '{}',
  segredo_cifrado text,
  atualizado_por text references "user"(id) on delete set null,
  atualizado_em timestamptz not null default now(),
  primary key (empresa_id, tipo)
);
-- Um número do WhatsApp pertence a uma única empresa.
create unique index integracoes_numero_unico on integracoes ((config ->> 'phone_number_id')) where tipo = 'whatsapp' and config ->> 'phone_number_id' <> '';

-- Fila de trabalhos persistida: o worker lê daqui; reiniciar não perde nem repete nada.
create table trabalhos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  tipo text not null,
  dados jsonb not null default '{}',
  executar_em timestamptz not null default now(),
  estado text not null default 'pendente' check (estado in ('pendente', 'executando', 'concluido', 'falhou', 'cancelado', 'incerto')),
  tentativas int not null default 0,
  max_tentativas int not null default 3,
  chave text unique,
  bloqueado_ate timestamptz,
  ultimo_erro text,
  resultado text,
  conversa_id uuid,
  oportunidade_id uuid,
  criado_em timestamptz not null default now(),
  concluido_em timestamptz
);
create index on trabalhos (estado, executar_em);
create index on trabalhos (empresa_id, conversa_id) where estado = 'pendente';

create table eventos_webhook (
  provedor text not null,
  id_evento text not null,
  recebido_em timestamptz not null default now(),
  primary key (provedor, id_evento)
);

create table uso_ia (
  empresa_id uuid not null references empresas(id) on delete cascade,
  mes date not null,
  respostas int not null default 0,
  tokens_entrada bigint not null default 0,
  tokens_saida bigint not null default 0,
  falhas int not null default 0,
  primary key (empresa_id, mes)
);

create table avaliacoes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null,
  oportunidade_id uuid not null,
  token_hash text not null unique,
  criado_em timestamptz not null default now(),
  aberto_em timestamptz,
  clicou_publico_em timestamptz,
  nota_privada int check (nota_privada between 1 and 5),
  comentario_privado text,
  unique (empresa_id, oportunidade_id),
  foreign key (empresa_id, oportunidade_id) references oportunidades (empresa_id, id) on delete cascade
);

create table limites (
  chave text not null,
  janela timestamptz not null,
  total int not null default 0,
  primary key (chave, janela)
);

-- E-mails que seriam enviados (convite, redefinição de senha) enquanto não há provedor de e-mail configurado.
create table emails_simulados (
  id uuid primary key default gen_random_uuid(),
  para text not null,
  assunto text not null,
  corpo text not null,
  criado_em timestamptz not null default now()
);
