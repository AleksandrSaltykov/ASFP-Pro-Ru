import { Suspense, useEffect, useMemo, useState, type CSSProperties } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";

import { useAppSelector } from "@app/hooks";
import { PageLoader } from "@shared/ui/PageLoader";
import { palette, typography } from "@shared/ui/theme";
import { selectIsFeatureEnabled } from "@shared/state/ui-selectors";
import { WAREHOUSE_NAV, type WarehouseNavItem } from "./structure";

const layoutStyle: CSSProperties = {
  display: "flex",
  gap: 24,
  alignItems: "stretch",
  minHeight: 0
};

const secondarySidebarStyle: CSSProperties = {
  width: "clamp(220px, 22vw, 280px)",
  borderRadius: 18,
  border: `1px solid ${palette.border}`,
  background: palette.surfaceMuted,
  padding: "20px 16px",
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  gap: 18,
  minHeight: 0
};

const sidebarTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 16,
  fontWeight: 600,
  color: palette.textPrimary
};

const navListStyle: CSSProperties = {
  listStyle: "none",
  margin: 0,
  padding: 0,
  display: "flex",
  flexDirection: "column",
  gap: 4,
  fontFamily: typography.fontFamily,
  fontSize: 13
};

const navRowStyle = (depth: number, active: boolean): CSSProperties => ({
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 10px",
  borderRadius: 12,
  color: active ? palette.primary : palette.textSecondary,
  background: active ? palette.accentSoft : "transparent",
  transition: "background-color 0.15s ease, color 0.15s ease",
  marginLeft: depth > 0 ? depth * 12 : 0
});

const navLinkStyle: CSSProperties = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  gap: 6,
  color: "inherit",
  textDecoration: "none",
  fontWeight: 500,
  minWidth: 0
};

const toggleButtonStyle: CSSProperties = {
  border: "none",
  background: "transparent",
  padding: 0,
  width: 20,
  height: 20,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: palette.textSecondary,
  cursor: "pointer"
};

const caretStyle = (expanded: boolean): CSSProperties => ({
  display: "inline-block",
  transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
  transition: "transform 0.15s ease"
});

const emptyCaretPlaceholderStyle: CSSProperties = {
  width: 20,
  height: 20
};

const contentStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  gap: 24
};

const flagNoticeStyle: CSSProperties = {
  padding: 24,
  borderRadius: 18,
  border: `1px solid ${palette.border}`,
  background: palette.surfaceMuted,
  color: palette.textSecondary,
  display: "flex",
  flexDirection: "column",
  gap: 10,
  fontSize: 14
};

const noticeTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontWeight: 600,
  color: palette.textPrimary
};

const stripLeadingIndex = (label: string) => label.replace(/^(?:\d+(?:\.\d+)*)\.?\s*/, "").trim();

const collectTrail = (items: WarehouseNavItem[], target: string, trail: WarehouseNavItem[] = []):
  | WarehouseNavItem[]
  | null => {
  for (const item of items) {
    const nextTrail = [...trail, item];
    if (target === item.path || target.startsWith(`${item.path}/`)) {
      return nextTrail;
    }
    if (item.children?.length) {
      const nested = collectTrail(item.children, target, nextTrail);
      if (nested) {
        return nested;
      }
    }
  }
  return null;
};

export const WarehouseModule = () => {
  const enabled = useAppSelector((state) => selectIsFeatureEnabled(state, "ui.warehouse.rebuild"));
  const location = useLocation();

  const relativePath = useMemo(() => {
    const raw = location.pathname.replace(/^\/warehouse\/?/, "");
    return raw === "" ? "" : raw;
  }, [location.pathname]);

  const activeTrail = useMemo(
    () => collectTrail(WAREHOUSE_NAV, relativePath) ?? [],
    [relativePath]
  );

  const activeTrailPaths = useMemo(() => activeTrail.map((item) => item.path), [activeTrail]);

  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(
    () => new Set(activeTrailPaths)
  );

  useEffect(() => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      activeTrailPaths.forEach((path) => next.add(path));
      return next;
    });
  }, [activeTrailPaths]);

  if (!enabled) {
    return (
      <div style={flagNoticeStyle}>
        <h2 style={noticeTitleStyle}>Модуль «Склад» отключён</h2>
        <p>
          Чтобы вернуть старый интерфейс, отключите фиче-флаг <code>ui.warehouse.rebuild</code> или
          свяжитесь с администратором. Настоящий модуль можно включить обратно в настройках UI.
        </p>
      </div>
    );
  }

  const togglePath = (path: string) => {
    const isActivePath = relativePath === path || relativePath.startsWith(`${path}/`);
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        if (!isActivePath) {
          next.delete(path);
        }
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const renderNav = (items: WarehouseNavItem[], depth = 0) => (
    <ul style={{ ...navListStyle, paddingLeft: depth === 0 ? 0 : 6 }}>
      {items.map((item) => {
        const hasChildren = Boolean(item.children?.length);
        const expanded = expandedPaths.has(item.path);
        const fullPath = `/warehouse/${item.path}`;
        const isActive =
          relativePath === item.path || relativePath.startsWith(`${item.path}/`);
        const label = stripLeadingIndex(item.label);

        return (
          <li key={item.path}>
            <div style={navRowStyle(depth, isActive)}>
              {hasChildren ? (
                <button
                  type='button'
                  style={toggleButtonStyle}
                  onClick={() => togglePath(item.path)}
                  aria-expanded={expanded}
                  aria-label={expanded ? "Свернуть раздел" : "Развернуть раздел"}
                >
                  <span aria-hidden style={caretStyle(expanded)}>▸</span>
                </button>
              ) : (
                <span aria-hidden style={emptyCaretPlaceholderStyle} />
              )}
              <NavLink
                to={fullPath}
                style={({ isActive: linkActive }) => ({
                  ...navLinkStyle,
                  color: linkActive || isActive ? palette.primary : "inherit"
                })}
              >
                {label}
              </NavLink>
            </div>
            {hasChildren && expanded ? renderNav(item.children!, depth + 1) : null}
          </li>
        );
      })}
    </ul>
  );

  return (
    <div style={layoutStyle}>
      <aside style={secondarySidebarStyle}>
        <div>
          <h2 style={sidebarTitleStyle}>Склад</h2>
        </div>
        <nav aria-label='Навигация модуля «Склад»'>{renderNav(WAREHOUSE_NAV)}</nav>
      </aside>
      <main style={contentStyle}>
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
};

export default WarehouseModule;
