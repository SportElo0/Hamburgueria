import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { telefoneLiberado } from '@/lib/oportunidades/dados';
import { estimarPagina } from '@/lib/oportunidades/whatsapp';
import { MandarWhatsapp } from '@/components/oportunidades/MandarWhatsapp';

export const metadata = { title: 'Mandar WhatsApp' };
/** A page of 10 live Place Details calls. */
export const maxDuration = 30;

export default async function MandarWhatsappPage() {
  await requireUser();
  const est = await estimarPagina();
  const liberado = telefoneLiberado();
  return (
    <>
      <Link href="/painel/oportunidades" className="text-sm text-ink-mute hover:text-ink">
        ← Oportunidades
      </Link>
      <h1 className="mt-2 text-3xl font-bold">Mandar WhatsApp</h1>
      <p className="mt-1 max-w-2xl text-ink-soft">
        Os negócios das suas pesquisas que não têm site funcionando. Toque em <strong>Abrir WhatsApp</strong>: a conversa abre com a mensagem pronta e você só aperta enviar.
      </p>
      <ul className="mt-3 max-w-2xl list-disc space-y-1 pl-5 text-sm text-ink-mute">
        <li>Uma mensagem por negócio. Se não responderem, não mande de novo.</li>
        <li>Use um número de WhatsApp separado, nunca o que atende os clientes.</li>
        <li>Se pedirem para não receber, toque em &quot;Não quer&quot;: o negócio sai da lista para sempre.</li>
      </ul>
      {!liberado && (
        <p role="alert" className="mt-4 rounded-lg bg-warn/10 px-3 py-2 text-sm font-semibold text-warn">
          Para mostrar os números, ligue LEADS_MOSTRAR_TELEFONE=sim na Vercel (só Production).
        </p>
      )}
      <MandarWhatsapp fila={est.fila} custo={{ chamadas: est.chamadas, pagas: est.pagas, usd: est.usd, gratisRestantes: est.gratisRestantes }} liberado={liberado && est.cabe} />
    </>
  );
}
