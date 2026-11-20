import Link from 'next/link';

export default function NaoEncontrada() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 text-center">
      <h1 className="text-2xl font-bold">Página não encontrada</h1>
      <p className="mt-2">O endereço não existe ou você não tem acesso a este registro.</p>
      <p className="mt-4"><Link className="botao" href="/">Voltar ao início</Link></p>
    </main>
  );
}
