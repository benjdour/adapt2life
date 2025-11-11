#!/bin/bash
set -euo pipefail

if [ -f ".env.local" ]; then
  set -a
  # shellcheck source=/dev/null
  source .env.local
  set +a
fi

echo "🚀 Commit & push vers GitHub..."
git add -A
if git diff --cached --quiet; then
  echo "ℹ️  Aucun nouveau changement à commettre."
else
  git commit -m "🚀 Déploiement automatique"
fi

git push origin main

current_branch=$(git rev-parse --abbrev-ref HEAD)
commit_sha=$(git rev-parse --short HEAD)
echo "✅ Push effectué sur GitHub (${current_branch}@${commit_sha})."
