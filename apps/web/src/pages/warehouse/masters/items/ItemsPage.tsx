import { FormEvent, useEffect, useMemo, useState, type CSSProperties } from 'react';

import {
  useAttributeTemplatesQuery,
  useCatalogNodesQuery,
  useCreateItemMutation,
  useDeleteItemMutation,
  useItemsQuery,
  useUpdateItemMutation,
  type AttributeTemplate,
  type Item
} from '@shared/api';
import { PageLoader } from '@shared/ui/PageLoader';
import { palette, typography } from '@shared/ui/theme';

import DataTable, { type TableColumn } from '../../components/DataTable';
import SlideOver from '../../components/SlideOver';

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
  boxShadow: palette.shadowSoft
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

const checkboxRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 12px',
  borderRadius: 12,
  border: `1px solid ${palette.glassBorder}`,
  background: palette.surface,
  fontSize: 13,
  color: palette.textPrimary
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

type AttributeValueState = {
  stringValue?: string;
  numberValue?: string;
  booleanValue?: boolean;
  jsonValue?: string;
};

type ItemFormState = {
  sku: string;
  name: string;
  description: string;
  categoryId: string;
  unitId: string;
  barcode: string;
  weightKg: string;
  volumeM3: string;
  metadata: string;
  attributes: Record<string, AttributeValueState>;
};

const defaultItemFormState: ItemFormState = {
  sku: '',
  name: '',
  description: '',
  categoryId: '',
  unitId: '',
  barcode: '',
  weightKg: '',
  volumeM3: '',
  metadata: `{\n  "demo": false\n}`,
  attributes: {}
};

const createDefaultAttributeState = (template: AttributeTemplate): AttributeValueState => {
  switch (template.dataType) {
    case 'number':
      return { numberValue: '' };
    case 'boolean':
      return { booleanValue: false };
    case 'json':
      return { jsonValue: `{\n}` };
    default:
      return { stringValue: '' };
  }
};

const stringifyMetadata = (value: Record<string, unknown> | undefined) => {
  try {
    return JSON.stringify(value ?? {}, null, 2);
  } catch {
    return `{
}`;
  }
};

