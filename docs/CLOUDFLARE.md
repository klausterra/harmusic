# Cloudflare — Harmusic

## Projeto Pages
- Nome: `harmusic`
- Build local: `npm run build`
- Output: `dist`
- Produção: `https://harmusic.pages.dev` · custom `https://harmusic.hipercube.ia.br`

## Deploy (Wrangler — sem GitHub Actions)

```powershell
npm run build
$env:CLOUDFLARE_ACCOUNT_ID = "47bd0ba5c9ea05229d4bbb67de2f0df1"
npx wrangler pages deploy dist --project-name=harmusic --branch=main
```

Requer `CLOUDFLARE_API_TOKEN` no ambiente (permissão Pages Edit).

## Domínio
1. Custom domain no Pages: `harmusic.hipercube.ia.br`
2. DNS na zona `hipercube.ia.br`:

```text
Type  Name       Target               Proxy
CNAME harmusic   harmusic.pages.dev   Proxied
```

Sem esse CNAME a verificação fica `pending` / "CNAME record not set".

## Account
Account ID (Hipercube): `47bd0ba5c9ea05229d4bbb67de2f0df1`
