import { NavLink, NavLinkProps } from 'react-router-dom';
import { PropsWithChildren } from 'react';

export const NavigationLink = ({ children, ...props }: PropsWithChildren<NavLinkProps>) => (
  <NavLink
    {...props}
    style={({ isActive }) => ({
      textDecoration: 'none',
      color: isActive ? '#0f62fe' : '#111827',
      fontWeight: isActive ? 600 : 500
    })}
  >
    {children}
  </NavLink>
);
