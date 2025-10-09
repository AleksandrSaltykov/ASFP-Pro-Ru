import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  type Warehouse,
  useCreateWarehouseMutation,
  useDeleteWarehouseMutation,
  useUpdateWarehouseMutation,
  useWarehousesQuery
} from '@shared/api';
import { PageLoader } from '@shared/ui/PageLoader';

import { WarehouseShell } from '../../../layout/WarehouseShell';
import { ListForm } from '../../../layout/ListForm/ListForm';
import type { WarehouseColumn } from '../../../layout/types';
import { warehouseMenu } from '../../../menu/warehouse.menu';
import { EmptyState, QueryErrorState } from '../../components/QueryState';
import { fallbackWarehouses } from '../fallbacks';
import { formatDateTime, normalizeSearch, shouldUseFallback } from '../utils';
import { WarehouseEditorDrawer, type WarehouseEditorSubmitPayload } from './WarehouseEditorDrawer';

const cloneWarehouse = (warehouse: Warehouse): Warehouse => ({
  ...warehouse,
  address: warehouse.address ? { ...warehouse.address } : {},
  operatingHours: warehouse.operatingHours ? { ...warehouse.operatingHours } : {},
  contact: warehouse.contact ? { ...warehouse.contact } : {},
  metadata: warehouse.metadata ? { ...warehouse.metadata } : undefined
});

const formatAddress = (address: Warehouse['address']) => {
  if (!address) {
    return '—';
  }
  const parts = [address.city, address.street, address.building].filter(Boolean);
  if (parts.length === 0) {
    return '—';
  }
  return parts.join(', ');
};

