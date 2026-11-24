import Link from 'next/link';
import { simularWhatsAppAcao } from '@/app/acoes';
import { Atualizar } from '@/componentes/atualizar';
import { dataHora } from '@/componentes/formato';
import { Enviar, Formulario } from '@/componentes/formulario';
import { EtiquetaEstado, Vazio } from '@/componentes/pedacos';
import { ESTADOS_CONVERSA, NOME_ESTADO, formatarTelefone, type EstadoConversa } from '@/server/config';
import { listarConversas } from '@/server/conversas';
import { canalDa } from '@/server/integracoes';
import { exigirCtx } from '@/server/sessao';

export const metadata = { title: 'Atendimento' };

export default async function Atendimento({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  const ctx = await exigirCtx();
  const sp = await searchParams;
  const estado = ESTADOS_CONVERSA.includes(sp.estado as EstadoConversa) ? (sp.estado as EstadoConversa) : undefined;
  const [lista, { canal }] = await Promise.all([listarConversas(ctx, estado), canalDa(ctx.empresaId)]);
  return (
    <div className="space-y-4">
      <Atualizar segundos={8} />
      <h1 className="text-2xl font-bold">Atendimento</h1>
      <nav aria-label="Filtrar por estado" className="flex flex-wrap gap-1">
        {[undefined, ...ESTADOS_CONVERSA].map((e) => (
          <Link key={e ?? 'todas'} href={e ? `/painel/atendimento?estado=${e}` : '/painel/atendimento'} aria-current={estado === e ? 'true' : undefined} className={`inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-semibold ${estado === e ? 'bg-marca text-white' : 'border border-linha bg-white'}`}>
            {e ? NOME_ESTADO[e] : 'Todas'}
          </Link>
        ))}
      </nav>
      {lista.length === 0 ? (
        <Vazio titulo="Nenhuma conversa aqui.">As conversas do chat do site e do WhatsApp aparecem nesta tela.</Vazio>
      ) : (
        <ul className="cartao divide-y divide-linha">
          {lista.map((v) => (
            <li key={v.id}>
              <Link href={`/painel/atendimento/${v.id}`} className="flex flex-wrap items-center justify-between gap-2 p-3 hover:bg-fundo">
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-tinta">{v.contato_nome || (v.contato_telefone ? formatarTelefone(v.contato_telefone) : 'Visitante do site')} <span className="font-normal text-suave">· {v.canal === 'whatsapp' ? 'WhatsApp' : 'Chat do site'}</span></span>
                  <span className="block truncate text-sm text-suave">{v.ultima ?? ''}</span>
                </span>
                <span className="flex items-center gap-2">
                  {v.assumida_nome && <span className="text-[13px] text-suave">{v.assumida_nome}</span>}
                  <EtiquetaEstado estado={v.estado} />
                  <time className="text-[13px] text-suave">{dataHora(v.atualizado_em)}</time>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {canal?.simulado && (
        <details className="cartao p-4">
          <summary className="cursor-pointer font-bold text-tinta">Simular uma mensagem chegando pelo WhatsApp</summary>
          <p className="mt-2 text-sm text-suave">Simulação — nenhuma mensagem externa enviada. Serve para demonstrar e testar o fluxo enquanto o WhatsApp oficial não está ligado. Use um número fictício.</p>
          <Formulario acao={simularWhatsAppAcao} className="mt-3 grid gap-3 sm:grid-cols-2">
            <div><label className="rotulo" htmlFor="tel">Telefone (fictício, com DDD)</label><input className="campo" id="tel" name="telefone" inputMode="tel" placeholder="(11) 90000-0001" required /></div>
            <div><label className="rotulo" htmlFor="nome">Nome no WhatsApp</label><input className="campo" id="nome" name="nome" placeholder="Cliente de teste" /></div>
            <div className="sm:col-span-2"><label className="rotulo" htmlFor="texto">Mensagem</label><input className="campo" id="texto" name="texto" required placeholder="Olá, quero um orçamento" /></div>
            <div><Enviar secundario>Simular mensagem</Enviar></div>
          </Formulario>
        </details>
      )}
    </div>
  );
}
