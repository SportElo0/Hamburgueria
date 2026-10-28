// Institutional facts, each with its source. Nothing here is new: dates, address and lines come from
// clipsbacchi.com.br (/empresa, /contato, footer links) or from the catalogue PDF.

export const EMPRESA = {
  razaoSocial: 'Bacchi Indústria e Comércio de Artefatos de Ferro Ltda.',
  nome: 'Bacchi',
  fundacao: 1937,
  endereco: {
    rua: 'Via das Magnólias, nº 234',
    bairro: 'Jardim Colibri',
    cidade: 'Cotia',
    uf: 'SP',
    cep: '06713-270',
  },
  /** Main line (contact page and catalogue). Not a WhatsApp line. */
  telefone: '+55 11 4617-9999',
  telefoneLink: 'tel:+551146179999',
  /** WhatsApp button of the current site (wa.me link in its header). */
  whatsapp: '(11) 95089-2731',
  whatsappLink: 'https://wa.me/5511950892731',
  /** Printed on the last page of the catalogue PDF. */
  email: 'bacchivendas@uol.com.br',
  horario: 'Segunda a sexta, das 8h às 17h',
  instagram: 'https://www.instagram.com/bacchi_industria',
  siteAntigo: 'https://clipsbacchi.com.br',
};

/** "A Empresa" page of the current site, in its own words, split into short paragraphs. */
export const HISTORIA = {
  fundacao: 'Fundada em 1937, a Bacchi é pioneira na produção de clips, alfinetes, pranchetas, grampos e artigos para escritório.',
  tradicao: 'Sendo a mais antiga e tradicional empresa do setor, sempre se destacou pela qualidade e cuidado na fabricação de seus produtos.',
  hoje: 'Atualmente, com estrutura e agilidade para atender com rapidez todo o mercado brasileiro, é hoje a empresa escolhida por todos os mais importantes distribuidores, revendedores, papelarias e corporações.',
  homologacao: 'Nossos produtos são homologados nas principais empresas e órgãos públicos e presentes nas mesas de todos os escritórios do país.',
  santoAndre: 'As primeiras instalações em Santo André.',
  processo: 'A manutenção dos equipamentos e ferramentais Bacchi são feitas por uma equipe de profissionais treinados e com olhar atento. O processo de fabricação dos produtos é desde o recebimento da matéria prima até o envio do produto.',
};

/** Photographer credited in the file names of the current site's production photos and video. */
export const CREDITO_FOTOS = 'Fotos de produção e vídeos: Eduardo Sardinha, publicados no site atual da Bacchi.';
