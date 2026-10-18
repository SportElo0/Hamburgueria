import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { logout } from "../actions";

export const metadata: Metadata = { title: "Painel", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const nav = [
  { href: "/admin", label: "Visão geral" },
  { href: "/admin/veiculos", label: "Veículos" },
  { href: "/admin/solicitacoes", label: "Solicitações" },
  { href: "/admin/configuracoes", label: "Contatos e serviços" },
];

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="min-h-[100svh] bg-night md:grid md:grid-cols-[15rem_1fr]">
      <aside className="border-b border-[var(--line-dark)] md:min-h-[100svh] md:border-r md:border-b-0">
        <div className="flex items-center justify-between p-5 md:block">
          <Link href="/" className="font-display text-[1.25rem] tracking-[0.14em]">MERCANTIL</Link>
          <p className="caption text-mist md:mt-1">Painel</p>
        </div>
        <nav aria-label="Painel" className="overflow-x-auto px-3 pb-3 md:px-3">
          <ul className="flex gap-1 md:flex-col">
            {nav.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="block rounded-[3px] px-3 py-2.5 text-[0.9375rem] whitespace-nowrap text-ivory/80 hover:bg-ivory/[0.06] hover:text-ivory">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <form action={logout} className="hidden px-6 pt-6 md:block">
          <button type="submit" className="link-line caption text-mist hover:text-ivory">Sair</button>
        </form>
      </aside>
      <div className="min-w-0 p-5 md:p-10">{children}</div>
    </div>
  );
}
