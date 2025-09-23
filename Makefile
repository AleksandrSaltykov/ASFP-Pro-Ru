.PHONY: up down stop build lint test migrate-core migrate-crm migrate-wms seed clean

COMPOSE_FILE=deploy/docker-compose.yml
ENV_FILE?=deploy/.env
GOOSE?=goose

up:
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