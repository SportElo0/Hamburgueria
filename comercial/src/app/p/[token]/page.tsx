import { notFound } from 'next/navigation';
import { aceitarPropostaAcao, recusarPropostaAcao } from '@/app/acoes';
import { dataHora, reais } from '@/componentes/formato';
import { Enviar, Formulario } from '@/componentes/formulario';
import { formatarTelefone, normalizarTelefone } from '@/server/config';
import { abrirPropostaPublica } from '@/server/propostas';
import { BotaoImprimir } from '@/componentes/imprimir';

export const metadata = { title: 'Proposta', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

const dataBr = (iso: string) => iso.split('-').reverse().join('/');

/** The proposal the customer opens by the private link. */
export default async function PropostaPublica({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const p = await abrirPropostaPublica(token, true);
  if (!p) notFound();
  const s = p.empresa.config.site;
  const contato = [s.whatsapp ? `WhatsApp ${formatarTelefone(normalizarTelefone(s.whatsapp) ?? s.whatsapp)}` : '', s.email ? `e-mail ${s.email}` : ''].filter(Boolean).join(' ou ') || 'o contato de quem te enviou este link';
  const quantidade = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
  return (
    <main className="mx-auto max-w-2xl bg-white px-4 py-8 text-texto">
      {p.empresa.demonstracao && <p className="mb-4 rounded-md bg-alerta-clara px-3 py-1.5 text-[13.5px] text-alerta">Proposta de demonstração · empresa fictícia</p>}
      <p className="text-sm text-suave">{s.razao_social || p.empresa.nome}{s.cnpj ? ` · CNPJ ${s.cnpj}` : ''}{s.endereco ? ` · ${s.endereco}` : ''}</p>
      <h1 className="mt-1 text-2xl font-bold text-tinta">Proposta nº {p.numero}: {p.titulo}</h1>
      {p.cliente && <p className="mt-1 text-[17px]">Para {p.cliente}</p>}

      <section className="mt-6 overflow-hidden rounded-xl border border-linha" aria-label="Itens da proposta">
        <ul className="divide-y divide-linha">
          {p.itens.map((i, n) => (
            <li key={n} className="flex flex-wrap justify-between gap-2 px-4 py-3">
              <span className="min-w-0 flex-1">{i.descricao}<span className="block text-sm text-suave">{quantidade(i.quantidade)} × {reais(i.valor_unit_centavos)}</span></span>
              <span className="font-semibold text-tinta">{reais(Math.round(i.quantidade * i.valor_unit_centavos))}</span>
            </li>
          ))}
        </ul>
        <p className="flex justify-between bg-fundo px-4 py-3 text-lg font-bold text-tinta"><span>Total</span><span>{reais(p.total_centavos)}</span></p>
      </section>

      {p.condicoes && (
        <section className="mt-6">
          <h2 className="text-lg font-bold">Condições</h2>
          <p className="mt-2 whitespace-pre-wrap text-[16px]">{p.condicoes}</p>
        </section>
      )}
      {p.validade && <p className="mt-4 text-[15px]">Válida até o fim do dia <strong>{dataBr(p.validade)}</strong>.</p>}
      {p.consumidor && (
        <p className="mt-3 rounded-lg bg-fundo px-4 py-3 text-[15px]">Contratação pela internet: você pode desistir em até 7 dias a contar do aceite (ou do início do serviço, se for depois), sem precisar justificar, avisando a {p.empresa.nome} por {contato}. Valores que você tiver pagado serão devolvidos.</p>
      )}

      <section className="mt-6 rounded-xl border border-linha p-4">
        {p.estado === 'aceita' ? (
          <div className="space-y-3">
            <p className="text-[17px] text-ok">Você aceitou esta proposta em {dataHora(p.respondida_em!)}, como “{p.aceite_nome}”. A {p.empresa.nome} vai falar com você para combinar o fechamento e o pagamento.</p>
            <p className="text-[15px]">Guarde este comprovante: esta página continua no mesmo link, com a proposta nº {p.numero}, os itens, o total, as condições, o nome digitado, a data e a hora.</p>
            <BotaoImprimir>Imprimir ou salvar em PDF</BotaoImprimir>
          </div>
        ) : p.estado === 'cancelada' ? (
          <p className="text-[17px]">Esta proposta foi cancelada pela {p.empresa.nome}. Fale com a empresa se precisar de uma nova.</p>
        ) : p.estado === 'recusada' ? (
          <p className="text-[17px]">Você recusou esta proposta em {dataHora(p.respondida_em!)}. Se mudar de ideia, fale com a {p.empresa.nome}.</p>
        ) : p.vencida ? (
          <p className="text-[17px]">A validade desta proposta terminou. Fale com a {p.empresa.nome} para receber uma nova.</p>
        ) : (
          <>
            <h2 className="text-lg font-bold">Aceitar a proposta</h2>
            <Formulario acao={aceitarPropostaAcao} className="mt-3 space-y-3">
              <input type="hidden" name="token" value={token} />
              <div><label className="rotulo" htmlFor="nome">Seu nome completo</label><input className="campo" id="nome" name="nome" autoComplete="name" required minLength={3} maxLength={120} /></div>
              <label className="flex items-start gap-3 text-[15px]"><input type="checkbox" name="li" required className="mt-0.5 h-5 w-5 shrink-0 accent-[#175cd3]" /><span>Li a proposta e aceito os itens, o valor e as condições acima.</span></label>
              <Enviar>Aceitar proposta</Enviar>
              <p className="text-[13px] text-suave">Ao aceitar, você concorda com esta proposta. Registramos o nome digitado, a data e a hora, um código do seu acesso e o navegador, só para comprovar este aceite. Nenhum pagamento é feito agora: a {p.empresa.nome} fala com você para combinar o fechamento e o pagamento.</p>
            </Formulario>
            <details className="mt-4 border-t border-linha pt-3">
              <summary className="cursor-pointer font-semibold text-marca-escura">Não quero esta proposta</summary>
              <Formulario acao={recusarPropostaAcao} className="mt-3 space-y-3">
                <input type="hidden" name="token" value={token} />
                <div><label className="rotulo" htmlFor="motivo">Quer contar o motivo? (opcional, sem dados pessoais)</label><textarea className="campo" id="motivo" name="motivo" rows={2} maxLength={500} /></div>
                <Enviar secundario>Recusar proposta</Enviar>
              </Formulario>
            </details>
          </>
        )}
      </section>
      <p className="mt-6 text-[13px] text-suave">Dúvidas: {contato}. A empresa é avisada quando este link é aberto. <a className="underline" href={`/s/${p.empresa.slug}/privacidade`}>Privacidade</a>.</p>
    </main>
  );
}
