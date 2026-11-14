import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChatSite } from '@/componentes/chat-site';
import { FormularioPedido } from '@/componentes/formulario-pedido';
import { TEXTO_CONSENTIMENTO_WHATSAPP, formatarTelefone } from '@/server/config';
import { conhecimentoAtual } from '@/server/conhecimento';
import { empresaPorSlug } from '@/server/empresas';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const e = await empresaPorSlug((await params).slug);
  return { title: e ? `${e.nome}${e.demonstracao ? ' (demonstração)' : ''}` : 'Empresa não encontrada', description: e?.config.site.descricao.slice(0, 150) };
}

export default async function Site({ params }: { params: Promise<{ slug: string }> }) {
  const empresa = await empresaPorSlug((await params).slug);
  if (!empresa) notFound();
  const s = empresa.config.site;
  const k = await conhecimentoAtual(empresa.id);
  const zap = s.whatsapp ? (s.whatsapp.length <= 11 ? `55${s.whatsapp}` : s.whatsapp) : '';
  return (
    <div className="bg-white text-texto">
      {empresa.demonstracao && <p className="bg-tinta px-4 py-1.5 text-center text-[13.5px] text-white">Site de demonstração · empresa fictícia · nenhum dado enviado aqui chega a uma empresa real</p>}
      <header className="border-b border-linha">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <span className="text-lg font-bold text-tinta">{empresa.nome}</span>
          <a href="#orcamento" className="botao min-h-10 px-4 py-1.5">Pedir orçamento</a>
        </div>
      </header>

      <main>
        <section className="bg-gradient-to-b from-marca-clara to-white">
          <div className="mx-auto grid max-w-5xl items-center gap-8 px-4 py-12 md:grid-cols-2 md:py-20">
            <div>
              <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl">{s.chamada || empresa.nome}</h1>
              {s.descricao && <p className="mt-4 text-lg">{s.descricao}</p>}
              <div className="mt-6 flex flex-wrap gap-3">
                <a href="#orcamento" className="botao">Pedir orçamento</a>
                {zap && <a className="botao-2" href={`https://wa.me/${zap}`} target="_blank" rel="noopener noreferrer">Falar pelo WhatsApp</a>}
              </div>
            </div>
            {s.imagem && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.imagem} alt={empresa.demonstracao ? 'Imagem ilustrativa de telhado com painéis solares' : ''} width={900} height={1125} className="aspect-[4/3] w-full rounded-2xl object-cover" />
            )}
          </div>
        </section>

        {s.servicos.length > 0 && (
          <section className="mx-auto max-w-5xl px-4 py-12" aria-labelledby="t-servicos">
            <h2 id="t-servicos" className="text-2xl font-bold">Serviços</h2>
            <ul className="mt-5 grid gap-4 sm:grid-cols-2">
              {s.servicos.map((x) => <li key={x.titulo} className="rounded-xl border border-linha p-5"><h3 className="text-lg font-bold">{x.titulo}</h3>{x.texto && <p className="mt-1">{x.texto}</p>}</li>)}
            </ul>
          </section>
        )}

        {s.areas.length > 0 && (
          <section className="bg-fundo" aria-labelledby="t-areas">
            <div className="mx-auto max-w-5xl px-4 py-12">
              <h2 id="t-areas" className="text-2xl font-bold">Áreas atendidas</h2>
              <ul className="mt-4 flex flex-wrap gap-2">{s.areas.map((a) => <li key={a} className="rounded-full border border-linha bg-white px-4 py-1.5 font-medium text-tinta">{a}</li>)}</ul>
            </div>
          </section>
        )}

        {s.projetos.length > 0 && (
          <section className="mx-auto max-w-5xl px-4 py-12" aria-labelledby="t-projetos">
            <h2 id="t-projetos" className="text-2xl font-bold">Projetos</h2>
            {empresa.demonstracao && <p className="mt-1 text-sm text-suave">Exemplos ilustrativos de uma empresa fictícia.</p>}
            <ul className="mt-5 grid gap-4 sm:grid-cols-3">
              {s.projetos.map((x) => <li key={x.titulo} className="rounded-xl border border-linha p-5"><h3 className="font-bold text-tinta">{x.titulo}</h3>{x.texto && <p className="mt-1 text-[15px]">{x.texto}</p>}</li>)}
            </ul>
          </section>
        )}

        {k.dados.faq.length > 0 && (
          <section className="bg-fundo" aria-labelledby="t-faq">
            <div className="mx-auto max-w-3xl px-4 py-12">
              <h2 id="t-faq" className="text-2xl font-bold">Perguntas frequentes</h2>
              <div className="mt-4 space-y-2">
                {k.dados.faq.map((f) => (
                  <details key={f.pergunta} className="rounded-xl border border-linha bg-white p-4">
                    <summary className="cursor-pointer text-[17px] font-semibold text-tinta">{f.pergunta}</summary>
                    <p className="mt-2 whitespace-pre-wrap">{f.resposta}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>
        )}

        <section id="orcamento" className="mx-auto max-w-5xl scroll-mt-4 px-4 py-12" aria-labelledby="t-orc">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h2 id="t-orc" className="text-3xl font-bold">Peça seu orçamento</h2>
              <p className="mt-3 text-lg">Conte o que você precisa. Uma pessoa da equipe analisa e fala com você. O formulário não calcula valores nem promete economia.</p>
              <dl className="mt-6 space-y-2 text-[15px]">
                {zap && <div><dt className="font-semibold text-tinta">WhatsApp</dt><dd><a className="underline" href={`https://wa.me/${zap}`} target="_blank" rel="noopener noreferrer">{formatarTelefone(zap)}</a></dd></div>}
                {s.email && <div><dt className="font-semibold text-tinta">E-mail</dt><dd><a className="underline" href={`mailto:${s.email}`}>{s.email}</a></dd></div>}
                {s.endereco && <div><dt className="font-semibold text-tinta">Onde estamos</dt><dd>{s.endereco}</dd></div>}
                {k.dados.horarios && <div><dt className="font-semibold text-tinta">Horário</dt><dd>{k.dados.horarios}</dd></div>}
              </dl>
            </div>
            <div className="rounded-2xl border border-linha p-5 shadow-sm">
              <FormularioPedido chave={empresa.chave_publica} empresa={empresa.nome} campos={empresa.config.campos} textoConsentimento={TEXTO_CONSENTIMENTO_WHATSAPP(empresa.nome)} linkPrivacidade={`/s/${empresa.slug}/privacidade`} origem="site" />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-linha bg-fundo">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm">
          <span>{s.razao_social || empresa.nome}{s.cnpj ? ` · CNPJ ${s.cnpj}` : ''}{empresa.demonstracao ? ' · empresa fictícia de demonstração' : ''}</span>
          <Link className="underline" href={`/s/${empresa.slug}/privacidade`}>Privacidade</Link>
        </div>
      </footer>
      {empresa.config.ia.ativa && <ChatSite chave={empresa.chave_publica} empresa={empresa.nome} atendente={empresa.config.ia.nome} linkPrivacidade={`/s/${empresa.slug}/privacidade`} />}
    </div>
  );
}
