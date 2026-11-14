-- Agenda por profissional: quem atende as visitas (com ou sem login), os horários de trabalho de cada um na semana e os
-- ajustes de um dia (horário tirado ou horário extra). Sem profissionais cadastrados, a agenda continua como antes
-- (horário da empresa e "visitas ao mesmo tempo").
create table profissionais (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  nome text not null check (char_length(nome) between 2 and 60),
  funcao text not null default '' check (char_length(funcao) <= 60),
  cor text not null default '#175cd3' check (cor ~ '^#[0-9a-f]{6}$'),
  -- Login ligado (opcional): a visita marcada com este profissional fica com essa pessoa como responsável.
  user_id text references "user"(id) on delete set null,
  -- Horário de trabalho: {"1": [[480, 720], [780, 1020]], ...} = dia da semana (0 = domingo) -> faixas em minutos do dia.
  semana jsonb not null default '{}',
  ativo boolean not null default true,
  ordem int not null default 0,
  criado_em timestamptz not null default now(),
  unique (empresa_id, id)
);
create index on profissionais (empresa_id);

create table agenda_ajustes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  profissional_id uuid not null,
  -- tirar = o horário (ou o dia) sai da agenda; extra = horário a mais, fora do horário de trabalho.
  tipo text not null check (tipo in ('tirar', 'extra')),
  inicio timestamptz not null,
  fim timestamptz not null,
  criado_por text references "user"(id) on delete set null,
  criado_em timestamptz not null default now(),
  check (fim > inicio),
  foreign key (empresa_id, profissional_id) references profissionais (empresa_id, id) on delete cascade
);
create index on agenda_ajustes (empresa_id, profissional_id, inicio);

-- Profissionais não são apagados (só desativados), então a visita guarda com quem foi marcada.
alter table visitas add column if not exists profissional_id uuid;
alter table visitas add constraint visitas_profissional_fk foreign key (empresa_id, profissional_id) references profissionais (empresa_id, id);
create index on visitas (empresa_id, profissional_id, inicio);

-- O próprio cliente pode marcar pela página de agendamento.
alter table visitas drop constraint if exists visitas_origem_check;
alter table visitas add constraint visitas_origem_check check (origem in ('usuario', 'ia', 'cliente'));

-- Demonstração: três profissionais fictícios em cada empresa de demonstração (seg a sex, 8h às 12h e 13h às 17h; o Bruno folga na quinta).
insert into profissionais (empresa_id, nome, funcao, cor, semana, ordem)
select e.id, p.nome, p.funcao, p.cor, p.semana::jsonb, p.ordem
from empresas e
cross join (values
  ('Carla', 'Projetos residenciais', '#175cd3', '{"1":[[480,720],[780,1020]],"2":[[480,720],[780,1020]],"3":[[480,720],[780,1020]],"4":[[480,720],[780,1020]],"5":[[480,720],[780,1020]]}', 1),
  ('Rafael', 'Empresas e comércio', '#0e9384', '{"1":[[480,720],[780,1020]],"2":[[480,720],[780,1020]],"3":[[480,720],[780,1020]],"4":[[480,720],[780,1020]],"5":[[480,720],[780,1020]]}', 2),
  ('Bruno', 'Manutenção', '#7a5af8', '{"1":[[480,720],[780,1020]],"2":[[480,720],[780,1020]],"3":[[480,720],[780,1020]],"5":[[480,720],[780,1020]]}', 3)
) as p(nome, funcao, cor, semana, ordem)
where e.demonstracao and not exists (select 1 from profissionais x where x.empresa_id = e.id);
