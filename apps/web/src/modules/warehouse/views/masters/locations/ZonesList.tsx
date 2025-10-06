import { useEffect, useMemo, useState } from 'react';

import {
  type WarehouseZone,
  useWarehousesQuery,
  useZonesQuery
} from '@shared/api';
import { PageLoader } from '@shared/ui/PageLoader';

import { WarehouseShell } from '../../../layout/WarehouseShell';
import { ListForm } from '../../../layout/ListForm/ListForm';
import type { WarehouseColumn } from '../../../layout/types';
import { warehouseMenu } from '../../../menu/warehouse.menu';
import { EmptyState, QueryErrorState } from '../../components/QueryState';
import { fallbackWarehouses, fallbackZones } from '../fallbacks';
import { formatBoolean, normalizeSearch, shouldUseFallback } from '../utils';

const formatTemperature = (min?: number | null, max?: number | null) => {
  if (min == null && max == null) {
    return '—';
  }
  if (min != null && max != null) {
    return `${min}…${max} °C`;
  }
  if (min != null) {
    return `≥ ${min} °C`;
  }
  return `≤ ${max} °C`;
};

export const ZonesList = () => {
  const warehousesQuery = useWarehousesQuery();
  const useWarehousesFallback = shouldUseFallback(warehousesQuery.error);
  const warehouses = useMemo(() => {
    if (warehousesQuery.data) {
      return warehousesQuery.data;
    }
    if (useWarehousesFallback) {
      return fallbackWarehouses;
    }
    return [];
  }, [warehousesQuery.data, useWarehousesFallback]);

  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>();
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!selectedWarehouseId && warehouses.length > 0) {
      setSelectedWarehouseId(warehouses[0].id);
    }
  }, [warehouses, selectedWarehouseId]);

  const zonesQuery = useZonesQuery(selectedWarehouseId);
  const useZonesFallback = shouldUseFallback(zonesQuery.error);
  const zones = useMemo(() => {
    if (zonesQuery.data) {
      return zonesQuery.data;
    }
    if (useZonesFallback) {
      return fallbackZones.filter((zone) => zone.warehouseId === selectedWarehouseId);
    }
    return [];
  }, [zonesQuery.data, useZonesFallback, selectedWarehouseId]);

  const filtered = useMemo(() => {
    const needle = normalizeSearch(search);
    return zones.filter((zone) => {
      if (!needle) {
        return true;
      }
      const description = zone.metadata && typeof zone.metadata.description === 'string'
        ? normalizeSearch(zone.metadata.description)
        : '';
      return (
        normalizeSearch(zone.name).includes(needle) ||
        normalizeSearch(zone.code).includes(needle) ||
        description.includes(needle) ||
        (zone.zoneType ? normalizeSearch(zone.zoneType).includes(needle) : false)
      );
    });
  }, [zones, search]);

  const columns: WarehouseColumn<WarehouseZone>[] = useMemo(
    () => [
      {
        id: 'code',
        label: 'Код',
        render: (row) => <code>{row.code}</code>
      },
      {
        id: 'name',
        label: 'Наименование',
        render: (row) => (
          <div className='list-form__value'>
            <span className='list-form__title'>{row.name}</span>
            {row.zoneType ? (
              <span className='list-form__meta'>{row.zoneType}</span>
            ) : null}
          </div>
        )
      },
      {
        id: 'buffer',
        label: 'Буфер',
        align: 'center',
        render: (row) => formatBoolean(row.isBuffer)
      },
      {
        id: 'temperature',
        label: 'Температура',
        render: (row) => formatTemperature(row.temperatureMin, row.temperatureMax)
      },
      {
        id: 'access',
        label: 'Ограничения',
        render: (row) => (row.accessRestrictions && row.accessRestrictions.length ? row.accessRestrictions.join(', ') : '—')
      }
    ],
    []
  );

  const renderFilters = () => (
    <div className='filters-panel'>
      <label>
        <span>Склад</span>
        <select
          value={selectedWarehouseId ?? ''}
          onChange={(event) => setSelectedWarehouseId(event.target.value || undefined)}
          disabled={warehousesQuery.isLoading || warehouses.length === 0}
        >
          {warehouses.map((warehouse) => (
            <option key={warehouse.id} value={warehouse.id}>
              {warehouse.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Поиск</span>
        <input
          type='search'
          placeholder='Код или наименование зоны'
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>
    </div>
  );

  const isLoading = warehousesQuery.isLoading || zonesQuery.isLoading;
  const isError = (warehousesQuery.isError && !useWarehousesFallback) || (zonesQuery.isError && !useZonesFallback);
  const errorMessage = warehousesQuery.error?.message ?? zonesQuery.error?.message ?? 'неизвестная ошибка';

  return (
    <WarehouseShell
      title='Складские зоны'
      menu={warehouseMenu}
      activePath='/warehouse/masters/locations/zones'
      status={isLoading ? 'Загрузка…' : `Зон: ${filtered.length}`}
      renderFilters={renderFilters}
      commands={[]}
    >
      {isLoading ? (
        <PageLoader />
      ) : isError ? (
        <QueryErrorState message={`Не удалось загрузить зоны: ${errorMessage}`} />
      ) : filtered.length === 0 ? (
        <EmptyState message={search ? 'Совпадений не найдено' : 'Для выбранного склада зоны не найдены'} />
      ) : (
        <ListForm
          columns={columns}
          rows={filtered}
          primaryKey={(row) => row.id}
          emptyMessage='Зоны не найдены'
        />
      )}
    </WarehouseShell>
  );
};

export default ZonesList;
