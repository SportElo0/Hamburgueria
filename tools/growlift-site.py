#!/usr/bin/env python3
"""Monta as páginas do site da Growlift no visual novo (escuro e neon, aprovado em 24/11/2026).

    python3 tools/growlift-site.py

Escreve growlift/index.html, clinicas.html, restaurantes.html, imobiliarias.html e outros.html. O <head> de cada
página (título, descrição, link canônico, prévia, dados para o Google e as IAs) é mantido como está no arquivo;
só o corpo é refeito. As "Dúvidas" visíveis saem do próprio FAQPage do <head>, então a tela e os dados batem.
Estilo em growlift/site.css, comportamento em growlift/site.js. Substitui o tools/growlift-ramos.py.
"""
from __future__ import annotations

import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / 'growlift'
E = html.escape

WHATS = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.86 9.86 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.17-.47-.29z"/></svg>'
ICONS = {
    'chat': '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12z"/>',
    'bolt': '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    'phone': '<path d="M5 3h3l2 5-2.5 1.5a11 11 0 0 0 5 5L14 12l5 2v3a2 2 0 0 1-2 2A15 15 0 0 1 3 5a2 2 0 0 1 2-2z"/><path d="m16 3 5 5M21 3l-5 5"/>',
    'back': '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/>',
    'money': '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>',
}

# Serviços que existem (plataforma/src/lib/servicos.ts: prontos ou só falta ligar no número do cliente).
# Imagens: telas das demonstrações, com dados fictícios (growlift/img/servicos-novo).
S = {
    'site': ('#0865fe', 'Site com IA', 'Site que responde', 'Cliente entrou de noite e não achou resposta?', 'site-ia', ['Assistente responde a qualquer hora', 'Só com as informações do negócio', 'Pedido pronto para a equipe']),
    'zap': ('#00a884', 'WhatsApp com IA', 'Resposta na hora', 'Demora para responder no WhatsApp?', 'atendente-ia', ['Responde com seus preços e horários', 'Monta orçamento e agenda', 'Passa para a equipe quando não sabe']),
    'ligacao': ('#7c4dff', 'Ligações', 'Ninguém atendeu?', 'A ligação perdida vira conversa no WhatsApp.', 'ligacao', ['Mensagem só para quem apertou 1', 'A equipe ganha a tarefa de retornar', 'Aviso no celular na hora']),
    'retomada': ('#ff7a3d', 'Retomada', 'Quem sumiu volta', 'Mandou o orçamento e o cliente sumiu?', 'retomada', ['Retomada só para quem autorizou', 'Para quando ele responde', 'Depois, tarefa para a equipe']),
    'google': ('#1a73e8', 'Google', 'Certo no Google', 'Horário, telefone ou fotos errados no Google?', 'google', ['Perfil com horário e fotos reais', 'Botões de ligar, rota e site', 'Páginas do site com títulos certos']),
    'avaliacoes': ('#f5b400', 'Avaliações', 'Convite para avaliar', 'Poucas avaliações, ou só antigas?', 'avaliacoes', ['Convite depois do atendimento', 'Todo cliente recebe o mesmo convite', 'O convite sempre leva ao Google']),
    'cardapio': ('#e8453c', 'Na mesa', 'Cardápio no QR', 'Demora para pedir e para pagar a conta?', 'cardapio', ['Cardápio com fotos na mesa', 'Pedido e conta pelo Pix', 'Reservas e fila de espera']),
    'delivery': ('#ff4f8b', 'Delivery', 'Delivery próprio', 'Cansou da comissão dos aplicativos?', 'delivery', ['Pedido pelo site da sua loja, com Pix', 'Taxa por bairro e cupom', 'O contato de quem pede fica com você']),
    'clientes': ('#00b8d9', 'Clientes', 'Quem parou de comprar', 'Cliente sumiu e ninguém percebeu?', 'crm-torpedo', ['Quanto cada cliente já gastou', 'Quem sumiu há 1 a 4 meses', 'Mensagem pronta, só para quem aceitou']),
    'numeros': ('#16c172', 'Números', 'Quanto sobra no prato', 'Não sabe quanto lucra em cada produto?', 'paineis', ['Vendas e custo de cada prato', 'Relatório do mês', 'Sugestões do que ajustar']),
}

AGENDA = ('<div class="shot hero-shot"><div class="panel"><div class="row"><span>Ter, 10:00 · Limpeza<small>Marcada pelo WhatsApp, sábado 21h</small></span><span class="pill">confirmada</span></div>'
          '<div class="row"><span>Qua, 17:00 · Avaliação<small>Lembrete enviado na véspera</small></span><span class="pill w">aguardando</span></div>'
          '<div class="row"><span>Qui, 14:00 · Retorno<small>Remarcada pelo paciente</small></span><span class="pill">confirmada</span></div></div><span class="tag">Exemplo · agenda fictícia</span></div>')
