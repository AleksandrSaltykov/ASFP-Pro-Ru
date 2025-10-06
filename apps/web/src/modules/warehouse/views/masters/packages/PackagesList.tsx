import { useMemo, useState } from 'react';

import {
  type Item,
  useItemsQuery
} from '@shared/api';
import { PageLoader } from '@shared/ui/PageLoader';

import { WarehouseShell } from '../../../layout/WarehouseShell';
import { ListForm } from '../../../layout/ListForm/ListForm';
import type { WarehouseColumn } from '../../../layout/types';
import { warehouseMenu } from '../../../menu/warehouse.menu';
import { EmptyState, QueryErrorState } from '../../components/QueryState';
import { fallbackItems } from '../fallbacks';
import { normalizeSearch, shouldUseFallback } from '../utils';

type PackageRow = {
  id: string;
  sku: string;
  name: string;
  unit?: string;
  weightKg?: number | null;
  volumeM3?: number | null;
  warehouses: number;
  metadata: Record<string, unknown> | undefined;
};

const buildPackages = (items: Item[]): PackageRow[] =>
  items.map((item) => ({
    id: item.id,
    sku: item.sku,
    name: item.name,
    unit: item.unit?.code ?? item.unitId,
    weightKg: item.weightKg,
    volumeM3: item.volumeM3,
    warehouses: item.warehouseIds?.length ?? 0,
    metadata: item.metadata
  }));

const formatNumber = (value?: number | null, suffix?: string) => {
  if (value == null) {
    return '—';
  }
  const formatted = Number.isInteger(value) ? value.toString() : value.toFixed(2);
  return suffix ? `${formatted} ${suffix}` : formatted;
};

export const PackagesList = () => {
  const itemsQuery = useItemsQuery();
  const [search, setSearch] = useState('');

  const useFallback = shouldUseFallback(itemsQuery.error);

  const packages = useMemo(() => {
    if (itemsQuery.data) {
      return buildPackages(itemsQuery.data);
    }
    if (useFallback) {
      return buildPackages(fallbackItems);
    }
    return [];
  }, [itemsQuery.data, useFallback]);

  const filtered = useMemo(() => {
    const needle = normalizeSearch(search);
    return packages.filter((pkg) => {
      if (!needle) {
        return true;
      }
      return (
        normalizeSearch(pkg.name).includes(needle) ||
        normalizeSearch(pkg.sku).includes(needle) ||
        (pkg.unit ? normalizeSearch(pkg.unit).includes(needle) : false)
      );
    });
  }, [packages, search]);

  const columns: WarehouseColumn<PackageRow>[] = useMemo(
    () => [
      {
        id: 'sku',
        label: 'Артикул',
        render: (row) => <code>{row.sku}</code>
      },
      {
        id: 'name',
        label: 'Наименование',
        render: (row) => row.name
      },
      {
        id: 'unit',
        label: 'Ед. учёта',
        align: 'center',
        render: (row) => row.unit ?? '—'
      },
      {
        id: 'weight',
        label: 'Вес',
        align: 'right',
        render: (row) => formatNumber(row.weightKg, 'кг')
      },
      {
        id: 'volume',
        label: 'Объём',
        align: 'right',
        render: (row) => formatNumber(row.volumeM3, 'м³')
      },
      {
        id: 'warehouses',
        label: 'Склады',
        align: 'center',
        render: (row) => row.warehouses || '—'
      },
      {
        id: 'metadata',
        label: 'Дополнительно',
        render: (row) => {
          if (!row.metadata || Object.keys(row.metadata).length === 0) {
            return '—';
          }
          return (
            <pre className='warehouse-preformatted'>{JSON.stringify(row.metadata, null, 2)}</pre>
          );
        }
      }
    ],
    []
  );

  const renderFilters = () => (
    <div className='filters-panel'>
      <label>
        <span>Поиск</span>
        <input
          type='search'
          placeholder='Наименование или артикул упаковки'
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>
    </div>
  );

  return (
    <WarehouseShell
      title='Упаковки'
      menu={warehouseMenu}
      activePath='/warehouse/masters/packages'
      status={itemsQuery.isLoading ? 'Загрузка…' : `Записей: ${filtered.length}`}
      renderFilters={renderFilters}
      headerActions={
        <button type='button' className='warehouse-shell__secondary-action' onClick={() => itemsQuery.refetch()}>
          Обновить
        </button>
      }
    >
      {itemsQuery.isLoading ? (
        <PageLoader />
      ) : itemsQuery.isError && !useFallback ? (
        <QueryErrorState message={`Не удалось загрузить данные об упаковках: ${itemsQuery.error?.message ?? 'неизвестная ошибка'}`} />
      ) : filtered.length === 0 ? (
        <EmptyState message={search ? 'Совпадений не найдено' : 'В справочнике упаковок пока нет данных'} />
      ) : (
        <ListForm
          columns={columns}
          rows={filtered}
          primaryKey={(row) => row.id}
          emptyMessage='В справочнике упаковок пока нет данных'
        />
      )}
    </WarehouseShell>
  );
};

export default PackagesList;
