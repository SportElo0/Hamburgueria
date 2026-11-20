import { parsePrice } from './slug';

/**
 * Lê o cardápio que o Claude escreveu a partir da foto ou do PDF do restaurante, num formato simples:
 *
 *   ## Lanches
 *   X-Salada | 34,90 | Pão, hambúrguer, alface e tomate
 *   X-Bacon | 39,90
 *
 * Uma categoria por linha começando com #. Um item por linha: nome | preço | descrição (opcional). Também aceita
 * "Nome - R$ 34,90" e "Nome ..... 34,90". Linhas que não dá para entender voltam como aviso, nunca somem caladas.
 */

export interface ItemImportado {
  name: string;
  price: number;
  description: string;
}
export interface CategoriaImportada {
  name: string;
  items: ItemImportado[];
}
export interface Importacao {
  categorias: CategoriaImportada[];
  avisos: string[];
  total: number;
}

export const MAX_ITENS_IMPORTACAO = 300;

export const PEDIDO_AO_CLAUDE = `Transcreva o cardápio desta foto (ou PDF) exatamente neste formato, sem nada antes nem depois:

## Nome da categoria
Nome do item | preço | descrição curta (se tiver)

Regras:
- Uma categoria por linha começando com ##, na ordem do cardápio.
- Um item por linha: nome | preço | descrição. Preço só com números e vírgula (ex.: 34,90), sem "R$".
- Copie os nomes, preços e descrições como estão no cardápio. Não invente item, preço nem descrição.
- Se um item tiver tamanhos (P, M, G), faça uma linha para cada tamanho: "Pizza Calabresa (M) | 49,90".
- Se não der para ler um preço, escreva o item com "?" no lugar do preço.`;

const limpa = (t: string) => t.replace(/\s+/g, ' ').replace(/^[-*•\d.)\s]+(?=\S)/, '').trim();

/** "34,90", "R$ 34,90", "34.90" → centavos; senão null. */
function preco(t: string): number | null {
  const v = parsePrice(t.trim());
  return v === null || Number.isNaN(v) || v < 1 ? null : v;
}

export function lerCardapio(texto: string): Importacao {
  const categorias: CategoriaImportada[] = [];
  const avisos: string[] = [];
  let atual: CategoriaImportada | null = null;
  let total = 0;
  const linhas = texto.replace(/\r/g, '').split('\n');
  linhas.forEach((bruta, i) => {
    const linha = bruta.trim();
    if (!linha || /^```/.test(linha)) return;
    const cat = /^#{1,3}\s*(.+)$/.exec(linha);
    if (cat) {
      const name = limpa(cat[1]).replace(/[:*]+$/, '').slice(0, 80);
      if (!name) return;
      atual = categorias.find((c) => c.name.toLocaleLowerCase('pt-BR') === name.toLocaleLowerCase('pt-BR')) ?? null;
      if (!atual) {
        atual = { name, items: [] };
        categorias.push(atual);
      }
      return;
    }
    let name = '';
    let valor: number | null = null;
    let description = '';
    if (linha.includes('|')) {
      const partes = linha.split('|').map((p) => p.trim());
      name = limpa(partes[0] ?? '');
      valor = preco(partes[1] ?? '');
      description = (partes.slice(2).join(' | ') ?? '').trim();
    } else {
      // "Nome - R$ 34,90" ou "Nome ...... 34,90": o preço é o último número da linha.
      const m = /^(.*?)[\s.\-–—:]*(?:R\$\s*)?(\d{1,6}(?:[.,]\d{1,2})?)\s*$/.exec(linha);
      if (m) {
        name = limpa(m[1]);
        valor = preco(m[2]);
      } else name = limpa(linha);
    }
    if (!name) return;
    if (valor === null) {
      avisos.push(`Linha ${i + 1}: "${name.slice(0, 60)}" ficou sem preço e não entra. Corrija o preço e cole de novo.`);
      return;
    }
    if (total >= MAX_ITENS_IMPORTACAO) {
      if (total === MAX_ITENS_IMPORTACAO) avisos.push(`Mais de ${MAX_ITENS_IMPORTACAO} itens: o resto não entra.`);
      total++;
      return;
    }
    if (!atual) {
      atual = { name: 'Cardápio', items: [] };
      categorias.push(atual);
    }
    atual.items.push({ name: name.slice(0, 120), price: valor, description: description.slice(0, 600) });
    total++;
  });
  return { categorias: categorias.filter((c) => c.items.length), avisos, total: Math.min(total, MAX_ITENS_IMPORTACAO) };
}
