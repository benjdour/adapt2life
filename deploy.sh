#!/bin/bash
set -e

if [ -f ".env.local" ]; then
  set -a
  # shellcheck source=/dev/null
  source .env.local
  set +a
fi

echo "🚀 Commit & push vers GitHub..."
git add .
git commit -m "🚀 Déploiement automatique"
git push origin main

echo "✅ Push effectué. Vercel se charge du déploiement automatique."
