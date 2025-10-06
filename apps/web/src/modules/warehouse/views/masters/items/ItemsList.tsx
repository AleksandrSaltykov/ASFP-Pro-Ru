import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  type CatalogNode,
  type Item,
  type Warehouse,
  useCatalogNodesQuery,
  useCreateCatalogNodeMutation,
  useCreateItemMutation,
  useDeleteCatalogNodeMutation,
  useDeleteItemMutation,
  useItemsQuery,
  useUpdateCatalogNodeMutation,
  useUpdateItemMutation,
  useWarehousesQuery
} from '@shared/api';
import { PageLoader } from '@shared/ui/PageLoader';

import { WarehouseShell } from '../../../layout/WarehouseShell';
import { ListForm } from '../../../layout/ListForm/ListForm';
import type { WarehouseColumn } from '../../../layout/types';
import { warehouseMenu } from '../../../menu/warehouse.menu';
import { QueryErrorState } from '../../components/QueryState';
import { fallbackCategories, fallbackItems, fallbackUnits, fallbackWarehouses } from '../fallbacks';
import { formatDateTime, normalizeSearch, shouldUseFallback } from '../utils';
import { ItemEditorDrawer, type ItemEditorSubmitPayload } from './ItemEditorDrawer';
import { CategoryEditorDrawer, type CategoryEditorSubmitPayload } from '../components/CategoryEditorDrawer';
import { CategoryHierarchyModal } from './components/CategoryHierarchyModal';