CARTEIRA = ('<div class="shot hero-shot"><div class="panel"><div class="row"><span>Rua das Acácias, 120<small>Proprietário respondeu: “alugou”</small></span><span class="pill w">a confirmar</span></div>'
            '<div class="row"><span>Rua do Bosque, 45<small>Continua disponível · R$ 1.700</small></span><span class="pill">no site</span></div>'
            '<div class="row"><span>Av. Central, 900<small>Continua disponível · R$ 2.300</small></span><span class="pill">no site</span></div></div><span class="tag">Exemplo · endereços fictícios</span></div>')

RAMOS = {
    'clinica': dict(arquivo='clinicas.html', nome='Clínica', cor='#00b3a4', corl='#5fe0d4', para='Para clínicas e consultórios',
        h1='O paciente chama no WhatsApp, <em>a consulta fica marcada.</em>',
        lead='A gente monta uma atendente de IA que responde no WhatsApp da clínica de dia e de noite, marca e remarca consultas e lembra na véspera quem aceitou receber mensagens. Ela não faz triagem nem dá orientação de saúde.',
        hero=AGENDA,
        svcs=[('#00b3a4', 'WhatsApp com IA', 'Consulta marcada no WhatsApp', 'Paciente chama à noite e ninguém responde?', 'consultas', ['Mostra os horários livres e marca', 'Remarca e confirma na véspera', 'Ouve áudio e entende o pedido']),
              ('#0865fe', 'Site com IA', 'Site que tira dúvidas', 'Convênio, preço e endereço a qualquer hora.', 'site-ia', ['Responde só com as informações da clínica', 'Pedido de horário pronto para a recepção', 'Chama alguém da equipe quando precisa']),
              S['avaliacoes'], S['google']],
        qa_t='O que a atendente resolve <em>no dia a dia.</em>',
        qa=[('Sábado, 21h · horário', 'Tem horário para limpeza essa semana?', 'Tenho terça às 10h ou quarta às 17h. Quer que eu reserve?'),
            ('Domingo · convênio', 'Vocês aceitam o meu convênio?', 'Me manda o nome do convênio e do plano que eu confiro na lista da clínica pra você.'),
            ('Segunda, 7h · remarcar', 'Não vou conseguir ir hoje às 9h', 'Sem problema! Posso passar para amanhã às 9h ou quinta às 14h. Qual fica melhor?')],
        limite='<b>Não faz:</b> triagem, avaliação de sintomas nem orientação de saúde. Se a pessoa escrever que é uma emergência, ela só mostra o telefone 192 (SAMU) e avisa a equipe.'),
    'restaurante': dict(arquivo='restaurantes.html', nome='Restaurante', cor='#e8453c', corl='#ff8a80', para='Para restaurantes, hamburguerias e deliveries',
        h1='O cliente chama no WhatsApp, <em>o pedido chega na cozinha.</em>',
        lead='A gente monta uma atendente de IA que responde no WhatsApp do restaurante com o seu cardápio e a sua área de entrega e manda o link para o cliente pedir. O pedido chega na tela da cozinha, com pagamento por Pix, e as vendas ficam no relatório.',
        hero='pedidos', svcs=[S['delivery'], S['cardapio'], S['clientes'], S['numeros']],
        qa_t='O que a atendente responde <em>no WhatsApp.</em>',
        qa=[('Sexta, 22h · cardápio', 'Tem opção vegetariana?', 'Tenho o Veggie, com hambúrguer de grão-de-bico. Te mando o link do cardápio para pedir?'),
            ('Sábado · entrega', 'Entrega no Jardim Paulista?', 'Entrega sim, a taxa para o seu bairro é R$ 6. Quer o link para pedir?'),
            ('Domingo · pagamento', 'Dá pra pagar no Pix?', 'Dá sim! No fim do pedido aparece o código Pix para copiar.')],
        limite=''),
    'imobiliaria': dict(arquivo='imobiliarias.html', nome='Imobiliária', cor='#7c4dff', corl='#b39dff', para='Para imobiliárias e corretores',
        h1='A carteira de imóveis em dia, <em>sem ligar um por um.</em>',
        lead='Uma vez por mês, os proprietários que autorizaram recebem uma mensagem perguntando se o imóvel continua disponível e por quanto. Alugou ou vendeu? O corretor é avisado e, com um toque, o imóvel sai do site.',
        hero=CARTEIRA,
        svcs=[('#7c4dff', 'Carteira', 'Proprietário consultado todo mês', 'Imóvel alugado continua no site?', 'aviso', ['Mensagem mensal só para quem autorizou', '“Alugou?” vira aviso para o corretor', 'Com um toque, sai do site']),
              ('#0865fe', 'Site', 'Site que você mesmo edita', 'Trocar foto e preço demora dias?', 'imoveis', ['Cadastra o imóvel num painel', 'O site muda na hora', 'Lembrete de tirar dos portais']),
              ('#00a884', 'WhatsApp com IA', 'Quem procura é atendido', 'Mensagem de domingo à noite fica sem resposta?', 'visitas', ['Responde de dia e de noite', 'Mostra opções do site', 'Marca a visita com o corretor']),
              S['google']],
        qa_t='E a atendente responde <em>quem procura imóvel.</em>',
        qa=[('Domingo, 22h · disponibilidade', 'Esse apê da Rua do Bosque ainda tá disponível?', 'Está sim! 1 dormitório, aluguel de R$ 1.700. Quer visitar sábado às 10h ou às 15h?'),
            ('Pergunta comum', 'Aceita pet?', 'Esse aceita pet de pequeno porte. Quer ver outros que também aceitam?'),
            ('Busca', 'Tem algo até R$ 2.000 perto do metrô?', 'Tenho 3 opções no site com esse valor. Te mando os links com fotos?')],
        limite='<b>Autorização:</b> a imobiliária colhe, de cada proprietário, uma autorização específica para a consulta mensal pelo WhatsApp. Quem não quiser mais responde SAIR.'),
    'outro': dict(arquivo='outros.html', nome='', cor='#ff7a3d', corl='#ffab80', para='Para pousadas, serviços e outros negócios',
        h1='O orçamento enviado <em>não fica esquecido.</em>',
        lead='A gente monta só o que resolve o seu caso: atendente de IA no WhatsApp, ligação perdida que vira conversa, retomada de quem pediu orçamento e convite para avaliar no Google.',
        hero='retomada', svcs=[S['zap'], S['ligacao'], S['retomada'], S['avaliacoes']], qa_t='', qa=[], limite=''),
}
# Perguntas do 2º passo do diagnóstico por ramo (as mesmas do site anterior).
FORM_Q = {
    'clinica': dict(legend='Sobre a sua clínica', ramo=('Que tipo de clínica?', ['Odontológica', 'Estética', 'Fisioterapia', 'Médica ou consultório', 'Psicologia', 'Outro']),
                    volume=('Consultas por dia, mais ou menos', ['Até 10', 'De 10 a 30', 'De 30 a 60', 'Mais de 60']),
                    quem=('Quem responde o WhatsApp hoje?', ['A recepção', 'Eu mesmo', 'Ninguém dá conta direito', 'Já uso resposta automática']), other='Ex.: clínica veterinária'),
    'restaurante': dict(legend='Sobre o seu restaurante', ramo=('Que tipo de restaurante?', ['Hamburgueria', 'Pizzaria', 'Restaurante ou self-service', 'Lanchonete ou delivery', 'Doceria ou cafeteria', 'Outro']),
                        volume=('Pedidos por dia, mais ou menos', ['Até 30', 'De 30 a 100', 'De 100 a 300', 'Mais de 300']),
                        quem=('Quem responde o WhatsApp hoje?', ['Eu mesmo', 'Alguém do caixa ou da equipe', 'Ninguém dá conta direito', 'Já uso resposta automática']), other='Ex.: comida japonesa'),
    'imobiliaria': dict(legend='Sobre a sua imobiliária', ramo=('Com o que a imobiliária mais trabalha?', ['Aluguel', 'Venda', 'Aluguel e venda', 'Lançamentos', 'Outro']),
                        volume=('Imóveis na carteira, mais ou menos', ['Até 50', 'De 50 a 200', 'De 200 a 500', 'Mais de 500']),
                        quem=('Quem responde o WhatsApp hoje?', ['Os corretores', 'A recepção', 'Ninguém dá conta direito', 'Já uso resposta automática']), other='Ex.: imóveis rurais'),
    'base': dict(legend='Sobre o seu negócio', ramo=('Qual é o ramo?', ['Restaurante ou delivery', 'Serviços (ar-condicionado, limpeza, reforma…)', 'Saúde ou beleza', 'Imobiliária', 'Loja', 'Outro']),
                 volume=('Atendimentos ou pedidos por dia, mais ou menos', ['Até 10', 'De 10 a 50', 'De 50 a 150', 'Mais de 150']),
                 quem=('Quem responde o WhatsApp hoje?', ['Eu mesmo', 'Alguém da equipe', 'Ninguém dá conta direito', 'Já uso resposta automática']), other='Ex.: escola de inglês'),
}
# "O que mais atrapalha", com os ramos em que aparece (base = página inicial e outros negócios).
DORES = [
    ('base restaurante', 'Demoro para responder no WhatsApp e perco cliente'), ('clinica', 'Demoro para responder no WhatsApp e perco paciente'),
    ('imobiliaria', 'Demoro para responder quem chega dos portais e do WhatsApp'), ('clinica', 'Ninguém atende à noite nem no fim de semana'),
    ('imobiliaria', 'Perco tempo confirmando com os proprietários se o imóvel ainda está disponível'),
    ('base restaurante clinica imobiliaria', 'Pouca gente me acha no Google ou no Instagram'), ('base restaurante', 'O cliente compra uma vez e não volta'),
    ('clinica', 'Paciente falta ou esquece a consulta'), ('imobiliaria', 'Tem imóvel vendido ou alugado ainda anunciado'),
    ('restaurante', 'Cada cliente gasta pouco (quase ninguém pede adicional ou sobremesa)'), ('base', 'Mando orçamento e o cliente some, e ninguém lembra de retomar'),
    ('clinica', 'Perco tempo remarcando e confirmando consulta'), ('imobiliaria', 'Atualizar o site e os portais dá muito trabalho'),
    ('base restaurante', 'Pago muita comissão para aplicativo de entrega'), ('clinica', 'A agenda fica com horários vagos'),
    ('imobiliaria', 'Marcar visita com o corretor vira bagunça'), ('base', 'Perco ligação quando estou atendendo'),
    ('restaurante', 'Não sei quais pratos dão lucro'), ('clinica', 'O paciente não volta para o retorno'),
    ('imobiliaria', 'Muito curioso e pouco cliente pronto pra fechar'), ('base', 'Perco tempo com tarefa repetida (orçamento, agenda, confirmação)'),
    ('restaurante', 'No horário de pico, o atendimento não dá conta dos pedidos'),
]


