import Link from "next/link";
import { nav, site, whatsappUrl } from "@/config/site";
import { areas } from "@/data/areas";
import { Band } from "@/components/band";
import { Lockup } from "@/components/brand";
import { Pending } from "@/components/pending";
import { Year } from "@/components/year";

export function Footer() {
  const wa = whatsappUrl();
  return (
    <footer className="bg-navy-deep text-ivory">
      <Band className="text-gold/35" seed={1.3} copies={5} />
      <div className="mx-auto max-w-[90rem] px-5 pt-16 pb-10 sm:px-8 lg:px-12 lg:pt-20">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <Lockup className="w-[min(20rem,80vw)]" />
            <p className="mt-6 max-w-[34ch] text-[0.9375rem] leading-relaxed text-on-navy-muted">
              Advocacia com atuação no {site.region}. Conteúdo de caráter informativo, que não substitui a orientação
              jurídica individual.
            </p>
          </div>

          <nav aria-label="Rodapé" className="lg:col-span-2">
            <h2 className="label text-gold">Navegação</h2>
            <ul className="mt-5 space-y-1">
              {nav.map((item) => (
                <li key={item.id}>
                  <Link href={item.href} className="inline-block py-1.5 text-[0.9375rem] text-on-navy-muted transition-colors hover:text-ivory">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Áreas de atuação no rodapé" className="lg:col-span-3">
            <h2 className="label text-gold">Áreas de atuação</h2>
            <ul className="mt-5 space-y-1">
              {areas.map((area) => (
                <li key={area.slug}>
                  <Link href={`/areas/${area.slug}`} className="inline-block py-1.5 text-[0.9375rem] text-on-navy-muted transition-colors hover:text-ivory">
                    {area.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="lg:col-span-3">
            <h2 className="label text-gold">Contato</h2>
            <ul className="mt-5 space-y-2.5 text-[0.9375rem] text-on-navy-muted">
              <li>
                Telefone:{" "}
                {site.phone ? <a href={`tel:${site.phone.e164}`} className="text-ivory">{site.phone.display}</a> : <Pending label="a confirmar" tone="dark" />}
              </li>
              <li>
                WhatsApp:{" "}
                {site.whatsapp && wa ? (
                  <a href={wa} target="_blank" rel="noopener noreferrer" className="text-ivory">{site.whatsapp.display}</a>
                ) : (
                  <Pending label="a confirmar" tone="dark" />
                )}
              </li>
              <li>
                E-mail: {site.email ? <a href={`mailto:${site.email}`} className="text-ivory">{site.email}</a> : <Pending label="a confirmar" tone="dark" />}
              </li>
              <li>Local: {site.city ? `${site.city} – SP` : site.region}</li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-blue-line pt-6 text-[0.8125rem] text-on-navy-muted lg:flex-row lg:items-center lg:justify-between">
          <p>
            © <Year /> {site.name}. Todos os direitos reservados.
          </p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            <li>Inscrição na OAB: {site.oab ?? <Pending tone="dark" />}</li>
            <li>
              <Link href="/privacidade" className="underline underline-offset-4 hover:text-ivory">
                Política de privacidade
              </Link>
            </li>
            {site.demo && <li>Demonstração não oficial</li>}
          </ul>
        </div>
      </div>
    </footer>
  );
}
