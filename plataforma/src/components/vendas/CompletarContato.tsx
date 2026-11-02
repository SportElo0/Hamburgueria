'use client';

import { useState, useTransition } from 'react';
import { completarAction } from '@/app/painel/oportunidades/vendas/actions';
import { FONTES, type FonteContato } from '@/lib/vendas/regras';

/** Qualifying an imported company: name, business e-mail and where it was found. Nothing comes from Google. */
export function CompletarContato({ id, inicial }: { id: string; inicial: { negocio: string; email: string; fonteTipo?: FonteContato; fonteUrl?: string } }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);
  const [v, setV] = useState({ negocio: inicial.negocio, email: inicial.email.includes('*') ? '' : inicial.email, fonteTipo: inicial.fonteTipo ?? '', fonteUrl: inicial.fonteUrl ?? '', conferido: false });

  return (
    <form
      className="grid gap-3 md:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          setMsg(null);
          const r = await completarAction(id, v);
          setMsg(r.ok ? { ok: true, texto: 'Contato completo. Já dá para preparar o e-mail.' } : { ok: false, texto: r.error });
        });
      }}
    >
      <div>
        <label className="label" htmlFor="c-negocio">
          Nome do negócio
        </label>
        <input id="c-negocio" className="field" required maxLength={80} value={v.negocio} onChange={(e) => setV({ ...v, negocio: e.target.value })} placeholder="Como aparece no site ou no Instagram dele" />
      </div>
      <div>
        <label className="label" htmlFor="c-email">
          E-mail comercial
        </label>
        <input id="c-email" type="email" className="field" required maxLength={120} value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} placeholder="contato@negocio.com.br" />
      </div>
      <div>
        <label className="label" htmlFor="c-fonte-tipo">
          Onde acharam o e-mail
        </label>
        <select id="c-fonte-tipo" className="field" required value={v.fonteTipo} onChange={(e) => setV({ ...v, fonteTipo: e.target.value })}>
          <option value="" disabled>
            Escolha
          </option>
          {FONTES.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nome}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="c-fonte-url">
          Link da página onde está o e-mail
        </label>
        <input id="c-fonte-url" type="url" className="field" required value={v.fonteUrl} onChange={(e) => setV({ ...v, fonteUrl: e.target.value })} placeholder="https://..." />
      </div>
      <label className="flex items-start gap-2 text-sm md:col-span-2">
        <input type="checkbox" className="mt-1" checked={v.conferido} onChange={(e) => setV({ ...v, conferido: e.target.checked })} required />
        <span>Conferi que este endereço está publicado pelo próprio negócio como canal comercial (não é e-mail pessoal), que não veio do Google e que o link colado mostra o endereço.</span>
      </label>
      <div className="md:col-span-2">
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? 'Salvando…' : 'Salvar e qualificar'}
        </button>
        {msg && (
          <p role={msg.ok ? 'status' : 'alert'} className={`mt-2 text-sm font-semibold ${msg.ok ? 'text-ok' : 'text-bad'}`}>
            {msg.texto}
          </p>
        )}
      </div>
    </form>
  );
}
