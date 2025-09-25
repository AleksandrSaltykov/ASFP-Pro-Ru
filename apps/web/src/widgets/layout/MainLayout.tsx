import type { CSSProperties } from 'react';
import { Outlet } from 'react-router-dom';

import { useAppSelector } from '@app/hooks';
import { NavigationLink } from '@shared/ui/NavigationLink';
import { iconMap } from '@shared/ui/icons';
import { gradients, layout, palette, typography } from '@shared/ui/theme';

type NavItem = {
  to: string;
  label: string;
  icon: keyof typeof iconMap;
};

const wrapperStyle: CSSProperties = {
  minHeight: '100vh',
  display: 'grid',
  gridTemplateColumns: `minmax(${layout.sidebarWidth}px, 260px) 1fr`,
  gridTemplateRows: 'auto 1fr',
  gridTemplateAreas: '"header header" "sidebar content"',
  padding: 12,
  gap: 16,
  background: gradients.app,
  fontFamily: typography.fontFamily,
  color: palette.textPrimary,
  position: 'relative',
  overflow: 'hidden'
};

const glassPanelBase: CSSProperties = {
  background: palette.surface,
  border: `1px solid ${palette.glassBorder}`,
  backdropFilter: 'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)',
  boxShadow: '0 28px 52px rgba(2, 6, 23, 0.45)'
};

const headerStyle: CSSProperties = {
  gridArea: 'header',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 18px',
  borderRadius: 24,
  position: 'sticky',
  top: 12,
  zIndex: 10,
  ...glassPanelBase
};

const sidebarStyle: CSSProperties = {
  gridArea: 'sidebar',
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
  padding: '18px 16px',
  borderRadius: 26,
  ...glassPanelBase
};

const navItemContentStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 10,
  width: '100%',
  color: palette.textPrimary
};

const navIconWrapperStyle: CSSProperties = {
  width: 22,
  height: 22,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const contentStyle: CSSProperties = {
  gridArea: 'content',
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
  overflow: 'hidden'
};

const contentInnerStyle: CSSProperties = {
  borderRadius: layout.cornerRadius + 6,
  padding: 24,
  minHeight: `calc(100vh - ${layout.headerHeight + 44}px)`,
  border: `1px solid ${palette.glassBorder}`,
  background: 'rgba(255, 255, 255, 0.03)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  boxShadow: '0 32px 62px rgba(15, 23, 42, 0.5)'
};

const sectionLabelStyle: CSSProperties = {
  textTransform: 'uppercase',
  fontSize: 10,
  letterSpacing: '0.1em',
  color: 'rgba(226, 232, 240, 0.65)',
  fontWeight: 600,
  paddingLeft: 10,
  marginBottom: 6,
  fontFamily: typography.accentFamily
};

const headerSearchStyle: CSSProperties = {
  padding: '10px 16px',
  borderRadius: 16,
  border: `1px solid ${palette.glassBorder}`,
  fontSize: 13,
  minWidth: 200,
  backgroundColor: palette.glass,
  color: palette.textPrimary,
  fontFamily: typography.accentFamily,
  boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.04)'
};

const quickActionButtonStyle: CSSProperties = {
  background: gradients.button,
  color: palette.textPrimary,
  border: 'none',
  borderRadius: 16,
  padding: '10px 18px',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  boxShadow: '0 24px 48px rgba(56, 189, 248, 0.4)',
  fontFamily: typography.accentFamily
};

const userSectionStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  color: 'rgba(226, 232, 240, 0.8)'
};

const userAvatarStyle: CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: '50%',
  background: gradients.glassHighlight,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: palette.textPrimary,
  fontWeight: 600,
  fontSize: 12,
  fontFamily: typography.accentFamily,
  boxShadow: '0 14px 28px rgba(99, 102, 241, 0.35)'
};

const userDetailsStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  fontFamily: typography.accentFamily
};

const userNameStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: palette.textPrimary
};

const userMetaStyle: CSSProperties = {
  fontSize: 11,
  color: 'rgba(226, 232, 240, 0.6)'
};

const glowPrimaryStyle: CSSProperties = {
  position: 'absolute',
  top: -160,
  right: -120,
  width: 360,
  height: 360,
  borderRadius: '50%',
  background: 'radial-gradient(55% 55% at 50% 50%, rgba(99, 102, 241, 0.65) 0%, rgba(15, 23, 42, 0) 100%)',
  filter: 'blur(10px)',
  opacity: 0.85,
  pointerEvents: 'none'
};

