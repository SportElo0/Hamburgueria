"use server";

import { site } from "@/config/site";
import { areas } from "@/data/areas";

export type ContactField = "name" | "reply" | "area" | "message";

export type ContactState = {
  status: "idle" | "error" | "demo" | "sent";
  attempt: number;
  errors: Partial<Record<ContactField, string>>;
  values: Record<ContactField, string>;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function clean(value: FormDataEntryValue | null, max: number) {
  return String(value ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, max);
}

/**
 * Confere o formulário de contato no servidor.
 *
 * Nada é gravado: não há banco de dados nem arquivo. Enquanto não houver um
 * serviço de envio configurado (`site.contactDelivery`), a resposta é
 * "demo" e a mensagem é descartada ao fim da requisição.
 */
export async function submitContact(previous: ContactState, formData: FormData): Promise<ContactState> {
  const values = {
    name: clean(formData.get("name"), 80),
    reply: clean(formData.get("reply"), 120),
    area: clean(formData.get("area"), 60),
    message: clean(formData.get("message"), 600),
  };
  const attempt = previous.attempt + 1;

  // Campo invisível para robôs: se vier preenchido, finge sucesso e descarta.
  if (clean(formData.get("website"), 200)) {
    return { status: "demo", attempt, errors: {}, values: { name: "", reply: "", area: "", message: "" } };
  }

  const errors: ContactState["errors"] = {};
  if (values.name.length < 2) errors.name = "Informe seu nome.";

  const digits = values.reply.replace(/\D/g, "");
  const isEmail = EMAIL.test(values.reply);
  const isPhone = !values.reply.includes("@") && digits.length >= 10 && digits.length <= 13;
  if (!values.reply) errors.reply = "Informe um e-mail ou telefone para retorno.";
  else if (!isEmail && !isPhone) errors.reply = "Confira o e-mail ou o telefone (com DDD).";

  if (values.area && !areas.some((a) => a.slug === values.area)) errors.area = "Escolha uma área da lista.";

  if (values.message.length < 10) errors.message = "Escreva um resumo breve, com pelo menos 10 caracteres.";

  if (Object.keys(errors).length > 0) return { status: "error", attempt, errors, values };

  if (!site.contactDelivery) {
    // Demonstração: nada é enviado nem armazenado.
    return { status: "demo", attempt, errors: {}, values: { name: "", reply: "", area: "", message: "" } };
  }

  // Ponto de integração: quando o escritório definir o serviço de envio
  // (com sigilo e controles adequados), envie `values` aqui.
  return { status: "sent", attempt, errors: {}, values: { name: "", reply: "", area: "", message: "" } };
}
