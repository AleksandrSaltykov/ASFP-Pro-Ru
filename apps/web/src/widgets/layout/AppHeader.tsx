import type { CSSProperties, SVGProps } from 'react';

import { useAppSelector } from '@app/hooks';
import { useSystemStatus } from '@shared/api/system-status';
import { useThemeMode } from '@shared/ui/ThemeProvider';
import { palette, typography } from '@shared/ui/theme';

export type AppHeaderProps = {
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
};

const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
  padding: '10px 20px',
  borderRadius: 24,
  border: `1px solid ${palette.border}`,
  background: palette.surface,
  boxShadow: palette.shadowElevated,
  position: 'sticky',
  top: 0,
  zIndex: 20,
  transition: 'background-color 0.2s ease, box-shadow 0.2s ease'
};

const clusterStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12
};

const titleGroupStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2
};

const productTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontWeight: 700,
  fontFamily: typography.fontFamily,
  color: palette.textPrimary
};

const subtitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 12,
  color: palette.textSecondary,
  fontFamily: typography.accentFamily,
  letterSpacing: '0.05em'
};

const centerSectionStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  flex: 1
};

const searchWrapperStyle: CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  width: '100%'
};

const searchInputStyle: CSSProperties = {
  width: '100%',
  padding: '10px 14px 10px 42px',
  borderRadius: 18,
  border: `1px solid ${palette.border}`,
  background: palette.surfaceMuted,
  fontSize: 14,
  color: palette.textPrimary,
  fontFamily: typography.accentFamily,
  transition: 'background-color 0.2s ease, border-color 0.2s ease'
};

const hotkeyHintStyle: CSSProperties = {
  position: 'absolute',
  right: 10,
  top: '50%',
  transform: 'translateY(-50%)',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '4px 8px',
  borderRadius: 12,
  border: `1px solid ${palette.border}`,
  background: palette.glass,
  fontSize: 11,
  color: palette.textSecondary
};

const statusRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  flexWrap: 'wrap'
};

const statusLegendStyle: CSSProperties = {
  fontSize: 11,
  color: palette.textSecondary,
  textTransform: 'uppercase',
  letterSpacing: '0.08em'
};

const statusBadgeBase: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '6px 12px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: '0.04em',
  cursor: 'default',
  transition: 'background-color 0.2s ease, border-color 0.2s ease'
};

const statusDotBase: CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: '50%',
  flexShrink: 0
};

const statusMetaStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 11,
  color: palette.textSecondary
};

const statusColors = {
  online: {
    background: 'rgba(24, 164, 93, 0.15)',
    border: 'rgba(24, 164, 93, 0.4)',
    text: '#17894f',
    dot: '#18a45d'
  },
  degraded: {
    background: 'rgba(255, 171, 0, 0.18)',
    border: 'rgba(255, 171, 0, 0.45)',
    text: '#a15c01',
    dot: '#ffab00'
  },
  offline: {
    background: 'rgba(211, 32, 41, 0.15)',
    border: 'rgba(211, 32, 41, 0.45)',
    text: '#aa1f24',
    dot: '#d32029'
  }
} as const;

const iconButtonStyle: CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 16,
  border: `1px solid ${palette.border}`,
  background: palette.surfaceMuted,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: palette.textPrimary,
  cursor: 'pointer',
  transition: 'background-color 0.2s ease, border-color 0.2s ease'
};

const avatarStyle: CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: palette.surfaceMuted,
  color: palette.primary,
  fontWeight: 700,
  transition: 'background-color 0.2s ease'
};

const orgSwitcherStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 2,
  padding: '6px 12px',
  borderRadius: 14,
  border: `1px solid ${palette.glassBorder}`,
  background: palette.surfaceMuted,
  fontSize: 12,
  minWidth: 140,
  transition: 'background-color 0.2s ease, border-color 0.2s ease'
};

const iconProps = {
  width: 18,
  height: 18,
  stroke: palette.textPrimary,
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none'
};

const IconSun = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox='0 0 24 24' {...iconProps} {...props}>
    <circle cx='12' cy='12' r='4' />
    <path d='M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41' />
  </svg>
);

const IconMoon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox='0 0 24 24' {...iconProps} {...props}>
    <path d='M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79Z' />
  </svg>
);

const IconChevronLeft = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox='0 0 24 24' {...iconProps} {...props}>
    <path d='M15 6l-6 6 6 6' />
  </svg>
);

const IconChevronRight = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox='0 0 24 24' {...iconProps} {...props}>
    <path d='M9 6l6 6-6 6' />
  </svg>
);

const IconSearch = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox='0 0 24 24' {...iconProps} {...props}>
    <circle cx='11' cy='11' r='6' />
    <path d='m20 20-3.2-3.2' />
  </svg>
);

