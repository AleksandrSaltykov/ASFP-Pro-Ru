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

const infoCardStyle: CSSProperties = {
  padding: 24,
  borderRadius: 20,
  border: `1px solid ${palette.border}`,
  background: palette.layer,
  boxShadow: palette.shadowSoft,
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

type TreeNode = CatalogNode & { children: TreeNode[] };

type CategoryFormState = {
  code: string;
  name: string;
  description: string;
  parentId: string;
  sortOrder: string;
  isActive: boolean;
  metadata: string;
};

const defaultCategoryFormState: CategoryFormState = {
  code: '',
  name: '',
  description: '',
  parentId: '',
  sortOrder: '',
  isActive: true,
  metadata: `{
}`
};

const buildTree = (nodes: CatalogNode[]) => {
  const map = new Map<string, TreeNode>();
  let rootId: string | undefined;

  nodes.forEach((node) => {
    const treeNode: TreeNode = { ...node, children: [] };
    map.set(node.id, treeNode);
    if (node.code === 'ROOT') {
      rootId = node.id;
    }
  });

  map.forEach((node) => {
    if (node.code === 'ROOT') {
      return;
    }
    const parent = node.parentId ? map.get(node.parentId) : undefined;
    if (parent) {
      parent.children.push(node);
    }
  });

  const rootNode = rootId ? map.get(rootId) : undefined;
  return {
    rootId,
    tree: rootNode ? rootNode.children : [],
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

const stringifyMetadata = (metadata: Record<string, unknown> | undefined) => {
  try {
    return JSON.stringify(metadata ?? {}, null, 2);
  } catch {
    return `{
}`;
  }
};

const parseMetadata = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return {} as Record<string, unknown>;
  }
  try {
    const parsed = JSON.parse(trimmed);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('metadata must be an object');
    }
    return parsed as Record<string, unknown>;
  } catch (error) {
    throw new Error((error as Error).message ?? 'Некорректный JSON');
  }
};

type ParentOption = {
  value: string;
  label: string;
};

const parentOptions = (nodes: CatalogNode[], rootId: string | undefined, blocklist?: Set<string>): ParentOption[] => {
  const options: ParentOption[] = [];
  if (rootId && (!blocklist || !blocklist.has(rootId))) {
    options.push({ value: rootId, label: 'Верхний уровень' });
  }
  nodes
    .filter((node) => node.code !== 'ROOT')
    .forEach((node) => {
      if (blocklist?.has(node.id)) {
        return;
      }
      options.push({ value: node.id, label: `${node.name} (${node.code})` });
    });
  return options;
};

const formatDateTime = (value: string) => new Date(value).toLocaleString('ru-RU');

