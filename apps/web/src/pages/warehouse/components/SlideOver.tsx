import { useEffect, type CSSProperties, type ReactNode } from "react";

import { palette } from "@shared/ui/theme";

const overlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(15, 23, 42, 0.56)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px clamp(16px, 4vw, 48px)",
  zIndex: 2000,
  overflowY: "auto"
};

const panelStyle: CSSProperties = {
  width: "min(1200px, 95vw)",
  maxHeight: "min(92vh, 940px)",
  borderRadius: 28,
  boxShadow: "0 24px 64px rgba(15, 23, 42, 0.32)",
  border: `1px solid ${palette.border}`,
  padding: "clamp(20px, 3vw, 32px)",
  display: "flex",
  flexDirection: "column",
  gap: 20,
  color: palette.textPrimary
};

export const SlideOver = ({
  title,
  children,
  onClose
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) => {
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const resolvePanelBackground = () => {
    if (typeof document === "undefined") {
      return "#ffffff";
    }
    const theme = document.documentElement.getAttribute("data-theme");
    if (theme === "dark") {
      return "#0f172a";
    }
    return "#ffffff";
  };

  return (
    <div
      style={overlayStyle}
      role='dialog'
      aria-modal
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        style={{ ...panelStyle, background: resolvePanelBackground() }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>{title}</h2>
          <button
            type='button'
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              color: palette.textSecondary,
              fontSize: 16,
              cursor: "pointer"
            }}
            aria-label='Закрыть'
          >
            ✕
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", paddingRight: 6 }}>{children}</div>
      </div>
    </div>
  );
};

export default SlideOver;
