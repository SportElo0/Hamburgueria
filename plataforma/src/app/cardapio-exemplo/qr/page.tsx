import type { Metadata } from 'next';
import { headers } from 'next/headers';
import QRCode from 'qrcode';
import { PrintButton } from '@/components/mesa/PrintButton';

export const metadata: Metadata = { title: 'QR do cardápio de exemplo', robots: { index: false, follow: false } };

/** A QR to show on the laptop in a sales visit: the client scans it and opens the example menu on their phone. */
export default async function CardapioExemploQr() {
  const h = await headers();
  const url = `${h.get('x-forwarded-proto') ?? 'https'}://${h.get('host')}/cardapio-exemplo`;
  const svg = await QRCode.toString(url, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' });
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 py-10 text-center">
      <p className="text-sm font-bold tracking-[0.14em] text-ink-mute uppercase">Exemplo · dados fictícios</p>
      <h1 className="mt-2 text-4xl leading-tight font-black">Aponte a câmera</h1>
      <p className="mt-2 text-ink-soft">Abra o cardápio no celular e toque no hambúrguer com o selo 3D.</p>
      <div className="mt-6 w-full max-w-[300px] rounded-3xl bg-white p-4 [&_svg]:h-auto [&_svg]:w-full" role="img" aria-label="QR Code do cardápio de exemplo" dangerouslySetInnerHTML={{ __html: svg }} />
      <p className="mt-4 text-sm break-all text-ink-mute">{url.replace(/^https?:\/\//, '')}</p>
      <div className="mt-6 print:hidden">
        <PrintButton />
      </div>
    </main>
  );
}
