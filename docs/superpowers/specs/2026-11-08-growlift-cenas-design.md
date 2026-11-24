# Site da Growlift: cenas que seguram a tela (proposta, 08/11/2026)

## Por quê

O Antônio viu o site novo e achou que as informações fortes (a pesquisa da sobremesa em 3D e a de Harvard) viraram
frasezinhas que passam direto: a pessoa rola e nem vê. Ele quer o site "participativo": nos pontos fortes a tela
segura a pessoa até ela ver. Não adianta só jogar o texto no site.

## Objetivos

- Cada informação forte vira uma cena que segura a rolagem e acontece na frente da pessoa.
- O hambúrguer 3D abre em cima de um prato, enquadrado no prato inteiro, e o zoom fica onde a pessoa deixou,
  sem precisar repetir o gesto.
- Menos frase pequena: cada cena tem um título, no máximo uma frase e a fonte da pesquisa em letra pequena.

## Não muda

Capa, o navegador passando pelas 4 telas, os modelos de site, o "Um degrau por vez", o diagnóstico em 3 passos,
o raio-x, o "Quem somos", as dúvidas e a versão em inglês.

## O que não pode acontecer

- **Tela presa demais:** cada cena segura no máximo 1 a 1,5 tela de rolagem.
- **3D roubando a rolagem no celular:** arrastar na vertical continua rolando a página; girar o prato é com o dedo
  na horizontal e o zoom é com dois dedos.
- **Site pesado:** a biblioteca nova só carrega junto com a página (~70 KB) e o 3D continua carregando só perto
  da seção.

## Como vai ser construído (escolhido pelo Antônio)

- **Animações por rolagem:** GSAP + ScrollTrigger, hospedados no próprio site (a proteção do site só permite
  scripts dele).
- **Prato:** prato de cerâmica feito por código e juntado ao hambúrguer no mesmo arquivo 3D. Sem crédito do
  Higgsfield. Se ficar artificial, a alternativa é gerar de novo com prato pela IA (~18 créditos).

## As cenas

### Cena 1: o hambúrguer no prato (seção "Para restaurantes")

- **Abertura:** abre com o prato inteiro enquadrado, um pouco de cima. Ao entrar na tela, a rolagem gira o prato
  até ficar de frente para a pessoa. Depois disso o controle é dela.
- **Zoom:** ligado, com limites (não entra dentro do pão nem some de tão longe). Fica onde a pessoa deixou.
- **Rotação automática:** só antes do primeiro toque. Depois para, para não tirar o prato de onde a pessoa deixou.
- **Ver na mesa:**
  - **Celular e iPad:** botão grande "Ver na minha mesa", que abre a câmera.
  - **Computador:** um QR ao lado, "Aponte o celular e veja na sua mesa", que abre o site já nessa seção.
- **Aviso de IA:** sai a legenda "exemplo criado por IA". Fica só um selo pequeno no canto: "Criado por IA".
- **Texto:** título e uma frase só; a pesquisa sai daqui e vira a Cena 2.

### Cena 2: a pesquisa da sobremesa (logo depois do hambúrguer)

- **O que a pessoa vê:** a tela para, com o título "Quem vê em 3D pede mais sobremesa."
- **Os números:** com a rolagem, aparece "Foto comum" e o número sobe até 18%. Depois "Em 3D" sobe até 41%,
  com a barra azul passando bem a cinza.
- **Fonte:** em letra pequena embaixo, com link para o estudo, e "resultado de um estudo, não garantia".
- **Depois:** a tela solta.

### Cena 3: WhatsApp (no lugar da seção atual de texto)

- **O que a pessoa vê:** a tela para. À esquerda, um celular; à direita, o título "Nunca mais espere resposta."
- **A conversa:** com a rolagem, ela acontece mensagem por mensagem, com o horário de cada uma:
  - o cliente pergunta às 23h41;
  - o "digitando…" aparece;
  - a resposta chega às 23h41;
  - o horário fica agendado às 23h42.

  Fica marcada como exemplo fictício.
- **O fecho:** quando a conversa termina, "7x" cresce grande, com a frase "quem responde em até 1 hora tem cerca de
  7 vezes mais chance de levar a conversa adiante". Embaixo, a fonte de Harvard em letra pequena.
- **Depois:** a tela solta.

## Decisões minhas (o Antônio pode trocar)

- **Ordem das seções:** o hambúrguer vem logo depois do navegador, a pesquisa da sobremesa logo em seguida, e o
  WhatsApp depois.
- **Celular:** as cenas seguram por menos tempo que no computador e o celular da conversa fica em cima do título.
- **Movimento reduzido:** as animações rodam para todo mundo, como o resto do site (pedido anterior dos sócios).
- **Pesquisas:** os números são os do estudo (18% e 41%; 7 vezes em até 1 hora), sem arredondar para cima.
- **Teste:** computador (1366 px) e celular (390 px), sem rolagem de lado, sem erro, e o 3D carregando no site
  publicado. Publica só depois do ok do Antônio olhando as telas.
