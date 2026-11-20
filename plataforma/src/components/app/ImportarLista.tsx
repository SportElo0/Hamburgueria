'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { lerCsv, lerXlsx } from '@/lib/xlsx-leitor';
import { lerClientes, type Importado } from '@/lib/importados';
import { apagarImportadosAction, importarClientesAction } from '@/app/loja/[slug]/dono/clientes/actions';
import type { ResumoImportacao } from '@/components/customers/ReativarClientes';

const fmtDia = (iso: string) => new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso));

/**
 * Bring the customers from Anota Aí: the spreadsheet is read here in the browser; only name, mobile, orders and days
 * stopped go to the server, with the store's statement that everyone accepted offers.
 */
export function ImportarLista({ slug, resumo }: { slug: string; resumo: ResumoImportacao | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [aberto, setAberto] = useState(!resumo);
  const [lidos, setLidos] = useState<{ clientes: Importado[]; semCelular: number; arquivos: string[] } | null>(null);
  const [aceite, setAceite] = useState(false);
  const [erro, setErro] = useState('');

  const ler = async (files: FileList | null) => {
    setErro('');
    setLidos(null);
    if (!files?.length) return;
    if (files.length > 4) return setErro('Escolha no máximo 4 planilhas de uma vez.');
    try {
      const todos = new Map<string, Importado>();
      let semCelular = 0;
      for (const f of Array.from(files)) {
        const rows = /\.csv$/i.test(f.name) ? lerCsv(await f.text()) : await lerXlsx(new Uint8Array(await f.arrayBuffer()));
        const r = lerClientes(rows);
        semCelular += r.semCelular;
        for (const c of r.clientes) {
          const prev = todos.get(c.phone);
          if (!prev || c.orders > prev.orders) todos.set(c.phone, c);
        }
      }
      setLidos({ clientes: [...todos.values()], semCelular, arquivos: Array.from(files).map((f) => f.name) });
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não consegui ler a planilha.');
    }
  };

  const importar = () => {
    if (!lidos || !aceite) return;
    setErro('');
    start(async () => {
      const res = await importarClientesAction(slug, { fonte: lidos.arquivos.some((a) => /cliente/i.test(a)) ? 'Anota Aí' : 'Planilha', aceite: true, clientes: lidos.clientes });
      if (!res.ok) return setErro(res.error ?? 'Não foi possível importar.');
      router.refresh();
    });
  };

  const apagar = () => {
    if (!confirm('Apagar a lista de clientes do app? Os nomes saem, mas guardamos a data do último torpedo e quem pediu para sair, para ninguém receber duas vezes.')) return;
    start(async () => {
      const res = await apagarImportadosAction(slug);
      if (!res.ok) return setErro(res.error ?? 'Não foi possível apagar.');
      router.refresh();
    });
  };

  if (resumo && !aberto)
    return (
      <section className="card flex flex-wrap items-center justify-between gap-3 p-4 text-sm" aria-label="Lista importada">
        <p className="text-ink-soft">
          <b className="text-ink">{resumo.total.toLocaleString('pt-BR')}</b> clientes de {resumo.fonte}, atualizado em {fmtDia(resumo.importadoEm)}.
        </p>
        <div className="flex gap-2">
          <button type="button" className="btn-ghost min-h-10" onClick={() => setAberto(true)}>
            Atualizar lista
          </button>
          <button type="button" className="btn-ghost min-h-10 text-bad" onClick={apagar} disabled={pending}>
            Apagar
          </button>
        </div>
        {erro && (
          <p role="alert" className="w-full font-semibold text-bad">
            {erro}
          </p>
        )}
      </section>
    );

  return (
    <section className="card space-y-3 p-4" aria-labelledby="importar">
      <h2 id="importar" className="font-bold">
        {resumo ? 'Atualizar a lista' : 'Trazer seus clientes do Anota Aí'}
      </h2>
      <ol className="list-decimal space-y-1 pl-5 text-sm text-ink-soft">
        <li>No Anota Aí, abra Clientes e exporte “Clientes inativos” e “Clientes ativos”.</li>
        <li>Escolha os arquivos aqui (pode escolher os dois juntos).</li>
      </ol>
      <label htmlFor="importar-arquivo" className="label">
        Planilha de clientes (.xlsx ou .csv)
      </label>
      <input id="importar-arquivo" type="file" accept=".xlsx,.csv" multiple className="field" onChange={(e) => ler(e.target.files)} />
      {lidos && (
        <>
          <p className="text-sm" role="status">
            <b>{lidos.clientes.length.toLocaleString('pt-BR')}</b> clientes com celular{lidos.semCelular ? ` · ${lidos.semCelular} sem celular ficaram de fora` : ''}.
          </p>
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0" checked={aceite} onChange={(e) => setAceite(e.target.checked)} />
            <span>Confirmo que cada cliente desta lista disse que quer receber ofertas desta loja pelo WhatsApp (por exemplo, marcou isso ao pedir ou me autorizou). Se não tenho certeza de algum, não o coloquei na lista. Guardo a prova disso e sou o responsável pelos dados.</span>
          </label>
          <button type="button" className="btn-primary min-h-11 w-full sm:w-auto" onClick={importar} disabled={!aceite || pending}>
            {pending ? 'Trazendo…' : `Trazer ${lidos.clientes.length.toLocaleString('pt-BR')} clientes`}
          </button>
        </>
      )}
      {resumo && (
        <button type="button" className="btn-ghost min-h-10" onClick={() => setAberto(false)}>
          Cancelar
        </button>
      )}
      <p className="text-xs text-ink-mute">A lista fica guardada no app até você apagar ou trazer uma nova. Uma lista nova substitui a anterior.</p>
      {erro && (
        <p role="alert" className="text-sm font-semibold text-bad">
          {erro}
        </p>
      )}
    </section>
  );
}
