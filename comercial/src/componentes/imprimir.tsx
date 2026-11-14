'use client';

export function BotaoImprimir({ children }: { children: React.ReactNode }) {
  return <button type="button" className="botao-2 print:hidden" onClick={() => window.print()}>{children}</button>;
}
