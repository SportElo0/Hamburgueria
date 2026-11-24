# Giancarlo Guglielmi · Sociedade Individual de Advocacia (demonstração)

Site de apresentação montado pela Growlift a partir do manual de marca que o Dr. Odair enviou, para mostrar ao Dr. Giancarlo. **Demonstração não oficial:** faixa no topo, fora do Google (`noindex` no HTML, no cabeçalho da Vercel e no `robots.txt`), textos e áreas marcados "a confirmar".

- **Visual:** cores e letras do manual (bordô e vermelho fechado, dourado suave, off-white, preto). Títulos em Cinzel (a mais próxima do nome no logo) e textos em Montserrat (subtítulos do manual), em `fonts/` (licença SIL OFL).
- **Logo:** recortado do PDF do manual (é uma imagem só, sem vetor) em `img/monograma.png`, `img/nome.png` e `img/subtitulo.png`, usados como máscara e pintados com as cores do site. Trocar pelos arquivos originais do designer quando chegarem.
- **Foto:** a da capa é a do manual (é dele), desfocada como no próprio manual. Para a seção "O escritório" falta uma foto nítida.
- **Animações:** GSAP 3.13 com ScrollTrigger e SplitText e rolagem suave com Lenis (`vendor/`). Capa com entrada por linhas e parallax; coluna que se monta enquanto os 6 princípios do manual acendem (seção presa); retrato que se abre; áreas em rolagem lateral presa no computador; linha do atendimento que se desenha; selo que gira. Quem pede menos movimento vê tudo parado.
- **Falta para a versão oficial:** áreas de atuação (cada uma vira página), número da OAB e registro da sociedade, cidade, WhatsApp e e-mail, foto nítida, aprovação dos textos e revisão pelas regras da OAB (Provimento 205/2021). Depois: tirar a faixa e o `noindex`.
- **Revisão legal (24/11) aplicada:** títulos descritivos, sem autoelogio (os pilares do manual viraram "Análise técnica", "Clareza nos caminhos" e "Atenção ao cliente" no lugar de "Solidez e competência", "Sensatez e estratégia" e "Excelência e valor"; dá para voltar aos nomes do manual se ele quiser, avaliando as regras da OAB); faixa e rodapé dizem que a demonstração é da Growlift, sem aprovação dele.
- **Antes de mandar o link:** só para o Dr. Odair e o Dr. Giancarlo (o `noindex` não esconde o link). Pedir por escrito o ok para usar a foto do manual e confirmar que o designer autoriza adaptar o logo.
- **Sem build:** é HTML, CSS e JS estáticos. Para ver: `python3 -m http.server` nesta pasta.
