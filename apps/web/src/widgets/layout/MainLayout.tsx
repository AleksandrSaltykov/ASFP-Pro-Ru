import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Outlet } from "react-router-dom";

import { useAppSelector } from "@app/hooks";
import { selectIsFeatureEnabled } from "@shared/state/ui-selectors";
import { gradients, palette, typography } from "@shared/ui/theme";

import { AppHeader } from "./AppHeader";
import { AppSidebar } from "./AppSidebar";
import { LegacyMainLayout } from "./LegacyMainLayout";

const useMediaQuery = (query: string) => {
  const getMatches = () => (typeof window === "undefined" ? false : window.matchMedia(query).matches);

  const [matches, setMatches] = useState(getMatches);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia(query);
    const listener = (event: MediaQueryListEvent | MediaQueryList) => setMatches(event.matches);

    setMatches(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }

    mediaQuery.addListener(listener);
    return () => mediaQuery.removeListener(listener);
  }, [query]);

  return matches;
};

const createShellStyle = (collapsed: boolean, compact: boolean): CSSProperties => ({
  minHeight: "100vh",
  width: "100%",
  boxSizing: "border-box",
  display: "grid",
  gridTemplateColumns: compact
    ? "minmax(0, 1fr)"
    : `${collapsed ? "96px" : "clamp(240px, 22vw, 280px)"} minmax(0, 1fr)`,
  gridTemplateRows: compact ? "auto 1fr auto" : "auto 1fr",
  gridTemplateAreas: compact
    ? '"header" "content" "sidebar"'
    : '"header header" "sidebar content"',
  gap: compact ? 12 : 16,
  padding: compact ? "clamp(12px, 4vw, 24px)" : "24px",
  background: gradients.app,
  fontFamily: typography.fontFamily,
  color: palette.textPrimary,
  transition: "grid-template-columns 0.2s ease"
});

const headerAreaStyle: CSSProperties = {
  gridArea: "header"
};

const sidebarAreaStyle = (compact: boolean, collapsed: boolean): CSSProperties => ({
  gridArea: "sidebar",
  position: compact ? "relative" : "static",
  display: compact && collapsed ? "none" : "block"
});

const contentAreaStyle: CSSProperties = {
  gridArea: "content",
  display: "flex",
  flexDirection: "column",
  gap: 16,
  minWidth: 0
};

const contentSurfaceStyle: CSSProperties = {
  borderRadius: 24,
  border: `1px solid ${palette.border}`,
  background: palette.surface,
  boxShadow: palette.shadowElevated,
  padding: "clamp(16px, 3vw, 32px)",
  width: "100%",
  minHeight: 0,
  overflow: "hidden",
  transition: "background-color 0.2s ease, box-shadow 0.2s ease"
};

const RevampLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const isCompact = useMediaQuery("(max-width: 1200px)");
  const shellStyle = useMemo(() => createShellStyle(collapsed, isCompact), [collapsed, isCompact]);
  const sidebarStyle = useMemo(() => sidebarAreaStyle(isCompact, collapsed), [isCompact, collapsed]);

  return (
    <div style={shellStyle}>
      <div style={headerAreaStyle}>
        <AppHeader
          isSidebarCollapsed={collapsed}
          onToggleSidebar={() => setCollapsed((value) => !value)}
        />
      </div>
      <div style={sidebarStyle}>
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
