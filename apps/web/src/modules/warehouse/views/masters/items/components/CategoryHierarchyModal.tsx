import { useMemo, type CSSProperties } from 'react';

import type { CatalogNode } from '@shared/api';

import '../../../../styles/warehouse.css';

export type CategoryHierarchyModalProps = {
  open: boolean;
  nodes: CatalogNode[];
  onClose: () => void;
  onCreate?: (parentId?: string | null) => void;
  onEdit?: (node: CatalogNode) => void;
  onDelete?: (node: CatalogNode) => void;
  onSelect?: (node: CatalogNode | null) => void;
  selectedId?: string | null;
};

type CategoryTreeNode = CatalogNode & {
  children: CategoryTreeNode[];
};

const buildTree = (nodes: CatalogNode[]): CategoryTreeNode[] => {
  const map = new Map<string, CategoryTreeNode>();
  const roots: CategoryTreeNode[] = [];

  nodes.forEach((node) => {
    map.set(node.id, { ...node, children: [] });
  });

  map.forEach((node) => {
    const parentId = node.parentId ?? undefined;
    if (parentId && map.has(parentId)) {
      map.get(parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sort = (items: CategoryTreeNode[]) => {
    items.sort((a, b) => {
      const orderDiff = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      if (orderDiff !== 0) {
        return orderDiff;
      }
      return (a.name ?? '').localeCompare(b.name ?? '', 'ru');
    });
    items.forEach((child) => sort(child.children));
  };

  sort(roots);
  return roots;
};

const renderTree = (
  nodes: CategoryTreeNode[],
  options: {
    onCreate?: CategoryHierarchyModalProps['onCreate'];
    onEdit?: CategoryHierarchyModalProps['onEdit'];
    onDelete?: CategoryHierarchyModalProps['onDelete'];
    onSelect?: CategoryHierarchyModalProps['onSelect'];
    selectedId?: string | null;
  },
  depth = 0
) =>
  nodes.map((node) => {
    const isSelected = options.selectedId === node.id;
    const selectable = Boolean(options.onSelect);
    const actionsAvailable = Boolean(options.onCreate || options.onEdit || options.onDelete);

    const infoContent = (
      <>
        <span className='category-hierarchy__name'>{node.name}</span>
        {node.code ? <span className='category-hierarchy__code'>{node.code}</span> : null}
        {node.description ? <span className='category-hierarchy__description'>{node.description}</span> : null}
      </>
    );

    const infoElement = selectable ? (
      <button
        type='button'
        className={[
          'category-hierarchy__selector',
          isSelected ? 'category-hierarchy__selector--active' : null
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={() => options.onSelect?.(node)}
      >
        {infoContent}
      </button>
    ) : (
      <div className='category-hierarchy__info'>{infoContent}</div>
    );

    return (
      <li
        key={node.id}
        className={[
          'category-hierarchy__item',
          selectable ? 'category-hierarchy__item--selectable' : null,
          isSelected ? 'category-hierarchy__item--selected' : null
        ]
          .filter(Boolean)
          .join(' ')}
        style={{ '--category-depth': depth } as CSSProperties}
      >
        <div className='category-hierarchy__row'>
          {infoElement}
          {actionsAvailable ? (
            <div className='category-hierarchy__actions'>
              {options.onCreate ? (
                <button
                  type='button'
                  className='category-hierarchy__icon-button'
                  title='Добавить вложенную группу'
                  onClick={() => options.onCreate?.(node.id)}
                >
                  +
                </button>
              ) : null}
              {options.onEdit ? (
                <button
                  type='button'
                  className='category-hierarchy__icon-button'
                  title='Редактировать'
                  onClick={() => options.onEdit?.(node)}
                >
                  ✶
                </button>
              ) : null}
              {options.onDelete ? (
                <button
                  type='button'
                  className='category-hierarchy__icon-button category-hierarchy__icon-button--danger'
                  title='Удалить'
                  onClick={() => options.onDelete?.(node)}
                >
                  ×
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
        {node.children.length ? (
          <ul className='category-hierarchy__list category-hierarchy__list--nested'>
            {renderTree(node.children, options, depth + 1)}
          </ul>
        ) : null}
      </li>
    );
  });

export const CategoryHierarchyModal = ({
  open,
  nodes,
  onClose,
  onCreate,
  onEdit,
  onDelete,
  onSelect,
  selectedId
}: CategoryHierarchyModalProps) => {
  const tree = useMemo(() => buildTree(nodes), [nodes]);
  const selectionMode = Boolean(onSelect);

  if (!open) {
    return null;
  }

  return (
    <div className='category-hierarchy__overlay'>
      <div className='category-hierarchy__modal'>
        <header className='category-hierarchy__header'>
          <div>
            <h2 className='category-hierarchy__title'>Группы номенклатуры</h2>
            <p className='category-hierarchy__subtitle'>
              {selectionMode
                ? 'Выберите группу, к которой будет относиться номенклатура.'
                : 'Управляйте деревом групп: создавайте вложенные разделы и редактируйте существующие.'}
            </p>
          </div>
          <div className='category-hierarchy__header-actions'>
            {selectionMode ? (
              <button
                type='button'
                className={[
                  'category-hierarchy__secondary-action',
                  selectedId == null ? 'category-hierarchy__secondary-action--active' : null
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => onSelect?.(null)}
              >
                Без группы
              </button>
            ) : null}
            {onCreate ? (
              <button type='button' className='warehouse-shell__primary-action' onClick={() => onCreate(null)}>
                Новая группа
              </button>
            ) : null}
            <button type='button' className='category-hierarchy__close' aria-label='Закрыть' onClick={onClose}>
              ×
            </button>
          </div>
        </header>
        <div className='category-hierarchy__body'>
          {tree.length ? (
            <ul className='category-hierarchy__list'>
              {renderTree(tree, {
                onCreate,
                onEdit,
                onDelete,
                onSelect,
                selectedId
              })}
            </ul>
          ) : (
            <div className='category-hierarchy__empty'>Нет созданных групп. Создайте первую группу, чтобы начать.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryHierarchyModal;
