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

commit_sha=$(git rev-parse HEAD)
echo "✅ Push effectué. Vercel se charge du déploiement automatique pour le commit ${commit_sha}."

if [ -z "${VERCEL_TOKEN:-}" ] || [ -z "${VERCEL_PROJECT_ID:-}" ]; then
  echo "⚠️  Variables VERCEL_TOKEN ou VERCEL_PROJECT_ID manquantes. Impossible de surveiller le déploiement."
  exit 0
fi

team_query=()
if [ -n "${VERCEL_ORG_ID:-}" ]; then
  team_query=(--data-urlencode "teamId=${VERCEL_ORG_ID}")
fi

max_attempts=${VERCEL_MONITOR_ATTEMPTS:-60}
sleep_seconds=${VERCEL_MONITOR_INTERVAL:-10}

echo "👀 Surveillance du déploiement Vercel..."

attempt=1
deployment_url=""

while [ "$attempt" -le "$max_attempts" ]; do
  if ! response=$(curl -sS --fail --get "https://api.vercel.com/v6/deployments" \
    -H "Authorization: Bearer ${VERCEL_TOKEN}" \
    --data-urlencode "projectId=${VERCEL_PROJECT_ID}" \
    --data-urlencode "limit=20" \
    "${team_query[@]}"); then
    echo "⚠️  Impossible de récupérer la liste des déploiements (tentative ${attempt}/${max_attempts})."
    sleep "$sleep_seconds"
    attempt=$((attempt + 1))
    continue
  fi

  deployment_json=$(
    API_RESPONSE="$response" COMMIT_SHA="$commit_sha" node <<'NODE'
const commit = process.env.COMMIT_SHA ? process.env.COMMIT_SHA.toLowerCase() : null;
const raw = process.env.API_RESPONSE ?? "";
let parsed;
try {
  parsed = JSON.parse(raw);
} catch {
  parsed = null;
}
const deployments = Array.isArray(parsed?.deployments) ? parsed.deployments : Array.isArray(parsed) ? parsed : [];
const normalize = (value) => (typeof value === "string" ? value.toLowerCase() : null);
const matchesCommit = (metaValue) => {
  const normalized = normalize(metaValue);
  if (!normalized || !commit) return false;
  if (normalized === commit) return true;
  return normalized.startsWith(commit.slice(0, 7));
};
const match = deployments.find((deployment) => {
  const meta = deployment?.meta ?? {};
  const candidates = [
    meta.gitCommitSha,
    meta.githubCommitSha,
    meta.gitlabCommitSha,
    meta.bitbucketCommitSha,
  ];
  return candidates.some(matchesCommit);
}) ?? deployments[0];

if (match) {
  process.stdout.write(JSON.stringify(match));
}
NODE
  )

  if [ -z "$deployment_json" ]; then
    echo "⏳ Déploiement non détecté pour l’instant (tentative ${attempt}/${max_attempts})."
    sleep "$sleep_seconds"
    attempt=$((attempt + 1))
    continue
  fi

  state=$(node -e "const dep = JSON.parse(process.argv[1]); process.stdout.write((dep.readyState || dep.state || dep.status || 'UNKNOWN').toUpperCase());" "$deployment_json")
  deployment_url=$(node -e "const dep = JSON.parse(process.argv[1]); process.stdout.write(dep.url || '');" "$deployment_json")

  if [ -n "$deployment_url" ]; then
    printf '📡  État du déploiement (%s): %s\n' "https://${deployment_url}" "$state"
  else
    printf '📡  État du déploiement: %s\n' "$state"
  fi

  case "$state" in
    READY|SUCCEEDED)
      echo "✅ Déploiement terminé avec succès."
      exit 0
      ;;
    ERROR|FAILED|CANCELED)
      echo "❌ Le déploiement a échoué."
      exit 1
      ;;
    *)
      sleep "$sleep_seconds"
      attempt=$((attempt + 1))
      ;;
  esac
done

echo "⚠️  Déploiement non prêt après ${max_attempts} tentatives."
if [ -n "$deployment_url" ]; then
  echo "ℹ️  Vérifie l’état détaillé avec : vercel inspect https://${deployment_url}"
fi
exit 1
