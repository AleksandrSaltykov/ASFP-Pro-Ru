#!/bin/sh
set -eu

HOST="${POSTGRES_HOST:-postgres}"
PORT="${POSTGRES_PORT:-5432}"
USER="${POSTGRES_USER:-asfp}"
DB="${POSTGRES_DB:-asfp}"
PASSWORD="${POSTGRES_PASSWORD:-asfp123}"
TARGET_DIR="${BACKUP_DIR:-/var/backups}"
INTERVAL="${BACKUP_INTERVAL_SECONDS:-3600}"

mkdir -p "${TARGET_DIR}"

echo "[backup] starting scheduler (host=${HOST}:${PORT} db=${DB} interval=${INTERVAL}s)"

while true; do
  export PGPASSWORD="${PASSWORD}"
  TIMESTAMP="$(date +"%Y%m%d_%H%M%S")"
  DEST="${TARGET_DIR}/asfp_${TIMESTAMP}.sql"

  if pg_dump -h "${HOST}" -p "${PORT}" -U "${USER}" "${DB}" > "${DEST}"; then
    echo "[backup] dump written to ${DEST}"
  else
    echo "[backup] dump failed, removing ${DEST}" >&2
    rm -f "${DEST}"
  fi

  sleep "${INTERVAL}"
done
