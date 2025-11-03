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
DEPLOY_OUTPUT=$(vercel deploy --prod --yes --token "$VERCEL_TOKEN")
echo "$DEPLOY_OUTPUT"

CLEAN_OUTPUT=$(printf '%s\n' "$DEPLOY_OUTPUT" | sed -E 's/\x1B\[[0-9;]*m//g')

PRODUCTION_URL=$(printf '%s\n' "$CLEAN_OUTPUT" | awk '/^Production:/ {print $2}' | tail -n 1)

if [ -z "$PRODUCTION_URL" ]; then
  PRODUCTION_URL=$(printf '%s\n' "$CLEAN_OUTPUT" | grep -Eo 'https://[a-z0-9.-]+\.vercel\.app' | tail -n 1)
fi

if [ -z "$PRODUCTION_URL" ]; then
  echo "⚠️ Impossible de déterminer l’URL de production depuis la sortie de Vercel."
  exit 1
fi

echo "🕵️ Surveillance du déploiement..."
INSPECT_OUTPUT=$(vercel inspect "$PRODUCTION_URL" --token "$VERCEL_TOKEN" --wait --timeout 10m)
echo "$INSPECT_OUTPUT"

STATUS=$(printf '%s\n' "$INSPECT_OUTPUT" | awk '/^\s+status/ {print $3}')

if [ "$STATUS" == "Ready" ]; then
  echo "✅ Déploiement réussi : $PRODUCTION_URL"
else
  echo "❌ Échec du déploiement : état = ${STATUS:-Inconnu}"
  exit 1
fi
