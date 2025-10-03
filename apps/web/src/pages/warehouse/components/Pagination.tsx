import type { CSSProperties } from "react";

import { palette } from "@shared/ui/theme";

const wrapperStyle: CSSProperties = {
  display: "flex",
  gap: 12,
  alignItems: "center"
};

const buttonStyle: CSSProperties = {
  border: `1px solid ${palette.border}`,
  background: palette.surface,
  borderRadius: 12,
  padding: "8px 14px",
  cursor: "pointer",
  color: palette.textPrimary,
  fontSize: 13
};

const infoStyle: CSSProperties = {
  color: palette.textSecondary,
  fontSize: 13
};

export const Pagination = ({
  page,
  pageSize,
  total,
  onPrev,
  onNext
}: {
  page: number;
  pageSize: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}) => {
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const hasPrev = page > 1;
  const hasNext = end < total;

  return (
    <div style={wrapperStyle}>
      <button type='button' style={buttonStyle} onClick={onPrev} disabled={!hasPrev}>
        Назад
      </button>
      <button type='button' style={buttonStyle} onClick={onNext} disabled={!hasNext}>
        Вперёд
      </button>
      <span style={infoStyle}>
        {total ? `${start}–${end} из ${total}` : 'Нет данных'}
      </span>
    </div>
  );
};

export default Pagination;
