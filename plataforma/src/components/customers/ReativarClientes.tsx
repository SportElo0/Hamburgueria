'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { lerCsv, lerXlsx } from '@/lib/xlsx-leitor';
import { LINHA_SAIR, lerClientes, mensagemModelo, type Escolhido, type Importado } from '@/lib/importados';
import { apagarImportadosAction, escreverMensagemAction, importarClientesAction, marcarEnviadoAction } from '@/app/loja/[slug]/dono/clientes/actions';
import { setOptOutAction } from '@/app/loja/[slug]/actions';

const fmtPhone = (p: string) => `(${p.slice(0, 2)}) ${p.slice(2, 7)}-${p.slice(7)}`;
const fmtDia = (iso: string) => new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso));

export interface ResumoImportacao {
  fonte: string;
  importadoEm: string;
  aceitePor: string;
  total: number;
  enviadosNoMes: number;
}

/**
 * "Reactivate customers from Anota Aí": the owner uploads the customer export, the panel picks the 50 worth a message
 * this month and each one gets a button that opens WhatsApp with the text ready (no API, no cost per message).
 * The spreadsheet is read here in the browser: only name, mobile, orders and days stopped go to the server.
 */
export function ReativarClientes(props: { slug: string; storeName: string; ia: boolean; resumo: ResumoImportacao | null; escolhidos: Escolhido[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [lidos, setLidos] = useState<{ clientes: Importado[]; semCelular: number; arquivos: string[] } | null>(null);
  const [aceite, setAceite] = useState(false);
  const [trocar, setTrocar] = useState(!props.resumo);
  const [erro, setErro] = useState('');
  const [oferta, setOferta] = useState('');
  const [mensagem, setMensagem] = useState(() => mensagemModelo(props.storeName, ''));
  const [feitoIa, setFeitoIa] = useState(false);
  const [lista, setLista] = useState(props.escolhidos);
  const problema = !mensagem.includes(LINHA_SAIR) ? `Deixe a última linha: "${LINHA_SAIR}"` : /\[[^\]]*\]/.test(mensagem) ? 'Troque o texto entre colchetes antes de enviar.' : '';

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
      const res = await importarClientesAction(props.slug, { fonte: lidos.arquivos.some((a) => /cliente/i.test(a)) ? 'Anota Aí' : 'Planilha', aceite: true, clientes: lidos.clientes });
      if (!res.ok) return setErro(res.error ?? 'Não foi possível importar.');
      setLidos(null);
      setAceite(false);
      setTrocar(false);
      router.refresh();
    });
  };

  const apagar = () => {
    if (!confirm('Apagar a lista importada? Os nomes saem, mas guardamos a data do último torpedo e quem pediu para sair, para ninguém receber duas vezes.')) return;
    start(async () => {
      const res = await apagarImportadosAction(props.slug);
      if (!res.ok) return setErro(res.error ?? 'Não foi possível apagar.');
      setLista([]);
      setTrocar(true);
      router.refresh();
    });
  };

  const escrever = () => {
    setErro('');
    start(async () => {
      const res = await escreverMensagemAction(props.slug, oferta);
      if (!res.ok) return setErro(res.error);
      setMensagem(res.texto);
      setFeitoIa(res.ia);
    });
  };

  const enviado = (c: Escolhido) => {
    setLista((l) => l.filter((x) => x.phone !== c.phone));
    start(async () => {
      await marcarEnviadoAction(props.slug, c.phone);
    });
  };

  const saiu = (c: Escolhido) => {
    setLista((l) => l.filter((x) => x.phone !== c.phone));
    start(async () => {
      const res = await setOptOutAction(props.slug, c.phone, true);
      if (!res.ok) setErro(res.error ?? 'Não foi possível salvar.');
    });
  };

  return (
    <section className="card space-y-5 p-5" aria-labelledby="reativar">
      <div>
        <h2 id="reativar" className="text-lg font-bold">
          Reativar clientes do Anota Aí
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          Suba a exportação de clientes do Anota Aí. O painel escolhe os {50} que mais vale chamar este mês e cada um ganha um botão que abre o seu WhatsApp com a mensagem pronta. Sai do seu celular, sem custo por mensagem.
        </p>
      </div>

      {props.resumo && !trocar ? (
        <div className="rounded-lg border border-line bg-white p-4 text-sm">
          <p>
            <b>{props.resumo.total}</b> clientes com celular, importados de <b>{props.resumo.fonte}</b> em {fmtDia(props.resumo.importadoEm)} por {props.resumo.aceitePor}. Aceite de ofertas confirmado pela loja.
          </p>
          <p className="mt-1 text-ink-mute">{props.resumo.enviadosNoMes} chamados nos últimos 30 dias. Quem já foi chamado só volta a aparecer depois de 30 dias. A lista fica guardada no painel até você apagar ou subir uma nova.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="btn-ghost min-h-10" onClick={() => setTrocar(true)}>
              Subir lista nova
            </button>
            <button type="button" className="btn-ghost min-h-10 text-bad" onClick={apagar} disabled={pending}>
              Apagar lista
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 rounded-lg border border-line bg-white p-4">
          <ol className="list-decimal space-y-1 pl-5 text-sm text-ink-soft">
            <li>No Anota Aí, abra Clientes e exporte “Clientes inativos” (e, se quiser, “Clientes ativos”).</li>
            <li>Escolha o arquivo aqui (pode escolher os dois de uma vez).</li>
          </ol>
          <label htmlFor="reativar-arquivo" className="label">
            Planilha de clientes (.xlsx ou .csv)
          </label>
          <input id="reativar-arquivo" type="file" accept=".xlsx,.csv" multiple className="field" onChange={(e) => ler(e.target.files)} />
          {lidos && (
            <>
              <p className="text-sm" role="status">
                <b>{lidos.clientes.length}</b> clientes com celular válido{lidos.semCelular ? ` · ${lidos.semCelular} sem celular ficaram de fora` : ''}.
              </p>
              <label className="flex items-start gap-3 text-sm">
                <input type="checkbox" className="mt-1 h-5 w-5" checked={aceite} onChange={(e) => setAceite(e.target.checked)} />
                <span>Confirmo que cada cliente desta lista disse que quer receber ofertas desta loja pelo WhatsApp (por exemplo, marcou isso ao pedir ou me autorizou). Se não tenho certeza de algum, não o coloquei na lista. Guardo a prova disso e sou o responsável pelos dados.</span>
              </label>
              <button type="button" className="btn-primary min-h-11" onClick={importar} disabled={!aceite || pending}>
                {pending ? 'Importando…' : `Importar ${lidos.clientes.length} clientes`}
              </button>
            </>
          )}
          {props.resumo && (
            <button type="button" className="btn-ghost min-h-10" onClick={() => setTrocar(false)}>
              Cancelar
            </button>
          )}
        </div>
      )}

      {props.resumo && (
        <>
          <div className="space-y-3">
            <div>
              <label htmlFor="reativar-oferta" className="label">
                O que você quer oferecer? (opcional)
              </label>
              <input
                id="reativar-oferta"
                className="field"
                maxLength={300}
                placeholder="Ex.: terça tem smash em dobro pelo preço de um, até 25/11"
                value={oferta}
                onChange={(e) => setOferta(e.target.value)}
              />
              <p className="mt-1 text-xs text-ink-mute">Só escreva o que a loja vai cumprir: preço, validade e condições de verdade.</p>
            </div>
            <button type="button" className="btn-ghost min-h-11" onClick={escrever} disabled={pending}>
              {props.ia ? (pending ? 'Escrevendo…' : 'Escrever a mensagem com IA') : 'Montar a mensagem'}
            </button>
            <div>
              <label htmlFor="reativar-msg" className="label">
                Mensagem {feitoIa && <span className="chip ml-1 bg-accent/10 text-accent">escrita com IA: confira antes de enviar</span>}
              </label>
              <textarea id="reativar-msg" className="field min-h-32 resize-y" maxLength={700} value={mensagem} onChange={(e) => setMensagem(e.target.value)} />
            </div>
            {problema && (
              <p role="status" className="text-sm font-semibold text-warn">
                {problema}
              </p>
            )}
          </div>

          <div>
            <h3 className="font-bold">Os {lista.length} que mais vale chamar agora</h3>
            <p className="text-sm text-ink-mute">Quem mais pediu e está parado há um tempo (o melhor é de 1 a 4 meses). Toque em Enviar: o WhatsApp abre com a mensagem, é só mandar.</p>
            {lista.length === 0 ? (
              <p className="mt-3 text-sm text-ink-mute">Ninguém para chamar agora. Quem já foi chamado volta depois de 30 dias.</p>
            ) : (
              <ul className="mt-3 divide-y divide-line">
                {lista.map((c, i) => (
                  <li key={c.phone} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3">
                    <div className="min-w-0">
                      <p className="font-semibold">
                        <span className="mr-2 text-ink-mute tabular-nums">{i + 1}.</span>
                        {c.name}
                      </p>
                      <p className="text-sm text-ink-mute tabular-nums">
                        {fmtPhone(c.phone)} · {c.motivo}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {!problema && (
                        <a
                          className="btn min-h-10 border border-ok/40 bg-ok/5 text-ok hover:bg-ok hover:text-white"
                          href={`https://wa.me/55${c.phone}?text=${encodeURIComponent(mensagem)}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => enviado(c)}
                        >
                          Enviar
                        </a>
                      )}
                      <button type="button" className="btn-ghost min-h-10" onClick={() => saiu(c)}>
                        Pediu para sair
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      {erro && (
        <p role="alert" className="text-sm font-semibold text-bad">
          {erro}
        </p>
      )}
    </section>
  );
}
