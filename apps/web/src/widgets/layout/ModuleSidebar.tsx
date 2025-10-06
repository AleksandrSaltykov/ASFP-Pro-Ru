import type { CSSProperties } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@app/hooks';
import { addRecent, toggleFavorite } from '@shared/state';
import { selectUiFavorites } from '@shared/state/ui-selectors';
import { usePermissionMatrix } from '@shared/hooks/usePermissionMatrix';
import { NavigationLink } from '@shared/ui/NavigationLink';
import { iconMap } from '@shared/ui/icons';
import { palette, typography } from '@shared/ui/theme';

import type { ModuleDefinition } from './sidebar.config';

const sidebarStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  padding: '14px 16px',
  borderRadius: 0,
  border: `1px solid ${palette.border}`,
  background: palette.layer,
  boxShadow: 'none',
  minHeight: '100%',
  width: '100%',
  boxSizing: 'border-box'
};

const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  paddingBottom: 4,
  borderBottom: `1px solid ${palette.border}`
};

const headerTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontWeight: 600,
  color: palette.textPrimary,
  fontFamily: typography.fontFamily
};

const sectionTitleStyle: CSSProperties = {
  textTransform: 'uppercase',
  fontSize: 10,
  letterSpacing: '0.08em',
  color: palette.textMuted,
  fontWeight: 600,
  fontFamily: typography.fontFamily,
  margin: '0 0 6px 0'
};

const sectionToggleStyle: CSSProperties = {
  ...sectionTitleStyle,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
  padding: '8px 6px',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  margin: '0'
};

const listStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4
};

const navItemStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8
};

const navLabelWrapperStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  minWidth: 0
};

const iconWrapperStyle: CSSProperties = {
  width: 24,
  height: 24,
  borderRadius: 2,
  background: palette.surface,
  border: `1px solid ${palette.border}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: palette.primary,
  flexShrink: 0
};

const favoriteButtonStyle: CSSProperties = {
  width: 24,
  height: 24,
  border: `1px solid ${palette.border}`,
  borderRadius: 2,
  background: palette.surface,
  color: palette.textMuted,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer'
};

const StarIcon = ({ active }: { active?: boolean }) => (
  <svg
    aria-hidden
    width='18'
    height='18'
    viewBox='0 0 24 24'
    fill={active ? palette.primary : 'none'}
    stroke={active ? palette.primary : palette.textSecondary}
    strokeWidth='1.6'
    strokeLinejoin='round'
  >
    <path d='M12 18.26 6.36 21.58l1.44-6.2-4.8-4.18 6.32-.54L12 5l2.68 5.66 6.32.54-4.8 4.18 1.44 6.2Z' />
  </svg>
);

const resolveIcon = (icon: keyof typeof iconMap | undefined) => iconMap[icon ?? 'flow'];

export type ModuleSidebarProps = {
  module: ModuleDefinition;
};

export const ModuleSidebar = ({ module }: ModuleSidebarProps) => {
  const dispatch = useAppDispatch();
  const favorites = useAppSelector(selectUiFavorites);
  const { hasPermission, isLoading: permissionsLoading, isError: permissionsError } = usePermissionMatrix();

  const sections = useMemo(() => {
    const baseSections = module.submenu ?? [];
    if (permissionsLoading || permissionsError) {
      return baseSections;
    }
    return baseSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          if (!item.permissions || item.permissions.length === 0) {
            return true;
          }
          return item.permissions.some((permission) => hasPermission(permission.resource, permission.action));
        })
      }))
      .filter((section) => section.items.length > 0);
  }, [hasPermission, module.submenu, permissionsError, permissionsLoading]);

  const sectionIds = useMemo(() => sections.map((section) => section.id), [sections]);
  const sectionKey = useMemo(() => sectionIds.join('|'), [sectionIds]);
  const buildCollapsedSet = useCallback(
    () => new Set(sectionKey ? sectionKey.split('|') : []),
    [sectionKey]
  );
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(() => buildCollapsedSet());

  useEffect(() => {
    setCollapsedSections(buildCollapsedSet());
  }, [buildCollapsedSet, module.id]);

  const toggleSection = (id: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleClick = (path: string) => {
    dispatch(addRecent(path));
  };

  const handleToggleFavorite = (path: string) => {
    dispatch(toggleFavorite(path));
  };

  return (
    <aside style={sidebarStyle}>
      <header style={headerStyle}>
        <span style={iconWrapperStyle}>{resolveIcon(module.icon)}</span>
        <h2 style={headerTitleStyle}>{module.label}</h2>
      </header>
      {sections.length === 0 ? (
        <span style={{ color: palette.textSecondary, fontSize: 13 }}>Подразделы появятся позже.</span>
      ) : (
        sections.map((section) => {
          const isCollapsible = module.id === 'warehouse';
          const isCollapsed = isCollapsible ? collapsedSections.has(section.id) : false;

          return (
            <section key={section.id}>
              {isCollapsible ? (
                <button
                  type='button'
                  onClick={() => toggleSection(section.id)}
                  style={sectionToggleStyle}
                >
                  <span>{section.label}</span>
                  <span style={{ fontSize: 12 }}>{isCollapsed ? '▸' : '▾'}</span>
                </button>
              ) : (
                <h3 style={sectionTitleStyle}>{section.label}</h3>
              )}
                  {isCollapsed ? null : (
                    <div style={listStyle}>
                      {section.items.map((item) => {
                        const isFavorite = favorites.includes(item.to);
                        return (
                          <NavigationLink
                            key={item.id}
                            to={item.to}
                            variant='vertical'
                            end
                            onClick={() => handleClick(item.to)}
                          >
                        <span style={navItemStyle}>
                          <span style={navLabelWrapperStyle}>
                            <span style={iconWrapperStyle}>{resolveIcon(item.icon ?? module.icon)}</span>
                            <span>{item.label}</span>
                          </span>
                          <button
                            type='button'
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              handleToggleFavorite(item.to);
                            }}
                            style={favoriteButtonStyle}
                            aria-pressed={isFavorite}
                            aria-label={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
                          >
                            <StarIcon active={isFavorite} />
                          </button>
                        </span>
                      </NavigationLink>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })
      )}
    </aside>
  );
};
