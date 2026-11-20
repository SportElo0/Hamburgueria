-- Formulários de anúncio do Google (lead form): chave da empresa guardada só como hash, como a da telefonia.
alter table integracoes drop constraint if exists integracoes_tipo_check;
alter table integracoes add constraint integracoes_tipo_check check (tipo in ('whatsapp', 'ia', 'telefonia', 'google_ads'));
