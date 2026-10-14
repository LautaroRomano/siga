#!/usr/bin/env bash
# Prepara el entorno local y levanta la app en http://localhost:3000
set -euo pipefail
cd "$(dirname "$0")/.."

local_db="postgresql://app:app@localhost:5432/app"

if [ ! -f .env ]; then
  cat > .env <<ENV
DATABASE_URL="$local_db"
DIRECT_URL="$local_db"
BETTER_AUTH_SECRET="$(openssl rand -base64 32)"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
CRON_SECRET="$(openssl rand -hex 32)"
ENV
  echo ".env creado con valores locales. Google, Resend y storage quedan sin configurar: ver .env.example"
fi

pnpm install

db_ready() { command -v pg_isready >/dev/null && pg_isready -h localhost -p 5432 -q; }
if ! db_ready; then
  docker compose up -d
  until db_ready; do sleep 1; done
fi

pnpm db:generate
pnpm db:deploy
pnpm db:seed
pnpm dev