def painel(rows, tag: str, cls: str = '') -> str:
    r = ''.join(f'<div class="row"><span>{E(a)}<small>{E(b)}</small></span><span class="pill{" w" if w else ""}">{E(c)}</span></div>' for a, b, c, w in rows)
    return f'<div class="shot {cls}"><div class="panel">{r}</div><span class="tag">{E(tag)}</span></div>'


PAINEIS = {
    'carteira': ([('Rua das Acácias, 120', 'Proprietário respondeu: “alugou”', 'a confirmar', True), ('Rua do Bosque, 45', 'Continua disponível · R$ 1.700', 'no site', False), ('Av. Central, 900', 'Continua disponível · R$ 2.300', 'no site', False)], 'Exemplo · endereços fictícios'),
    'imoveis': ([('Apto 1 dorm · Rua do Bosque', 'Foto e preço trocados agora', 'no site', False), ('Casa 3 dorm · Jardim Sul', 'Novo cadastro', 'no site', False), ('Sala comercial · Centro', 'Vendida: tirar dos portais', 'lembrete', True)], 'Exemplo · painel com imóveis fictícios'),
    'aviso': ([('Mensagem do mês enviada', 'Só para os proprietários que autorizaram', 'enviada', False), ('Rua do Bosque, 45', 'Respondeu: continua, R$ 1.700', 'ok', False), ('Rua das Acácias, 120', 'Respondeu: alugou · corretor avisado', 'a confirmar', True)], 'Exemplo · dados fictícios'),
    'pedidos': ([('Pedido 128 · 2 Smash + batata', 'Pix pago · entrega no Centro', 'na cozinha', False), ('Pedido 129 · Clássico + milkshake', 'Veio do link mandado no WhatsApp', 'aceito', False), ('Pedido 130 · Duplo Bacon', 'Aguardando o Pix', 'aguardando', True)], 'Exemplo · tela da loja com pedidos fictícios'),
    'visitas': ([('Domingo, 22h · Rua do Bosque, 45', 'Perguntou se ainda está disponível', 'respondido', False), ('Sábado, 10h · visita marcada', 'Com o corretor Rafael', 'marcada', False), ('Segunda · até R$ 2.000 perto do metrô', 'Recebeu 3 opções do site', 'respondido', False)], 'Exemplo · conversas fictícias'),
    'consultas': ([('Sábado, 21h · horário para limpeza', 'Respondido na hora, horário oferecido', 'marcada', False), ('Domingo · convênio', 'Pediu o plano para conferir', 'respondido', False), ('Segunda, 7h · não vai conseguir ir', 'Passou para amanhã, 9h', 'remarcada', False)], 'Exemplo · conversas fictícias'),
}


