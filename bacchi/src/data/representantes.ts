// Sales representatives, as published on clipsbacchi.com.br/representantes (checked 28/10/2026).
// One entry per region. A phone is marked WhatsApp only where the page says so. City names are written in
// their standard spelling (the page had "Gôiania", "São Luis", "Aracajú", "Araguaina"); everything else is as published.

export interface Telefone {
  numero: string;
  /** Only when the published page names the line WhatsApp. */
  whatsapp?: boolean;
  rotulo?: string;
}

export interface Representante {
  uf: string;
  regiao: string;
  empresa: string;
  contato?: string;
  telefones: Telefone[];
  emails: string[];
  instagram?: string;
}

export const ESTADOS: Record<string, string> = {
  AC: 'Acre', AL: 'Alagoas', AM: 'Amazonas', AP: 'Amapá', BA: 'Bahia', CE: 'Ceará', DF: 'Distrito Federal',
  ES: 'Espírito Santo', GO: 'Goiás', MA: 'Maranhão', MG: 'Minas Gerais', MS: 'Mato Grosso do Sul', MT: 'Mato Grosso',
  PA: 'Pará', PB: 'Paraíba', PE: 'Pernambuco', PI: 'Piauí', PR: 'Paraná', RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte',
  RO: 'Rondônia', RR: 'Roraima', RS: 'Rio Grande do Sul', SC: 'Santa Catarina', SE: 'Sergipe', SP: 'São Paulo', TO: 'Tocantins',
};

const t = (...numeros: string[]): Telefone[] => numeros.map((numero) => ({ numero }));

