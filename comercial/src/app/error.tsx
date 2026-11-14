'use client';

export default function Erro({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 text-center">
      <h1 className="text-2xl font-bold">Algo deu errado</h1>
      <p className="mt-2">Não foi possível carregar esta tela agora. Seus dados continuam salvos.</p>
      <p className="mt-4"><button className="botao" onClick={reset}>Tentar de novo</button></p>
    </main>
  );
}
