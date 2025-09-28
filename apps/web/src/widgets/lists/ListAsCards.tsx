import type { CSSProperties } from "react";
import { Link } from "react-router-dom";

import { palette, typography } from "@shared/ui/theme";

export type ListCardAction = {
  label: string;
  to?: string;
  onClick?: () => void;
};

export type ListCardItem = {
  id: string;
  title: string;
  customer?: string;
  value?: string;
  deadline?: string;
  status: string;
  owner?: string;
  tags?: string[];
  actions?: ListCardAction[];
};

export type FilterChip = {
  id: string;
  label: string;
};

export type KanbanColumn = {
  id: string;
  label: string;
};

export type ListAsCardsProps = {
  title: string;
  description?: string;
  filters?: FilterChip[];
  activeFilterId?: string;
  onFilterChange?: (id: string) => void;
  items: ListCardItem[];
  viewMode: "list" | "kanban";
  onViewModeChange?: (mode: "list" | "kanban") => void;
  kanbanColumns?: KanbanColumn[];
};

const wrapperStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 18
};

const headerStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 12,
  alignItems: "center"
};

const titleGroupStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column"
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 24,
  fontWeight: 600,
  fontFamily: typography.fontFamily,
  color: palette.textPrimary
};

const descriptionStyle: CSSProperties = {
  margin: 0,
  fontSize: 13,
  color: palette.textSecondary
};

const filterBarStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10
};

const chipStyle: CSSProperties = {
  borderRadius: 16,
  border: `1px solid ${palette.border}`,
  padding: "6px 14px",
  fontSize: 13,
  background: palette.surfaceMuted,
  color: palette.textSecondary,
  cursor: "pointer"
};

const chipActiveStyle: CSSProperties = {
  background: palette.primary,
  borderColor: palette.primary,
  color: "#ffffff"
};

const viewToggleStyle: CSSProperties = {
  marginLeft: "auto",
  display: "inline-flex",
  borderRadius: 16,
  border: `1px solid ${palette.border}`,
  padding: 4,
  gap: 6,
  background: palette.surface
};

const toggleButtonStyle: CSSProperties = {
  border: "none",
  borderRadius: 12,
  padding: "6px 12px",
  fontSize: 12,
  cursor: "pointer",
  background: "transparent",
  color: palette.textSecondary
};

const toggleActiveStyle: CSSProperties = {
  background: palette.primary,
  color: "#ffffff"
};

const listGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
  gap: 16
};

const cardStyle: CSSProperties = {
  borderRadius: 20,
  border: `1px solid ${palette.border}`,
  background: palette.surface,
  boxShadow: palette.shadowElevated,
  padding: 18,
  display: "flex",
  flexDirection: "column",
  gap: 12
};

const cardHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "flex-start"
};

const cardTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontWeight: 600,
  color: palette.textPrimary
};

const badgeStyle: CSSProperties = {
  borderRadius: 12,
  padding: "4px 10px",
  background: palette.accentSoft,
  color: palette.primary,
  fontSize: 12,
  alignSelf: "flex-start"
};

const cardMetaStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  color: palette.textSecondary,
  fontSize: 12
};

const cardActionsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10
};

const actionButtonStyle: CSSProperties = {
  borderRadius: 14,
  border: `1px solid ${palette.primary}`,
  padding: "8px 14px",
  background: "transparent",
  color: palette.primary,
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 600
};

const kanbanWrapperStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 14
};

const kanbanColumnStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  borderRadius: 20,
  padding: 16,
  background: palette.surfaceMuted,
  border: `1px dashed ${palette.border}`
};

const kanbanTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 14,
  fontWeight: 600,
  color: palette.textSecondary,
  textTransform: "uppercase"
};

const renderActionButton = ({ label, to, onClick }: ListCardAction) => {
  if (to) {
    return (
      <Link key={label} to={to} style={actionButtonStyle} role="button">
        {label}
      </Link>
    );
  }
  return (
    <button key={label} type="button" onClick={onClick} style={actionButtonStyle}>
      {label}
    </button>
  );
};

export const ListAsCards = ({
  title,
  description,
  filters,
  activeFilterId,
  onFilterChange,
  items,
  viewMode,
  onViewModeChange,
  kanbanColumns
}: ListAsCardsProps) => {
  const columns = kanbanColumns ?? Array.from(new Set(items.map((item) => item.status))).map((status) => ({
    id: status,
    label: status
  }));

  return (
    <section style={wrapperStyle}>
      <div style={headerStyle}>
        <div style={titleGroupStyle}>
          <h2 style={titleStyle}>{title}</h2>
          {description ? <p style={descriptionStyle}>{description}</p> : null}
        </div>
        <div style={viewToggleStyle}>
          <button
            type="button"
            onClick={() => onViewModeChange?.("list")}
            style={{
              ...toggleButtonStyle,
              ...(viewMode === "list" ? toggleActiveStyle : null)
            }}
            aria-pressed={viewMode === "list"}
          >
            Список
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange?.("kanban")}
            style={{
              ...toggleButtonStyle,
              ...(viewMode === "kanban" ? toggleActiveStyle : null)
            }}
            aria-pressed={viewMode === "kanban"}
          >
            Канбан
          </button>
        </div>
      </div>

      {filters?.length ? (
        <div style={filterBarStyle}>
          {filters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => onFilterChange?.(filter.id)}
              style={{
                ...chipStyle,
                ...(filter.id === activeFilterId ? chipActiveStyle : null)
              }}
              aria-pressed={filter.id === activeFilterId}
            >
              {filter.label}
            </button>
          ))}
        </div>
      ) : null}

      {viewMode === "list" ? (
        <div style={listGridStyle}>
          {items.map((item) => (
            <article key={item.id} style={cardStyle} aria-label={item.title}>
              <div style={cardHeaderStyle}>
                <h3 style={cardTitleStyle}>{item.title}</h3>
                <span style={badgeStyle}>{item.status}</span>
              </div>
              <div style={cardMetaStyle}>
                {item.customer ? <span>Клиент: {item.customer}</span> : null}
                {item.value ? <span>Сумма: {item.value}</span> : null}
                {item.deadline ? <span>Дедлайн: {item.deadline}</span> : null}
                {item.owner ? <span>Ответственный: {item.owner}</span> : null}
              </div>
              {item.tags?.length ? (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        borderRadius: 12,
                        padding: "4px 10px",
                        background: palette.accentSoft,
                        color: palette.primary,
                        fontSize: 11
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
              {item.actions?.length ? (
                <div style={cardActionsStyle}>{item.actions.map(renderActionButton)}</div>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <div style={kanbanWrapperStyle}>
          {columns.map((column) => {
            const columnItems = items.filter((item) => item.status === column.id);
            return (
              <div key={column.id} style={kanbanColumnStyle}>
                <h3 style={kanbanTitleStyle}>{column.label}</h3>
                {columnItems.length ? (
                  columnItems.map((item) => (
                    <article key={item.id} style={{ ...cardStyle, boxShadow: "none" }}>
                      <h4 style={cardTitleStyle}>{item.title}</h4>
                      <div style={cardMetaStyle}>
                        {item.customer ? <span>{item.customer}</span> : null}
                        {item.value ? <span>{item.value}</span> : null}
                      </div>
                    </article>
                  ))
                ) : (
                  <span style={{ color: palette.textMuted, fontSize: 12 }}>Нет данных</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
