import type { ReactNode } from "react";
import { occasionById, productById, site } from "@/config/site";
import { formatLongDate } from "@/lib/dates";
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

export function Convite({ draft, footer }: { draft: OrderDraft; footer?: ReactNode }) {
  const guests = guestsNumber(draft.guests);
  const theme = cleanText(draft.theme);
  const flavor = cleanText(draft.flavor);
  const cakeMessage = cleanText(draft.cakeMessage);
  const name = cleanText(draft.name);
  const style = stylePhrase(draft);

  return (
    <article
      aria-label="Prévia do seu pedido"
      className="scallop-top relative rounded-b-[var(--radius-card)] bg-cream px-7 pt-10 pb-8 text-ink shadow-[0_30px_60px_-30px_rgb(20_8_4/0.7)] sm:px-10 sm:pt-12 sm:pb-10"
    >
      <p className="smallcaps flex items-center justify-center gap-2.5 text-cherry">
        <span aria-hidden className="dot" />
        Pedido de orçamento
        <span aria-hidden className="dot" />
      </p>

      <div className="serif mt-6 text-[1.3rem] leading-[1.75] sm:text-[1.45rem]">
        <p>Olá, {site.ownerFirstName}!</p>
        <p className="mt-2">
          Gostaria de um bolo para <Slot value={occasionPhrase(draft)} placeholder="a ocasião" />,{" "}
          {style.lead} <Slot value={style.value} placeholder="um estilo" />, para cerca de{" "}
          <Slot value={guests ? `${guests} ${guests === 1 ? "pessoa" : "pessoas"}` : null} placeholder="quantas pessoas" />, com o tema{" "}
          <Slot value={theme || null} placeholder="da festa" />, para o dia{" "}
          <Slot value={draft.date ? formatLongDate(draft.date) : null} placeholder="que você escolher" />.
        </p>
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
