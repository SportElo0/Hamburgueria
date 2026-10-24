# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js 16 (App Router) + TypeScript + Tailwind CSS 4, lucide-react, next/image, next/font. Pinned by the client brief ("Motion para animações necessárias"; no library is added unless an animation needs it). Same base as the sibling projects `regiane-camilo/` and `conves-ilhabela/` in this repository. Hosting: Vercel, separate project with Root Directory `odair-advogados`.

## Users

People in the State of São Paulo looking for a lawyer for a personal or business matter: a divorce or custody question, an inventory after a death, an INSS benefit or retirement, a contract to draft or review, a consumer problem, overtime or a labor contract (often bank or telemarketing workers), or a company needing legal support or a defense in economic criminal law. They arrive mostly on a phone, often tense, sometimes after a referral, and want to know quickly: does this office handle my kind of problem, is it serious, and how do I reach it.

Secondary audience: Dr. Odair Alves da Silva, who will judge the demo the first time he opens the link and must approve every institutional text before any official launch.

## Product Purpose

Institutional website for Odair Alves da Silva & Advogados, a law office acting in the State of São Paulo. It presents the office, explains its five practice areas in plain language (each with its own page), shows how first contact works, hosts informative articles, and offers a minimal, privacy-respecting contact path. Success: a visitor identifies their area in seconds, reads a sober explanation, and knows how to make contact, without any promise of results.

## Positioning

The office's own identity (the gold monogram on navy) and five clearly delimited areas, presented with restraint and verifiable facts only. It competes on clarity and sobriety, not on numbers, testimonials or claims.

## Operating Context

- Legal advertising in Brazil is regulated: Código de Ética e Disciplina da OAB and Provimento 205/2021. Publicity must be informative and sober, no promises of results, no client capture, no comparison with other lawyers, no fees or promotions, no case results, no testimonials or ratings, no misuse of OAB symbols. Content must be reviewed by the lawyer before publication.
- This build is a commercial demonstration: not the official site, no official domain, no real sensitive data collected, discreetly marked as an unofficial demo, noindex.
- Visitors may write about sensitive legal matters: collect the minimum (name, a return channel, optional area, a short message), never documents; LGPD applies.

## Capabilities and Constraints

- Practice areas (confirmed by the brief):
  - Família e Sucessões: regime de bens, divórcio judicial e extrajudicial, guarda de filhos, sucessões, inventários.
  - Previdenciário: benefícios previdenciários, aposentadorias, pensões, auxílio-acidente, questões administrativas e judiciais junto ao INSS.
  - Contratual e do Consumidor: elaboração de contratos, análise e revisão contratual, orientação em relações de consumo, defesa dos direitos do consumidor.
  - Trabalhista: orientação ao trabalhador, análise de contratos, horas extras, questões envolvendo atividades bancárias e telemarketing.
  - Empresarial e Penal Econômico: assessoria jurídica empresarial, orientações sobre atividades empresariais, defesa em direito penal econômico.
- Unknown and never invented: OAB registration number, address, city, phone, WhatsApp, e-mail, social links, years of practice, education, certified specializations, team, number of clients or cases, success rates, awards, case results. All of them live in one config file as pending (`null`).
- Contact: no sending service and no confirmed channel yet (user answer: "Ainda não, deixar pendente"). The contact form runs as a clearly labeled demonstration that validates and sends nothing. When a WhatsApp number is confirmed, the button opens a neutral message: "Olá, gostaria de obter informações sobre o atendimento do escritório Odair Alves da Silva & Advogados."
- Institutional copy (about, approach steps, FAQ answers, area pages, articles) is provisional, marked for Dr. Odair's approval. Articles are a structure with fields (title, summary, content, author, date, last update, legal sources); no complex legal text is published without review, no fake news, rulings or precedents.
- No automatic legal diagnosis, no promises, information never presented as a substitute for individual advice.

## Brand Commitments

- Name: "Odair Alves da Silva & Advogados". Responsible lawyer: Dr. Odair Alves da Silva.
- Logo: a geometric gold monogram (O, A and S letters inside a column/shield form with a capital and a ring on top) beside the name set in light caps. Only a raster photo of it exists (`odair-advogados/public/marca/` holds the derived files). Preserve proportions; no redrawing of illegible details as if exact; prepared for the original vector file to replace it. No OAB symbols, no generic legal symbol in its place.
- Client-pinned palette: navy #071B2E, institutional blue #102C43, gold #C6A15A, ivory #F7F5F0, graphite #252B31, white #FFFFFF, borders #E6E8EA. Navy hero, gold as identity detail (not metallic shine), mostly light content sections, white and dark cards, thin lines, discreet shadows, generous space.
- Voice: Brazilian Portuguese, sober, clear, respectful, humane; no persuasive or commercial language.
- Layout reference (user-supplied): a dark-blue law-firm landing page with large type on the left, info on the right, gold details, and a dark section with a horizontal card carousel. Its fictitious numbers, ratings and lawyer photo are not copied.

## Evidence on Hand

- Logo raster: `/root/.claude/uploads/.../fcf74c02-image.jpg` (gold monogram and name on textured navy), processed into `public/marca/`.
- No photo of Dr. Odair (user answer: "Ainda não, usar o monograma"). No AI-generated person may represent him.
- No testimonials, reviews, ratings, case results, numbers or history. None may be fabricated.

## Product Principles

1. Truth over persuasion: every sentence is either confirmed or visibly provisional.
2. Find your area fast: the five areas are the spine of the site.
3. The identity is the office's own: the monogram carries the brand, not stock legal imagery.
4. Ask for little: contact collects the minimum and never sensitive documents.
5. Phone first and calm: legible, fast, no heavy effects.

## Accessibility & Inclusion

WCAG AA contrast on navy and ivory grounds, keyboard navigation with visible focus, touch targets ≥44px, prefers-reduced-motion respected, semantic HTML and plain language for stressed readers.
