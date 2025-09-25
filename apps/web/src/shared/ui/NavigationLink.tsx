import { NavLink, NavLinkProps } from 'react-router-dom';
import type { CSSProperties, PropsWithChildren } from 'react';

import { palette } from './theme';

type NavigationLinkVariant = 'horizontal' | 'vertical';

type NavigationLinkProps = NavLinkProps & {
  variant?: NavigationLinkVariant;
};

const baseStyles: Record<NavigationLinkVariant, CSSProperties> = {
  horizontal: {
    textDecoration: 'none',
    color: palette.textPrimary,
    fontWeight: 500,
    padding: '4px 0',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px'
  },
  vertical: {
    textDecoration: 'none',
    color: palette.textPrimary,
    fontWeight: 500,
    padding: '10px 14px',
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    transition: 'all 0.2s ease'
  }
};

export const NavigationLink = ({ children, variant = 'horizontal', ...props }: PropsWithChildren<NavigationLinkProps>) => (
  <NavLink
    {...props}
    style={({ isActive }) => {
      const styles = baseStyles[variant];

      if (variant === 'vertical') {
        return {
          ...styles,
          backgroundColor: isActive ? palette.accentSoft : 'transparent',
          color: isActive ? palette.primary : palette.textPrimary,
          fontWeight: isActive ? 600 : 500,
          border: `1px solid ${isActive ? palette.accentMuted : 'transparent'}`,
          boxShadow: isActive ? '0 4px 12px rgba(41, 98, 255, 0.15)' : 'none'
        };
      }

      return {
        ...styles,
        color: isActive ? palette.primary : palette.textPrimary,
        fontWeight: isActive ? 600 : 500,
        borderBottom: isActive ? `2px solid ${palette.primary}` : '2px solid transparent'
      };
    }}
  >
    {children}
  </NavLink>
);
