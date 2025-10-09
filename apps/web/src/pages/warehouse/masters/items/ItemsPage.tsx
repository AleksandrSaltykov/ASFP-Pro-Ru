import { FormEvent, useMemo, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  useCatalogNodesQuery,
  useCreateItemMutation,
  useDeleteItemMutation,
  useItemsQuery,
  useUpdateItemMutation,
  type Item
} from '@shared/api';
import { PageLoader } from '@shared/ui/PageLoader';
import { palette, typography } from '@shared/ui/theme';

import DataTable, { type TableColumn } from '../../components/DataTable';
import SlideOver from '../../components/SlideOver';
import { generateSku } from '@shared/utils/identifiers';
import { fallbackCategories, fallbackUnits } from '../../../../modules/warehouse/views/masters/fallbacks';

const layoutStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 24
};

const headerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 16
};

const headerActionsStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 12
};

const headingStyle: CSSProperties = {
  margin: 0,
  fontFamily: typography.fontFamily,
  fontSize: 28,
  fontWeight: 600,
  color: palette.textPrimary
};

const primaryButtonStyle: CSSProperties = {
  padding: '12px 18px',
  borderRadius: 14,
  border: 'none',
  background: palette.primary,
  color: '#fff',
  fontWeight: 600,
  cursor: 'pointer'
};

const cardStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
  padding: 24,
  borderRadius: 20,
  border: `1px solid ${palette.border}`,
  background: palette.layer,
  boxShadow: palette.shadowElevated
};

const formStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 18
};

const formRowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: 16
};

const formControlStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6
};

const fieldHintStyle: CSSProperties = {
  fontSize: 12,
  color: palette.textSecondary
};

const labelStyle: CSSProperties = {
  fontSize: 12,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  color: palette.textSoft,
  fontWeight: 600
};

const textInputStyle: CSSProperties = {
  padding: '10px 12px',
  borderRadius: 12,
  border: `1px solid ${palette.glassBorder}`,
  background: palette.surface,
  fontFamily: typography.fontFamily,
  fontSize: 14,
  color: palette.textPrimary
};

const textareaStyle: CSSProperties = {
  ...textInputStyle,
  minHeight: 110,
  resize: 'vertical' as const
};

const buttonRowStyle: CSSProperties = {
  display: 'flex',
  gap: 12,
  flexWrap: 'wrap'
};

const secondaryButtonStyle: CSSProperties = {
  padding: '10px 16px',
  borderRadius: 12,
  border: `1px solid ${palette.border}`,
  background: palette.surface,
  color: palette.textPrimary,
  fontWeight: 600,
  cursor: 'pointer'
};

const dangerButtonStyle: CSSProperties = {
  padding: '10px 16px',
  borderRadius: 12,
  border: 'none',
  background: '#d32029',
  color: '#fff',
  fontWeight: 600,
  cursor: 'pointer'
};

const errorStyle: CSSProperties = {
  color: '#d32029',
  fontWeight: 600
};

type ItemFormState = {
  sku: string;
  name: string;
  description: string;
  categoryId: string;
  unitId: string;
  alternativeUnitId: string;
  conversionRate: string;
  barcode: string;
  weightKg: string;
  volumeM3: string;
  powerW: string;
};

const defaultItemFormState: ItemFormState = {
  sku: '',
  name: '',
  description: '',
  categoryId: '',
  unitId: '',
  alternativeUnitId: '',
  conversionRate: '',
  barcode: '',
  weightKg: '',
  volumeM3: '',
  powerW: ''
};

const formatDateTime = (value: string) => new Date(value).toLocaleString('ru-RU');

