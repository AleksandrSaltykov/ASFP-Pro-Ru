import { useCallback, useEffect, useMemo, useState } from 'react';

import { WarehouseShell } from '../../layout/WarehouseShell';
import { ListForm } from '../../layout/ListForm/ListForm';
import type { WarehouseColumn, WarehouseFilter } from '../../layout/types';
import { warehouseMenu } from '../../menu/warehouse.menu';
import { fetchStockBalances, type StockBalanceRow } from '../../services/stock.service';

const filtersFromRows = (rows: StockBalanceRow[]): WarehouseFilter[] => {
  const unique = (selector: (row: StockBalanceRow) => string) =>
    Array.from(new Set(rows.map(selector))).filter(Boolean).map((value) => ({ value, label: value }));

  return [
    { id: 'warehouse', label: 'Склад', type: 'select', options: unique((row) => row.warehouse) },
    { id: 'zone', label: 'Зона', type: 'select', options: unique((row) => row.zone) },
    { id: 'bin', label: 'Ячейка', type: 'select', options: unique((row) => row.bin) },
    { id: 'category', label: 'Категория', type: 'select', options: [] },
    { id: 'item', label: 'Номенклатура', type: 'search', placeholder: 'Код или наименование' },
    { id: 'onlyZero', label: 'Только ≤0', type: 'checkbox' }
  ];
};

export const BalancesList = () => {
  const [rows, setRows] = useState<StockBalanceRow[]>([]);

  const loadRows = useCallback(async () => {
    const data = await fetchStockBalances();
    setRows(data);
  }, []);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const handleRefresh = useCallback(() => {
    void loadRows();
  }, [loadRows]);

  const filters = useMemo(() => filtersFromRows(rows), [rows]);

  const columns: WarehouseColumn<StockBalanceRow>[] = [
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
      id: 'warehouse',
      label: 'Склад',
      render: (row) => (
        <div className='list-form__value'>
          <span className='list-form__title'>{row.warehouse}</span>
          <span className='list-form__meta'>{row.zone}</span>
        </div>
      )
    },
    { id: 'bin', label: 'Ячейка', render: (row) => row.bin },
    {
      id: 'onHand',
      label: 'OnHand',
      align: 'right',
      render: (row) => (
        <span>
          {row.onHand.toLocaleString('ru-RU')} {row.uom}
        </span>
      )
    },
    {
      id: 'updated',
      label: 'Обновлено',
      render: (row) => new Date(row.updatedAt).toLocaleString('ru-RU')
    }
  ];

  return (
    <WarehouseShell
      title='Остатки на складах'
      menu={warehouseMenu}
      activePath='/warehouse/stock/balances'
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
        emptyMessage='Нет остатков по заданному отбору'
      />
    </WarehouseShell>
  );
};

export default BalancesList;
