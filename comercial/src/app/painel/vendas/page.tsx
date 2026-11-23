import Link from 'next/link';
import { redirect } from 'next/navigation';
import { dataHora, reais } from '@/componentes/formato';
import { NOME_ETAPA, type Etapa } from '@/server/config';
import { RELATOS, relatorioVendas, type LinhaVenda } from '@/server/recebimentos';
import { exigirCtx } from '@/server/sessao';

export const metadata = { title: 'Vendas pagas' };

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const nomeMes = (m: string) => { const n = MESES[Number(m.slice(5)) - 1]; return `${n.charAt(0).toUpperCase()}${n.slice(1)} de ${m.slice(0, 4)}`; };
const deslocar = (m: string, n: number) => {
  const d = new Date(Date.UTC(Number(m.slice(0, 4)), Number(m.slice(5)) - 1 + n, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
};
const dataBr = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}`;

function Linha({ l }: { l: LinhaVenda }) {
  const emAberto = l.valor_proposta_centavos != null ? Math.max(0, l.valor_proposta_centavos - l.recebido_total_centavos) : null;
  return (
    <li className="py-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <Link className="font-semibold text-marca-escura underline" href={`/painel/oportunidades/${l.oportunidade_id}`}>{l.cliente || 'Contato sem nome'}</Link>
        <span className="text-sm text-suave">{NOME_ETAPA[l.etapa as Etapa] ?? l.etapa}</span>
      </div>
      <dl className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 text-[15px] sm:grid-cols-4">
        <div><dt className="text-sm text-suave">Recebido no mês</dt><dd>{reais(l.recebido_mes_centavos)}</dd></div>
        <div><dt className="text-sm text-suave">Recebido no total</dt><dd>{reais(l.recebido_total_centavos)}</dd></div>
        <div><dt className="text-sm text-suave">Em aberto</dt><dd>{emAberto == null ? 'sem valor de proposta' : reais(emAberto)}</dd></div>
        <div><dt className="text-sm text-suave">1º pagamento</dt><dd>{dataBr(l.primeiro_recebimento)}</dd></div>
      </dl>
      <p className="mt-1 text-sm text-suave">
        {l.retomada_em ? `Retomada automática enviada em ${dataHora(l.retomada_em)}, antes do 1º pagamento.` : 'Sem retomada automática antes do pagamento.'}
        {l.relato ? ` Vendedor: ${RELATOS[l.relato]}.` : ''}
      </p>
    </li>
  );
}

export default async function Vendas({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const ctx = await exigirCtx();
  if (ctx.papel !== 'admin') redirect('/painel');
  const hoje = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit' }).format(new Date()).slice(0, 7);
  const pedido = (await searchParams).mes ?? '';
  const mes = /^\d{4}-(0[1-9]|1[0-2])$/.test(pedido) ? pedido : hoje;
  const r = await relatorioVendas(ctx, mes);
  const voltaram = r.aposRetomada.filter((l) => l.relato === 'voltou_pela_retomada').length;
  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Vendas pagas</h1>
        <nav className="flex items-center gap-2 text-sm" aria-label="Mês">
          <Link className="botao-2 min-h-9 px-3 py-1" href={`/painel/vendas?mes=${deslocar(mes, -1)}`}>← Anterior</Link>
          <span className="font-semibold">{nomeMes(mes)}</span>
          {mes < hoje && <Link className="botao-2 min-h-9 px-3 py-1" href={`/painel/vendas?mes=${deslocar(mes, 1)}`}>Próximo →</Link>}
        </nav>
      </div>
      <p className="text-[15px] text-suave">O dinheiro que entrou no mês, venda por venda, como a equipe registrou em cada oportunidade (sinal, saldo, parcelas). Nada aqui é estimado.</p>

      <section className="cartao p-4" aria-labelledby="t-resumo">
        <h2 id="t-resumo" className="sr-only">Resumo do mês</h2>
        <dl className="grid gap-4 sm:grid-cols-3">
          <div><dt className="text-sm text-suave">Recebido no mês</dt><dd className="text-2xl font-bold text-tinta">{reais(r.recebidoMes)}</dd><dd className="text-sm text-suave">{r.linhas.length} {r.linhas.length === 1 ? 'venda' : 'vendas'} com pagamento</dd></div>
          <div><dt className="text-sm text-suave">Pagas após retomada</dt><dd className="text-2xl font-bold text-tinta">{reais(r.recebidoAposRetomada)}</dd><dd className="text-sm text-suave">{r.aposRetomada.length} {r.aposRetomada.length === 1 ? 'venda' : 'vendas'}</dd></div>
          <div><dt className="text-sm text-suave">O vendedor diz que voltou pela retomada</dt><dd className="text-2xl font-bold text-tinta">{voltaram}</dd><dd className="text-sm text-suave">de {r.aposRetomada.length}</dd></div>
        </dl>
      </section>

      <section className="cartao p-4" aria-labelledby="t-apos">
        <h2 id="t-apos" className="font-bold">Vendas pagas após retomada</h2>
        <p className="mt-1 text-sm text-suave">Vendas em que uma mensagem automática de retomada saiu (aceita pelo WhatsApp) antes do 1º pagamento, ou no mesmo dia. Isso mostra que a retomada aconteceu antes; se foi ela que trouxe o cliente, quem diz é o vendedor, na oportunidade.</p>
        {r.aposRetomada.length === 0 ? <p className="mt-3 text-[15px] text-suave">Nenhuma neste mês.</p> : <ul className="mt-2 divide-y divide-linha">{r.aposRetomada.map((l) => <Linha key={l.oportunidade_id} l={l} />)}</ul>}
      </section>

      <section className="cartao p-4" aria-labelledby="t-todas">
        <h2 id="t-todas" className="font-bold">Todos os recebimentos do mês</h2>
        {r.linhas.length === 0 ? <p className="mt-3 text-[15px] text-suave">Nenhum recebimento registrado neste mês. Registre na oportunidade, em “Recebimentos”.</p> : <ul className="mt-2 divide-y divide-linha">{r.linhas.map((l) => <Linha key={l.oportunidade_id} l={l} />)}</ul>}
      </section>
    </div>
  );
}
