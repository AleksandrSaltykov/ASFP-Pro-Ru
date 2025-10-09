import { FormEvent, useMemo, useState, type CSSProperties } from 'react';

import {
  useCatalogNodesQuery,
  useCreateCatalogNodeMutation,
  useDeleteCatalogNodeMutation,
  useUpdateCatalogNodeMutation,
  type CatalogNode
} from '@shared/api';
import { PageLoader } from '@shared/ui/PageLoader';
import { palette, typography } from '@shared/ui/theme';
import { iconMap } from '@shared/ui/icons';
import { generateUnitCode } from '@shared/utils/identifiers';

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

const iconButtonStyle: CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 14,
  border: 'none',
  background: 'transparent',
  color: palette.primary,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
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

type UnitFormState = {
  code: string;
  name: string;
  description: string;
  isActive: boolean;
};

const defaultUnitFormState: UnitFormState = {
  code: '',
  name: '',
  description: '',
  isActive: true
};

const UnitsPage = () => {
  const unitsQuery = useCatalogNodesQuery('unit');
  const createMutation = useCreateCatalogNodeMutation();
  const updateMutation = useUpdateCatalogNodeMutation();
  const deleteMutation = useDeleteCatalogNodeMutation();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [currentUnit, setCurrentUnit] = useState<CatalogNode | null>(null);
  const [formState, setFormState] = useState<UnitFormState>(defaultUnitFormState);
  const [formError, setFormError] = useState<string | null>(null);

  const units = useMemo(() => unitsQuery.data ?? [], [unitsQuery.data]);

  const columns: TableColumn<CatalogNode>[] = [
    {
      id: 'name',
      label: 'Наименование',
      render: (unit) => <strong>{unit.name}</strong>
    },
    {
      id: 'active',
      label: 'Активна',
      render: (unit) => (unit.isActive ? 'Да' : 'Нет'),
      width: 100
    },
    {
      id: 'actions',
      label: 'Действия',
      render: (unit) => (
        <button
          type='button'
          style={iconButtonStyle}
          onClick={() => openEditDrawer(unit)}
          title='Редактировать'
          aria-label={`Редактировать «${unit.name}»`}
        >
          {iconMap.gear}
        </button>
      ),
      width: 90
    }
  ];

  const openCreateDrawer = () => {
    setMode('create');
    setCurrentUnit(null);
    setFormError(null);
    setFormState({ ...defaultUnitFormState, code: generateUnitCode() });
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (unit: CatalogNode) => {
    setMode('edit');
    setCurrentUnit(unit);
    setFormError(null);
    setFormState({
      code: unit.code,
      name: unit.name,
      description: unit.description ?? '',
      isActive: unit.isActive
    });
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setFormError(null);
    setCurrentUnit(null);
  };

  const handleInputChange = (field: keyof UnitFormState, value: string | boolean) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const code = formState.code.trim();
    const name = formState.name.trim();
    if (!code || !name) {
      setFormError('Укажите код и название единицы измерения');
      return;
    }

    try {
      if (mode === 'create') {
        await createMutation.mutateAsync({
          catalogType: 'unit',
          payload: {
            code: code.toUpperCase(),
            name,
            description: formState.description.trim() || undefined,
            isActive: formState.isActive
          }
        });
      } else if (currentUnit) {
        await updateMutation.mutateAsync({
          catalogType: 'unit',
          nodeId: currentUnit.id,
          payload: {
            code: currentUnit.code,
            name,
            description: formState.description.trim() || undefined,
            isActive: formState.isActive
          }
        });
      }
      await unitsQuery.refetch();
      closeDrawer();
    } catch (error) {
      setFormError((error as Error).message ?? 'Не удалось сохранить изменения');
    }
  };

  const handleDelete = async () => {
    if (!currentUnit) {
      return;
    }
    if (!window.confirm('Удалить единицу измерения?')) {
      return;
    }
    try {
      await deleteMutation.mutateAsync({ catalogType: 'unit', nodeId: currentUnit.id });
      await unitsQuery.refetch();
      closeDrawer();
    } catch (error) {
      setFormError((error as Error).message ?? 'Не удалось удалить единицу');
    }
  };

  if (unitsQuery.isLoading) {
    return <PageLoader />;
  }

  if (unitsQuery.isError) {
    return <div style={{ ...layoutStyle, padding: 24 }}>Не удалось загрузить единицы: {(unitsQuery.error as Error).message}</div>;
  }

  return (
    <section style={layoutStyle}>
      <header style={headerStyle}>
        <h2 style={headingStyle}>Единицы измерения</h2>
        <button type='button' style={primaryButtonStyle} onClick={openCreateDrawer}>
          Новая единица
        </button>
      </header>
      <DataTable columns={columns} items={units} emptyMessage='Единицы измерения не созданы' />

      {isDrawerOpen ? (
        <SlideOver
          title={mode === 'create' ? 'Новая единица' : `Редактирование: ${currentUnit?.name ?? ''}`}
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
                  disabled
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

            <label style={checkboxRowStyle}>
              <input
                type='checkbox'
                checked={formState.isActive}
                onChange={(event) => handleInputChange('isActive', event.target.checked)}
              />
              Активна
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

export default UnitsPage;
