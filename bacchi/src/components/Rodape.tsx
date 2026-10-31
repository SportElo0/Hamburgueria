import Image from 'next/image';
import Link from 'next/link';
import { EMPRESA } from '@/data/empresa';
import { FAMILIAS, PRODUTOS } from '@/data/catalogo';

export function Rodape() {
  const e = EMPRESA;
  return (
    <footer className="bg-marinho-950 text-white/75">
      <div className="container-b grid gap-12 py-16 md:grid-cols-12 md:py-20">
        <div className="md:col-span-4">
          <div className="relative h-9 w-[150px]">
            <Image src="/img/marca/logo-branco.png" alt="Bacchi" fill sizes="150px" className="object-contain object-left" />
          </div>
          <p className="mt-5 max-w-xs text-sm leading-relaxed">
            {e.razaoSocial}
            <br />
            Clips, grampos, alfinetes e artigos metálicos para escritório desde {e.fundacao}.
          </p>
        </div>
        <nav aria-label="Produtos" className="md:col-span-3">
          <h2 className="eyebrow text-white/45">Produtos</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {FAMILIAS.map((f) => (
              <li key={f.id}>
                <Link className="link-b hover:text-white" href={`/produtos?familia=${f.id}`}>
                  {f.nome}
                </Link>
              </li>
            ))}
            <li>
              <a className="link-b hover:text-white" href="/catalogo-bacchi.pdf" download>
                Catálogo em PDF
              </a>
            </li>
          </ul>
          <p className="mt-4 text-xs text-white/40">{PRODUTOS.length} linhas no catálogo</p>
        </nav>
        <nav aria-label="Institucional" className="md:col-span-2">
          <h2 className="eyebrow text-white/45">Bacchi</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link className="link-b hover:text-white" href="/sobre">A empresa</Link></li>
            <li><Link className="link-b hover:text-white" href="/representantes">Representantes</Link></li>
            <li><Link className="link-b hover:text-white" href="/cotacao">Cotação</Link></li>
            <li><Link className="link-b hover:text-white" href="/contato">Contato</Link></li>
          </ul>
        </nav>
        <address className="not-italic md:col-span-3">
          <h2 className="eyebrow text-white/45">Endereço</h2>
          <p className="mt-4 text-sm leading-relaxed">
            {e.endereco.rua}, {e.endereco.bairro}
            <br />
            {e.endereco.cidade} – {e.endereco.uf} · CEP {e.endereco.cep}
          </p>
          <p className="mt-3 text-sm">
            <a className="link-b hover:text-white" href={e.telefoneLink}>{e.telefone}</a>
            <br />
            <a className="link-b hover:text-white" href={`mailto:${e.email}`}>{e.email}</a>
          </p>
          <p className="mt-3 text-sm text-white/55">{e.horario}</p>
          <a className="link-b mt-3 inline-block text-sm hover:text-white" href={e.instagram} target="_blank" rel="noopener noreferrer">
            Instagram @bacchi_industria
          </a>
        </address>
      </div>
      <div className="border-t border-white/10">
        <div className="container-b flex flex-col gap-2 py-6 text-xs text-white/40 sm:flex-row sm:justify-between">
          <p>© {e.nome}, desde {e.fundacao}.</p>
          <p>Fotos de produção e vídeos: Eduardo Sardinha.</p>
        </div>
      </div>
    </footer>
  );
}
