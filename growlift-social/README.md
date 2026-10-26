# Growlift: presença nas redes sociais

Material para o Instagram e o WhatsApp Business da Growlift. Segue a mesma identidade do site (`growlift/`) e fica separado do código dele.

**Nada foi publicado nem configurado no Instagram ou no WhatsApp.** Tudo aqui está esperando a aprovação de vocês.

## O que tem em cada pasta

| Pasta | Conteúdo |
| --- | --- |
| `01-identidade/` | Sistema visual (`sistema-visual.png`) e guia de cores, tipografia, margens, ícones e tom de voz |
| `02-instagram-perfil/` | Foto de perfil e textos do perfil: nome, @, bio conferida, categoria, link e contato |
| `03-destaques/` | Capas (direção A escolhida, B de registro) e stories de Projetos (6), Serviços (6) e Contato (2), mais o modelo de Clientes **sem publicar** |
| `04-posts-fixados/` | Três carrosséis prontos (Quem somos, Portfólio, Serviços), com legendas e ordem para fixar |
| `05-reels/` | Os 8 Reels prontos em vídeo (MP4 vertical, com capa), com roteiro e legenda de cada um |
| `06-whatsapp-business/` | Perfil, saudação, ausência, 8 respostas rápidas, etiquetas e guia de conversa (Chris Voss) |
| `07-planejamento/` | Pilares, ritmo, calendário de 4 semanas e o que medir |
| `08-prompts/` | Prompts das imagens e do vídeo do site, e um modelo para pedir conteúdo novo |
| `_fonte/` | Gerador das peças, modelos editáveis em HTML e imagens de origem |

São 58 imagens em PNG no tamanho do Instagram e 8 Reels em MP4.

## No painel

Tudo daqui aparece no painel das lojas, na aba **Conteúdos** (https://painel-lojas-sportelo.vercel.app/painel/conteudos), com o mesmo login de vocês. Lá dá para ver as peças, baixar uma a uma ou o destaque inteiro em .zip, copiar as legendas e as respostas com um toque, e marcar cada peça como **Para aprovar**, **Aprovado** ou **Postado**.

O painel lê esta pasta toda vez que é publicado. Para entrar uma peça nova, basta ela estar numa pasta `NN-nome/` aqui: imagens viram galeria, arquivos `.md` viram texto com botão de copiar.

## Pendente (precisa de vocês)

1. **Clientes:** o destaque só entra com o primeiro cliente real, com depoimento autorizado por escrito.

**Já decidido:**
- WhatsApp comercial: (11) 99446-3234 (botão no topo do site e story de contato).
- Fidelidade: 6 meses no Start e no Grow, 4 meses no Lift.
- Site no ar em https://growlift.com.br (desde 26/10/2026): link da bio e posts liberados.
- Instagram **@growlift.ai**.
- Alterações por mês: Grow 2 e Lift 4.
- Site no ar em até 7 dias úteis depois do material, como no contrato.
- WhatsApp sempre aberto, com mensagem automática que se identifica como automática.

## Regras que seguimos

- Portfólio verdadeiro: só os projetos conceito (identificados como tal) e o site da Growlift. Os sites feitos para marcas reais ficaram de fora, porque eram demonstrações sem autorização.
- Nenhum depoimento, cliente ou resultado inventado.
- Nenhum preço nem prazo que não esteja confirmado no site ou no contrato.
- WhatsApp só para quem escreveu ou autorizou. Nada de envio em massa nem robô fingindo ser pessoa.

## Gerar de novo

```
node growlift-social/_fonte/gerar.mjs
node growlift-social/_fonte/reels/gerar-reels.mjs      # os Reels (ou só alguns: ... gerar-reels.mjs 3 7)
```

O Reel 8 sobe o painel (`plataforma/`) nesta máquina, com uma loja de demonstração; rode `npm run build` em `plataforma/` antes.

Para conferir as capas no tamanho real do perfil:

```
node growlift-social/_fonte/simular-perfil.mjs growlift-social/03-destaques/capas/direcao-A saida.png
```
