import type { CSSProperties, PropsWithChildren } from "react";

import { Tile, type TileProps } from "@shared/ui/Tile";
import { palette, typography } from "@shared/ui/theme";

export type TileGridProps = {
  tiles: TileProps[];
  title?: string;
  description?: string;
  columns?: 3 | 4;
  favoriteIds?: string[];
  onToggleFavorite?: (id: string) => void;
  emptyState?: PropsWithChildren["children"];
};

const sectionStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 18
};

const headerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6
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
  fontSize: 14,
  color: palette.textSecondary
};

const gridBaseStyle: CSSProperties = {
  display: "grid",
  gap: 16,
  width: "100%"
};

const emptyStateStyle: CSSProperties = {
  border: `1px dashed ${palette.glassBorder}`,
  borderRadius: 20,
  padding: "24px 28px",
  color: palette.textSecondary,
  fontSize: 14,
  background: palette.surfaceMuted
};

export const TileGrid = ({
  tiles,
  title,
  description,
  columns = 3,
  favoriteIds,
  onToggleFavorite,
  emptyState
}: TileGridProps) => {
  const favorites = favoriteIds ?? [];
  const anyTiles = tiles.length > 0;
  const sortedTiles = favorites.length
    ? [...tiles].sort((a, b) => {
        const aFav = favorites.includes(a.id);
        const bFav = favorites.includes(b.id);
        if (aFav === bFav) {
          return a.title.localeCompare(b.title);
        }
        return aFav ? -1 : 1;
      })
    : tiles;

  const gridStyle = {
    ...gridBaseStyle,
    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`
  } as CSSProperties;

  return (
    <section style={sectionStyle} aria-label={title ?? "Панель быстрого старта"}>
      {title ? (
        <header style={headerStyle}>
          <h2 style={titleStyle}>{title}</h2>
          {description ? <p style={descriptionStyle}>{description}</p> : null}
        </header>
      ) : null}

      {anyTiles ? (
        <div style={gridStyle}>
          {sortedTiles.map((tile) => (
            <Tile
              key={tile.id}
              {...tile}
              favorite={favorites.includes(tile.id)}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      ) : (
        <div style={emptyStateStyle}>{emptyState ?? "Нет доступных действий"}</div>
      )}
    </section>
  );
};