const glowSecondaryStyle: CSSProperties = {
  position: 'absolute',
  bottom: -200,
  left: -130,
  width: 400,
  height: 400,
  borderRadius: '50%',
  background: 'radial-gradient(55% 55% at 50% 50%, rgba(56, 189, 248, 0.6) 0%, rgba(15, 23, 42, 0) 100%)',
  filter: 'blur(12px)',
  opacity: 0.8,
  pointerEvents: 'none'
};

const glowTertiaryStyle: CSSProperties = {
  position: 'absolute',
  top: '44%',
  left: '48%',
  transform: 'translate(-50%, -50%)',
  width: 280,
  height: 280,
  borderRadius: '50%',
  background: 'radial-gradient(60% 60% at 50% 50%, rgba(14, 165, 233, 0.4) 0%, rgba(15, 23, 42, 0) 100%)',
  filter: 'blur(12px)',
  opacity: 0.6,
  pointerEvents: 'none'
};

const workingNav: NavItem[] = [
  { to: '/', label: 'Дашборды', icon: 'overview' },
  { to: '/crm/deals', label: 'CRM · Сделки', icon: 'crm' },
  { to: '/wms/inventory', label: 'WMS · Склад', icon: 'wms' },
  { to: '/files', label: 'Файлы', icon: 'files' },
  { to: '/tasks-projects', label: 'Задачи и проекты', icon: 'calendar' },
  { to: '/hr/org-structure', label: 'HR и оргструктура', icon: 'worker' },
  { to: '/messenger', label: 'Мессенджер', icon: 'user' },
  { to: '/services', label: 'Сервисы', icon: 'automation' },
  { to: '/production', label: 'Производство', icon: 'factory' },
  { to: '/logistics', label: 'Логистика', icon: 'logistics' }
];

const systemNav: NavItem[] = [
  { to: '/settings', label: 'Настройки', icon: 'gear' },
  { to: '/directories', label: 'Справочники', icon: 'document' }
];

export const MainLayout = () => {
  const user = useAppSelector((state) => state.auth.user);

  const userInitials = (() => {
    if (user?.name) {
      const parts = user.name.trim().split(/\s+/).filter(Boolean);
      if (parts.length === 0) {
        return 'UX';
      }
      const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('');
      return initials || 'UX';
    }
    return 'UG';
  })();

  return (
    <div style={wrapperStyle}>
      <div style={glowPrimaryStyle} />
      <div style={glowSecondaryStyle} />
      <div style={glowTertiaryStyle} />
      <header style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 16,
              background: gradients.glassHighlight,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: palette.textPrimary,
              fontWeight: 700,
              fontSize: 16,
              fontFamily: typography.accentFamily,
              letterSpacing: '0.05em',
              boxShadow: '0 24px 42px rgba(99, 102, 241, 0.4)'
            }}
          >
            AP
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <strong style={{ fontSize: 16, color: palette.textPrimary }}>{'ASFP-Pro ERP'}</strong>
            <span
              style={{
                fontSize: 11,
                color: 'rgba(226, 232, 240, 0.65)',
                fontFamily: typography.accentFamily,
                letterSpacing: '0.05em'
              }}
            >
              Контроль бизнеса в одном окне
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <input
            style={headerSearchStyle}
            placeholder="Поиск по клиентам, проектам и складу"
            aria-label="Поиск по системе"
          />
          <button type="button" style={quickActionButtonStyle}>
            + Документ
          </button>
        </div>
        <div style={userSectionStyle}>
          <span style={userAvatarStyle}>{userInitials}</span>
          <div style={userDetailsStyle}>
            <span style={userNameStyle}>{user ? user.name : 'Гость системы'}</span>
            <span style={userMetaStyle}>{user ? user.email : 'Нет активной сессии'}</span>
          </div>
        </div>
      </header>

      <aside style={sidebarStyle}>
        <nav aria-label="Рабочие модули" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={sectionLabelStyle}>Рабочие модули</span>
          {workingNav.map((item) => (
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
          {systemNav.map((item) => (
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
        <div style={contentInnerStyle}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};
