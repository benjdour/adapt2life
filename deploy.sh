#!/bin/bash
set -e

if [ -f ".env.local" ]; then
  set -a
  # shellcheck source=/dev/null
  source .env.local
  set +a
fi

if [ -z "${VERCEL_TOKEN:-}" ]; then
  echo "❌ VERCEL_TOKEN manquant. Ajoute-le à .env.local ou exporte la variable avant de déployer."
  exit 1
fi

echo "🚀 Commit & push vers GitHub..."
git add .
git commit -m "🚀 Déploiement automatique"
git push origin main

echo "🌐 Déploiement sur Vercel..."
DEPLOY_OUTPUT=$(vercel deploy --prod --yes --wait --token "$VERCEL_TOKEN" --timeout 10m)
echo "$DEPLOY_OUTPUT"

PRODUCTION_URL=$(echo "$DEPLOY_OUTPUT" | awk '/^Production:/ {print $2}' | tail -n 1)

if [ -z "$PRODUCTION_URL" ]; then
  echo "⚠️ Impossible de déterminer l’URL de production depuis la sortie de Vercel."
else
  echo "✅ Déploiement réussi : $PRODUCTION_URL"
fi
