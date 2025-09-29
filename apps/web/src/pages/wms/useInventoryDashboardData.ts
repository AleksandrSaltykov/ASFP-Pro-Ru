import { useMemo } from 'react';

import {
  useWarehousesQuery,
  useWarehouseDetailsQuery
} from '@shared/api/wms/master-data';
import { useStockQuery } from '@shared/api/wms/inventory';
import type { StockItem, Warehouse, WarehouseDetails, WarehouseZone } from '@shared/api/wms/types';

const numberFormatter = new Intl.NumberFormat('ru-RU');
const quantityFormatter = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });
const dateTimeFormatter = new Intl.DateTimeFormat('ru-RU', {
  dateStyle: 'short',
  timeStyle: 'short'
});

const formatNumber = (value: number) => numberFormatter.format(Math.round(value));
const formatQuantity = (value: number) => quantityFormatter.format(value);

const formatDateTime = (value?: string) => {
  if (!value) {
    return '—';
  }
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return value;
  }
  return dateTimeFormatter.format(new Date(parsed));
};

const formatRelative = (value?: string) => {
  if (!value) {
    return 'нет данных';
  }
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return value;
  }
  const diffMs = Date.now() - parsed;
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
  if (diffHours <= 0) {
    return 'только что';
  }
  if (diffHours < 24) {
    return `${diffHours} ч назад`;
  }
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} дн. назад`;
};

const LOW_STOCK_THRESHOLD = 10;
const STALE_THRESHOLD_HOURS = 24;

export type SummaryCard = {
  label: string;
  value: string;
  hint?: string;
};

export type OverviewShift = {
  shift: string;
  timeframe: string;
  lead: string;
  workforce: string;
  note: string;
};

export type OverviewFlow = {
  id: string;
  title: string;
  value: string;
  detail: string;
  trend: string;
};

export type OverviewAlert = {
  id: string;
  label: string;
  value: string;
  description: string;
};

export type OverviewTaskGroup = {
  id: string;
  title: string;
  items: string[];
};

export type OperationStatView = {
  id: string;
  title: string;
  value: string;
  note: string;
};

export type StockRowView = {
  id: string;
  sku: string;
  warehouse: string;
  quantity: string;
  unit: string;
  updatedAt: string;
};

export type SupplierCardView = {
  name: string;
  invoice: string;
  contract: string;
  contact: string;
};

export type SupplierInvoiceView = {
  id: string;
  supplier: string;
  document: string;
  amount: string;
  due: string;
  status: string;
};

export type SupplierContractView = {
  id: string;
  name: string;
  validUntil: string;
  contact: string;
  status: string;
};

export type InventoryTaskView = {
  id: string;
  title: string;
  meta: string;
};

export type InventoryProgressView = {
  id: string;
  title: string;
  progress: string;
  status: string;
  detail: string;
};

export type ScanShortcutView = {
  id: string;
  key: string;
  description: string;
};

export type JournalSummaryView = {
  id: string;
  label: string;
  value: string;
  hint: string;
};

export type JournalItemView = {
  id: string;
  title: string;
  meta: string;
};

export type InventoryDashboardData = {
  summaryCards: SummaryCard[];
  overviewShift: OverviewShift;
  overviewFlows: OverviewFlow[];
  overviewAlerts: OverviewAlert[];
  overviewTaskGroups: OverviewTaskGroup[];
  operationStats: OperationStatView[];
  stockRows: StockRowView[];
  stockHighlights: OverviewAlert[];
  supplierCards: SupplierCardView[];
  supplierInvoices: SupplierInvoiceView[];
  supplierContracts: SupplierContractView[];
  inventoryTasks: InventoryTaskView[];
  inventoryProgress: InventoryProgressView[];
  scanShortcuts: ScanShortcutView[];
  journalSummary: JournalSummaryView[];
  journalItems: JournalItemView[];
  selectedWarehouse?: Warehouse;
  allWarehouses: Warehouse[];
  zones?: WarehouseZone[];
  isLoading: boolean;
  isError: boolean;
  error?: Error;
  refetch: () => void;
};

const buildStockRows = (stock: StockItem[]): StockRowView[] =>
  stock.map((item) => ({
    id: `${item.sku}-${item.warehouse}`,
    sku: item.sku,
    warehouse: item.warehouse,
    quantity: formatQuantity(item.quantity),
    unit: item.uom,
    updatedAt: formatDateTime(item.updatedAt)
  }));

const buildSupplierCards = (warehouses: Warehouse[]): SupplierCardView[] =>
  warehouses.slice(0, 3).map((warehouse) => ({
    name: warehouse.name,
    invoice: `Код ${warehouse.code}`,
    contract: `Статус: ${warehouse.status ?? 'не указан'}`,
    contact:
      warehouse.contact?.manager || warehouse.contact?.phone || warehouse.contact?.email
        ? [
            warehouse.contact?.manager,
            warehouse.contact?.phone,
            warehouse.contact?.email
          ]
            .filter(Boolean)
            .join(' · ')
        : 'Контакты не заполнены'
  }));

const buildSupplierInvoices = (stock: StockItem[]): SupplierInvoiceView[] =>
  stock.slice(0, 5).map((item) => ({
    id: `${item.sku}-${item.warehouse}`,
    supplier: item.warehouse,
    document: `SKU ${item.sku}`,
    amount: `${formatQuantity(item.quantity)} ${item.uom}`,
    due: formatDateTime(item.updatedAt),
    status: 'Обновлено'
  }));

const buildSupplierContracts = (warehouses: Warehouse[]): SupplierContractView[] =>
  warehouses.slice(0, 5).map((warehouse) => ({
    id: warehouse.id,
    name: warehouse.name,
    validUntil: warehouse.updatedAt ? formatDateTime(warehouse.updatedAt) : '—',
    contact:
      warehouse.contact?.manager || warehouse.contact?.phone
        ? [warehouse.contact?.manager, warehouse.contact?.phone].filter(Boolean).join(' · ')
        : 'Контакты не указаны',
    status: warehouse.status ?? 'не указан'
  }));

const buildInventoryTasks = (lowStock: StockItem[]): InventoryTaskView[] => {
  if (lowStock.length === 0) {
    return [
      {
        id: 'task-empty',
        title: 'Критичных позиций нет',
        meta: 'Ни одна SKU не опустилась ниже заданного порога'
      }
    ];
  }

  return lowStock.slice(0, 5).map((item) => ({
    id: `task-${item.sku}`,
    title: `Пополнить SKU ${item.sku}`,
    meta: `Склад ${item.warehouse} · Остаток ${formatQuantity(item.quantity)} ${item.uom} · Обновлено ${formatRelative(item.updatedAt)}`
  }));
};

const buildInventoryProgress = (stock: StockItem[], latestUpdatedAt?: string): InventoryProgressView[] => {
  const distinctSku = stock.length;
  const totalQuantity = stock.reduce((sum, item) => sum + item.quantity, 0);
  return [
    {
      id: 'progress-sku',
      title: 'Контроль SKU',
      progress: `${formatNumber(Math.min(100, distinctSku))} позиций`,
      status: distinctSku > 0 ? 'В процессе' : 'Нет данных',
      detail: distinctSku > 0 ? `Отслеживаем ${distinctSku} SKU` : 'Добавьте остатки'
    },
    {
      id: 'progress-quantity',
      title: 'Запасы',
      progress: `${formatQuantity(totalQuantity)} ед.`,
      status: totalQuantity > 0 ? 'Актуально' : 'Нет данных',
      detail: latestUpdatedAt ? `Последнее обновление ${formatRelative(latestUpdatedAt)}` : 'История обновлений отсутствует'
    }
  ];
};

const buildScanShortcuts = (): ScanShortcutView[] => [
  { id: 'shortcut-scan', key: 'Shift+S', description: 'Запустить режим сканирования' },
  { id: 'shortcut-undo', key: 'Ctrl+Z', description: 'Отменить последнюю позицию' },
  { id: 'shortcut-confirm', key: 'Ctrl+Enter', description: 'Подтвердить заполненный акт' }
];

const buildJournal = (stock: StockItem[]): { summary: JournalSummaryView[]; items: JournalItemView[] } => {
  const latest = stock[0]?.updatedAt;
  const summary: JournalSummaryView[] = [
    {
      id: 'summary-total',
      label: 'Операций за смену',
      value: formatNumber(stock.length),
      hint: 'Последние записи WMS'
    },
    {
      id: 'summary-updated',
      label: 'Последнее обновление',
      value: formatRelative(latest),
      hint: latest ? formatDateTime(latest) : 'Недоступно'
    },
    {
      id: 'summary-sku',
      label: 'Работаем со SKU',
      value: formatNumber(new Set(stock.map((item) => item.sku)).size),
      hint: 'Уникальные позиции в выборке'
    }
  ];

  const items = stock.slice(0, 10).map((item) => ({
    id: `${item.sku}-${item.warehouse}-${item.updatedAt}`,
    title: `SKU ${item.sku} - ${item.warehouse} - ${formatQuantity(item.quantity)} ${item.uom}`,
    meta: `Обновлено ${formatDateTime(item.updatedAt)}`
  }));

  if (items.length === 0) {
    items.push({
      id: 'journal-empty',
      title: 'Записей журнала нет',
      meta: 'Создайте движение или импортируйте остатки'
    });
  }

  return { summary, items };
};

const buildStockHighlights = (stock: StockItem[]): OverviewAlert[] => {
  if (stock.length === 0) {
    return [
      {
        id: 'highlight-empty',
        label: 'Нет данных по остаткам',
        value: 'WMS',
        description: 'Загрузите остатки или выполните синхронизацию'
      }
    ];
  }

  const sortedByQuantity = [...stock].sort((a, b) => b.quantity - a.quantity);
  const top = sortedByQuantity[0];
  const bottom = sortedByQuantity[sortedByQuantity.length - 1];
  const latest = stock.reduce((acc, item) => (Date.parse(item.updatedAt) > Date.parse(acc.updatedAt) ? item : acc), stock[0]);

  return [
    {
      id: 'highlight-top',
      label: 'ТОП остаток',
      value: `${top.sku}`,
      description: `На складе ${top.warehouse} · ${formatQuantity(top.quantity)} ${top.uom}`
    },
    {
      id: 'highlight-low',
      label: 'Минимальный остаток',
      value: `${bottom.sku}`,
      description: `Запас ${formatQuantity(bottom.quantity)} ${bottom.uom} · ${formatRelative(bottom.updatedAt)}`
    },
    {
      id: 'highlight-latest',
      label: 'Последнее обновление',
      value: `${latest.sku}`,
      description: `Склад ${latest.warehouse} · ${formatRelative(latest.updatedAt)}`
    }
  ];
};

const buildOverviewFlows = (
  stock: StockItem[],
  warehouses: Warehouse[],
  zones: WarehouseZone[] | undefined,
  latestUpdatedAt?: string
): OverviewFlow[] => {
  const totalQuantity = stock.reduce((sum, item) => sum + item.quantity, 0);
  const distinctWarehouses = new Set(stock.map((item) => item.warehouse)).size;
  return [
    {
      id: 'flow-stock',
      title: 'Запасы',
      value: `${formatQuantity(totalQuantity)} ед.`,
      detail: `${formatNumber(stock.length)} SKU в учете`,
      trend: latestUpdatedAt ? `Обновлено ${formatRelative(latestUpdatedAt)}` : 'Нет обновлений'
    },
    {
      id: 'flow-warehouses',
      title: 'Склады',
      value: formatNumber(warehouses.length),
      detail: `${formatNumber(distinctWarehouses)} складов в остатках`,
      trend: warehouses.length ? `Активный: ${warehouses[0].name}` : 'Добавьте склад'
    },
    {
      id: 'flow-zones',
      title: 'Зоны и ячейки',
      value: formatNumber(zones?.length ?? 0),
      detail: `${formatNumber(zones?.length ?? 0)} зон, ${formatNumber(zones ? zones.reduce((acc, zone) => acc + (zone.layout ? 1 : 0), 0) : 0)} схем`,
      trend: zones?.length ? 'Данные WMS' : 'Загрузите топологию'
    }
  ];
};

const buildOverviewAlerts = (lowStock: StockItem[], staleStock: StockItem[], warehouses: Warehouse[]): OverviewAlert[] => {
  const alerts: OverviewAlert[] = [];

  if (lowStock.length > 0) {
    const critical = lowStock[0];
    alerts.push({
      id: 'alert-low',
      label: 'Низкий остаток',
      value: `${critical.sku} (${critical.warehouse})`,
      description: `Остаток ${formatQuantity(critical.quantity)} ${critical.uom}`
    });
  }

  if (staleStock.length > 0) {
    const stale = staleStock[0];
    alerts.push({
      id: 'alert-stale',
      label: 'Нет обновлений',
      value: `${stale.sku}`,
      description: `Последнее изменение ${formatRelative(stale.updatedAt)}`
    });
  }

  if (warehouses.length === 0) {
    alerts.push({
      id: 'alert-warehouse',
      label: 'Не добавлены склады',
      value: 'WMS',
      description: 'Создайте склад в разделе «Настройки»'
    });
  }

  return alerts.length ? alerts : [
    {
      id: 'alert-ok',
      label: 'Контроль',
      value: 'Показатели в норме',
      description: 'Критичных событий не обнаружено'
    }
  ];
};

const buildOverviewTaskGroups = (
  lowStock: StockItem[],
  staleStock: StockItem[],
  warehouses: Warehouse[]
): OverviewTaskGroup[] => {
  const replenishmentItems = lowStock.length
    ? lowStock.map(
        (item) => `Проверить остаток SKU ${item.sku} (${item.warehouse}) - ${formatQuantity(item.quantity)} ${item.uom}`
      )
    : ['Все остатки выше порога 10 ед.'];

  const auditItems = staleStock.length
    ? staleStock.map((item) => `Актуализировать данные по SKU ${item.sku} (обновлено ${formatRelative(item.updatedAt)})`)
    : ['Свежести данных достаточно'];

  const coordinationItems = warehouses.slice(1).map((warehouse) => `Согласовать план для склада ${warehouse.name}`);

  if (coordinationItems.length === 0) {
    coordinationItems.push('Добавьте дополнительные склады для координации');
  }

  return [
    { id: 'task-replenishment', title: 'Пополнение', items: replenishmentItems },
    { id: 'task-audit', title: 'Аудит данных', items: auditItems },
    { id: 'task-coordination', title: 'Координация', items: coordinationItems }
  ];
};

const buildOperationStats = (
  warehouses: Warehouse[],
  details?: WarehouseDetails,
  stock: StockItem[] = []
): OperationStatView[] => {
  const activeWarehouses = warehouses.filter((warehouse) => warehouse.status === 'active').length;
  return [
    {
      id: 'stat-warehouses',
      title: 'Склады в работе',
      value: formatNumber(activeWarehouses || warehouses.length),
      note: `${formatNumber(warehouses.length)} всего`
    },
    {
      id: 'stat-zones',
      title: 'Зоны хранения',
      value: formatNumber(details?.zones.length ?? 0),
      note: `${formatNumber(details?.cells.length ?? 0)} ячеек`
    },
    {
      id: 'stat-equipment',
      title: 'Оборудование',
      value: formatNumber(details?.equipment.length ?? 0),
      note: 'Единицы техники WMS'
    },
    {
      id: 'stat-stock',
      title: 'SKU под контролем',
      value: formatNumber(stock.length),
      note: `${formatQuantity(stock.reduce((sum, item) => sum + item.quantity, 0))} ед. на складе`
    }
  ];
};

const selectLowStockItems = (stock: StockItem[]) =>
  stock
    .filter((item) => item.quantity <= LOW_STOCK_THRESHOLD)
    .sort((a, b) => a.quantity - b.quantity);

const selectStaleItems = (stock: StockItem[]) => {
  const threshold = STALE_THRESHOLD_HOURS * 60 * 60 * 1000;
  return stock
    .filter((item) => Date.now() - Date.parse(item.updatedAt) >= threshold)
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
};

const deriveLatestUpdate = (stock: StockItem[]): string | undefined => {
  const latest = stock.reduce<string | undefined>((memo, item) => {
    if (!memo) {
      return item.updatedAt;
    }
    return Date.parse(item.updatedAt) > Date.parse(memo) ? item.updatedAt : memo;
  }, undefined);
  return latest;
};

export const useInventoryDashboardData = (): InventoryDashboardData => {
  const warehousesQuery = useWarehousesQuery({ retry: false });
  const warehouseEntities = useMemo(() => warehousesQuery.data ?? [], [warehousesQuery.data]);

  const stockQuery = useStockQuery(
    { warehouseCode: warehouseEntities[0]?.code ?? '', limit: 200 },
    { retry: false, enabled: warehousesQuery.isSuccess || warehousesQuery.isError }
  );

  const stockItems = useMemo(() => stockQuery.data ?? [], [stockQuery.data]);

  const warehouses = useMemo(() => {
    if (warehouseEntities.length > 0) {
      return warehouseEntities;
    }

    if (stockItems.length === 0) {
      return [] as Warehouse[];
    }

    const byCode = new Map<string, Warehouse>();
    for (const item of stockItems) {
      if (!byCode.has(item.warehouse)) {
        const id = `fallback-${item.warehouse}`;
        const now = new Date().toISOString();
        byCode.set(item.warehouse, {
          id,
          code: item.warehouse,
          name: item.warehouse,
          description: 'Склад из данных инвентаризации',
          address: {},
          timezone: 'UTC',
          status: 'unknown',
          operatingHours: {},
          contact: {},
          metadata: {},
          createdAt: now,
          updatedAt: now
        });
      }
    }

    return Array.from(byCode.values());
  }, [warehouseEntities, stockItems]);

  const selectedWarehouse = warehouses[0];
  const isFallbackWarehouse = warehouseEntities.length === 0 && selectedWarehouse !== undefined;
  const selectedWarehouseId = !isFallbackWarehouse ? selectedWarehouse?.id ?? '' : '';

  const warehouseDetailsQuery = useWarehouseDetailsQuery(selectedWarehouseId, {
    enabled: Boolean(selectedWarehouseId),
    retry: false
  });

  const isLoading =
    warehousesQuery.isLoading ||
    stockQuery.isLoading ||
    (selectedWarehouseId ? warehouseDetailsQuery.isLoading : false);

  const error =
    (stockQuery.error as Error | undefined) ||
    (warehouseDetailsQuery.error as Error | undefined);

  const warehouseDetails = warehouseDetailsQuery.data;

  const lowStockItems = useMemo(() => selectLowStockItems(stockItems), [stockItems]);
  const staleItems = useMemo(() => selectStaleItems(stockItems), [stockItems]);
  const latestUpdatedAt = useMemo(() => deriveLatestUpdate(stockItems), [stockItems]);

  const summaryCards = useMemo<SummaryCard[]>(() => {
    const zonesCount = warehouseDetails?.zones.length ?? 0;
    const cellsCount = warehouseDetails?.cells.length ?? 0;
    const totalQuantity = stockItems.reduce((sum, item) => sum + item.quantity, 0);

    return [
      {
        label: 'Склады',
        value: formatNumber(warehouses.length),
        hint: selectedWarehouse ? `Активный: ${selectedWarehouse.name}` : 'Нет складов'
      },
      {
        label: 'SKU в работе',
        value: formatNumber(stockItems.length),
        hint: `${formatQuantity(totalQuantity)} ед. в выборке`
      },
      {
        label: 'Обновления',
        value: latestUpdatedAt ? formatRelative(latestUpdatedAt) : 'нет',
        hint: latestUpdatedAt ? formatDateTime(latestUpdatedAt) : 'Нет данных'
      },
      {
        label: 'Ячейки',
        value: formatNumber(cellsCount),
        hint: `${formatNumber(zonesCount)} зон`
      }
    ];
  }, [warehouses.length, selectedWarehouse, stockItems, warehouseDetails, latestUpdatedAt]);

  const overviewShift: OverviewShift = useMemo(
    () => ({
      shift: selectedWarehouse?.name ?? 'Смена не выбрана',
      timeframe: selectedWarehouse?.timezone
        ? `Часовой пояс ${selectedWarehouse.timezone}`
        : 'Часовой пояс не указан',
      lead: selectedWarehouse?.contact?.manager ?? 'Менеджер не назначен',
      workforce: selectedWarehouse?.contact?.phone
        ? `Телефон ${selectedWarehouse.contact.phone}`
        : 'Телефон не указан',
      note: warehouseDetails
        ? `Зон ${formatNumber(warehouseDetails.zones.length)}, ячеек ${formatNumber(
            warehouseDetails.cells.length
          )}, техника ${formatNumber(warehouseDetails.equipment.length)}`
        : 'Добавьте топологию склада'
    }),
    [selectedWarehouse, warehouseDetails]
  );

  const overviewFlows = useMemo(
    () => buildOverviewFlows(stockItems, warehouses, warehouseDetails?.zones, latestUpdatedAt),
    [stockItems, warehouses, warehouseDetails?.zones, latestUpdatedAt]
  );

  const overviewAlerts = useMemo(
    () => buildOverviewAlerts(lowStockItems, staleItems, warehouses),
    [lowStockItems, staleItems, warehouses]
  );

  const overviewTaskGroups = useMemo(
    () => buildOverviewTaskGroups(lowStockItems, staleItems, warehouses),
    [lowStockItems, staleItems, warehouses]
  );

  const operationStats = useMemo(
    () => buildOperationStats(warehouses, warehouseDetails, stockItems),
    [warehouses, warehouseDetails, stockItems]
  );

  const stockRows = useMemo(() => buildStockRows(stockItems), [stockItems]);
  const stockHighlights = useMemo(() => buildStockHighlights(stockItems), [stockItems]);
  const supplierCards = useMemo(() => buildSupplierCards(warehouses), [warehouses]);
  const supplierInvoices = useMemo(() => buildSupplierInvoices(stockItems), [stockItems]);
  const supplierContracts = useMemo(() => buildSupplierContracts(warehouses), [warehouses]);
  const inventoryTasks = useMemo(() => buildInventoryTasks(lowStockItems), [lowStockItems]);
  const inventoryProgress = useMemo(
    () => buildInventoryProgress(stockItems, latestUpdatedAt),
    [stockItems, latestUpdatedAt]
  );
  const scanShortcuts = useMemo(() => buildScanShortcuts(), []);
  const journal = useMemo(() => buildJournal(stockItems), [stockItems]);

  const refetch = () => {
    warehousesQuery.refetch();
    stockQuery.refetch();
    if (selectedWarehouseId) {
      warehouseDetailsQuery.refetch();
    }
  };

  return {
    summaryCards,
    overviewShift,
    overviewFlows,
    overviewAlerts,
    overviewTaskGroups,
    operationStats,
    stockRows,
    stockHighlights,
    supplierCards,
    supplierInvoices,
    supplierContracts,
    inventoryTasks,
    inventoryProgress,
    scanShortcuts,
    journalSummary: journal.summary,
    journalItems: journal.items,
    selectedWarehouse,
    allWarehouses: warehouses,
    zones: warehouseDetails?.zones,
    isLoading,
    isError: Boolean(error),
    error,
    refetch
  };
};
