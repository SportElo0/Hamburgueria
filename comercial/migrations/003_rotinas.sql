-- Tarefa vencida que já foi avisada ao administrador (avisa uma vez só).
alter table tarefas add column escalada_em timestamptz;
create index on tarefas (empresa_id, prazo) where concluida_em is null and escalada_em is null;

-- Um resumo do dia por empresa por dia (o mesmo dia nunca é enviado duas vezes).
create table resumos_diarios (
  empresa_id uuid not null references empresas(id) on delete cascade,
  dia date not null,
  enviado_em timestamptz not null default now(),
  primary key (empresa_id, dia)
);