const IconBell = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox='0 0 24 24' {...iconProps} {...props}>
    <path d='M18 15V11a6 6 0 0 0-6-6 6 6 0 0 0-6 6v4l-1.5 3h15Z' />
    <path d='M10 21h4' />
  </svg>
);

const IconQuestion = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox='0 0 24 24' {...iconProps} {...props}>
    <path d='M12 18h.01' />
    <path d='M12 14a4 4 0 1 0-4-4' />
    <path d='M12 14v-1.5a2 2 0 0 1 1.2-1.8L14 10' />
  </svg>
);

const getInitials = (name?: string) => {
  if (!name) {
    return 'UX';
  }
  const parts = name.trim().split(/\s+/);
  const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('');
  return initials || 'UX';
};

const SystemStatusBar = () => {
  const { grouped, isLoading, isRefetching, updatedAt, error } = useSystemStatus();
  const statuses = [...grouped.services, ...grouped.dependencies];
  const lastUpdate = updatedAt ? updatedAt.toLocaleTimeString() : null;

  if (error) {
    const message = error instanceof Error ? error.message : 'Неизвестная ошибка';
    return (
      <div style={statusRowStyle} role='status' aria-live='polite'>
        <span style={{ ...statusLegendStyle, color: statusColors.offline.text }}>
          Не удалось получить статусы: {message}
        </span>
      </div>
    );
  }

  if (isLoading && statuses.length === 0) {
    return (
      <div style={statusRowStyle} role='status' aria-live='polite'>
        <span style={statusLegendStyle}>Проверяем статус сервисов…</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={statusRowStyle} role='list'>
        {statuses.map((item) => {
          const colors = statusColors[item.health];
          return (
            <span
              key={item.id}
              role='listitem'
              style={{
                ...statusBadgeBase,
                background: colors.background,
                border: `1px solid ${colors.border}`,
                color: colors.text
              }}
              title={item.details ?? item.label}
            >
              <span style={{ ...statusDotBase, background: colors.dot }} aria-hidden />
              {item.label}
            </span>
          );
        })}
      </div>
      <div style={statusMetaStyle} aria-live='polite'>
        <span style={statusLegendStyle}>Контур</span>
        <span>{isRefetching ? 'Обновляем…' : lastUpdate ? `Обновлено ${lastUpdate}` : 'Ожидание данных'}</span>
      </div>
    </div>
  );
};


export const AppHeader = ({ onToggleSidebar, isSidebarCollapsed }: AppHeaderProps) => {
  const user = useAppSelector((state) => state.auth.user);
  const { theme, toggleTheme } = useThemeMode();
  const isDark = theme === 'dark';
  const initials = getInitials(user?.name);

  return (
    <header style={headerStyle}>
      <div style={clusterStyle}>
        <button
          type='button'
          onClick={onToggleSidebar}
          style={iconButtonStyle}
          aria-label={isSidebarCollapsed ? 'Развернуть меню' : 'Свернуть меню'}
        >
          {isSidebarCollapsed ? <IconChevronRight /> : <IconChevronLeft />}
        </button>
        <div style={titleGroupStyle}>
          <h1 style={productTitleStyle}>ASFP-Pro</h1>
          <p style={subtitleStyle}>ERP наружной рекламы</p>
        </div>
      </div>

      <div style={centerSectionStyle}>
        <div style={searchWrapperStyle}>
          <span style={{ position: 'absolute', left: 14, color: palette.textSecondary }}>
            <IconSearch />
          </span>
          <input
            type='search'
            aria-label='Глобальный поиск'
            placeholder='Поиск по клиентам, заказам, документам'
            style={searchInputStyle}
          />
          <span style={hotkeyHintStyle} aria-hidden>
            <kbd>Ctrl</kbd> + <kbd>K</kbd>
          </span>
        </div>
        <SystemStatusBar />
      </div>

      <div style={clusterStyle}>
        <button
          type='button'
          onClick={toggleTheme}
          style={iconButtonStyle}
          aria-label={isDark ? 'Включить светлую тему' : 'Включить тёмную тему'}
        >
          {isDark ? <IconSun /> : <IconMoon />}
        </button>
        <button type='button' style={iconButtonStyle} aria-label='Уведомления'>
          <IconBell />
        </button>
        <button type='button' style={iconButtonStyle} aria-label='Справка'>
          <IconQuestion />
        </button>
        <div style={orgSwitcherStyle}>
          <span style={{ fontWeight: 600, color: palette.textPrimary }}>ASFP Group</span>
          <span style={{ color: palette.textSecondary }}>Главный офис</span>
        </div>
        <div style={clusterStyle}>
          <span style={avatarStyle} aria-hidden>
            {initials}
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
            <strong style={{ fontSize: 13 }}>{user?.name ?? 'Гость'}</strong>
            <span style={{ fontSize: 12, color: palette.textSecondary }}>{user?.email ?? 'guest@asfp.local'}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

