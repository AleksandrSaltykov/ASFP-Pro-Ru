import type { CSSProperties, ReactNode } from "react";

import { palette } from "@shared/ui/theme";

const panelStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 12,
  alignItems: "flex-end",
  padding: 16,
  borderRadius: 14,
  border: `1px solid ${palette.border}`,
  background: palette.surface
};

export const FilterPanel = ({ children }: { children: ReactNode }) => (
  <form style={panelStyle}>
    {children}
  </form>
);

export default FilterPanel;
