export function Marca({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-bold text-tinta ${className}`}>
      <span aria-hidden className="grid h-8 w-8 place-items-center rounded-lg bg-marca text-sm font-black text-white">G</span>
      Growlift <span className="font-medium text-suave">Comercial</span>
    </span>
  );
}

/** Frame of the screens outside the panel (login, invitation, password). */
export function TelaDeAcesso({ titulo, children, rodape }: { titulo: string; children: React.ReactNode; rodape?: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-10">
      <Marca className="mb-6 text-lg" />
      <div className="cartao p-6">
        <h1 className="mb-4 text-xl font-bold">{titulo}</h1>
        {children}
      </div>
      {rodape && <div className="mt-4 text-center text-sm text-suave">{rodape}</div>}
    </main>
  );
}
