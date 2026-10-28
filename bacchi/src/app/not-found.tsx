import Link from 'next/link';

export default function NaoEncontrada() {
  return (
    <div className="container-b grid min-h-[80svh] place-content-center py-32 text-center">
      <p className="eyebrow text-azul">Página não encontrada</p>
      <h1 className="mt-4 font-display text-[clamp(2.4rem,6vw,4.6rem)] leading-none font-semibold">Este endereço não existe.</h1>
      <p className="mx-auto mt-4 max-w-md text-tinta-2">Talvez o produto tenha mudado de lugar. O catálogo tem busca por nome e por número.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/produtos" className="btn btn-primario">Ir para o catálogo</Link>
        <Link href="/" className="btn btn-contorno text-tinta">Página inicial</Link>
      </div>
    </div>
  );
}
