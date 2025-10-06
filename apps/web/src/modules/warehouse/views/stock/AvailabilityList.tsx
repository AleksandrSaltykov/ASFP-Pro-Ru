import { useCallback, useEffect, useMemo, useState } from 'react';

import { WarehouseShell } from '../../layout/WarehouseShell';
import { ListForm } from '../../layout/ListForm/ListForm';
import type { WarehouseColumn, WarehouseFilter } from '../../layout/types';
import { warehouseMenu } from '../../menu/warehouse.menu';
import { fetchStockAvailability, type StockAvailabilityRow } from '../../services/stock.service';

const buildFilters = (rows: StockAvailabilityRow[]): WarehouseFilter[] => {
  const unique = (selector: (row: StockAvailabilityRow) => string) =>
    Array.from(new Set(rows.map(selector))).filter(Boolean).map((value) => ({ value, label: value }));

  return [
    { id: 'warehouse', label: 'Склад', type: 'select', options: unique((row) => row.warehouse) },
    { id: 'category', label: 'Категория', type: 'select', options: [] },
    { id: 'item', label: 'Номенклатура', type: 'search', placeholder: 'Код или наименование' }
  ];
};

export const AvailabilityList = () => {
  const [rows, setRows] = useState<StockAvailabilityRow[]>([]);

  const loadRows = useCallback(async () => {
    const data = await fetchStockAvailability();
    setRows(data);
  }, []);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const handleRefresh = useCallback(() => {
    void loadRows();
  }, [loadRows]);

  const filters = useMemo(() => buildFilters(rows), [rows]);

  const columns: WarehouseColumn<StockAvailabilityRow>[] = [
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
    {
      id: 'onHand',
      label: 'OnHand',
      align: 'right',
      render: (row) => `${row.onHand.toLocaleString('ru-RU')} ${row.uom}`
    },
    {
      id: 'reserved',
      label: 'Reserved',
      align: 'right',
      render: (row) => `${row.reserved.toLocaleString('ru-RU')} ${row.uom}`
    },
    {
      id: 'onOrder',
      label: 'OnOrder',
      align: 'right',
      render: (row) => `${row.onOrder.toLocaleString('ru-RU')} ${row.uom}`
    },
    {
      id: 'available',
      label: 'Available',
      align: 'right',
      render: (row) => (
        <strong>{`${row.available.toLocaleString('ru-RU')} ${row.uom}`}</strong>
      )
    }
  ];

  return (
    <WarehouseShell
      title='Доступность запасов'
      menu={warehouseMenu}
      activePath='/warehouse/stock/availability'
      filters={filters}
      status={`Записей: ${rows.length}`}
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
        emptyMessage='Нет записей о доступности'
      />
    </WarehouseShell>
  );
};

export default AvailabilityList;
