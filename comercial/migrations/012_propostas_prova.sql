-- Proposta online: validade contada a partir do envio, cliente consumidor (direito de arrependimento) e prova do conteúdo aceito.
alter table propostas add column validade_dias int not null default 15 check (validade_dias between 1 and 180);
alter table propostas alter column validade drop not null;
alter table propostas add column consumidor boolean not null default true;
-- Prova do aceite: hash do conteúdo mostrado, o texto do aceite e o navegador (resumido).
alter table propostas add column conteudo_hash text not null default '';
alter table propostas add column texto_aceite text not null default '';
alter table propostas add column aceite_navegador text not null default '';

-- Depois de enviada, o conteúdo da proposta não muda mais (uma nova versão é uma nova proposta).
create or replace function propostas_conteudo_fixo() returns trigger language plpgsql as $$
begin
  if old.estado <> 'rascunho' and (new.titulo is distinct from old.titulo or new.itens is distinct from old.itens or new.condicoes is distinct from old.condicoes
     or new.total_centavos is distinct from old.total_centavos or new.consumidor is distinct from old.consumidor
     or (old.validade is not null and new.validade is distinct from old.validade)) then
    raise exception 'proposta enviada não pode ser alterada';
  end if;
  return new;
end $$;
create trigger propostas_conteudo_fixo before update on propostas for each row execute function propostas_conteudo_fixo();
