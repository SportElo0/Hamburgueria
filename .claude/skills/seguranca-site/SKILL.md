---
name: seguranca-site
description: Verificação de segurança de sites e painéis (sites estáticos de clientes, site da Growlift, o painel das lojas com pedidos, Pix e dados pessoais). Use quando pedirem para ver a "proteção do site", se o site é seguro, se tem brecha, antes de publicar um site ou uma rota nova, ou depois de mexer em formulário, login, pagamento ou dados de cliente. Cobre cabeçalhos HTTP, HTTPS, formulários e rotas públicas, autenticação e sessões, segredos no código, dados pessoais, dependências e abuso (spam, robôs).
---

# Verificação de segurança de site

Você procura falhas que possam vazar dados, deixar alguém mexer no que não devia, derrubar o site ou sujar a reputação do domínio. Trabalhe **só em sites e sistemas do próprio usuário** (os do repositório e os publicados por ele). Não ataque nada: as checagens no ar são leituras normais (abrir a página, ler cabeçalhos), nunca testes de invasão, força bruta ou carga.

## Como trabalhar

1. **Mapeie o que existe:** páginas, formulários, rotas de API (principalmente as públicas), login, uploads, pagamentos, onde os dados ficam guardados, variáveis de ambiente e serviços de terceiros.
2. **Leia o código** das partes que recebem dados de fora (formulários, rotas `/api`, webhooks) e das que decidem quem pode ver o quê.
3. **Confira o site publicado** com leituras simples: `curl -sI <url>` para os cabeçalhos, a página em HTTPS, o redirecionamento de HTTP para HTTPS.
4. **Passe pelas checagens abaixo.** Para cada falha: onde está, o que alguém conseguiria fazer (o caminho concreto), a gravidade e a correção mínima. Se não achar um caminho realista de ataque, não é falha: no máximo uma melhoria.
5. **Corrija só se pedirem.** Quando corrigir: menor mudança possível, teste antes e depois, e não quebre o que funciona.
6. **Entregue o relatório** no formato do final.

Gravidade:
- **Crítica:** vazamento de dados pessoais ou de pagamento, acesso de terceiros ao painel, segredo exposto, execução de código.
- **Alta:** alguém consegue alterar dados de outro, burlar pagamento, injetar script (XSS), enviar spam em nome do site.
- **Média:** falta de cabeçalho de proteção relevante, rota pública sem limite contra abuso, mensagens de erro que revelam detalhes internos.
- **Baixa:** boas práticas.

## Checagens

### 1. Transporte e cabeçalhos
- HTTPS em tudo; HTTP redireciona para HTTPS; `Strict-Transport-Security` no domínio próprio.
- `Content-Security-Policy` (ao menos `default-src 'self'`, liberando só o necessário: fontes, scripts e APIs usadas; `frame-ancestors 'none'` ou `'self'`; `form-action`).
- `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` desligando câmera, microfone e geolocalização quando não usados.
- Em site estático na Vercel, os cabeçalhos vão num `vercel.json` (`headers`); em Next.js, em `next.config` ou no proxy/middleware.

### 2. Formulários e rotas públicas
- Validação **no servidor** (tipo, tamanho, formato), nunca só no navegador.
- Limite de tamanho do corpo da requisição.
- Proteção contra robôs: campo isca (honeypot), limite por dia e por IP, e, se o abuso aparecer, CAPTCHA.
- CORS: liberar só as origens que precisam, quando a rota não é para o mundo todo.
- Mensagens de erro sem detalhes internos (pilha, caminhos, nomes de tabela).
- Nenhuma rota pública devolve dados de outras pessoas (pedido, cliente, telefone) sem um segredo que só o dono tem (token).

### 3. Login, sessões e permissões
- Senhas com hash forte (PBKDF2, bcrypt, scrypt ou Argon2) e comparação em tempo constante.
- Cookie de sessão `HttpOnly`, `Secure`, `SameSite=Lax` ou `Strict`, assinado, com validade.
- Toda ação de servidor e rota de API confere a sessão **e** a permissão (a loja A não pode mexer na loja B).
- Login não revela se o e-mail existe; limite de tentativas.

### 4. Injeção e XSS
- Nada de `dangerouslySetInnerHTML`, `innerHTML` ou `eval` com dado vindo de fora.
- Links montados com dado do usuário (`wa.me`, `mailto`, URLs) usam `encodeURIComponent` e só esquemas esperados (`https:`, `mailto:`), nunca `javascript:`.
- Uploads: tipo e tamanho conferidos; servidos com o `Content-Type` certo.

### 5. Segredos e configuração
- Nenhuma chave, token ou senha no código ou no repositório (`git log -p` também). Procure: `sk-`, `APP_USR-`, `TEST-`, `token`, `secret`, `password`, `BEGIN PRIVATE KEY`.
- Segredos só em variáveis de ambiente do servidor; variáveis `NEXT_PUBLIC_*` são públicas.
- `.env*` no `.gitignore`.

### 6. Dados pessoais
- Guardados em armazenamento privado, nunca em arquivo público ou bucket aberto.
- Só a equipe autorizada vê; o painel exige login.
- Guardar o mínimo; prazo para apagar.
- Logs sem telefone, e-mail ou dados de pagamento completos.

### 7. Pagamentos (Pix, Mercado Pago)
- O valor é calculado no servidor a partir do cardápio publicado, nunca aceito do navegador.
- Confirmação de pagamento só pelo provedor (consulta à API ou webhook verificado), nunca pela palavra do navegador.
- Token do provedor só no servidor.

### 8. Dependências e terceiros
- `npm audit --omit=dev` nas pastas com `package.json`; atualizar o que for crítico.
- Scripts de terceiros só de CDNs confiáveis e com versão fixa.

### 9. Domínio e e-mail (quando houver domínio próprio)
- SPF, DKIM e DMARC configurados para o domínio que envia e-mail.
- Bloqueio de transferência do domínio e renovação automática.

## Formato do relatório

```
# Segurança: <site ou sistema>
Data: <data> · O que foi olhado: <código, site publicado, rotas...>

## Resumo
<2 a 4 linhas: está seguro para publicar? o que corrigir antes?>

## Falhas
### [CRÍTICA] <título>
- Onde: <arquivo:linha ou URL>
- O que alguém conseguiria fazer: <caminho concreto>
- Correção: <mudança mínima>

### [ALTA] ... / [MÉDIA] ... / [BAIXA] ...

## Está ok
- <checagens feitas e sem problema, uma linha cada>
```

Escreva em português simples: o leitor é o dono do negócio, não um especialista em segurança.
