# Direitos das imagens e da fonte

De onde vem cada imagem do site da Growlift (`growlift/`) e por que podemos usá-la. Atualizem esta lista sempre que entrar uma imagem nova.

| Arquivo | O que é | Origem | Pode usar porque |
| --- | --- | --- | --- |
| `img/hero.webp` | Fundo da capa (a marca em vidro azul) | Gerada pela Growlift no Higgsfield (`gpt_image_2_5`), prompt em `08-prompts/prompts.md` | Criada por nós. Confiram nos termos do plano do Higgsfield que o uso comercial está liberado no plano assinado |
| `img/hero.webm`, `img/hero.mp4` | Vídeo da capa | Gerado pela Growlift no Higgsfield (`kling4_0`) a partir da imagem acima | Idem |
| `_fonte/assets/hd/marca-vidro-vertical.png` | A marca em vidro azul, na vertical (fundo dos stories) | Gerada pela Growlift no Higgsfield (`gpt_image_2_5`, 2k, qualidade alta) com `img/hero.webp` como referência; prompt em `08-prompts/prompts.md` | Idem |
| `_fonte/assets/hd/*.png` (sites) | Telas dos modelos e do site da Growlift em alta definição | Capturadas de `tools/growlift-models/` e de growlift.com.br | Feitas por nós |
| `img/lift/d/*`, `img/lift/m/*` | Animação da marca se montando | Renderizada em código (three.js) pela Growlift, `tools/growlift-scene/` | Feita por nós, do zero |
| `img/site-*.webp` | Telas dos 4 modelos | Sites conceito montados pela Growlift (`tools/growlift-models/`). Nomes fictícios | Feitas por nós. As fotos de comida, varanda e escritório dentro deles foram geradas no Higgsfield (prompts em `08-prompts/prompts.md`); nenhuma foto de banco de imagem nem de marca real |
| `img/time/lucas.webp` | Foto do Lucas | Foto enviada pelo próprio Lucas, tratada pela Growlift | Lucas é maior de idade e autorizou |
| `img/time/antonio.webp` | Foto do Antônio | Foto enviada pelo próprio Antônio, tratada pela Growlift | Antônio é menor; autorização da mãe, Beatriz, por e-mail. **Guardem esse e-mail.** Se a autorização for retirada, a foto sai do site, do Reel 7, do carrossel Quem somos e do story Contato 02 |
| `_fonte/reel-premium/v2/assets/*` e o Reel 9 | Telas dos projetos conceito Salinho, Chapa 77, Swell Club e Fornada | Capturadas e gravadas dos sites que a Growlift criou como demonstração. Nomes, logos e endereços trocados na página antes da captura (`_fonte/reel-premium/anonimizar.mjs`) | Design, textos e imagens são da Growlift (as fotos dos sites foram geradas por IA). Ficaram de fora a foto do dono da Swell Club, a fachada e a avaliação de cliente, a foto do casal da Fornada e as marcas de bebida do cardápio. Sempre com a etiqueta "Projeto conceito · nome fictício" |
| `_fonte/reel-premium/v2/assets/swellclub/foto-generica/surfista-generico.png` | Surfista genérico, de costas, sem rosto | Gerado pela Growlift no Higgsfield (`gpt_image_2_5`, 2k, qualidade alta, 2,75 créditos); prompt em `08-prompts/prompts.md` | Criado por nós, de uma pessoa que não existe. Substitui a foto do dono da loja só na captura |
| `favicon.svg` e a marca | Símbolo da Growlift | Marca da própria Growlift | Nossa |
| `fonts/inter-*.woff2` | Fonte Inter | Projeto Inter (rsms/inter), via Fontsource | Licença SIL Open Font License 1.1, que permite uso comercial; a licença vai junto em `fonts/OFL.txt` |

## Regras para imagens novas

- Só imagens criadas por vocês, geradas por vocês (guardando o prompt) ou com licença comercial clara (guardem o link da licença aqui).
- Nada de print de site de cliente real sem autorização por escrito do dono da marca.
- Foto de pessoa só com autorização. Menor de idade, com autorização do responsável por escrito.
- Nada de imagem do Google, Pinterest ou Instagram de terceiros.
