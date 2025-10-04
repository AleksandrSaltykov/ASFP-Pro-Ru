import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode
} from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

import { useAppSelector } from "@app/hooks";
import { PageLoader } from "@shared/ui/PageLoader";
import { palette, typography } from "@shared/ui/theme";
import { selectIsFeatureEnabled } from "@shared/state/ui-selectors";
import { WAREHOUSE_NAV, type WarehouseNavItem } from "./structure";

const layoutStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 24
};

const topBarStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
  gap: 12,
  alignItems: "stretch"
};

const menuItemWrapperStyle: CSSProperties = {
  position: "relative",
  display: "flex",
  flexDirection: "column",
  paddingBottom: 18
};

const menuButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 6,
  padding: "10px 12px",
  border: "none",
  background: "transparent",
  color: palette.textPrimary,
  fontFamily: typography.fontFamily,
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  borderRadius: 14,
  transition: "color 0.15s ease, background-color 0.15s ease",
  textDecoration: "none"
};

const menuButtonActiveStyle: CSSProperties = {
  color: palette.primary,
  background: palette.accentSoft
};

const caretStyle: CSSProperties = {
  fontSize: 11,
  transition: "transform 0.15s ease"
};

const dropdownStyle: CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  display: "flex",
  flexDirection: "column",
  gap: 16,
  minWidth: 260,
  maxWidth: 360,
  padding: 18,
  borderRadius: 18,
  border: `1px solid ${palette.border}`,
  boxShadow: palette.shadowElevated,
  zIndex: 2000
};

const dropdownSectionStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10
};

const dropdownHeaderStyle: CSSProperties = {
  margin: 0,
  fontSize: 13,
  fontWeight: 600,
  color: palette.textPrimary
};

const dropdownLinkStyle: CSSProperties = {
  display: "block",
  textDecoration: "none",
  color: palette.textSecondary,
  fontSize: 13,
  padding: "2px 0"
};

const dropdownPrimaryLinkStyle: CSSProperties = {
  ...dropdownLinkStyle,
  color: palette.primary,
  fontWeight: 600
};

const nestedListStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  paddingLeft: 12
};

const nestedLinkStyle: CSSProperties = {
  ...dropdownLinkStyle,
  color: palette.textPrimary
};

