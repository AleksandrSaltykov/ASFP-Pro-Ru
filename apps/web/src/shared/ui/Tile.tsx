import { memo } from "react";
import { Link, type LinkProps } from "react-router-dom";
import type { CSSProperties, ReactNode } from "react";

import { iconMap } from "@shared/ui/icons";
import { palette, typography } from "@shared/ui/theme";

export type TileSize = "S" | "M" | "L";

export type TileAction = {
  label: string;
  to?: LinkProps["to"];
  onClick?: () => void;
};

export type TileProps = {
  id: string;
  title: string;
  value?: string | number;
  note?: string;
  icon?: keyof typeof iconMap | string;
  size?: TileSize;
  to?: LinkProps["to"];
  onClick?: () => void;
  action?: TileAction;
  favorite?: boolean;
  onToggleFavorite?: (id: string) => void;
};

const tileBaseStyle: CSSProperties = {
  position: "relative",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  borderRadius: 24,
  border: `1px solid ${palette.border}`,
  background: palette.layer,
  padding: 20,
  boxShadow: "0 18px 36px rgba(15, 23, 42, 0.16)",
  color: palette.textPrimary,
  minWidth: 0,
  transition: "transform 0.15s ease, box-shadow 0.15s ease",
  textDecoration: "none",
  outline: "none",
  cursor: "pointer"
};

const sizeStyles: Record<TileSize, CSSProperties> = {
  S: {
    minHeight: 140,
    padding: 18,
    gap: 10
  },
  M: {
    minHeight: 180,
    padding: 20,
    gap: 12
  },
  L: {
    minHeight: 220,
    padding: 24,
    gap: 14
  }
};

const titleStyle: CSSProperties = {
  fontFamily: typography.fontFamily,
  fontWeight: 600,
  fontSize: 18,
  margin: 0,
  lineHeight: 1.2
};

const valueStyle: CSSProperties = {
  fontSize: 32,
  fontWeight: 700,
  margin: 0,
  letterSpacing: "-0.01em"
};

const noteStyle: CSSProperties = {
  fontSize: 13,
  color: palette.textSecondary,
  margin: 0,
  lineHeight: 1.4
};

const favoriteButtonStyle: CSSProperties = {
  position: "absolute",
  top: 12,
  right: 12,
  width: 32,
  height: 32,
  borderRadius: "50%",
  border: `1px solid ${palette.border}`,
  background: palette.surface,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: palette.textSecondary
};

const iconWrapperStyle: CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 16,
  background: palette.surfaceMuted,
  color: palette.primary,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: 12
};

const actionButtonStyle: CSSProperties = {
  alignSelf: "flex-start",
  borderRadius: 16,
  border: "none",
  padding: "10px 16px",
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
  background: palette.primary,
  color: '#ffffff',
  display: "inline-flex",
  alignItems: "center",
  gap: 8
};

const FavoriteIcon = ({ active }: { active?: boolean }) => (
  <svg
    aria-hidden
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill={active ? palette.primary : "none"}
    stroke={active ? palette.primary : palette.textSecondary}
    strokeWidth="1.6"
  >
    <path
      d="M12 18.26l-5.64 3.32 1.44-6.2-4.8-4.18 6.32-.54L12 5l2.68 5.66 6.32.54-4.8 4.18 1.44 6.2z"
      strokeLinejoin="round"
    />
  </svg>
);

const resolveIcon = (icon?: TileProps["icon"]) => {
  if (!icon) {
    return null;
  }
  if (typeof icon === "string" && icon in iconMap) {
    return iconMap[icon as keyof typeof iconMap];
  }
  return null;
};

const renderAction = (action: TileAction | undefined): ReactNode => {
  if (!action) {
    return null;
  }

  if (action.to) {
    return (
      <Link to={action.to} style={actionButtonStyle} role="button">
        {action.label}
      </Link>
    );
  }

  return (
    <button type="button" onClick={action.onClick} style={actionButtonStyle}>
      {action.label}
    </button>
  );
};

const TileComponent = ({
  id,
  title,
  value,
  note,
  icon,
  size = "M",
  to,
  onClick,
  action,
  favorite,
  onToggleFavorite
}: TileProps) => {
  const resolvedIcon = resolveIcon(icon);
  const style = {
    ...tileBaseStyle,
    ...sizeStyles[size]
  };

  const body = (
    <>
      {onToggleFavorite ? (
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onToggleFavorite(id);
          }}
          style={favoriteButtonStyle}
          aria-pressed={favorite}
          aria-label={favorite ? "Удалить из избранного" : "Добавить в избранное"}
        >
          <FavoriteIcon active={favorite} />
        </button>
      ) : null}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {resolvedIcon ? <span style={iconWrapperStyle}>{resolvedIcon}</span> : null}
        <h3 style={titleStyle}>{title}</h3>
        {value !== undefined ? <p style={valueStyle}>{value}</p> : null}
        {note ? <p style={noteStyle}>{note}</p> : null}
      </div>

      {renderAction(action)}
    </>
  );

  if (to) {
    return (
      <Link to={to} onClick={onClick} style={style} data-tile-size={size}>
        {body}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} style={style} data-tile-size={size}>
      {body}
    </button>
  );
};

export const Tile = memo(TileComponent);
