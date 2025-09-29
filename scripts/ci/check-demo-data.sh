#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE=${COMPOSE_FILE:-deploy/docker-compose.yml}
ENV_FILE=${ENV_FILE:-deploy/.env}
POSTGRES_SERVICE=${POSTGRES_SERVICE:-postgres}
POSTGRES_USER=${POSTGRES_USER:-asfp}
POSTGRES_DB=${POSTGRES_DB:-asfp}

compose_cmd=(docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}")

printf 'Checking demo data in %s/%s (service: %s)\n' "$POSTGRES_DB" "$POSTGRES_USER" "$POSTGRES_SERVICE"

"${compose_cmd[@]}" exec -T "$POSTGRES_SERVICE" psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" <<'SQL'
DO
$$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM core.roles WHERE code = 'director') THEN
        RAISE EXCEPTION 'core.roles missing director';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM crm.customers WHERE name = 'ООО «Афиша»') THEN
        RAISE EXCEPTION 'crm.customers missing demo customer';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM wms.warehouse WHERE code = 'msk-main') THEN
        RAISE EXCEPTION 'wms.warehouse missing msk-main';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM wms.warehouse_zone WHERE code = 'RECEIVING') THEN
        RAISE EXCEPTION 'wms.warehouse_zone missing RECEIVING';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM wms.item WHERE sku = 'DEMO-SIGN-001') THEN
        RAISE EXCEPTION 'wms.item missing DEMO-SIGN-001';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM wms.catalog_node WHERE catalog_type = 'category' AND code = 'SIGNAGE') THEN
        RAISE EXCEPTION 'wms.catalog_node missing SIGNAGE category';
    END IF;
END;
$$;
SQL

printf 'Demo data OK\n'
