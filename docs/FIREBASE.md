# Firebase — Harmusic

## Projeto
- GCP/Firebase: `empreenderia` (billing ativo; Google Auth já configurado)
- App web: **Harmusic** (`1:761731202727:web:cf76a2ab7539de7ae76582`)
- Tentativa em `hipercube-500101`: Firebase criado, mas Identity Platform exigiu billing; Auth clássico inicializado lá — **app de produção usa `empreenderia`**.

## Admin
- E-mail administrador: `klausqterra@gmail.com`
- Checagem no cliente: `src/config/firebase.public.ts` → `isAdminEmail`
- Rota Admin só aparece para esse e-mail

## Auth
- Provider: **Google** (popup)
- Domínios autorizados incluem: `localhost`, `harmusic.pages.dev`, `harmusic.hipercube.ia.br`

## Config pública
Arquivo: `src/config/firebase.public.ts` (apiKey web não é segredo; domínio + regras protegem).