export const WarehousesList = () => {
  const warehousesQuery = useWarehousesQuery();
  const createMutation = useCreateWarehouseMutation();
  const updateMutation = useUpdateWarehouseMutation();
  const deleteMutation = useDeleteWarehouseMutation();
  const [localWarehouses, setLocalWarehouses] = useState<Warehouse[]>(() => fallbackWarehouses.map(cloneWarehouse));
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('create');
  const [formError, setFormError] = useState<string | null>(null);

  const useFallback = shouldUseFallback(warehousesQuery.error);

  const warehouses = useMemo(() => {
    if (warehousesQuery.data) {
      return warehousesQuery.data;
    }
    if (useFallback) {
      return localWarehouses;
    }
    return [];
  }, [warehousesQuery.data, useFallback, localWarehouses]);

  useEffect(() => {
    if (warehouses.length === 0) {
      setSelectedWarehouseId(null);
      return;
    }
    if (selectedWarehouseId && !warehouses.some((entry) => entry.id === selectedWarehouseId)) {
      setSelectedWarehouseId(null);
    }
  }, [warehouses, selectedWarehouseId]);

  const selectedWarehouse = useMemo(
    () => (selectedWarehouseId ? warehouses.find((entry) => entry.id === selectedWarehouseId) ?? null : null),
    [warehouses, selectedWarehouseId]
  );

  const statusOptions = useMemo(() => {
    return Array.from(new Set(warehouses.map((warehouse) => warehouse.status || 'unknown')))
      .filter(Boolean)
      .map((status) => ({ value: status, label: status.toUpperCase() }));
  }, [warehouses]);

  const filtered = useMemo(() => {
    const needle = normalizeSearch(search);
    return warehouses.filter((warehouse) => {
      if (statusFilter !== 'all' && (warehouse.status ?? 'unknown') !== statusFilter) {
        return false;
      }
      if (!needle) {
        return true;
      }
      const description = warehouse.description ? normalizeSearch(warehouse.description) : '';
      const address = normalizeSearch(formatAddress(warehouse.address));
      return (
        normalizeSearch(warehouse.name).includes(needle) ||
        normalizeSearch(warehouse.code).includes(needle) ||
        description.includes(needle) ||
        address.includes(needle)
      );
    });
  }, [warehouses, search, statusFilter]);

  const handleCreateClick = useCallback(() => {
    setSelectedWarehouseId(null);
    setDrawerMode('create');
    setFormError(null);
    setDrawerOpen(true);
  }, []);

  const handleEditRow = useCallback((warehouse: Warehouse) => {
    setSelectedWarehouseId(warehouse.id);
    setDrawerMode('edit');
    setFormError(null);
    setDrawerOpen(true);
  }, []);

  const handleDeleteRow = useCallback(
    async (warehouse: Warehouse) => {
      const confirmed = window.confirm(`Удалить склад «${warehouse.name}»?`);
      if (!confirmed) {
        return;
      }
      try {
        if (useFallback) {
          setLocalWarehouses((prev) => prev.filter((entry) => entry.id !== warehouse.id));
        } else {
          await deleteMutation.mutateAsync(warehouse.id);
          await warehousesQuery.refetch();
        }
        setSelectedWarehouseId((current) => (current === warehouse.id ? null : current));
      } catch (error) {
        window.alert(`Не удалось удалить склад: ${(error as Error).message}`);
      }
    },
    [deleteMutation, useFallback, warehousesQuery]
  );

  const columns: WarehouseColumn<Warehouse>[] = useMemo(
    () => [
      {
        id: 'name',
        label: 'Название',
        render: (row) => (
          <div className='list-form__value'>
            <span className='list-form__title list-form__title--strong'>{row.name}</span>
            {row.description ? (
              <span className='list-form__meta'>{row.description}</span>
            ) : null}
          </div>
        )
      },
      {
        id: 'status',
        label: 'Статус',
        align: 'center',
        render: (row) => row.status?.toUpperCase() ?? 'UNKNOWN'
      },
      {
        id: 'address',
        label: 'Адрес',
        render: (row) => formatAddress(row.address)
      },
      {
        id: 'contact',
        label: 'Контакты',
        render: (row) => {
          const contact = row.contact;
          if (!contact) {
            return '—';
          }
          const info = [contact.manager, contact.phone, contact.email].filter(Boolean);
          if (!info.length) {
            return '—';
          }
          return (
            <div className='list-form__value'>
              {info.map((entry) => (
                <span key={entry} className='list-form__meta'>
                  {entry}
                </span>
              ))}
            </div>
          );
        }
      },
      {
        id: 'updatedAt',
        label: 'Обновлено',
        render: (row) => formatDateTime(row.updatedAt)
      },
      {
        id: 'actions',
        label: '',
        align: 'center',
        render: (row) => (
          <div className='list-form__actions'>
            <button
              type='button'
              className='list-form__icon-button list-form__icon-button--edit'
              onClick={(event) => {
                event.stopPropagation();
                handleEditRow(row);
              }}
              aria-label={`Редактировать «${row.name}»`}
              title='Редактировать'
            >
              ✶
            </button>
            <button
              type='button'
              className='list-form__icon-button list-form__icon-button--delete'
              onClick={async (event) => {
                event.stopPropagation();
                await handleDeleteRow(row);
              }}
              aria-label={`Удалить «${row.name}»`}
              title='Удалить'
            >
              ✶
            </button>
          </div>
        )
      }
    ],
    [handleDeleteRow, handleEditRow]
  );

  const renderFilters = () => (
    <div className='filters-panel'>
      <label>
        <span>Поиск</span>
        <input
          type='search'
          placeholder='Код, наименование или адрес'
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>
      <label>
        <span>Статус</span>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value='all'>Все</option>
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );


  const handleDrawerClose = () => {
    if (createMutation.isPending || updateMutation.isPending) {
      return;
    }
    setDrawerOpen(false);
    setFormError(null);
  };

  const handleDrawerSubmit = async ({ payload, warehouseId }: WarehouseEditorSubmitPayload) => {
    try {
      if (useFallback) {
        const nowIso = new Date().toISOString();
        if (drawerMode === 'create') {
          const generatedId =
            typeof crypto !== 'undefined' && 'randomUUID' in crypto
              ? crypto.randomUUID()
              : `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
          const created: Warehouse = {
            id: generatedId,
            code: payload.code,
            name: payload.name,
            description: payload.description,
            address: payload.address ?? {},
            timezone: payload.timezone ?? 'Europe/Moscow',
            status: payload.status ?? 'active',
            operatingHours: payload.operatingHours ?? {},
            contact: payload.contact ?? {},
            metadata: payload.metadata,
            createdBy: null,
            updatedBy: null,
            createdAt: nowIso,
            updatedAt: nowIso
          };
          setLocalWarehouses((prev) => [cloneWarehouse(created), ...prev]);
          setSelectedWarehouseId(created.id);
        } else {
          const targetId = warehouseId ?? selectedWarehouse?.id;
          if (!targetId) {
            throw new Error('Не выбрана запись для изменения');
          }
          setLocalWarehouses((prev) =>
            prev.map((entry) =>
              entry.id === targetId
                ? cloneWarehouse({
                    ...entry,
                    ...payload,
                    code: payload.code,
                    name: payload.name,
                    description: payload.description,
                    address: payload.address ?? {},
                    timezone: payload.timezone ?? entry.timezone,
                    status: payload.status ?? entry.status,
                    operatingHours: payload.operatingHours ?? {},
                    contact: payload.contact ?? {},
                    metadata: payload.metadata,
                    updatedAt: nowIso
                  })
                : entry
            )
          );
          setSelectedWarehouseId(targetId);
        }
      } else {
        if (drawerMode === 'create') {
          const created = await createMutation.mutateAsync(payload);
          setSelectedWarehouseId(created.id);
        } else {
          const targetId = warehouseId ?? selectedWarehouse?.id;
          if (!targetId) {
            throw new Error('Не выбрана запись для изменения');
          }
          const updated = await updateMutation.mutateAsync({ warehouseId: targetId, payload });
          setSelectedWarehouseId(updated.id);
        }
        await warehousesQuery.refetch();
      }
      setDrawerOpen(false);
      setFormError(null);
    } catch (submitError) {
      const message = (submitError as Error).message;
      setFormError(message);
      throw submitError;
    }
  };

  return (
    <WarehouseShell
      title='Склады'
      menu={warehouseMenu}
      activePath='/warehouse/masters/locations/warehouses'
      status={warehousesQuery.isLoading ? 'Загрузка…' : `Записей: ${filtered.length}`}
      renderFilters={renderFilters}
      commands={[]}
      headerActions={
        <button type='button' className='warehouse-shell__primary-action' onClick={handleCreateClick}>
          Создать
        </button>
      }
    >
      {warehousesQuery.isLoading ? (
        <PageLoader />
      ) : warehousesQuery.isError && !useFallback ? (
        <QueryErrorState message={`Не удалось загрузить склады: ${warehousesQuery.error?.message ?? 'неизвестная ошибка'}`} />
      ) : filtered.length === 0 ? (
        <EmptyState message={search || statusFilter !== 'all' ? 'Совпадений не найдено' : 'Справочник складов пуст'} />
      ) : (
        <ListForm
          columns={columns}
          rows={filtered}
          primaryKey={(row) => row.id}
          emptyMessage='Справочник складов пуст'
          selectedKey={selectedWarehouseId ?? undefined}
          onRowClick={(row) => setSelectedWarehouseId((row as Warehouse).id)}
        />
      )}

      <WarehouseEditorDrawer
        open={drawerOpen}
        mode={drawerMode}
        warehouse={drawerMode === 'edit' ? selectedWarehouse : null}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        error={formError ?? undefined}
        onClose={handleDrawerClose}
        onSubmit={handleDrawerSubmit}
        onErrorDismiss={() => setFormError(null)}
      />
    </WarehouseShell>
  );
};

export default WarehousesList;
