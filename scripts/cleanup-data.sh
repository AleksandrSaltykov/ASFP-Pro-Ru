#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE=${COMPOSE_FILE:-deploy/docker-compose.yml}
ENV_FILE=${ENV_FILE:-deploy/.env}
COMPOSE_CMD=(docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE")

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is not installed or not in PATH" >&2
  exit 1
fi

project_json=$("${COMPOSE_CMD[@]}" config --format json)
PROJECT_NAME=${COMPOSE_PROJECT_NAME:-$(python -c 'import json,sys; data=json.load(sys.stdin); print(data.get("name","deploy"))' <<< "$project_json")}

SERVICES=(postgres clickhouse redis)
VOLUMES=("${PROJECT_NAME}_postgres_data" "${PROJECT_NAME}_clickhouse_data")

# Stop and remove service containers to release mounts
"${COMPOSE_CMD[@]}" stop "${SERVICES[@]}" >/dev/null 2>&1 || true
"${COMPOSE_CMD[@]}" rm -fsv "${SERVICES[@]}" >/dev/null 2>&1 || true

for volume in "${VOLUMES[@]}"; do
  if docker volume inspect "$volume" >/dev/null 2>&1; then
    echo "Removing volume $volume"
    docker volume rm "$volume" >/dev/null
  else
    echo "Volume $volume not found, skipping"
  fi
done

echo "Redis data will be recreated on next container start."
