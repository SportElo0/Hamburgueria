import Link from "next/link";

export default function NotFound() {
  return (
    <section className="grid min-h-[80svh] place-items-center pt-[var(--nav-h)]">
      <div className="wrap text-center">
        <p className="font-display text-[clamp(5rem,16vw,12rem)] leading-none text-ivory/15">404</p>
        <h1 className="h-section mt-2">Esta página saiu de linha.</h1>
        <p className="lede mx-auto mt-4 max-w-[36ch] text-silver">O endereço pode ter mudado. O acervo continua no lugar de sempre.</p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link href="/acervo" className="btn btn-primary">Ver o acervo</Link>
          <Link href="/" className="btn btn-quiet">Voltar ao início</Link>
        </div>
      </div>
    </section>
  );
}
