import Link from "next/link";
import { getSettings } from "@/lib/repo";
import { whatsappUrl } from "@/lib/whatsapp";

export async function SiteFooter() {
  const s = await getSettings();
  const wa = whatsappUrl(s.whatsapp, "Olá, Mercantil.");
  return (
    <footer className="relative border-t border-[var(--line-dark)] bg-night pt-20 pb-10">
      <div className="wrap">
        <p className="font-display text-[clamp(3.5rem,13vw,11rem)] leading-[0.85] tracking-[0.02em] text-ivory">
          MERCANTIL
        </p>
        <p className="mt-6 font-display text-[1.5rem] italic text-silver">A história continua.</p>

        <div className="mt-16 grid gap-10 border-t border-[var(--line-dark)] pt-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h2 className="caption mb-4 font-sans text-mist">Explorar</h2>
            <ul className="space-y-2.5 text-[0.9375rem]">
              <li><Link className="link-line" href="/acervo">Acervo</Link></li>
              <li><Link className="link-line" href="/acervo/250-se-coupe-w111">O Charuto · W111</Link></li>
              <li><Link className="link-line" href="/projetos">Projetos</Link></li>
              <li><Link className="link-line" href="/atelier">Atelier</Link></li>
            </ul>
          </div>
          <div>
            <h2 className="caption mb-4 font-sans text-mist">Restaurar</h2>
            <ul className="space-y-2.5 text-[0.9375rem]">
              <li><Link className="link-line" href="/restauracao">Serviços</Link></li>
              <li><Link className="link-line" href="/vision">Mercantil Vision</Link></li>
              <li><Link className="link-line" href="/contato?jornada=restauracao">Solicitar avaliação</Link></li>
            </ul>
          </div>
          <div>
            <h2 className="caption mb-4 font-sans text-mist">Contato</h2>
            <ul className="space-y-2.5 text-[0.9375rem]">
              {wa ? (
                <li><a className="link-line" href={wa} target="_blank" rel="noopener noreferrer">WhatsApp</a></li>
              ) : (
                <li><Link className="link-line" href="/contato">Formulário de contato</Link></li>
              )}
              {s.email && <li><a className="link-line" href={`mailto:${s.email}`}>{s.email}</a></li>}
              {s.instagram && (
                <li>
                  <a className="link-line" href={`https://instagram.com/${s.instagram.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer">
                    Instagram
                  </a>
                </li>
              )}
              {s.city && <li className="text-soft">{s.city}</li>}
            </ul>
          </div>
          <div className="caption text-mist">
            <p>
              <span className="prov" data-kind="real">Fotografia real</span>
              <br />
              <span className="prov" data-kind="concept">Ilustração ou simulação</span>
            </p>
            <p className="mt-4 max-w-[28ch]">Anos aproximados até validação. Valores sob consulta.</p>
            <p className="mt-4"><Link className="link-line" href="/privacidade">Privacidade e uso de imagens</Link></p>
          </div>
        </div>

        <p className="caption mt-16 text-mist">© {new Date().getFullYear()} MERCANTIL. Mercedes-Benz é marca registrada de seus respectivos titulares; este site não tem vínculo com a fabricante.</p>
      </div>
    </footer>
  );
}