const stringifyJsonValue = (value: unknown) => {
  if (!value) {
    return `{
}`;
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return `{
}`;
  }
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
  const itemsQuery = useItemsQuery();
  const categoriesQuery = useCatalogNodesQuery('category');
  const unitsQuery = useCatalogNodesQuery('unit');
  const templatesQuery = useAttributeTemplatesQuery('item');

  const createMutation = useCreateItemMutation();
  const updateMutation = useUpdateItemMutation();
  const deleteMutation = useDeleteItemMutation();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [currentItem, setCurrentItem] = useState<Item | null>(null);
  const [formState, setFormState] = useState<ItemFormState>(defaultItemFormState);
  const [formError, setFormError] = useState<string | null>(null);

  const templates = useMemo(() => templatesQuery.data ?? [], [templatesQuery.data]);

  useEffect(() => {
    if (!templates.length) {
      return;
    }
    setFormState((prev) => {
      const nextAttributes: Record<string, AttributeValueState> = { ...prev.attributes };
      let changed = false;
      const validIds = new Set<string>();
      templates.forEach((template) => {
        validIds.add(template.id);
        if (!nextAttributes[template.id]) {
          nextAttributes[template.id] = createDefaultAttributeState(template);
          changed = true;
        }
      });
      Object.keys(nextAttributes).forEach((id) => {
        if (!validIds.has(id)) {
          delete nextAttributes[id];
          changed = true;
        }
      });
      return changed ? { ...prev, attributes: nextAttributes } : prev;
    });
  }, [templates]);

  const categories = useMemo(() => {
    return (categoriesQuery.data ?? []).filter((node) => node.code !== 'ROOT');
  }, [categoriesQuery.data]);

  const units = useMemo(() => unitsQuery.data ?? [], [unitsQuery.data]);

  const items = itemsQuery.data ?? [];

  const columns: TableColumn<Item>[] = [
    {
      id: 'sku',
      label: 'SKU',
      render: (item) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <strong>{item.sku}</strong>
          <span style={{ color: palette.textSecondary, fontSize: 12 }}>{item.name}</span>
        </div>
      )
    },
    {
      id: 'category',
      label: 'Категория',
      render: (item) => item.category?.name ?? '—'
    },
    {
      id: 'unit',
      label: 'Ед. изм.',
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
      unitId: units[0]?.id ?? '',
      attributes: templates.reduce<Record<string, AttributeValueState>>((acc, template) => {
        acc[template.id] = createDefaultAttributeState(template);
        return acc;
      }, {})
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
      barcode: item.barcode ?? '',
      weightKg: item.weightKg != null ? String(item.weightKg) : '',
      volumeM3: item.volumeM3 != null ? String(item.volumeM3) : '',
      metadata: stringifyMetadata(item.metadata),
      attributes: (item.attributes ?? []).reduce<Record<string, AttributeValueState>>((acc, attr) => {
        const templateId = attr.template?.id;
        if (!templateId) {
          return acc;
        }
        switch (attr.template.dataType) {
          case 'number':
            acc[templateId] = { numberValue: attr.numberValue != null ? String(attr.numberValue) : '' };
            break;
          case 'boolean':
            acc[templateId] = { booleanValue: attr.booleanValue ?? false };
            break;
          case 'json':
            acc[templateId] = { jsonValue: stringifyJsonValue(attr.jsonValue) };
            break;
          default:
            acc[templateId] = { stringValue: attr.stringValue ?? '' };
            break;
        }
        return acc;
      }, {})
    });
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setCurrentItem(null);
    setFormError(null);
  };

  const handleInputChange = (field: keyof ItemFormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleAttributeChange = (templateId: string, update: AttributeValueState) => {
    setFormState((prev) => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        [templateId]: {
          ...prev.attributes[templateId],
          ...update
        }
      }
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    try {
      const payloadMetadata = JSON.parse(formState.metadata || '{}');
      if (typeof payloadMetadata !== 'object' || Array.isArray(payloadMetadata)) {
        throw new Error('metadata must be an object');
      }
      const attributesPayload = templates
        .map((template) => {
          const state = formState.attributes[template.id] ?? createDefaultAttributeState(template);
          switch (template.dataType) {
            case 'number': {
              if (!state.numberValue || !state.numberValue.trim()) {
                return null;
              }
              const parsed = Number(state.numberValue);
              if (!Number.isFinite(parsed)) {
                throw new Error(`Атрибут «${template.name}»: значение должно быть числом`);
              }
              return { templateId: template.id, numberValue: parsed };
            }
            case 'boolean': {
              if (state.booleanValue === undefined) {
                return null;
              }
              return { templateId: template.id, booleanValue: Boolean(state.booleanValue) };
            }
            case 'json': {
              if (!state.jsonValue || !state.jsonValue.trim()) {
                return null;
              }
              let parsed: unknown;
              try {
                parsed = JSON.parse(state.jsonValue);
              } catch {
                throw new Error(`Атрибут «${template.name}»: некорректный JSON`);
              }
              return { templateId: template.id, jsonValue: parsed };
            }
            default: {
              if (!state.stringValue || !state.stringValue.trim()) {
                return null;
              }
              return { templateId: template.id, stringValue: state.stringValue.trim() };
            }
          }
        })
        .filter(Boolean) as {
          templateId: string;
          stringValue?: string;
          numberValue?: number;
          booleanValue?: boolean;
          jsonValue?: unknown;
        }[];

      const payload = {
        sku: formState.sku.trim(),
        name: formState.name.trim(),
        description: formState.description.trim() || undefined,
        categoryId: formState.categoryId ? formState.categoryId : undefined,
        unitId: formState.unitId,
        barcode: formState.barcode.trim() || undefined,
        weightKg: parseNumber(formState.weightKg),
        volumeM3: parseNumber(formState.volumeM3),
        metadata: payloadMetadata as Record<string, unknown>,
        attributes: attributesPayload,
        warehouseIds: mode === 'edit' && currentItem?.warehouseIds ? currentItem.warehouseIds : []
      };

      if (!payload.sku || !payload.name) {
        setFormError('Укажите SKU и наименование изделия');
        return;
      }
      if (!payload.unitId) {
        setFormError('Выберите единицу измерения');
        return;
      }

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

  if (itemsQuery.isLoading || categoriesQuery.isLoading || unitsQuery.isLoading || templatesQuery.isLoading) {
    return <PageLoader />;
  }

  if (itemsQuery.isError) {
    return <div style={cardStyle}>Не удалось загрузить изделия: {(itemsQuery.error as Error).message}</div>;
  }

  return (
    <section style={layoutStyle}>
      <header style={headerStyle}>
        <h1 style={headingStyle}>Номенклатура</h1>
        <button type='button' style={primaryButtonStyle} onClick={openCreateDrawer}>
          Создать изделие
        </button>
      </header>
      <DataTable columns={columns} items={items} emptyMessage='Карточки изделий отсутствуют' />

      {isDrawerOpen ? (
        <SlideOver
          title={mode === 'create' ? 'Новое изделие' : `Редактирование: ${currentItem?.name ?? ''}`}
          onClose={closeDrawer}
        >
          <form style={formStyle} onSubmit={handleSubmit}>
            <div style={formRowStyle}>
              <label style={formControlStyle}>
                <span style={labelStyle}>SKU</span>
                <input
                  style={textInputStyle}
                  value={formState.sku}
                  onChange={(event) => handleInputChange('sku', event.target.value)}
                  required
                />
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
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label style={formControlStyle}>
                <span style={labelStyle}>Единица измерения</span>
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
                      {unit.name} ({unit.code})
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
            </div>

            <label style={formControlStyle}>
              <span style={labelStyle}>Метаданные (JSON)</span>
              <textarea
                style={textareaStyle}
                value={formState.metadata}
                onChange={(event) => handleInputChange('metadata', event.target.value)}
              />
            </label>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <span style={{ ...labelStyle, color: palette.textSecondary }}>Динамические атрибуты</span>
              {templates.map((template) => {
                const state = formState.attributes[template.id] ?? createDefaultAttributeState(template);
                switch (template.dataType) {
                  case 'number':
                    return (
                      <label key={template.id} style={formControlStyle}>
                        <span style={labelStyle}>{template.name}</span>
                        <input
                          style={textInputStyle}
                          type='number'
                          value={state.numberValue ?? ''}
                          onChange={(event) =>
                            handleAttributeChange(template.id, { numberValue: event.target.value })
                          }
                        />
                      </label>
                    );
                  case 'boolean':
                    return (
                      <label key={template.id} style={checkboxRowStyle}>
                        <input
                          type='checkbox'
                          checked={Boolean(state.booleanValue)}
                          onChange={(event) =>
                            handleAttributeChange(template.id, { booleanValue: event.target.checked })
                          }
                        />
                        {template.name}
                      </label>
                    );
                  case 'json':
                    return (
                      <label key={template.id} style={formControlStyle}>
                        <span style={labelStyle}>{template.name}</span>
                        <textarea
                          style={textareaStyle}
                          value={state.jsonValue ?? `{
}`}
                          onChange={(event) =>
                            handleAttributeChange(template.id, { jsonValue: event.target.value })
                          }
                        />
                      </label>
                    );
                  default:
                    return (
                      <label key={template.id} style={formControlStyle}>
                        <span style={labelStyle}>{template.name}</span>
                        <input
                          style={textInputStyle}
                          value={state.stringValue ?? ''}
                          onChange={(event) =>
                            handleAttributeChange(template.id, { stringValue: event.target.value })
                          }
                        />
                      </label>
                    );
                }
              })}
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
