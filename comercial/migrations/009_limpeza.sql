-- Rotinas que rodam uma vez por dia (ex.: limpeza de dados antigos): guarda quando cada uma rodou pela última vez.
create table rotinas_execucao (
  nome text primary key,
  em timestamptz not null
);
