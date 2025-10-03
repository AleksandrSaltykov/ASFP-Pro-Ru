import type { CSSProperties, ReactNode } from "react";

import { palette, typography } from "@shared/ui/theme";

export type TableColumn<TItem> = {
  id: string;
  label: string;
  width?: string | number;
  align?: CSSProperties["textAlign"];
  render: (item: TItem) => ReactNode;
};

export type DataTableProps<TItem> = {
  columns: TableColumn<TItem>[];
  items: TItem[];
  emptyMessage?: string;
  getRowStyle?: (item: TItem) => CSSProperties | undefined;
};

const tableWrapperStyle: CSSProperties = {
  borderRadius: 18,
  border: `1px solid ${palette.border}`,
  overflow: "hidden",
  background: palette.surface,
  boxShadow: palette.shadowSoft
};

const tableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontFamily: typography.fontFamily,
  fontSize: 14
};

const headCellStyle: CSSProperties = {
  textAlign: "left" as const,
  padding: "12px 16px",
  background: palette.surfaceMuted,
  color: palette.textSecondary,
  fontSize: 12,
  letterSpacing: "0.08em",
  textTransform: "uppercase"
};

const rowStyle: CSSProperties = {
  borderBottom: `1px solid ${palette.border}`
};

const cellStyle: CSSProperties = {
  padding: "14px 16px",
  color: palette.textPrimary,
  verticalAlign: "middle"
};

const emptyStateStyle: CSSProperties = {
  padding: 32,
  textAlign: "center" as const,
  color: palette.textSecondary
};

export const DataTable = <TItem,>({ columns, items, emptyMessage, getRowStyle }: DataTableProps<TItem>) => (
  <div style={tableWrapperStyle}>
    <table style={tableStyle}>
      <thead>
        <tr>
          {columns.map((column) => (
            <th
              key={column.id}
              style={{
                ...headCellStyle,
                textAlign: column.align ?? "left",
                width: column.width
              }}
            >
              {column.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {items.length ? (
          items.map((item) => (
            <tr key={(item as { id?: string }).id ?? JSON.stringify(item)} style={{ ...rowStyle, ...(getRowStyle ? getRowStyle(item) : undefined) }}>
              {columns.map((column) => (
                <td
                  key={column.id}
                  style={{
                    ...cellStyle,
                    textAlign: column.align ?? "left"
                  }}
                >
                  {column.render(item)}
                </td>
              ))}
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={columns.length} style={emptyStateStyle}>
              {emptyMessage ?? "Данные не найдены"}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

export default DataTable;
