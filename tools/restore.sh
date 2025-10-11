#!/usr/bin/env bash

set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 path/to/backup.sql"
  exit 1
fi

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="${PROJECT_ROOT}/deploy/docker-compose.yml"
ENV_FILE="${PROJECT_ROOT}/deploy/.env"

SOURCE="$1"

# Allow passing just the file name if it exists inside backups/
if [[ ! -f "${SOURCE}" ]]; then
  CANDIDATE="${PROJECT_ROOT}/backups/${SOURCE}"
  if [[ -f "${CANDIDATE}" ]]; then
    SOURCE="${CANDIDATE}"
  else
    echo "Backup file not found: $1"
    exit 1
  fi
fi

echo "[restore] restoring from ${SOURCE}"

docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" exec -T postgres \
  psql -U asfp -d asfp < "${SOURCE}"

echo "[restore] done"
