import { useCallback, useEffect, useState } from 'react';

import { WarehouseShell } from '../../layout/WarehouseShell';
import { ListForm } from '../../layout/ListForm/ListForm';
import type { WarehouseColumn, WarehouseFilter } from '../../layout/types';
import { warehouseMenu } from '../../menu/warehouse.menu';
import {
  fetchEndlessPolicies,
  resetEndlessPolicy,
  updateEndlessPolicy,
  type EndlessPolicyRow
} from '../../services/stock.service';

const filters: WarehouseFilter[] = [
  { id: 'warehouse', label: 'Склад', type: 'select' },
  { id: 'policy', label: 'Политика', type: 'select', options: ['MINMAX', 'ROP', 'NONE'].map((value) => ({ value, label: value })) },
  { id: 'item', label: 'Номенклатура', type: 'search', placeholder: 'Код или наименование' }
];

const policyThreshold = (row: EndlessPolicyRow) => {
  if (row.policy === 'MINMAX') {
    return row.min ?? 0;
  }
  if (row.policy === 'ROP') {
    return row.reorderPoint ?? 0;
  }
  return 0;
};

export const EndlessList = () => {
  const [rows, setRows] = useState<EndlessPolicyRow[]>([]);
  const [saving, setSaving] = useState(false);

  const loadRows = useCallback(async () => {
    const data = await fetchEndlessPolicies();
    setRows(data);
  }, []);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const columns: WarehouseColumn<EndlessPolicyRow>[] = [
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
      render: (row) => row.warehouse
    },
    {
      id: 'policy',
      label: 'Политика',
      render: (row) => (
        <select
          value={row.policy}
          onChange={(event) =>
            setRows((prev) =>
              prev.map((entry) =>
                entry.id === row.id
                  ? {
                      ...entry,
                      policy: event.target.value as EndlessPolicyRow['policy']
                    }
                  : entry
              )
            )
          }
        >
          <option value='MINMAX'>MINMAX</option>
          <option value='ROP'>ROP</option>
          <option value='NONE'>NONE</option>
        </select>
      )
    },
    {
      id: 'min',
      label: 'Min',
      render: (row) => (
        <input
          type='number'
          value={row.min ?? ''}
          onChange={(event) =>
            setRows((prev) =>
              prev.map((entry) => (entry.id === row.id ? { ...entry, min: Number(event.target.value) } : entry))
            )
          }
          disabled={row.policy !== 'MINMAX'}
        />
      )
    },
    {
      id: 'max',
      label: 'Max',
      render: (row) => (
        <input
          type='number'
          value={row.max ?? ''}
          onChange={(event) =>
            setRows((prev) =>
              prev.map((entry) => (entry.id === row.id ? { ...entry, max: Number(event.target.value) } : entry))
            )
          }
          disabled={row.policy !== 'MINMAX'}
        />
      )
    },
    {
      id: 'rop',
      label: 'ROP',
      render: (row) => (
        <input
          type='number'
          value={row.reorderPoint ?? ''}
          onChange={(event) =>
            setRows((prev) =>
              prev.map((entry) => (entry.id === row.id ? { ...entry, reorderPoint: Number(event.target.value) } : entry))
            )
          }
          disabled={row.policy !== 'ROP'}
        />
      )
    },
    {
      id: 'safety',
      label: 'Safety',
      render: (row) => (
        <input
          type='number'
          value={row.safetyStock ?? ''}
          onChange={(event) =>
            setRows((prev) =>
              prev.map((entry) => (entry.id === row.id ? { ...entry, safetyStock: Number(event.target.value) } : entry))
            )
          }
        />
      )
    },
    {
      id: 'available',
      label: 'Available',
      align: 'right',
      render: (row) => row.available
    },
    {
      id: 'note',
      label: 'Примечание',
      render: (row) => (
        <input
          type='text'
          value={row.note ?? ''}
          onChange={(event) =>
            setRows((prev) =>
              prev.map((entry) => (entry.id === row.id ? { ...entry, note: event.target.value } : entry))
            )
          }
        />
      )
    }
  ];

  const handleSave = useCallback(async () => {
    setSaving(true);
    for (const row of rows) {
      await updateEndlessPolicy(row);
    }
    setSaving(false);
  }, [rows]);

  const handleReset = useCallback(async () => {
    setSaving(true);
    for (const row of rows) {
      await resetEndlessPolicy(row.id);
    }
    await loadRows();
    setSaving(false);
  }, [loadRows, rows]);

  return (
    <WarehouseShell
      title='Нескончаемые остатки'
      menu={warehouseMenu}
      activePath='/warehouse/stock/endless'
      filters={filters}
      status={`Записей: ${rows.length}`}
      headerActions={
        <>
          <button
            type='button'
            className='warehouse-shell__secondary-action'
            onClick={handleReset}
            disabled={saving}
          >
            Сбросить
          </button>
          <button
            type='button'
            className='warehouse-shell__primary-action'
            onClick={handleSave}
            disabled={saving}
          >
            Сохранить
          </button>
        </>
      }
    >
      <ListForm
        columns={columns}
        rows={rows}
        primaryKey={(row) => row.id}
        getRowClassName={(row) => (row.available <= policyThreshold(row) ? 'list-form__row--critical' : undefined)}
      />
    </WarehouseShell>
  );
};

export default EndlessList;
