'use client';

import { newId, type Store } from '@/lib/schema';
import type { Update } from './StoreEditor';
import { IconButton } from './CatalogEditor';

function Field(props: { id: string; label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; help?: string }) {
  return (
    <div>
      <label htmlFor={props.id} className="label">{props.label}</label>
      <input
        id={props.id}
        type={props.type ?? 'text'}
        className="field"
        placeholder={props.placeholder}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        aria-describedby={props.help ? `${props.id}-help` : undefined}
      />
      {props.help && <p id={`${props.id}-help`} className="mt-1 text-xs text-ink-mute">{props.help}</p>}
    </div>
  );
}

export function InfoEditor({ store, update }: { store: Store; update: Update }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="card space-y-4 p-5">
        <h2 className="text-lg font-bold">Loja</h2>
        <Field id="nome" label="Nome" value={store.name} onChange={(v) => update((d) => void (d.name = v))} />
        <Field id="site" label="Endereço do site" placeholder="https://" value={store.siteUrl} onChange={(v) => update((d) => void (d.siteUrl = v))} />
        <div>
          <label htmlFor="segmento" className="label">Tipo de negócio</label>
          <select id="segmento" className="field" value={store.segment} onChange={(e) => update((d) => void (d.segment = e.target.value as Store['segment']))}>
            <option value="restaurante">Restaurante</option>
            <option value="loja">Loja</option>
            <option value="servico">Serviço</option>
          </select>
        </div>
      </section>

      <section className="card space-y-4 p-5">
        <h2 className="text-lg font-bold">Contato</h2>
        <Field
          id="whatsapp"
          label="WhatsApp de pedidos"
          placeholder="5511999999999"
          help="Com código do país e DDD, só números."
          value={store.contact.whatsapp}
          onChange={(v) => update((d) => void (d.contact.whatsapp = v.replace(/\D/g, '')))}
        />
        <Field id="instagram" label="Instagram" placeholder="@loja" value={store.contact.instagram} onChange={(v) => update((d) => void (d.contact.instagram = v))} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="telefone" label="Telefone" value={store.contact.phone} onChange={(v) => update((d) => void (d.contact.phone = v))} />
          <Field id="email" type="email" label="E-mail" value={store.contact.email} onChange={(v) => update((d) => void (d.contact.email = v))} />
        </div>
      </section>

      <section className="card space-y-3 p-5 lg:col-span-2">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">Aviso no site</h2>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
            <input type="checkbox" className="h-4 w-4" checked={store.notice.active} onChange={(e) => update((d) => void (d.notice.active = e.target.checked))} />
            Mostrar aviso
          </label>
        </div>
        <input
          aria-label="Texto do aviso"
          className="field"
          placeholder="Ex.: Fechado no feriado de 15/11. Voltamos dia 16!"
          value={store.notice.text}
          onChange={(e) => update((d) => void (d.notice.text = e.target.value))}
        />
      </section>

      <section className="card space-y-4 p-5 lg:col-span-2">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">Unidades, endereço e horários</h2>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => update((d) => void d.units.push({ id: newId(), name: d.units.length ? 'Nova unidade' : d.name, address: '', mapsUrl: '', whatsapp: '', hours: [] }))}
          >
            + Unidade
          </button>
        </div>
        {store.units.length === 0 && <p className="text-sm text-ink-mute">Nenhuma unidade cadastrada.</p>}
        {store.units.map((u, ui) => (
          <div key={u.id} className="rounded-lg border border-line p-4">
            <div className="flex items-start gap-2">
              <div className="grid flex-1 gap-3 sm:grid-cols-2">
                <Field id={`u-${u.id}-nome`} label="Nome da unidade" value={u.name} onChange={(v) => update((d) => void (d.units[ui].name = v))} />
                <Field
                  id={`u-${u.id}-wpp`}
                  label="WhatsApp da unidade (se diferente)"
                  value={u.whatsapp}
                  onChange={(v) => update((d) => void (d.units[ui].whatsapp = v.replace(/\D/g, '')))}
                />
                <Field id={`u-${u.id}-end`} label="Endereço" value={u.address} onChange={(v) => update((d) => void (d.units[ui].address = v))} />
                <Field id={`u-${u.id}-maps`} label="Link do Google Maps" value={u.mapsUrl} onChange={(v) => update((d) => void (d.units[ui].mapsUrl = v))} />
              </div>
              <IconButton
                label="Excluir unidade"
                danger
                onClick={() => {
                  if (confirm(`Excluir a unidade “${u.name}”?`)) update((d) => void d.units.splice(ui, 1));
                }}
              >
                ✕
              </IconButton>
            </div>
            <p className="label mt-4">Horários</p>
            <ul className="space-y-2">
              {u.hours.map((h, hi) => (
                <li key={hi} className="flex gap-2">
                  <input aria-label="Dias" placeholder="Ter a dom" className="field" value={h.days} onChange={(e) => update((d) => void (d.units[ui].hours[hi].days = e.target.value))} />
                  <input aria-label="Horário" placeholder="18h às 23h" className="field" value={h.time} onChange={(e) => update((d) => void (d.units[ui].hours[hi].time = e.target.value))} />
                  <IconButton label="Excluir horário" danger onClick={() => update((d) => void d.units[ui].hours.splice(hi, 1))}>✕</IconButton>
                </li>
              ))}
            </ul>
            <button type="button" className="mt-2 cursor-pointer text-sm font-semibold text-accent" onClick={() => update((d) => void d.units[ui].hours.push({ days: '', time: '' }))}>
              + Horário
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}
