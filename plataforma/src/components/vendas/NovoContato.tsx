'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { criarContatoAction } from '@/app/painel/oportunidades/vendas/actions';
import { FONTES } from '@/lib/vendas/regras';
import { SEGMENTOS } from '@/lib/oportunidades/regras';

interface Props {
  placeId?: string;
  /** Prefill from the team's own lead data (city, segment); the business name is always typed. */
  cidade?: string;
  uf?: string;
  segmento?: string;
}

export function NovoContato({ placeId, cidade = '', uf = '', segmento = '' }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState('');

  // onSubmit (not a form action): a form action clears every field afterwards, and on an error the team would retype it all.
  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    start(async () => {
      setError('');
      const r = await criarContatoAction({
        placeId: placeId ?? '',
        negocio: form.get('negocio'),
        email: form.get('email'),
        fonteTipo: form.get('fonteTipo'),
        fonteUrl: form.get('fonteUrl'),
        cidade: form.get('cidade'),
        uf: form.get('uf'),
        segmento: form.get('segmento'),
        observacoes: form.get('observacoes'),
        conferido: form.get('conferido') === 'on',
      });
      if (!r.ok) setError(r.error);
      else router.push(`/painel/oportunidades/vendas/${r.dados.id}`);
    });
  }

  return (
    <form onSubmit={enviar} className="card mt-6 grid gap-4 p-5 md:grid-cols-2">
      <div>
        <label className="label" htmlFor="negocio">
          Nome do negócio
        </label>
        <input id="negocio" name="negocio" className="field" required maxLength={80} placeholder="Como aparece no site ou no Instagram dele" />
      </div>
      <div>
        <label className="label" htmlFor="email">
          E-mail comercial
        </label>
        <input id="email" name="email" type="email" className="field" required maxLength={120} placeholder="contato@negocio.com.br" />
      </div>
      <div>
        <label className="label" htmlFor="fonteTipo">
          Onde vocês acharam o e-mail
        </label>
        <select id="fonteTipo" name="fonteTipo" className="field" required defaultValue="">
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
        <label className="label" htmlFor="fonteUrl">
          Link da página onde está o e-mail
        </label>
        <input id="fonteUrl" name="fonteUrl" type="url" className="field" required placeholder="https://..." />
      </div>
      <div className="grid grid-cols-[1fr_5rem] gap-3">
        <div>
          <label className="label" htmlFor="cidade">
            Cidade
          </label>
          <input id="cidade" name="cidade" className="field" maxLength={60} defaultValue={cidade} />
        </div>
        <div>
          <label className="label" htmlFor="uf">
            UF
          </label>
          <input id="uf" name="uf" className="field uppercase" maxLength={2} defaultValue={uf} />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="segmento">
          Ramo
        </label>
        <select id="segmento" name="segmento" className="field" defaultValue={segmento}>
          <option value="">Não informar</option>
          {SEGMENTOS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nome}
            </option>
          ))}
        </select>
      </div>
      <div className="md:col-span-2">
        <label className="label" htmlFor="observacoes">
          Observações (opcional)
        </label>
        <textarea id="observacoes" name="observacoes" className="field min-h-20" maxLength={1000} placeholder="Sobre o negócio, nunca sobre pessoas (nada de dados pessoais, saúde, família etc.)" />
      </div>
      <label className="flex items-start gap-2 text-sm md:col-span-2">
        <input type="checkbox" name="conferido" className="mt-1" required />
        <span>
          Conferi que este endereço está publicado pelo próprio negócio como canal comercial (não é e-mail pessoal de alguém), que não veio do Google e que
          o link colado mostra o endereço. Se o negócio pedir para não ser contatado, ele vai para a lista de bloqueio.
        </span>
      </label>
      {error && (
        <p role="alert" className="text-sm font-semibold text-bad md:col-span-2">
          {error}
        </p>
      )}
      <div className="md:col-span-2">
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? 'Salvando…' : 'Cadastrar contato'}
        </button>
      </div>
    </form>
  );
}
