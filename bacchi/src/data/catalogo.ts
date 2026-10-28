// The Bacchi catalogue as data. Source: "Catálogo Bacchi (novo).pdf" (8 pages, 2022), the client's technical
// reference; photos are the official ones from clipsbacchi.com.br (scripts/imagens.py). Every value below is
// copied from the PDF tables: no price, stock, code or claim was added. Where the PDF says nothing, the field
// is left out and the page says so.

export type Acabamento =
  | 'galvanizado'
  | 'niquelado'
  | 'colorido'
  | 'latonado'
  | 'cobreado'
  | 'cromado'
  | 'metal'
  | 'plastico-preto'
  | 'plastico-branco'
  | 'verniz-incolor'
  | 'verniz-amarelo'
  | 'pintura-branca';

/** Swatches follow the PDF's legend: grey galvanised, light grey nickel, gold brass, rainbow for painted. */
export const ACABAMENTOS: Record<Acabamento, { nome: string; amostra: string }> = {
  galvanizado: { nome: 'Galvanizado', amostra: 'linear-gradient(135deg,#7d8189,#55595f)' },
  niquelado: { nome: 'Niquelado', amostra: 'linear-gradient(135deg,#d9dbde,#a7abb0)' },
  colorido: { nome: 'Colorido (pintado)', amostra: 'conic-gradient(#e4322b,#f6c200,#2aa148,#1f8ad6,#8e44ad,#e4322b)' },
  latonado: { nome: 'Latonado (dourado)', amostra: 'linear-gradient(135deg,#f3d36b,#c99a2e)' },
  cobreado: { nome: 'Tipo cobreado', amostra: 'linear-gradient(135deg,#d9875a,#9b4f2a)' },
  cromado: { nome: 'Cromado', amostra: 'linear-gradient(135deg,#f4f6f8,#9aa3ab 55%,#e9ecef)' },
  metal: { nome: 'Metal (aço estanhado)', amostra: 'linear-gradient(135deg,#c9ccd0,#8f949a)' },
  'plastico-preto': { nome: 'Plástico preto', amostra: '#1d1f22' },
  'plastico-branco': { nome: 'Plástico branco', amostra: '#f7f7f5' },
  'verniz-incolor': { nome: 'Verniz incolor (metálico)', amostra: 'linear-gradient(135deg,#d2d5d8,#a3a8ad)' },
  'verniz-amarelo': { nome: 'Verniz amarelo (latonado)', amostra: 'linear-gradient(135deg,#efd27a,#c49a33)' },
  'pintura-branca': { nome: 'Pintura branca', amostra: '#ffffff' },
};

export type FamiliaId = 'clips' | 'grampos' | 'alfinetes' | 'escritorio';

export const FAMILIAS: { id: FamiliaId; nome: string; resumo: string; imagem: string }[] = [
  { id: 'clips', nome: 'Clips', resumo: 'Do nº 5 ao 12/0, em aço galvanizado, niquelado, latonado ou pintado.', imagem: '/img/produtos/clips-niquelado.webp' },
  { id: 'grampos', nome: 'Grampos', resumo: 'Para grampeadores de escritório, gráfica, tapeçaria e embalamento, e grampos trançados.', imagem: '/img/produtos/grampos-26.webp' },
  { id: 'alfinetes', nome: 'Alfinetes', resumo: 'Para costura, de segurança, para etiquetas e para mapas.', imagem: '/img/produtos/alfinetes-seguranca.webp' },
  { id: 'escritorio', nome: 'Arquivo e escritório', resumo: 'Encadernadores, colchetes, pranchetas, espátulas extratoras e percevejos.', imagem: '/img/produtos/colchetes.webp' },
];

export interface Coluna {
  chave: string;
  titulo: string;
  /** Packaging column: its value is a quantity per package and becomes a quote option. */
  embalagem?: string;
  /** Short columns stay visible on the phone; the rest fold into the row's details. */
  principal?: boolean;
}

export interface Variacao {
  modelo: string;
  valores: Record<string, string>;
  acabamentos?: Acabamento[];
  /** Sub-line inside a product (e.g. "Linha 23" in staples). */
  grupo?: string;
  /** Packaging choices when they are not in the table columns. */
  embalagens?: string[];
  observacao?: string;
}

export interface Produto {
  slug: string;
  familia: FamiliaId;
  nome: string;
  /** Name as printed on the catalogue page. */
  nomeCatalogo: string;
  resumo: string;
  descricao: string[];
  material: string;
  acabamentos: Acabamento[];
  notaAcabamentos?: string;
  embalagem: string[];
  aplicacoes?: string[];
  notas?: string[];
  cores?: { titulo: string; lista: { nome: string; cor: string }[]; nota?: string };
  imagens: { src: string; alt: string }[];
  rotuloModelo: string;
  colunas: Coluna[];
  variacoes: Variacao[];
  paginaCatalogo: number;
  /** Words people type when they search (old names, plural forms, uses). */
  termos: string[];
}

const G: Acabamento = 'galvanizado', N: Acabamento = 'niquelado', C: Acabamento = 'colorido', L: Acabamento = 'latonado';