def shot(img: str | None, cls: str = '') -> str:
    if img in PAINEIS:
        return painel(*PAINEIS[img], cls)
    return f'<div class="shot {cls}"><img src="img/servicos-novo/{img}.webp" alt="" width="960" height="600" loading="lazy"><span class="tag">Demonstração · dados fictícios</span></div>'


def servicos(lista) -> str:
    cards = ''.join(
        f'<li class="sv" style="--c:{c}"><span class="chip">{E(chip)}</span><h3>{E(t)}</h3><p class="prob">{E(p)}</p>{shot(img)}'
        f'<ul class="checks">{"".join(f"<li>{E(i)}</li>" for i in itens)}</ul></li>'
        for c, chip, t, p, img, itens in lista)
    return f'<ul class="svc" role="list">{cards}</ul>'


def header() -> str:
    return f'''<a class="skip" href="#conteudo">Pular para o conteúdo</a>
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><symbol id="marca" viewBox="50 40 530 415"><path fill="#2f7dff" d="M280 48H410L190 450H55Z"/><path fill="#2f7dff" fill-rule="evenodd" d="M470 130L570 450H258Z M418 220L480 380H309Z"/></symbol></svg>
<header class="top"><div class="wrap">
  <a class="logo" href="/" aria-label="Growlift, página inicial"><svg aria-hidden="true"><use href="#marca"/></svg>GROWLIFT</a>
  <nav class="nav" aria-label="Principal"><a href="/#o-que-faz">O que a gente faz</a><a href="/#ramos">Por ramo</a><a href="/#quem-somos">Quem somos</a><a href="#duvidas">Dúvidas</a></nav>
  <div class="hdr"><a class="btn btn-p" href="#diagnostico">Diagnóstico grátis</a></div>
</div></header>'''


