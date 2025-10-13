#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "${ROOT}" || ! -d "${ROOT}" ]]; then
  echo "error: unable to determine repository root" >&2
  exit 1
fi

cd "${ROOT}"

COMPOSE_FILE="deploy/docker-compose.yml"
ENV_FILE="deploy/.env"

if [[ ! -f "${COMPOSE_FILE}" ]]; then
  echo "error: ${COMPOSE_FILE} not found; run from repository checkout" >&2
  exit 1
fi

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "error: ${ENV_FILE} not found; initialise environment via 'cp deploy/.env.example deploy/.env'" >&2
  exit 1
fi

# Load credentials from deploy/.env to reuse the same Postgres settings.
set -a
source "${ENV_FILE}"
set +a

BACKUP_DIR="${ROOT}/backups"
mkdir -p "${BACKUP_DIR}"

TIMESTAMP="$(date +"%Y%m%d_%H%M%S")"
FILENAME="asfp_${TIMESTAMP}.sql"
TARGET_PATH="${BACKUP_DIR}/${FILENAME}"

echo "[git-backup-sync] Dumping Postgres database to ${TARGET_PATH}"
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" exec -T postgres \
  sh -c 'export PGPASSWORD="${POSTGRES_PASSWORD}"; pg_dump -U "${POSTGRES_USER}" "${POSTGRES_DB}"' > "${TARGET_PATH}"

if [[ ! -s "${TARGET_PATH}" ]]; then
  echo "error: dump failed, removing ${TARGET_PATH}" >&2
  rm -f "${TARGET_PATH}"
  exit 1
fi

# Prune older dumps if GIT_BACKUP_KEEP count is set.
if [[ -n "${GIT_BACKUP_KEEP:-}" ]]; then
  echo "[git-backup-sync] Keeping the latest ${GIT_BACKUP_KEEP} dumps"
  ls -1t "${BACKUP_DIR}"/asfp_*.sql 2>/dev/null | tail -n +$((GIT_BACKUP_KEEP + 1)) | while read -r old_dump; do
    echo "[git-backup-sync] Removing old dump ${old_dump}"
    rm -f "${old_dump}"
  done
fi

git add -A "backups"
git status --short "backups" | grep -q . || {
  echo "[git-backup-sync] No new changes in backups/, exiting"
  exit 0
}

COMMIT_MESSAGE="${GIT_BACKUP_COMMIT_MESSAGE:-[backup] ${TIMESTAMP}}"

git commit -m "${COMMIT_MESSAGE}"

if [[ "${GIT_BACKUP_PUSH:-0}" == "1" ]]; then
  REMOTE="${GIT_BACKUP_REMOTE:-origin}"
  BRANCH="${GIT_BACKUP_BRANCH:-main}"
  echo "[git-backup-sync] Pushing to ${REMOTE} ${BRANCH}"
  git push "${REMOTE}" "${BRANCH}"
else
  echo "[git-backup-sync] Push skipped (set GIT_BACKUP_PUSH=1 to enable)"
fi
