import type { CSSProperties } from 'react';
import { useMemo } from 'react';

import { useAppDispatch, useAppSelector } from '@app/hooks';
import { addRecent, toggleFavorite } from '@shared/state';
import { selectUiFavorites, selectUiRecent } from '@shared/state/ui-selectors';
import { NavigationLink } from '@shared/ui/NavigationLink';
import { iconMap } from '@shared/ui/icons';
import { palette, typography } from '@shared/ui/theme';

export type AppSidebarProps = {
  collapsed?: boolean;
};

type SidebarItem = {
  id: string;
  label: string;
  to: string;
  icon: keyof typeof iconMap;
  roles?: string[];
};

type RouteDescriptor = {
  label: string;
  icon: keyof typeof iconMap;
};

const sidebarStyleBase: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
  padding: '18px 16px',
  borderRadius: 26,
  border: `1px solid ${palette.glassBorder}`,
  background: palette.surface,
  boxShadow: '0 24px 52px rgba(15, 23, 42, 0.28)',
  minHeight: '100%'
};

const sectionTitleStyle: CSSProperties = {
  textTransform: 'uppercase',
  fontSize: 11,
  letterSpacing: '0.1em',
  color: palette.textSoft,
  fontWeight: 600,
  fontFamily: typography.accentFamily,
  marginBottom: 8,
  paddingLeft: 8
};

const listStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6
};

const navItemContentStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10
};

const navLabelWrapperStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  minWidth: 0
};

const iconWrapperStyle: CSSProperties = {
  width: 26,
  height: 26,
  borderRadius: 12,
  background: palette.surfaceMuted,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: palette.primary
};

const favoriteButtonStyle: CSSProperties = {
  width: 30,
  height: 30,
  border: 'none',
  borderRadius: 12,
  background: 'transparent',
  color: palette.textSecondary,
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

const moduleItems: SidebarItem[] = [
  { id: 'crm', label: 'CRM', to: '/sales', icon: 'crm' },
  { id: 'projects', label: 'Projects', to: '/tasks-projects', icon: 'board' },
  { id: 'planning', label: 'Planning', to: '/planning', icon: 'calendar' },
  { id: 'production', label: 'Production', to: '/production', icon: 'factory' },
  { id: 'warehouse', label: 'Warehouse', to: '/wms/inventory', icon: 'warehouse' },
  { id: 'kiosk', label: 'Киоск', to: '/kiosk', icon: 'barcode' },
  { id: 'procurement', label: 'Procurement', to: '/procurement', icon: 'package' },
  { id: 'logistics', label: 'Logistics', to: '/logistics', icon: 'truck' },
  { id: 'installation', label: 'Installation', to: '/installation', icon: 'worker' },
  { id: 'service', label: 'Service', to: '/service', icon: 'gear' },
  { id: 'finance', label: 'Finance', to: '/finance', icon: 'analytics' },
  { id: 'analytics', label: 'Analytics', to: '/analytics', icon: 'analytics' },
  { id: 'admin', label: 'Admin', to: '/admin', icon: 'gear' }
];

const routeDictionary: Record<string, RouteDescriptor> = {
  '/': { label: 'Home', icon: 'overview' },
  '/home-exec': { label: 'Home', icon: 'overview' },
  '/sales': { label: 'Sales launchpad', icon: 'crm' },
  '/directories': { label: 'Directories', icon: 'files' },
  '/orders/demo': { label: 'Demo order', icon: 'package' },
  '/wms/inventory': { label: 'Warehouse', icon: 'warehouse' }
};

export const AppSidebar = ({ collapsed = false }: AppSidebarProps) => {
  const dispatch = useAppDispatch();
  const favorites = useAppSelector(selectUiFavorites);
  const recent = useAppSelector(selectUiRecent);

  const primary = useMemo(() => ({
    id: 'home',
    label: 'Home',
    to: '/home-exec',
    icon: 'overview' as const
  }), []);

  const handleClick = (path: string) => {
    dispatch(addRecent(path));
  };

  const handleToggleFavorite = (path: string) => {
    dispatch(toggleFavorite(path));
  };

  const renderNavItem = (item: SidebarItem) => {
    const isFavorite = favorites.includes(item.to);
    return (
      <div key={item.id} style={{ display: 'flex', alignItems: 'center' }}>
        <NavigationLink
          to={item.to}
          variant='vertical'
          onClick={() => handleClick(item.to)}
          aria-label={collapsed ? item.label : undefined}
          style={collapsed ? { justifyContent: 'center' } : undefined}
        >
          <span style={navItemContentStyle}>
            <span style={navLabelWrapperStyle}>
              <span style={iconWrapperStyle}>{iconMap[item.icon]}</span>
              {collapsed ? null : <span>{item.label}</span>}
            </span>
            {collapsed ? null : (
              <button
                type='button'
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  handleToggleFavorite(item.to);
                }}
                style={favoriteButtonStyle}
                aria-pressed={isFavorite}
                aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <StarIcon active={isFavorite} />
              </button>
            )}
          </span>
        </NavigationLink>
      </div>
    );
  };

  const renderAuxiliaryList = (paths: string[]) => {
    if (paths.length === 0) {
      return collapsed ? null : <span style={{ color: palette.textSecondary, fontSize: 12 }}>Empty</span>;
    }
    return paths.map((path) => {
      const descriptor = routeDictionary[path] ?? { label: path, icon: 'flow' as const };
      return (
        <NavigationLink
          key={path}
          to={path}
          variant='vertical'
          onClick={() => handleClick(path)}
          aria-label={collapsed ? descriptor.label : undefined}
          style={collapsed ? { justifyContent: 'center' } : undefined}
        >
          <span style={navLabelWrapperStyle}>
            <span style={iconWrapperStyle}>{iconMap[descriptor.icon]}</span>
            {collapsed ? null : <span>{descriptor.label}</span>}
          </span>
        </NavigationLink>
      );
    });
  };

  return (
    <aside
      style={{
        ...sidebarStyleBase,
        width: collapsed ? 96 : 280,
        padding: collapsed ? '18px 10px' : sidebarStyleBase.padding,
        alignItems: collapsed ? 'center' : 'stretch'
      }}
    >
      <section>
        <h2 style={sectionTitleStyle}>{collapsed ? 'Home' : 'Home'}</h2>
        {renderAuxiliaryList([primary.to])}
      </section>
      <section>
        <h2 style={sectionTitleStyle}>{collapsed ? 'Modules' : 'Modules'}</h2>
        <div style={listStyle}>{moduleItems.map(renderNavItem)}</div>
      </section>
      <section>
        <h2 style={sectionTitleStyle}>{collapsed ? 'Recent' : 'Recent'}</h2>
        <div style={listStyle}>{renderAuxiliaryList(recent.slice(0, 6))}</div>
      </section>
      <section>
        <h2 style={sectionTitleStyle}>{collapsed ? 'Favorites' : 'Favorites'}</h2>
        <div style={listStyle}>{renderAuxiliaryList(favorites)}</div>
      </section>
    </aside>
  );
};
