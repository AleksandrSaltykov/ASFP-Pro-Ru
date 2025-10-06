import { useCallback, useEffect, useMemo, useState } from 'react';

import { WarehouseShell } from '../../layout/WarehouseShell';
import { ListForm } from '../../layout/ListForm/ListForm';
import type { WarehouseColumn, WarehouseFilter } from '../../layout/types';
import { warehouseMenu } from '../../menu/warehouse.menu';
import { fetchStockMovements, type StockMovementRow } from '../../services/stock.service';

const buildFilters = (rows: StockMovementRow[]): WarehouseFilter[] => {
  const unique = (selector: (row: StockMovementRow) => string) =>
    Array.from(new Set(rows.map(selector))).filter(Boolean).map((value) => ({ value, label: value }));

  return [
    { id: 'period', label: 'Период', type: 'daterange' },
    { id: 'warehouse', label: 'Склад', type: 'select', options: unique((row) => row.to.split('/')[0] ?? '') },
    { id: 'item', label: 'Номенклатура', type: 'search', placeholder: 'Код или наименование' },
    { id: 'type', label: 'Тип документа', type: 'select', options: unique((row) => row.type) }
  ];
};

export const MovementsHistory = () => {
  const [rows, setRows] = useState<StockMovementRow[]>([]);

  const loadRows = useCallback(async () => {
    const data = await fetchStockMovements();
    setRows(data);
  }, []);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const handleRefresh = useCallback(() => {
    void loadRows();
  }, [loadRows]);

  const filters = useMemo(() => buildFilters(rows), [rows]);

  const columns: WarehouseColumn<StockMovementRow>[] = [
    {
      id: 'datetime',
      label: 'Дата/Время',
      render: (row) => new Date(row.occurredAt).toLocaleString('ru-RU')
    },
    { id: 'type', label: 'Тип', render: (row) => row.type },
    {
      id: 'item',
      label: 'Номенклатура',
      render: (row) => (
        <div className='list-form__value'>
          <span className='list-form__title'>{row.itemName}</span>
          <span className='list-form__meta'>{row.itemCode}</span>
        </div>
      )
    },
    { id: 'from', label: 'Откуда', render: (row) => row.from },
    { id: 'to', label: 'Куда', render: (row) => row.to },
    {
      id: 'quantity',
      label: 'Кол-во',
      align: 'right',
      render: (row) => `${row.quantity.toLocaleString('ru-RU')} ${row.uom}`
    },
    { id: 'ref', label: 'Документ', render: (row) => row.reference ?? '—' },
    { id: 'actor', label: 'Пользователь', render: (row) => row.actor ?? '—' },
    { id: 'note', label: 'Примечание', render: (row) => row.note ?? '—' }
  ];

  return (
    <WarehouseShell
      title='История движений'
      menu={warehouseMenu}
      activePath='/warehouse/stock/history'
      filters={filters}
      status={`Операций: ${rows.length}`}
      headerActions={
        <button type='button' className='warehouse-shell__secondary-action' onClick={handleRefresh}>
          Обновить
        </button>
      }
    >
      <ListForm
        columns={columns}
        rows={rows}
        primaryKey={(row) => row.id}
        emptyMessage='Не найдено движений по выбранным условиям'
      />
    </WarehouseShell>
  );
};

export default MovementsHistory;
