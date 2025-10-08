import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

import type { WarehouseMenuNode } from '../types';
import '../../styles/warehouse.css';

const collectGroupIds = (nodes: WarehouseMenuNode[], acc: string[] = []) => {
  for (const node of nodes) {
    if (node.children?.length) {
      acc.push(node.id);
      collectGroupIds(node.children, acc);
    }
  }
  return acc;
};

const collectExpanded = (
  nodes: WarehouseMenuNode[],
  activePath: string,
  trail: string[] = [],
  expanded = new Set<string>()
): Set<string> | undefined => {
  for (const node of nodes) {
    const currentTrail = [...trail, node.id];
    const matches = node.path ? activePath.startsWith(node.path) : false;
    let childMatch = false;
    if (node.children?.length) {
      childMatch = collectExpanded(node.children, activePath, currentTrail, expanded) !== undefined;
    }
    if (matches || childMatch) {
      currentTrail.forEach((id) => expanded.add(id));
    }
    if (matches) {
      expanded.add(node.id);
    }
  }
  return expanded.size > 0 ? expanded : undefined;
};

export type LeftNavPanelProps = {
  items: WarehouseMenuNode[];
  activePath: string;
};

export const LeftNavPanel = ({ items, activePath }: LeftNavPanelProps) => {
  const groupIds = useMemo(() => collectGroupIds(items), [items]);
  const expandedByActive = useMemo(() => collectExpanded(items, activePath) ?? new Set<string>(), [items, activePath]);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set(groupIds));

  useEffect(() => {
    const next = new Set(groupIds);
    expandedByActive.forEach((id) => next.delete(id));
    setCollapsed(next);
  }, [groupIds, expandedByActive]);

  const toggleGroup = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const renderItems = (nodes: WarehouseMenuNode[], depth = 0): ReactNode =>
    nodes.map((node) => {
      const hasChildren = Boolean(node.children?.length);
      const isCollapsed = hasChildren && collapsed.has(node.id);
      const isActive = node.path ? activePath.startsWith(node.path) : false;

      return (
        <div key={node.id}>
          {hasChildren && !node.path ? (
            <button type='button' className='left-nav-panel__group-button' onClick={() => toggleGroup(node.id)}>
              <span>{node.label}</span>
              <span className='left-nav-panel__caret'>{isCollapsed ? '▸' : '▾'}</span>
            </button>
          ) : node.path ? (
            <NavLink
              to={node.path}
              className={({ isActive: linkActive }) =>
                [
                  'left-nav-panel__link',
                  (isActive || linkActive) && 'left-nav-panel__link--active',
                  depth > 0 && 'left-nav-panel__link--nested'
                ]
                  .filter(Boolean)
                  .join(' ')
              }
            >
              <span>{node.label}</span>
            </NavLink>
          ) : (
            <div className='left-nav-panel__group'>{node.label}</div>
          )}
          {hasChildren && !isCollapsed ? (
            <div
              className='left-nav-panel__children'
              style={{ '--left-nav-indent': `${(depth + 1) * 14}px` } as CSSProperties}
            >
              {renderItems(node.children!, depth + 1)}
            </div>
          ) : null}
        </div>
      );
    });

  return (
    <nav className='left-nav-panel'>
      <div className='left-nav-panel__group'>Разделы</div>
      {renderItems(items)}
      <div className='left-nav-panel__hint'>Навигация соответствует структуре 1С:Предприятие</div>
    </nav>
  );
};
