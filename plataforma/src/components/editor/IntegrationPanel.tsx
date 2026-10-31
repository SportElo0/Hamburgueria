'use client';

import { useState } from 'react';

export function IntegrationPanel({ apiUrl, publishedAt }: { apiUrl: string; publishedAt: string | null }) {
  const [copied, setCopied] = useState('');
  const snippet = `<script>
  // Lê o catálogo publicado no painel. Se a rede falhar, o site usa os dados que já tem.
  fetch('${apiUrl}')
    .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
    .then((loja) => window.dispatchEvent(new CustomEvent('loja:dados', { detail: loja })))
    .catch(() => {});
</script>`;
  const copy = async (label: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(''), 1800);
  };
  return (
    <div className="grid gap-5">
      <section className="card space-y-3 p-5">
        <h2 className="text-lg font-bold">Endereço dos dados publicados</h2>
        <p className="text-sm text-ink-mute">
          O site da loja lê este endereço para mostrar cardápio, preços, horários e avisos. Só a versão <strong>publicada</strong> aparece aqui.
          {publishedAt ? ` Última publicação: ${new Date(publishedAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}.` : ' Esta loja ainda não foi publicada.'}
        </p>
        <div className="flex gap-2">
          <input readOnly aria-label="Endereço da API" className="field font-mono text-sm" value={apiUrl} />
          <button type="button" className="btn-ghost shrink-0" onClick={() => copy('url', apiUrl)}>
            {copied === 'url' ? 'Copiado' : 'Copiar'}
          </button>
          <a href={apiUrl} target="_blank" rel="noreferrer" className="btn-ghost shrink-0">
            Abrir
          </a>
        </div>
      </section>
      <section className="card space-y-3 p-5">
        <h2 className="text-lg font-bold">Código para o site</h2>
        <p className="text-sm text-ink-mute">Para sites feitos à mão: cole antes do fechamento do &lt;body&gt; e use o evento <code>loja:dados</code> para desenhar o cardápio.</p>
        <pre className="overflow-x-auto rounded-lg bg-ink p-4 text-[13px] leading-relaxed text-white">{snippet}</pre>
        <button type="button" className="btn-ghost" onClick={() => copy('code', snippet)}>
          {copied === 'code' ? 'Copiado' : 'Copiar código'}
        </button>
      </section>
    </div>
  );
}