const clips = (rows: [string, string, string, string, string, string, string, Acabamento[]][]): Variacao[] =>
  rows.map(([modelo, altura, largura, pequena, grande, blister, plastica, acabamentos]) => ({
    modelo,
    valores: { altura, largura, pequena, grande, blister, plastica },
    acabamentos,
  }));

const grampo = (grupo: string, rows: [string, string, string, string, Acabamento[]?][]): Variacao[] =>
  rows.map(([modelo, furacao, aplicacao, caixas, acabamentos]) => ({ modelo, grupo, valores: { furacao, aplicacao, caixas }, acabamentos: acabamentos ?? [G] }));

export const PRODUTOS: Produto[] = [
  {
    slug: 'clips',
    familia: 'clips',
    nome: 'Clips',
    nomeCatalogo: 'Clips · qualidade superior',
    resumo: 'Clips produzidos em aço, do nº 5 (13 mm) ao 12/0 (70 mm), em quatro acabamentos.',
    descricao: [
      'Clips produzidos em aço, em treze tamanhos: do nº 5, com 13 mm de altura, ao 12/0, com 70 mm.',
      'Cada número tem as suas embalagens: caixa pequena, caixa grande, blister box e caixa plástica, conforme a tabela.',
    ],
    material: 'Aço',
    acabamentos: [G, N, L, C],
    notaAcabamentos: 'O acabamento disponível varia por número; veja a tabela. Pintura epóxi nas cores abaixo, com embalagens em cores sortidas.',
    embalagem: ['Caixa pequena, caixa grande, blister box ou caixa plástica (quantidades na tabela).', 'Embalagens lacradas ou com sacos plásticos selados.'],
    cores: {
      titulo: 'Pintura epóxi',
      lista: [
        { nome: 'Branco', cor: '#ffffff' },
        { nome: 'Preto', cor: '#222326' },
        { nome: 'Rosa', cor: '#e75fa6' },
        { nome: 'Amarelo', cor: '#f7d117' },
        { nome: 'Verde', cor: '#3fae49' },
        { nome: 'Vermelho', cor: '#d6262b' },
        { nome: 'Roxo', cor: '#8a5bb5' },
        { nome: 'Azul', cor: '#1aa3e0' },
      ],
      nota: 'Embalagens com cores sortidas.',
    },
    imagens: [
      { src: '/img/produtos/clips-niquelado.webp', alt: 'Clip Bacchi niquelado' },
      { src: '/img/produtos/clips-dourados.webp', alt: 'Clips Bacchi latonados (dourados)' },
      { src: '/img/produtos/clips-coloridos.webp', alt: 'Clips Bacchi coloridos (pintura epóxi)' },
      { src: '/img/produtos/clips-10-0.webp', alt: 'Clips Bacchi 10/0 galvanizados' },
      { src: '/img/produtos/clips-caixa-premium.webp', alt: 'Caixa grande de clips Bacchi 2/0 (00)' },
      { src: '/img/produtos/clips-blister.webp', alt: 'Blister box de clips coloridos Bacchi' },
      { src: '/img/produtos/clips-caixa-plastica.webp', alt: 'Caixa plástica de clips latonados Bacchi nº 5' },
    ],
    rotuloModelo: 'Clips nº',
    colunas: [
      { chave: 'altura', titulo: 'Altura (mm)', principal: true },
      { chave: 'largura', titulo: 'Largura (mm)', principal: true },
      { chave: 'pequena', titulo: 'Caixa pequena', embalagem: 'Caixa pequena' },
      { chave: 'grande', titulo: 'Caixa grande', embalagem: 'Caixa grande' },
      { chave: 'blister', titulo: 'Blister box', embalagem: 'Blister box' },
      { chave: 'plastica', titulo: 'Caixa plástica', embalagem: 'Caixa plástica' },
    ],
    variacoes: clips([
      ['5', '13', '4', '100', '-', '300', '200', [G, N, C, L]],
      ['4', '17', '7', '100', '2.200', '-', '-', [G, N]],
      ['3', '21', '7', '100', '1.750', '-', '50', [G, N, C]],
      ['2', '25', '8', '100', '1.100', '100', '50', [G, N, C, L]],
      ['1', '30', '8', '100', '950', '-', '50', [G, N, C]],
      ['1/0 (0)', '30', '10', '100', '770', '100', '50', [G, N, C, L]],
      ['2/0 (00)', '32', '11', '100', '720', '100', '50', [G, N, C, L]],
      ['3/0', '37', '12', '50', '420', '50', '25', [G, N, C]],
      ['4/0', '41', '13', '50', '390', '50', '25', [G, N, C]],
      ['6/0', '46', '17', '25 / 50', '220', '25', '12', [G, N, C, L]],
      ['8/0', '54', '21', '25', '180', '12', '12', [G, N, C]],
      ['10/0', '64', '24', '18', '120', '-', '-', [G, N]],
      ['12/0', '70', '26', '12', '105', '8', '-', [G, N]],
    ]),
    paginaCatalogo: 2,
    termos: ['clipes', 'clip', 'clips de papel', 'prendedor de papel', 'galvanizado', 'niquelado', 'dourado', 'colorido', 'epoxi'],
  },
  {
    slug: 'clips-linha-leve',
    familia: 'clips',
    nome: 'Clips Linha Leve',
    nomeCatalogo: 'Clips · Linha Leve',
    resumo: 'Clips galvanizados da Linha Leve, do 1/0 (0) ao 8/0, em caixa pequena e caixa grande.',
    descricao: ['Clips produzidos em aço, com acabamento galvanizado, em seis tamanhos: do 1/0 (0), com 30 mm de altura, ao 8/0, com 54 mm.'],
    material: 'Aço',
    acabamentos: [G],
    embalagem: ['Caixa pequena ou caixa grande (quantidades na tabela).', 'Embalagens lacradas ou com sacos plásticos selados.'],
    imagens: [
      { src: '/img/produtos/clips-leve.webp', alt: 'Clips Bacchi Linha Leve galvanizados' },
      { src: '/img/produtos/clips-leve-caixa.webp', alt: 'Caixa de clips Bacchi Linha Leve 8/0' },
    ],
    rotuloModelo: 'Clips nº',
    colunas: [
      { chave: 'altura', titulo: 'Altura (mm)', principal: true },
      { chave: 'largura', titulo: 'Largura (mm)', principal: true },
      { chave: 'pequena', titulo: 'Caixa pequena', embalagem: 'Caixa pequena' },
      { chave: 'grande', titulo: 'Caixa grande', embalagem: 'Caixa grande' },
    ],
    variacoes: [
      ['1/0 (0)', '30', '10', '100', '770'],
      ['2/0 (00)', '32', '11', '100', '720'],
      ['3/0', '37', '12', '50', '450'],
      ['4/0', '41', '13', '50', '420'],
      ['6/0', '46', '17', '50', '220'],
      ['8/0', '54', '21', '25', '170'],
    ].map(([modelo, altura, largura, pequena, grande]) => ({ modelo, valores: { altura, largura, pequena, grande }, acabamentos: [G] })),
    paginaCatalogo: 7,
    termos: ['clipes', 'linha leve', 'leve', 'galvanizado', 'caixa amarela'],
  },
  {
    slug: 'grampos',
    familia: 'grampos',
    nome: 'Grampos para grampeadores',
    nomeCatalogo: 'Grampos · qualidade superior',
    resumo: '37 grampos em 12 linhas: escritório, gráfica, embalamento, tapeçaria, serigrafia, agrícola e compensados de madeira.',
    descricao: [
      'Grampos produzidos em aço, galvanizados em todos os modelos.',
      'O tipo cobreado é feito apenas para TOT, 26/6 e 26/8.',
      'A furação indica quantas folhas o grampo atravessa.',
    ],
    material: 'Aço',
    acabamentos: [G, 'cobreado'],
    notaAcabamentos: 'Galvanizado em todos; tipo cobreado apenas para TOT, 26/6 e 26/8.',
    embalagem: ['Caixas com as quantidades da tabela (por exemplo, 1.000 ou 5.000 unidades).'],
    aplicacoes: ['Escritório', 'Embalamento', 'Gráfica', 'Agrícola', 'Tapeçaria', 'Serigrafia', 'Compensados de madeira'],
    notas: ['*Furação provável, calculada com base em folhas de 75 g.'],
    imagens: [
      { src: '/img/produtos/grampos-26.webp', alt: 'Grampos Bacchi linha 26' },
      { src: '/img/produtos/grampos-tot.webp', alt: 'Grampos Bacchi TOT galvanizados e cobreados' },
      { src: '/img/produtos/grampos-23.webp', alt: 'Grampos Bacchi linha 23' },
      { src: '/img/produtos/grampos-caixa.webp', alt: 'Caixa de grampos Bacchi 26/6 com 5.000 unidades' },
      { src: '/img/produtos/grampos-cobreado-caixa.webp', alt: 'Caixa de grampos Bacchi 26/6 tipo cobreado' },
      { src: '/img/produtos/grampos-catu.webp', alt: 'Grampos Bacchi linha CATU' },
      { src: '/img/produtos/grampos-106.webp', alt: 'Grampos Bacchi linha 106' },
    ],
    rotuloModelo: 'Grampo',
    colunas: [
      { chave: 'furacao', titulo: 'Furação*', principal: true },
      { chave: 'aplicacao', titulo: 'Aplicação', principal: true },
      { chave: 'caixas', titulo: 'Caixas com (un.)', embalagem: 'Caixa com' },
    ],
    variacoes: [
      ...grampo('Linha 26', [
        ['26/6', 'Até 20', 'Escritório / Embalamento', '1.000 / 5.000', [G, 'cobreado']],
        ['26/8', '20 a 40', 'Escritório / Embalamento', '1.000 / 5.000', [G, 'cobreado']],
      ]),
      ...grampo('TOT', [['TOT', 'Até 10', 'Escritório', '1.000 / 5.000', [G, 'cobreado']]]),
      ...grampo('Puncar', [['Puncar', '-', 'Escritório / Agrícola', '4.800']]),
      ...grampo('Linha 23', [
        ['23/06', '10 a 30', 'Gráfica / Escritório', '1.000 / 5.000'],
        ['23/08', '20 a 50', 'Gráfica / Escritório', '1.000 / 5.000'],
        ['23/10', '40 a 70', 'Gráfica / Escritório', '1.000 / 5.000'],
        ['23/13', '70 a 100', 'Gráfica / Escritório', '1.000 / 5.000'],
        ['23/15', '90 a 120', 'Gráfica / Escritório', '1.000'],
        ['23/17', '110 a 140', 'Gráfica / Escritório', '1.000'],
        ['23/20', '140 a 170', 'Gráfica / Escritório', '1.000'],
        ['23/24', '170 a 200', 'Gráfica / Escritório', '1.000'],
      ]),
      ...grampo('Linha 9', [
        ['9/08', '20 a 50', 'Gráfica / Escritório', '1.000 / 5.000'],
        ['9/10', '40 a 70', 'Gráfica / Escritório', '1.000 / 5.000'],
        ['9/12', '60 a 90', 'Gráfica / Escritório', '1.000 / 5.000'],
        ['9/14', '80 a 110', 'Gráfica / Escritório', '1.000 / 5.000'],
        ['9/17', '110 a 140', 'Gráfica / Escritório', '1.000'],
        ['9/20', '140 a 170', 'Gráfica / Escritório', '1.000'],
      ]),
      ...grampo('Linha 24', [
        ['24/06', 'Até 20', 'Escritório / Embalamento', '1.000 / 5.000'],
        ['24/08', '20 a 40', 'Escritório / Embalamento', '1.000 / 5.000'],
        ['24/10', '40 a 70', 'Escritório / Embalamento', '1.000 / 5.000'],
        ['24/13', '70 a 100', 'Escritório / Embalamento', '1.000 / 5.000'],
      ]),
      ...grampo('CATU', [
        ['CATU 1X', '20 a 50', 'Gráfica', '5.000'],
        ['CATU 2X', '40 a 70', 'Gráfica', '5.000'],
        ['CATU 3X', '60 a 90', 'Gráfica', '5.000'],
        ['CATU 4X', '80 a 110', 'Gráfica', '5.000'],
      ]),
      ...grampo('Linha 106', [
        ['106/4', '-', 'Tapeçaria', '4.000'],
        ['106/6', '-', 'Tapeçaria', '2.500 / 3.500'],
        ['106/8', '-', 'Tapeçaria', '2.500 / 3.000'],
      ]),
      ...grampo('Linha A13', [
        ['A13/6', '-', 'Tapeçaria / Serigrafia', '5.000'],
        ['A13/8', '-', 'Tapeçaria / Serigrafia', '5.000'],
      ]),
      ...grampo('Linha 73', [
        ['73/08', '-', 'Embalamento', '5.000'],
        ['73/10', '-', 'Embalamento', '4.200'],
      ]),
      ...grampo('STCR', [
        ['STCR 06', '-', 'Embalamento', '5.000'],
        ['STCR 08', '-', 'Embalamento', '5.000'],
        ['STCR 10', '-', 'Embalamento', '5.000'],
      ]),
      ...grampo('SP3', [['SP3', '-', 'Compensados de Madeira', '5.000']]),
    ],
    paginaCatalogo: 3,
    termos: ['grampo', 'grampos para grampeador', 'grampeador', 'cobreado', 'tapeçaria', 'grafica', 'embalamento', 'serigrafia', 'agricola', 'compensado', 'madeira'],
  },
  {
    slug: 'grampos-trancados',
    familia: 'grampos',
    nome: 'Grampos trançados',
    nomeCatalogo: 'Grampos trançados',
    resumo: 'Grampos trançados nº 1 (65 × 45 mm) e nº 2 (40 × 30 mm), galvanizados ou niquelados.',
    descricao: ['Grampos trançados produzidos em aço, em dois tamanhos.'],
    material: 'Aço',
    acabamentos: [G, N],
    embalagem: ['Caixas com 50 unidades (número 2) ou 12 unidades (número 1).'],
    imagens: [
      { src: '/img/produtos/grampos-trancados.webp', alt: 'Grampos trançados Bacchi' },
      { src: '/img/produtos/grampos-trancados-caixa.webp', alt: 'Caixa de grampos trançados Bacchi nº 2 galvanizados' },
    ],
    rotuloModelo: 'Número',
    colunas: [
      { chave: 'altura', titulo: 'Altura (mm)', principal: true },
      { chave: 'largura', titulo: 'Largura (mm)', principal: true },
      { chave: 'caixa', titulo: 'Caixa com (un.)', embalagem: 'Caixa com' },
    ],
    variacoes: [
      { modelo: 'Nº 1', valores: { altura: '65', largura: '45', caixa: '12' }, acabamentos: [G, N] },
      { modelo: 'Nº 2', valores: { altura: '40', largura: '30', caixa: '50' }, acabamentos: [G, N] },
    ],
    paginaCatalogo: 7,
    termos: ['trancado', 'trançado', 'grampo trançado', 'prendedor'],
  },
  {
    slug: 'alfinetes-para-costura',
    familia: 'alfinetes',
    nome: 'Alfinetes para costura',
    nomeCatalogo: 'Alfinetes · para costura',
    resumo: 'Alfinetes de aço niquelado, nº 20 a 32: o número é o comprimento em milímetros.',
    descricao: ['Alfinetes para costura produzidos em aço. O número corresponde ao comprimento em milímetros.', 'Vendidos em caixas por peso (25 g ou 50 g), com a quantidade de unidades da tabela.'],
    material: 'Aço',
    acabamentos: [N],
    embalagem: ['Caixas de 25 g ou 50 g (unidades na tabela).'],
    notas: ['O nº 29 aparece como “Fino” na ilustração do catálogo.'],
    imagens: [{ src: '/img/produtos/alfinetes-costura.webp', alt: 'Alfinetes para costura Bacchi em aço niquelado' }],
    rotuloModelo: 'Alfinete nº',
    colunas: [
      { chave: 'comprimento', titulo: 'Comprimento (mm)', principal: true },
      { chave: 'peso', titulo: 'Caixa (g)', principal: true },
      { chave: 'unidades', titulo: 'Unidades por caixa', embalagem: 'Caixa' },
    ],
    variacoes: [
      ['20', '50', '540'],
      ['24', '25', '230'],
      ['24', '50', '460'],
      ['26', '50', '440'],
      ['28', '50', '400'],
      ['29', '25', '310'],
      ['29', '50', '620'],
      ['30', '50', '310'],
      ['32', '50', '300'],
    ].map(([modelo, peso, unidades]) => ({
      modelo: `${modelo} · ${peso} g`,
      valores: { comprimento: modelo, peso, unidades },
      acabamentos: [N],
      embalagens: [`Caixa de ${peso} g · ${unidades} un.`],
    })),
    paginaCatalogo: 4,
    termos: ['alfinete', 'costura', 'costureira', 'niquelado', 'alfinete de cabeça'],
  },
  {
    slug: 'alfinetes-de-seguranca',
    familia: 'alfinetes',
    nome: 'Alfinetes de segurança',
    nomeCatalogo: 'Alfinetes · de segurança',
    resumo: 'Do nº 000 (20 mm) ao 5 (64 mm). Niquelados; os nº 000, 00 e 0 também latonados.',
    descricao: ['Alfinetes de segurança produzidos em aço, em oito tamanhos, do nº 000 (20 mm) ao nº 5 (64 mm).'],
    material: 'Aço',
    acabamentos: [L, N],
    notaAcabamentos: 'Niquelado em todos; latonado (dourado) nos nº 000, 00 e 0.',
    embalagem: ['Caixas com 100 unidades.'],
    imagens: [
      { src: '/img/produtos/alfinetes-seguranca.webp', alt: 'Alfinetes de segurança Bacchi latonado e niquelado' },
      { src: '/img/produtos/alfinetes-seguranca-caixa.webp', alt: 'Caixa de alfinetes de segurança Bacchi nº 2 niquelados' },
      { src: '/img/produtos/alfinetes-seguranca-dourado.webp', alt: 'Caixa de alfinetes de segurança Bacchi nº 000 dourados' },
    ],
    rotuloModelo: 'Alfinete nº',
    colunas: [{ chave: 'comprimento', titulo: 'Comprimento (mm)', principal: true }],
    variacoes: [
      ['000', '20', [L, N]],
      ['00', '23', [L, N]],
      ['0', '27', [L, N]],
      ['1', '30', [N]],
      ['2', '38', [N]],
      ['3', '46', [N]],
      ['4', '55', [N]],
      ['5', '64', [N]],
    ].map(([modelo, comprimento, acabamentos]) => ({
      modelo: modelo as string,
      valores: { comprimento: comprimento as string },
      acabamentos: acabamentos as Acabamento[],
      embalagens: ['Caixa com 100 un.'],
    })),
    paginaCatalogo: 4,
    termos: ['alfinete de segurança', 'fralda', 'dourado', 'latonado', 'niquelado'],
  },
  {
    slug: 'alfinetes-para-etiquetas',
    familia: 'alfinetes',
    nome: 'Alfinetes para etiquetas',
    nomeCatalogo: 'Alfinetes · para etiquetas (suportes para preços)',
    resumo: 'Suportes para preços em aço niquelado: aro simples (58 mm) e aro duplo (35 mm).',
    descricao: ['Alfinetes para etiquetas produzidos em aço, usados como suportes para preços.', 'Aro simples, com uma cabeça, e aro duplo, com duas cabeças.'],
    material: 'Aço',
    acabamentos: [N],
    embalagem: ['Caixas com 100 unidades.'],
    imagens: [
      { src: '/img/produtos/suporte-etiquetas.webp', alt: 'Alfinetes para etiquetas Bacchi, aro simples e aro duplo' },
      { src: '/img/produtos/suporte-etiquetas-simples.webp', alt: 'Alfinete para etiquetas Bacchi aro simples' },
      { src: '/img/produtos/suporte-etiquetas-duplo.webp', alt: 'Alfinete para etiquetas Bacchi aro duplo' },
    ],
    rotuloModelo: 'Modelo',
    colunas: [
      { chave: 'cabecas', titulo: 'Cabeças', principal: true },
      { chave: 'comprimento', titulo: 'Comprimento (mm)', principal: true },
    ],
    variacoes: [
      { modelo: 'Aro simples', valores: { cabecas: '01', comprimento: '58' }, acabamentos: [N], embalagens: ['Caixa com 100 un.'] },
      { modelo: 'Aro duplo', valores: { cabecas: '02', comprimento: '35' }, acabamentos: [N], embalagens: ['Caixa com 100 un.'] },
    ],
    paginaCatalogo: 4,
    termos: ['etiqueta', 'suporte para preço', 'preço', 'aro', 'loja', 'vitrine'],
  },
  {
    slug: 'alfinetes-para-mapas',
    familia: 'alfinetes',
    nome: 'Alfinetes para mapas',
    nomeCatalogo: 'Alfinetes · para mapas',
    resumo: 'Aço niquelado com cabeça de poliestireno de 5 mm, 17 mm de comprimento, em cores sortidas ou cor única.',
    descricao: ['Alfinetes para mapas produzidos em aço niquelado, com cabeça em poliestireno de 5 mm.', 'Comprimento de 17 mm.'],
    material: 'Aço niquelado e poliestireno',
    acabamentos: [N],
    embalagem: ['Caixas com 50 unidades em cores sortidas ou caixas com uma única cor.'],
    cores: {
      titulo: 'Cores da ilustração do catálogo',
      lista: [
        { nome: 'Azul', cor: '#1f63c6' },
        { nome: 'Amarelo', cor: '#f5c800' },
        { nome: 'Branco', cor: '#ffffff' },
        { nome: 'Laranja', cor: '#f08a1c' },
        { nome: 'Roxo', cor: '#8a5bb5' },
        { nome: 'Marrom', cor: '#7a4a24' },
        { nome: 'Preto', cor: '#1d1f22' },
        { nome: 'Rosa', cor: '#ef7fb4' },
        { nome: 'Verde escuro', cor: '#167a3a' },
        { nome: 'Verde claro', cor: '#4cc04f' },
        { nome: 'Vermelho', cor: '#d6262b' },
      ],
      nota: 'Confirme a cor única desejada com a equipe comercial.',
    },
    imagens: [
      { src: '/img/produtos/alfinetes-mapa.webp', alt: 'Alfinetes para mapas Bacchi em cores' },
      { src: '/img/produtos/alfinetes-mapa-sortidos.webp', alt: 'Caixa de alfinetes para mapas Bacchi sortidos' },
    ],
    rotuloModelo: 'Caixa',
    colunas: [
      { chave: 'comprimento', titulo: 'Comprimento (mm)', principal: true },
      { chave: 'cabeca', titulo: 'Cabeça (mm)', principal: true },
    ],
    variacoes: [
      { modelo: 'Cores sortidas', valores: { comprimento: '17', cabeca: '5' }, acabamentos: [N], embalagens: ['Caixa com 50 un.'] },
      { modelo: 'Cor única', valores: { comprimento: '17', cabeca: '5' }, acabamentos: [N], embalagens: ['Caixa com 50 un.'], observacao: 'Informe a cor na observação do item.' },
    ],
    paginaCatalogo: 4,
    termos: ['mapa', 'alfinete colorido', 'cabeça colorida', 'mural', 'quadro de avisos'],
  },
  {
    slug: 'encadernadores',
    familia: 'escritorio',
    nome: 'Encadernadores para pastas',
    nomeCatalogo: 'Encadernadores · para pastas (grampo trilho ou Romeu e Julieta)',
    resumo: 'Grampo trilho (Romeu e Julieta) em metal ou plástico, com 80 mm entre os furos.',
    descricao: [
      'Encadernadores para pastas, também chamados de grampo trilho ou Romeu e Julieta.',
      'Feitos em aço estanhado (metal) ou em polietileno injetado (branco ou preto), com 80 mm de distância entre os furos.',
    ],
    material: 'Aço estanhado ou polietileno injetado',
    acabamentos: ['plastico-preto', 'plastico-branco', 'metal'],
    embalagem: ['Caixas com 50 conjuntos.', 'Sacos plásticos com 10 ou 50 conjuntos.'],
    notas: ['*Capacidade calculada com base em folhas de 75 g.'],
    imagens: [
      { src: '/img/produtos/encadernadores-metal.webp', alt: 'Encadernador Bacchi de metal (grampo trilho)' },
      { src: '/img/produtos/encadernadores-preto.webp', alt: 'Encadernador Bacchi de plástico preto' },
      { src: '/img/produtos/encadernadores-branco-pacote.webp', alt: 'Saco com 10 encadernadores Bacchi brancos' },
    ],
    rotuloModelo: 'Modelo',
    colunas: [
      { chave: 'comprimento', titulo: 'Comprimento (mm)', principal: true },
      { chave: 'folhas', titulo: 'Capacidade*', principal: true },
      { chave: 'furos', titulo: 'Entre furos (mm)' },
    ],
    variacoes: [
      { modelo: 'Metal', valores: { comprimento: '180', folhas: 'aprox. 250 folhas', furos: '80' }, acabamentos: ['metal'], embalagens: ['Caixa com 50 conjuntos', 'Saco com 10 conjuntos', 'Saco com 50 conjuntos'] },
      { modelo: 'Plástico normal', valores: { comprimento: '196', folhas: 'aprox. 300 folhas', furos: '80' }, acabamentos: ['plastico-branco', 'plastico-preto'], embalagens: ['Caixa com 50 conjuntos', 'Saco com 10 conjuntos', 'Saco com 50 conjuntos'] },
      { modelo: 'Plástico estendido', valores: { comprimento: '230', folhas: 'aprox. 500 folhas', furos: '80' }, acabamentos: [], embalagens: ['Caixa com 50 conjuntos', 'Saco com 10 conjuntos', 'Saco com 50 conjuntos'], observacao: 'O catálogo não diz as cores do estendido: confirme com a equipe comercial.' },
    ],
    paginaCatalogo: 5,
    termos: ['encadernador', 'grampo trilho', 'romeu e julieta', 'pasta', 'trilho', 'arquivo'],
  },
  {
    slug: 'colchetes',
    familia: 'escritorio',
    nome: 'Colchetes',
    nomeCatalogo: 'Colchetes',
    resumo: 'Colchetes de aço estanhado do nº 3 (17 mm) ao 15 (100 mm), para 60 a 450 folhas.',
    descricao: ['Colchetes produzidos em aço estanhado, em treze tamanhos.', 'Fornecidos nos acabamentos abaixo, de acordo com a disponibilidade da fábrica.'],
    material: 'Aço estanhado',
    acabamentos: ['verniz-incolor', 'verniz-amarelo', 'pintura-branca'],
    notaAcabamentos: 'De acordo com a disponibilidade da fábrica.',
    embalagem: ['Caixas com 72 unidades.'],
    notas: ['*Número de folhas calculado com base em folhas de 75 g.'],
    imagens: [
      { src: '/img/produtos/colchetes.webp', alt: 'Colchetes Bacchi' },
      { src: '/img/produtos/colchetes-caixa.webp', alt: 'Caixa de colchetes Bacchi nº 9' },
    ],
    rotuloModelo: 'Colchete nº',
    colunas: [
      { chave: 'comprimento', titulo: 'Comprimento (mm)', principal: true },
      { chave: 'folhas', titulo: 'Nº de folhas*', principal: true },
    ],
    variacoes: [
      ['3', '17', '60'],
      ['4', '22', '80'],
      ['5', '25', '110'],
      ['6', '28', '120'],
      ['7', '32', '140'],
      ['8', '40', '180'],
      ['9', '45', '200'],
      ['10', '50', '210'],
      ['11', '55', '240'],
      ['12', '60', '270'],
      ['13', '75', '360'],
      ['14', '82', '400'],
      ['15', '100', '450'],
    ].map(([modelo, comprimento, folhas]) => ({ modelo, valores: { comprimento, folhas }, acabamentos: ['verniz-incolor', 'verniz-amarelo', 'pintura-branca'] as Acabamento[], embalagens: ['Caixa com 72 un.'] })),
    paginaCatalogo: 5,
    termos: ['colchete', 'bailarina', 'prendedor', 'estanhado', 'latonado'],
  },
  {
    slug: 'pranchetas',
    familia: 'escritorio',
    nome: 'Pranchetas',
    nomeCatalogo: 'Pranchetas',
    resumo: 'Pranchetas em Duratex com prendedor de aço galvanizado de 100 mm: memorando, ofício e meio ofício.',
    descricao: ['Pranchetas em Duratex com prendedores em aço galvanizado de 100 mm de largura.'],
    material: 'Duratex e aço galvanizado',
    acabamentos: [G],
    notaAcabamentos: 'Prendedor em aço galvanizado.',
    embalagem: ['Caixas de papelão ondulado com 24 unidades (ofício e memorando) ou 48 unidades (meio ofício).'],
    imagens: [{ src: '/img/produtos/pranchetas.webp', alt: 'Pranchetas Bacchi em Duratex' }],
    rotuloModelo: 'Prancheta',
    colunas: [
      { chave: 'altura', titulo: 'Altura (mm)', principal: true },
      { chave: 'largura', titulo: 'Largura (mm)', principal: true },
    ],
    variacoes: [
      { modelo: 'Memorando', valores: { altura: '240', largura: '140' }, embalagens: ['Caixa com 24 un.'] },
      { modelo: 'Ofício', valores: { altura: '340', largura: '240' }, embalagens: ['Caixa com 24 un.'] },
      { modelo: 'Meio ofício', valores: { altura: '340', largura: '120' }, embalagens: ['Caixa com 48 un.'] },
    ],
    paginaCatalogo: 6,
    termos: ['prancheta', 'duratex', 'madeira', 'oficio', 'memorando'],
  },
  {
    slug: 'espatula-extratora',
    familia: 'escritorio',
    nome: 'Espátula extratora',
    nomeCatalogo: 'Espátula extratora',
    resumo: 'Extrator de grampos em aço, galvanizado ou cromado.',
    descricao: ['Espátula extratora de grampos produzida em aço.'],
    material: 'Aço',
    acabamentos: [G, 'cromado'],
    embalagem: ['Cromado: caixa com 1 unidade.', 'Galvanizado: PVC encolhível com 12 unidades e saco plástico para display com 1 unidade.'],
    imagens: [
      { src: '/img/produtos/extrator.webp', alt: 'Espátula extratora de grampos Bacchi' },
      { src: '/img/produtos/extrator-pacote.webp', alt: 'Espátulas extratoras Bacchi em embalagem' },
    ],
    rotuloModelo: 'Acabamento',
    colunas: [],
    variacoes: [
      { modelo: 'Galvanizado', valores: {}, acabamentos: [G], embalagens: ['PVC encolhível com 12 un.', 'Saco plástico para display com 1 un.'] },
      { modelo: 'Cromado', valores: {}, acabamentos: ['cromado'], embalagens: ['Caixa com 1 un.'] },
    ],
    paginaCatalogo: 6,
    termos: ['extrator', 'extrator de grampo', 'tira grampo', 'espatula', 'saca grampo'],
  },
  {
    slug: 'percevejos',
    familia: 'escritorio',
    nome: 'Percevejos',
    nomeCatalogo: 'Percevejos',
    resumo: 'Percevejos de aço niquelados, latonados ou coloridos.',
    descricao: ['Percevejos produzidos em aço.', 'Na ilustração do catálogo, a cabeça dos metálicos mede 9 mm e a dos coloridos, 12 mm.'],
    material: 'Aço',
    acabamentos: [N, L, C],
    embalagem: ['Caixas com 100 unidades.'],
    cores: {
      titulo: 'Cores da ilustração do catálogo',
      lista: [
        { nome: 'Amarelo', cor: '#f2d21b' },
        { nome: 'Azul', cor: '#2b9be0' },
        { nome: 'Rosa', cor: '#e45fa0' },
        { nome: 'Preto', cor: '#1d1f22' },
        { nome: 'Vermelho', cor: '#c4232b' },
        { nome: 'Roxo', cor: '#8a5bb5' },
        { nome: 'Branco', cor: '#ffffff' },
        { nome: 'Verde', cor: '#3fae49' },
      ],
    },
    imagens: [
      { src: '/img/produtos/percevejos.webp', alt: 'Percevejos Bacchi coloridos e metálicos' },
      { src: '/img/produtos/percevejos-caixa.webp', alt: 'Caixa de percevejos Bacchi latonados' },
    ],
    rotuloModelo: 'Acabamento',
    colunas: [{ chave: 'cabeca', titulo: 'Cabeça (mm)', principal: true }],
    variacoes: [
      { modelo: 'Niquelado', valores: { cabeca: '9' }, acabamentos: [N], embalagens: ['Caixa com 100 un.'] },
      { modelo: 'Latonado (dourado)', valores: { cabeca: '9' }, acabamentos: [L], embalagens: ['Caixa com 100 un.'] },
      { modelo: 'Colorido (pintado)', valores: { cabeca: '12' }, acabamentos: [C], embalagens: ['Caixa com 100 un.'] },
    ],
    paginaCatalogo: 6,
    termos: ['percevejo', 'tachinha', 'pino', 'mural', 'quadro de cortiça'],
  },
];

