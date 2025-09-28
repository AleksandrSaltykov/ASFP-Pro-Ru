import { useState, type CSSProperties } from "react";
import { Outlet } from "react-router-dom";

import { useAppSelector } from "@app/hooks";
import { selectIsFeatureEnabled } from "@shared/state/ui-selectors";
import { gradients, palette, typography } from "@shared/ui/theme";

import { AppHeader } from "./AppHeader";
import { AppSidebar } from "./AppSidebar";
import { LegacyMainLayout } from "./LegacyMainLayout";

const createShellStyle = (collapsed: boolean): CSSProperties => ({
  minHeight: "100vh",
  display: "grid",
  gridTemplateColumns: `${collapsed ? "96px" : "280px"} 1fr`,
  gridTemplateRows: "auto 1fr",
  gridTemplateAreas: '"header header" "sidebar content"',
  gap: 16,
  padding: 16,
  background: gradients.app,
  fontFamily: typography.fontFamily,
  color: palette.textPrimary,
  transition: "grid-template-columns 0.2s ease"
});

const headerAreaStyle: CSSProperties = {
  gridArea: "header"
};

const sidebarAreaStyle: CSSProperties = {
  gridArea: "sidebar"
};

const contentAreaStyle: CSSProperties = {
  gridArea: "content",
  display: "flex",
  flexDirection: "column",
  gap: 16
};

const contentSurfaceStyle: CSSProperties = {
  borderRadius: 24,
  border: `1px solid ${palette.glassBorder}`,
  background: palette.surfaceMuted,
  boxShadow: palette.shadowElevated,
  padding: "24px",
  minHeight: "calc(100vh - 160px)",
  overflow: "hidden"
};

const RevampLayout = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={createShellStyle(collapsed)}>
      <div style={headerAreaStyle}>
        <AppHeader
          isSidebarCollapsed={collapsed}
          onToggleSidebar={() => setCollapsed((value) => !value)}
        />
      </div>
      <div style={sidebarAreaStyle}>
        <AppSidebar collapsed={collapsed} />
      </div>
      <main style={contentAreaStyle}>
        <div style={contentSurfaceStyle}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export const MainLayout = () => {
  const isRevampEnabled = useAppSelector((state) => selectIsFeatureEnabled(state, "ui.viz_revamp"));

  if (isRevampEnabled) {
    return <RevampLayout />;
  }

  return <LegacyMainLayout />;
};
