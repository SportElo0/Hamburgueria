import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { leadDoLugar } from '@/lib/oportunidades/dados';
import { linkMaps, nomeCategoria, segmento as nomeSegmento } from '@/lib/oportunidades/regras';
import { gravacaoPermitida } from '@/lib/vendas/dados';
import { NovoContato } from '@/components/vendas/NovoContato';
import { AvisoFase1 } from '@/components/vendas/ui';

export const metadata = { title: 'Novo contato · Vendas' };

export default async function NovoContatoPage({ searchParams }: { searchParams: Promise<{ lugar?: string }> }) {
  await requireUser();
  const { lugar } = await searchParams;
  const lead = lugar ? await leadDoLugar(lugar) : undefined;
  const bloqueado = lead && (lead.situacao === 'nao-contatar' || lead.situacao === 'descartada');

  return (
    <>
      <Link href="/painel/oportunidades/vendas" className="text-sm text-ink-mute hover:text-ink">
        ← Vendas
      </Link>
      <h1 className="mt-2 text-3xl font-bold">Novo contato</h1>
      <p className="mt-1 max-w-3xl text-ink-soft">
        O e-mail precisa vir de um canal público do próprio negócio (site, Instagram, Facebook, cardápio). Dados do Google não podem ser copiados para cá; o nome do
        negócio é digitado como ele aparece no canal dele.
      </p>
      <AvisoFase1 gravacao={gravacaoPermitida()} />
      {lead && (
        <div className="card mt-4 p-4 text-sm">
          <p className="font-semibold">Vindo de Oportunidades</p>
          <p className="mt-1 text-ink-soft">
            {nomeSegmento(lead.segmento).nome} em {lead.cidade} - {lead.uf} · {nomeCategoria(lead.categoria)}
            {lead.sinais.length > 0 && ` · ${lead.sinais.join(', ')}`}
          </p>
          <a className="mt-1 inline-block text-accent underline underline-offset-2" href={linkMaps(lead.placeId)} target="_blank" rel="noopener noreferrer">
            Abrir no Google Maps para achar o site ou o Instagram do negócio
          </a>
        </div>
      )}
      {bloqueado ? (
        <p role="alert" className="card mt-6 p-5 font-semibold text-bad">
          Esse negócio está como &quot;{lead.situacao === 'nao-contatar' ? 'Não contatar' : 'Descartada'}&quot; em Oportunidades e não pode ser abordado.
        </p>
      ) : (
        <NovoContato placeId={lead?.placeId} cidade={lead?.cidade} uf={lead?.uf} segmento={lead?.segmento} />
      )}
    </>
  );
}
