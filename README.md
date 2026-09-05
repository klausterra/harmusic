# Harmusic

App interativo para aprender harmonia, escalas e progressões usando piano (MVP), com caminho para violão e baixo.

## URL de produção
`https://harmusic.hipercube.ia.br`

## Stack
React + TypeScript + Vite + Web Audio API + Cloudflare Pages.

## Rodar localmente
```bash
npm install
npm run dev
```

## Testes e build
```bash
npm test
npm run build
```

## Princípio de produto
O aluno deve aprender nesta sequência:

**ver o grau → ouvir → montar a progressão → encontrar no instrumento → tocar sem auxílio**

MVP atual: tom de **C maior**, progressão **I–IV–V–I**, instrumento **piano**.

## Publicar no GitHub
Repositório: `klausterra/harmusic`

```powershell
.\scripts\publish-github.ps1
```

```bash
bash scripts/publish-github.sh
```

## Deploy
Publicação via **Wrangler** (não usa GitHub Actions):

```powershell
npm run build
$env:CLOUDFLARE_ACCOUNT_ID = "47bd0ba5c9ea05229d4bbb67de2f0df1"
npx wrangler pages deploy dist --project-name=harmusic --branch=main
```

Detalhes em `docs/CLOUDFLARE.md`.

## Documentação
- `docs/ARCHITECTURE.md`
- `docs/ROADMAP.md`
- `docs/CLOUDFLARE.md`
