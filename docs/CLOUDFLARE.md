# Cloudflare — Harmusic

## Projeto Pages
- Nome sugerido: `harmusic`
- Build command: `npm run build`
- Output directory: `dist`
- Branch de produção: `main`

## Domínio
1. Custom domain no Pages: `harmusic.hipercube.ia.br` (já solicitado via API).
2. DNS na zona `hipercube.ia.br` (token atual sem permissão DNS Edit):

```text
Type  Name       Target               Proxy
CNAME harmusic   harmusic.pages.dev   Proxied
```

Sem esse CNAME a verificação fica `pending` / "CNAME record not set".

## Secrets no GitHub Actions
| Secret | Uso |
|--------|-----|
| `CLOUDFLARE_API_TOKEN` | Token com permissão Pages Edit |
| `CLOUDFLARE_ACCOUNT_ID` | Account ID da conta Hipercube |

Account ID conhecido (Hipercube): `47bd0ba5c9ea05229d4bbb67de2f0df1` — pode ir no secret ou, se a política do time permitir, no workflow.

## Deploy manual (Wrangler)
```bash
npx wrangler pages deploy dist --project-name=harmusic
```

Requer `CLOUDFLARE_API_TOKEN` no ambiente.

## CI
Arquivo: `.github/workflows/deploy-cloudflare-pages.yml`  
Disparo: push em `main` e `workflow_dispatch`.
