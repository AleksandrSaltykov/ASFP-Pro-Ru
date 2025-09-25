import type { CSSProperties } from 'react';
import { Outlet } from 'react-router-dom';

import { useAppSelector } from '@app/hooks';
import { NavigationLink } from '@shared/ui/NavigationLink';
import { iconMap } from '@shared/ui/icons';
import { layout, palette, typography } from '@shared/ui/theme';

type NavItem = {
  to: string;
  label: string;
  icon: keyof typeof iconMap;
};

const wrapperStyle: CSSProperties = {
  minHeight: '100vh',
  display: 'grid',
  gridTemplateColumns: `${layout.sidebarWidth}px 1fr`,
  gridTemplateRows: `${layout.headerHeight}px 1fr`,
  gridTemplateAreas: '"header header" "sidebar content"',
  backgroundColor: palette.background,
  fontFamily: typography.fontFamily,
  color: palette.textPrimary
};

const headerStyle: CSSProperties = {
  gridArea: 'header',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 24px',
  borderBottom: `1px solid ${palette.border}`,
  backgroundColor: palette.surface,
  position: 'sticky',
  top: 0,
  zIndex: 10
};

const sidebarStyle: CSSProperties = {
  gridArea: 'sidebar',
  backgroundColor: palette.surface,
  borderRight: `1px solid ${palette.border}`,
  display: 'flex',
  flexDirection: 'column',
  gap: 32,
  padding: '24px 18px'
};

const navItemContentStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 12,
  width: '100%'
};

const navIconWrapperStyle: CSSProperties = {
  width: 24,
  height: 24,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const contentStyle: CSSProperties = {
  gridArea: 'content',
  padding: '24px 32px',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  background: `linear-gradient(180deg, ${palette.background} 0%, #ffffff 100%)`
};

const contentInnerStyle: CSSProperties = {
  backgroundColor: palette.surface,
  borderRadius: layout.cornerRadius,
  padding: 28,
  minHeight: `calc(100vh - ${layout.headerHeight + 48}px)`,
  boxShadow: '0 12px 40px rgba(19, 26, 45, 0.08)',
  border: `1px solid ${palette.border}`
};

const sectionLabelStyle: CSSProperties = {
  textTransform: 'uppercase',
  fontSize: 11,
  letterSpacing: '0.08em',
  color: palette.textMuted,
  fontWeight: 600,
  paddingLeft: 14,
  marginBottom: 8,
  fontFamily: typography.accentFamily
};

const headerSearchStyle: CSSProperties = {
  padding: '9px 14px',
  borderRadius: 14,
  border: `1px solid ${palette.border}`,
  fontSize: 14,
  minWidth: 220,
  backgroundColor: '#F9FBFF',
  color: palette.textSecondary,
  fontFamily: typography.accentFamily
};

const quickActionButtonStyle: CSSProperties = {
  backgroundColor: palette.primary,
  color: palette.surface,
  border: 'none',
  borderRadius: 14,
  padding: '10px 18px',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  boxShadow: '0 10px 24px rgba(41, 98, 255, 0.24)',
  fontFamily: typography.accentFamily
};

const primaryNav: NavItem[] = [
  { to: '/', label: 'Главная', icon: 'overview' },
  { to: '/crm/deals', label: 'CRM · Сделки', icon: 'crm' },
  { to: '/wms/inventory', label: 'WMS · Склад', icon: 'wms' },
  { to: '/files', label: 'Файлы', icon: 'files' }
];

const secondaryNav: NavItem[] = [
  { to: '/login', label: 'Выход', icon: 'system' }
];

export const MainLayout = () => {
  const user = useAppSelector((state) => state.auth.user);

  return (
    <div style={wrapperStyle}>
      <header style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: `linear-gradient(135deg, ${palette.primary} 0%, ${palette.primaryDark} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: palette.surface,
              fontWeight: 700,
              fontSize: 18,
              fontFamily: typography.accentFamily,
              letterSpacing: '0.06em'
            }}
          >
            AP
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <strong style={{ fontSize: 18 }}>{'ASFP-Pro ERP'}</strong>
            <span
              style={{
                fontSize: 13,
                color: palette.textMuted,
                fontFamily: typography.accentFamily,
                letterSpacing: '0.04em'
              }}
            >
              Контроль бизнеса в одном окне
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <input
            style={headerSearchStyle}
            placeholder="Поиск по клиентам, проектам и складу"
            aria-label="Поиск по системе"
          />
          <button type="button" style={quickActionButtonStyle}>
            + Создать документ
          </button>
        </div>
        <div
          style={{
            fontSize: 14,
            color: palette.textSecondary,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end'
          }}
        >
          <span style={{ fontWeight: 600, color: palette.textPrimary }}>{user ? user.name : 'Гость системы'}</span>
          <span style={{ fontSize: 12, color: palette.textMuted, fontFamily: typography.accentFamily }}>
            {user ? user.email : 'Нет активной сессии'}
          </span>
        </div>
      </header>

      <aside style={sidebarStyle}>
        <nav aria-label="Рабочие модули" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={sectionLabelStyle}>Рабочие модули</span>
          {primaryNav.map((item) => (
            <NavigationLink key={item.to} to={item.to} variant="vertical">
              <span style={navItemContentStyle}>
                <span style={navIconWrapperStyle}>{iconMap[item.icon]}</span>
                <span>{item.label}</span>
              </span>
            </NavigationLink>
          ))}
        </nav>
        <nav aria-label="Системные действия" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={sectionLabelStyle}>Система</span>
          {secondaryNav.map((item) => (
            <NavigationLink key={item.to} to={item.to} variant="vertical">
              <span style={navItemContentStyle}>
                <span style={navIconWrapperStyle}>{iconMap[item.icon]}</span>
                <span>{item.label}</span>
              </span>
            </NavigationLink>
          ))}
        </nav>
      </aside>

      <main style={contentStyle}>
        <div style={{ color: palette.textSecondary, fontSize: 13, fontFamily: typography.accentFamily }}>
          Добро пожаловать! Выберите модуль слева, чтобы начать работу.
        </div>
        <div style={contentInnerStyle}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};
