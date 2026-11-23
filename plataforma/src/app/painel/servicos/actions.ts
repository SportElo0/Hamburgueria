'use server';

import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { requireUser } from '@/lib/auth';
import { limparTexto, pareceCpf } from '@/lib/crm';
import { MAX_RESUMO, MAX_SERVICOS, PASTA_FOTOS, SITUACOES, demoValida, imagemValida, tipoDaImagem, type Servico } from '@/lib/servicos';
import { mudarServicos } from '@/lib/servicos-servidor';
import { gravacaoPermitida, SomenteLeituraError } from '@/lib/ambiente';
import { storage } from '@/lib/storage';
import { newId } from '@/lib/schema';

export type ResultadoServicos = { ok: true; lista: Servico[] } | { ok: false; error: string };

const Dados = z.object({
  id: z.string().max(60).optional(),
  nome: z.string().max(200),
  resumo: z.string().max(1000),
  situacao: z.enum(SITUACOES),
  imagem: z.string().max(200),
  demo: z.string().max(400),
});

class Erro extends Error {}

async function rodar(fn: (l: Servico[], agora: string) => Servico[]): Promise<ResultadoServicos> {
  await requireUser();
  try {
    return { ok: true, lista: await mudarServicos((l) => fn(l, new Date().toISOString())) };
  } catch (err) {
    if (err instanceof SomenteLeituraError || err instanceof Erro) return { ok: false, error: err.message };
    console.error('servicos', err);
    return { ok: false, error: 'Não foi possível salvar agora. Tente de novo.' };
  }
}

/** New service (no id) or edit. */
export async function salvarServicoAction(dados: unknown): Promise<ResultadoServicos> {
  const p = Dados.safeParse(dados);
  if (!p.success) return { ok: false, error: 'Confira os campos.' };
  const nome = limparTexto(p.data.nome, 80);
  const resumo = limparTexto(p.data.resumo, MAX_RESUMO);
  const demo = p.data.demo.trim();
  if (!nome) return { ok: false, error: 'Escreva o nome do serviço.' };
  if (pareceCpf(nome) || pareceCpf(resumo)) return { ok: false, error: 'Não salve CPF aqui.' };
  if (!imagemValida(p.data.imagem)) return { ok: false, error: 'Foto inválida. Envie a foto de novo.' };
  if (!demoValida(demo)) return { ok: false, error: 'O link da demonstração precisa começar com https://' };
  const campos = { nome, resumo, situacao: p.data.situacao, imagem: p.data.imagem, demo };
  return rodar((l, agora) => {
    if (p.data.id) {
      const s = l.find((x) => x.id === p.data.id);
      if (!s) throw new Erro('Serviço não encontrado. Recarregue a página.');
      Object.assign(s, campos);
      return l;
    }
    if (l.length >= MAX_SERVICOS) throw new Erro('Lista cheia.');
    return [...l, { id: randomUUID(), ...campos, criadoEm: agora.slice(0, 10) }];
  });
}

export async function removerServicoAction(id: string): Promise<ResultadoServicos> {
  if (typeof id !== 'string' || id.length > 60) return { ok: false, error: 'Inválido.' };
  return rodar((l) => l.filter((x) => x.id !== id));
}

const MAX_FOTO = 5 * 1024 * 1024;
const TIPO_CONTEUDO = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp', avif: 'image/avif' } as const;

/** A demo picture for a card. Saved under a new random name; the card points to it only when saved. */
export async function enviarFotoServicoAction(formData: FormData): Promise<{ ok: true; imagem: string } | { ok: false; error: string }> {
  await requireUser();
  if (!gravacaoPermitida()) return { ok: false, error: new SomenteLeituraError().message };
  const file = formData.get('arquivo');
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: 'Nenhuma foto enviada.' };
  if (file.size > MAX_FOTO) return { ok: false, error: 'A foto passa de 5 MB. Reduza e tente de novo.' };
  const bytes = Buffer.from(await file.arrayBuffer());
  const tipo = tipoDaImagem(bytes);
  if (!tipo) return { ok: false, error: 'Use uma foto JPG, PNG, WebP ou AVIF.' };
  const imagem = `midia/${PASTA_FOTOS}/${newId()}.${tipo}`;
  try {
    await storage().writeFile(imagem, bytes, TIPO_CONTEUDO[tipo]);
    return { ok: true, imagem };
  } catch (err) {
    console.error('servicos foto', err);
    return { ok: false, error: 'Não foi possível enviar a foto agora.' };
  }
}
