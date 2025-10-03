.PHONY: up up-build restart down stop build lint test migrate-core migrate-core-down migrate-crm migrate-crm-down migrate-wms migrate-wms-down migrate-mes migrate-mes-down migrate-montage migrate-montage-down migrate-docs migrate-docs-down migrate-bpm migrate-bpm-down seed refresh-demo check-demo clean smoke certs mkcert clean-certs env frontend frontend-install

GOOSE?=goose
GOOSE_BIN:=$(shell command -v $(GOOSE) 2>/dev/null)
ifeq ($(strip $(GOOSE_BIN)),)
GOOSE_RUN:=go run github.com/pressly/goose/v3/cmd/goose@latest
else
GOOSE_RUN:=$(GOOSE_BIN)
endif
CORE_DOWN_TO?=
ifeq ($(strip $(CORE_DOWN_TO)),)
GOOSE_CORE_DOWN_CMD:=down
else
GOOSE_CORE_DOWN_CMD:=down-to $(CORE_DOWN_TO)
endif
GOOSE_CORE_TABLE?=goose_db_version_core

CRM_DOWN_TO?=
ifeq ($(strip $(CRM_DOWN_TO)),)
GOOSE_CRM_DOWN_CMD:=down
else
GOOSE_CRM_DOWN_CMD:=down-to $(CRM_DOWN_TO)
endif
GOOSE_CRM_TABLE?=goose_db_version_crm

WMS_DOWN_TO?=
ifeq ($(strip $(WMS_DOWN_TO)),)
GOOSE_WMS_DOWN_CMD:=down
else
GOOSE_WMS_DOWN_CMD:=down-to $(WMS_DOWN_TO)
endif
GOOSE_WMS_TABLE?=goose_db_version_wms

MES_DOWN_TO?=
ifeq ($(strip $(MES_DOWN_TO)),)
GOOSE_MES_DOWN_CMD:=down
else
GOOSE_MES_DOWN_CMD:=down-to $(MES_DOWN_TO)
endif
GOOSE_MES_TABLE?=goose_db_version_mes

MONTAGE_DOWN_TO?=
ifeq ($(strip $(MONTAGE_DOWN_TO)),)
GOOSE_MONTAGE_DOWN_CMD:=down
else
GOOSE_MONTAGE_DOWN_CMD:=down-to $(MONTAGE_DOWN_TO)
endif
GOOSE_MONTAGE_TABLE?=goose_db_version_montage

DOCS_DOWN_TO?=
ifeq ($(strip $(DOCS_DOWN_TO)),)
GOOSE_DOCS_DOWN_CMD:=down
else
GOOSE_DOCS_DOWN_CMD:=down-to $(DOCS_DOWN_TO)
endif
GOOSE_DOCS_TABLE?=goose_db_version_docs

BPM_DOWN_TO?=
ifeq ($(strip $(BPM_DOWN_TO)),)
GOOSE_BPM_DOWN_CMD:=down
else
GOOSE_BPM_DOWN_CMD:=down-to $(BPM_DOWN_TO)
endif
GOOSE_BPM_TABLE?=goose_db_version_bpm

COMPOSE_FILE=deploy/docker-compose.yml
ENV_FILE?=deploy/.env
ENV_TEMPLATE?=deploy/.env.example
POSTGRES_USER?=asfp
POSTGRES_DB?=asfp
SEED_SQL_PATH?=/docker-entrypoint-initdb.d/99_seed.sql
SEED_PSQL=docker compose --env-file $(ENV_FILE) -f $(COMPOSE_FILE) exec -T postgres psql -U $(POSTGRES_USER) -d $(POSTGRES_DB)
CERT_DIR?=deploy/nginx/certs
CERT_CERT?=$(CERT_DIR)/local.pem
CERT_KEY?=$(CERT_DIR)/local-key.pem
MKCERT_HOSTS?=localhost 127.0.0.1 ::1
MKCERT?=mkcert
OPENSSL?=openssl

up: env certs
	docker compose --env-file $(ENV_FILE) -f $(COMPOSE_FILE) up -d

up-build: env certs
	docker compose --env-file $(ENV_FILE) -f $(COMPOSE_FILE) up --build -d

restart: down up

env:
	@if [ ! -f "$(ENV_FILE)" ]; then \
		if [ -f "$(ENV_TEMPLATE)" ]; then \
			cp "$(ENV_TEMPLATE)" "$(ENV_FILE)" && echo "Created $(ENV_FILE) from $(ENV_TEMPLATE)"; \
		else \
			echo "$(ENV_TEMPLATE) not found; create $(ENV_FILE) manually" >&2; exit 1; \
		fi; \
	else \
		echo "$(ENV_FILE) already exists"; \
	fi

stop:
	docker compose --env-file $(ENV_FILE) -f $(COMPOSE_FILE) stop

down:
	docker compose --env-file $(ENV_FILE) -f $(COMPOSE_FILE) down -v

build:
	docker compose --env-file $(ENV_FILE) -f $(COMPOSE_FILE) build

test:
	go test ./... -coverprofile=coverage.out -covermode=atomic

