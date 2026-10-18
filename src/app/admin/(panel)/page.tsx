import Link from "next/link";
import { listLeads, getSettings, getVehicles } from "@/lib/repo";
import { visionAvailability } from "@/lib/vision/provider";
import { purgeNow } from "../actions";

export default async function AdminHome() {
  const [leads, settings, vehicles] = await Promise.all([listLeads(), getSettings(), getVehicles()]);
  const fresh = leads.filter((l) => l.status === "novo").length;
  const vision = visionAvailability();
  const driver = (process.env.STORAGE_DRIVER ?? "fs").toLowerCase();
  const checks = [
    { ok: !!settings.whatsapp, label: "WhatsApp oficial", hint: "Sem número, os botões de interesse levam ao formulário do site.", href: "/admin/configuracoes" },
    {
      ok: vision.available,
      label: "Mercantil Vision (IA)",
      hint: vision.available ? "Geração ativa." : vision.reason === "disabled" ? "Pausado por VISION_ENABLED=false." : "Defina OPENAI_API_KEY (com créditos de API) na hospedagem.",
    },
    {
      ok: driver === "blob" ? !!process.env.BLOB_READ_WRITE_TOKEN : true,
      label: `Armazenamento: ${driver === "blob" ? "Vercel Blob" : "arquivos locais"}`,
      hint: driver === "blob" ? "Dados privados no Blob." : "Use STORAGE_DRIVER=blob em hospedagem serverless (sem disco persistente).",
    },
    { ok: vehicles.some((v) => v.slug !== "250-se-coupe-w111" && v.photos.length > 0), label: "Fotografias dos demais carros", hint: "Envie fotos reais em Veículos.", href: "/admin/veiculos" },
  ];
  return (
    <div className="max-w-5xl">
      <h1 className="font-sans text-[1.75rem] font-medium tracking-normal">Visão geral</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Link href="/admin/solicitacoes" className="rounded-[3px] border border-[var(--line-dark)] p-5 hover:border-ivory/40">
          <p className="caption text-mist">Solicitações novas</p>
          <p className="tabular mt-2 font-display text-[2.5rem] leading-none">{fresh}</p>
        </Link>
        <div className="rounded-[3px] border border-[var(--line-dark)] p-5">
          <p className="caption text-mist">Total de solicitações</p>
          <p className="tabular mt-2 font-display text-[2.5rem] leading-none">{leads.length}</p>
        </div>
        <Link href="/admin/veiculos" className="rounded-[3px] border border-[var(--line-dark)] p-5 hover:border-ivory/40">
          <p className="caption text-mist">Veículos no acervo</p>
          <p className="tabular mt-2 font-display text-[2.5rem] leading-none">{vehicles.length}</p>
        </Link>
      </div>

      <h2 className="mt-14 font-sans text-[1.125rem] font-medium tracking-normal">Configuração</h2>
      <ul className="mt-4 divide-y divide-[var(--line-dark)] border-y border-[var(--line-dark)]">
        {checks.map((c) => (
          <li key={c.label} className="flex items-start justify-between gap-6 py-4">
            <div>
              <p className="text-[0.9375rem]">
                <span className={`mr-2 inline-block size-2 rounded-full ${c.ok ? "bg-[#7fb38a]" : "bg-[#d9a25b]"}`} aria-hidden />
                {c.label} <span className="sr-only">{c.ok ? "(ok)" : "(pendente)"}</span>
              </p>
              <p className="caption mt-1 text-mist">{c.hint}</p>
            </div>
            {c.href && <Link href={c.href} className="link-line caption flex-none text-silver">Abrir</Link>}
          </li>
        ))}
      </ul>

      <form action={purgeNow} className="mt-10">
        <button type="submit" className="btn btn-quiet !min-h-11">Apagar agora solicitações vencidas</button>
        <p className="caption mt-2 text-mist">Remove dados e imagens com prazo de retenção expirado (VISION_RETENTION_DAYS).</p>
      </form>
    </div>
  );
}