const parseNumber = (value: string) => {
  if (!value.trim()) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const ItemsPage = () => {
  const navigate = useNavigate();
  const itemsQuery = useItemsQuery();
  const categoriesQuery = useCatalogNodesQuery('category');
  const unitsQuery = useCatalogNodesQuery('unit');
  const createMutation = useCreateItemMutation();
  const updateMutation = useUpdateItemMutation();
  const deleteMutation = useDeleteItemMutation();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [currentItem, setCurrentItem] = useState<Item | null>(null);
  const [formState, setFormState] = useState<ItemFormState>(defaultItemFormState);
  const [formError, setFormError] = useState<string | null>(null);

  const categories = useMemo(() => {
    const source =
      categoriesQuery.data && categoriesQuery.data.length ? categoriesQuery.data : fallbackCategories;
    return source.filter((node) => node.code !== 'ROOT');
  }, [categoriesQuery.data]);

  const categoryOptions = useMemo(() => {
    return categories
      .slice()
      .sort((a, b) => {
        const sort = (a.path ?? '').localeCompare(b.path ?? '');
        if (sort !== 0) {
          return sort;
        }
        const orderDiff = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
        if (orderDiff !== 0) {
          return orderDiff;
        }
        return a.name.localeCompare(b.name);
      })
      .map((category) => {
        const depth = category.path ? Math.max(category.path.split('.').length - 2, 0) : 0;
        const prefix = depth ? `${'  '.repeat(depth)}- ` : '';
        return {
          value: category.id,
          label: `${prefix}${category.name}`
        };
      });
  }, [categories]);

  const units = useMemo(() => {
    const source = unitsQuery.data && unitsQuery.data.length ? unitsQuery.data : fallbackUnits;
    return source;
  }, [unitsQuery.data]);

  const unitNameById = useMemo(() => {
    const map = new Map<string, string>();
    units.forEach((unit) => {
      map.set(unit.id, unit.name ?? unit.code ?? unit.id);
    });
    return map;
  }, [units]);

  const items = itemsQuery.data ?? [];

  const columns: TableColumn<Item>[] = [
    {
      id: 'name',
      label: 'Название',
      render: (item) => <strong style={{ fontWeight: 700 }}>{item.name}</strong>
    },
    {
      id: 'category',
      label: 'Категория',
      render: (item) => item.category?.name ?? '—'
    },
    {
      id: 'unit',
      label: 'Основная ед. изм.',
      render: (item) => item.unit?.code ?? '—',
      width: 120
    },
    {
      id: 'updated',
      label: 'Обновлено',
      render: (item) => formatDateTime(item.updatedAt),
      width: 180
    },
    {
      id: 'actions',
      label: 'Действия',
      render: (item) => (
        <button
          type='button'
          style={{ ...secondaryButtonStyle, padding: '8px 14px' }}
          onClick={() => openEditDrawer(item)}
        >
          Редактировать
        </button>
      ),
      width: 160
    }
  ];

  const openCreateDrawer = () => {
    setMode('create');
    setCurrentItem(null);
    setFormError(null);
    setFormState({
      ...defaultItemFormState,
      unitId: units[0]?.id ?? ''
    });
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (item: Item) => {
    setMode('edit');
    setCurrentItem(item);
    setFormError(null);
    setFormState({
      sku: item.sku,
      name: item.name,
      description: item.description ?? '',
      categoryId: item.category?.id ?? '',
      unitId: item.unit?.id ?? '',
      alternativeUnitId: item.alternativeUnit?.id ?? '',
      conversionRate: item.conversionRate != null ? String(item.conversionRate) : '',
      barcode: item.barcode ?? '',
      weightKg: item.weightKg != null ? String(item.weightKg) : '',
      volumeM3: item.volumeM3 != null ? String(item.volumeM3) : '',
      powerW: item.powerW != null ? String(item.powerW) : ''
    });
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setCurrentItem(null);
    setFormError(null);
    setFormState(defaultItemFormState);
  };

  const handleInputChange = (field: keyof ItemFormState, value: string) => {
    if (field === 'alternativeUnitId') {
      setFormState((prev) => ({
        ...prev,
        alternativeUnitId: value,
        conversionRate: value ? prev.conversionRate : ''
      }));
      return;
    }
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const conversionHint = useMemo(() => {
    if (!formState.alternativeUnitId || !formState.unitId) {
      return null;
    }
    const rate = Number(formState.conversionRate);
    if (!Number.isFinite(rate) || rate <= 0) {
      return null;
    }
    const baseName = unitNameById.get(formState.unitId);
    const altName = unitNameById.get(formState.alternativeUnitId);
    if (!baseName || !altName) {
      return null;
    }
    const formattedRate = rate.toLocaleString('ru-RU', { maximumFractionDigits: 4 });
    return `1 ${altName.toLowerCase()} = ${formattedRate} ${baseName.toLowerCase()}`;
  }, [formState.alternativeUnitId, formState.unitId, formState.conversionRate, unitNameById]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const trimmedName = formState.name.trim();
    if (!trimmedName) {
      setFormError('Укажите наименование изделия');
      return;
    }

    if (!formState.unitId) {
      setFormError('Выберите основную единицу измерения');
      return;
    }

    if (formState.alternativeUnitId && formState.alternativeUnitId === formState.unitId) {
      setFormError('Альтернативная единица должна отличаться от основной');
      return;
    }

    const conversionRateValue = parseNumber(formState.conversionRate);
    if (formState.alternativeUnitId) {
      if (conversionRateValue == null || conversionRateValue <= 0) {
        setFormError('Укажите коэффициент пересчёта для альтернативной единицы (> 0)');
        return;
      }
    } else if (conversionRateValue != null) {
      setFormError('Выберите альтернативную единицу или очистите коэффициент пересчёта');
      return;
    }

    const sku = mode === 'create' ? generateSku() : formState.sku.trim();
    if (!sku) {
      setFormError('Не удалось определить SKU изделия');
      return;
    }

    const powerValue = parseNumber(formState.powerW);
    if (powerValue != null && powerValue < 0) {
      setFormError('Мощность не может быть отрицательной');
      return;
    }

    const payload = {
      sku,
      name: trimmedName,
      description: formState.description.trim() || undefined,
      categoryId: formState.categoryId ? formState.categoryId : undefined,
      unitId: formState.unitId,
      alternativeUnitId: formState.alternativeUnitId ? formState.alternativeUnitId : undefined,
      conversionRate: conversionRateValue ?? undefined,
      barcode: formState.barcode.trim() || undefined,
      weightKg: parseNumber(formState.weightKg),
      volumeM3: parseNumber(formState.volumeM3),
      powerW: powerValue,
      warehouseIds: mode === 'edit' && currentItem?.warehouseIds ? currentItem.warehouseIds : []
    };

    try {
      if (mode === 'create') {
        await createMutation.mutateAsync(payload);
      } else if (currentItem) {
        await updateMutation.mutateAsync({ itemId: currentItem.id, payload });
      }
      closeDrawer();
    } catch (error) {
      setFormError((error as Error).message ?? 'Не удалось сохранить изменения');
    }
  };

  const handleDelete = async () => {
    if (!currentItem) {
      return;
    }
    if (!window.confirm('Удалить изделие?')) {
      return;
    }
    try {
      await deleteMutation.mutateAsync({ itemId: currentItem.id });
      closeDrawer();
    } catch (error) {
      setFormError((error as Error).message ?? 'Не удалось удалить изделие');
    }
  };

  if (itemsQuery.isLoading || categoriesQuery.isLoading || unitsQuery.isLoading) {
    return <PageLoader />;
  }

  if (itemsQuery.isError) {
    return <div style={cardStyle}>Не удалось загрузить изделия: {(itemsQuery.error as Error).message}</div>;
  }

  return (
    <section style={layoutStyle}>
      <header style={headerStyle}>
        <h1 style={headingStyle}>Номенклатура</h1>
        <div style={headerActionsStyle}>
          <button type='button' style={primaryButtonStyle} onClick={openCreateDrawer}>
            Создать
          </button>
          <button
            type='button'
            style={secondaryButtonStyle}
            onClick={() => navigate('/warehouse/masters/items/categories')}
          >
            Категории
          </button>
        </div>
      </header>
      <DataTable columns={columns} items={items} emptyMessage='Карточки изделий отсутствуют' />

      {isDrawerOpen ? (
        <SlideOver
          title={mode === 'create' ? 'Новая номенклатура' : `Редактирование: ${currentItem?.name ?? ''}`}
          onClose={closeDrawer}
        >
          <form style={formStyle} onSubmit={handleSubmit}>
            <div style={formRowStyle}>
              <label style={formControlStyle}>
                <span style={labelStyle}>SKU</span>
                <input
                  style={textInputStyle}
                  value={mode === 'create' ? 'Автоматически' : formState.sku}
                  readOnly
                  disabled={mode === 'create'}
                  title='SKU генерируется автоматически'
                />
                {mode === 'create' ? (
                  <span style={fieldHintStyle}>Значение появится автоматически после сохранения</span>
                ) : null}
              </label>
              <label style={formControlStyle}>
                <span style={labelStyle}>Наименование</span>
                <input
                  style={textInputStyle}
                  value={formState.name}
                  onChange={(event) => handleInputChange('name', event.target.value)}
                  required
                />
              </label>
            </div>

            <label style={formControlStyle}>
              <span style={labelStyle}>Описание</span>
              <textarea
                style={textareaStyle}
                value={formState.description}
                onChange={(event) => handleInputChange('description', event.target.value)}
              />
            </label>

            <div style={formRowStyle}>
              <label style={formControlStyle}>
                <span style={labelStyle}>Категория</span>
                <select
                  style={textInputStyle}
                  value={formState.categoryId}
                  onChange={(event) => handleInputChange('categoryId', event.target.value)}
                >
                  <option value=''>Без категории</option>
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label style={formControlStyle}>
                <span style={labelStyle}>Основная единица измерения</span>
                <select
                  style={textInputStyle}
                  value={formState.unitId}
                  onChange={(event) => handleInputChange('unitId', event.target.value)}
                  required
                >
                  <option value='' disabled>
                    Выберите единицу
                  </option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div style={formRowStyle}>
              <label style={formControlStyle}>
                <span style={labelStyle}>Коэффициент пересчёта</span>
                <input
                  style={textInputStyle}
                  type='number'
                  step='0.0001'
                  min='0'
                  value={formState.conversionRate}
                  onChange={(event) => handleInputChange('conversionRate', event.target.value)}
                  disabled={!formState.alternativeUnitId}
                />
                {conversionHint ? <span style={fieldHintStyle}>{conversionHint}</span> : null}
              </label>
              <label style={formControlStyle}>
                <span style={labelStyle}>Альтернативная единица</span>
                <select
                  style={textInputStyle}
                  value={formState.alternativeUnitId}
                  onChange={(event) => handleInputChange('alternativeUnitId', event.target.value)}
                >
                  <option value=''>Без альтернативной единицы</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div style={formRowStyle}>
              <label style={formControlStyle}>
                <span style={labelStyle}>Штрихкод</span>
                <input
                  style={textInputStyle}
                  value={formState.barcode}
                  onChange={(event) => handleInputChange('barcode', event.target.value)}
                />
              </label>
              <label style={formControlStyle}>
                <span style={labelStyle}>Вес, кг</span>
                <input
                  style={textInputStyle}
                  type='number'
                  step='0.01'
                  value={formState.weightKg}
                  onChange={(event) => handleInputChange('weightKg', event.target.value)}
                />
              </label>
              <label style={formControlStyle}>
                <span style={labelStyle}>Объём, м³</span>
                <input
                  style={textInputStyle}
                  type='number'
                  step='0.001'
                  value={formState.volumeM3}
                  onChange={(event) => handleInputChange('volumeM3', event.target.value)}
                />
              </label>
              <label style={formControlStyle}>
                <span style={labelStyle}>Мощность, Вт</span>
                <input
                  style={textInputStyle}
                  type='number'
                  step='1'
                  min='0'
                  value={formState.powerW}
                  onChange={(event) => handleInputChange('powerW', event.target.value)}
                />
              </label>
            </div>

            {formError ? <div style={errorStyle}>{formError}</div> : null}

            <div style={buttonRowStyle}>
              <button
                type='submit'
                style={primaryButtonStyle}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {mode === 'create'
                  ? createMutation.isPending
                    ? 'Сохранение…'
                    : 'Создать'
                  : updateMutation.isPending
                  ? 'Сохранение…'
                  : 'Сохранить'}
              </button>
              <button type='button' style={secondaryButtonStyle} onClick={closeDrawer}>
                Отмена
              </button>
              {mode === 'edit' ? (
                <button
                  type='button'
                  style={dangerButtonStyle}
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? 'Удаление…' : 'Удалить'}
                </button>
              ) : null}
            </div>
          </form>
        </SlideOver>
      ) : null}
    </section>
  );
};

export default ItemsPage;
