# Фронтенд ASFP-Pro

## Стек
- React 18 + TypeScript
- Vite 5 (сборка) и Vitest для unit-тестов
- Redux Toolkit + RTK Query, React Query для кеширования запросов
- MSW для изолированной разработки без бэкенда

## Структура монорепозитория
```
apps/web        — клиентское SPA
packages/*      — будущие переиспользуемые модули (ui, api, design)
```

## Ближайший бэклог
1. Подключить дизайн-систему (форк Ant Design или собственная библиотека).
2. Настроить RTK Query клиенты на основе OpenAPI (gateway/crm/wms).
3. Реализовать flow авторизации (Basic → токены), экран логина, редиректы.
4. Собрать общий Layout со статичной навигацией и правами доступа.
5. Добавить e2e-тесты (Playwright) и smoke для фронтенда в CI.

## Переменные окружения
- `VITE_GATEWAY_URL` — адрес API gateway.
- `VITE_CRM_URL` — адрес CRM.
- `VITE_WMS_URL` — адрес WMS.
- `VITE_ENABLE_MSW` — `true` для запуска моков MSW в dev.

## Как запустить
```
corepack pnpm install
pnpm dev        # http://localhost:5173
pnpm build
pnpm preview
```

## Принципы
- Только российские или открытые компоненты инфраструктуры.
- Вся логика авторизации/ролей проходит через backend (gateway).
- Фича-флаги и конфигурации — через env и config-сервис (будет позже).