const contentStyle: CSSProperties = {
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

const resolveDropdownBackground = () => {
  if (typeof document === "undefined") {
    return "#ffffff";
  }
  const theme = document.documentElement.getAttribute("data-theme");
  if (theme === "dark") {
    return "rgba(15, 23, 42, 0.95)";
  }
  return "#ffffff";
};

const DropdownCaret = ({ open }: { open: boolean }) => (
  <span aria-hidden style={{ ...caretStyle, transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
);

const MenuLink = ({
  to,
  style,
  children,
  hovered,
  onMouseEnter,
  onMouseLeave
}: {
  to: string;
  style?: CSSProperties;
  children: ReactNode;
  hovered?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) => (
  <NavLink
    to={to}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    style={({ isActive }) => ({
      ...style,
      color: isActive || hovered ? palette.primary : style?.color ?? palette.textSecondary,
      textDecoration: "none"
    })}
  >
    {children}
  </NavLink>
);

export const WarehouseModule = () => {
  const enabled = useAppSelector((state) => selectIsFeatureEnabled(state, "ui.warehouse.rebuild"));
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const navRef = useRef<HTMLDivElement | null>(null);
  const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  useEffect(() => {
    setOpenMenu(null);
    setHoveredLink(null);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
        setHoveredLink(null);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!openMenu) {
      setDropdownPosition(null);
      return undefined;
    }

    const updatePosition = () => {
      const button = buttonRefs.current.get(openMenu);
      if (!button) {
        return;
      }
      const rect = button.getBoundingClientRect();
      const dropdownWidth = Math.max(rect.width, 260);
      const maxLeft = Math.max(16, window.innerWidth - dropdownWidth - 16);
      const left = Math.min(rect.left, maxLeft);
      const top = rect.bottom + 8;

      setDropdownPosition({ top, left, width: dropdownWidth });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [openMenu]);

  const registerButton = useMemo(
    () =>
      (path: string) => (element: HTMLButtonElement | null) => {
        if (!element) {
          buttonRefs.current.delete(path);
          return;
        }
        buttonRefs.current.set(path, element);
      },
    []
  );

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

  const handlePrimaryClick = (item: WarehouseNavItem) => {
    const hasChildren = Boolean(item.children?.length);
    if (hasChildren) {
      setOpenMenu((prev) => (prev === item.path ? null : item.path));
      setHoveredLink(null);
    } else {
      navigate(item.path);
      setOpenMenu(null);
      setHoveredLink(null);
    }
  };

  return (
    <div style={layoutStyle}>
      <nav ref={navRef} style={topBarStyle} aria-label='Основные разделы склада'>
        {WAREHOUSE_NAV.map((item) => {
          const hasChildren = Boolean(item.children?.length);
          const isOpen = openMenu === item.path;
          const isActive = location.pathname.startsWith(`/warehouse/${item.path}`);
          const displayLabel = stripLeadingIndex(item.label);

          const handleEnter = () => {
            if (hasChildren) {
              setOpenMenu(item.path);
            }
          };

          const handleLeave = (event: React.MouseEvent<HTMLDivElement>) => {
            const related = event.relatedTarget as Node | null;
            if (related && event.currentTarget.contains(related)) {
              return;
            }
            setOpenMenu((prev) => (prev === item.path ? null : prev));
            setHoveredLink(null);
          };

          const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
            if (event.key === "Escape") {
              setOpenMenu(null);
              setHoveredLink(null);
            }
          };

          return (
            <div
              key={item.path}
              style={menuItemWrapperStyle}
              onMouseEnter={handleEnter}
              onMouseLeave={handleLeave}
              onKeyDown={handleKeyDown}
            >
              <button
                type='button'
                style={{
                  ...menuButtonStyle,
                  ...(isActive || isOpen ? menuButtonActiveStyle : {})
                }}
                onClick={() => handlePrimaryClick(item)}
                aria-expanded={hasChildren ? isOpen : undefined}
                aria-haspopup={hasChildren ? "true" : undefined}
                ref={registerButton(item.path)}
              >
                <span>{displayLabel}</span>
                {hasChildren ? <DropdownCaret open={isOpen} /> : null}
              </button>

              {hasChildren && isOpen ? (
                <div
                  style={{
                    ...dropdownStyle,
                    background: resolveDropdownBackground(),
                    top: dropdownPosition?.top ?? 0,
                    left: dropdownPosition?.left ?? 0,
                    minWidth: dropdownPosition?.width ?? 260
                  }}
                  role='menu'
                  aria-label={displayLabel}
                  onMouseEnter={() => setOpenMenu(item.path)}
                  onMouseLeave={(event) => {
                    const related = event.relatedTarget as Node | null;
                    if (related && (event.currentTarget.contains(related) || navRef.current?.contains(related))) {
                      return;
                    }
                    setOpenMenu((prev) => (prev === item.path ? null : prev));
                    setHoveredLink(null);
                  }}
                >
                  <MenuLink
                    to={item.path}
                    style={dropdownPrimaryLinkStyle}
                    hovered={hoveredLink === item.path}
                    onMouseEnter={() => setHoveredLink(item.path)}
                    onMouseLeave={() => setHoveredLink(null)}
                  >
                    Открыть раздел
                  </MenuLink>
                  {item.children?.map((child) => {
                    const childLabel = stripLeadingIndex(child.label);
                    return (
                      <div key={child.path} style={dropdownSectionStyle}>
                        <MenuLink
                          to={child.path}
                          style={dropdownHeaderStyle}
                          hovered={hoveredLink === child.path}
                          onMouseEnter={() => setHoveredLink(child.path)}
                          onMouseLeave={() => setHoveredLink(null)}
                        >
                          {childLabel}
                        </MenuLink>
                        {child.children?.length ? (
                          <div style={nestedListStyle}>
                            {child.children.map((nested) => {
                              const nestedLabel = stripLeadingIndex(nested.label);
                              return (
                                <MenuLink
                                  key={nested.path}
                                  to={nested.path}
                                  style={nestedLinkStyle}
                                  hovered={hoveredLink === nested.path}
                                  onMouseEnter={() => setHoveredLink(nested.path)}
                                  onMouseLeave={() => setHoveredLink(null)}
                                >
                                  {nestedLabel}
                                </MenuLink>
                              );
                            })}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>
      <main style={contentStyle}>
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
};

export default WarehouseModule;
