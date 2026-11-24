import { notFound } from 'next/navigation';
import { apagarRemetenteResumoAcao, gerarResumoEmailAcao } from '@/app/acoes';
import { dataHora } from '@/componentes/formato';
import { Enviar, Formulario } from '@/componentes/formulario';
import { q, um } from '@/server/db';
import { NOME_CATEGORIA, SLUG_EMAIL, emailConfigurado, type Categoria, type ItemImportante } from '@/server/resumo-email';
import { exigirCtx } from '@/server/sessao';

export const metadata = { title: 'E-mails' };

interface Linha {
  id: string;
  criado_em: Date;
  total: number;
  importantes: ItemImportante[];
  outros: Record<string, number>;
  erro: string | null;
}

/** Growlift only: the daily summary of the team's inbox, with what is important and why. Nothing from the message bodies is kept. */
export default async function Emails() {
  const ctx = await exigirCtx();
  if (ctx.papel !== 'admin') notFound();
  const e = await um<{ slug: string }>('select slug from empresas where id = $1', [ctx.empresaId]);
  if (e?.slug !== SLUG_EMAIL) notFound();
  const linhas = await q<Linha>('select id, criado_em, total, importantes, outros, erro from resumos_email where empresa_id = $1 order by criado_em desc limit 14', [ctx.empresaId]);
  const ligado = emailConfigurado();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">E-mails</h1>
        {ligado && (
          <Formulario acao={gerarResumoEmailAcao} className="flex items-center gap-2">
            <Enviar>Gerar o resumo agora</Enviar>
          </Formulario>
        )}
      </div>
      <p className="text-suave">Todo dia, de manhã, o sistema lê (só leitura) os e-mails novos da caixa da Growlift, a IA separa o que é importante e avisa vocês. Ele não responde, não apaga e não marca como lido. O texto dos e-mails não fica guardado: só o remetente, o assunto e o motivo, por 90 dias. As primeiras linhas de cada e-mail (sem links, telefones, CPF e e-mails soltos) vão para a IA da Anthropic só para classificar.</p>

      {!ligado && (
        <section className="card space-y-2 border-l-4 border-aviso">
          <h2 className="text-lg font-bold">Falta ligar a caixa de e-mail</h2>
          <ol className="list-decimal space-y-1 pl-5">
            <li>Na conta do Gmail da Growlift, ligue a verificação em duas etapas e crie uma <b>senha de app</b> (Conta do Google › Segurança › Senhas de app). Use o nome “Growlift painel”.</li>
            <li>Na Vercel (projeto growlift-sistema › Settings › Environment Variables, só Production, marcando Sensitive), crie <code>EMAIL_RESUMO_USUARIO</code> com o endereço do Gmail e <code>EMAIL_RESUMO_SENHA_APP</code> com a senha de app. Nunca mande essa senha em conversa.</li>
            <li>Publique o sistema de novo. O resumo passa a sair todo dia às 6h (a Vercel grátis pode atrasar até 59 minutos).</li>
          </ol>
        </section>
      )}

      <section className="card space-y-2">
        <h2 className="text-lg font-bold">Apagar uma pessoa dos resumos</h2>
        <p className="text-sm text-suave">Para atender um pedido de “apagar meus dados”: escreva o endereço de e-mail de quem pediu. Os itens dessa pessoa saem dos resumos guardados. Depois, apague também o e-mail original no Gmail.</p>
        <Formulario acao={apagarRemetenteResumoAcao} className="flex flex-wrap items-end gap-2">
          <div><label className="rotulo" htmlFor="remetente">E-mail de quem pediu</label><input className="campo" id="remetente" name="remetente" type="email" required /></div>
          <Enviar>Apagar dos resumos</Enviar>
        </Formulario>
      </section>
      {ligado && !process.env.CRON_SECRET && (
        <p role="alert" className="rounded-md bg-erro-clara px-3 py-2 text-erro">Falta a variável <code>CRON_SECRET</code> na Vercel (Production, Sensitive, qualquer texto aleatório com 32 letras ou mais). Sem ela o resumo automático das 6h não roda; o botão acima continua funcionando.</p>
      )}
      {linhas.length === 0 && ligado && <p className="card text-suave">Ainda não rodou. Toque em “Gerar o resumo agora” para testar.</p>}
      {linhas.map((r) => (
        <section key={r.id} className="card space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold">{dataHora(r.criado_em)}</h2>
            <span className="text-sm text-suave">{r.erro ? 'Não foi possível ler os e-mails' : `${r.total} e-mail(s) · ${r.importantes.length} importante(s)`}</span>
          </div>
          {r.erro && <p role="alert" className="rounded-md bg-erro-clara px-3 py-2 text-erro">Erro: {r.erro}. Confira a senha de app e tente de novo.</p>}
          {!r.erro && r.importantes.length === 0 && <p className="text-suave">{r.total ? 'Nada importante.' : 'Nenhum e-mail novo.'}</p>}
          <ul className="space-y-2">
            {r.importantes.map((x, i) => (
              <li key={i} className="rounded-lg border border-linha p-3">
                <p className="font-semibold">
                  {x.urgencia === 'alta' && <span className="mr-2 rounded bg-erro-clara px-2 py-0.5 text-sm text-erro">urgente</span>}
                  {x.assunto}
                </p>
                <p className="text-sm text-suave">{x.de} · {NOME_CATEGORIA[x.categoria as Categoria] ?? x.categoria}</p>
                <p className="mt-1">{x.motivo}</p>
              </li>
            ))}
          </ul>
          {Object.keys(r.outros).length > 0 && (
            <p className="text-sm text-suave">Outros: {Object.entries(r.outros).map(([c, n]) => `${n} ${NOME_CATEGORIA[c as Categoria]?.toLowerCase() ?? c}`).join(' · ')}.</p>
          )}
        </section>
      ))}
    </div>
  );
}
