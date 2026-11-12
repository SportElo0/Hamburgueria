-- Versão do texto de autorização aceito: o lembrete de manutenção só vale para quem aceitou o texto que o inclui (versão 2).
alter table consentimentos add column versao int not null default 1;
