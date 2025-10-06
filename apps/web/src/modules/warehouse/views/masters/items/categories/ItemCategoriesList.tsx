import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';

import {
  type CatalogNode,
  useCatalogNodesQuery,
  useCreateCatalogNodeMutation,
  useDeleteCatalogNodeMutation,
  useUpdateCatalogNodeMutation
} from '@shared/api';
import { PageLoader } from '@shared/ui/PageLoader';

import { WarehouseShell } from '../../../../layout/WarehouseShell';
import { ListForm } from '../../../../layout/ListForm/ListForm';
import type { WarehouseColumn } from '../../../../layout/types';
import { warehouseMenu } from '../../../../menu/warehouse.menu';
import { EmptyState, QueryErrorState } from '../../../components/QueryState';
import { fallbackCategories } from '../../fallbacks';
import { formatBoolean, formatDateTime, normalizeSearch, shouldUseFallback } from '../../utils';
import { CategoryEditorDrawer, type CategoryEditorSubmitPayload } from '../../components/CategoryEditorDrawer';

export const ItemCategoriesList = () => {
  const categoriesQuery = useCatalogNodesQuery('category');
  const [search, setSearch] = useState('');
  const [onlyActive, setOnlyActive] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('create');
  const [formError, setFormError] = useState<string | null>(null);

  const useFallback = shouldUseFallback(categoriesQuery.error);
  const createMutation = useCreateCatalogNodeMutation();
  const updateMutation = useUpdateCatalogNodeMutation();
  const deleteMutation = useDeleteCatalogNodeMutation();

  const categories = useMemo(() => {
    if (categoriesQuery.data) {
      return categoriesQuery.data;
    }
    if (useFallback) {
      return fallbackCategories;
    }
    return [];
  }, [categoriesQuery.data, useFallback]);

  useEffect(() => {
    if (!selectedCategoryId) {
      return;
    }
    if (!categories.some((node) => node.id === selectedCategoryId)) {
      setSelectedCategoryId(null);
    }
  }, [categories, selectedCategoryId]);

  const parentLookup = useMemo(() => {
    const map = new Map<string, CatalogNode>();
    categories.forEach((node) => {
      map.set(node.id, node);
    });
    return map;
  }, [categories]);

  const filtered = useMemo(() => {
    const needle = normalizeSearch(search);
    return categories.filter((node) => {
      if (onlyActive && !node.isActive) {
        return false;
      }
      if (!needle) {
        return true;
      }
      const description = node.description ? normalizeSearch(node.description) : '';
      return (
        normalizeSearch(node.name).includes(needle) ||
        normalizeSearch(node.code).includes(needle) ||
        description.includes(needle) ||
        node.path.toLowerCase().includes(needle)
      );
    });
  }, [categories, search, onlyActive]);

  const renderFilters = () => (
    <div className='filters-panel'>
      <label>
        <span>Поиск</span>
        <input
          type='search'
          placeholder='Код, наименование или путь'
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

  const selectedCategory = useMemo(
    () => (selectedCategoryId ? categories.find((node) => node.id === selectedCategoryId) ?? null : null),
    [categories, selectedCategoryId]
  );

  const handleCreateClick = useCallback(() => {
    setSelectedCategoryId(null);
    setDrawerMode('create');
    setFormError(null);
    setDrawerOpen(true);
  }, []);

  const handleEditRow = useCallback((category: CatalogNode) => {
    setSelectedCategoryId(category.id);
    setDrawerMode('edit');
    setFormError(null);
    setDrawerOpen(true);
  }, []);

  const handleDeleteRow = useCallback(
    async (category: CatalogNode) => {
      const confirmed = window.confirm(`Удалить категорию «${category.name}»?`);
      if (!confirmed) {
        return;
      }
      try {
        await deleteMutation.mutateAsync({ catalogType: 'category', nodeId: category.id });
        setSelectedCategoryId((current) => (current === category.id ? null : current));
        await categoriesQuery.refetch();
      } catch (error) {
        window.alert((error as Error).message);
      }
    },
    [categoriesQuery, deleteMutation]
  );

  const columns: WarehouseColumn<CatalogNode>[] = useMemo(
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
          <div
            className='catalog-node__name list-form__value'
            style={{ '--catalog-indent': `${Math.max(row.level - 1, 0) * 16}px` } as CSSProperties}
          >
            <span className='list-form__title'>{row.name}</span>
            {row.description ? (
              <span className='catalog-node__meta'>{row.description}</span>
            ) : null}
          </div>
        )
      },
      {
        id: 'parent',
        label: 'Родитель',
        render: (row) => (row.parentId ? parentLookup.get(row.parentId)?.name ?? '—' : '—')
      },
      {
        id: 'path',
        label: 'Путь',
        render: (row) => row.path
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
    [handleDeleteRow, handleEditRow, parentLookup]
  );

  const handleDrawerClose = () => {
    if (createMutation.isPending || updateMutation.isPending) {
      return;
    }
    setDrawerOpen(false);
    setFormError(null);
  };

  const handleDrawerSubmit = async ({ payload, nodeId }: CategoryEditorSubmitPayload) => {
    try {
      if (drawerMode === 'create') {
        const created = await createMutation.mutateAsync({ catalogType: 'category', payload });
        setSelectedCategoryId(created.id);
      } else {
        const targetId = nodeId ?? selectedCategory?.id;
        if (!targetId) {
          throw new Error('Не выбрана запись для изменения');
        }
        const updated = await updateMutation.mutateAsync({ catalogType: 'category', nodeId: targetId, payload });
        setSelectedCategoryId(updated.id);
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
      title='Группы номенклатуры'
      menu={warehouseMenu}
      activePath='/warehouse/masters/items/categories'
      status={categoriesQuery.isLoading ? 'Загрузка…' : `Записей: ${filtered.length}`}
      renderFilters={renderFilters}
      commands={[]}
      headerActions={
        <button type='button' className='warehouse-shell__primary-action' onClick={handleCreateClick}>
          Создать
        </button>
      }
    >
      {categoriesQuery.isLoading ? (
        <PageLoader />
      ) : categoriesQuery.isError && !useFallback ? (
        <QueryErrorState message={`Не удалось загрузить группы: ${categoriesQuery.error?.message ?? 'неизвестная ошибка'}`} />
      ) : filtered.length === 0 ? (
        <EmptyState message={search || onlyActive ? 'Совпадений не найдено' : 'Группы номенклатуры пока не созданы'} />
      ) : (
        <ListForm
          columns={columns}
          rows={filtered}
          primaryKey={(row) => row.id}
          emptyMessage='Группы номенклатуры не созданы'
          selectedKey={selectedCategoryId ?? undefined}
          onRowClick={(row) => setSelectedCategoryId((row as CatalogNode).id)}
        />
      )}

      <CategoryEditorDrawer
        open={drawerOpen}
        mode={drawerMode}
        node={drawerMode === 'edit' ? selectedCategory : null}
        nodes={categories}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        error={formError ?? undefined}
        onSubmit={handleDrawerSubmit}
        onClose={handleDrawerClose}
        onErrorDismiss={() => setFormError(null)}
      />
    </WarehouseShell>
  );
};

export default ItemCategoriesList;
