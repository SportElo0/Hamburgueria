-- Tipo de cada aviso (para escolher quais vão para o WhatsApp e, depois, as preferências de cada pessoa).
alter table notificacoes add column tipo text not null default 'geral';
-- Quando o aviso saiu para o WhatsApp de quem pediu (null = ainda não). Os antigos ficam como já tratados.
alter table notificacoes add column whatsapp_em timestamptz;
update notificacoes set whatsapp_em = now() where whatsapp_em is null;
create index notificacoes_whatsapp_pendente on notificacoes (criado_em) where whatsapp_em is null;

-- Quem da equipe pediu para receber os avisos importantes no próprio WhatsApp, com o texto que aceitou.
create table avisos_whatsapp (
  empresa_id uuid not null references empresas(id) on delete cascade,
  user_id text not null references "user"(id) on delete cascade,
  telefone text not null,
  texto_aceite text not null,
  aceito_em timestamptz not null default now(),
  ultimo_envio_em timestamptz,
  primary key (empresa_id, user_id)
);
