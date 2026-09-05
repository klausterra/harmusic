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

## Deploy automático
O workflow `.github/workflows/deploy-cloudflare-pages.yml` publica a branch `main` no projeto Cloudflare Pages `harmusic`.

Secrets no GitHub:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

## Documentação
- `docs/ARCHITECTURE.md`
- `docs/ROADMAP.md`
- `docs/CLOUDFLARE.md`
