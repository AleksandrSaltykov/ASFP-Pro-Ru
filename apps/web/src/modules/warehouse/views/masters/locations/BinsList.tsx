import { useEffect, useMemo, useState } from 'react';

import {
  type WarehouseCell,
  type WarehouseZone,
  useCellsQuery,
  useWarehousesQuery,
  useZonesQuery
} from '@shared/api';
import { PageLoader } from '@shared/ui/PageLoader';

import { WarehouseShell } from '../../../layout/WarehouseShell';
import { ListForm } from '../../../layout/ListForm/ListForm';
import type { WarehouseColumn } from '../../../layout/types';
import { warehouseMenu } from '../../../menu/warehouse.menu';
import { EmptyState, QueryErrorState } from '../../components/QueryState';
import { fallbackCells, fallbackWarehouses, fallbackZones } from '../fallbacks';
import { formatBoolean, normalizeSearch, shouldUseFallback } from '../utils';

const formatAddress = (address?: Record<string, unknown>) => {
  if (!address) {
    return '—';
  }
  const parts: string[] = [];
  for (const [key, value] of Object.entries(address)) {
    if (value == null) {
      continue;
    }
    parts.push(`${key}: ${value}`);
  }
  return parts.length ? parts.join('; ') : '—';
};

const formatCapacity = (cell: WarehouseCell) => {
  const parts: string[] = [];
  if (cell.maxWeightKg != null) {
    parts.push(`${cell.maxWeightKg} кг`);
  }
  if (cell.maxVolumeL != null) {
    parts.push(`${cell.maxVolumeL} л`);
  }
  if (parts.length === 0) {
    return '—';
  }
  return parts.join(' · ');
};

export const BinsList = () => {
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
  const [selectedZoneId, setSelectedZoneId] = useState<string | undefined>();
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

  useEffect(() => {
    if (zones.length === 0) {
      setSelectedZoneId(undefined);
      return;
    }
    if (!selectedZoneId || !zones.some((zone) => zone.id === selectedZoneId)) {
      setSelectedZoneId(zones[0].id);
    }
  }, [zones, selectedZoneId]);

  const cellsQuery = useCellsQuery(selectedWarehouseId, selectedZoneId);
  const useCellsFallback = shouldUseFallback(cellsQuery.error);
  const cells = useMemo(() => {
    if (cellsQuery.data) {
      return cellsQuery.data;
    }
    if (useCellsFallback) {
      return fallbackCells.filter((cell) => {
        if (selectedWarehouseId && cell.warehouseId !== selectedWarehouseId) {
          return false;
        }
        if (selectedZoneId && cell.zoneId !== selectedZoneId) {
          return false;
        }
        return true;
      });
    }
    return [];
  }, [cellsQuery.data, useCellsFallback, selectedWarehouseId, selectedZoneId]);

  const filtered = useMemo(() => {
    const needle = normalizeSearch(search);
    return cells.filter((cell) => {
      if (!needle) {
        return true;
      }
      const address = normalizeSearch(formatAddress(cell.address));
      return (
        normalizeSearch(cell.code).includes(needle) ||
        (cell.label ? normalizeSearch(cell.label).includes(needle) : false) ||
        normalizeSearch(cell.cellType).includes(needle) ||
        normalizeSearch(cell.status).includes(needle) ||
        address.includes(needle)
      );
    });
  }, [cells, search]);

  const zoneLookup = useMemo(() => {
    const map = new Map<string, WarehouseZone>();
    zones.forEach((zone) => map.set(zone.id, zone));
    return map;
  }, [zones]);

  const columns: WarehouseColumn<WarehouseCell>[] = useMemo(
    () => [
      {
        id: 'code',
        label: 'Адрес',
        render: (row) => <code>{row.code}</code>
      },
      {
        id: 'label',
        label: 'Наименование',
        render: (row) => row.label ?? '—'
      },
      {
        id: 'zone',
        label: 'Зона',
        render: (row) => zoneLookup.get(row.zoneId)?.name ?? row.zoneId
      },
      {
        id: 'type',
        label: 'Тип',
        render: (row) => row.cellType
      },
      {
        id: 'status',
        label: 'Статус',
        render: (row) => row.status
      },
      {
        id: 'pickFace',
        label: 'Отборочная',
        align: 'center',
        render: (row) => formatBoolean(row.isPickFace)
      },
      {
        id: 'capacity',
        label: 'Вместимость',
        render: (row) => formatCapacity(row)
      },
      {
        id: 'address',
        label: 'Детали адреса',
        render: (row) => formatAddress(row.address)
      }
    ],
    [zoneLookup]
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
        <span>Зона</span>
        <select
          value={selectedZoneId ?? ''}
          onChange={(event) => setSelectedZoneId(event.target.value || undefined)}
          disabled={zonesQuery.isLoading || zones.length === 0}
        >
          {zones.map((zone) => (
            <option key={zone.id} value={zone.id}>
              {zone.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Поиск</span>
        <input
          type='search'
          placeholder='Код, тип или статус ячейки'
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>
    </div>
  );

  const isLoading = warehousesQuery.isLoading || zonesQuery.isLoading || cellsQuery.isLoading;
  const isError =
    (warehousesQuery.isError && !useWarehousesFallback) ||
    (zonesQuery.isError && !useZonesFallback) ||
    (cellsQuery.isError && !useCellsFallback);
  const errorMessage =
    warehousesQuery.error?.message ?? zonesQuery.error?.message ?? cellsQuery.error?.message ?? 'неизвестная ошибка';


  return (
    <WarehouseShell
      title='Ячейки хранения'
      menu={warehouseMenu}
      activePath='/warehouse/masters/locations/bins'
      commands={[]}
      status={isLoading ? 'Загрузка…' : `Ячеек: ${filtered.length}`}
      renderFilters={renderFilters}
    >
      {isLoading ? (
        <PageLoader />
      ) : isError ? (
        <QueryErrorState message={`Не удалось загрузить ячейки: ${errorMessage}`} />
      ) : filtered.length === 0 ? (
        <EmptyState message={search ? 'Совпадений не найдено' : 'Для выбранной зоны ячейки не найдены'} />
      ) : (
        <ListForm
          columns={columns}
          rows={filtered}
          primaryKey={(row) => row.id}
          emptyMessage='Ячейки не найдены'
        />
      )}
    </WarehouseShell>
  );
};

export default BinsList;
