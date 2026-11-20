# Psicologia de preços, estrutura de 3 planos e contratos (fidelidade/multa) para a Growlift

Contexto aplicado: agência brasileira vendendo planos mensais de R$147 / R$247 ou R$297 / R$597 para restaurantes (pequenos negócios, normalmente CNPJ ou MEI). Notas separam evidência forte (experimentos publicados, lei, jurisprudência) de evidência fraca (blogs de fornecedores, números sem fonte primária).

## 1. Efeito chamariz (decoy) e efeito compromisso: quanto o plano do meio realmente ganha?

### Takeaway
O efeito chamariz (atração) e o efeito compromisso existem e são clássicos, mas são muito mais fortes em laboratório com atributos numéricos do que na vida real; a melhor evidência de campo (assinaturas online, 2024) mostra ganho real, porém pequeno (+0,6% nas vendas no estudo observacional; +5,7% em um subgrupo no experimento randomizado). O famoso caso "The Economist" (16%/84%) é uma pesquisa em sala de aula, não um teste de mercado.

### Cited Findings
- **Origem acadêmica (forte, mas laboratório):** Huber, Payne & Puto (1982), "Adding asymmetrically dominated alternatives", Journal of Consumer Research 9(1):90-98, mostraram que acrescentar uma opção claramente pior (dominada) aumenta a escolha da opção que a domina — [Columbia lecture notes](https://www.columbia.edu/~md3405/Behave_UM_3_17.pdf); [Simonson 1989 PDF](https://cognition.aau.at/bg/BA/Simonson%20%281989%29.pdf)
- Simonson (1989), "Choice Based on Reasons: The Case of Attraction and Compromise Effects", JCR 16(2):158-174, documentou também o **efeito compromisso**: a opção intermediária ganha participação quando passa a ser o "meio-termo" do conjunto — [Simonson 1989 PDF](https://cognition.aau.at/bg/BA/Simonson%20%281989%29.pdf). (Não consegui extrair as porcentagens exatas do paper; ver Gaps.)
- Em resumo didático do estudo de cerveja de Huber et al., a participação da opção-alvo subiu de 43% para 63% com o chamariz — número de fonte secundária (aula), não verificado no original — [Columbia lecture notes](https://www.columbia.edu/~md3405/Behave_UM_3_17.pdf)
- **Caso Economist (Ariely):** web R$/US$59, impresso US$125 (chamariz), impresso+web US$125 → 16 escolheram web, 0 impresso, 84 o combo; sem o chamariz: 68 web e 32 combo. Amostra de ~100 alunos do MIT, escolha hipotética — [Now I Know](https://nowiknow.com/?p=4937); [UBC blog](https://blogs.ubc.ca/onurkurtic/2015/07/10/the-decoy-effect/)
- Crítica: a circulação real só-digital da Economist (~100 mil de 1,57 milhão, ~6,35%) não bate com os 16% do experimento — [SmartCompany](https://www.smartcompany.com.au/people-human-resources/pricing-propheteer-debunking-a-market-research-myth/)
- **Problemas de replicação (forte):** Frederick, Lee & Baskin (2014), "The Limits of Attraction" (JMR), não encontraram efeito de atração quando os atributos eram experimentados ou mostrados sem números; o efeito apareceu só com atributos numéricos/estilizados, e os autores questionam sua relevância prática — [Wharton PDF](https://marketing.wharton.upenn.edu/wp-content/uploads/2016/10/The-Limits-of-Attraction.pdf)
- Yang & Lynn (2014) testaram 91 cenários: efeito de atração significativo em só 12% deles (24% nos cenários numéricos; 4% nos com imagens/descrições qualitativas) — conforme resumido em [Kato, Hashimoto & Hoshino 2024, Kobe Univ. DP2024-33](https://www.rieb.kobe-u.ac.jp/academic/ra/dp/English/DP2024-33.pdf)
- Uma meta-análise (Milberg et al.) encontrou efeito estatisticamente significativo; outros autores atribuem as falhas de replicação a diferenças no ambiente de escolha ou à "significância" do estímulo — [IIM Kozhikode WP](https://iimk.ac.in/uploads/publications/3145PB_WP02_For_Upload.pdf); [Kellogg](https://www.kellogg.northwestern.edu/academics-research/research/detail/2018/explaining-the-attraction-effect-an-ambiguity-attention-applicability-framework)
- **Melhor evidência de campo (assinaturas, dinheiro real):** Kato, Hashimoto & Hoshino (2024) — plataforma pixiv FANBOX (planos de assinatura de criadores). Estudo observacional (n=10.000 usuários): adicionar um plano chamariz elevou vendas em 0,6% (significativo a 1%); experimento randomizado com criadores (n final 3.952): +5,7% de vendas, mas só no quartil intermediário de criadores (25-75%), sem efeito significativo nos outros quartis; o ganho veio de mais apoiadores, não de ticket maior; entre usuários, odds ratio 1,714 de escolher o alvo quando o chamariz estava presente — [Kobe DP2024-33](https://www.rieb.kobe-u.ac.jp/academic/ra/dp/English/DP2024-33.pdf)
- O mesmo paper cita literatura de que o efeito é movido sobretudo por decisão rápida/intuitiva (Sistema 1) e enfraquece quando o comprador delibera e gasta o próprio dinheiro — [Kobe DP2024-33](https://www.rieb.kobe-u.ac.jp/academic/ra/dp/English/DP2024-33.pdf)
- **"60-70% escolhem o plano do meio":** número repetido em blogs e atribuído à ProfitWell, sem fonte primária localizável — [Monetizely](https://www.getmonetizely.com/articles/good-better-best-does-the-three-tier-pricing-model-still-work-in-saas) (evidência fraca)

### Inferences
- Para a Growlift, o efeito do meio é plausível porque a página de planos apresenta atributos numéricos e listas comparáveis (o contexto em que o efeito replica), mas deve-se esperar efeito modesto, não "84%". Dono de restaurante decidindo gasto mensal recorrente tende a deliberar (Sistema 2), o que enfraquece o efeito.
- Um chamariz puro (plano propositalmente ruim) não é necessário; o plano de R$597 funciona mais como âncora/opção de compromisso do que como chamariz dominado. Um plano "falso" que ninguém deveria comprar também pode conflitar com a regra interna de "nada inventado" se for apresentado de forma enganosa.
- Medir: registrar qual plano cada cliente escolhe nas primeiras vendas; com poucos clientes, não dá para concluir estatisticamente, então tratar como observação qualitativa.

### Gaps
- Não extraí os percentuais exatos do efeito compromisso em Simonson (1989) nem os números originais de Huber et al. (1982).
- Não encontrei estudo de campo sobre decoy/compromisso em serviços B2B para pequenos negócios ou no Brasil.
- Não encontrei fonte primária para "o selo 'Recomendado/Mais popular' aumenta a escolha do plano do meio em X%"; só alegações de blogs.

## 2. Ancoragem com plano alto e tamanho do salto entre planos (R$247 vs R$297)

### Takeaway
Não há evidência acadêmica forte que defina uma razão ótima entre planos; as recomendações de mercado (2-3x, ou 20-40%) vêm de blogs e se contradizem. Matematicamente, R$297 é quase exatamente a média geométrica de R$147 e R$597 (≈R$296), criando dois saltos iguais de ~2x, enquanto R$247 cria saltos desiguais (1,68x e depois 2,42x), o que faz o topo parecer mais distante.

### Cited Findings
- Guia de blog: salto de 2-3x do plano de entrada para o intermediário e 2-2,5x do intermediário para o premium — [Monetizely](https://www.getmonetizely.com/articles/the-subscription-pricing-hierarchy-from-basic-to-premium) (evidência fraca)
- Outro glossário: saltos de ~20-40% entre Good→Better→Best, "dependente do contexto" — [Flexprice](https://flexprice.io/glossary/good-better-best-pricing) (evidência fraca; conflita com o anterior)
- Não localizei orientação primária da Simon-Kucher ou da Paddle sobre razões entre planos; as atribuições a essas firmas em blogs não têm fonte rastreável — [Monetizely](https://www.getmonetizely.com/articles/good-better-best-does-the-three-tier-pricing-model-still-work-in-saas)
- Efeito do dígito da esquerda (Thomas & Morwitz 2005, JCR): um preço terminado em 9 só parece menor que o preço um centavo acima **quando muda o dígito da esquerda** (ex.: 2,99 vs 3,00), e o efeito é maior quando os preços comparados estão próximos — [IDEAS/RePEc](https://ideas.repec.org/a/oup/jconrs/v32y2005i1p54-64.html); [NYU Stern](https://w4.stern.nyu.edu/sternbusiness/fall_2005/pennySaved.html); [ScienceDaily](https://www.sciencedaily.com/releases/2005/06/050607030351.htm)

### Inferences
- Razões: 147→247 = 1,68x; 247→597 = 2,42x. 147→297 = 2,02x; 297→597 = 2,01x. Com R$297 a escada é simétrica (cada plano ~dobra), o que é o padrão "1x/2x/4x" e torna o R$597 uma âncora crível ("o dobro do meio"). Com R$247 o meio fica mais "barato" em relação ao topo (o topo parece 2,4x mais caro), o que tende a empurrar mais gente para o meio, mas também torna o R$597 mais difícil de vender e o salto de R$147→R$247 pequeno (risco de canibalizar o básico para cima, o que é bom, ou de o básico parecer suficiente).
- Dígito da esquerda: R$297 fica em "2xx" (abaixo de R$300) e R$597 em "5xx" (abaixo de R$600), então ambos aproveitam o efeito; R$247 não ganha nada extra de dígito à esquerda em relação a R$297 (ambos "2xx").
- Decisão prática: R$297 se o objetivo é o meio ser o plano principal e o topo ser vendável; R$247 se o objetivo é maximizar conversão no meio com margem menor. Sem dados próprios, R$297 tem a lógica mais coerente; testar pode ser feito oferecendo o preço em propostas sucessivas (não simultâneas na mesma página, para não confundir).
- A diferença de R$50/mês (R$600/ano por cliente) importa mais pela margem do que pela psicologia: com poucos clientes, cada R$50 recorrente é relevante.

### Gaps
- Nenhum estudo controlado encontrado sobre razões ótimas entre planos de assinatura B2B/SMB.
- Nenhuma evidência específica sobre preços em reais ou consumidores/empresários brasileiros.

## 3. Preços "quebrados" terminados em 7, 9 ou 97

### Takeaway
Terminações em 9 aumentam vendas no varejo (evidência de campo forte), mas o efeito é maior quando o cliente tem pouca informação e enfraquece com produtos mais caros e decisão deliberada; não encontrei evidência científica de que o "7" seja melhor que o "9" — é convenção do marketing digital brasileiro.

### Cited Findings
- Anderson & Simester (2003), Quantitative Marketing and Economics 1:93-110: em três experimentos de campo (catálogo de varejo), o final $9 aumentou a demanda nos três; o aumento foi maior para itens novos; evidência mais fraca de que o $9 funciona menos quando o varejista também usa sinal de "Promoção"; autores sugerem que o efeito é maior quando o cliente tem pouca informação — [Kellogg](https://www.kellogg.northwestern.edu/academics-research/research/detail/2003/effects-of-9-price-endings-on-retail-sales-evidence/); [IDEAS](https://ideas.repec.org/a/kap/qmktec/v1y2003i1p93-110.html)
- Thomas & Morwitz (2005): efeito do dígito da esquerda ocorre só quando o dígito mais à esquerda muda — [IDEAS](https://ideas.repec.org/a/oup/jconrs/v32y2005i1p54-64.html)
- Estudo posterior (dissertação, Taiwan): efeito do dígito da esquerda enfraquece em produtos mais caros e aparece mais sob pressa ou baixa motivação para pensar — [NCU Taiwan](https://ir.lib.ncu.edu.tw/bitstream/987654321/71428/1/index.html) (evidência moderada/fraca)
- Levy et al.: consumidores 11% menos propensos a notar aumento de preço quando o novo preço termina em 9 — [Bar-Ilan (Levy)](https://econ.biu.ac.il/sites/econ/files/shared/people/LevyDaniel/acr2012.pdf)

### Inferences
- Para R$147/R$297/R$597, o ganho do final 7 vem quase todo de ficar abaixo de um número redondo (R$150, R$300, R$600), não do 7 em si. R$149/R$299/R$599 teriam o mesmo efeito de dígito.
- Em B2B, finais "quebrados" podem sinalizar "promoção/infoproduto"; preços redondos (R$150/R$300/R$600) podem sinalizar qualidade/premium. Não há evidência forte para nenhum lado em serviços para restaurantes; é escolha de marca. Manter consistência entre os três planos é o que importa.

### Gaps
- Nenhum estudo encontrado comparando finais 7 vs 9 vs redondo em serviços B2B, SaaS ou no Brasil.

## 4. Churn em SMB, contratos anuais/semestrais e taxa de implantação

### Takeaway
Clientes pequenos cancelam muito mais: o ChartMogul mostra que negócios com ticket abaixo de US$10/mês retêm, no quartil de cima, só ~63% dos clientes por ano, contra ~86% acima de US$500/mês. Planos anuais reduzem churn segundo Paddle/ProfitWell e outros, mas os números exatos circulam sobretudo em blogs. Não encontrei dado confiável sobre o efeito de cobrar taxa de implantação no churn.

### Cited Findings
- **ChartMogul SaaS Retention Report** (dados de >2.100 empresas SaaS, sobretudo 2022): ARPA < US$10/mês — retenção de clientes do quartil superior 63,1%, NRR do quartil superior 65,1%; ARPA < US$50 — GRR do quartil superior 60-70%; ARPA > US$500 — retenção de clientes do quartil superior 85,7%, NRR 109,3% — [ChartMogul](https://chartmogul.com/saas-retention-report/)
- **SaaS Capital 2023** (B2B privado): NRR mediana 102%, GRR mediana 91%; retenção sobe conforme o valor do contrato (ACV) — [SaaS Capital](https://www.saas-capital.com/?p=2105). SaaS Capital exclui empresas < US$1M ARR — [SaaS Capital 2020](https://www.saas-capital.com/research/2020-saas-retention-benchmarks-for-b2b-companies/)
- **Recurly (dados de julho de 2026):** churn mediano SaaS 3,22% (voluntário 2,16%, involuntário 1,06%); "serviços empresariais e profissionais" 3,44%; boa referência <2%, típico 2-4%, >5% investigar. A página rotula como "anual", mas o próprio texto diz que 2% ao mês ≈ 22% ao ano, então esses valores parecem **mensais** — inconsistência da fonte. Churn involuntário (falha de pagamento) cai com ticket mais alto (1,30% em US$10-25 vs 0,46% em US$100-250) — [Recurly](https://www.recurly.com/research/churn-rate-benchmarks)
- Recurly afirma que planos anuais têm LTV maior mas criam um ponto de risco na renovação, exigindo engajamento antes da renovação — [Recurly](https://www.recurly.com/research/churn-rate-benchmarks)
- **Paddle (fonte primária, sem números públicos de churn):** clientes em plano anual têm LTV 2 a 4 vezes maior que mensais — [Paddle Developer](https://developer.paddle.com/concepts/retain/term-optimization.md); ProfitWell (2019, ~2.500 empresas): participação de planos anuais varia por faixa de preço, ~20-30% no preço intermediário — [ProfitWell Report](https://paddle.com/studios/shows/profitwell-report/annual-vs-monthly)
- Números de blogs (evidência fraca): SMB SaaS 3-7% ao mês / 30-58% ao ano — [Vena](https://www.venasolutions.com/blog/saas-churn-rate); mensal 3-6% vs anual 1-2% ao mês — [Fungies](https://fungies.io/reduce-saas-churn-guide-2026); anual churna ~1/3 do mensal (atribuído a Paddle 2025, não verificado) — [Pipeline Road](https://pipelineroad.com/agency/blog/saas-churn-rate-benchmarks); Baremetrics: 92% retidos em 12 meses (anual) vs 68% (mensal), via blog — [Fungies](https://fungies.io/?p=38697)
- Desconto anual típico 15-20%; acima de 30% "parece desespero" (opinião, não dado) — [Echai Ventures](https://echai.ventures/startingup/pricing-packaging/how-do-i-set-up-an-annual-plan-discount-without-training-everyone-to-just-wait-for-the-cheaper-option)
- **Onboarding (não taxa):** ProfitWell 2019 (~500 produtos, ~25 mil clientes): onboarding bem avaliado elevou disposição a pagar em 8-17%, e clientes com boa percepção de onboarding tiveram muito menos abandono nos primeiros 21 dias — [Paddle/ProfitWell Report](https://paddle.com/studios/shows/profitwell-report/positive-onboarding)

### Inferences
- Restaurantes pequenos pagando R$147-597 (~US$25-110) ficam na faixa de ARPA em que a retenção anual típica fica bem abaixo de 85%; planejar caixa supondo que uma parte relevante dos clientes sai em 12 meses, mesmo com bom serviço. Restaurante também fecha com frequência, o que gera churn que nenhum contrato evita.
- Contrato com prazo mínimo reduz churn "por impulso" nos primeiros meses, mas não muda a satisfação; a renovação vira ponto de risco. Um primeiro mês bem executado (site no ar rápido, primeiros pedidos) é o que os dados de onboarding sugerem como alavanca principal.
- "Criação grátis + fidelidade de 6/12 meses" e "taxa de implantação sem fidelidade" são formas de recuperar o custo de criação. Sem dados de taxa de implantação, a escolha deve se basear no custo real de criação e no risco jurídico (seção 6). Uma opção intermediária: taxa de implantação que é abatida/isentada se o cliente fica X meses (o benefício fica claro e a multa fica atrelada a ele).
- Oferecer pagamento anual com desconto moderado (ex.: ~2 meses grátis ≈ 16%) é coerente com as práticas citadas; involuntário (cartão recusado/Pix esquecido) é parte relevante do churn em ticket baixo, então cobrança recorrente automática ajuda.

### Gaps
- Não encontrei dados primários (ProfitWell, Recurly, ChartMogul) sobre o efeito de **cobrar taxa de implantação** na conversão ou no churn.
- Não encontrei benchmarks de churn de agências/retainers de marketing para pequenos negócios, nem dados brasileiros.
- Os percentuais "anual vs mensal" de blogs não foram verificados na fonte primária.

## 5. Preço baseado em valor para restaurantes (comissão economizada) sem prometer resultado

### Takeaway
A lógica de preço por valor (comparar com a comissão do marketplace que o restaurante deixa de pagar) é útil como argumento, mas, pela lei brasileira, qualquer número exibido vira oferta e não pode ser enganoso; deve ser apresentado como simulação com os números do próprio cliente, não como resultado garantido.

### Cited Findings
- CDC art. 30: toda informação ou publicidade suficientemente precisa obriga o fornecedor e integra o contrato; art. 37: proíbe publicidade enganosa, inclusive por omissão; art. 6º, III: direito à informação clara — [Planalto, Lei 8.078/1990](https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm)
- Alegação de que preço baseado em valor gera "3x mais crescimento de lucro" que custo-mais é atribuída à Simon-Kucher em blogs, sem fonte primária — [Monetizely](https://www.getmonetizely.com/articles/good-better-best-does-the-three-tier-pricing-model-still-work-in-saas) (evidência fraca; não usar como número)

### Inferences
- Forma segura: uma calculadora "se você fizer X pedidos por mês pelo seu site em vez do app, a comissão que você deixaria de pagar seria Y", com o restaurante digitando os próprios números e com aviso de que é simulação, não garantia. Evitar "você vai economizar R$ X" ou "pague o plano com a economia" como promessa.
- Âncora natural: o plano custa menos que a comissão de poucas dezenas de pedidos; isso é aritmética verificável (depende da taxa real do app, que o cliente conhece), não promessa de vendas.

### Gaps
- Não pesquisei aqui as taxas atuais de comissão do iFood e similares (outro pesquisador pode cobrir); não encontrei estudos sobre enquadramento de ROI em vendas para restaurantes.

## 6. Lei brasileira: fidelidade, multa, arrependimento de 7 dias, CDC em contratos com CNPJ/MEI e página de preços transparente

### Takeaway
Fidelidade é lícita quando há benefício real em troca (ex.: criação grátis), e a multa deve ser proporcional ao tempo que falta e ao benefício recebido (STJ, REsp 1.362.084/RJ). Se o cliente contrata online, o direito de arrependimento de 7 dias (art. 49) se aplica quando ele é consumidor; um restaurante com CNPJ normalmente não é consumidor (teoria finalista), mas o STJ aplica o CDC a empresas que provem vulnerabilidade, e o Código Civil permite ao juiz reduzir multa excessiva — então a prática segura é seguir o padrão CDC para todos.

### Cited Findings
- **Multa proporcional (forte):** STJ, REsp 1.362.084/RJ, 4ª Turma, rel. Min. Luis Felipe Salomão, j. 16/5/2017 (Informativo 608): em TV por assinatura, a multa por quebra da fidelidade deve ser proporcional ao tempo restante; cobrar a multa integral sem descontar o período cumprido coloca o fornecedor em vantagem exagerada (CDC art. 51, IV) — [Dizer o Direito](https://www.dizerodireito.com.br/2017/10/multa-pela-quebra-do-prazo-minimo-de.html); [Teletime](https://teletime.com.br/25/05/2017/stj-multa-por-quebra-de-fidelidade-deve-ser-proporcional-em-qualquer-tempo/)
- **Fidelidade exige contrapartida:** REsp 1.097.582 (telefonia): prazo de permanência mínima não é venda casada (CDC art. 39, I) desde que haja benefícios efetivos ao consumidor — [Teletime](https://teletime.com.br/25/05/2017/stj-multa-por-quebra-de-fidelidade-deve-ser-proporcional-em-qualquer-tempo/); regulação Anatel (Res. 632/2014, arts. 57-58; atual Res. 765/2023): fornecedor pode oferecer benefício e em troca exigir permanência; multa calculada pelo valor do benefício e tempo restante — [Dizer o Direito](https://www.dizerodireito.com.br/2017/10/multa-pela-quebra-do-prazo-minimo-de.html) (setorial de telecom, usado por analogia)
- **Direito de arrependimento:** CDC art. 49 — o consumidor pode desistir em 7 dias da assinatura ou do recebimento do serviço quando a contratação ocorre fora do estabelecimento comercial; valores pagos no prazo devem ser devolvidos de imediato, corrigidos — [Planalto, CDC](https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm)
- **Decreto 7.962/2013 (comércio eletrônico):** site deve mostrar em destaque nome empresarial, CNPJ/CPF, endereço físico e eletrônico, características essenciais do serviço, condições da oferta e formas de pagamento; informar o meio de arrependimento, que deve ser o mesmo da contratação, confirmar imediatamente o pedido de arrependimento e avisar o cartão/instituição para não cobrar ou estornar; atendimento eletrônico com resposta em até 5 dias — [Idec](https://idec.org.br/consultas/dicas-e-direitos/idec-destaca-direitos-do-consumidor-no-comercio-eletronico); [Jus.com.br](https://jus.com.br/artigos/27342/a-regulamentacao-na-contratacao-no-comercio-eletronico)
- **CDC para empresa (finalismo mitigado):** o STJ admite aplicar o CDC a pessoa jurídica quando há vulnerabilidade concreta (técnica, jurídica, econômica ou informacional) diante do fornecedor; marco REsp 1.195.642/RJ (Min. Nancy Andrighi); para PJ a vulnerabilidade precisa ser provada (para PF é presumida); porte pequeno sozinho não basta; em aquisição de software para uso empresarial o STJ não tem reconhecido a mitigação (segundo o Conjur) — [Correio Braziliense/JusBrasiliense](https://blogs.correiobraziliense.com.br/jusbraziliense/2026/06/24/vulnerabilidade-da-pessoa-juridica-cdc/amp/); [Legismap (REsp 2.020.811)](https://legismap.com.br/conteudos/decisoes-dos-tribunais/consumidor-pessoa-juridica-quando-as-empresas-podem-ter-a-protecao-do-cdc-stj); [Conjur](https://www.conjur.com.br/?p=329794); [Jus.com.br](https://jus.com.br/artigos/112143/a-incidencia-do-codigo-de-defesa-do-consumidor-em-sociedades-empresarias-mitigacao-da-teoria-finalista-pelo-stj)
- **Contrato de adesão:** CDC art. 54, §3º (termos legíveis, fonte não inferior a corpo 12) e §4º (cláusulas que limitam direitos em destaque); art. 46 (contrato não obriga se o consumidor não teve oportunidade de conhecer o conteúdo antes) — [Planalto, CDC](https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm)
- **Código Civil (vale para B2B):** art. 413 — o juiz deve reduzir equitativamente a cláusula penal se a obrigação foi cumprida em parte ou se o valor for manifestamente excessivo; art. 473, parágrafo único — se uma parte fez investimentos consideráveis, a rescisão unilateral só produz efeito após prazo compatível com a recuperação do investimento — [Planalto, Código Civil](https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm)

### Inferences
- "Criação grátis com fidelidade" é o desenho mais defensável juridicamente quando a multa = valor (declarado) da criação × (meses que faltam ÷ meses de fidelidade). Ex.: criação avaliada em R$X, fidelidade de 6 meses, cliente sai no mês 2 → multa = R$X × 4/6. Isso segue a lógica do REsp 1.362.084 e do art. 413 do CC, e vale tanto se o restaurante for tratado como consumidor quanto como empresa.
- Multa igual a "todas as mensalidades restantes" é arriscada: tende a ser vista como vantagem exagerada (CDC) ou cláusula penal excessiva (CC art. 413).
- Arrependimento de 7 dias: como a venda é online/WhatsApp (fora do estabelecimento), aplicar a regra a todos (inclusive CNPJ) evita discussão sobre vulnerabilidade de restaurante pequeno/MEI e é boa prática de confiança. Se o trabalho de criação começar dentro dos 7 dias, avisar e pedir o aceite por escrito; a devolução integral continua sendo o padrão seguro.
- Página de preços transparente: mostrar preço mensal, o que inclui, prazo de fidelidade, regra da multa proporcional com exemplo, forma de cancelamento (pelo mesmo canal), arrependimento de 7 dias, CNPJ e endereço da Growlift, e se o preço é "a partir de" ou fixo. Não usar contagem regressiva ou "últimas vagas" falsas (publicidade enganosa, art. 37), coerente com a regra interna "nada inventado".
- Antes de publicar a oferta, a regra do repositório manda rodar o `revisor-legal`.

### Gaps
- Não li o inteiro teor do REsp 1.362.084/RJ nem do REsp 1.195.642/RJ; informações vêm de sites jurídicos confiáveis (Dizer o Direito, Conjur), não do acórdão.
- Não encontrei decisão do STJ especificamente sobre fidelidade em contratos de agência/marketing/sites para pequenas empresas.
- Não confirmei se o MEI é tratado de forma diferente das demais PJs na jurisprudência recente (tendência é análise caso a caso pela vulnerabilidade).
- Não verifiquei orientações específicas de Procon-SP sobre fidelidade em serviços digitais.
