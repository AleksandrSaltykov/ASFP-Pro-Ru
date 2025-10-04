export type WarehouseNavItem = {
  label: string;
  path: string;
  description?: string;
  children?: WarehouseNavItem[];
};

export const WAREHOUSE_NAV: WarehouseNavItem[] = [
  {
    label: "1. Справочники",
    path: "masters",
    children: [
      {
        label: "1.1 Номенклатура",
        path: "masters/items",
        children: [
          { label: "Категории / группы", path: "masters/items/categories" },
          { label: "Единицы измерения", path: "masters/items/units" },
          { label: "Пересчёты", path: "masters/items/conversions" },
          { label: "Атрибуты", path: "masters/items/attributes" },
          { label: "Состав изделия", path: "masters/items/bom" },
          { label: "Файлы / изображения", path: "masters/items/attachments" }
        ]
      },
      {
        label: "1.2 Склады / локации / зоны / ячейки",
        path: "masters/locations"
      },
      { label: "1.3 Поставщики", path: "masters/partners" },
      { label: "1.4 Сотрудники / роли", path: "masters/roles" },
      { label: "1.5 Типы операций", path: "masters/op-statuses" },
      { label: "1.6 Упаковки", path: "masters/packages" }
    ]
  },
  {
    label: "2. Входящие операции",
    path: "inbound",
    children: [
      { label: "2.1 Заказы на поступление", path: "inbound/orders" },
      { label: "2.2 Приёмка", path: "inbound/receipts" },
      { label: "2.3 Размещение", path: "inbound/putaway" },
      { label: "2.4 Отбраковка / возврат", path: "inbound/qc-returns" },
      { label: "2.5 Журнал приёмки", path: "inbound/log" }
    ]
  },
  {
    label: "3. Перемещения",
    path: "moves",
    children: [
      { label: "3.1 Внутризонные", path: "moves/internal" },
      { label: "3.2 Межскладовые", path: "moves/inter-warehouse" },
      { label: "3.3 Пополнения", path: "moves/replenishment" },
      { label: "3.4 Корректировки", path: "moves/adjustments" },
      { label: "3.5 Трансформации", path: "moves/transforms" }
    ]
  },
  {
    label: "4. Резервирование",
    path: "reserve",
    children: [
      { label: "4.1 Резервы", path: "reserve/reservations" },
      { label: "4.2 Блокировки", path: "reserve/holds" },
      { label: "4.3 Разблокировка", path: "reserve/releases" }
    ]
  },
  {
    label: "5. Отбор / комплектация",
    path: "picking",
    children: [
      { label: "5.1 Задания", path: "picking/tasks" },
      { label: "5.2 Стратегии", path: "picking/strategies" },
      { label: "5.3 Подтверждения", path: "picking/confirmations" },
      { label: "5.4 Комплектация", path: "picking/kitting" }
    ]
  },
  {
    label: "6. Отгрузка",
    path: "shipping",
    children: [
      { label: "6.1 Подготовка", path: "shipping/prep" },
      { label: "6.2 Проверка / упаковка", path: "shipping/pack-labels" },
      { label: "6.3 Документы", path: "shipping/docs" },
      { label: "6.4 Регистрация", path: "shipping/history" },
      { label: "6.5 Возвраты", path: "shipping/returns" }
    ]
  },
  {
    label: "7. Инвентаризация",
    path: "inventory",
    children: [
      { label: "7.1 Плановая", path: "inventory/plans" },
      { label: "7.2 Циклический пересчёт", path: "inventory/cycle-count" },
      { label: "7.3 Сверка", path: "inventory/reconciliation" },
      { label: "7.4 Журнал", path: "inventory/log" }
    ]
  },
  {
    label: "8. Запасы",
    path: "stock",
    children: [
      { label: "8.1 Остатки", path: "stock/balances" },
      { label: "8.2 Доступность", path: "stock/availability" },
      { label: "8.3 Нескончаемые остатки", path: "stock/endless" },
      { label: "8.4 История движений", path: "stock/history" }
    ]
  },
  {
    label: "9. Отчёты",
    path: "reports",
    children: [
      { label: "9.1 Остатки / движения", path: "reports/kpis" },
      { label: "9.2 Оборачиваемость", path: "reports/turnover" },
      { label: "9.3 Списания", path: "reports/losses" },
      { label: "9.4 KPI отбора", path: "reports/load" }
    ]
  },
  {
    label: "10. Настройки",
    path: "settings",
    children: [
      { label: "10.1 Права", path: "settings/roles" },
      { label: "10.2 Отображения", path: "settings/display" },
      { label: "10.3 Устройства", path: "settings/devices" },
      { label: "10.4 Импорт / экспорт", path: "settings/import-export" }
    ]
  }
];

const collectNav = (items: WarehouseNavItem[], acc: WarehouseNavItem[] = []) => {
  for (const item of items) {
    acc.push(item);
    if (item.children?.length) {
      collectNav(item.children, acc);
    }
  }
  return acc;
};

const PLACEHOLDER_EXCLUDED_PREFIXES = ['stock'];
const PLACEHOLDER_EXCLUDED_PATHS = new Set<string>(['masters/items', 'masters/items/categories', 'masters/items/units', 'masters/items/attributes']);

export const WAREHOUSE_PLACEHOLDER_ROUTES = collectNav(WAREHOUSE_NAV, [])
  .filter((item) => {
    if (PLACEHOLDER_EXCLUDED_PREFIXES.some((prefix) => item.path.startsWith(prefix))) {
      return false;
    }
    return !PLACEHOLDER_EXCLUDED_PATHS.has(item.path);
  })
  .map((item) => ({ label: item.label, path: item.path }));
