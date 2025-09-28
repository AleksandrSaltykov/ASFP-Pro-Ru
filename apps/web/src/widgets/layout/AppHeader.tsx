import type { CSSProperties, SVGProps } from 'react';

import { useAppSelector } from '@app/hooks';
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
  border: `1px solid ${palette.glassBorder}`,
  background: palette.surface,
  boxShadow: '0 18px 42px rgba(15, 23, 42, 0.22)',
  position: 'sticky',
  top: 0,
  zIndex: 20
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

const searchWrapperStyle: CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  flex: 1,
  maxWidth: 420
};

const searchInputStyle: CSSProperties = {
  width: '100%',
  padding: '10px 14px 10px 42px',
  borderRadius: 18,
  border: `1px solid ${palette.border}`,
  background: palette.surfaceMuted,
  fontSize: 14,
  color: palette.textPrimary,
  fontFamily: typography.accentFamily
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
  cursor: 'pointer'
};

const primaryButtonStyle: CSSProperties = {
  border: 'none',
  borderRadius: 16,
  padding: '10px 18px',
  fontWeight: 600,
  fontSize: 13,
  cursor: 'pointer',
  background: palette.primary,
  color: '#ffffff',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8
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
  fontWeight: 700
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
  minWidth: 140
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

const IconPlus = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox='0 0 24 24' {...iconProps} {...props}>
    <path d='M12 5v14M5 12h14' />
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

export const AppHeader = ({ onToggleSidebar, isSidebarCollapsed }: AppHeaderProps) => {
  const user = useAppSelector((state) => state.auth.user);
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

      <div style={clusterStyle}>
        <button type='button' style={primaryButtonStyle}>
          <IconPlus />
          <span>Создать</span>
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
