'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { CalculoError, brl, fmtBps, simularCombo, simularDesconto, simularPreco, type EntradaUnidade, type ResultadoUnidade } from '@/lib/conselheiro/calculos';
import type { BaseSimulador } from '@/lib/conselheiro/registros';
import { salvarSimulacaoAction } from '@/app/loja/[slug]/dono/conselheiro/actions';

type Aba = 'preco' | 'desconto' | 'combo';

/** "12,50" → 1250; vazio → null; inválido → NaN. */
function reais(t: string): number | null {
  const s = t.replace(/R\$|\s/g, '');
  if (!s) return null;
  const n = s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s;
  if (!/^\d+(\.\d{0,2})?$/.test(n)) return NaN;
  return Math.round(Number(n) * 100);
}
function pct(t: string): number | null {
  const s = t.replace(/%|\s/g, '').replace(',', '.');
  if (!s) return null;
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(s)) return NaN;
  return Math.round(Number(s) * 100);
}
const txtR = (c: number | null) => (c === null ? '' : (c / 100).toFixed(2).replace('.', ','));
const txtP = (b: number | null) => (b === null ? '' : String(b / 100).replace('.', ','));
const inteiro = (t: string) => (t.trim() === '' ? null : /^\d+$/.test(t.trim()) ? Number(t.trim()) : NaN);

interface Campos {
  preco: string;
  ingredientes: string;
  embalagem: string;
  outros: string;
  comissao: string;
  pagamento: string;
  tributos: string;
  bruto: boolean;
}
const camposDe = (b: EntradaUnidade | null): Campos => ({
  preco: txtR(b?.preco ?? null),
  ingredientes: txtR(b?.custos.ingredientes ?? null),
  embalagem: txtR(b?.custos.embalagem ?? null),
  outros: txtR(b?.custos.outros ?? null),
  comissao: txtP(b?.taxas.comissaoBps ?? null),
  pagamento: txtP(b?.taxas.pagamentoBps ?? null),
  tributos: txtP(b?.taxas.tributosBps ?? null),
  bruto: b?.taxas.comissaoBase === 'bruto',
});

function unidadeDe(c: Campos): EntradaUnidade {
  const nums = { preco: reais(c.preco), ingredientes: reais(c.ingredientes), embalagem: reais(c.embalagem), outros: reais(c.outros), comissao: pct(c.comissao), pagamento: pct(c.pagamento), tributos: pct(c.tributos) };
  for (const [k, v] of Object.entries(nums)) if (Number.isNaN(v)) throw new CalculoError(`Valor inválido em ${k}.`);
  if (nums.preco === null) throw new CalculoError('Informe o preço de hoje.');
  return { preco: nums.preco, desconto: 0, custos: { ingredientes: nums.ingredientes, embalagem: nums.embalagem, outros: nums.outros }, taxas: { comissaoBps: nums.comissao, comissaoBase: c.bruto ? 'bruto' : 'liquido', pagamentoBps: nums.pagamento, tributosBps: nums.tributos } };
}

function Campo({ id, label, value, onChange, hint }: { id: string; label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  return (
    <div>
      <label className="label" htmlFor={id}>{label}</label>
      <input id={id} className="field" inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} placeholder={hint ?? 'não informado'} />
    </div>
  );
}

