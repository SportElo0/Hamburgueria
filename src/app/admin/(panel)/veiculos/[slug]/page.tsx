import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { commercialLabel, workStageLabel, workTrack } from "@/content/site";
import { getVehicle } from "@/lib/repo";
import { ActionForm } from "../../../action-form";
import { editPhoto, saveVehicle, uploadVehiclePhoto } from "../../../actions";

const specsToText = (s: { label: string; value: string }[]) => s.map((x) => `${x.label}: ${x.value}`).join("\n");

function Field({ label, name, defaultValue, hint, type = "text" }: { label: string; name: string; defaultValue?: string | number; hint?: string; type?: string }) {
  return (
    <div>
      <label htmlFor={name} className="field-label">{label}</label>
      <input id={name} name={name} type={type} defaultValue={defaultValue} className="field" />
      {hint && <p className="caption mt-1.5 text-mist">{hint}</p>}
    </div>
  );
}

export default async function EditVehicle({ params }: { params: Promise<{ slug: string }> }) {
  const v = await getVehicle((await params).slug);
  if (!v) notFound();
  return (
    <div className="max-w-4xl">
      <Link href="/admin/veiculos" className="link-line caption text-mist">← Veículos</Link>
      <h1 className="mt-4 font-sans text-[1.75rem] font-medium tracking-normal">{v.model} {v.chassis}</h1>
      <Link href={`/acervo/${v.slug}`} className="link-line caption text-silver">Ver página pública</Link>

      <ActionForm action={saveVehicle} submitLabel="Salvar e publicar" className="mt-10 space-y-10">
        <input type="hidden" name="slug" value={v.slug} />
        <fieldset className="grid gap-5 sm:grid-cols-2">
          <legend className="mb-4 font-sans text-[1.125rem] font-medium">Identificação</legend>
          <Field label="Modelo" name="model" defaultValue={v.model} />
          <Field label="Geração / chassi" name="chassis" defaultValue={v.chassis} />
          <Field label="Apelido" name="nickname" defaultValue={v.nickname} />
          <Field label="Carroceria" name="body" defaultValue={v.body} hint="Cupê, Sedã, Roadster…" />
          <Field label="Ano (como exibido)" name="yearLabel" defaultValue={v.yearLabel} hint="Ex.: c. 1966 enquanto não validado" />
          <Field label="Década (filtro)" name="decade" type="number" defaultValue={v.decade} />
          <label className="flex items-center gap-3 text-[0.9375rem] sm:col-span-2">
            <input type="checkbox" name="yearConfirmed" defaultChecked={v.yearConfirmed} className="size-5 accent-[var(--color-wine)]" /> Ano confirmado por documentação
          </label>
          <Field label="Ordem no acervo" name="order" type="number" defaultValue={v.order} />
          <label className="flex items-center gap-3 self-end pb-3 text-[0.9375rem]">
            <input type="checkbox" name="featured" defaultChecked={v.featured} className="size-5 accent-[var(--color-wine)]" /> Destaque do acervo
          </label>
        </fieldset>

        <fieldset className="grid gap-5 sm:grid-cols-[1fr_8rem]">
          <legend className="mb-4 font-sans text-[1.125rem] font-medium">Cores</legend>
          <Field label="Cor da carroceria" name="colorName" defaultValue={v.color.name} />
          <Field label="Amostra" name="colorHex" type="color" defaultValue={v.color.hex} />
          <Field label="Teto (opcional)" name="roofName" defaultValue={v.roof?.name} />
          <Field label="Amostra" name="roofHex" type="color" defaultValue={v.roof?.hex ?? "#e4ddcf"} />
          <Field label="Interior (opcional)" name="interiorName" defaultValue={v.interior?.name} />
          <Field label="Amostra" name="interiorHex" type="color" defaultValue={v.interior?.hex ?? "#7a2a2c"} />
        </fieldset>

        <fieldset className="grid gap-5 sm:grid-cols-2">
          <legend className="mb-4 font-sans text-[1.125rem] font-medium">Situação</legend>
          <div>
            <label htmlFor="workStage" className="field-label">Etapa do trabalho</label>
            <select id="workStage" name="workStage" defaultValue={v.workStage} className="field">
              {(["a-confirmar", ...workTrack] as const).map((s) => <option key={s} value={s}>{workStageLabel[s]}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="commercialStatus" className="field-label">Situação comercial</label>
            <select id="commercialStatus" name="commercialStatus" defaultValue={v.commercialStatus} className="field">
              {Object.entries(commercialLabel).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
            <p className="caption mt-1.5 text-mist">Independente da etapa do trabalho.</p>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="workNote" className="field-label">Nota sobre a etapa</label>
            <input id="workNote" name="workNote" defaultValue={v.workNote} className="field" />
          </div>
          <Field label="Preço (R$)" name="priceAmount" defaultValue={v.price?.amount} hint="Só aparece se autorizado abaixo." />
          <label className="flex items-center gap-3 self-center text-[0.9375rem]">
            <input type="checkbox" name="priceAuthorised" defaultChecked={v.price?.authorised} className="size-5 accent-[var(--color-wine)]" /> Autorizo publicar o preço
          </label>
        </fieldset>

        <fieldset className="space-y-5">
          <legend className="mb-4 font-sans text-[1.125rem] font-medium">Textos e dados</legend>
          <div>
            <label htmlFor="summary" className="field-label">Resumo</label>
            <textarea id="summary" name="summary" rows={2} defaultValue={v.summary} className="field" />
          </div>
          <div>
            <label htmlFor="vehicleFacts" className="field-label">Este exemplar</label>
            <textarea id="vehicleFacts" name="vehicleFacts" rows={6} defaultValue={specsToText(v.vehicleFacts)} className="field tabular" />
            <p className="caption mt-1.5 text-mist">Uma linha por item, no formato “Rótulo: valor”. Escreva “a confirmar” no que não estiver verificado.</p>
          </div>
          <div>
            <label htmlFor="modelReference" className="field-label">Referência do modelo (dados de fábrica)</label>
            <textarea id="modelReference" name="modelReference" rows={4} defaultValue={specsToText(v.modelReference)} className="field tabular" />
          </div>
          <div>
            <label htmlFor="history" className="field-label">Histórico da preparação</label>
            <textarea id="history" name="history" rows={5} defaultValue={v.history.map((h) => (h.date || h.note ? [h.date ?? "", h.title, h.note ?? ""].join(" | ") : h.title)).join("\n")} className="field" />
            <p className="caption mt-1.5 text-mist">Uma etapa por linha: “data | título | nota” (data e nota opcionais).</p>
          </div>
          <div>
            <label htmlFor="notes" className="field-label">Observações</label>
            <textarea id="notes" name="notes" rows={2} defaultValue={v.notes} className="field" />
          </div>
        </fieldset>
      </ActionForm>

      <section className="mt-16 border-t border-[var(--line-dark)] pt-10">
        <h2 className="font-sans text-[1.125rem] font-medium tracking-normal">Fotografias</h2>
        <p className="caption mt-1 text-mist">Fotos reais aparecem primeiro. Ilustrações geradas por IA devem ser marcadas como “ilustração”.</p>
        <ul className="mt-6 space-y-4">
          {v.photos.map((p, i) => (
            <li key={p.src} className="grid gap-4 rounded-[3px] border border-[var(--line-dark)] p-4 sm:grid-cols-[8rem_1fr]">
              <div className="relative aspect-[4/3] bg-graphite">
                <Image src={p.src} alt="" fill sizes="128px" className="object-cover" />
              </div>
              <div>
                <form action={editPhoto} className="grid gap-3 sm:grid-cols-[1fr_9rem]">
                  <input type="hidden" name="slug" value={v.slug} />
                  <input type="hidden" name="src" value={p.src} />
                  <input type="hidden" name="op" value="meta" />
                  <input name="alt" defaultValue={p.alt} aria-label="Texto alternativo" className="field !min-h-10 !py-2 text-[0.875rem]" />
                  <select name="kind" defaultValue={p.kind} aria-label="Tipo" className="field !min-h-10 !py-2 text-[0.875rem]">
                    <option value="real">Fotografia real</option>
                    <option value="concept">Ilustração / IA</option>
                  </select>
                  <input name="caption" defaultValue={p.caption} aria-label="Legenda" className="field !min-h-10 !py-2 text-[0.875rem] sm:col-span-2" />
                  <button type="submit" className="link-line caption justify-self-start text-silver">Salvar legenda</button>
                </form>
                <div className="mt-3 flex gap-4">
                  {(["up", "down", "delete"] as const).map((op) =>
                    (op === "up" && i === 0) || (op === "down" && i === v.photos.length - 1) ? null : (
                      <form key={op} action={editPhoto}>
                        <input type="hidden" name="slug" value={v.slug} />
                        <input type="hidden" name="src" value={p.src} />
                        <input type="hidden" name="op" value={op} />
                        <button type="submit" className={`link-line caption ${op === "delete" ? "text-[#f0a2aa]" : "text-silver"}`}>
                          {op === "up" ? "Subir" : op === "down" ? "Descer" : "Remover"}
                        </button>
                      </form>
                    ),
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>

        <ActionForm action={uploadVehiclePhoto} submitLabel="Enviar fotografia" encType="multipart/form-data" className="mt-8 rounded-[3px] border border-dashed border-ivory/25 p-5">
          <input type="hidden" name="slug" value={v.slug} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="photo" className="field-label">Nova fotografia (JPG, PNG ou WEBP)</label>
              <input id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" required className="block w-full text-[0.9375rem] file:mr-4 file:rounded-full file:border-0 file:bg-ivory/10 file:px-4 file:py-2 file:text-ivory" />
              <p className="caption mt-1.5 text-mist">Oculte placas antes de enviar. Metadados (como localização) são removidos automaticamente.</p>
            </div>
            <div>
              <label htmlFor="alt" className="field-label">Descrição (texto alternativo)</label>
              <input id="alt" name="alt" required className="field" />
            </div>
            <div>
              <label htmlFor="kind" className="field-label">Tipo</label>
              <select id="kind" name="kind" className="field">
                <option value="real">Fotografia real</option>
                <option value="concept">Ilustração / IA</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="caption" className="field-label">Legenda</label>
              <input id="caption" name="caption" placeholder="Fotografia real · funilaria em andamento" className="field" />
            </div>
          </div>
        </ActionForm>
      </section>
    </div>
  );
}