export const REPRESENTANTES: Representante[] = [
  { uf: 'AC', regiao: 'Rio Branco – AC', empresa: 'A. Torres', contato: 'Adriana', telefones: t('(68) 99927-8035'), emails: ['torres_representacoes@outlook.com.br'] },
  { uf: 'AL', regiao: 'Maceió – AL', empresa: 'Luciana Representações', contato: 'Luciana', telefones: t('(82) 99932-0025'), emails: ['llrepresentaal@gmail.com'] },
  { uf: 'AM', regiao: 'Manaus – AM', empresa: 'Lanny da Costa Uchôa Vieira', contato: 'Lanny', telefones: t('(92) 99601-6858'), emails: ['lanny.rep@gmail.com'] },
  { uf: 'AP', regiao: 'Macapá – AP', empresa: 'Moraes & Moraes Representação', contato: 'Emilia e Claudio', telefones: t('(91) 98898-1826'), emails: ['emiliarepresentacoes@hotmail.com', 'claudio-modesto@hotmail.com'] },
  { uf: 'BA', regiao: 'Salvador – BA', empresa: 'Aelo Comércio e Representações', contato: 'Aelo', telefones: t('(71) 3242-6520', '(71) 99933-9968', '(71) 99122-9753'), emails: ['aelorep@aelorep.com.br', 'aelo@aelorep.com.br'] },
  { uf: 'CE', regiao: 'Fortaleza – CE', empresa: 'Pauta Representações', contato: 'Ildevan e Paulo', telefones: t('(88) 99910-0884', '(85) 99401-1980'), emails: ['gerencia@pautarepres.com.br'] },
  { uf: 'DF', regiao: 'Brasília – DF', empresa: 'Aprimo Representações Ltda ME', contato: 'Henrique', telefones: [{ numero: '(62) 3609-6858' }, { numero: '(62) 98123-7317', whatsapp: true }], emails: ['henrique@aprimo.com.br', 'comercial@aprimo.com.br'] },
  {
    uf: 'ES',
    regiao: 'Vitória – ES',
    empresa: 'Alyne Maria Soares Barreto ME',
    contato: 'Alyne Maria',
    telefones: [
      { numero: '(27) 99978-2487', rotulo: 'Alyne Maria' },
      { numero: '(27) 99830-7297', rotulo: 'Vendedor Norte/ES · Leonardo' },
      { numero: '(27) 99854-0284', rotulo: 'Vendedor Sul/ES · Eduardo' },
      { numero: '(27) 99765-6953', rotulo: 'WhatsApp Business', whatsapp: true },
    ],
    emails: ['alynerepresentacoes@hotmail.com', 'comercial.alyne@hotmail.com'],
    instagram: 'alynerepresentacoes',
  },
  { uf: 'GO', regiao: 'Goiânia – GO', empresa: 'Aprimo Representações Ltda ME', contato: 'Henrique', telefones: [{ numero: '(62) 3609-6858' }, { numero: '(62) 98123-7317', whatsapp: true }], emails: ['henrique@aprimo.com.br', 'comercial@aprimo.com.br'] },
  { uf: 'MA', regiao: 'São Luís – MA', empresa: 'J.Z.L. Representações', contato: 'Danielly', telefones: t('(98) 98865-8854'), emails: ['jzlrepresentacoes@uol.com.br'] },
  { uf: 'MG', regiao: 'Belo Horizonte – MG', empresa: 'Scafutto Representações', contato: 'Ricardo', telefones: t('(31) 2551-5860', '(31) 99430-4554'), emails: [] },
  { uf: 'MG', regiao: 'Norte, Nordeste de Minas e Vale do Jequitinhonha – MG', empresa: 'Gyzam', contato: 'Carlos Alberto', telefones: t('(31) 8929-5459', '(31) 8600-4556'), emails: ['gyzam.com@oi.com.br'] },
  { uf: 'MG', regiao: 'Triângulo Mineiro', empresa: 'Tobias & Pereira Representações', contato: 'Rogério e Olgamara', telefones: t('(34) 3212-3005', '(34) 99971-4681', '(34) 99979-3729'), emails: ['rogerio@tobiasepereira.com.br', 'olgamara@tobiasepereira.com.br'] },
  { uf: 'MG', regiao: 'Sul de Minas', empresa: 'Kayro´s Representações', contato: 'Paulo', telefones: t('(35) 98439-7502', '(35) 99985-0012'), emails: ['sezarribeiro_40@hotmail.com'] },
  { uf: 'MT', regiao: 'Cuiabá – MT', empresa: 'Propodoski Representações Ltda', contato: 'Joyce', telefones: t('(65) 99324-4727'), emails: ['joyce_propodoski@hotmail.com'] },
  { uf: 'MS', regiao: 'Campo Grande – MS', empresa: 'Mavisa Representações', contato: 'Mateus Silva', telefones: [{ numero: '(67) 98113-3100', rotulo: 'Celular' }], emails: ['mavisarepresentacoes@gmail.com'] },
  { uf: 'PA', regiao: 'Belém – PA', empresa: 'Moraes & Moraes Representação', contato: 'Emilia e Claudio', telefones: t('(91) 98898-1826'), emails: ['emiliarepresentacoes@hotmail.com', 'claudio-modesto@hotmail.com'] },
  { uf: 'PA', regiao: 'Sudeste Paraense – PA', empresa: 'MK3 Comércio & Representações de Artigos de Pap.', contato: 'Marcos', telefones: t('(63) 3412-5519', '(63) 99981-3343'), emails: ['escritorio@mk3representacoes.com.br', 'marcos@mk3representacoes.com.br'] },
  { uf: 'PB', regiao: 'João Pessoa – PB', empresa: 'Zenaide de Freitas Soares', contato: 'Zenaide', telefones: t('(83) 99945-4761', '(83) 98711-7438'), emails: ['zfsoares@bol.com.br'] },
  { uf: 'PR', regiao: 'Curitiba – PR', empresa: 'Renacele Representações Comerciais', contato: 'Renato', telefones: t('(41) 3275-3130', '(41) 99805-5179'), emails: ['renacele@uol.com.br'] },
  { uf: 'PR', regiao: 'Cambira – PR', empresa: 'Viapel Representações Comerciais', contato: 'Paulo e Elisangela', telefones: t('(43) 3436-2178', '(43) 99152-6969'), emails: ['viapel.rep@hotmail.com'] },
  { uf: 'PE', regiao: 'Recife – PE', empresa: 'Ivanildo Soares de Andrade Representações', contato: 'Ivanildo', telefones: t('(81) 3339-2956', '(81) 99989-1263'), emails: ['ivanildosoares.rep@gmail.com'] },
  { uf: 'PI', regiao: 'Teresina – PI', empresa: 'Francisco da Silva Lima & Cia Representações', contato: 'Francisco', telefones: t('(86) 3225-3797', '(86) 99982-0703'), emails: ['limafrancisco649@gmail.com'] },
  { uf: 'RJ', regiao: 'Rio de Janeiro – RJ', empresa: 'W. Lopes Representações', contato: 'Willians', telefones: t('(21) 98835-4505'), emails: ['representante.2012@yahoo.com.br'] },
  { uf: 'RN', regiao: 'Parnamirim – RN', empresa: 'V F Palhano', contato: 'Alexandre', telefones: t('(84) 9808-3774'), emails: ['vfpalhanorep@hotmail.com'] },
  { uf: 'RO', regiao: 'Porto Velho – RO', empresa: 'A. Torres', contato: 'Adriana', telefones: t('(68) 99927-8035'), emails: ['torres_representacoes@outlook.com.br'] },
  { uf: 'RS', regiao: 'Porto Alegre – RS', empresa: 'Representações Toledo', contato: 'Fernanda e Fernando', telefones: [{ numero: '(51) 3361-4335', rotulo: 'somente WhatsApp', whatsapp: true }], emails: ['representacoestoledo@bol.com.br'] },
  { uf: 'RR', regiao: 'Boa Vista – RR', empresa: 'C O Louzada ME', contato: 'Louzada', telefones: t('(95) 99971-2952'), emails: ['colouzada@uol.com.br'] },
  { uf: 'SC', regiao: 'Joinville – SC', empresa: 'Schumacher Representações Comerciais', contato: 'Noeli', telefones: t('(47) 3433-7661', '(47) 99914-9329'), emails: ['comercial@schumacherrepres.com.br'] },
  {
    uf: 'SP',
    regiao: 'Araçatuba, São José do Rio Preto, Barretos, Franca, Ribeirão Preto, Porto Ferreira, Bauru, Marília e Presidente Prudente – SP',
    empresa: 'Dainezi Representações Comerciais',
    contato: 'Dainezi',
    telefones: t('(14) 3214-3422', '(14) 99793-2992'),
    emails: ['dainezivendas@uol.com.br'],
  },
  { uf: 'SP', regiao: 'Campinas, Jundiaí, Piracicaba, Sorocaba e Itapeva – SP', empresa: 'Cassio Roberto Sorrilla', contato: 'Cassio', telefones: t('(19) 98135-2206', '(19) 99670-4231'), emails: ['cassio_sorrilla@hotmail.com'] },
  { uf: 'SP', regiao: 'Grande São Paulo, Baixada Santista e Vale do Paraíba – SP', empresa: 'Fredson Rodrigues', contato: 'Fredson', telefones: t('(11) 95084-9731'), emails: ['fredson.rodrigues@bacchi.ind.br'] },
  { uf: 'SE', regiao: 'Aracaju – SE', empresa: 'Carvalho Representações', contato: 'Aldo', telefones: t('(79) 3248-1865', '(79) 99981-7906'), emails: ['carvalhorepresen2@hotmail.com'] },
  { uf: 'TO', regiao: 'Araguaína – TO', empresa: 'MK3 Comércio & Representações de Artigos de Pap.', contato: 'Marcos', telefones: t('(63) 3412-5519', '(63) 99981-3343'), emails: ['escritorio@mk3representacoes.com.br', 'marcos@mk3representacoes.com.br'] },
];

export const representantesDe = (uf: string) => REPRESENTANTES.filter((r) => r.uf === uf);

/** tel: link with the country code; only digits from the published number. */
export const linkTelefone = (numero: string) => `tel:+55${numero.replace(/\D/g, '')}`;
/** wa.me link, only for numbers the page itself calls WhatsApp. */
export const linkWhatsApp = (numero: string) => `https://wa.me/55${numero.replace(/\D/g, '')}`;
