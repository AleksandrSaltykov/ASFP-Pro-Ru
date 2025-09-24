.PHONY: up down stop build lint test migrate-core migrate-crm migrate-wms seed clean smoke certs mkcert clean-certs

COMPOSE_FILE=deploy/docker-compose.yml
ENV_FILE?=deploy/.env
GOOSE?=goose

CERT_DIR?=deploy/nginx/certs
CERT_CERT?=$(CERT_DIR)/local.pem
CERT_KEY?=$(CERT_DIR)/local-key.pem
MKCERT_HOSTS?=localhost 127.0.0.1 ::1
MKCERT?=mkcert

up: certs
	docker compose --env-file $(ENV_FILE) -f $(COMPOSE_FILE) up --build -d

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
	@if ! command -v $(MKCERT) >/dev/null 2>&1; then \
		echo "mkcert is required. Install it from https://github.com/FiloSottile/mkcert" >&2; \
		exit 1; \
	fi
	@mkdir -p $(CERT_DIR)
	@if [ ! -f "$(CERT_CERT)" ] || [ ! -f "$(CERT_KEY)" ]; then \
		$(MKCERT) -cert-file $(CERT_CERT) -key-file $(CERT_KEY) $(MKCERT_HOSTS); \
	else \
		echo "Certificates already exist in $(CERT_DIR)"; \
	fi

clean-certs:
	rm -f $(CERT_CERT) $(CERT_KEY)
