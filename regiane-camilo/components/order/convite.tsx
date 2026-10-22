import type { ReactNode } from "react";
import { occasionById, productById, site } from "@/config/site";
import { formatLongDate } from "@/lib/dates";
import { Seal } from "@/components/brand";
import { cleanText, guestsNumber, type OrderDraft } from "@/lib/order";

/**
 * O convite: a frase do pedido com lacunas pontilhadas que se preenchem
 * enquanto a cliente escolhe. A palavra nova "assenta" como tinta (key muda).
 */
function Slot({ value, placeholder }: { value: string | null; placeholder: string }) {
  if (!value) return <span className="blank">{placeholder}</span>;
  return (
    <span key={value} className="filled animate-ink">
      {value}
    </span>
  );
}

function occasionPhrase(draft: OrderDraft): string | null {
  const occasion = occasionById(draft.occasion);
  if (!occasion) return null;
  if (occasion.id === "outra") return cleanText(draft.occasionOther) || occasion.phrase;
  return occasion.phrase;
}

function stylePhrase(draft: OrderDraft): { lead: string; value: string | null } {
  const style = draft.style;
  if (!style) return { lead: "inspirado em", value: null };
  if (style.kind === "custom") return { lead: "com", value: "uma ideia minha" };
  if (style.kind === "suggest") return { lead: "com", value: "sugestões suas" };
  const product = productById(style.productId);
  return { lead: "inspirado no bolo", value: product ? `“${product.name}”` : null };
}

type Props = {
  draft: OrderDraft;
  /** Versão curta para o celular: só a frase, acima das escolhas de cada etapa. */
  compact?: boolean;
  footer?: ReactNode;
};

export function Convite({ draft, compact = false, footer }: Props) {
  const guests = guestsNumber(draft.guests);
  const theme = cleanText(draft.theme);
  const flavor = cleanText(draft.flavor);
  const cakeMessage = cleanText(draft.cakeMessage);
  const name = cleanText(draft.name);
  const style = stylePhrase(draft);

  const sentence = (
    <>
      Gostaria de um bolo para <Slot value={occasionPhrase(draft)} placeholder="a ocasião" />,{" "}
      {style.lead} <Slot value={style.value} placeholder="um estilo" />, para cerca de{" "}
      <Slot value={guests ? `${guests} ${guests === 1 ? "pessoa" : "pessoas"}` : null} placeholder="quantas pessoas" />, com o tema{" "}
      <Slot value={theme || null} placeholder="da festa" />, para o dia{" "}
      <Slot value={draft.date ? formatLongDate(draft.date) : null} placeholder="que você escolher" />.
    </>
  );

  if (compact) {
    return (
      <article
        aria-label="Prévia do seu pedido"
        className="scallop-top rounded-b-2xl bg-cream px-5 pt-7 pb-5 text-ink shadow-[0_20px_40px_-26px_rgb(20_8_4/0.8)]"
      >
        <p className="serif text-[1.05rem] leading-[1.7]">{sentence}</p>
      </article>
    );
  }

  return (
    <article
      aria-label="Prévia do seu pedido"
      className="scallop-top relative rounded-b-[var(--radius-card)] bg-cream px-7 pt-12 pb-8 text-ink shadow-[0_30px_60px_-30px_rgb(20_8_4/0.7)] sm:px-10 sm:pt-14 sm:pb-10"
    >
      {/* Moldura de papel de carta: fio rosa por dentro da borda. */}
      <span aria-hidden className="pointer-events-none absolute inset-x-3 top-6 bottom-3 rounded-b-xl border border-rose/50" />
      {/* O selo da Regiane como carimbo do convite. */}
      <Seal size={76} decorative className="absolute top-3 right-5 size-16 rotate-[8deg] shadow-[0_8px_18px_-10px_rgb(75_38_22/0.6)] sm:right-7 sm:size-[4.75rem]" />

      <div className="serif relative text-[1.3rem] leading-[1.75] sm:text-[1.45rem]">
        <p className="pr-16 sm:pr-20">Olá, {site.ownerFirstName}!</p>
        <p className="mt-2">{sentence}</p>
      </div>

      <dl className="mt-6 grid gap-x-6 gap-y-3 border-t border-line pt-5 text-[0.9375rem] sm:grid-cols-2">
        <div>
          <dt className="text-[0.8125rem] text-muted">Sabor ou recheio</dt>
          <dd className="mt-0.5">
            <Slot value={flavor || null} placeholder="a combinar" />
          </dd>
        </div>
        <div>
          <dt className="text-[0.8125rem] text-muted">Mensagem no bolo</dt>
          <dd className="mt-0.5">
            <Slot value={cakeMessage || null} placeholder="opcional" />
          </dd>
        </div>
      </dl>

      <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <p className="serif text-[1.2rem] leading-snug">
          Com carinho,
          <br />
          <Slot value={name || null} placeholder="seu nome" />
        </p>
        <p className="text-[0.8125rem] leading-snug text-muted sm:max-w-[11rem] sm:text-right">
          Valor a combinar com a confeitaria
        </p>
      </div>

      {footer}
    </article>
  );
}
