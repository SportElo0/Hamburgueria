# Growlift: presença nas redes sociais

Material para o Instagram e o WhatsApp Business da Growlift. Segue a mesma identidade do site (`growlift/`) e fica separado do código dele.

**Nada foi publicado nem configurado no Instagram ou no WhatsApp.** Tudo aqui está esperando a aprovação de vocês.

## O que tem em cada pasta

| Pasta | Conteúdo |
| --- | --- |
| `01-identidade/` | Sistema visual (`sistema-visual.png`) e guia de cores, tipografia, margens, ícones e tom de voz |
| `02-instagram-perfil/` | Foto de perfil e textos do perfil: nome, @, bio conferida, categoria, link e contato |
| `03-destaques/` | Capas (direção A escolhida, B de registro) e stories de Projetos (6), Serviços (6), Design (4), Processo (6) e Contato (2), mais o modelo de Clientes **sem publicar** |
| `04-posts-fixados/` | Três carrosséis prontos (Quem somos, Portfólio, Serviços), com legendas e ordem para fixar |
| `05-reels/` | Oito roteiros, com gancho, demonstração, explicação e chamada |
| `06-whatsapp-business/` | Perfil, saudação, ausência, 8 respostas rápidas, etiquetas e guia de conversa (Chris Voss) |
| `07-planejamento/` | Pilares, ritmo, calendário de 4 semanas e o que medir |
| `_fonte/` | Gerador das peças, modelos editáveis em HTML e imagens de origem |

São 58 imagens em PNG no tamanho do Instagram.

## Pendente (precisa de vocês)

1. **Escolher o @:** @growlift.ai, que está no site, ou @growlift.agencia, que é a preferência do briefing. Conferir no app se está livre. O rodapé do site tem que usar o mesmo.
2. **WhatsApp comercial:** número e horário real de atendimento. Com isso eu gero o story de contato do WhatsApp e completo o perfil.
3. **Domínio growlift.com.br funcionando:** antes de pôr o link na bio e publicar os posts.
4. **Contrato:** confirmar quantas alterações por mês têm o Grow e o Lift (hoje 2 e 4) e o prazo de criação, antes de usar as respostas rápidas que falam disso.
5. **Clientes:** o destaque só entra com o primeiro cliente real, com depoimento autorizado por escrito.
6. **Loja de demonstração genérica:** para o Reel do pedido com Pix. Posso montar quando quiserem.

## Regras que seguimos

- Portfólio verdadeiro: só os projetos conceito (identificados como tal) e o site da Growlift. Os sites feitos para marcas reais ficaram de fora, porque eram demonstrações sem autorização.
- Nenhum depoimento, cliente ou resultado inventado.
- Nenhum preço nem prazo que não esteja confirmado no site ou no contrato.
- WhatsApp só para quem escreveu ou autorizou. Nada de envio em massa nem robô fingindo ser pessoa.

## Gerar de novo

```
node growlift-social/_fonte/gerar.mjs
```

Para conferir as capas no tamanho real do perfil:

```
node growlift-social/_fonte/simular-perfil.mjs growlift-social/03-destaques/capas/direcao-A saida.png
```
