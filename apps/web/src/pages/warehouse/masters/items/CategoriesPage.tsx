import { FormEvent, useMemo, useState, type CSSProperties } from 'react';

import {
  useCatalogNodesQuery,
  useCreateCatalogNodeMutation,
  useDeleteCatalogNodeMutation,
  useUpdateCatalogNodeMutation,
  type CatalogNode
} from '@shared/api';
import { PageLoader } from '@shared/ui/PageLoader';
import { iconMap } from '@shared/ui/icons';
import { palette, typography } from '@shared/ui/theme';

import DataTable, { type TableColumn } from '../../components/DataTable';
import SlideOver from '../../components/SlideOver';
import { generateCategoryCode } from '@shared/utils/identifiers';
import { fallbackCategories } from '../../../../modules/warehouse/views/masters/fallbacks';
import { shouldUseFallback } from '../../../../modules/warehouse/views/masters/utils';

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

const infoCardStyle: CSSProperties = {
  padding: 24,
  borderRadius: 20,
  border: `1px solid ${palette.border}`,
  background: palette.layer,
  boxShadow: palette.shadowElevated,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  fontSize: 14,
  color: palette.textSecondary
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

const fieldHintStyle: CSSProperties = {
  fontSize: 12,
  color: palette.textSecondary
};

type TreeNode = CatalogNode & { children: TreeNode[] };
type TreeRow = TreeNode & { depth: number; breadcrumb: string[] };

type CategoryFormState = {
  code: string;
  name: string;
  description: string;
  parentId: string;
  isActive: boolean;
};

const defaultCategoryFormState: CategoryFormState = {
  code: '',
  name: '',
  description: '',
  parentId: '',
  isActive: true
};

const buildTree = (nodes: CatalogNode[]) => {
  const map = new Map<string, TreeNode>();
  let explicitRootId: string | undefined;

  nodes.forEach((node) => {
    const treeNode: TreeNode = { ...node, children: [] };
    map.set(node.id, treeNode);
    if (!explicitRootId && node.code === 'ROOT') {
      explicitRootId = node.id;
    }
  });

  map.forEach((node) => {
    if (!node.parentId) {
      return;
    }
    const parent = map.get(node.parentId);
    if (parent) {
      parent.children.push(node);
    }
  });

  if (explicitRootId) {
    const rootNode = map.get(explicitRootId);
    return {
      rootId: explicitRootId,
      tree: rootNode ? rootNode.children : [],
      map
    };
  }

  const topLevel: TreeNode[] = [];
  map.forEach((node) => {
    if (!node.parentId || !map.has(node.parentId)) {
      topLevel.push(node);
    }
  });

  return {
    rootId: undefined,
    tree: topLevel,
    map
  };
};

const collectDescendantIds = (node: TreeNode | undefined): Set<string> => {
  if (!node) {
    return new Set();
  }
  const stack = [...node.children];
  const ids = new Set<string>([node.id]);
  while (stack.length) {
    const current = stack.pop();
    if (!current) {
      continue;
    }
    ids.add(current.id);
    stack.push(...current.children);
  }
  return ids;
};

type ParentOption = {
  value: string;
  label: string;
};

const CategoriesPage = () => {
  const catalogQuery = useCatalogNodesQuery('category');
  const createMutation = useCreateCatalogNodeMutation();
  const updateMutation = useUpdateCatalogNodeMutation();
  const deleteMutation = useDeleteCatalogNodeMutation();

  const useFallback = shouldUseFallback(catalogQuery.error);
  const operationsDisabled = useFallback;
  const offlineMessage =
    'Операции с категориями доступны только при подключении к WMS. Проверьте соединение или права доступа.';

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [formState, setFormState] = useState<CategoryFormState>(defaultCategoryFormState);
  const [formError, setFormError] = useState<string | null>(null);

  const rawNodes = useMemo(() => {
    if (useFallback) {
      return fallbackCategories;
    }
    return catalogQuery.data ?? [];
  }, [catalogQuery.data, useFallback]);
  const { rootId, tree, map } = useMemo(() => buildTree(rawNodes), [rawNodes]);

  const notifyOffline = () => {
    window.alert(offlineMessage);
  };

  const orderedNodes = useMemo<TreeRow[]>(() => {
    const result: TreeRow[] = [];
    const walk = (nodes: TreeNode[], depth: number, trail: string[]) => {
      const sorted = [...nodes].sort(
        (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name)
      );
      sorted.forEach((node) => {
        const currentTrail = [...trail, node.name];
        result.push({ ...node, depth, breadcrumb: currentTrail });
        if (node.children.length) {
          walk(node.children, depth + 1, currentTrail);
        }
      });
    };
    walk(tree, 0, []);
    return result;
  }, [tree]);

  const flatNodes = orderedNodes;

  const selectedNode = currentNodeId ? map.get(currentNodeId) ?? null : null;
  const descendantBlocklist = useMemo(() => collectDescendantIds(selectedNode ?? undefined), [selectedNode]);

  const columns: TableColumn<TreeRow>[] = [
    {
      id: 'name',
      label: 'Название',
      render: (node) => {
        const fullName = node.breadcrumb.join(' / ');
        return (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
            title={fullName}
          >
            <strong>{fullName}</strong>
          </div>
        );
      }
    },
    {
      id: 'parent',
      label: 'Родитель',
      width: 200,
      render: (node) => {
        if (node.breadcrumb.length <= 1) {
          return <span style={{ whiteSpace: 'nowrap' }}>Верхний уровень</span>;
        }
        return <span style={{ whiteSpace: 'nowrap' }}>{node.breadcrumb[node.breadcrumb.length - 2]}</span>;
      }
    },
    {
      id: 'active',
      label: 'Статус',
      width: 140,
      render: (node) => (node.isActive ? 'Активна' : 'Неактивна')
    },
    {
      id: 'actions',
      label: 'Действия',
      width: 140,
      render: (node) => (
        <div className='list-form__actions'>
          <button
            type='button'
            className='list-form__icon-button list-form__icon-button--edit'
            onClick={(event) => {
              event.stopPropagation();
              openEditDrawer(node.id);
            }}
            aria-label={`Редактировать «${node.name}»`}
            title='Редактировать'
          >
            <span className='list-form__icon'>{iconMap.gear}</span>
          </button>
          <button
            type='button'
            className='list-form__icon-button'
            onClick={(event) => {
              event.stopPropagation();
              openCreateDrawer(node.id);
            }}
            aria-label={`Добавить подкатегорию для «${node.name}»`}
            title='Добавить подкатегорию'
          >
            <span className='list-form__icon'>{iconMap.plus}</span>
          </button>
        </div>
      )
    }
  ];

  const openCreateDrawer = (parentId?: string) => {
    if (operationsDisabled) {
      notifyOffline();
      return;
    }
    setMode('create');
    setCurrentNodeId(null);
    setFormError(null);
    setFormState({
      ...defaultCategoryFormState,
      code: generateCategoryCode(),
      parentId: parentId ?? rootId ?? '',
      isActive: true
    });
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (nodeId: string) => {
    if (operationsDisabled) {
      notifyOffline();
      return;
    }
    const node = map.get(nodeId);
    if (!node) {
      return;
    }
    setMode('edit');
    setCurrentNodeId(nodeId);
    setFormError(null);
    setFormState({
      code: node.code,
      name: node.name,
      description: node.description ?? '',
      parentId: node.parentId ?? rootId ?? '',
      isActive: node.isActive
    });
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setFormError(null);
  };

  const handleInputChange = (field: keyof CategoryFormState, value: string | boolean) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const resolvedParentOptions = useMemo(() => {
    const block = mode === 'edit' && currentNodeId ? descendantBlocklist : undefined;
    const options: ParentOption[] = [];
    const topValue = rootId ?? '';
    if (!block || (rootId ? !block.has(rootId) : true)) {
      options.push({ value: topValue, label: 'Верхний уровень' });
    }
    orderedNodes.forEach((node) => {
      if (block?.has(node.id)) {
        return;
      }
      const indent = node.depth ? `${'  '.repeat(node.depth)}- ` : '';
      options.push({
        value: node.id,
        label: `${indent}${node.name}`
      });
    });
    return options;
  }, [rootId, orderedNodes, mode, currentNodeId, descendantBlocklist]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (operationsDisabled) {
      setFormError(offlineMessage);
      return;
    }

    const code = formState.code.trim();
    const name = formState.name.trim();
    if (!name) {
      setFormError('Укажите название категории');
      return;
    }
    if (!code) {
      setFormError('Не удалось сгенерировать код категории');
      return;
    }
    const parentValue = formState.parentId || rootId || '';
    const parentId = parentValue || null;
    if (mode === 'edit' && parentId && descendantBlocklist.has(parentId)) {
      setFormError('Нельзя выбрать дочерний элемент в качестве родителя');
      return;
    }

    try {
      if (mode === 'create') {
        await createMutation.mutateAsync({
          catalogType: 'category',
          payload: {
            parentId,
            code,
            name,
            description: formState.description.trim() || undefined,
            isActive: formState.isActive
          }
        });
      } else if (currentNodeId) {
        await updateMutation.mutateAsync({
          catalogType: 'category',
          nodeId: currentNodeId,
          payload: {
            parentId,
            code,
            name,
            description: formState.description.trim() || undefined,
            isActive: formState.isActive
          }
        });
      }
      closeDrawer();
    } catch (error) {
      setFormError((error as Error).message ?? 'Не удалось сохранить изменения');
    }
  };

  const handleDelete = async () => {
    if (!currentNodeId) {
      return;
    }
    if (operationsDisabled) {
      notifyOffline();
      return;
    }
    if (!window.confirm('Удалить категорию?')) {
      return;
    }
    try {
      await deleteMutation.mutateAsync({ catalogType: 'category', nodeId: currentNodeId });
      closeDrawer();
    } catch (error) {
      setFormError((error as Error).message ?? 'Не удалось удалить категорию');
    }
  };

  if (catalogQuery.isLoading) {
    return <PageLoader />;
  }

  if (catalogQuery.isError && !useFallback) {
    return <div style={infoCardStyle}>Не удалось загрузить категории: {(catalogQuery.error as Error).message}</div>;
  }

  return (
    <section style={layoutStyle}>
      <header style={headerStyle}>
        <h1 style={headingStyle}>Категории номенклатуры</h1>
        <button
          type='button'
          style={{
            ...primaryButtonStyle,
            opacity: operationsDisabled ? 0.6 : 1,
            cursor: operationsDisabled ? 'not-allowed' : 'pointer'
          }}
          onClick={() => openCreateDrawer()}
          disabled={operationsDisabled}
          title={operationsDisabled ? offlineMessage : undefined}
        >
          Новая категория
        </button>
      </header>

      <div style={infoCardStyle}>
        <strong style={{ fontSize: 16, color: palette.textPrimary }}>Иерархия</strong>
        <span>
          Используйте верхний уровень для основных групп, а кнопку «Подкатегория» в таблице — чтобы создать вложенную
          структуру. Все изменения выполняются в боковой панели без перезагрузки данных.
        </span>
        {useFallback ? (
          <span style={{ color: palette.textPrimary, fontWeight: 600 }}>
            Сейчас отображаются резервные данные без связи с сервером. Изменение категорий временно недоступно.
          </span>
        ) : null}
      </div>

      <DataTable columns={columns} items={flatNodes} emptyMessage='Категории пока не созданы' />

      {isDrawerOpen ? (
        <SlideOver
          title={mode === 'create' ? 'Новая категория' : `Редактирование: ${selectedNode?.name ?? ''}`}
          onClose={closeDrawer}
        >
          <form style={formStyle} onSubmit={handleSubmit}>
            <div style={formRowStyle}>
              <label style={formControlStyle}>
                <span style={labelStyle}>Код</span>
                <input
                  style={textInputStyle}
                  value={formState.code}
                  readOnly
                  disabled
                  title='Код создаётся автоматически'
                />
                <span style={fieldHintStyle}>Значение назначается автоматически и недоступно для изменения</span>
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
                <span style={labelStyle}>Родитель</span>
                <select
                  style={textInputStyle}
                  value={formState.parentId}
                  onChange={(event) => handleInputChange('parentId', event.target.value)}
                >
                  {resolvedParentOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label style={checkboxRowStyle}>
              <input
                type='checkbox'
                checked={formState.isActive}
                onChange={(event) => handleInputChange('isActive', event.target.checked)}
              />
              Категория активна
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

export default CategoriesPage;
