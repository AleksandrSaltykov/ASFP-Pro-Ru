.PHONY: up up-build restart down stop build lint test migrate-core migrate-crm migrate-wms seed clean smoke certs mkcert clean-certs env frontend frontend-install

COMPOSE_FILE=deploy/docker-compose.yml
ENV_FILE?=deploy/.env
ENV_TEMPLATE?=deploy/.env.example
GOOSE?=goose

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
	$(GOOSE) -dir pkg/db/migrations/core postgres "$(DATABASE_URL)" up

migrate-crm:
	$(GOOSE) -dir modules/crm/migrations postgres "$(DATABASE_URL)" up

migrate-wms:
	$(GOOSE) -dir modules/wms/migrations postgres "$(DATABASE_URL)" up

seed:
	psql "$(DATABASE_URL)" -f deploy/init/postgres/99_seed.sql

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