function Unidade({ titulo, r }: { titulo: string; r: ResultadoUnidade }) {
  const linha = (n: string, v: number | null) => (
    <div className="flex justify-between gap-3">
      <dt className="text-ink-soft">{n}</dt>
      <dd className="tabular-nums whitespace-nowrap">{v === null ? 'fora da conta' : `− ${brl(v)}`}</dd>
    </div>
  );
  return (
    <div className="rounded-lg border border-line p-4">
      <p className="font-bold">{titulo}</p>
      <dl className="mt-2 space-y-1 text-sm">
        <div className="flex justify-between gap-3"><dt className="text-ink-soft">Receita da unidade</dt><dd className="tabular-nums whitespace-nowrap">{brl(r.receita)}</dd></div>
        {linha('Ingredientes', r.ingredientes)}
        {linha('Embalagem', r.embalagem)}
        {linha('Outros', r.outros)}
        {linha('Comissão', r.comissao)}
        {linha('Taxa de pagamento', r.pagamento)}
        {linha('Tributo', r.tributos)}
        <div className="flex justify-between gap-3 border-t border-line pt-1 font-bold"><dt>{r.rotulo[0].toUpperCase() + r.rotulo.slice(1)}</dt><dd className="text-right tabular-nums whitespace-nowrap">{r.contribuicao === null ? '—' : brl(r.contribuicao)} {r.margemBps !== null && <span className="font-normal text-ink-mute">({fmtBps(r.margemBps)})</span>}</dd></div>
      </dl>
    </div>
  );
}

