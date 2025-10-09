import type { WarehouseMenuNode } from '../layout/types';

export const warehouseMenu: WarehouseMenuNode[] = [
  {
    id: 'operations',
    label: 'Операции склада',
    children: [
      { id: 'operations-receiving', label: 'Приемка', path: '/warehouse/inbound/receipts' },
      { id: 'operations-move', label: 'Перемещение', path: '/warehouse/moves/internal' },
      { id: 'operations-kitting', label: 'Комплектовка', path: '/warehouse/picking/tasks' },
      { id: 'operations-shipping', label: 'Отгрузка клиенту', path: '/warehouse/shipping/docs' },
      { id: 'operations-inventory', label: 'Инвентаризация', path: '/warehouse/inventory/plans' },
      { id: 'operations-reservations', label: 'Резервирование', path: '/warehouse/reserve/reservations' }
    ]
  },
  {
    id: 'masters',
    label: 'Справочники',
    children: [
      { id: 'masters-overview', label: 'Обзор', path: '/warehouse/masters' },
      { id: 'masters-items', label: 'Номенклатура', path: '/warehouse/masters/items' },
      { id: 'masters-units', label: 'Единицы измерения', path: '/warehouse/masters/items/units' },
      { id: 'masters-warehouses', label: 'Склады', path: '/warehouse/masters/locations/warehouses' },
      { id: 'masters-partners', label: 'Поставщики', path: '/warehouse/masters/partners' }
    ]
  },
  {
    id: 'stock',
    label: 'Запасы',
    children: [
      { id: 'stock-balances', label: 'Остатки', path: '/warehouse/stock/balances' },
      { id: 'stock-availability', label: 'Доступность', path: '/warehouse/stock/availability' },
      { id: 'stock-endless', label: 'Нескончаемые остатки', path: '/warehouse/stock/endless' },
      { id: 'stock-history', label: 'История движений', path: '/warehouse/stock/history' }
    ]
  },
  {
    id: 'reports',
    label: 'Отчёты',
    children: [
      { id: 'reports-balances-movements', label: 'Остатки и движения', path: '/warehouse/reports/kpis' },
      { id: 'reports-turnover-loss', label: 'Оборачиваемость и потери', path: '/warehouse/reports/turnover' },
      { id: 'reports-kpi', label: 'KPI отбора', path: '/warehouse/reports/load' }
    ]
  },
  {
    id: 'service',
    label: 'Сервис',
    children: [
      { id: 'service-import', label: 'Импорт/Экспорт', path: '/warehouse/service/import-export' },
      { id: 'service-settings', label: 'Настройки', path: '/warehouse/service/settings' },
      { id: 'service-devices', label: 'Устройства', path: '/warehouse/service/devices' }
    ]
  }
];
