import { EMPRESA } from '@/data/empresa';
import type { Produto } from '@/data/catalogo';

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://clipsbacchi.com.br').replace(/\/$/, '');

export function jsonLdOrganizacao() {
  const e = EMPRESA;
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: e.nome,
    legalName: e.razaoSocial,
    foundingDate: String(e.fundacao),
    url: SITE_URL,
    logo: `${SITE_URL}/img/marca/logo-azul.png`,
    telephone: e.telefone,
    email: e.email,
    sameAs: [e.instagram],
    address: {
      '@type': 'PostalAddress',
      streetAddress: e.endereco.rua,
      addressLocality: e.endereco.cidade,
      addressRegion: e.endereco.uf,
      postalCode: e.endereco.cep,
      addressCountry: 'BR',
    },
  };
}

/** Product markup without offers: the catalogue publishes no prices, and none are invented here. */
export function jsonLdProduto(p: Produto) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${p.nome} Bacchi`,
    description: p.resumo,
    brand: { '@type': 'Brand', name: 'Bacchi' },
    manufacturer: { '@type': 'Organization', name: EMPRESA.razaoSocial },
    material: p.material,
    image: p.imagens.map((i) => `${SITE_URL}${i.src}`),
    url: `${SITE_URL}/produtos/${p.slug}`,
  };
}

export function jsonLdTrilha(itens: { nome: string; caminho: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: itens.map((i, k) => ({ '@type': 'ListItem', position: k + 1, name: i.nome, item: `${SITE_URL}${i.caminho}` })),
  };
}
