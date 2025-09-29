# Web клиент ASFP-Pro

## Скрипты
- `pnpm dev` — запуск dev-сервера Vite.
- `pnpm build` — сборка production-версии.
- `pnpm preview` — предпросмотр собранного бандла.
- `pnpm lint` — проверка ESLint/Prettier.
- `pnpm test` — unit-тесты (Vitest + Testing Library).

## Структура
- `src/app` — точка входа, провайдеры, стор, роутинг.
- `src/pages` — экранные компоненты (login, CRM, WMS, файлы).
- `src/shared` — переиспользуемые хелперы, UI, API-клиенты.
- `src/widgets` — композиции нескольких компонентов (layout и т.д.).

## Переменные окружения
Создайте `.env` в каталоге `apps/web` (либо используйте `.env.local`). Пример:
```
VITE_GATEWAY_URL=http://localhost:8080
VITE_CRM_URL=http://localhost:8081
VITE_WMS_URL=http://localhost:8082
VITE_ENABLE_MSW=true
VITE_GATEWAY_BASIC_AUTH=admin@asfp.pro:admin123
```

Переменная `VITE_GATEWAY_BASIC_AUTH` используется для формирования Basic Auth заголовка при обращении к `/api/v1/audit` в gateway. Для production-окружения задайте пару логин/пароль, совпадающую с учётной записью в `core.users`.

## Моки API
Для разработки без бэкенда активируйте `VITE_ENABLE_MSW=true`. Моки подключаются через MSW и
будут расширены после генерации API-контрактов.