lint:
	docker run --rm -e GOTOOLCHAIN=go1.23.3 -v "$(CURDIR):/app" -v golangci-lint-mod:/go/pkg/mod -v golangci-lint-cache:/root/.cache -w /app golang:1.23 sh -c "go install github.com/golangci/golangci-lint/cmd/golangci-lint@v1.61.0 && golangci-lint run ./..."

migrate-core:
	$(GOOSE_RUN) -table $(GOOSE_CORE_TABLE) -dir pkg/db/migrations/core postgres "$(DATABASE_URL)" up

migrate-core-down:
	$(GOOSE_RUN) -table $(GOOSE_CORE_TABLE) -dir pkg/db/migrations/core postgres "$(DATABASE_URL)" $(GOOSE_CORE_DOWN_CMD)

migrate-crm:
	$(GOOSE_RUN) -table $(GOOSE_CRM_TABLE) -dir modules/crm/migrations postgres "$(DATABASE_URL)" up

migrate-crm-down:
	$(GOOSE_RUN) -table $(GOOSE_CRM_TABLE) -dir modules/crm/migrations postgres "$(DATABASE_URL)" $(GOOSE_CRM_DOWN_CMD)

migrate-wms:
	$(GOOSE_RUN) -table $(GOOSE_WMS_TABLE) -dir modules/wms/migrations postgres "$(DATABASE_URL)" up

migrate-wms-down:
	$(GOOSE_RUN) -table $(GOOSE_WMS_TABLE) -dir modules/wms/migrations postgres "$(DATABASE_URL)" $(GOOSE_WMS_DOWN_CMD)

migrate-mes:
	$(GOOSE_RUN) -table $(GOOSE_MES_TABLE) -dir modules/mes/migrations postgres "$(DATABASE_URL)" up

migrate-mes-down:
	$(GOOSE_RUN) -table $(GOOSE_MES_TABLE) -dir modules/mes/migrations postgres "$(DATABASE_URL)" $(GOOSE_MES_DOWN_CMD)

migrate-montage:
	$(GOOSE_RUN) -table $(GOOSE_MONTAGE_TABLE) -dir modules/montage/migrations postgres "$(DATABASE_URL)" up

migrate-montage-down:
	$(GOOSE_RUN) -table $(GOOSE_MONTAGE_TABLE) -dir modules/montage/migrations postgres "$(DATABASE_URL)" $(GOOSE_MONTAGE_DOWN_CMD)

migrate-docs:
	$(GOOSE_RUN) -table $(GOOSE_DOCS_TABLE) -dir modules/docs/migrations postgres "$(DATABASE_URL)" up

migrate-docs-down:
	$(GOOSE_RUN) -table $(GOOSE_DOCS_TABLE) -dir modules/docs/migrations postgres "$(DATABASE_URL)" $(GOOSE_DOCS_DOWN_CMD)

migrate-bpm:
	$(GOOSE_RUN) -table $(GOOSE_BPM_TABLE) -dir modules/bpm/migrations postgres "$(DATABASE_URL)" up

migrate-bpm-down:
	$(GOOSE_RUN) -table $(GOOSE_BPM_TABLE) -dir modules/bpm/migrations postgres "$(DATABASE_URL)" $(GOOSE_BPM_DOWN_CMD)

seed:
	$(SEED_PSQL) -f $(SEED_SQL_PATH)

refresh-demo:
	$(MAKE) migrate-core
	$(MAKE) migrate-crm
	$(MAKE) migrate-wms
	$(MAKE) migrate-mes
	$(MAKE) migrate-montage
	$(MAKE) migrate-docs
	$(MAKE) migrate-bpm
	$(MAKE) seed

check-demo:
	bash scripts/ci/check-demo-data.sh

clean:
	rm -f coverage.out

smoke:
	@mkdir -p tests/smoke/artifacts
	go test -count=1 -v ./tests/smoke | tee tests/smoke/artifacts/smoke.log

certs: mkcert

mkcert:
	@if [ "$(SKIP_MKCERT)" = "1" ] || [ "$(SKIP_MKCERT)" = "true" ]; then \
		echo "mkcert skipped (SKIP_MKCERT set)"; \
		exit 0; \
	fi
	@mkdir -p $(CERT_DIR)
	@if [ ! -f "$(CERT_CERT)" ] || [ ! -f "$(CERT_KEY)" ]; then \
		if command -v $(MKCERT) >/dev/null 2>&1; then \
			$(MKCERT) -cert-file $(CERT_CERT) -key-file $(CERT_KEY) $(MKCERT_HOSTS); \
		elif command -v $(OPENSSL) >/dev/null 2>&1; then \
			echo "mkcert not found, generating self-signed certificate via openssl"; \
			$(OPENSSL) req -x509 -nodes -days 825 -newkey rsa:2048 \
				-keyout $(CERT_KEY) -out $(CERT_CERT) \
				-subj "/C=RU/ST=Moscow/L=Moscow/O=Local Dev/OU=ASFP/CN=localhost"; \
		else \
			echo "Neither mkcert nor openssl is available" >&2; exit 1; \
		fi; \
	else \
		echo "Certificates already exist in $(CERT_DIR)"; \
	fi

clean-certs:
	rm -f $(CERT_CERT) $(CERT_KEY)

frontend-install:
	cd apps/web && pnpm install

frontend:
	cd apps/web && pnpm dev -- --host 0.0.0.0
