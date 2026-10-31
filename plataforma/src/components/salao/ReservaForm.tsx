'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { availabilityAction, createReservationAction } from '@/app/reservar/[slug]/actions';
import { brl } from '@/lib/ordering';

const dayLabel = (date: string) =>
  new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' }).format(new Date(`${date}T12:00:00-03:00`)).replace('.', '');

export function ReservaForm(props: {
  slug: string;
  storeName: string;
  days: string[];
  maxPeople: number;
  depositPerPerson: number;
  cancelHours: number;
  toleranceMinutes: number;
  emailRequired: boolean;
}) {
  const router = useRouter();
  const [date, setDate] = useState(props.days[0] ?? '');
  const [slots, setSlots] = useState<{ time: string; left: number }[] | null>(null);
  const [time, setTime] = useState('');
  const [people, setPeople] = useState(2);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();
  const deposit = props.depositPerPerson * people;

  useEffect(() => {
    if (!date) return;
    let alive = true;
    availabilityAction(props.slug, date).then((res) => {
      if (!alive) return;
      setSlots(res.ok ? res.data : []);
      setTime('');
      if (!res.ok) setError(res.error);
    });
    return () => {
      alive = false;
    };
  }, [date, props.slug]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!time) return setError('Escolha o horário.');
    if (name.trim().length < 2) return setError('Informe seu nome.');
    if (phone.replace(/\D/g, '').length < 10) return setError('Informe seu telefone com DDD.');
    if (props.emailRequired && !email.trim()) return setError('Informe seu e-mail para o comprovante do Pix.');
    if (!accepted) return setError('Para reservar, aceite as regras do sinal.');
    startTransition(async () => {
      const res = await createReservationAction(props.slug, { date, time, people, name, phone, email, accepted: true });
      if (!res.ok) return setError(res.error);
      router.push(`/reservar/${props.slug}/${res.data.id}?t=${res.data.token}`);
    });
  };

  if (!props.days.length) {
    return (
      <main className="mx-auto max-w-xl px-5 py-16">
        <h1 className="text-2xl font-bold">Sem horários para reservar</h1>
        <p className="mt-2 text-ink-soft">{props.storeName} não tem horários abertos para reserva nos próximos dias.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl px-4 pt-8 pb-16">
      <p className="text-xs font-semibold tracking-wide text-ink-mute uppercase">Reservar mesa</p>
      <h1 className="mt-1 text-3xl font-black tracking-tight">{props.storeName}</h1>

      <form onSubmit={submit} noValidate className="mt-6 space-y-6">
        <fieldset className="min-w-0">
          <legend className="label">Dia</legend>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {props.days.map((d) => (
              <button key={d} type="button" onClick={() => setDate(d)} aria-pressed={d === date} className={`min-h-11 shrink-0 rounded-lg border px-3 text-sm font-semibold capitalize ${d === date ? 'border-ink bg-ink text-white' : 'border-line bg-white'}`}>
                {dayLabel(d)}
              </button>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="pessoas" className="label">
            Pessoas
          </label>
          <div className="flex items-center gap-3">
            <button type="button" className="btn-ghost min-h-11 w-11 text-lg" onClick={() => setPeople((p) => Math.max(1, p - 1))} aria-label="Menos uma pessoa">
              −
            </button>
            <input id="pessoas" className="field w-20 text-center tabular-nums" inputMode="numeric" value={people} onChange={(e) => setPeople(Math.min(props.maxPeople, Math.max(1, Number(e.target.value.replace(/\D/g, '')) || 1)))} />
            <button type="button" className="btn-ghost min-h-11 w-11 text-lg" onClick={() => setPeople((p) => Math.min(props.maxPeople, p + 1))} aria-label="Mais uma pessoa">
              +
            </button>
            <span className="text-xs text-ink-mute">até {props.maxPeople} pelo site</span>
          </div>
        </div>

        <fieldset className="min-w-0">
          <legend className="label">Horário</legend>
          {slots === null ? (
            <p className="text-sm text-ink-mute">Carregando horários…</p>
          ) : slots.length === 0 ? (
            <p className="text-sm text-ink-mute">Sem horários neste dia. Escolha outro.</p>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {slots.map((s) => (
                <button
                  key={s.time}
                  type="button"
                  disabled={s.left === 0}
                  onClick={() => setTime(s.time)}
                  aria-pressed={s.time === time}
                  className={`min-h-11 rounded-lg border text-sm font-semibold tabular-nums disabled:cursor-not-allowed disabled:opacity-40 ${s.time === time ? 'border-ink bg-ink text-white' : 'border-line bg-white'}`}
                >
                  {s.time}
                  {s.left === 0 && <span className="sr-only"> (lotado)</span>}
                </button>
              ))}
            </div>
          )}
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="nome" className="label">
              Seu nome
            </label>
            <input id="nome" className="field" autoComplete="name" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label htmlFor="tel" className="label">
              WhatsApp
            </label>
            <input id="tel" className="field" type="tel" autoComplete="tel" inputMode="tel" placeholder="(11) 90000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="email" className="label">
              E-mail {props.emailRequired ? '(para o comprovante do Pix)' : '(opcional)'}
            </label>
            <input id="email" className="field" type="email" autoComplete="email" value={email} maxLength={120} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>

        <section className="rounded-xl border border-line bg-white p-4 text-sm" aria-labelledby="regras">
          <h2 id="regras" className="font-bold">
            {deposit > 0 ? `Sinal de ${brl(deposit)} pelo Pix` : 'Reserva sem sinal'}
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-soft">
            {deposit > 0 && <li>O sinal ({brl(props.depositPerPerson)} por pessoa) é descontado da sua conta no dia. Se a conta der menos que o sinal, devolvemos a diferença.</li>}
            {deposit > 0 && <li>Cancelou até {props.cancelHours} {props.cancelHours === 1 ? 'hora' : 'horas'} antes do horário: devolvemos o sinal inteiro, pelo próprio Pix.</li>}
            {deposit > 0 && <li>Cancelou depois disso, ou não chegou até {props.toleranceMinutes} minutos depois do horário: o sinal fica com o restaurante.</li>}
            <li>Depois de {props.toleranceMinutes} minutos de atraso, a mesa pode ser liberada.</li>
            <li>Seu nome e telefone ficam só com o restaurante, para a reserva.</li>
          </ul>
          <label className="mt-3 flex cursor-pointer items-start gap-2">
            <input type="checkbox" className="mt-0.5 h-5 w-5 accent-ink" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
            <span>Li e aceito as regras {deposit > 0 ? 'do sinal' : 'da reserva'}.</span>
          </label>
        </section>

        {error && (
          <p role="alert" className="text-sm font-semibold text-bad">
            {error}
          </p>
        )}
        <button type="submit" disabled={pending} className="btn-primary min-h-12 w-full text-base">
          {pending ? 'Reservando…' : deposit > 0 ? `Reservar e pagar o sinal de ${brl(deposit)}` : 'Reservar'}
        </button>
      </form>
    </main>
  );
}