def ctas() -> str:
    return (f'<div class="cta"><a class="btn btn-p" href="#diagnostico">Diagnóstico grátis, 3 perguntas</a>'
            f'<a class="btn btn-g" href="/whatsapp.html" target="_blank" rel="noopener">{WHATS}Falar no WhatsApp</a></div>'
            '<span class="note">Sem compromisso. O plano chega no seu WhatsApp em até 2 dias úteis, com o preço por escrito.</span>')


def nao_promete() -> str:
    itens = [('Primeiro lugar no Google.', 'Ninguém pode garantir. A gente deixa o perfil completo e correto, e não controla a posição.'),
             ('Número de vendas ou de clientes.', 'Depende do seu negócio. O que a gente mostra é o que aconteceu, pedido por pedido.'),
             ('Mensagem para quem não pediu.', 'O sistema só escreve para quem autorizou, e sempre tem a opção SAIR.'),
             ('Avaliação comprada.', 'Todo cliente recebe o mesmo convite, sem desconto nem brinde, porque as regras do Google proíbem pagar ou premiar por avaliação.')]
    li = ''.join(f'<li><i aria-hidden="true">×</i><b>{E(a)}</b><span>{E(b)}</span></li>' for a, b in itens)
    return f'<section class="bg2" id="promessas" aria-labelledby="prom-t"><div class="wrap nao"><h2 id="prom-t">O que a gente <em>não promete.</em></h2><ul>{li}</ul></div></section>'


def passos() -> str:
    return '''<section aria-labelledby="passos-t"><div class="wrap"><h2 id="passos-t">Um degrau <em>por vez.</em></h2><ol class="steps">
<li><b>1º</b><h3>A gente acha a maior dor.</h3><p>3 perguntas no site ou uma conversa no WhatsApp. O plano chega em até 2 dias úteis, com preço por escrito.</p></li>
<li><b>2º</b><h3>Começa pelo que mais trava.</h3><p>Uma peça de cada vez, e você vê o que foi feito antes de seguir.</p></li>
<li><b>3º</b><h3>Depois, o sistema, se fizer sentido.</h3><p>Cada pedido acompanhado e o relatório do que foi pago. Sem comissão sobre as suas vendas.</p></li></ol></div></section>'''


def quem_somos() -> str:
    return '''<section id="quem-somos" aria-labelledby="time-t"><div class="wrap quem">
<div><h2 id="time-t">Gente de verdade <em>do outro lado do WhatsApp.</em></h2>
<p>A Growlift é o Lucas e o Antônio. Somos jovens, de São Paulo, e crescemos usando a internet do jeito que o seu cliente usa: pelo celular.</p>
<p>Nós dois montamos os sistemas, as automações e os sites, e atendemos você. Quem conversa com você é quem faz.</p></div>
<div class="fotos"><figure><img src="img/time/lucas.webp" alt="Lucas, da Growlift" width="640" height="800" loading="lazy"><figcaption><b>Lucas</b><span>Automação, sites e atendimento</span></figcaption></figure>
<figure><img src="img/time/antonio.webp" alt="Antônio, da Growlift" width="640" height="800" loading="lazy"><figcaption><b>Antônio</b><span>Programação: IA, automações e 3D</span></figcaption></figure></div>
</div></section>'''


def radios(name: str, opts: list[str], cls: str = '') -> str:
    return f'<div class="opts{cls}" role="radiogroup" aria-labelledby="q-{name}">' + ''.join(
        f'<label class="opt"><input type="radio" name="{name}" value="{E(o)}"><span>{E(o)}</span></label>' for o in opts) + '</div>'


