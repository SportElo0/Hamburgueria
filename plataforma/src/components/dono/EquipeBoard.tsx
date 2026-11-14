'use client';

import { useState } from 'react';
import { equipeAdicionarAction, equipeFuncaoAction, equipeNovaSenhaAction, equipeRemoverAction } from '@/app/loja/[slug]/dono/actions';

export interface LoginEquipe {
  email: string;
  name: string;
  /** undefined = an old login, which is the owner's. */
  funcao?: 'dono' | 'cozinha' | 'garcom';
}

const NOME = { dono: 'Dono', cozinha: 'Cozinha', garcom: 'Garçom' } as const;
const VE = { dono: 'painel do dono e todas as telas', cozinha: 'pedidos, abrir e fechar a loja, esgotados', garcom: 'salão, mesas, mapa e fila' } as const;

/** The owner's own staff logins: add kitchen and waiter logins, change between the two, new password, remove. */
export function EquipeBoard({ slug, logins: inicial, eu }: { slug: string; logins: LoginEquipe[]; eu: string }) {
  const [logins, setLogins] = useState(inicial);
  const [busy, setBusy] = useState('');
  const [erro, setErro] = useState('');
  const [entrega, setEntrega] = useState<{ name: string; email: string; password: string } | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [funcao, setFuncao] = useState<'cozinha' | 'garcom'>('garcom');
  const [remover, setRemover] = useState('');

  const rodar = async (chave: string, fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setBusy(chave);
    setErro('');
    try {
      const r = await fn();
      if (!r.ok) setErro(r.error ?? 'Não foi possível salvar.');
      return r.ok;
    } catch {
      setErro('Sem conexão. Tente de novo.');
      return false;
    } finally {
      setBusy('');
    }
  };

  const copiar = async () => {
    if (!entrega) return;
    try {
      await navigator.clipboard.writeText(`Login: ${entrega.email}\nSenha: ${entrega.password}\nEntrar em: ${window.location.origin}/login`);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      setErro('Não deu para copiar. Anote a senha.');
    }
  };

  return (
    <div className="space-y-4">
      {entrega && (
        <section role="status" className="card border-2 border-ok bg-ok/5 p-5">
          <h2 className="text-lg font-bold">Senha de {entrega.name}</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Ela <strong>não aparece de novo</strong>. Entregue pessoalmente, nunca num grupo. A pessoa entra em <span className="font-mono">/login</span> no endereço deste painel.
          </p>
          <p className="mt-3 rounded-lg bg-white p-3 font-mono text-[15px] leading-relaxed">
            {entrega.email}
            <br />
            <span className="text-lg font-bold tracking-wide">{entrega.password}</span>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="btn-ghost min-h-11" onClick={copiar}>
              {copiado ? 'Copiado' : 'Copiar login e senha'}
            </button>
            <button type="button" className="btn-primary min-h-11" onClick={() => setEntrega(null)}>
              Já entreguei
            </button>
          </div>
        </section>
      )}

      <section className="card p-5" aria-labelledby="quem-acessa">
        <h2 id="quem-acessa" className="text-lg font-bold">
          Quem acessa a loja
        </h2>
        <ul className="mt-3 divide-y divide-line rounded-lg border border-line">
          {logins.length === 0 && <li className="px-4 py-3 text-sm text-ink-mute">Nenhum login ainda.</li>}
          {logins.map((l) => {
            const f = l.funcao ?? 'dono';
            const equipe = f !== 'dono';
            return (
              <li key={l.email} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
                <div className="min-w-0">
                  <p className="font-semibold">
                    {l.name}
                    {l.email === eu && <span className="chip ml-2 bg-accent-soft text-accent">Você</span>}
                  </p>
                  <p className="text-sm text-ink-mute">
                    {l.email} · vê {VE[f]}
                  </p>
                </div>
                {equipe ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      aria-label={`Função de ${l.name}`}
                      className="field min-h-10 w-auto"
                      value={f}
                      disabled={Boolean(busy)}
                      onChange={async (e) => {
                        const nova = e.target.value as 'cozinha' | 'garcom';
                        if (await rodar(`f-${l.email}`, () => equipeFuncaoAction(slug, l.email, nova))) setLogins((ls) => ls.map((x) => (x.email === l.email ? { ...x, funcao: nova } : x)));
                      }}
                    >
                      <option value="cozinha">Cozinha</option>
                      <option value="garcom">Garçom</option>
                    </select>
                    <button
                      type="button"
                      className="btn-ghost min-h-10"
                      disabled={Boolean(busy)}
                      onClick={async () => {
                        let senha = '';
                        const ok = await rodar(`s-${l.email}`, async () => {
                          const r = await equipeNovaSenhaAction(slug, l.email);
                          senha = r.ok && typeof r.data === 'string' ? r.data : '';
                          return r;
                        });
                        if (ok && senha) setEntrega({ name: l.name, email: l.email, password: senha });
                      }}
                    >
                      {busy === `s-${l.email}` ? 'Gerando…' : 'Nova senha'}
                    </button>
                    {remover === l.email ? (
                      <span className="flex items-center gap-2">
                        <button
                          type="button"
                          className="btn-danger min-h-10"
                          disabled={Boolean(busy)}
                          onClick={async () => {
                            if (await rodar(`r-${l.email}`, () => equipeRemoverAction(slug, l.email))) setLogins((ls) => ls.filter((x) => x.email !== l.email));
                            setRemover('');
                          }}
                        >
                          {busy === `r-${l.email}` ? 'Removendo…' : 'Remover mesmo'}
                        </button>
                        <button type="button" className="btn-ghost min-h-10" onClick={() => setRemover('')}>
                          Cancelar
                        </button>
                      </span>
                    ) : (
                      <button type="button" className="btn-ghost min-h-10 text-bad" disabled={Boolean(busy)} onClick={() => setRemover(l.email)}>
                        Remover
                      </button>
                    )}
                  </div>
                ) : (
                  <span className="text-sm text-ink-mute">{NOME.dono} · só a Growlift muda</span>
                )}
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-xs text-ink-mute">Nova senha ou Remover tira a pessoa do sistema na próxima tela que ela abrir. Trocar a função vale na hora, sem nova senha.</p>
      </section>

      <section className="card p-5" aria-labelledby="novo-login">
        <h2 id="novo-login" className="text-lg font-bold">
          Novo login
        </h2>
        <p className="mt-1 text-sm text-ink-soft">Um login para cada pessoa: assim dá para tirar só quem saiu, e cada um usa só o seu.</p>
        <form
          className="mt-3 grid gap-3 md:grid-cols-[1fr_1fr_10rem_auto] md:items-end"
          onSubmit={async (e) => {
            e.preventDefault();
            let criado: { email: string; password: string } | null = null;
            const ok = await rodar('novo', async () => {
              const r = await equipeAdicionarAction(slug, { email, name: nome, funcao });
              criado = r.ok && r.data ? r.data : null;
              return r;
            });
            const c = criado as { email: string; password: string } | null;
            if (ok && c) {
              const n = nome.trim() || c.email;
              setLogins((ls) => [...ls.filter((x) => x.email !== c.email), { email: c.email, name: n, funcao }]);
              setEntrega({ name: n, email: c.email, password: c.password });
              setNome('');
              setEmail('');
            }
          }}
        >
          <div>
            <label htmlFor="eq-nome" className="label">
              Nome
            </label>
            <input id="eq-nome" className="field" value={nome} maxLength={60} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Marcos" required />
          </div>
          <div>
            <label htmlFor="eq-email" className="label">
              E-mail
            </label>
            <input id="eq-email" type="email" autoComplete="off" className="field" value={email} maxLength={120} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="eq-funcao" className="label">
              Função
            </label>
            <select id="eq-funcao" className="field" value={funcao} onChange={(e) => setFuncao(e.target.value as 'cozinha' | 'garcom')}>
              <option value="garcom">Garçom</option>
              <option value="cozinha">Cozinha</option>
            </select>
          </div>
          <button type="submit" className="btn-primary min-h-11" disabled={Boolean(busy)}>
            {busy === 'novo' ? 'Criando…' : 'Criar login'}
          </button>
        </form>
        <p className="mt-2 text-xs text-ink-mute">Garçom vê {VE.garcom}. Cozinha vê {VE.cozinha}. Login de dono só a Growlift cria.</p>
      </section>

      {erro && (
        <p role="alert" className="text-sm font-semibold text-bad">
          {erro}
        </p>
      )}
    </div>
  );
}
