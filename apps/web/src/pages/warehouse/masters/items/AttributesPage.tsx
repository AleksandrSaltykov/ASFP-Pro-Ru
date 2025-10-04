import { FormEvent, useMemo, useState, type CSSProperties } from 'react';

import {
  useAttributeTemplatesQuery,
  useCreateAttributeTemplateMutation,
  useDeleteAttributeTemplateMutation,
  useUpdateAttributeTemplateMutation,
  type AttributeTemplate,
  type AttributeDataType
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

type AttributeTemplateFormState = {
  code: string;
  name: string;
  description: string;
  dataType: AttributeDataType;
  isRequired: boolean;
  position: string;
  metadata: string;
  uiSchema: string;
};

const defaultTemplateFormState: AttributeTemplateFormState = {
  code: '',
  name: '',
  description: '',
  dataType: 'string',
  isRequired: false,
  position: '',
  metadata: `{
  "options": []
}`,
  uiSchema: `{
  "component": "Input"
}`
};

const stringifyMetadata = (value: Record<string, unknown> | undefined) => {
  try {
    return JSON.stringify(value ?? {}, null, 2);
  } catch {
    return `{
}`;
  }
};

const AttributesPage = () => {
  const templatesQuery = useAttributeTemplatesQuery('item');
  const createMutation = useCreateAttributeTemplateMutation();
  const updateMutation = useUpdateAttributeTemplateMutation();
  const deleteMutation = useDeleteAttributeTemplateMutation();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [currentTemplate, setCurrentTemplate] = useState<AttributeTemplate | null>(null);
  const [formState, setFormState] = useState<AttributeTemplateFormState>(defaultTemplateFormState);
  const [formError, setFormError] = useState<string | null>(null);

  const templates = useMemo(() => templatesQuery.data ?? [], [templatesQuery.data]);

  const columns: TableColumn<AttributeTemplate>[] = [
    {
      id: 'code',
      label: 'Код',
      render: (template) => template.code
    },
    {
      id: 'name',
      label: 'Название',
      render: (template) => template.name
    },
    {
      id: 'dataType',
      label: 'Тип',
      render: (template) => template.dataType,
      width: 120
    },
    {
      id: 'required',
      label: 'Обязательный',
      render: (template) => (template.isRequired ? 'Да' : 'Нет'),
      width: 140
    },
    {
      id: 'position',
      label: 'Позиция',
      render: (template) => template.position,
      width: 120
    },
    {
      id: 'actions',
      label: 'Действия',
      render: (template) => (
        <button
          type='button'
          style={{ ...secondaryButtonStyle, padding: '8px 14px' }}
          onClick={() => openEditDrawer(template)}
        >
          Редактировать
        </button>
      ),
      width: 160
    }
  ];

  const openCreateDrawer = () => {
    setMode('create');
    setCurrentTemplate(null);
    setFormError(null);
    setFormState(defaultTemplateFormState);
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (template: AttributeTemplate) => {
    setMode('edit');
    setCurrentTemplate(template);
    setFormError(null);
    setFormState({
      code: template.code,
      name: template.name,
      description: template.description ?? '',
      dataType: template.dataType,
      isRequired: template.isRequired,
      position: String(template.position ?? ''),
      metadata: stringifyMetadata(template.metadata),
      uiSchema: stringifyMetadata(template.uiSchema)
    });
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setFormError(null);
    setCurrentTemplate(null);
  };

  const handleInputChange = (field: keyof AttributeTemplateFormState, value: string | boolean) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const parseJsonObject = (value: string, field: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return {} as Record<string, unknown>;
    }
    try {
      const parsed = JSON.parse(trimmed);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error(`${field} must be an object`);
      }
      return parsed as Record<string, unknown>;
    } catch {
      throw new Error(`Некорректный JSON в поле «${field}»`);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const code = formState.code.trim();
    const name = formState.name.trim();
    if (!code || !name) {
      setFormError('Укажите код и название атрибута');
      return;
    }

    let metadata: Record<string, unknown>;
    let uiSchema: Record<string, unknown>;
    try {
      metadata = parseJsonObject(formState.metadata, 'Метаданные');
      uiSchema = parseJsonObject(formState.uiSchema, 'UI-схема');
    } catch (error) {
      setFormError((error as Error).message);
      return;
    }

    const positionValue = formState.position.trim();
    const position = positionValue ? Number(positionValue) : undefined;
    if (positionValue && !Number.isFinite(Number(positionValue))) {
      setFormError('Позиция должна быть числом');
      return;
    }

    try {
      if (mode === 'create') {
        await createMutation.mutateAsync({
          targetType: 'item',
          payload: {
            code,
            name,
            description: formState.description.trim() || undefined,
            dataType: formState.dataType,
            isRequired: formState.isRequired,
            position,
            metadata,
            uiSchema
          }
        });
      } else if (currentTemplate) {
        await updateMutation.mutateAsync({
          templateId: currentTemplate.id,
          targetType: 'item',
          payload: {
            code: currentTemplate.code,
            name,
            description: formState.description.trim() || undefined,
            dataType: formState.dataType,
            isRequired: formState.isRequired,
            position,
            metadata,
            uiSchema
          }
        });
      }
      closeDrawer();
    } catch (error) {
      setFormError((error as Error).message ?? 'Не удалось сохранить атрибут');
    }
  };

  const handleDelete = async () => {
    if (!currentTemplate) {
      return;
    }
    if (!window.confirm('Удалить атрибут?')) {
      return;
    }
    try {
      await deleteMutation.mutateAsync({ templateId: currentTemplate.id, targetType: 'item' });
      closeDrawer();
    } catch (error) {
      setFormError((error as Error).message ?? 'Не удалось удалить атрибут');
    }
  };

  if (templatesQuery.isLoading) {
    return <PageLoader />;
  }

  if (templatesQuery.isError) {
    return <div style={{ ...layoutStyle, padding: 24 }}>Не удалось загрузить атрибуты: {(templatesQuery.error as Error).message}</div>;
  }

  return (
    <section style={layoutStyle}>
      <header style={headerStyle}>
        <h2 style={headingStyle}>Динамические атрибуты</h2>
        <button type='button' style={primaryButtonStyle} onClick={openCreateDrawer}>
          Новый атрибут
        </button>
      </header>
      <DataTable columns={columns} items={templates} emptyMessage='Атрибуты отсутствуют' />

      {isDrawerOpen ? (
        <SlideOver
          title={mode === 'create' ? 'Новый атрибут' : `Редактирование: ${currentTemplate?.name ?? ''}`}
          onClose={closeDrawer}
        >
          <form style={formStyle} onSubmit={handleSubmit}>
            <div style={formRowStyle}>
              <label style={formControlStyle}>
                <span style={labelStyle}>Код</span>
                <input
                  style={textInputStyle}
                  value={formState.code}
                  onChange={(event) => handleInputChange('code', event.target.value)}
                  required
                  disabled={mode === 'edit'}
                />
              </label>
              <label style={formControlStyle}>
                <span style={labelStyle}>Название</span>
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
                <span style={labelStyle}>Тип данных</span>
                <select
                  style={textInputStyle}
                  value={formState.dataType}
                  onChange={(event) => handleInputChange('dataType', event.target.value as AttributeDataType)}
                >
                  <option value='string'>string</option>
                  <option value='number'>number</option>
                  <option value='boolean'>boolean</option>
                  <option value='json'>json</option>
                </select>
              </label>
              <label style={formControlStyle}>
                <span style={labelStyle}>Позиция</span>
                <input
                  style={textInputStyle}
                  type='number'
                  value={formState.position}
                  onChange={(event) => handleInputChange('position', event.target.value)}
                />
              </label>
            </div>

            <label style={checkboxRowStyle}>
              <input
                type='checkbox'
                checked={formState.isRequired}
                onChange={(event) => handleInputChange('isRequired', event.target.checked)}
              />
              Обязательное поле
            </label>

            <label style={formControlStyle}>
              <span style={labelStyle}>Метаданные (JSON)</span>
              <textarea
                style={textareaStyle}
                value={formState.metadata}
                onChange={(event) => handleInputChange('metadata', event.target.value)}
              />
            </label>

            <label style={formControlStyle}>
              <span style={labelStyle}>UI-схема (JSON)</span>
              <textarea
                style={textareaStyle}
                value={formState.uiSchema}
                onChange={(event) => handleInputChange('uiSchema', event.target.value)}
              />
            </label>

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

export default AttributesPage;