def diagnostico(ramo: str) -> str:
    q = FORM_Q.get(ramo, FORM_Q['base'])
    chave = ramo if ramo in FORM_Q else 'base'
    dores = ''.join(f'<label class="opt"><input type="checkbox" name="dor" value="{E(t)}"><span>{E(t)}</span></label>' for r, t in DORES if chave in r.split())
    return f'''<section class="bg2" id="diagnostico" aria-labelledby="diag-t"><div class="wrap diag-g">
<div><h2 id="diag-t">Qual é a maior dor <em>do seu negócio hoje?</em></h2>
<p class="sub">3 perguntas rápidas, quase tudo com um toque. Em até 2 dias úteis chega no seu WhatsApp o que a gente faria no seu lugar, por onde começar e quanto custa.</p>
<p class="who"><img src="img/time/lucas.webp" alt="" width="48" height="48" loading="lazy"><img src="img/time/antonio.webp" alt="" width="48" height="48" loading="lazy"><span><b>Quem lê é gente.</b> Lucas e Antônio leem cada diagnóstico e montam o plano.</span></p></div>
<div>
<form class="form" id="form-diagnostico" novalidate data-sistema="https://growlift-sistema.vercel.app/api/publico/pedidos" data-chave="pk_growlift_site" data-endpoint="https://painel-lojas-sportelo.vercel.app/api/public/diagnosticos">
<div class="progress" aria-hidden="true"><i></i></div>
<p class="step-count" id="step-count" aria-live="polite">Passo 1 de 3</p>
<fieldset class="wstep group" data-step="1"><legend>O que mais atrapalha hoje? <span>(marque até 3)</span></legend>
<div class="opts">{dores}</div>
<div class="wnav"><button class="btn btn-p" type="button" data-next>Continuar <span aria-hidden="true">→</span></button></div></fieldset>
<fieldset class="wstep group" data-step="2"><legend>{E(q["legend"])}</legend>
<p class="sub-q" id="q-ramo">{E(q["ramo"][0])}</p>{radios("ramo", q["ramo"][1])}
<div class="field other" hidden><label for="f-ramo">Qual?</label><input id="f-ramo" name="segment" maxlength="60" placeholder="{E(q["other"])}"></div>
<p class="sub-q" id="q-volume">{E(q["volume"][0])}</p>{radios("volume", q["volume"][1], " opts-4")}
<p class="sub-q" id="q-quem">{E(q["quem"][0])}</p>{radios("quem", q["quem"][1])}
<div class="wnav"><button class="btn btn-g" type="button" data-back>Voltar</button><button class="btn btn-p" type="button" data-next>Continuar <span aria-hidden="true">→</span></button></div></fieldset>
<fieldset class="wstep group" data-step="3"><legend>Para onde mandamos o seu plano?</legend>
<div class="grid2">
<div class="field"><label for="f-negocio">Nome do negócio</label><input id="f-negocio" name="business" autocomplete="organization" maxlength="80" required placeholder="Ex.: Barbearia do Léo"></div>
<div class="field"><label for="f-zap">WhatsApp</label><input id="f-zap" name="whatsapp" type="tel" inputmode="tel" autocomplete="tel-national" required placeholder="(11) 90000-0000"></div>
<div class="field"><label for="f-cidade">Cidade</label><input id="f-cidade" name="city" autocomplete="address-level2" maxlength="80" required placeholder="Ex.: Campinas, SP"></div>
<div class="field"><label for="f-presenca">Instagram ou site <span>(se tiver)</span></label><input id="f-presenca" name="presence" maxlength="200" placeholder="@seunegocio ou seunegocio.com.br"></div>
<div class="field full"><label for="f-desejo">Quer contar mais alguma coisa? <span>(opcional)</span></label><textarea id="f-desejo" name="wishes" maxlength="500" rows="2" placeholder="Ex.: uso outro sistema e quero depender menos de aplicativos"></textarea></div>
</div>
<div class="hp" aria-hidden="true"><label for="f-site">Não preencha</label><input id="f-site" name="website" tabindex="-1" autocomplete="off"></div>
<label class="consent"><input type="checkbox" name="consent" required> <span>Autorizo a Growlift a me chamar no WhatsApp para enviar o diagnóstico e o plano. Veja a <a href="privacidade.html">política de privacidade</a>.</span></label>
<div class="wnav"><button class="btn btn-g" type="button" data-back>Voltar</button><button class="btn btn-p" type="submit">Receber meu plano grátis</button></div></fieldset>
<p class="form-msg" id="form-msg" role="alert" hidden></p>
</form>
<div class="done" id="form-ok" tabindex="-1" hidden><h3>Recebemos!</h3><p>Em até 2 dias úteis você recebe no WhatsApp o diagnóstico e o plano para o seu negócio. Quem vai ler e responder é o Lucas ou o Antônio.</p></div>
</div></div></section>'''


def faq(head: str) -> str:
    for m in re.findall(r'<script type="application/ld\+json">(.*?)</script>', head, re.S):
        data = json.loads(m)
        for g in data.get('@graph', [data]):
            if g.get('@type') == 'FAQPage':
                items = ''.join(f'<details><summary>{E(q["name"])}</summary><p>{E(q["acceptedAnswer"]["text"])}</p></details>' for q in g['mainEntity'])
                return f'<section id="duvidas" aria-labelledby="faq-t"><div class="wrap"><h2 id="faq-t">Dúvidas.</h2><div class="faq">{items}</div></div></section>'
    raise SystemExit('FAQPage não encontrado no <head>')


