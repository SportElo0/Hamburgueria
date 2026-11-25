#!/usr/bin/env python3
"""SUBSTITUÍDO por tools/growlift-site.py (visual novo, 25/11/2026). Não rode: ele montava as páginas do site antigo.

Gera as páginas de ramo do site da Growlift a partir de growlift/index.html.

    python3 tools/growlift-ramos.py

Cria growlift/clinicas.html, restaurantes.html, imobiliarias.html e outros.html: a mesma página, já com o ramo
aplicado sem depender de JavaScript (seções certas visíveis), título, descrição, link canônico e prévia próprios,
capa com o texto do ramo, perguntas do ramo antes das gerais e os dados estruturados (JSON-LD) batendo com o que
aparece na tela. Assim o Google e os robôs de IA, que nem sempre rodam JavaScript, enxergam cada ramo como uma
página de verdade (GEO, etapa 2).

Rode de novo sempre que mudar o growlift/index.html. As seções escondidas seguem o RAMOS do growlift/main.js:
se mudar lá, mude aqui.
"""
from __future__ import annotations

import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / 'growlift'
SITE = 'https://growlift.com.br'

# Seções que o main.js mostra ou esconde (applyRamo) e as escondidas de cada ramo (RAMOS[...].hide).
ALL_HIDE = ['ramos', 'restaurantes', 'pesquisa-3d', 'whatsapp', 'modelos', 'subida']

