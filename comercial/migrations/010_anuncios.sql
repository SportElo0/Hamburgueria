-- Quanto a empresa gastou em cada anúncio por mês, para calcular o custo de cada pedido e de cada venda.
create table investimentos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  mes date not null check (extract(day from mes) = 1),
  fonte text not null,
  campanha text not null default '',
  valor_centavos bigint not null check (valor_centavos > 0),
  atualizado_por text references "user"(id) on delete set null,
  atualizado_em timestamptz not null default now(),
  unique (empresa_id, mes, fonte, campanha)
);
