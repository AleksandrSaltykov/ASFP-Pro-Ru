import type { CSSProperties } from 'react';
import { useMemo } from 'react';

import { useAppDispatch, useAppSelector } from '@app/hooks';
import { addRecent, toggleFavorite } from '@shared/state';
import { selectUiFavorites, selectUiRecent, selectIsFeatureEnabled } from '@shared/state/ui-selectors';
import { usePermissionMatrix } from '@shared/hooks/usePermissionMatrix';
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
  permissions?: { resource: string; action: string }[];
};

type RouteDescriptor = {
  label: string;
  icon: keyof typeof iconMap;
};

const sidebarStyleBase: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
  padding: 'clamp(14px, 3vw, 20px)',
  borderRadius: 26,
  border: `1px solid ${palette.border}`,
  background: palette.surface,
  boxShadow: palette.shadowElevated,
  minHeight: '100%',
  width: '100%',
  boxSizing: 'border-box',
  transition: 'background-color 0.2s ease, box-shadow 0.2s ease'
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
  color: palette.primary,
  flexShrink: 0
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

const collapsedNavLinkStyle: CSSProperties = {
  justifyContent: 'center'
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
  {
    id: 'crm',
    label: 'CRM',
    to: '/sales',
    icon: 'crm',
    permissions: [{ resource: 'crm.deal', action: 'read' }]
  },
  {
    id: 'crmDeals',
    label: 'Сделки',
    to: '/crm/deals',
    icon: 'crm',
    permissions: [{ resource: 'crm.deal', action: 'read' }]
  },
  { id: 'projects', label: 'Проекты', to: '/tasks-projects', icon: 'board' },
  { id: 'production', label: 'Производство', to: '/production', icon: 'factory' },
  {
    id: 'warehouse',
    label: 'Склад',
    to: '/warehouse/stock/balances',
    icon: 'warehouse',
    permissions: [{ resource: 'wms.stock', action: 'read' }]
  },
  { id: 'logistics', label: 'Логистика', to: '/logistics', icon: 'truck' },
  { id: 'kiosk', label: 'Киоск', to: '/kiosk', icon: 'barcode' },
  { id: 'services', label: 'Сервисы', to: '/services', icon: 'gear' },
  { id: 'messenger', label: 'Мессенджер', to: '/messenger', icon: 'flow' },
  { id: 'files', label: 'Файлы', to: '/files', icon: 'files' },
  { id: 'directories', label: 'Справочники', to: '/directories', icon: 'files' },
  { id: 'hr', label: 'Оргструктура', to: '/hr/org-structure', icon: 'board' },
  { id: 'settings', label: 'Настройки', to: '/settings', icon: 'gear' },
  {
    id: 'audit',
    label: 'Журнал аудита',
    to: '/admin/audit',
    icon: 'shield',
    permissions: [{ resource: 'core.audit', action: 'read' }]
  },
  {
    id: 'orgUnits',
    label: 'Оргструктура (админ)',
    to: '/admin/org-units',
    icon: 'board',
    permissions: [{ resource: 'core.org_unit', action: 'read' }]
  },
  {
    id: 'apiTokens',
    label: 'API токены',
    to: '/admin/api-tokens',
    icon: 'gear',
    permissions: [{ resource: 'core.api_token', action: 'read' }]
  }
];

