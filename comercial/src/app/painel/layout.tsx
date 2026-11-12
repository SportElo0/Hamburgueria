import Link from 'next/link';
import { sair, sairEmpresaAcao } from '@/app/acoes';
import { Marca } from '@/componentes/acesso';
import { Navegacao } from '@/componentes/navegacao';
import { ambiente } from '@/server/config';
import { um } from '@/server/db';
import { empresaPorId } from '@/server/empresas';
import { adaptadorIA } from '@/server/ia';
import { canalDa } from '@/server/integracoes';
import { exigirCtx } from '@/server/sessao';

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const ctx = await exigirCtx();
  const empresa = (await empresaPorId(ctx.empresaId))!;
  const n = await um<{ tarefas: number; conversas: number; avisos: number }>(
    `select
       (select count(*)::int from tarefas where empresa_id = $1 and concluida_em is null and prazo < now() and (responsavel_id = $2 or $3)) as tarefas,
       (select count(*)::int from conversas where empresa_id = $1 and estado = 'aguardando_humano') as conversas,
       (select count(*)::int from notificacoes where empresa_id = $1 and lida_em is null and (user_id = $2 or (user_id is null and $3))) as avisos`,
    [ctx.empresaId, ctx.userId, ctx.papel === 'admin'],
  );
  const { canal } = await canalDa(ctx.empresaId);
  const ia = adaptadorIA();
  const simulacoes = [canal?.simulado ? 'WhatsApp' : '', ia?.simulada ? 'assistente de IA' : ''].filter(Boolean);
  return (
    <div className="min-h-dvh">
      {ctx.acessoAdmin && (
        <div className="bg-tinta px-4 py-2 text-sm text-white">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
            <span>Você é da equipe Growlift e está dentro dos dados da <strong>{empresa.nome}</strong>. Este acesso ficou registrado no histórico da empresa e vence em 1 hora.</span>
            <form action={sairEmpresaAcao}><button className="min-h-9 rounded-md bg-white px-3 font-semibold text-tinta">Sair desta empresa</button></form>
          </div>
        </div>
      )}
      {(empresa.demonstracao || ambiente() !== 'producao') && (
        <div className="border-b border-alerta/20 bg-alerta-clara px-4 py-1.5 text-center text-[13.5px] text-alerta">
          {empresa.demonstracao ? 'Empresa de demonstração: contatos, conversas e números são fictícios. ' : ''}
          {simulacoes.length ? `Simulação — nenhuma mensagem externa enviada (${simulacoes.join(' e ')}).` : ''}
        </div>
      )}
      <header className="border-b border-linha bg-white">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex items-center justify-between gap-3 py-3">
            <Link href="/painel" className="flex min-w-0 items-center gap-3">
              <Marca className="shrink-0" />
              <span className="truncate border-l border-linha pl-3 text-[15px] font-semibold text-tinta">{empresa.nome}</span>
            </Link>
            <div className="flex items-center gap-2 text-sm">
              <span className="hidden text-suave sm:inline">{ctx.nome} · {ctx.acessoAdmin ? 'Growlift' : ctx.papel === 'admin' ? 'administrador' : 'vendedor'}</span>
              <form action={sair}><button className="botao-2 min-h-9 px-3 py-1 text-sm">Sair</button></form>
            </div>
          </div>
          <Navegacao
            itens={[
              { href: '/painel', nome: 'Visão geral', aviso: n?.avisos },
              { href: '/painel/oportunidades', nome: 'Oportunidades' },
              { href: '/painel/atendimento', nome: 'Atendimento', aviso: n?.conversas },
              { href: '/painel/tarefas', nome: 'Tarefas', aviso: n?.tarefas },
              { href: '/painel/celular', nome: 'App no celular' },
              ...(ctx.papel === 'admin' ? [{ href: '/painel/automacoes', nome: 'Automações' }, { href: '/painel/conhecimento', nome: 'Conhecimento' }, { href: '/painel/configuracoes', nome: 'Configurações' }] : []),
            ]}
          />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
