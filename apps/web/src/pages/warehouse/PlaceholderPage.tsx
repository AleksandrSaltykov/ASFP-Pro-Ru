import type { CSSProperties, ReactNode } from "react";

import { palette, typography } from "@shared/ui/theme";

const wrapperStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
  padding: 24,
  borderRadius: 18,
  border: `1px dashed ${palette.border}`,
  background: palette.surface,
  boxShadow: palette.shadowSoft
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 26,
  fontWeight: 600,
  fontFamily: typography.fontFamily,
  color: palette.textPrimary
};

const descriptionStyle: CSSProperties = {
  margin: 0,
  fontSize: 15,
  color: palette.textSecondary,
  lineHeight: 1.5
};

export const PlaceholderPage = ({
  title,
  description,
  children
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) => (
  <section style={wrapperStyle}>
    <h1 style={titleStyle}>{title}</h1>
    <p style={descriptionStyle}>
      {description ??
        'Раздел готовится к запуску. Команда складской платформы синхронизирует дизайн и API перед активной разработкой.'}
    </p>
    {children}
  </section>
);

export default PlaceholderPage;
