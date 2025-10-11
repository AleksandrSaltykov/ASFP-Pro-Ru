#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="${PROJECT_ROOT}/deploy/docker-compose.yml"
ENV_FILE="${PROJECT_ROOT}/deploy/.env"
OUT_DIR="${PROJECT_ROOT}/backups"
TIMESTAMP="$(date +"%Y%m%d_%H%M%S")"
BACKUP_PATH="${OUT_DIR}/asfp_${TIMESTAMP}.sql"

mkdir -p "${OUT_DIR}"

echo "[backup] writing dump to ${BACKUP_PATH}"

docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" exec -T postgres \
  pg_dump -U asfp -d asfp > "${BACKUP_PATH}"

echo "[backup] done"
