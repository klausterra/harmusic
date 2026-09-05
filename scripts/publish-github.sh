#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ ! -d .git ]]; then
  git init
  git branch -M main
fi

if ! git remote get-url origin >/dev/null 2>&1; then
  gh repo create klausterra/harmusic --public --source=. --remote=origin \
    --description "App interativo para aprender harmonia, escalas e progressões"
else
  echo "Remote origin já existe: $(git remote get-url origin)"
fi

git add -A
if [[ -n "$(git status --porcelain)" ]]; then
  git commit -m "feat: MVP Harmusic com pipeline pedagógico no piano"
fi

git push -u origin main
echo "OK — https://github.com/klausterra/harmusic"
