# Внешние сервисы: требования и шаблон интеграции

Этот документ описывает, как быстро сформировать независимое приложение/сервис, который в дальнейшем безболезненно подружится с текущей платформой ASFPPRO. Следуя инструкции, вы получите «скелет» нового сервиса, совместимый с нашими DevOps‑процессами, окружением и стандартами кода.

---

## 1. Стек и соглашения

| Область            | Рекомендация                                                                                            |
|--------------------|---------------------------------------------------------------------------------------------------------|
| Язык/Runtime       | **Go 1.23** (совпадает с основными сервисами; позволяет переиспользовать `pkg/*`)                      |
| HTTP‑фреймворк     | `github.com/gofiber/fiber/v2` (единый контракт на health/ready, middleware)                            |
| БД                 | Postgres 16 (через `github.com/jackc/pgx/v5/pgxpool`)                                                   |
| Миграции           | `pressly/goose v3` (вынести миграции в `migrations/0001_*.sql`, таблица по шаблону `goose_db_version_<service>`) |
| Логирование        | `github.com/rs/zerolog` (общий формат JSON, уровни, трассировка)                                        |
| Конфигурация       | пакет `pkg/config` – единый способ читать `.env`, префиксы `SERVICE_*`                                  |
| Мониторинг         | Health/Ready эндпоинты + (опционально) метрики через Prometheus middleware                              |
| Docker             | многостадийный билд (Go build → alpine/run); образ в неймспейсе `deploy-<service>`                     |
| CI/Lint            | `go test ./...`, `golangci-lint run` (config уже есть `.golangci.yml`)                                 |

---

## 2. Структура каталогов

```
modules/<service>/
  cmd/<service>/main.go           # точка входа
  internal/
    handler/                      # HTTP-ручки (Fiber)
    service/                      # бизнес-логика
    repository/                   # работа с БД
    entity/                       # доменные структуры
  migrations/                     # SQL-файлы goose
  docs/openapi/openapi.json       # описание API (опционально, но желательно)
Makefile                          # локальные цели (lint, test, migrate-…)
Dockerfile                        # многостадийный образ
README.md                         # специфические детали сервиса
```

> **Важно**: храните код внутри `modules/<service>`, чтобы использовать Go‑модули проекта и пакет `pkg/*` без лишнего go mod init.

---

## 3. Конфигурация и переменные окружения

Используем `pkg/config.Load("SERVICE")`. Для нового сервиса добавьте в `deploy/.env` и `deploy/docker-compose.yml` блок:

```env
SERVICE_DATABASE_URL=postgres://asfp:asfp123@postgres:5432/asfp?sslmode=disable
SERVICE_HTTP_PORT=8099
```

На уровне сервиса:

```go
cfg, err := config.Load("SERVICE")
// cfg.DatabaseURL, cfg.HTTPPort, cfg.Env и т.д.
```

Дополнительные переменные добавляйте в структуру `AppConfig` через расширение (наследование) или локальные обёртки.

---

## 4. Миграции

1. Создайте директорию `modules/<service>/migrations`.
2. Именуйте файлы `0001_init.sql`, `0002_add_table.sql` и т.д. (уникальные номера!).
3. Таблица версий: `goose_db_version_<service>`.
4. Добавьте Makefile‑таргеты:

```make
GOOSE_RUN := go run github.com/pressly/goose/v3/cmd/goose@latest
GOOSE_SERVICE_TABLE := goose_db_version_<service>

migrate-<service>:
	$(GOOSE_RUN) -table $(GOOSE_SERVICE_TABLE) -dir modules/<service>/migrations postgres "$(DATABASE_URL)" up

migrate-<service>-down:
	$(GOOSE_RUN) -table $(GOOSE_SERVICE_TABLE) -dir modules/<service>/migrations postgres "$(DATABASE_URL)" down
```

При локальной разработке migrations запускаем через `docker run --network deploy_default ...` (см. пример в основной README).

---

## 5. HTTP API и контракты

Минимальный набор эндпоинтов:

| Путь                 | Метод | Назначение                 |
|----------------------|-------|----------------------------|
| `/health`            | GET   | Быстрый ответ `200 OK`     |
| `/ready`             | GET   | Проверка БД/зависимостей   |
| `/openapi.json`      | GET   | (опц.) публичный контракт  |
| `/api/v1/<domain>/…` | REST  | Бизнес-операции            |

