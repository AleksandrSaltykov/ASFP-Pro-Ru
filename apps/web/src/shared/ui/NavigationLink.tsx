import { NavLink, NavLinkProps } from "react-router-dom";
import type { CSSProperties, PropsWithChildren } from "react";

import { gradients, palette } from "@shared/ui/theme";

type NavigationLinkVariant = "horizontal" | "vertical";

type NavigationLinkProps = NavLinkProps & {
  variant?: NavigationLinkVariant;
};

const baseStyles: Record<NavigationLinkVariant, CSSProperties> = {
  horizontal: {
    textDecoration: "none",
    color: palette.textMuted,
    fontWeight: 500,
    fontSize: 12,
    padding: "4px 0",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    transition: "color 0.2s ease, border-color 0.2s ease"
  },
  vertical: {
    textDecoration: "none",
    color: palette.textSecondary,
    fontWeight: 500,
    fontSize: 12,
    padding: "10px 14px",
    borderRadius: 16,
    display: "flex",
    alignItems: "center",
    gap: "10px",
    transition: "all 0.2s ease",
    border: `1px solid ${palette.glassBorder}` ,
    backgroundColor: palette.glass,
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    boxShadow: palette.shadowElevated
  }
};

export const NavigationLink = ({ children, variant = "horizontal", style, ...props }: PropsWithChildren<NavigationLinkProps>) => (
  <NavLink
    {...props}
    style={(navState) => {
      const { isActive, isPending, isTransitioning } = navState;
      const styles = baseStyles[variant];
      const override = typeof style === "function" ? style(navState) : style;

      if (variant === "vertical") {
        const base: CSSProperties = {
          ...styles,
          background: isActive ? gradients.glassHighlight : palette.glass,
          color: isActive ? palette.textPrimary : palette.textSecondary,
          fontWeight: isActive ? 600 : 500,
          border: `1px solid ${palette.glassBorder}` ,
          boxShadow: isActive
            ? "0 18px 42px rgba(99, 102, 241, 0.24)"
            : palette.shadowElevated,
          transform: isActive ? "translateY(-1px)" : "translateY(0)",
          opacity: isPending || isTransitioning ? 0.85 : 1
        };
        return override ? { ...base, ...(override as CSSProperties) } : base;
      }

      const base: CSSProperties = {
        ...styles,
        color: isActive ? palette.textPrimary : palette.textMuted,
        fontWeight: isActive ? 600 : 500,
        borderBottom: isActive ? `2px solid ${palette.glowPrimary}` : "2px solid transparent",
        opacity: isPending || isTransitioning ? 0.75 : 1
      };

      return override ? { ...base, ...(override as CSSProperties) } : base;
    }}
  >
    {children}
  </NavLink>
);
