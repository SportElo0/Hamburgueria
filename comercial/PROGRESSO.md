# Progresso (registro curto para retomar)

Atualizado em 12/11/2026.

- [x] Etapa A: login (Better Auth), empresas, isolamento, pedidos, oportunidades, tarefas, histórico, notificações.
- [x] Etapa B: conhecimento, IA (simulador + adaptador Anthropic), chat do site, transferência para pessoa.
- [x] Etapa C: fila no banco + worker, regras de retorno, WhatsApp oficial (adaptador) + simulador, avaliações.
- [x] Etapa D: métricas, telas responsivas, testes (38 de serviço + percurso no navegador), README, roteiro.

- [x] Automações: fila embutida na aplicação, sequência de retorno, tela Automações, 46 testes.
- [x] Construtor de fluxos (gatilho, esperas, condições, ações), histórico de execuções; ramificações (se/ir para) e gatilho por mensagem; gatilho por tempo parado e desenho do fluxo; 63 testes.
- [x] IA real: adaptador testado contra API falsa local; botão "Testar a assistente real" em /admin e `npm run testar-ia`. Falta a chave para rodar contra a API real.
- [x] Passos de fluxo: atribuir responsável (distribuição por carga) e mover etapa do meio; 69 testes.
- [x] Rotinas: tarefa vencida sobe para o administrador e resumo do dia no painel; 73 testes.
- [x] Lembrete de manutenção com autorização versionada; 77 testes.

Ponto de retomada: seguir "Próximos passos para o primeiro cliente em produção" do README.
Não feito de propósito: publicar, contratar serviços, testar IA e WhatsApp reais (faltam credenciais).
Pendente de revisão antes de publicar: `revisor-seguranca` e `revisor-legal` (regra do CLAUDE.md).
