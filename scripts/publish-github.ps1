# Publica o repositório local em klausterra/harmusic e faz push da main.
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

if (-not (Test-Path .git)) {
  git init
  git branch -M main
}

$remote = git remote get-url origin 2>$null
if (-not $remote) {
  gh repo create klausterra/harmusic --public --source=. --remote=origin --description "App interativo para aprender harmonia, escalas e progressões"
} else {
  Write-Host "Remote origin já existe: $remote"
}

git add -A
$status = git status --porcelain
if ($status) {
  git commit -m "feat: MVP Harmusic com pipeline pedagógico no piano"
}

git push -u origin main
Write-Host "OK — https://github.com/klausterra/harmusic"
