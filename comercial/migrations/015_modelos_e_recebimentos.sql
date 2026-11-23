-- Modelo aprovado enviado pela equipe e recebimentos de cada venda.
--
-- 1. mensagens.variaveis: os campos preenchidos de um modelo aprovado pela Meta ({{1}}, {{2}}...), na ordem.
--    Nulo = mensagem antiga ou automática: o texto inteiro vai como a única variável do modelo, como antes.
-- 2. mensagens.finalidade: para que a mensagem saiu (confirmacao, retorno, fluxo, avaliacao, ..., modelo_equipe).
--    É o que permite dizer, depois, que houve uma retomada antes do pagamento.
-- 3. recebimentos: o dinheiro que entrou em cada venda (sinal, saldo, parcela), informado por uma pessoa da equipe.
-- 4. oportunidades.retomada_relato: o que o vendedor diz sobre a venda (voltou depois da retomada ou não).
alter table mensagens add column if not exists variaveis jsonb check (variaveis is null or jsonb_typeof(variaveis) = 'array');
alter table mensagens add column if not exists finalidade text;
-- A qual oportunidade a mensagem iniciada pela empresa se refere (o contato pode ter mais de uma ao longo do tempo).
alter table mensagens add column if not exists oportunidade_id uuid;
create index if not exists mensagens_oportunidade on mensagens (empresa_id, oportunidade_id) where oportunidade_id is not null;

create table recebimentos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  oportunidade_id uuid not null,
  valor_centavos bigint not null check (valor_centavos > 0 and valor_centavos <= 10000000000),
  recebido_em date not null,
  descricao text not null default '' check (char_length(descricao) <= 80),
  criado_por text references "user"(id) on delete set null,
  criado_em timestamptz not null default now(),
  unique (empresa_id, id),
  foreign key (empresa_id, oportunidade_id) references oportunidades (empresa_id, id) on delete cascade
);
create index on recebimentos (empresa_id, recebido_em);
create index on recebimentos (empresa_id, oportunidade_id);

alter table oportunidades add column if not exists retomada_relato text not null default ''
  check (retomada_relato in ('', 'voltou_pela_retomada', 'fechou_sem_retomada'));