def footer() -> str:
    return '''<footer class="foot"><div class="wrap">
<div><a class="logo" href="/"><svg aria-hidden="true"><use href="#marca"/></svg>GROWLIFT</a><p>Pedidos acompanhados até a venda, para negócios locais. Plano sob medida, sem comissão sobre as suas vendas.</p></div>
<div><h3>Contato</h3><ul><li><a href="/whatsapp.html" target="_blank" rel="noopener">WhatsApp (11) 94227-9336</a></li><li><a href="mailto:contato@growlift.com.br">contato@growlift.com.br</a></li><li><a href="https://instagram.com/growlift.ai" target="_blank" rel="noopener">@growlift.ai</a></li></ul></div>
<div><h3>Navegue</h3><ul><li><a href="/#o-que-faz">O que a gente faz</a></li><li><a href="/#ramos">Por ramo</a></li><li><a href="#diagnostico">Diagnóstico grátis</a></li></ul></div>
<div class="legal">© <span id="ano">2026</span> Growlift · 69.611.450 LUCAS CORREA ENNSER · CNPJ 69.611.450/0001-17 · Rua Barão de Monte Mor, 55, Real Parque, São Paulo/SP, CEP 05687-010 · <a href="privacidade.html">Política de privacidade</a> · <a href="termos.html">Termos de uso</a> · <a href="termos.html#cancelamento">Cancelamento e reembolso</a></div>
</div></footer>
<script src="site.js" defer></script>
<script src="https://growlift-sistema.vercel.app/chat.js" data-chave="pk_growlift_site" data-texto="Tirar dúvidas" data-cor="#2f7dff" async></script>
</body>
</html>
'''


def o_que_faz() -> str:
    itens = [('chat', 'O cliente <em>chama.</em>', 'Pelo WhatsApp, por ligação ou pelo site.'),
             ('bolt', 'A IA responde <em>na hora.</em>', 'De dia e de noite, com os seus preços e horários.'),
             ('phone', 'Ligação perdida <em>não fica sem resposta.</em>', 'Se o cliente aceitar, recebe uma mensagem no WhatsApp, e você ganha a tarefa de ligar de volta.'),
             ('back', 'Quem sumiu <em>é lembrado.</em>', 'Mandou o orçamento e ele não respondeu? Sai uma mensagem de retomada, só para quem autorizou.'),
             ('money', 'Você acompanha <em>até o pagamento.</em>', 'Cada pedido aparece no seu celular, até virar dinheiro no caixa.')]
    li = ''.join(f'<li><span class="ico" aria-hidden="true"><svg viewBox="0 0 24 24">{ICONS[i]}</svg></span><h3>{t}</h3><p>{s}</p></li>' for i, t, s in itens)
    fim = ('<li class="fim"><h3>Tudo isso num sistema só, <em>montado para o seu negócio.</em></h3>'
           '<div class="cta"><a class="btn btn-p" href="#diagnostico">Diagnóstico grátis, 3 perguntas</a></div>'
           '<ol><li><b>1º</b> a gente acha a maior dor</li><li><b>2º</b> começa pelo que mais trava</li><li><b>3º</b> o sistema, se fizer sentido</li></ol></li>')
    return f'''<section class="faz static" id="o-que-faz" aria-labelledby="faz-t"><div class="faz-pin">
<canvas class="faz-canvas" aria-hidden="true"></canvas><div class="faz-shade" aria-hidden="true"></div>
<div class="wrap faz-copy"><h2 class="faz-label" id="faz-t">O que a Growlift faz, em poucas palavras.</h2>
<div class="faz-track" aria-hidden="true">{"<i></i>" * 6}</div>
<ol class="faz-steps">{li}{fim}</ol>
<p class="faz-next" aria-hidden="true">Role para ver ↓</p></div></div></section>'''


