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
      { label: "1.1 Номенклатура", path: "masters/items" },
      { label: "1.2 Склады", path: "masters/locations/warehouses" },
      { label: "1.3 Поставщики", path: "masters/partners" },
      { label: "1.4 Единицы измерения", path: "masters/items/units" }
    ]
  },
  {
    label: "2. Операции",
    path: "operations",
    children: [
      { label: "2.1 Приёмка", path: "inbound/receipts" },
      { label: "2.2 Перемещение между складами", path: "moves/inter-warehouse" },
      { label: "2.3 Отбраковка / возврат", path: "inbound/qc-returns" },
      { label: "2.4 Отгрузка покупателю", path: "shipping/docs" },
      { label: "2.5 Комплектация", path: "picking/kitting" }
    ]
  },
  {
    label: "3. Резервирование",
    path: "reserve",
    children: [
      { label: "3.1 Резервы", path: "reserve/reservations" }
    ]
  },
  {
    label: "4. Инвентаризация",
    path: "inventory",
    children: [
      { label: "4.1 Инвентаризация", path: "inventory/log" }
    ]
  },
  {
    label: "5. Запасы",
    path: "stock",
    children: [
      { label: "5.1 Остатки", path: "stock/balances" },
      { label: "5.2 Доступность", path: "stock/availability" },
      { label: "5.3 Нескончаемые остатки", path: "stock/endless" },
      { label: "5.4 История движений", path: "stock/history" }
    ]
  },
  {
    label: "6. Отчёты",
    path: "reports",
    children: [
      { label: "6.1 Остатки / движения", path: "reports/kpis" },
      { label: "6.2 Оборачиваемость", path: "reports/turnover" },
      { label: "6.3 Списания", path: "reports/losses" },
      { label: "6.4 KPI отбора", path: "reports/load" }
    ]
  },
  {
    label: "7. Настройки",
    path: "settings",
    children: [
      { label: "7.1 Права", path: "settings/roles" },
      { label: "7.2 Отображения", path: "settings/display" },
      { label: "7.3 Устройства", path: "settings/devices" },
      { label: "7.4 Импорт / экспорт", path: "settings/import-export" }
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
const PLACEHOLDER_EXCLUDED_PATHS = new Set<string>([
  'masters',
  'masters/items',
  'masters/locations/warehouses',
  'masters/partners',
  'masters/items/units',
  'inbound/receipts',
  'moves/inter-warehouse'
]);

export const WAREHOUSE_PLACEHOLDER_ROUTES = collectNav(WAREHOUSE_NAV, [])
  .filter((item) => {
    if (PLACEHOLDER_EXCLUDED_PREFIXES.some((prefix) => item.path.startsWith(prefix))) {
      return false;
    }
    return !PLACEHOLDER_EXCLUDED_PATHS.has(item.path);
  })
  .map((item) => ({ label: item.label, path: item.path }));
