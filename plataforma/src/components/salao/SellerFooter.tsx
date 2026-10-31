/** Who sells and how to reach them (Decreto 7.962/2013 art. 2º), at the foot of every booking page. */
export interface Seller {
  name: string;
  cnpj: string;
  address: string;
  contact: string;
}

const cnpjMask = (v: string) => v.replace(/\D/g, '').replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');

export function SellerFooter({ seller, slug }: { seller: Seller; slug: string }) {
  return (
    <footer className="mt-10 border-t border-line pt-4 text-xs leading-relaxed text-ink-mute">
      <p>
        {seller.name} · CNPJ {cnpjMask(seller.cnpj)} · {seller.address}
      </p>
      <p>Dúvidas ou problemas com a reserva: {seller.contact}.</p>
      <p>
        <a href={`/reservar/${slug}/privacidade`} className="underline">
          Aviso de privacidade
        </a>{' '}
        · Sistema de reservas fornecido pela Growlift.
      </p>
    </footer>
  );
}