Мидлвари:

```go
app := fiber.New(fiber.Config{AppName: cfg.AppName})
app.Use(cors.New())
app.Use(recover.New())
```

Аутентификация:
* Если REST вызывается напрямую из фронтенда — используйте Basic Auth, как `WMS` (`@shared/api/basic-auth.ts`).
* Если только через `gateway` — можно работать без авторизации и добавить прокси маршруты позже.

---

## 6. Логирование и ошибки

```go
logger := logpkg.Init(cfg.Env) // из pkg/log

logger.Info().Str("component", "service").Msg("listening")
logger.Error().Err(err).Msg("failed to …")
```

Все ошибки отдаём в JSON: `fiber.NewError(status, message)`. Игнорируемы логируем, критические возвращаемся вверх.

---

## 7. Тесты

Минимум:

```bash
go test ./modules/<service>/...
```

Юнит‑тесты (`*_test.go`) держать рядом с пакетом. Если нужны интеграционные тесты с Postgres, используйте `TEST_DATABASE_URL` и `t.Skip` при отсутствии переменной (см. пример `verify_alt_units_test.go`).

---

## 8. Докеризация

**Dockerfile (пример)**:

```Dockerfile
FROM golang:1.24-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /bin/<service> ./modules/<service>/cmd/<service>

FROM alpine:3.20
RUN adduser -S -D -H app
WORKDIR /home/app
COPY --from=build /bin/<service> ./<service>
COPY --from=build /src/modules/<service>/docs/openapi/openapi.json ./openapi.json
USER app
ENTRYPOINT ["./<service>"]
```

Добавьте сервис в `deploy/docker-compose.yml` (по аналогии с `wms`, `crm`, …) и сконфигурируйте healthcheck.

---

## 9. Интеграция с gateway / фронтендом

1. **Gateway**: добавьте прокси-маршруты в `gateway/internal/handlers/<new>.go` или `gateway/internal/wms/…`, предоставьте функции в `gateway/internal/<domain>/service.go`.
2. **Фронтенд**: создайте модуль в `apps/web/src/shared/api/<service>`:
   * HTTP‑клиент через `createHttpClient(API_ENDPOINTS.<service>)`.
   * Обновите `API_ENDPOINTS` / `.env`, чтобы сервис был доступен (`VITE_<SERVICE>_URL`).
   * Добавьте мок–обработчики (если нужны) в `apps/web/src/shared/api/mocks/handlers.ts`.

---

## 10. Дополнительные требования

* **Стиль кода** – `golangci-lint run` без предупреждений.
* **Коммиты** – если планируется PR в основной репозиторий, придерживайтесь conventional commits.
* **OpenAPI** – обновляйте `docs/openapi/openapi.json` (используем для автогенерации клиентов и swagger UI).
* **CI/CD** – при необходимости допишите цели в корневой `Makefile` (lint/test) и pipelines.
* **Mock данных** – храните стартовые «заглушки» в `modules/<service>/docs/fixtures` либо в миграциях (seed).

---

## 11. Шаблон README для сервиса

Минимально:

```
# <Service Name>

## Быстрый старт
```bash
make migrate-<service>
DATABASE_URL=... go run ./modules/<service>/cmd/<service>
```

## API
- `GET /ready` …
- `POST /api/v1/...` …

## Переменные окружения
- `SERVICE_DATABASE_URL`
- `SERVICE_HTTP_PORT`
...

## Миграции
```bash
make migrate-<service>
make migrate-<service>-down WMS_DOWN_TO=20250110120000
```
```

---

Следуя этому документу, вы получите модуль, который:

1. Совместим с текущими инфраструктурными подходами (миграции, docker-compose, логи).
2. Легко добавляется в читабельный OpenAPI/фронтенд.
3. Содержит минимальный набор сервисных эндпоинтов (health/ready).
4. Не ломает существующий CI.

При необходимости расширяйте документ примерами настроек авторизации, очередей, S3 и т.д. — но в качестве «скелета» достаточно перечисленных требований. Удачной разработки!