/** The four packaging types on the last page of the catalogue. */
/** Texts describe only what the catalogue page shows in each photo. */
export const TIPOS_EMBALAGEM = [
  { nome: 'Caixa cartão', texto: 'Clips, grampos, alfinetes, percevejos e extrator de grampo.', imagem: '/img/produtos/clips-caixa-premium.webp' },
  { nome: 'Caixa plástica', texto: 'Clips, como os latonados nº 5.', imagem: '/img/produtos/clips-caixa-plastica.webp' },
  { nome: 'Blister', texto: 'Clips coloridos e outros itens da linha.', imagem: '/img/produtos/clips-blister.webp' },
  { nome: 'Saco plástico', texto: 'Encadernadores para pastas, com 10 ou 50 conjuntos.', imagem: '/img/produtos/encadernadores-branco-pacote.webp' },
];

export const produto = (slug: string) => PRODUTOS.find((p) => p.slug === slug);
export const familia = (id: FamiliaId) => FAMILIAS.find((f) => f.id === id)!;
export const produtosDaFamilia = (id: FamiliaId) => PRODUTOS.filter((p) => p.familia === id);

/** Packaging choices for one row: the table's packaging columns with a value, or the row's own list. */
export function opcoesEmbalagem(p: Produto, v: Variacao): string[] {
  if (v.embalagens) return v.embalagens;
  const saida: string[] = [];
  for (const c of p.colunas) {
    if (!c.embalagem) continue;
    const valor = v.valores[c.chave];
    if (!valor || valor === '-') continue;
    for (const q of valor.split('/').map((s) => s.trim())) saida.push(`${c.embalagem} · ${q} un.`);
  }
  return saida;
}

/** Text used by the catalogue search: names, numbers, groups, applications, finishes and synonyms. */
export function textoBusca(p: Produto): string {
  return normalizar(
    [
      p.nome,
      p.nomeCatalogo,
      p.resumo,
      ...p.termos,
      ...(p.aplicacoes ?? []),
      ...p.acabamentos.map((a) => ACABAMENTOS[a].nome),
      ...p.variacoes.flatMap((v) => [v.modelo, v.grupo ?? '', ...Object.values(v.valores)]),
    ].join(' '),
  );
}

export const normalizar = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

/** Rows of a product that match a query (by number, group or application); all rows when the query names the product. */
export function variacoesQueCasam(p: Produto, consulta: string): Variacao[] {
  const q = normalizar(consulta.trim());
  if (!q) return p.variacoes;
  const casa = p.variacoes.filter((v) => normalizar([v.modelo, v.grupo ?? '', ...Object.values(v.valores)].join(' ')).includes(q));
  return casa.length ? casa : p.variacoes;
}
