import type { CSSProperties, ReactNode } from "react";

import { palette } from "@shared/ui/theme";

const overlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(15, 23, 42, 0.56)",
  display: "flex",
  justifyContent: "flex-end",
  zIndex: 20
};

const panelStyle: CSSProperties = {
  width: 420,
  maxWidth: "90vw",
  height: "100%",
  background: palette.surface,
  boxShadow: "-12px 0 32px rgba(15, 23, 42, 0.24)",
  padding: 24,
  display: "flex",
  flexDirection: "column",
  gap: 18
};

export const SlideOver = ({
  title,
  children,
  onClose
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) => (
  <div style={overlayStyle} role='dialog' aria-modal>
    <div style={panelStyle}>
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

export default SlideOver;
