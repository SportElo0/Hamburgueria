import type { Metadata } from 'next';
import Link from 'next/link';
import { FormContato } from '@/components/contato/FormContato';
import { EMPRESA } from '@/data/empresa';

export const metadata: Metadata = {
  title: 'Contato',
  description: 'Fale com a Bacchi: Via das Magnólias, 234, Jardim Colibri, Cotia – SP. Telefone +55 11 4617-9999, de segunda a sexta, das 8h às 17h.',
  alternates: { canonical: '/contato' },
};

export default function ContatoPage() {
  const e = EMPRESA;
  const enderecoMapa = encodeURIComponent(`${e.endereco.rua}, ${e.endereco.bairro}, ${e.endereco.cidade} - ${e.endereco.uf}, ${e.endereco.cep}`);
  return (
    <div className="container-b pt-32 pb-24 md:pt-40">
      <p className="eyebrow text-azul">Contato</p>
      <h1 className="mt-4 max-w-[14ch] font-display text-[clamp(2.4rem,5.6vw,4.6rem)] leading-[0.98] font-semibold">Será um prazer atender você.</h1>

      <div className="mt-14 grid gap-12 lg:grid-cols-12">
        <aside className="space-y-8 lg:col-span-4">
          <div>
            <h2 className="eyebrow text-aco">Endereço</h2>
            <address className="mt-3 text-lg leading-relaxed not-italic">
              {e.razaoSocial}
              <br />
              {e.endereco.rua}
              <br />
              {e.endereco.bairro} · {e.endereco.cidade} – {e.endereco.uf}
              <br />
              CEP {e.endereco.cep}
            </address>
            <a className="link-b mt-3 inline-block font-semibold text-azul" href={`https://www.google.com/maps/search/?api=1&query=${enderecoMapa}`} target="_blank" rel="noopener noreferrer">
              Abrir no Google Maps →
            </a>
          </div>
          <div>
            <h2 className="eyebrow text-aco">Telefone</h2>
            <a className="link-b mt-3 inline-block text-2xl font-semibold" href={e.telefoneLink}>{e.telefone}</a>
            <p className="mt-1 text-tinta-2">{e.horario}</p>
          </div>
          <div>
            <h2 className="eyebrow text-aco">WhatsApp e e-mail</h2>
            <p className="mt-3">
              <a className="link-b font-semibold" href={e.whatsappLink} target="_blank" rel="noopener noreferrer">WhatsApp {e.whatsapp}</a>
              <br />
              <a className="link-b font-semibold" href={`mailto:${e.email}`}>{e.email}</a>
            </p>
          </div>
          <div className="rounded-3xl bg-marinho p-6 text-white">
            <p className="font-display text-xl font-semibold">Comprando para revenda?</p>
            <p className="mt-2 text-white/70">O representante da sua região atende com prazos e condições locais.</p>
            <Link href="/representantes" className="btn btn-claro mt-5">Encontrar representante</Link>
          </div>
        </aside>
        <section aria-labelledby="titulo-form" className="lg:col-span-7 lg:col-start-6">
          <div className="rounded-3xl bg-white p-6 shadow-[0_30px_60px_-40px_rgba(13,23,38,.45)] md:p-10">
            <h2 id="titulo-form" className="font-display text-2xl font-semibold">Envie uma mensagem</h2>
            <p className="mt-2 text-sm text-tinta-2">Para pedir preços de produtos, use a <Link className="link-b text-azul" href="/produtos">cotação pelo catálogo</Link>: a equipe recebe os modelos exatos.</p>
            <FormContato />
          </div>
        </section>
      </div>
    </div>
  );
}
