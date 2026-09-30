# Propostas A+

Portal de projetos e propostas da **A+.com Engenharia e Tecnologia**. Um único
endereço reúne todas as propostas, o painel para preencher valores e os links
de acesso enviados aos clientes.

## O que tem

| Endereço | Para quem | O que faz |
| --- | --- | --- |
| `/` | equipe (senha) | Lista das propostas por cliente, com status, total e links ativos |
| `/#/<slug>` | equipe | Painel: dados, materiais, serviços, resumo e links de cliente |
| `/p/<slug>/` | equipe | A proposta como o cliente vê |
| `/s/<token>/` | cliente | Só aquela proposta, sem senha, até o link ser excluído ou expirar |

Propostas cadastradas:

- **Binatural · Formosa, GO** e **Binatural · Bahia**: apresentação técnica e
  proposta comercial do cluster Proxmox VE, em um deck só. As duas usam o mesmo
  modelo (`propostas/binatural-cluster/proposta.html`) e mudam só os dados.
- **UFV Samambaia · CFTV térmico de perímetro**: apresentação hospedada como
  está, sem campos editáveis.

## Painel de valores

Cada item de materiais e serviços tem **custo**, **margem** e **preço**. Custo
com margem (ou a margem padrão da aba Dados) gera o preço sugerido; digitar um
preço substitui o cálculo. Totais e valores por extenso são calculados sozinhos.

- Custo, margem e referências **nunca** saem para o cliente: `api/dados.js`
  entrega só o que aparece na proposta.
- Enquanto faltar preço em algum item, a proposta mostra `R$ ______` naquele total.
- “Mostrar o valor de cada item” liga as colunas de preço nas tabelas do deck.
- Salvou, a proposta já muda. Não precisa de novo deploy.

## Links de cliente

Na aba **Links de cliente** de cada proposta: informe para quem é o link e, se
quiser, em quantos dias expira. O link é copiado na hora. A lista mostra
acessos e último acesso, e **Excluir** corta o acesso imediatamente.

## Como funciona

- `middleware.js` roda antes de qualquer arquivo (Vercel Edge Middleware).
  Sem login, nada sai do servidor além de `/pub/` e dos links de cliente
  válidos. `/p/` e `/s/` são reescritos para a pasta da proposta.
- `lib/registro.js` cadastra as propostas e define os campos e itens editáveis.
- `lib/calc.js` calcula preços, totais e extenso, e gera a visão do cliente.
- `lib/store.js` guarda dados e links no Redis (Upstash) pela API REST.
- `api/admin.js` é a API do painel; `api/dados.js`, os dados de cada proposta.
- A página da proposta busca `dados.json` e preenche os elementos `data-f`,
  `data-lista`, `data-t` e `data-x`.

## Publicação na Vercel

1. Importar o repositório na Vercel com o preset **Other**, sem comando de build.
2. Em **Storage**, adicionar **Upstash for Redis** (Marketplace) e conectar ao
   projeto. Ele cria `KV_REST_API_URL` e `KV_REST_API_TOKEN`.
3. Em **Settings › Environment Variables**, nos três ambientes:

| Variável | Conteúdo |
| --- | --- |
| `SITE_PASSWORD` | senha da equipe |
| `AUTH_SECRET` | string aleatória longa, só para assinar o cookie |

4. Refazer o deploy depois de criar as variáveis.

Sem Redis, o portal funciona mas guarda tudo em memória e avisa no topo do painel.
Trocar `AUTH_SECRET` derruba todas as sessões da equipe (links de cliente continuam).

## Uso local

```bash
npm run dev                 # http://localhost:3000, pede a senha
DEV_LOGADO=1 npm run dev    # entra direto como equipe
```

Sem as variáveis do Redis, os dados ficam em memória enquanto o servidor roda.

## Nova proposta

1. Criar a pasta em `propostas/<pasta>/` com o HTML e as imagens (caminhos relativos).
2. Cadastrar em `lib/registro.js` com `slug`, `cliente`, `titulo`, `pasta` e `pagina`.
3. Para ter valores editáveis, definir `modelo` (campos e listas) e marcar o HTML
   com `data-f`, `data-lista`, `data-t` e `data-x`, como no modelo da Binatural.