const CategoriesPage = () => {
  const catalogQuery = useCatalogNodesQuery('category');
  const createMutation = useCreateCatalogNodeMutation();
  const updateMutation = useUpdateCatalogNodeMutation();
  const deleteMutation = useDeleteCatalogNodeMutation();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [formState, setFormState] = useState<CategoryFormState>(defaultCategoryFormState);
  const [formError, setFormError] = useState<string | null>(null);

  const rawNodes = useMemo(() => catalogQuery.data ?? [], [catalogQuery.data]);
  const { rootId, map } = useMemo(() => buildTree(rawNodes), [rawNodes]);

  const selectedNode = currentNodeId ? map.get(currentNodeId) ?? null : null;
  const descendantBlocklist = useMemo(() => collectDescendantIds(selectedNode ?? undefined), [selectedNode]);

  const flatNodes = useMemo(
    () =>
      rawNodes
        .filter((node) => node.code !== 'ROOT')
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name)),
    [rawNodes]
  );

  const columns: TableColumn<CatalogNode>[] = [
    {
      id: 'code',
      label: 'Код',
      render: (node) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <strong>{node.code}</strong>
          <span style={{ color: palette.textSecondary, fontSize: 12 }}>{node.name}</span>
        </div>
      )
    },
    {
      id: 'path',
      label: 'Путь',
      render: (node) => node.path?.replace('ROOT.', '').replace('ROOT', '—') ?? '—'
    },
    {
      id: 'parent',
      label: 'Родитель',
      render: (node) => {
        if (!node.parentId || node.parentId === rootId) {
          return 'Верхний уровень';
        }
        const parent = map.get(node.parentId);
        return parent ? parent.name : '—';
      }
    },
    {
      id: 'active',
      label: 'Активна',
      width: 100,
      render: (node) => (node.isActive ? 'Да' : 'Нет')
    },
    {
      id: 'updated',
      label: 'Обновлено',
      width: 180,
      render: (node) => formatDateTime(node.updatedAt)
    },
    {
      id: 'actions',
      label: 'Действия',
      width: 220,
      render: (node) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type='button'
            style={{ ...secondaryButtonStyle, padding: '8px 14px' }}
            onClick={() => openEditDrawer(node.id)}
          >
            Редактировать
          </button>
          <button
            type='button'
            style={{ ...secondaryButtonStyle, padding: '8px 14px' }}
            onClick={() => openCreateDrawer(node.id)}
          >
            Подкатегория
          </button>
        </div>
      )
    }
  ];

  const openCreateDrawer = (parentId?: string) => {
    setMode('create');
    setCurrentNodeId(null);
    setFormError(null);
    setFormState({
      ...defaultCategoryFormState,
      parentId: parentId ?? rootId ?? '',
      isActive: true
    });
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (nodeId: string) => {
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
      sortOrder: node.sortOrder != null ? String(node.sortOrder) : '',
      isActive: node.isActive,
      metadata: stringifyMetadata(node.metadata)
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
    if (!rootId) {
      return [];
    }
    if (mode === 'edit' && currentNodeId) {
      return parentOptions(rawNodes, rootId, descendantBlocklist);
    }
    return parentOptions(rawNodes, rootId);
  }, [mode, currentNodeId, rawNodes, rootId, descendantBlocklist]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const code = formState.code.trim();
    const name = formState.name.trim();
    if (!code || !name) {
      setFormError('Укажите код и название категории');
      return;
    }
    if (!rootId) {
      setFormError('Не найден корневой узел каталога');
      return;
    }

    let metadata: Record<string, unknown>;
    try {
      metadata = parseMetadata(formState.metadata);
    } catch (error) {
      setFormError((error as Error).message);
      return;
    }

    const sortOrderValue = formState.sortOrder.trim();
    let sortOrder: number | undefined;
    if (sortOrderValue) {
      const parsed = Number(sortOrderValue);
      if (!Number.isFinite(parsed)) {
        setFormError('Сортировка должна быть числом');
        return;
      }
      sortOrder = parsed;
    }

    const parentId = formState.parentId || rootId;
    if (mode === 'edit' && descendantBlocklist.has(parentId)) {
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
            sortOrder,
            isActive: formState.isActive,
            metadata
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
            sortOrder,
            isActive: formState.isActive,
            metadata
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

  if (catalogQuery.isError) {
    return <div style={infoCardStyle}>Не удалось загрузить категории: {(catalogQuery.error as Error).message}</div>;
  }

  return (
    <section style={layoutStyle}>
      <header style={headerStyle}>
        <h1 style={headingStyle}>Категории номенклатуры</h1>
        <button type='button' style={primaryButtonStyle} onClick={() => openCreateDrawer()}>
          Новая категория
        </button>
      </header>

      <div style={infoCardStyle}>
        <strong style={{ fontSize: 16, color: palette.textPrimary }}>Иерархия</strong>
        <span>
          Используйте верхний уровень для основных групп, а кнопку «Подкатегория» в таблице — чтобы создать вложенную
          структуру. Все изменения выполняются в боковой панели без перезагрузки данных.
        </span>
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
                  onChange={(event) => handleInputChange('code', event.target.value.toUpperCase())}
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
              <label style={formControlStyle}>
                <span style={labelStyle}>Сортировка</span>
                <input
                  style={textInputStyle}
                  value={formState.sortOrder}
                  onChange={(event) => handleInputChange('sortOrder', event.target.value)}
                />
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

            <label style={formControlStyle}>
              <span style={labelStyle}>Метаданные (JSON)</span>
              <textarea
                style={textareaStyle}
                value={formState.metadata}
                onChange={(event) => handleInputChange('metadata', event.target.value)}
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

export default CategoriesPage;
