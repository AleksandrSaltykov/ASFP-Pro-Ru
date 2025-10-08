import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';

import type { WarehouseMenuNode } from '../types';
import '../../styles/warehouse.css';

const STORAGE_KEY = 'warehouse.leftnav.collapsed';

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
  normalize: (value: string) => string,
  trail: string[] = [],
  expanded = new Set<string>()
): boolean => {
  let matchedAny = false;
  for (const node of nodes) {
    const currentTrail = [...trail, node.id];
    const normalizedNodePath = node.path ? normalize(node.path) : null;
    const isExactMatch = normalizedNodePath ? activePath === normalizedNodePath : false;
    const shouldExpandChild = normalizedNodePath
      ? activePath.startsWith(`${normalizedNodePath}/`)
      : false;
    const childMatch = node.children?.length
      ? collectExpanded(node.children, activePath, normalize, currentTrail, expanded)
      : false;
    if (isExactMatch || shouldExpandChild || childMatch) {
      matchedAny = true;
      currentTrail.forEach((id) => expanded.add(id));
    }
  }
  return matchedAny;
};

export type LeftNavPanelProps = {
  items: WarehouseMenuNode[];
  activePath: string;
};

const readCollapsedFromStorage = (validIds: string[]): Set<string> | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return null;
    }
    const allowed = new Set(validIds);
    const restored = new Set<string>();
    parsed.forEach((id) => {
      if (typeof id === 'string' && allowed.has(id)) {
        restored.add(id);
      }
    });
    return restored;
  } catch {
    return null;
  }
};

export const LeftNavPanel = ({ items, activePath }: LeftNavPanelProps) => {
  const location = useLocation();
  const normalize = (value: string) => {
    if (!value) {
      return '/';
    }
    const trimmed = value.replace(/\/+$/, '');
    return trimmed || '/';
  };
  const effectivePath = normalize(activePath || location.pathname);
  const groupIds = useMemo(() => collectGroupIds(items), [items]);
  const expandedByActive = useMemo(() => {
    const expanded = new Set<string>();
    collectExpanded(items, effectivePath, normalize, [], expanded);
    return expanded;
  }, [items, effectivePath]);

  const [userCollapsed, setUserCollapsed] = useState<Set<string>>(() => {
    const stored = readCollapsedFromStorage(groupIds);
    return stored ? new Set(stored) : new Set(groupIds);
  });

  const prevGroupIdsRef = useRef(groupIds);

  useEffect(() => {
    const prevGroupIds = prevGroupIdsRef.current;
    if (prevGroupIds === groupIds) {
      return;
    }
    const prevSet = new Set(prevGroupIds);
    setUserCollapsed((prev) => {
      let changed = false;
      const next = new Set(prev);
      for (const id of Array.from(next)) {
        if (!groupIds.includes(id)) {
          next.delete(id);
          changed = true;
        }
      }
      groupIds.forEach((id) => {
        if (!prevSet.has(id) && !next.has(id)) {
          next.add(id);
          changed = true;
        }
      });
      return changed ? next : prev;
    });
    prevGroupIdsRef.current = groupIds;
  }, [groupIds]);

  const collapsed = useMemo(() => {
    const next = new Set(userCollapsed);
    expandedByActive.forEach((id) => next.delete(id));
    return next;
  }, [userCollapsed, expandedByActive]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(userCollapsed)));
  }, [userCollapsed]);

  const toggleGroup = (id: string) => {
    setUserCollapsed((prev) => {
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
      const normalizedNodePath = node.path ? normalize(node.path) : null;
      const isLinkActive = normalizedNodePath ? effectivePath === normalizedNodePath : false;

      return (
        <div key={node.id}>
          {hasChildren && !node.path ? (
            <button type='button' className='left-nav-panel__group-button' onClick={() => toggleGroup(node.id)}>
              <span>{node.label}</span>
              <span className='left-nav-panel__caret'>{isCollapsed ? '▸' : '▾'}</span>
            </button>
          ) : node.path ? (
            <Link
              to={node.path}
              className={[
                'left-nav-panel__link',
                isLinkActive && 'left-nav-panel__link--active',
                depth > 0 && 'left-nav-panel__link--nested'
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span>{node.label}</span>
            </Link>
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
