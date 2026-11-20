import Link from 'next/link';
import { redirect } from 'next/navigation';
import { salvarInvestimentoAcao } from '@/app/acoes';
import { reais } from '@/componentes/formato';
import { Enviar, Formulario } from '@/componentes/formulario';
import { resultadosAnuncios, type LinhaAnuncio } from '@/server/anuncios';
import { exigirCtx } from '@/server/sessao';

export const metadata = { title: 'Anúncios' };

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const nomeMes = (m: string) => { const n = MESES[Number(m.slice(5)) - 1]; return `${n.charAt(0).toUpperCase()}${n.slice(1)} de ${m.slice(0, 4)}`; };
const deslocar = (m: string, n: number) => {
  const d = new Date(Date.UTC(Number(m.slice(0, 4)), Number(m.slice(5)) - 1 + n, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
};
const nomeFonte = (f: string) => (f ? f.charAt(0).toUpperCase() + f.slice(1) : 'Sem anúncio');
const custo = (inv: number | null, n: number) => (inv == null ? '—' : n ? reais(Math.round(inv / n)) : 'sem resultado ainda');

function Linha({ l, mes }: { l: LinhaAnuncio; mes: string }) {
  const retorno = l.investimentoCentavos && l.valorGanhoCentavos ? (l.valorGanhoCentavos / l.investimentoCentavos).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) : null;
  return (
    <li className="py-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-semibold text-tinta">{nomeFonte(l.fonte)}{l.campanha ? ` · ${l.campanha}` : ''}</p>
        <p className="text-sm text-suave">{l.investimentoCentavos == null ? (l.fonte ? 'gasto não informado' : '') : `gasto ${reais(l.investimentoCentavos)}`}</p>
      </div>
      <dl className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 text-[15px] sm:grid-cols-4">
        <div><dt className="text-sm text-suave">Pedidos</dt><dd>{l.pedidos}</dd></div>
        <div><dt className="text-sm text-suave">Vendas</dt><dd>{l.ganhos}{l.valorGanhoCentavos ? ` · ${reais(l.valorGanhoCentavos)}` : ''}</dd></div>
        <div><dt className="text-sm text-suave">Custo por pedido</dt><dd>{l.fonte ? custo(l.investimentoCentavos, l.pedidos) : '—'}</dd></div>
        <div><dt className="text-sm text-suave">Custo por venda</dt><dd>{l.fonte ? custo(l.investimentoCentavos, l.ganhos) : '—'}</dd></div>
      </dl>
      {retorno && <p className="mt-1 text-sm text-suave">Cada R$ 1 gasto trouxe R$ {retorno} em vendas (valor informado pelos vendedores, não é lucro).</p>}
      {l.fonte && (
        <details className="mt-2">
          <summary className="cursor-pointer text-sm font-semibold text-marca-escura">{l.investimentoCentavos == null ? 'Informar quanto gastou' : 'Corrigir o gasto'}</summary>
          <Formulario acao={salvarInvestimentoAcao} className="mt-2 flex flex-wrap items-end gap-2">
            <input type="hidden" name="mes" value={mes} />
            <input type="hidden" name="fonte" value={l.fonte} />
            <input type="hidden" name="campanha" value={l.campanha} />
            <div><label className="rotulo" htmlFor={`v-${l.fonte}-${l.campanha}`}>Gasto no mês (R$)</label><input className="campo" id={`v-${l.fonte}-${l.campanha}`} name="valor" inputMode="decimal" placeholder="350,00" defaultValue={l.investimentoCentavos != null ? (l.investimentoCentavos / 100).toFixed(2).replace('.', ',') : ''} required /></div>
            <Enviar secundario>Salvar</Enviar>
          </Formulario>
        </details>
      )}
    </li>
  );
}

export default async function Anuncios({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const ctx = await exigirCtx();
  if (ctx.papel !== 'admin') redirect('/painel');
  const hoje = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit' }).format(new Date()).slice(0, 7);
  const pedido = (await searchParams).mes ?? '';
  const mes = /^\d{4}-(0[1-9]|1[0-2])$/.test(pedido) ? pedido : hoje;
  const linhas = await resultadosAnuncios(ctx, mes);
  const total = linhas.reduce((t, l) => ({ pedidos: t.pedidos + l.pedidos, inv: t.inv + (l.investimentoCentavos ?? 0), anuncio: t.anuncio + (l.fonte ? l.pedidos : 0) }), { pedidos: 0, inv: 0, anuncio: 0 });
  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold">Resultado dos anúncios</h1>
      <nav aria-label="Mês" className="flex items-center gap-2">
        <Link className="botao-2 min-h-10 px-3 py-1 text-sm" href={`/painel/anuncios?mes=${deslocar(mes, -1)}`}>← Anterior</Link>
        <span className="font-semibold text-tinta">{nomeMes(mes)}</span>
        {mes < hoje && <Link className="botao-2 min-h-10 px-3 py-1 text-sm" href={`/painel/anuncios?mes=${deslocar(mes, 1)}`}>Próximo →</Link>}
      </nav>
      <p className="text-[15px] text-suave">Pedidos que chegaram no mês, separados pelo anúncio que trouxe cada um; vendas são as desses pedidos que já foram ganhas. {total.pedidos ? `${total.anuncio} de ${total.pedidos} pedido(s) vieram de anúncio marcado.` : ''}{total.inv ? ` Gasto informado: ${reais(total.inv)}.` : ''}</p>
      <section className="cartao p-4">
        {linhas.length === 0 ? <p className="text-suave">Nenhum pedido neste mês.</p> : <ul className="divide-y divide-linha">{linhas.map((l) => <Linha key={`${l.fonte}|${l.campanha}`} l={l} mes={mes} />)}</ul>}
      </section>
      <section className="cartao p-4">
        <h2 className="font-bold">Informar o gasto de um anúncio que ainda não aparece</h2>
        <Formulario acao={salvarInvestimentoAcao} limpar className="mt-3 grid gap-3 sm:grid-cols-3">
          <input type="hidden" name="mes" value={mes} />
          <div><label className="rotulo" htmlFor="n-fonte">De onde (ex.: facebook, google)</label><input className="campo" id="n-fonte" name="fonte" required maxLength={60} /></div>
          <div><label className="rotulo" htmlFor="n-camp">Campanha (opcional)</label><input className="campo" id="n-camp" name="campanha" maxLength={120} /></div>
          <div><label className="rotulo" htmlFor="n-valor">Gasto no mês (R$)</label><input className="campo" id="n-valor" name="valor" inputMode="decimal" placeholder="350,00" required /></div>
          <div className="sm:col-span-3"><Enviar secundario>Salvar gasto</Enviar></div>
        </Formulario>
      </section>
      <section className="cartao p-4 text-[15px]">
        <h2 className="font-bold">Como o sistema sabe de qual anúncio veio</h2>
        <p className="mt-1">No link do anúncio, acrescente <code className="break-all">?utm_source=facebook&amp;utm_campaign=nome-da-campanha</code> (ou google, instagram…). Quem chegar por esse link e pedir orçamento fica marcado. Anúncios do Google e da Meta com marcação automática também são reconhecidos. Pedidos pelo WhatsApp, ligação ou sem esse link aparecem como “Sem anúncio”.</p>
      </section>
    </div>
  );
}