const routeDictionary: Record<string, RouteDescriptor> = {
  '/': { label: 'Главная', icon: 'overview' },
  '/home-exec': { label: 'Главная', icon: 'overview' },
  '/sales': { label: 'Старт CRM', icon: 'crm' },
  '/crm/deals': { label: 'Сделки', icon: 'crm' },
  '/tasks-projects': { label: 'Проекты', icon: 'board' },
  '/production': { label: 'Производство', icon: 'factory' },
  '/warehouse': { label: 'Склад', icon: 'warehouse' },
  '/warehouse/stock/balances': { label: 'Склад — остатки', icon: 'warehouse' },
  '/warehouse/stock/availability': { label: 'Доступность', icon: 'warehouse' },
  '/warehouse/stock/endless': { label: 'Нескончаемые остатки', icon: 'warehouse' },
  '/warehouse/stock/history': { label: 'История движения', icon: 'warehouse' },
  '/logistics': { label: 'Логистика', icon: 'truck' },
  '/kiosk': { label: 'Киоск', icon: 'barcode' },
  '/services': { label: 'Сервисы', icon: 'gear' },
  '/messenger': { label: 'Мессенджер', icon: 'flow' },
  '/files': { label: 'Файлы', icon: 'files' },
  '/directories': { label: 'Справочники', icon: 'files' },
  '/settings': { label: 'Настройки', icon: 'gear' },
  '/hr/org-structure': { label: 'Оргструктура', icon: 'board' },
  '/orders/demo': { label: 'Демо-заказ', icon: 'package' },
  '/admin/audit': { label: 'Журнал аудита', icon: 'shield' },
  '/admin/org-units': { label: 'Оргструктура', icon: 'board' },
  '/admin/api-tokens': { label: 'API токены', icon: 'gear' }
};

export const AppSidebar = ({ collapsed = false }: AppSidebarProps) => {
  const dispatch = useAppDispatch();
  const favorites = useAppSelector(selectUiFavorites);
  const recent = useAppSelector(selectUiRecent);
  const isWarehouseEnabled = useAppSelector((state) => selectIsFeatureEnabled(state, 'ui.warehouse.rebuild'));
  const { hasPermission, isLoading: permissionsLoading, isError: permissionsError } = usePermissionMatrix();
  const filteredItems = useMemo(() => moduleItems.filter((item) => (item.id === 'warehouse' ? isWarehouseEnabled : true)), [isWarehouseEnabled]);

  const primary = useMemo(() => ({
    id: 'home',
    label: 'Главная',
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
      <div key={item.id} style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
        <NavigationLink
          to={item.to}
          variant='vertical'
          onClick={() => handleClick(item.to)}
          aria-label={collapsed ? item.label : undefined}
          style={collapsed ? collapsedNavLinkStyle : { width: '100%' }}
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
                aria-label={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
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
      return collapsed ? null : <span style={{ color: palette.textSecondary, fontSize: 12 }}>Пусто</span>;
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
          style={collapsed ? collapsedNavLinkStyle : { width: '100%' }}
        >
          <span style={navLabelWrapperStyle}>
            <span style={iconWrapperStyle}>{iconMap[descriptor.icon]}</span>
            {collapsed ? null : <span>{descriptor.label}</span>}
          </span>
        </NavigationLink>
      );
    });
  };

  const visibleModuleItems = useMemo(() => {
    if (permissionsLoading || permissionsError) {
      return filteredItems;
    }
    return filteredItems.filter((item) => {
      if (!item.permissions || item.permissions.length === 0) {
        return true;
      }
      return item.permissions.some((permission) =>
        hasPermission(permission.resource, permission.action)
      );
    });
  }, [filteredItems, hasPermission, permissionsError, permissionsLoading]);

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
        <h2 style={sectionTitleStyle}>{collapsed ? 'Главная' : 'Главная'}</h2>
        {renderAuxiliaryList([primary.to])}
      </section>
      <section>
        <h2 style={sectionTitleStyle}>{collapsed ? 'Модули' : 'Модули'}</h2>
        <div style={listStyle}>{visibleModuleItems.map(renderNavItem)}</div>
      </section>
      <section>
        <h2 style={sectionTitleStyle}>{collapsed ? 'Недавние' : 'Недавние'}</h2>
        <div style={listStyle}>{renderAuxiliaryList(recent.slice(0, 6))}</div>
      </section>
      <section>
        <h2 style={sectionTitleStyle}>{collapsed ? 'Избранное' : 'Избранное'}</h2>
        <div style={listStyle}>{renderAuxiliaryList(favorites)}</div>
      </section>
    </aside>
  );
};
