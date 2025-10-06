import { useMemo } from 'react';

import type { CatalogNode } from '@shared/api';

import '../../../../styles/warehouse.css';

type CategoryTreeSelectProps = {
  nodes: CatalogNode[];
  value: string;
  label?: string;
  disabled?: boolean;
  onOpenSelector?: (currentId: string | null) => void;
};

export const CategoryTreeSelect = ({ nodes, value, label, disabled = false, onOpenSelector }: CategoryTreeSelectProps) => {
  const nodeMap = useMemo(() => {
    const map = new Map<string, CatalogNode>();
    nodes.forEach((node) => {
      map.set(node.id, node);
    });
    return map;
  }, [nodes]);

  const selectedNode = value ? nodeMap.get(value) : undefined;
  const displayLabel = label?.trim()
    ? label.trim()
    : selectedNode?.name?.trim() ?? selectedNode?.code?.trim() ?? value ?? '';
  const isEmpty = !displayLabel;
  const title = isEmpty ? 'Без группы' : displayLabel;
  const code = selectedNode?.code?.trim();
  const showCode = Boolean(code && code !== title);

  const rootClassName = ['category-select', 'category-select--single', disabled ? 'category-select--disabled' : null]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClassName}>
      <div className={['category-select__current', isEmpty ? 'category-select__current--empty' : null].filter(Boolean).join(' ')}>
        <span className='category-select__current-name'>{title}</span>
        {showCode ? <span className='category-select__code'>{code}</span> : null}
      </div>
      <button
        type='button'
        className='category-select__choose'
        onClick={() => onOpenSelector?.(value || null)}
        disabled={disabled}
      >
        Выбор
      </button>
    </div>
  );
};

export default CategoryTreeSelect;
