import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <main className="bg-navy text-ivory">
      <div className="mx-auto flex min-h-[60svh] max-w-[90rem] flex-col justify-center px-5 py-24 sm:px-8 lg:px-12">
        <h1 className="display max-w-[16ch] text-[clamp(2.4rem,5vw,4.4rem)]">
          Página não encontrada.
        </h1>
        <p className="mt-6 max-w-[46ch] text-[1.0625rem] leading-relaxed text-on-navy-muted">
          O endereço pode ter mudado. As áreas de atuação e o contato estão na página inicial.
        </p>
        <Link href="/" className="btn btn-gold mt-9 self-start">
          <ArrowLeft size={16} />
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
