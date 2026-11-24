# Prato em 3D no tamanho real: como escanear e colocar no cardápio da mesa

No cardápio da mesa (QR), o prato com 3D ganha um selo **3D** na foto. O cliente toca, vê o prato girando com a medida ("18 cm de largura") e, em **Ver na minha mesa**, a câmera abre e o prato aparece em cima da mesa **no tamanho real** (a tela avisa que é aproximado: a câmera do celular erra alguns milímetros ao medir a mesa), sem poder aumentar ou diminuir. Funciona sem aplicativo: no iPhone abre o AR da Apple (Quick Look), no Android o do Google (Scene Viewer).

**Regra de ouro:** o 3D tem que ser **do prato servido ali, na porção de verdade**, e a largura tem que ser **medida com régua**. Prato maior no 3D do que no prato é propaganda enganosa (Código de Defesa do Consumidor). Por isso o painel só salva com a medida em centímetros e a confirmação marcada.

Só a Growlift envia o 3D (Painel › Lojas › loja › Cardápio › abrir o item › **Prato em 3D**). O painel guarda quem enviou, quando e quem mediu (a Growlift no local ou o dono por vídeo). **Guardem a foto ou o vídeo da régua** fora do repositório (na pasta do cliente): é a prova se alguém reclamar que o prato veio menor.

Antes de colocar 3D num restaurante, a cláusula do 3D precisa estar no contrato ou no Termo de piloto (ver o Termo de piloto, cláusula 11).

## 1. Escanear no restaurante (o melhor jeito)

**Celular:** iPhone Pro com LiDAR (o 13 Pro e o 16 Pro Max servem). O iPhone 16 normal também escaneia por fotos, só demora mais.

**App:** Polycam ou KIRI Engine. Os dois exportam **GLB**, que é o arquivo que o painel aceita. O plano grátis pode limitar quantas exportações dá para fazer: confiram antes do dia.

**Como fazer:**

1. Peça o prato **montado como vai para o cliente**, na porção normal. Fotografe logo (queijo derretendo e molho escorrendo mudam rápido).
2. Coloque o prato numa mesa **de cor lisa e fosca** (toalha clara serve), longe de janela com sol direto. Luz clara e espalhada, sem sombra forte.
3. No app, use o modo de **fotos** (Photo mode / fotogrametria): dá mais detalhe que o modo LiDAR rápido.
4. Dê **três voltas** em volta do prato, devagar: uma baixa (quase na altura da mesa), uma no meio e uma de cima. Umas 60 a 100 fotos no total. Não mexa no prato durante as voltas.
5. Espere o app processar. Recorte a mesa em volta (deixe só o prato, ou o prato com a louça).
6. **Meça com régua** a maior medida do que ficou no 3D, vista de cima (com a louça, se ela ficou no 3D). Anote.
7. Exporte em **GLB** e mande para o computador.

**O que escaneia bem:** hambúrguer, pizza, porções, sobremesa de prato, bolo.
**O que escaneia mal:** bebida, copo, vidro, coisa brilhante ou transparente, sorvete derretendo, prato com muito vapor. Para esses, não usem 3D: fica a foto.

## 2. Por vídeo, quando a gente não vai ao restaurante

Peça ao dono um vídeo seguindo este roteiro (pode mandar assim pelo WhatsApp):

> Para colocar o prato em 3D no cardápio, a gente precisa de um vídeo dele:
> 1. Monte o prato como vai para o cliente, na porção normal.
> 2. Coloque numa mesa lisa, com luz clara, sem sol direto.
> 3. Grave dando três voltas devagar em volta do prato: uma baixa, uma no meio e uma de cima. Uns 40 segundos no total, sem mexer no prato.
> 4. No fim, coloque uma régua ao lado e meça a parte mais larga do prato (com a louça). Mande o vídeo, a medida e uma foto da régua ao lado do prato.

Depois, a Growlift transforma o vídeo em 3D no KIRI Engine (ele aceita vídeo) e exporta em GLB. **O vídeo não traz o tamanho:** quem decide a escala é a medida da régua que o dono mandou.

## 3. Colocar no painel

1. Painel › Lojas › loja › Cardápio › abra o item › **Prato em 3D** › **Enviar 3D (.glb)**. Use o computador, de preferência no Chrome.
2. O painel reduz o arquivo sozinho (o escaneamento chega com 10 a 60 MB e sai com menos de 4 MB). Se o arquivo já trouxer a medida (escaneado com LiDAR), ela aparece sugerida: **confira com a medida da régua**.
3. Escreva a **largura real em cm**, marque a confirmação e toque em **Salvar 3D**.
4. Toque em **Ver prévia** e gire o prato: ele precisa estar em pé (não deitado de lado) e inteiro.
5. **Salvar rascunho** e **Publicar**. Só depois disso o selo 3D aparece na mesa.

**Manter certo:** se o restaurante mudar a porção, a receita ou a louça, o 3D precisa ser refeito ou retirado. Confiram a cada 3 meses se o prato servido ainda bate com o 3D. **Retirar por reclamação:** Remover, Salvar rascunho e Publicar na hora (o Remover sozinho não tira da mesa).

Se der erro:
- "Exporte o GLB sem compressão Draco": no app, exporte de novo sem a opção Draco.
- "ficou com mais de 4 MB": exporte com qualidade média.
- Prato deitado ou torto na prévia: corrija a posição no app (girar o modelo) e exporte de novo.

## 4. Teste nos celulares antes de mostrar ao cliente

Com o cardápio da mesa aberto (leia o QR de uma mesa de teste):

- [ ] **iPhone:** o selo 3D aparece, o prato gira na tela, **Ver na minha mesa** abre a câmera e o prato fica do tamanho da régua (coloque a régua do lado e compare).
- [ ] **Android:** o mesmo teste. Em Android sem suporte a realidade aumentada, o Google abre o prato em 3D sem câmera: isso é normal.
- [ ] Tentar aumentar com dois dedos na câmera: **não pode** mudar de tamanho.
- [ ] Abrir pelo 4G, não só pelo Wi-Fi: o prato precisa abrir em poucos segundos.

## 5. O que dá para dizer na venda

O que dá para afirmar: num teste em restaurante de verdade (TU Delft, Holanda), os clientes acharam que o cardápio em 3D mostrava **melhor o prato e o tamanho da porção**, mas **o valor dos pedidos não subiu**. Outros números que circulam (como o estudo de Oxford sobre sobremesas) só aparecem em reportagens, sem o estudo original. Então:

- Pode dizer: "o cliente vê o prato em 3D, na mesa dele, em tamanho aproximado ao real, antes de pedir".
- Não diga: "aumenta as vendas em X%", nem que o 3D é idêntico ao prato ou que o cliente nunca vai se surpreender com o tamanho. Se o piloto medir algo, o número só vai para material público com autorização por escrito do restaurante (ver o Termo de piloto).

No painel, cada prato com 3D mostra quantas vezes foi aberto no mês, no 3D e na mesa (só a contagem, sem dado de ninguém). Serve para medir no piloto se o cliente usa.
