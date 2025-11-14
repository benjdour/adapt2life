#!/bin/bash
set -euo pipefail

if [ -f ".env.local" ]; then
  set -a
  # shellcheck source=/dev/null
  source .env.local
  set +a
fi

determine_scope() {
  local docs=0
  local tests=0
  local app=0
  local config=0

  for file in "$@"; do
    case "$file" in
      docs/*|README.*|design/*)
        docs=1
        ;;
      tests/*)
        tests=1
        ;;
      app/*|src/*|components/*|lib/*|db/*)
        app=1
        ;;
      package.json|package-lock.json|tsconfig.*|*.config.*|*.rc|next.config.ts|tailwind.config.*|postcss.config.*|drizzle.config.ts|vitest.config.ts|vitest.setup.ts|eslint.config.*|proxy.ts|deploy.sh|scripts/*)
        config=1
        ;;
    esac
  done

  if (( docs == 1 && tests == 0 && app == 0 && config == 0 )); then
    echo "docs"
  elif (( tests == 1 && docs == 0 && app == 0 && config == 0 )); then
    echo "test"
  elif (( app == 1 )); then
    echo "feat"
  elif (( config == 1 )); then
    echo "build"
  else
    echo "chore"
  fi
}

build_description() {
  local files=("$@")
  local count=${#files[@]}

  if (( count == 1 )); then
    echo "mettre à jour ${files[0]}"
    return
  fi

  if (( count == 2 )); then
    echo "mettre à jour ${files[0]} et ${files[1]}"
    return
  fi

  if (( count == 3 )); then
    echo "mettre à jour ${files[0]}, ${files[1]} et ${files[2]}"
    return
  fi

  local remaining=$((count - 2))
  local autre_suffix=""
  local fichier_suffix=""
  if (( remaining > 1 )); then
    autre_suffix="s"
    fichier_suffix="s"
  fi

  echo "mettre à jour ${files[0]}, ${files[1]} et ${remaining} autre${autre_suffix} fichier${fichier_suffix}"
}

gather_staged_files() {
  local file
  staged_files=()
  while IFS= read -r file; do
    if [[ -n "$file" ]]; then
      staged_files+=("$file")
    fi
  done < <(git diff --cached --name-only)
}

echo "🚀 Commit & push vers GitHub..."
git add -A
if git diff --cached --quiet; then
  echo "ℹ️  Aucun nouveau changement à commettre."
else
  gather_staged_files
  scope=$(determine_scope "${staged_files[@]}")
  description=$(build_description "${staged_files[@]}")
  commit_message="${scope}: ${description}"
  echo "📝 Commit message : ${commit_message}"
  git commit -m "${commit_message}"
fi

git push origin main

current_branch=$(git rev-parse --abbrev-ref HEAD)
commit_sha=$(git rev-parse --short HEAD)
echo "✅ Push effectué sur GitHub (${current_branch}@${commit_sha})."
