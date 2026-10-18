import Link from "next/link";
import { notFound } from "next/navigation";
import { getLead, getServices } from "@/lib/repo";
import { whatsappUrl } from "@/lib/whatsapp";
import { removeLead, setLeadStatus } from "../../../actions";

export default async function LeadDetail({ params }: { params: Promise<{ id: string }> }) {
  const [lead, services] = await Promise.all([getLead((await params).id), getServices()]);
  if (!lead) notFound();
  const reply = whatsappUrl(lead.whatsapp.replace(/^\+/, "").length <= 11 ? `55${lead.whatsapp.replace(/\D/g, "")}` : lead.whatsapp, `Olá, ${lead.name.split(" ")[0]}. Aqui é a Mercantil, sobre a sua solicitação.`);
  const rows: [string, string | undefined][] = [
    ["Recebida em", new Date(lead.createdAt).toLocaleString("pt-BR")],
    ["WhatsApp", lead.whatsapp],
    ["E-mail", lead.email],
    ["Carro do acervo", lead.vehicleLabel],
    ["Carro do cliente", [lead.carMake, lead.carModel, lead.carYear].filter(Boolean).join(" ") || undefined],
    ["Serviços", lead.services?.map((s) => services.find((x) => x.slug === s)?.name ?? s).join(", ")],
    ["Pedido no Vision", lead.visionBrief],
    ["Consentimento", `Contato: sim · Imagens: ${lead.consent.images ? "sim" : "não"} · ${new Date(lead.consent.at).toLocaleString("pt-BR")}`],
    ["Apagar em", lead.expiresAt ? new Date(lead.expiresAt).toLocaleDateString("pt-BR") : undefined],
  ];
  return (
    <div className="max-w-4xl">
      <Link href="/admin/solicitacoes" className="link-line caption text-mist">← Solicitações</Link>
      <h1 className="mt-4 font-sans text-[1.75rem] font-medium tracking-normal">{lead.name}</h1>
      <div className="mt-6 flex flex-wrap gap-3">
        {reply && (
          <a href={reply} target="_blank" rel="noopener noreferrer" className="btn btn-primary !min-h-11">Responder pelo WhatsApp</a>
        )}
        <form action={setLeadStatus} className="flex gap-2">
          <input type="hidden" name="id" value={lead.id} />
          <label htmlFor="status" className="sr-only">Status</label>
          <select id="status" name="status" defaultValue={lead.status} className="field !min-h-11 !w-auto !py-2">
            <option value="novo">Novo</option>
            <option value="em-contato">Em contato</option>
            <option value="arquivado">Arquivado</option>
          </select>
          <button type="submit" className="btn btn-quiet !min-h-11">Atualizar</button>
        </form>
      </div>

      <dl className="mt-10 border-t border-[var(--line-dark)]">
        {rows.filter(([, v]) => v).map(([k, v]) => (
          <div key={k} className="grid gap-1 border-b border-[var(--line-dark)] py-3 sm:grid-cols-[11rem_1fr] sm:gap-6">
            <dt className="caption text-mist">{k}</dt>
            <dd className="text-[0.9375rem]">{v}</dd>
          </div>
        ))}
      </dl>
      {lead.message && (
        <div className="mt-8">
          <h2 className="caption text-mist">Mensagem</h2>
          <p className="mt-2 whitespace-pre-wrap">{lead.message}</p>
        </div>
      )}
      {lead.images && (
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {(["original", "concept"] as const).map((k) =>
            lead.images?.[k] ? (
              <figure key={k}>
                {/* eslint-disable-next-line @next/next/no-img-element -- private, auth-gated route */}
                <img src={`/api/admin/file?key=${encodeURIComponent(lead.images[k]!)}`} alt={k === "original" ? "Foto original enviada" : "Simulação gerada"} className="w-full bg-graphite" />
                <figcaption className="caption mt-2 text-mist">{k === "original" ? "Foto original do cliente" : "Simulação conceitual (IA)"}</figcaption>
              </figure>
            ) : null,
          )}
        </div>
      )}
      <form action={removeLead} className="mt-14 border-t border-[var(--line-dark)] pt-6">
        <input type="hidden" name="id" value={lead.id} />
        <button type="submit" className="link-line caption text-[#f0a2aa]">Apagar esta solicitação e as imagens</button>
      </form>
    </div>
  );
}