export function Simulador({ slug, bases, inicial }: { slug: string; bases: BaseSimulador[]; inicial: { produto?: string; canal?: string; aba?: Aba } }) {
  const base = `/loja/${slug}/dono/conselheiro`;
  const produtos = [...new Map(bases.map((b) => [b.produtoId, b.produtoNome])).entries()];
  const canais = [...new Map(bases.map((b) => [b.canalId, b.canalNome])).entries()];
  const [aba, setAba] = useState<Aba>(inicial.aba ?? 'preco');
  const [produtoId, setProdutoId] = useState(inicial.produto && produtos.some(([id]) => id === inicial.produto) ? inicial.produto : (produtos[0]?.[0] ?? ''));
  const [canalId, setCanalId] = useState(inicial.canal && canais.some(([id]) => id === inicial.canal) ? inicial.canal : (canais[0]?.[0] ?? ''));
  const sel = bases.find((b) => b.produtoId === produtoId && b.canalId === canalId) ?? null;
  const [campos, setCampos] = useState<Campos>(camposDe(sel?.base ?? null));
  const [volume, setVolume] = useState(sel?.volumeAtual === null || sel === null ? '' : String(sel.volumeAtual));
  const [novoPreco, setNovoPreco] = useState('');
  const [cenarios, setCenarios] = useState('');
  const [desconto, setDesconto] = useState('10');
  const [capacidade, setCapacidade] = useState('');
  // Combo
  const [itens, setItens] = useState<{ id: string; q: number }[]>([]);
  const [principal, setPrincipal] = useState('');
  const [precoCombo, setPrecoCombo] = useState('');
  const [vendasCombo, setVendasCombo] = useState('100');
  const [mix, setMix] = useState({ ja: '50', so: '30', novos: '20' });
  const [embCombo, setEmbCombo] = useState('');
  // Salvar
  const [titulo, setTitulo] = useState('');
  const [criarDecisao, setCriarDecisao] = useState(false);
  const [rec, setRec] = useState({ recomendacao: '', riscos: '', proximoPasso: '' });
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);
  const [pending, start] = useTransition();

  function escolher(p: string, c: string) {
    setProdutoId(p);
    setCanalId(c);
    const b = bases.find((x) => x.produtoId === p && x.canalId === c) ?? null;
    setCampos(camposDe(b?.base ?? null));
    setVolume(b?.volumeAtual == null ? '' : String(b.volumeAtual));
    setMsg(null);
  }
  const set = (k: keyof Campos) => (v: string) => setCampos((c) => ({ ...c, [k]: v }));

  const calc = useMemo(() => {
    try {
      if (aba === 'combo') {
        const linhas = itens.map((i) => {
          const b = bases.find((x) => x.produtoId === i.id && x.canalId === canalId);
          if (!b?.base) throw new CalculoError(`${b?.produtoNome ?? 'Item'} sem preço neste canal.`);
          return { id: i.id, nome: b.produtoNome, quantidade: i.q, precoAvulso: b.base.preco, custoUnitario: b.base.custos.ingredientes };
        });
        const pc = reais(precoCombo);
        if (pc === null || Number.isNaN(pc)) throw new CalculoError('Informe o preço do combo.');
        const ref = bases.find((x) => x.canalId === canalId && x.base)?.base;
        const m = { jaCompravamBps: pct(mix.ja) ?? 0, soPrincipalBps: pct(mix.so) ?? 0, novosBps: pct(mix.novos) ?? 0 };
        const emb = reais(embCombo);
        const v = inteiro(vendasCombo);
        if (v === null || Number.isNaN(v)) throw new CalculoError('Informe quantos combos imagina vender.');
        const entrada = { canalId, origemVolume: 'hipótese do simulador', itens: linhas, principalId: principal || linhas[0]?.id || '', precoCombo: pc, taxas: ref?.taxas ?? { comissaoBps: null, comissaoBase: 'liquido' as const, pagamentoBps: null, tributosBps: null }, embalagem: Number.isNaN(emb) ? null : emb, vendasCombo: v, mix: m };
        return { ok: true as const, tipo: 'combo' as const, entrada, r: simularCombo(entrada) };
      }
      const u = unidadeDe(campos);
      const vol = inteiro(volume);
      if (Number.isNaN(vol)) throw new CalculoError('Volume deve ser um número inteiro.');
      const vols = cenarios.split(/[;,\s]+/).filter(Boolean).map(Number);
      if (vols.some((v) => !Number.isInteger(v) || v < 0)) throw new CalculoError('Cenários: números inteiros separados por vírgula.');
      if (aba === 'preco') {
        const np = reais(novoPreco);
        if (np === null || Number.isNaN(np)) throw new CalculoError('Informe o preço novo.');
        const entrada = { produtoId, canalId, origemVolume: sel?.origemVolume ?? 'informado', atual: u, proposto: { ...u, preco: np }, volumeAtual: vol, volumes: vols.slice(0, 12) };
        return { ok: true as const, tipo: 'preco' as const, entrada, r: simularPreco(entrada) };
      }
      const d = pct(desconto);
      if (d === null || Number.isNaN(d)) throw new CalculoError('Informe o desconto.');
      const cap = inteiro(capacidade);
      const entrada = { produtoId, canalId, origemVolume: sel?.origemVolume ?? 'informado', base: u, descontoBps: d, volumeAtual: vol, volumes: vols.slice(0, 12), capacidade: Number.isNaN(cap) ? null : cap };
      return { ok: true as const, tipo: 'desconto' as const, entrada, r: simularDesconto(entrada) };
    } catch (err) {
      return { ok: false as const, erro: err instanceof CalculoError ? err.message : 'Confira os valores.' };
    }
  }, [aba, campos, volume, novoPreco, cenarios, desconto, capacidade, itens, principal, precoCombo, vendasCombo, mix, embCombo, canalId, produtoId, bases, sel]);

  const salvar = () =>
    start(async () => {
      if (!calc.ok) return;
      const r = await salvarSimulacaoAction(slug, { tipo: calc.tipo, titulo: titulo || `${aba === 'combo' ? 'Combo' : sel?.produtoNome ?? 'Simulação'} (${aba})`, entrada: calc.entrada, decisao: criarDecisao ? rec : null });
      setMsg({ ok: r.ok, texto: r.msg });
    });

  if (!bases.length) {
    return (
      <p className="text-ink-soft">
        Para simular, cadastre um canal e ao menos um produto em <Link className="font-semibold text-accent" href={`${base}/cadastro`}>Cadastro</Link>.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <div role="tablist" className="flex gap-2">
        {(['preco', 'desconto', 'combo'] as Aba[]).map((a) => (
          <button key={a} role="tab" type="button" aria-selected={aba === a} onClick={() => setAba(a)} className={aba === a ? 'btn-primary' : 'btn-ghost'}>
            {a === 'preco' ? 'Preço' : a === 'desconto' ? 'Promoção' : 'Combo'}
          </button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
        <section className="card space-y-4 p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            {aba !== 'combo' && (
              <div>
                <label className="label" htmlFor="sim-prod">Produto</label>
                <select id="sim-prod" className="field" value={produtoId} onChange={(e) => escolher(e.target.value, canalId)}>
                  {produtos.map(([id, nome]) => <option key={id} value={id}>{nome}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="label" htmlFor="sim-canal">Canal</label>
              <select id="sim-canal" className="field" value={canalId} onChange={(e) => escolher(produtoId, e.target.value)}>
                {canais.map(([id, nome]) => <option key={id} value={id}>{nome}</option>)}
              </select>
            </div>
          </div>

          {aba !== 'combo' ? (
            <>
              {sel && sel.faltando.length > 0 && <p className="rounded-lg bg-warn/10 px-3 py-2 text-sm text-warn">Falta: {sel.faltando.join(', ')}. Dá para digitar abaixo como hipótese.</p>}
              <p className="text-xs text-ink-mute">Valores preenchidos com o que está registrado hoje. Mudou um número? Ele vira hipótese na simulação salva.</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Campo id="s-preco" label="Preço de hoje (R$)" value={campos.preco} onChange={set('preco')} />
                <Campo id="s-ing" label="Ingredientes (R$)" value={campos.ingredientes} onChange={set('ingredientes')} />
                <Campo id="s-emb" label="Embalagem (R$)" value={campos.embalagem} onChange={set('embalagem')} />
                <Campo id="s-out" label="Outros (R$)" value={campos.outros} onChange={set('outros')} />
                <Campo id="s-com" label="Comissão (%)" value={campos.comissao} onChange={set('comissao')} />
                <Campo id="s-pag" label="Pagamento (%)" value={campos.pagamento} onChange={set('pagamento')} />
                <Campo id="s-trib" label="Tributo (%)" value={campos.tributos} onChange={set('tributos')} />
                <div>
                  <label className="label" htmlFor="s-vol">Volume no período</label>
                  <input id="s-vol" className="field" inputMode="numeric" value={volume} onChange={(e) => setVolume(e.target.value)} placeholder="unidades" />
                  <p className="mt-1 text-xs text-ink-mute">{sel?.origemVolume}</p>
                </div>
              </div>
              {aba === 'preco' ? (
                <div className="grid grid-cols-2 gap-3">
                  <Campo id="s-novo" label="Preço novo (R$)" value={novoPreco} onChange={setNovoPreco} hint="ex.: 35,00" />
                  <div>
                    <label className="label" htmlFor="s-cen">Cenários de volume (hipóteses)</label>
                    <input id="s-cen" className="field" value={cenarios} onChange={(e) => setCenarios(e.target.value)} placeholder="80, 90, 100" />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Campo id="s-desc" label="Desconto (%)" value={desconto} onChange={setDesconto} />
                  <div>
                    <label className="label" htmlFor="s-cap">A cozinha aguenta (unidades no período)</label>
                    <input id="s-cap" className="field" inputMode="numeric" value={capacidade} onChange={(e) => setCapacidade(e.target.value)} placeholder="não sei" />
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <fieldset>
                <legend className="label">Itens do combo (preço e custo de cada um neste canal)</legend>
                <div className="space-y-2">
                  {itens.map((i, n) => (
                    <div key={n} className="flex flex-wrap items-center gap-2">
                      <select aria-label="Item" className="field w-auto flex-1" value={i.id} onChange={(e) => setItens(itens.map((x, k) => (k === n ? { ...x, id: e.target.value } : x)))}>
                        {produtos.map(([id, nome]) => <option key={id} value={id}>{nome}</option>)}
                      </select>
                      <input aria-label="Quantidade" className="field w-16" inputMode="numeric" value={i.q} onChange={(e) => setItens(itens.map((x, k) => (k === n ? { ...x, q: Math.max(1, Math.min(20, Number(e.target.value) || 1)) } : x)))} />
                      <label className="flex items-center gap-1 text-sm"><input type="radio" name="principal" checked={(principal || itens[0]?.id) === i.id} onChange={() => setPrincipal(i.id)} /> principal</label>
                      <button type="button" className="btn-ghost" onClick={() => setItens(itens.filter((_, k) => k !== n))}>Tirar</button>
                    </div>
                  ))}
                  {itens.length < 8 && <button type="button" className="btn-ghost" onClick={() => setItens([...itens, { id: produtos[0][0], q: 1 }])}>Adicionar item</button>}
                </div>
              </fieldset>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Campo id="c-preco" label="Preço do combo (R$)" value={precoCombo} onChange={setPrecoCombo} />
                <Campo id="c-emb" label="Embalagem do combo (R$)" value={embCombo} onChange={setEmbCombo} />
                <div><label className="label" htmlFor="c-vol">Combos no período (hipótese)</label><input id="c-vol" className="field" inputMode="numeric" value={vendasCombo} onChange={(e) => setVendasCombo(e.target.value)} /></div>
              </div>
              <fieldset>
                <legend className="label">De cada 100 combos vendidos, quantos seriam de quem… (hipótese, soma 100)</legend>
                <div className="grid grid-cols-3 gap-3">
                  <Campo id="m-ja" label="já compraria tudo (%)" value={mix.ja} onChange={(v) => setMix({ ...mix, ja: v })} />
                  <Campo id="m-so" label="só o principal (%)" value={mix.so} onChange={(v) => setMix({ ...mix, so: v })} />
                  <Campo id="m-novo" label="não compraria nada (%)" value={mix.novos} onChange={(v) => setMix({ ...mix, novos: v })} />
                </div>
              </fieldset>
            </>
          )}
        </section>

        <section className="card space-y-4 p-5" aria-live="polite">
          <h2 className="text-lg font-bold">Resultado</h2>
          {!calc.ok ? (
            <p className="text-ink-soft">{calc.erro}</p>
          ) : calc.tipo === 'combo' ? (
            <div className="space-y-3 text-sm">
              <p>Separados: <strong>{brl(calc.r.precoSeparado)}</strong> · combo: <strong>{brl(calc.entrada.precoCombo)}</strong> (desconto de {brl(calc.r.descontoCombo)}, {fmtBps(calc.r.descontoComboBps)})</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Unidade titulo="Combo" r={calc.r.combo} />
                <Unidade titulo="Itens separados" r={calc.r.separado} />
              </div>
              {calc.r.status === 'ok' && (
                <div className="rounded-lg bg-paper p-3">
                  <p className="font-semibold">Ganho ou perda por combo, comparado a sem combo</p>
                  <ul className="mt-1 space-y-0.5">
                    <li>Quem já compraria tudo: <strong className="tabular-nums">{brl(calc.r.incrementalPorTipo.jaCompravam)}</strong></li>
                    <li>Quem compraria só o principal: <strong className="tabular-nums">{brl(calc.r.incrementalPorTipo.soPrincipal)}</strong></li>
                    <li>Quem não compraria nada: <strong className="tabular-nums">{brl(calc.r.incrementalPorTipo.novos)}</strong></li>
                  </ul>
                  <p className="mt-2">Pelo seu mix, {calc.r.vendasCombo} combos: <strong className="tabular-nums">{brl(calc.r.incrementalTotal)}</strong> de contribuição a mais. Contar tudo como venda nova daria {brl(calc.r.seTudoFosseNovo)}, o que exagera.</p>
                </div>
              )}
              {calc.r.avisos.map((a) => <p key={a} className="text-warn">{a}</p>)}
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                <Unidade titulo="Hoje" r={calc.r.atual} />
                <Unidade titulo={calc.tipo === 'preco' ? 'Proposto' : 'Com desconto'} r={calc.r.proposto} />
              </div>
              {calc.r.totalAtual !== null && <p>Contribuição total hoje ({calc.r.volumeAtual} un.): <strong className="tabular-nums">{brl(calc.r.totalAtual)}</strong></p>}
              {calc.r.equilibrio.volume ? (
                <p className="rounded-lg bg-accent-soft p-3">
                  Para manter a contribuição total: <strong>{calc.r.equilibrio.volume.exato} unidades</strong> (pelo menos {calc.r.equilibrio.volume.inteiro}).{' '}
                  {calc.r.equilibrio.folgaBps !== null && (calc.r.equilibrio.folgaBps >= 0 ? `Dá para vender até ${fmtBps(calc.r.equilibrio.folgaBps)} menos (${calc.r.equilibrio.folgaUnidades} un.) sem perder contribuição.` : `Precisa vender ${fmtBps(-calc.r.equilibrio.folgaBps)} a mais (${-calc.r.equilibrio.folgaUnidades!} un.).`)}
                </p>
              ) : (
                calc.r.equilibrio.observacao && <p className="rounded-lg bg-paper p-3">{calc.r.equilibrio.observacao}</p>
              )}
              {calc.r.cenarios.length > 0 && (
                <table className="w-full text-sm">
                  <thead className="text-left text-ink-mute"><tr><th>Volume (hipótese)</th><th>Contribuição total</th><th>Contra hoje</th></tr></thead>
                  <tbody>
                    {calc.r.cenarios.map((c) => (
                      <tr key={c.volume} className="border-t border-line"><td className="py-1">{c.volume}</td><td className="tabular-nums">{brl(c.total)}</td><td className={`tabular-nums ${c.diferenca !== null && c.diferenca < 0 ? 'text-bad' : 'text-ok'}`}>{c.diferenca === null ? '—' : `${c.diferenca >= 0 ? '+' : ''}${brl(c.diferenca)}`}</td></tr>
                    ))}
                  </tbody>
                </table>
              )}
              {calc.r.avisos.map((a) => <p key={a} className="text-warn">{a}</p>)}
              <p className="text-xs text-ink-mute">Os volumes são hipóteses: ninguém sabe quantas pessoas vão comprar. Contribuição não é lucro.</p>
            </div>
          )}

          {calc.ok && (
            <div className="space-y-3 border-t border-line pt-4">
              <div><label className="label" htmlFor="s-tit">Nome da simulação</label><input id="s-tit" className="field" maxLength={140} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Clássico a R$ 35 no app" /></div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={criarDecisao} onChange={(e) => setCriarDecisao(e.target.checked)} /> Criar também uma decisão para aprovar</label>
              {criarDecisao && (
                <div className="space-y-2">
                  <div><label className="label" htmlFor="d-rec">O que fazer</label><textarea id="d-rec" className="field min-h-16" maxLength={1200} value={rec.recomendacao} onChange={(e) => setRec({ ...rec, recomendacao: e.target.value })} placeholder="Ex.: testar R$ 35 por 14 dias no app" /></div>
                  <div><label className="label" htmlFor="d-ris">Riscos (um por linha)</label><textarea id="d-ris" className="field min-h-16" maxLength={900} value={rec.riscos} onChange={(e) => setRec({ ...rec, riscos: e.target.value })} /></div>
                  <div><label className="label" htmlFor="d-pp">Próximo passo</label><input id="d-pp" className="field" maxLength={400} value={rec.proximoPasso} onChange={(e) => setRec({ ...rec, proximoPasso: e.target.value })} /></div>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" className="btn-primary" onClick={salvar} disabled={pending}>{pending ? 'Salvando…' : 'Salvar simulação'}</button>
                {msg && <p role="status" className={`text-sm font-semibold ${msg.ok ? 'text-ok' : 'text-bad'}`}>{msg.texto} {msg.ok && criarDecisao && <Link className="underline" href={`${base}/decisoes`}>Ver decisões</Link>}</p>}
              </div>
              <p className="text-xs text-ink-mute">A conta é refeita no servidor ao salvar, com a fotografia dos dados usados.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