RAMOS = {
    'clinica': {
        'arquivo': 'clinicas.html',
        'path': '/clinicas',
        'hide': ['restaurantes', 'pesquisa-3d', 'ramos'],
        'titulo': 'Atendimento com IA no WhatsApp para clínicas | Growlift',
        'descricao': 'Atendente de IA no WhatsApp da clínica: responde de dia e de noite, marca e remarca consultas e lembra a consulta na véspera. Diagnóstico grátis.',
        'eyebrow': 'Para clínicas e consultórios',
        'h1': 'O paciente chama no WhatsApp, <span class="blue">a consulta fica marcada.</span>',
        'lead': 'A gente monta uma atendente de IA que responde no WhatsApp da clínica de dia e de noite, marca e remarca consultas e lembra na véspera quem aceitou receber mensagens. Ela não faz triagem nem dá orientação de saúde.',
        'faq': [
            ('A IA marca consulta sozinha?', 'Sim, nos horários livres que a clínica definir. Ela mostra as opções, o paciente escolhe e a consulta entra na agenda. Um dia antes, ela manda o lembrete para o paciente que aceitou receber mensagens confirmar.'),
            ('Ela responde dúvidas de saúde?', 'Não. Ela não faz triagem nem dá orientação de saúde. Responde só com as informações da clínica, como preços, horários e convênios, e chama alguém da equipe quando precisa, inclusive quando o assunto é urgente.'),
            ('E se o paciente mandar áudio?', 'Ela ouve o áudio, entende o pedido e responde por escrito, como nos exemplos desta página.'),
            ('Funciona com a agenda que a clínica já usa?', 'Depende do sistema. Conte no diagnóstico qual você usa: o plano diz se dá para ligar ou se a agenda fica no nosso sistema.'),
        ],
    },
    'restaurante': {
        'arquivo': 'restaurantes.html',
        'path': '/restaurantes',
        'hide': [],
        'titulo': 'WhatsApp com IA e pedidos com Pix para restaurantes | Growlift',
        'descricao': 'Atendente de IA no WhatsApp do restaurante: responde com o seu cardápio e manda o link do pedido, que chega na cozinha com Pix. Diagnóstico grátis.',
        'eyebrow': 'Para restaurantes, hamburguerias e deliveries',
        'h1': 'O cliente chama no WhatsApp, <span class="blue">o pedido chega na cozinha.</span>',
        'lead': 'A gente monta uma atendente de IA que responde no WhatsApp do restaurante com o seu cardápio e a sua área de entrega e manda o link para o cliente pedir. O pedido chega na tela da cozinha, com pagamento por Pix, e as vendas ficam no relatório.',
        'faq': [
            ('Como o pedido chega na cozinha?', 'A atendente responde com o seu cardápio e as suas taxas de entrega e manda o link para o cliente pedir pelo site do restaurante. O pedido chega na tela da cozinha, com pagamento por Pix. Se o cliente pede algo fora do cardápio, ela chama alguém da equipe.'),
            ('O dinheiro do Pix passa pela Growlift?', 'Não. O Pix é do restaurante e o dinheiro cai direto na conta de vocês. A Growlift cobra o valor combinado no plano, sem comissão por pedido. A tarifa do banco ou do provedor de pagamento, se houver, e as mensagens do WhatsApp oficial (Meta) são cobradas à parte, direto de vocês.'),
            ('Funciona na hora do pico?', 'Funciona. Ela responde várias conversas ao mesmo tempo, então ninguém fica esperando enquanto a cozinha está cheia.'),
            ('E o cardápio em 3D?', 'Está em teste: o cliente gira o prato no celular e pode ver na mesa pela câmera, do tamanho real. Só entra no plano se fizer sentido para o seu restaurante.'),
        ],
    },
    'imobiliaria': {
        'arquivo': 'imobiliarias.html',
        'path': '/imobiliarias',
        'hide': ['restaurantes', 'pesquisa-3d', 'ramos'],
        'titulo': 'Carteira em dia e WhatsApp com IA para imobiliárias | Growlift',
        'descricao': 'Site com painel, consulta mensal aos proprietários que autorizaram e atendente de IA no WhatsApp que marca a visita com o corretor. Diagnóstico grátis.',
        'eyebrow': 'Para imobiliárias e corretores',
        'h1': 'A carteira de imóveis em dia, <span class="blue">sem ligar um por um.</span>',
        'lead': 'Uma vez por mês, os proprietários que autorizaram recebem uma mensagem perguntando se o imóvel continua disponível e por quanto. Alugou ou vendeu? O corretor é avisado e, com um toque, o imóvel sai do site.',
        'faq': [
            ('Como funciona a consulta aos proprietários?', 'Uma vez por mês, só para quem autorizou, sai uma mensagem pelo WhatsApp da imobiliária. O proprietário responde do jeito dele, até por áudio, e a resposta marca o imóvel como “a confirmar” para o corretor. Quem não quiser mais responde SAIR.'),
            ('Precisa de autorização do proprietário?', 'Precisa. A imobiliária colhe de cada proprietário uma autorização específica para receber essa mensagem no WhatsApp, no contrato de administração, por exemplo. Sem autorização, ele não recebe a mensagem.'),
            ('O imóvel sai dos portais sozinho?', 'Não. Ele sai do site da imobiliária com um toque do corretor, e fica a lembrança de tirar dos portais.'),
            ('A atendente marca visita?', 'Marca. Ela responde quem procura imóvel de dia e de noite, com as informações do site, e marca a visita com o corretor.'),
        ],
    },
    'outro': {
        'arquivo': 'outros.html',
        'path': '/outros',
        'hide': ['ramos', 'restaurantes', 'pesquisa-3d', 'whatsapp', 'modelos', 'subida'],
        'titulo': 'Pousadas e serviços: WhatsApp com IA e retomada | Growlift',
        'descricao': 'Para pousadas, oficinas e instaladores: atendente de IA no WhatsApp, ligação perdida que vira conversa e retomada de quem pediu orçamento.',
        'eyebrow': 'Para pousadas, serviços e outros negócios',
        'h1': 'O orçamento enviado <span class="blue">não fica esquecido.</span>',
        'lead': 'A gente monta só o que resolve o seu caso: atendente de IA no WhatsApp, ligação perdida que vira conversa, retomada de quem pediu orçamento e convite para avaliar no Google.',
        'faq': [
            ('Como funciona a retomada?', 'Quando o cliente pede orçamento e autoriza, o sistema volta a falar com ele se ele sumir. A retomada para na hora em que ele responde, e quem não quiser mais responde SAIR.'),
            ('E a ligação que ninguém atende?', 'Quem liga e não é atendido pode apertar 1 para receber uma mensagem no WhatsApp, só sobre aquela ligação. A equipe sempre ganha a tarefa de retornar.'),
            ('Serve para pousada?', 'Serve. A atendente responde com as informações da pousada, como valores e regras da hospedagem, e, depois da estadia, o convite para avaliar no Google vai para os hóspedes que aceitaram receber mensagens, sempre o mesmo, sem desconto nem brinde.'),
            ('Dá para ver funcionando antes?', 'Dá. A demonstração mostra os 5 serviços com uma pousada fictícia, em growlift-comercial.vercel.app/demonstracao.'),
        ],
    },
}


def troca(s: str, velho: str, novo: str) -> str:
    assert s.count(velho) == 1, f'esperava 1 ocorrência de: {velho[:80]!r} (achou {s.count(velho)})'
    return s.replace(velho, novo)


def visibilidade(s: str, ident: str, escondida: bool) -> str:
    m = re.search(rf'<section\b[^>]*\bid="{re.escape(ident)}"[^>]*>', s)
    if not m:
        return s  # seção que não existe mais na página (ex.: modelos)
    tag = m.group(0)
    nova = re.sub(r'\s+hidden(?=[\s>])', '', tag)
    if escondida:
        nova = nova[:-1] + ' hidden>'
    return s[: m.start()] + nova + s[m.end():]