def home(head: str) -> str:
    perdidos = [('Sexta, 23h', 'Pedido pelo site: “Tem quarto para o Réveillon?”', 'Ninguém responde até sábado. Ela reserva em outro lugar.'),
                ('Terça, 15h', 'Chamada perdida.', 'A recepção estava ocupada. A pessoa liga para o próximo da lista.'),
                ('Sábado', 'Orçamento enviado: “Quer que eu reserve?”', 'Sem resposta. Na correria, ninguém lembra de voltar a falar com ele.'),
                ('Domingo', '“Amei, voltamos com certeza!”', 'Foi embora sem avaliar no Google. Quem procura não fica sabendo.')]
    lost = ''.join(f'<li><span class="when">{E(a)}</span><span class="what">{E(b)}</span><span class="miss">{E(c)}</span></li>' for a, b, c in perdidos)
    ramos = [('/diagnostico.html', 'Empresas de conserto', 'Ar, elétrica, encanamento: ninguém fica sem resposta.', '#ff7a3d', '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z"/>'),
             ('/clinicas', 'Clínicas', 'Atendimento no WhatsApp e agenda.', '#00b3a4', '<path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10z"/><path d="M9 11h6M12 8v6"/>'),
             ('/restaurantes', 'Restaurantes', 'Reservas, pedidos e Pix.', '#e8453c', '<path d="M4 11h16a8 8 0 0 1-16 0z"/><path d="M8 7c0-1.5 1-2 1-3M12 7c0-1.5 1-2 1-3M16 7c0-1.5 1-2 1-3"/>'),
             ('/imobiliarias', 'Imobiliárias', 'Carteira de imóveis em dia.', '#7c4dff', '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>'),
             ('/outros', 'Pousadas, serviços e outros', 'Orçamento, retomada e avaliações.', '#1a73e8', '<path d="M3 20h18M5 20V9l7-5 7 5v11"/><path d="M9 20v-5h6v5"/>')]
    rl = ''.join(f'<li><a class="rcard" href="{h}" style="--c:{c}"><span class="ic" aria-hidden="true"><svg viewBox="0 0 24 24">{ic}</svg></span><h3>{E(t)}</h3><p>{E(d)}</p><span class="ver"><i aria-hidden="true">→</i>Ver</span></a></li>' for h, t, d, c, ic in ramos)
    pick = ''.join(f'<li><a href="{h}">{E(t)}</a></li>' for h, t, *_ in ramos)
    return f'''<body>
{header()}
<main id="conteudo">
<section class="hero hero-c" aria-labelledby="titulo"><div class="wrap">
<h1 id="titulo">Os pedidos que você já recebe, <em>acompanhados até a venda.</em></h1>
<p class="sub">A gente monta um sistema que responde quem pergunta, lembra quem sumiu e mostra quais pedidos viraram dinheiro no caixa.</p>
{ctas()}
<ul class="pick"><li class="pick-l">Ou veja o que a gente faz pelo seu ramo:</li>{pick}</ul>
</div></section>
<section id="dor" aria-labelledby="dor-t"><div class="wrap"><h2 id="dor-t">Cliente interessado <em>que vai embora.</em></h2>
<p class="sub">Muitas vezes o pedido chegou e ninguém acompanhou.</p><ul class="lost">{lost}</ul><p class="fine">Situações de exemplo.</p></div></section>
{o_que_faz()}
<section id="ramos" aria-labelledby="ramos-t"><div class="wrap"><h2 id="ramos-t">Veja o que a gente faz <em>pelo seu ramo.</em></h2><ul class="rc">{rl}</ul></div></section>
{quem_somos()}
{diagnostico("base")}
{faq(head)}
</main>
{footer()}'''


def ramo_page(key: str, head: str) -> str:
    r = RAMOS[key]
    hero = r['hero'] if r['hero'].startswith('<') else shot(r['hero'], 'hero-shot')
    qa = ''
    if r['qa']:
        cards = ''.join(f'<li><p class="w">{E(w)}</p><p class="q">“{E(q)}”</p><p class="a">{E(a)}</p></li>' for w, q, a in r['qa'])
        lim = f'<p class="limite">{r["limite"]}</p>' if r['limite'] else ''
        qa = f'<section aria-labelledby="qa-t"><div class="wrap"><h2 id="qa-t">{r["qa_t"]}</h2><ul class="qa">{cards}</ul>{lim}<p class="fine">Conversas de exemplo, com nomes e valores fictícios.</p></div></section>'
    glow = r['cor'] + '55'
    nome = f' data-ramo-nome="{E(r["nome"])}"' if r['nome'] else ''
    return f'''<body data-ramo="{key}"{nome} style="--cor:{r["cor"]};--cor-l:{r["corl"]};--cor-glow:{glow}">
{header()}
<main id="conteudo">
<section class="hero hero-r" aria-labelledby="titulo"><div class="wrap">
<div><p class="para">{E(r["para"])}</p><h1 id="titulo">{r["h1"]}</h1><p class="sub">{E(r["lead"])}</p>{ctas()}</div>
{hero}
</div></section>
<section class="bg2" aria-labelledby="svc-t"><div class="wrap"><h2 id="svc-t">O que a gente monta <em>pra você.</em></h2>{servicos(r["svcs"])}
<p class="fine">O plano junta só o que resolve o seu caso. <a href="/">Ver tudo o que a Growlift faz</a>.</p></div></section>
{qa}
{passos()}
{diagnostico(key)}
{faq(head)}
</main>
{footer()}'''


def head_of(path: Path) -> str:
    s = path.read_text(encoding='utf-8')
    head = s[: s.index('<body')]
    head = head.replace('<link rel="stylesheet" href="styles.css">', '<link rel="stylesheet" href="site.css">')
    head = re.sub(r'<!-- Dados para o Google e as IAs\..*?-->', '<!-- Dados para o Google e as IAs. As "Dúvidas" da página saem deste FAQPage (tools/growlift-site.py): mude aqui e rode o script de novo. -->', head, flags=re.S)
    head = head.replace('<meta name="theme-color" content="#06080d">', '<meta name="theme-color" content="#04060c">')
    return head


def main() -> None:
    p = ROOT / 'index.html'
    h = head_of(p)
    p.write_text(h + home(h), encoding='utf-8')
    for key, r in RAMOS.items():
        p = ROOT / r['arquivo']
        h = head_of(p)
        p.write_text(h + ramo_page(key, h), encoding='utf-8')
    print('ok: index.html +', ', '.join(r['arquivo'] for r in RAMOS.values()))


if __name__ == '__main__':
    main()