export const ItemsList = () => {
  const itemsQuery = useItemsQuery();
  const categoriesQuery = useCatalogNodesQuery('category');
  const unitsQuery = useCatalogNodesQuery('unit');
  const warehousesQuery = useWarehousesQuery();

  const createMutation = useCreateItemMutation();
  const updateMutation = useUpdateItemMutation();
  const deleteMutation = useDeleteItemMutation();
  const createCategoryMutation = useCreateCatalogNodeMutation();
  const updateCategoryMutation = useUpdateCatalogNodeMutation();
  const deleteCategoryMutation = useDeleteCatalogNodeMutation();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [unitFilter, setUnitFilter] = useState('all');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('create');
  const [formError, setFormError] = useState<string | null>(null);
  const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryModalMode, setCategoryModalMode] = useState<'manage' | 'select'>('manage');
  const [categorySelectResolver, setCategorySelectResolver] = useState<((node: CatalogNode | null) => void) | null>(null);
  const [categoryModalSelectedId, setCategoryModalSelectedId] = useState<string | null>(null);
  const [categoryDrawerOpen, setCategoryDrawerOpen] = useState(false);
  const [categoryDrawerMode, setCategoryDrawerMode] = useState<'create' | 'edit'>('create');
  const [categoryDrawerError, setCategoryDrawerError] = useState<string | null>(null);
  const [categoryEditorNode, setCategoryEditorNode] = useState<CatalogNode | null>(null);
  const [categoryDefaultParentId, setCategoryDefaultParentId] = useState<string | null>(null);

  const useItemsFallback = shouldUseFallback(itemsQuery.error);
  const useCategoriesFallback = shouldUseFallback(categoriesQuery.error);
  const useUnitsFallback = shouldUseFallback(unitsQuery.error);
  const useWarehousesFallback = shouldUseFallback(warehousesQuery.error);

  const LOCAL_STORAGE_KEY = 'warehouse-local-items';

  const readLocalItems = () => {
    if (typeof window === 'undefined') {
      return null;
    }
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    try {
      const parsed = JSON.parse(raw) as Item[];
      if (!Array.isArray(parsed)) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  };

  const cloneFallbackItems = () => fallbackItems.map((item) => ({ ...item }));

  const [localItems, setLocalItems] = useState<Item[]>(() => readLocalItems() ?? cloneFallbackItems());

  useEffect(() => {
    if (useItemsFallback) {
      setLocalItems(readLocalItems() ?? cloneFallbackItems());
    }
  }, [useItemsFallback]);

  useEffect(() => {
    if (!useItemsFallback || typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localItems));
  }, [localItems, useItemsFallback]);

  const items = useMemo(() => {
    if (itemsQuery.data) {
      return itemsQuery.data;
    }
    if (useItemsFallback) {
      return localItems;
    }
    return [];
  }, [itemsQuery.data, useItemsFallback, localItems]);

  const categories: CatalogNode[] = useMemo(() => {
    if (categoriesQuery.data) {
      return categoriesQuery.data;
    }
    if (useCategoriesFallback) {
      return fallbackCategories;
    }
    return [];
  }, [categoriesQuery.data, useCategoriesFallback]);

  const units: CatalogNode[] = useMemo(() => {
    if (unitsQuery.data) {
      return unitsQuery.data;
    }
    if (useUnitsFallback) {
      return fallbackUnits;
    }
    return [];
  }, [unitsQuery.data, useUnitsFallback]);

  const warehouses: Warehouse[] = useMemo(() => {
    if (warehousesQuery.data) {
      return warehousesQuery.data;
    }
    if (useWarehousesFallback) {
      return fallbackWarehouses;
    }
    return [];
  }, [warehousesQuery.data, useWarehousesFallback]);

  const warehouseNameById = useMemo(() => {
    const map = new Map<string, string>();
    warehouses.forEach((warehouse) => map.set(warehouse.id, warehouse.name));
    return map;
  }, [warehouses]);

  const categoryOptions = useMemo(() => {
    const collection = new Map<string, string>();
    categories.forEach((category) => collection.set(category.id, category.name));
    items.forEach((item) => {
      if (item.category) {
        collection.set(item.category.id, item.category.name);
      }
    });
    return Array.from(collection.entries()).map(([value, label]) => ({ value, label }));
  }, [categories, items]);

  const unitOptions = useMemo(() => {
    const collection = new Map<string, string>();
    units.forEach((unit) => collection.set(unit.id, unit.name ?? unit.code));
    items.forEach((item) => {
      if (item.unit) {
        collection.set(item.unit.id, item.unit.name ?? item.unit.code ?? item.unit.id);
      }
    });
    return Array.from(collection.entries()).map(([value, label]) => ({ value, label }));
  }, [units, items]);

  const warehouseOptions = useMemo(
    () => warehouses.map((warehouse) => ({ value: warehouse.id, label: warehouse.name })),
    [warehouses]
  );

  const filteredItems = useMemo(() => {
    const needle = normalizeSearch(search);
    return items.filter((item) => {
      if (categoryFilter !== 'all' && item.category?.id !== categoryFilter) {
        return false;
      }
      if (unitFilter !== 'all' && item.unit?.id !== unitFilter) {
        return false;
      }
      if (warehouseFilter !== 'all' && !(item.warehouseIds ?? []).includes(warehouseFilter)) {
        return false;
      }
      if (!needle) {
        return true;
      }
      return (
        normalizeSearch(item.name).includes(needle) ||
        normalizeSearch(item.sku).includes(needle) ||
        (item.description ? normalizeSearch(item.description).includes(needle) : false)
      );
    });
  }, [items, search, categoryFilter, unitFilter, warehouseFilter]);

  const selectedItem = useMemo(() => {
    if (!selectedItemId) {
      return null;
    }
    return items.find((item) => item.id === selectedItemId) ?? null;
  }, [items, selectedItemId]);

  const openCategoryManageModal = useCallback(() => {
    setCategoryModalMode('manage');
    setCategorySelectResolver(null);
    setCategoryModalSelectedId(null);
    setCategoryModalOpen(true);
  }, []);

  const handleCloseCategoryModal = useCallback(() => {
    setCategoryModalOpen(false);
    setCategorySelectResolver(null);
    setCategoryModalSelectedId(null);
    setCategoryModalMode('manage');
  }, []);

  const handleOpenCategorySelector = useCallback(
    (currentId: string | null, onSelect: (node: CatalogNode | null) => void) => {
      setCategoryModalMode('select');
      setCategorySelectResolver(() => onSelect);
      setCategoryModalSelectedId(currentId ?? null);
      setCategoryModalOpen(true);
    },
    []
  );

  const handleCategoryModalSelect = useCallback(
    (category: CatalogNode | null) => {
      if (categorySelectResolver) {
        categorySelectResolver(category);
      }
      setCategoryModalSelectedId(category?.id ?? null);
      setCategoryModalOpen(false);
      setCategorySelectResolver(null);
      setCategoryModalMode('manage');
    },
    [categorySelectResolver]
  );

  const handleCategoryCreate = useCallback(
    (parentId?: string | null) => {
      if (useCategoriesFallback) {
        window.alert('Операции с группами номенклатуры недоступны в офлайн-режиме.');
        return;
      }
      setCategoryModalOpen(false);
      setCategoryDrawerMode('create');
      setCategoryEditorNode(null);
      setCategoryDefaultParentId(parentId ?? null);
      setCategoryDrawerError(null);
      setCategoryDrawerOpen(true);
    },
    [useCategoriesFallback]
  );

  const handleCategoryEdit = useCallback(
    (category: CatalogNode) => {
      if (useCategoriesFallback) {
        window.alert('Операции с группами номенклатуры недоступны в офлайн-режиме.');
        return;
      }
      setCategoryModalOpen(false);
      setCategoryDrawerMode('edit');
      setCategoryEditorNode(category);
      setCategoryDefaultParentId(category.parentId ?? null);
      setCategoryDrawerError(null);
      setCategoryDrawerOpen(true);
    },
    [useCategoriesFallback]
  );

  const handleCategoryDelete = useCallback(
    async (category: CatalogNode) => {
      if (useCategoriesFallback) {
        window.alert('Операции с группами номенклатуры недоступны в офлайн-режиме.');
        return;
      }
      const confirmed = window.confirm(`Удалить группу «${category.name}»?`);
      if (!confirmed) {
        return;
      }
      try {
        await deleteCategoryMutation.mutateAsync({ catalogType: 'category', nodeId: category.id });
        await categoriesQuery.refetch();
      } catch (error) {
        window.alert((error as Error).message);
      }
    },
    [categoriesQuery, deleteCategoryMutation, useCategoriesFallback]
  );

  const isCategorySubmitting = createCategoryMutation.isPending || updateCategoryMutation.isPending;

  const handleCategoryDrawerClose = useCallback(() => {
    if (isCategorySubmitting) {
      return;
    }
    setCategoryDrawerOpen(false);
    setCategoryDrawerError(null);
  }, [isCategorySubmitting]);

  const handleCategoryDrawerSubmit = useCallback(
    async ({ payload, nodeId }: CategoryEditorSubmitPayload) => {
      try {
        const normalizedPayload = {
          ...payload,
          parentId: payload.parentId !== undefined ? payload.parentId : categoryDefaultParentId
        };

        if (categoryDrawerMode === 'create') {
          await createCategoryMutation.mutateAsync({ catalogType: 'category', payload: normalizedPayload });
        } else {
          const targetId = nodeId ?? categoryEditorNode?.id;
          if (!targetId) {
            throw new Error('Не выбрана запись для изменения');
          }
          await updateCategoryMutation.mutateAsync({ catalogType: 'category', nodeId: targetId, payload: normalizedPayload });
        }
        await categoriesQuery.refetch();
        setCategoryDrawerOpen(false);
        setCategoryDrawerError(null);
        setCategoryModalOpen(true);
      } catch (error) {
        setCategoryDrawerError((error as Error).message);
        throw error;
      }
    },
    [categoryDefaultParentId, categoryDrawerMode, categoryEditorNode?.id, categoriesQuery, createCategoryMutation, updateCategoryMutation]
  );

  const handleCreateClick = useCallback(() => {
    setSelectedItemId(null);
    setDrawerMode('create');
    setFormError(null);
    setDrawerOpen(true);
  }, []);

  const handleEditRow = useCallback((item: Item) => {
    setSelectedItemId(item.id);
    setDrawerMode('edit');
    setFormError(null);
    setDrawerOpen(true);
  }, []);

  const handleDeleteRow = useCallback(
    async (item: Item) => {
      const confirmed = window.confirm(`Удалить номенклатуру «${item.name}»?`);
      if (!confirmed) {
        return;
      }
      try {
        if (useItemsFallback) {
          setLocalItems((prev) => prev.filter((entry) => entry.id !== item.id));
          setSelectedItemId((current) => (current === item.id ? null : current));
        } else {
          await deleteMutation.mutateAsync({ itemId: item.id });
          setSelectedItemId((current) => (current === item.id ? null : current));
          await itemsQuery.refetch();
        }
      } catch (error) {
        window.alert(`Не удалось удалить: ${(error as Error).message}`);
      }
    },
    [deleteMutation, itemsQuery, setLocalItems, useItemsFallback]
  );

  const columns: WarehouseColumn<Item>[] = useMemo(
    () => [
      {
        id: 'sku',
        label: 'Артикул',
        render: (row) => <code>{row.sku}</code>
      },
      {
        id: 'name',
        label: 'Наименование',
        render: (row) => (
          <div className='list-form__value'>
            <span className='list-form__title'>{row.name}</span>
            {row.description ? (
              <span className='list-form__meta'>{row.description}</span>
            ) : null}
          </div>
        )
      },
      {
        id: 'category',
        label: 'Группа',
        render: (row) => row.category?.name ?? '—'
      },
      {
        id: 'unit',
        label: 'Ед. изм.',
        align: 'center',
        render: (row) => row.unit?.code ?? '—'
      },
      {
        id: 'warehouses',
        label: 'Склады',
        render: (row) => {
          const ids = row.warehouseIds ?? [];
          if (!ids.length) {
            return '—';
          }
          const labels = ids.map((id) => warehouseNameById.get(id) ?? id);
          return labels.slice(0, 3).join(', ') + (labels.length > 3 ? ` (+${labels.length - 3})` : '');
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
    [handleDeleteRow, handleEditRow, warehouseNameById]
  );

  const renderFilters = () => (
    <div className='filters-panel'>
      <label>
        <span>Поиск</span>
        <input
          type='search'
          placeholder='Код, наименование, описание'
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>
      <label>
        <span>Группа</span>
        <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
          <option value='all'>Все</option>
          {categoryOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Ед. изм.</span>
        <select value={unitFilter} onChange={(event) => setUnitFilter(event.target.value)}>
          <option value='all'>Все</option>
          {unitOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Склад</span>
        <select value={warehouseFilter} onChange={(event) => setWarehouseFilter(event.target.value)}>
          <option value='all'>Все</option>
          {warehouseOptions.map((option) => (
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

  const handleDrawerSubmit = async ({ payload, itemId }: ItemEditorSubmitPayload) => {
    try {
      if (useItemsFallback) {
        const resolveCategory = (id?: string | null) => (id ? categories.find((category) => category.id === id) : undefined);
        const resolveUnit = (id?: string) => (id ? units.find((unit) => unit.id === id) : undefined);
        const buildLocalItem = (id: string): Item => {
          const category = resolveCategory(payload.categoryId ?? undefined);
          const unit = resolveUnit(payload.unitId);
          const alternativeUnit = resolveUnit(payload.alternativeUnitId ?? undefined);
          const timestamp = new Date().toISOString();
          return {
            id,
            sku: payload.sku,
            name: payload.name,
            description: payload.description ?? undefined,
            categoryId: payload.categoryId ?? undefined,
            categoryPath: category?.path,
            category,
            unitId: payload.unitId,
            unit,
            alternativeUnitId: payload.alternativeUnitId ?? undefined,
            alternativeUnit,
            barcode: payload.barcode ?? undefined,
            weightKg: payload.weightKg ?? undefined,
            volumeM3: payload.volumeM3 ?? undefined,
            powerW: payload.powerW ?? undefined,
            conversionRate: payload.conversionRate ?? undefined,
            metadata: payload.metadata ?? undefined,
            warehouseIds: payload.warehouseIds ?? [],
            attributes: [],
            createdAt: timestamp,
            updatedAt: timestamp
          };
        };

        if (drawerMode === 'create') {
          const localId = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
          const created = buildLocalItem(localId);
          setLocalItems((prev) => [created, ...prev]);
          setSelectedItemId(created.id);
        } else {
          const targetId = itemId ?? selectedItem?.id;
          if (!targetId) {
            throw new Error('Не выбрана запись для изменения');
          }
          setLocalItems((prev) =>
            prev.map((entry) =>
              entry.id === targetId
                ? {
                    ...buildLocalItem(targetId),
                    createdAt: entry.createdAt ?? new Date().toISOString()
                  }
                : entry
            )
          );
          setSelectedItemId(targetId);
        }
      } else {
        if (drawerMode === 'create') {
          const created = await createMutation.mutateAsync(payload);
          setSelectedItemId(created.id);
        } else {
          const targetId = itemId ?? selectedItem?.id;
          if (!targetId) {
            throw new Error('Не выбрана запись для изменения');
          }
          const updated = await updateMutation.mutateAsync({ itemId: targetId, payload });
          setSelectedItemId(updated.id);
        }
        await itemsQuery.refetch();
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
      title='Номенклатура'
      menu={warehouseMenu}
      activePath='/warehouse/masters/items'
      commands={[]}
      status={itemsQuery.isLoading ? 'Загрузка…' : `Записей: ${filteredItems.length}`}
      renderFilters={renderFilters}
      headerActions={
        <>
          <button type='button' className='warehouse-shell__primary-action' onClick={handleCreateClick}>
            Создать
          </button>
          <button type='button' className='warehouse-shell__secondary-action' onClick={openCategoryManageModal}>
            Группы номенклатуры
          </button>
        </>
      }
    >
      {itemsQuery.isLoading ? (
        <PageLoader />
      ) : itemsQuery.isError && !useItemsFallback ? (
        <QueryErrorState message={`Не удалось загрузить номенклатуру: ${itemsQuery.error?.message ?? 'неизвестная ошибка'}`} />
      ) : (
        <ListForm
          columns={columns}
          rows={filteredItems}
          primaryKey={(row) => row.id}
          emptyMessage={
            search || categoryFilter !== 'all' || unitFilter !== 'all' || warehouseFilter !== 'all'
              ? 'Совпадений не найдено'
              : 'Справочник номенклатуры пуст'
          }
          selectedKey={selectedItemId ?? undefined}
          onRowClick={(row) => setSelectedItemId((row as Item).id)}
        />
      )}

      <ItemEditorDrawer
        open={drawerOpen}
        mode={drawerMode}
        item={drawerMode === 'edit' ? selectedItem : null}
        categories={categories}
        units={units}
        warehouses={warehouses}
        onClose={handleDrawerClose}
        onSubmit={handleDrawerSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        error={formError ?? undefined}
        onErrorDismiss={() => setFormError(null)}
        onCategorySelectRequest={handleOpenCategorySelector}
      />

      <CategoryHierarchyModal
        open={isCategoryModalOpen}
        nodes={categories}
        onClose={handleCloseCategoryModal}
        onCreate={categoryModalMode === 'manage' ? handleCategoryCreate : undefined}
        onEdit={categoryModalMode === 'manage' ? handleCategoryEdit : undefined}
        onDelete={categoryModalMode === 'manage' ? handleCategoryDelete : undefined}
        onSelect={categoryModalMode === 'select' ? handleCategoryModalSelect : undefined}
        selectedId={categoryModalMode === 'select' ? categoryModalSelectedId ?? null : undefined}
      />

      <CategoryEditorDrawer
        open={categoryDrawerOpen}
        mode={categoryDrawerMode}
        node={categoryDrawerMode === 'edit' ? categoryEditorNode : null}
        nodes={categories}
        defaultParentId={categoryDrawerMode === 'create' ? categoryDefaultParentId ?? undefined : undefined}
        isSubmitting={isCategorySubmitting}
        error={categoryDrawerError ?? undefined}
        onSubmit={handleCategoryDrawerSubmit}
        onClose={handleCategoryDrawerClose}
        onErrorDismiss={() => setCategoryDrawerError(null)}
      />
    </WarehouseShell>
  );
};

export default ItemsList;
