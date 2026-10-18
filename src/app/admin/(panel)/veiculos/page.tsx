import Link from "next/link";
import { commercialLabel, workStageLabel } from "@/content/site";
import { getVehicles } from "@/lib/repo";

export default async function AdminVehicles() {
  const vehicles = await getVehicles();
  return (
    <div className="max-w-5xl">
      <h1 className="font-sans text-[1.75rem] font-medium tracking-normal">Veículos</h1>
      <p className="mt-2 text-[0.9375rem] text-silver">Edite dados, situação, preço autorizado e fotografias. As mudanças são publicadas ao salvar.</p>
      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[40rem] text-left text-[0.9375rem]">
          <thead className="caption text-mist">
            <tr className="border-b border-[var(--line-dark)]">
              <th className="py-3 pr-4 font-normal">Ordem</th>
              <th className="py-3 pr-4 font-normal">Carro</th>
              <th className="py-3 pr-4 font-normal">Trabalho</th>
              <th className="py-3 pr-4 font-normal">Situação</th>
              <th className="py-3 pr-4 font-normal">Fotos</th>
              <th className="py-3 font-normal"><span className="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v) => (
              <tr key={v.slug} className="border-b border-[var(--line-dark)]">
                <td className="tabular py-3 pr-4 text-mist">{v.order}</td>
                <td className="py-3 pr-4">
                  <span className="mr-3 inline-block h-4 w-5 align-[-2px] rounded-[2px]" style={{ background: v.color.hex }} aria-hidden />
                  {v.model} {v.chassis} <span className="text-mist">· {v.yearLabel}</span>
                </td>
                <td className="py-3 pr-4 text-silver">{workStageLabel[v.workStage]}</td>
                <td className="py-3 pr-4 text-silver">{commercialLabel[v.commercialStatus]}</td>
                <td className="tabular py-3 pr-4 text-silver">{v.photos.filter((p) => p.kind === "real").length} reais</td>
                <td className="py-3 text-right">
                  <Link href={`/admin/veiculos/${v.slug}`} className="link-line">Editar</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
