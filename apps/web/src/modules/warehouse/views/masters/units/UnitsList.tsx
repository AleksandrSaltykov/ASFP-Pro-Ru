import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  type CatalogNode,
  useCatalogNodesQuery,
  useCreateCatalogNodeMutation,
  useDeleteCatalogNodeMutation,
  useUpdateCatalogNodeMutation
} from '@shared/api';
import { PageLoader } from '@shared/ui/PageLoader';
import { iconMap } from '@shared/ui/icons';

import { WarehouseShell } from '../../../layout/WarehouseShell';
import { ListForm } from '../../../layout/ListForm/ListForm';
import type { WarehouseColumn } from '../../../layout/types';
import { warehouseMenu } from '../../../menu/warehouse.menu';
import { EmptyState, QueryErrorState } from '../../components/QueryState';
import { fallbackUnits } from '../fallbacks';
import { formatBoolean, formatDateTime, normalizeSearch, shouldUseFallback } from '../utils';
import { UnitEditorDrawer, type UnitEditorSubmitPayload } from '../components/UnitEditorDrawer';

export const UnitsList = () => {
  const unitsQuery = useCatalogNodesQuery('unit');
  const [search, setSearch] = useState('');
  const [onlyActive, setOnlyActive] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('create');
  const [formError, setFormError] = useState<string | null>(null);

  const useFallback = shouldUseFallback(unitsQuery.error);
  const createMutation = useCreateCatalogNodeMutation();
  const updateMutation = useUpdateCatalogNodeMutation();
  const deleteMutation = useDeleteCatalogNodeMutation();

  const units = useMemo(() => {
    if (unitsQuery.data) {
      return unitsQuery.data;
    }
    if (useFallback) {
      return fallbackUnits;
    }
    return [];
  }, [unitsQuery.data, useFallback]);

  useEffect(() => {
    if (!selectedUnitId) {
      return;
    }
    if (!units.some((unit) => unit.id === selectedUnitId)) {
      setSelectedUnitId(null);
    }
  }, [units, selectedUnitId]);

  const filtered = useMemo(() => {
    const needle = normalizeSearch(search);
    return units.filter((unit) => {
      if (onlyActive && !unit.isActive) {
        return false;
      }
      if (!needle) {
        return true;
      }
      const description = unit.description ? normalizeSearch(unit.description) : '';
      return (
        normalizeSearch(unit.name).includes(needle) ||
        normalizeSearch(unit.code).includes(needle) ||
        description.includes(needle)
      );
    });
  }, [units, search, onlyActive]);

  const renderFilters = () => (
    <div className='filters-panel'>
      <label>
        <span>Поиск</span>
        <input
          type='search'
          placeholder='Код или наименование единицы'
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>
      <label>
        <span>Только активные</span>
        <input
          type='checkbox'
          checked={onlyActive}
          onChange={(event) => setOnlyActive(event.target.checked)}
        />
      </label>
    </div>
  );

  const selectedUnit = useMemo(
    () => (selectedUnitId ? units.find((unit) => unit.id === selectedUnitId) ?? null : null),
    [units, selectedUnitId]
  );

  const handleCreateClick = useCallback(() => {
    setSelectedUnitId(null);
    setDrawerMode('create');
    setFormError(null);
    setDrawerOpen(true);
  }, []);

  const handleEditRow = useCallback((unit: CatalogNode) => {
    setSelectedUnitId(unit.id);
    setDrawerMode('edit');
    setFormError(null);
    setDrawerOpen(true);
  }, []);

const handleDeleteRow = useCallback(
  async (unit: CatalogNode) => {
    const confirmed = window.confirm(`Удалить единицу «${unit.name}»?`);
    if (!confirmed) {
      return;
      }
      try {
        await deleteMutation.mutateAsync({ catalogType: 'unit', nodeId: unit.id });
        setSelectedUnitId((current) => (current === unit.id ? null : current));
        await unitsQuery.refetch();
      } catch (error) {
        window.alert((error as Error).message);
      }
    },
  [deleteMutation, unitsQuery]
);

  const columns: WarehouseColumn<CatalogNode>[] = useMemo(
    () => [
      {
        id: 'name',
        label: 'Наименование',
        render: (row) => (
          <div className='list-form__value'>
            <span className='list-form__title list-form__title--strong'>{row.name}</span>
            {row.description ? <span className='list-form__meta'>{row.description}</span> : null}
          </div>
        )
      },
      {
        id: 'isActive',
        label: 'Активно',
        align: 'center',
        render: (row) => formatBoolean(row.isActive)
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
              <span className='list-form__icon'>{iconMap.gear}</span>
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
              <span className='list-form__icon'>×</span>
            </button>
          </div>
        )
      }
    ],
    [handleDeleteRow, handleEditRow]
  );

  const handleDrawerClose = () => {
    if (createMutation.isPending || updateMutation.isPending) {
      return;
    }
    setDrawerOpen(false);
    setFormError(null);
  };

  const handleDrawerSubmit = async ({ payload, nodeId }: UnitEditorSubmitPayload) => {
    try {
      if (drawerMode === 'create') {
        const created = await createMutation.mutateAsync({ catalogType: 'unit', payload });
        setSelectedUnitId(created.id);
      } else {
        const targetId = nodeId ?? selectedUnit?.id;
        if (!targetId) {
          throw new Error('Не выбрана запись для изменения');
        }
        const updated = await updateMutation.mutateAsync({ catalogType: 'unit', nodeId: targetId, payload });
        setSelectedUnitId(updated.id);
      }
      setDrawerOpen(false);
      setFormError(null);
    } catch (submitError) {
      setFormError((submitError as Error).message);
      throw submitError;
    }
  };

  return (
    <WarehouseShell
      title='Единицы измерения'
      menu={warehouseMenu}
      activePath='/warehouse/masters/items/units'
      status={unitsQuery.isLoading ? 'Загрузка…' : `Записей: ${filtered.length}`}
      renderFilters={renderFilters}
      commands={[]}
      headerActions={
        <button type='button' className='warehouse-shell__primary-action' onClick={handleCreateClick}>
          Создать
        </button>
      }
    >
      {unitsQuery.isLoading ? (
        <PageLoader />
      ) : unitsQuery.isError && !useFallback ? (
        <QueryErrorState message={`Не удалось загрузить единицы измерения: ${unitsQuery.error?.message ?? 'неизвестная ошибка'}`} />
      ) : filtered.length === 0 ? (
        <EmptyState message={search || onlyActive ? 'Совпадений не найдено' : 'Справочник единиц пуст'} />
      ) : (
        <ListForm
          columns={columns}
          rows={filtered}
          primaryKey={(row) => row.id}
          emptyMessage='Справочник единиц пуст'
          selectedKey={selectedUnitId ?? undefined}
          onRowClick={(row) => setSelectedUnitId((row as CatalogNode).id)}
        />
      )}

      <UnitEditorDrawer
        open={drawerOpen}
        mode={drawerMode}
        node={drawerMode === 'edit' ? selectedUnit : null}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        error={formError ?? undefined}
        onSubmit={handleDrawerSubmit}
        onClose={handleDrawerClose}
        onErrorDismiss={() => setFormError(null)}
      />
    </WarehouseShell>
  );
};

export default UnitsList;