def texto(x: str) -> str:
    return html.unescape(re.sub(r'<[^>]+>', '', x)).strip()


def gerar(ramo: str, cfg: dict, base: str) -> str:
    s = base
    url = SITE + cfg['path']

    # Cabeçalho próprio do ramo.
    s = re.sub(r'<title>.*?</title>', f"<title>{cfg['titulo']}</title>", s, count=1)
    s = troca(s, re.search(r'<meta name="description" content="[^"]*">', s).group(0), f'<meta name="description" content="{cfg["descricao"]}">')
    s = troca(s, f'<link rel="canonical" href="{SITE}/">', f'<link rel="canonical" href="{url}">')
    s = troca(s, f'<meta property="og:url" content="{SITE}/">', f'<meta property="og:url" content="{url}">')
    s = re.sub(r'<meta property="og:title" content="[^"]*">', f'<meta property="og:title" content="{cfg["titulo"]}">', s, count=1)
    s = re.sub(r'<meta property="og:description" content="[^"]*">', f'<meta property="og:description" content="{cfg["descricao"]}">', s, count=1)
    s = troca(s, '<body>', f'<body data-ramo="{ramo}">')

    # Capa com o texto do ramo.
    s = troca(s, '<p class="eyebrow rise">Para negócios locais que vendem por orçamento ou reserva</p>', f'<p class="eyebrow rise">{cfg["eyebrow"]}</p>')
    s = re.sub(r'(<h1 id="titulo" class="rise d2">).*?(</h1>)', lambda m: m.group(1) + cfg['h1'] + m.group(2), s, count=1)
    s = re.sub(r'(<p class="lead rise d3">).*?(</p>)', lambda m: m.group(1) + cfg['lead'] + m.group(2), s, count=1)
    s = troca(s, f'<a class="pick-card" href="{cfg["path"]}" data-ramo="{ramo}">', f'<a class="pick-card" href="{cfg["path"]}" data-ramo="{ramo}" aria-current="true">')

    # Seções do ramo visíveis sem JavaScript (o mesmo que o applyRamo faz).
    for ident in ALL_HIDE:
        s = visibilidade(s, ident, ident in cfg['hide'])
    for tag in re.findall(r'<section\b[^>]*\bdata-so="[^"]+"[^>]*>', s):
        so = re.search(r'data-so="([^"]+)"', tag).group(1).split()
        ident = re.search(r'\bid="([^"]+)"', tag).group(1)
        s = visibilidade(s, ident, ramo not in so)

    # Perguntas do ramo antes das gerais.
    itens = ''.join(f'\n        <details class="reveal"><summary>{q}</summary><p>{a}</p></details>' for q, a in cfg['faq'])
    s = troca(s, '<div class="faq">', '<div class="faq">' + itens)

    # Dados estruturados: os mesmos da página inicial + esta página + as perguntas que aparecem nela.
    m = re.search(r'<script type="application/ld\+json">(.*?)</script>', s, re.S)
    dados = json.loads(m.group(1).replace('<\\/', '</'))
    faq = [(texto(q), texto(a)) for q, a in re.findall(r'<details class="reveal"><summary>(.*?)</summary><p>(.*?)</p></details>', s)]
    grafo = [g for g in dados['@graph'] if g['@type'] in ('Organization', 'WebSite')]
    grafo.append({'@type': 'WebPage', '@id': url + '#pagina', 'url': url, 'name': cfg['titulo'], 'description': cfg['descricao'], 'inLanguage': 'pt-BR', 'isPartOf': {'@id': f'{SITE}/#site'}, 'about': {'@id': f'{SITE}/#org'}})
    grafo.append({'@type': 'FAQPage', '@id': url + '#duvidas', 'inLanguage': 'pt-BR', 'isPartOf': {'@id': url + '#pagina'}, 'mainEntity': [{'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': a}} for q, a in faq]})
    ld = json.dumps({'@context': 'https://schema.org', '@graph': grafo}, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
    s = s[: m.start(1)] + ld + s[m.end(1):]

    aviso = f'<!-- Gerada por tools/growlift-ramos.py a partir do index.html. Não edite aqui: mude o index.html (ou o script) e rode o script de novo. -->\n'
    return troca(s, '<!doctype html>\n', '<!doctype html>\n' + aviso)


def main() -> None:
    base = (ROOT / 'index.html').read_text(encoding='utf-8')
    for ramo, cfg in RAMOS.items():
        (ROOT / cfg['arquivo']).write_text(gerar(ramo, cfg, base), encoding='utf-8')
        print('gerada', cfg['arquivo'])


if __name__ == '__main__':
    raise SystemExit('Use tools/growlift-site.py: este script era do site antigo.')
    main()
