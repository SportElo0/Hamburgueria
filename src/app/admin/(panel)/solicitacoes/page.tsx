import Link from "next/link";
import { listLeads, type Lead } from "@/lib/repo";

const journeyLabel: Record<Lead["journey"], string> = { compra: "Compra", restauracao: "Restauração", vision: "Vision" };
const statusLabel: Record<Lead["status"], string> = { novo: "Novo", "em-contato": "Em contato", arquivado: "Arquivado" };

export default async function AdminLeads({ searchParams }: { searchParams: Promise<{ filtro?: string }> }) {
  const { filtro } = await searchParams;
  const all = await listLeads();
  const leads = filtro && filtro in journeyLabel ? all.filter((l) => l.journey === filtro) : all;
  return (
    <div className="max-w-5xl">
      <h1 className="font-sans text-[1.75rem] font-medium tracking-normal">Solicitações</h1>
      <nav aria-label="Filtrar" className="mt-6 flex flex-wrap gap-2">
        {[["", "Todas"], ["compra", "Compra"], ["restauracao", "Restauração"], ["vision", "Vision"]].map(([k, l]) => (
          <Link key={k} href={k ? `/admin/solicitacoes?filtro=${k}` : "/admin/solicitacoes"} className="chip !px-3.5" aria-current={(filtro ?? "") === k ? "page" : undefined}>
            {l}
          </Link>
        ))}
      </nav>
      {leads.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="font-display text-[1.75rem]">Nenhuma solicitação por aqui.</p>
          <p className="mt-2 text-[0.9375rem] text-silver">Pedidos de interesse e de avaliação enviados pelo site aparecem nesta lista.</p>
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-[var(--line-dark)] border-y border-[var(--line-dark)]">
          {leads.map((l) => (
            <li key={l.id}>
              <Link href={`/admin/solicitacoes/${l.id}`} className="grid gap-1 py-4 hover:bg-ivory/[0.03] sm:grid-cols-[7rem_1fr_auto] sm:items-center sm:gap-6 sm:px-2">
                <span className="caption text-mist">{journeyLabel[l.journey]}</span>
                <span>
                  <span className="text-[0.9375rem] font-medium">{l.name}</span>
                  <span className="text-silver"> · {l.vehicleLabel ?? ([l.carMake, l.carModel, l.carYear].filter(Boolean).join(" ") || "Sem carro informado")}</span>
                  {l.images && <span className="caption ml-2 text-mist">com imagens</span>}
                </span>
                <span className="caption tabular text-mist">
                  <span className={l.status === "novo" ? "text-wine-soft" : ""}>{statusLabel[l.status]}</span> · {new Date(l.createdAt).toLocaleDateString("pt-BR")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
