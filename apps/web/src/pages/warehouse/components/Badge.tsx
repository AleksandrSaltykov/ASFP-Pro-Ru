import type { CSSProperties, ReactNode } from "react";

import { palette } from "@shared/ui/theme";

const baseStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 12,
  padding: "4px 10px",
  fontSize: 12,
  fontWeight: 500
};

const themes: Record<string, CSSProperties> = {
  default: {
    background: palette.surfaceMuted,
    color: palette.textSecondary
  },
  warning: {
    background: palette.accentMuted,
    color: palette.primary
  },
  success: {
    background: palette.accentSoft,
    color: palette.primary
  }
};

export const Badge = ({ theme = "default", children }: { theme?: keyof typeof themes; children: ReactNode }) => (
  <span style={{ ...baseStyle, ...(themes[theme] ?? themes.default) }}>{children}</span>
);

export default Badge;
