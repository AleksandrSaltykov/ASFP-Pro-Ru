# Фронтенд ASFP-Pro

## Стек
- React 18 + TypeScript, Vite 5 для dev/build пайплайна.
- Redux Toolkit (store, slices) + React Query 5 для работы с API (`apps/web/src/shared/api`).
- MSW 2.x для локальных моков без запуска бэкенда.
- Playwright, Vitest, Testing Library для e2e и unit/UI тестов.

## Структура монорепозитория
```
apps/web        — клиентское SPA
packages/*      — будущие переиспользуемые модули (ui, api, design)
```

Ключевые страницы (маршрутизация: `apps/web/src/app/routes.tsx`): CRM сделки, модуль склада `/warehouse/*`, Docs, BPM tasks, Analytics, Files и админский аудит. Верхнее меню склада разворачивает подпункты `stock/balances`, `stock/availability`, `stock/endless`, `stock/history` на моковых API (`@shared/api/wms/stock`).

## Актуальный бэклог
1. Реализовать авторизацию: переход от Basic Auth к токенам, состояние пользователя, редиректы.
2. Подключить дизайн-систему и унифицировать UI-компоненты (layout, таблицы, формы).
3. Добавить e2e (Playwright) для потоков: логин, CRM сделки, WMS каталоги, BPM задачи, Docs документы, Analytics отчёты.
4. Согласовать работу с RBAC (скоупы ролей, скрытие страниц) после обновления backend.
5. Подключить генерацию API-клиентов из OpenAPI или унифицировать вручную написанные хуки.

## Переменные окружения
- `VITE_GATEWAY_URL` — адрес API gateway (обязательно).
- `VITE_CRM_URL`, `VITE_WMS_URL` — прямой доступ к сервисам (опционально, используется моками).
- `VITE_ENABLE_MSW` — `true` для запуска моков MSW в dev.
- `VITE_GATEWAY_BASIC_AUTH` — креды для Basic Auth (нужно для `/admin/audit`).

## Как запустить
```
corepack pnpm install
pnpm dev        # http://localhost:5173
pnpm build
pnpm preview
pnpm lint
pnpm test
pnpm e2e        # требует поднятый стенд и Playwright
```

## Принципы
- Используем только российские/opensource компоненты инфраструктуры.
- Авторизация, права и аудит рассчитываются на backend (gateway/core).
- Фича-флаги и конфигурации выносим в env/config-сервис.
