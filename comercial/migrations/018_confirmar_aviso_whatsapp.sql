-- O celular dos avisos no WhatsApp só recebe depois de confirmado: a pessoa manda, do próprio WhatsApp para o
-- número da empresa, a mensagem "AVISOS <código>". Quem já tinha ligado (ainda não existe em produção) confirma de novo.
alter table avisos_whatsapp add column codigo text;
alter table avisos_whatsapp add column confirmado_em timestamptz;
