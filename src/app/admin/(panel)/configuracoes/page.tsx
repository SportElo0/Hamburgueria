import { getServices, getSettings } from "@/lib/repo";
import { ActionForm } from "../../action-form";
import { saveServiceList, saveSiteSettings } from "../../actions";

export default async function AdminSettings() {
  const [s, services] = await Promise.all([getSettings(), getServices()]);
  return (
    <div className="max-w-3xl">
      <h1 className="font-sans text-[1.75rem] font-medium tracking-normal">Contatos e serviços</h1>

      <section className="mt-10">
        <h2 className="font-sans text-[1.125rem] font-medium tracking-normal">Contatos publicados</h2>
        <p className="caption mt-1 text-mist">Campos vazios não aparecem no site. Nunca publique números de teste.</p>
        <ActionForm action={saveSiteSettings} submitLabel="Salvar contatos" className="mt-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="whatsapp" className="field-label">WhatsApp oficial</label>
              <input id="whatsapp" name="whatsapp" inputMode="numeric" defaultValue={s.whatsapp} placeholder="5511912345678" className="field tabular" />
              <p className="caption mt-1.5 text-mist">Com código do país (55) e DDD, só números.</p>
            </div>
            <div>
              <label htmlFor="email" className="field-label">E-mail</label>
              <input id="email" name="email" type="email" defaultValue={s.email} className="field" />
            </div>
            <div>
              <label htmlFor="instagram" className="field-label">Instagram</label>
              <input id="instagram" name="instagram" defaultValue={s.instagram} placeholder="@perfil" className="field" />
            </div>
            <div>
              <label htmlFor="city" className="field-label">Cidade</label>
              <input id="city" name="city" defaultValue={s.city} className="field" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="addressNote" className="field-label">Endereço ou observação de visita</label>
              <input id="addressNote" name="addressNote" defaultValue={s.addressNote} placeholder="Visitas com hora marcada" className="field" />
            </div>
          </div>
        </ActionForm>
      </section>

      <section className="mt-16 border-t border-[var(--line-dark)] pt-10">
        <h2 className="font-sans text-[1.125rem] font-medium tracking-normal">Serviços de restauração</h2>
        <p className="caption mt-1 text-mist">Marque “confirmado” quando o serviço for realmente oferecido. Enquanto houver itens não confirmados, o site exibe um aviso.</p>
        <ActionForm action={saveServiceList} submitLabel="Salvar serviços" className="mt-6 space-y-8">
          {services.map((sv) => (
            <fieldset key={sv.slug} className="grid gap-4 rounded-[3px] border border-[var(--line-dark)] p-5">
              <legend className="px-1 text-[0.9375rem] font-medium">{sv.name}</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor={`${sv.slug}.name`} className="field-label">Nome</label>
                  <input id={`${sv.slug}.name`} name={`${sv.slug}.name`} defaultValue={sv.name} className="field" />
                </div>
                <div>
                  <label htmlFor={`${sv.slug}.short`} className="field-label">Frase curta</label>
                  <input id={`${sv.slug}.short`} name={`${sv.slug}.short`} defaultValue={sv.short} className="field" />
                </div>
              </div>
              <div>
                <label htmlFor={`${sv.slug}.description`} className="field-label">Descrição</label>
                <textarea id={`${sv.slug}.description`} name={`${sv.slug}.description`} rows={2} defaultValue={sv.description} className="field" />
              </div>
              <label className="flex items-center gap-3 text-[0.9375rem]">
                <input type="checkbox" name={`${sv.slug}.confirmed`} defaultChecked={sv.confirmed} className="size-5 accent-[var(--color-wine)]" /> Confirmado pelo proprietário
              </label>
            </fieldset>
          ))}
        </ActionForm>
      </section>
    </div>
  );
}
