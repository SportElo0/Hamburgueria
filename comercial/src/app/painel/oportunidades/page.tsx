import Link from 'next/link';
import { Atualizar } from '@/componentes/atualizar';
import { ORIGENS, dataHora, reais } from '@/componentes/formato';
import { EtiquetaEtapa, Vazio } from '@/componentes/pedacos';
import { ETAPAS, NOME_ETAPA, formatarTelefone, type Etapa } from '@/server/config';
import { equipe } from '@/server/empresas';
import { listar, type Oportunidade } from '@/server/oportunidades';
import { exigirCtx } from '@/server/sessao';

export const metadata = { title: 'Oportunidades' };

function Cartao({ o }: { o: Oportunidade }) {
  const vencida = o.proxima_acao_em && o.proxima_acao_em < new Date();
  return (
    <Link href={`/painel/oportunidades/${o.id}`} className="block rounded-lg border border-linha bg-white p-3 hover:border-marca">
      <span className="block font-semibold text-tinta">{o.contato_nome || formatarTelefone(o.contato_telefone)}</span>
      <span className="block text-sm text-suave">{o.contato_cidade || 'Cidade não informada'} · {ORIGENS[o.origem] ?? o.origem}</span>
      {o.necessidade && <span className="mt-1 line-clamp-2 block text-sm">{o.necessidade}</span>}
      <span className="mt-2 flex flex-wrap items-center gap-1.5 text-[13px]">
        <span className={`etiqueta ${o.responsavel_nome ? '' : 'etiqueta-alerta'}`}>{o.responsavel_nome ?? 'Sem responsável'}</span>
        {o.valor_proposta_centavos != null && <span className="etiqueta">{reais(o.valor_proposta_centavos)}</span>}
        {o.proxima_acao_em && <span className={`etiqueta ${vencida ? 'etiqueta-erro' : ''}`}>{vencida ? 'Atrasada: ' : 'Próx.: '}{dataHora(o.proxima_acao_em)}</span>}
      </span>
    </Link>
  );
}

export default async function Oportunidades({ searchParams }: { searchParams: Promise<{ ver?: string; etapa?: string; resp?: string; busca?: string }> }) {
  const ctx = await exigirCtx();
  const sp = await searchParams;
  const ver = sp.ver === 'lista' ? 'lista' : 'quadro';
  const etapa = ETAPAS.includes(sp.etapa as Etapa) ? (sp.etapa as Etapa) : undefined;
  const [lista, pessoas] = await Promise.all([listar(ctx, { etapa: ver === 'lista' ? etapa : undefined, responsavel: sp.resp || undefined, busca: sp.busca }), equipe(ctx)]);
  const qs = (extra: Record<string, string>) => `?${new URLSearchParams({ ...(sp.resp ? { resp: sp.resp } : {}), ...(sp.busca ? { busca: sp.busca } : {}), ...extra })}`;
  return (
    <div className="space-y-4">
      <Atualizar segundos={15} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold">Oportunidades</h1>
        <div className="flex gap-1" role="group" aria-label="Modo de ver">
          {(['quadro', 'lista'] as const).map((v) => (
            <Link key={v} href={qs({ ver: v })} aria-current={ver === v ? 'true' : undefined} className={`inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-semibold ${ver === v ? 'bg-marca text-white' : 'border border-linha bg-white'}`}>
              {v === 'quadro' ? 'Quadro' : 'Lista'}
            </Link>
          ))}
        </div>
      </div>

      <form className="cartao flex flex-wrap items-end gap-3 p-3" role="search">
        <input type="hidden" name="ver" value={ver} />
        <div className="min-w-40 flex-1">
          <label className="rotulo" htmlFor="busca">Buscar por nome, telefone ou cidade</label>
          <input className="campo" id="busca" name="busca" defaultValue={sp.busca ?? ''} />
        </div>
        <div>
          <label className="rotulo" htmlFor="resp">Responsável</label>
          <select className="campo" id="resp" name="resp" defaultValue={sp.resp ?? ''}>
            <option value="">Todos</option>
            <option value="fila">Fila sem responsável</option>
            {pessoas.filter((p) => p.ativo).map((p) => <option key={p.user_id} value={p.user_id}>{p.nome}</option>)}
          </select>
        </div>
        {ver === 'lista' && (
          <div>
            <label className="rotulo" htmlFor="etapa">Etapa</label>
            <select className="campo" id="etapa" name="etapa" defaultValue={etapa ?? ''}>
              <option value="">Todas</option>
              {ETAPAS.map((e) => <option key={e} value={e}>{NOME_ETAPA[e]}</option>)}
            </select>
          </div>
        )}
        <button className="botao-2">Filtrar</button>
      </form>

      {lista.length === 0 ? (
        <Vazio titulo="Nenhuma oportunidade encontrada.">Mude os filtros, ou aguarde o próximo pedido do site.</Vazio>
      ) : ver === 'quadro' ? (
        <div className="-mx-4 overflow-x-auto px-4 pb-2">
          <div className="flex gap-3">
            {ETAPAS.map((e) => {
              const col = lista.filter((o) => o.etapa === e);
              return (
                <section key={e} aria-label={NOME_ETAPA[e]} className="w-72 shrink-0 rounded-xl bg-[#eceff4] p-2">
                  <h2 className="flex items-center justify-between px-1 pb-2 text-sm font-bold">{NOME_ETAPA[e]} <span className="etiqueta bg-white">{col.length}</span></h2>
                  <div className="space-y-2">
                    {col.length === 0 ? <p className="px-1 pb-2 text-sm text-suave">Vazio</p> : col.slice(0, 40).map((o) => <Cartao key={o.id} o={o} />)}
                    {col.length > 40 && <Link className="block px-1 text-sm underline" href={qs({ ver: 'lista', etapa: e })}>Ver os {col.length}</Link>}
                  </div>
                </section>
              );
            })}
          </div>
          <p className="mt-2 text-[13px] text-suave">Para mudar a etapa, abra a oportunidade. Arrastar cartões não faz parte desta versão.</p>
        </div>
      ) : (
        <ul className="cartao divide-y divide-linha">
          {lista.map((o) => (
            <li key={o.id}>
              <Link href={`/painel/oportunidades/${o.id}`} className="flex flex-wrap items-center justify-between gap-2 p-3 hover:bg-fundo">
                <span className="min-w-0">
                  <span className="block font-semibold text-tinta">{o.contato_nome || formatarTelefone(o.contato_telefone)}</span>
                  <span className="block truncate text-sm text-suave">{o.contato_cidade} · {ORIGENS[o.origem] ?? o.origem} · entrou em {dataHora(o.entrada_em)}</span>
                </span>
                <span className="flex flex-wrap items-center gap-1.5">
                  <span className="etiqueta">{o.responsavel_nome ?? 'Sem responsável'}</span>
                  <EtiquetaEtapa etapa={o.etapa} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
