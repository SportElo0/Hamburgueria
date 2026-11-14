-- A assistente passa a se apresentar por um nome (padrão "Ana"), como alguém da equipe.
-- Empresas que ainda tinham o nome antigo padrão recebem o novo; nomes escolhidos pela empresa ficam.
update empresas
set config = jsonb_set(config, '{ia,nome}', '"Ana"')
where config -> 'ia' ->> 'nome' = 'Assistente virtual';
