#!/bin/bash
set -e

echo "🚀 Commit & push vers GitHub..."
git add .
git commit -m "🚀 Déploiement automatique"
git push origin main

echo "🌐 Déploiement sur Vercel..."
DEPLOY_URL=$(vercel deploy --prod --confirm --token $VERCEL_TOKEN)

echo "🕵️ Surveillance du déploiement..."
DEPLOY_ID=$(vercel inspect $DEPLOY_URL --token $VERCEL_TOKEN | grep "Deployment ID" | awk '{print $3}')

STATUS="BUILDING"
while [ "$STATUS" == "BUILDING" ] || [ "$STATUS" == "QUEUED" ]; do
  STATUS=$(vercel inspect $DEPLOY_ID --token $VERCEL_TOKEN | grep "State" | awk '{print $2}')
  echo "⏳ État du déploiement : $STATUS"
  sleep 10
done

if [ "$STATUS" == "READY" ]; then
  echo "✅ Déploiement réussi : $DEPLOY_URL"
else
  echo "❌ Échec du déploiement : état = $STATUS"
fi