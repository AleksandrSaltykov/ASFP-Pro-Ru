import type { CSSProperties } from 'react';

import { palette, typography } from '@shared/ui/theme';

const sectionStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 24
};

const headerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  borderBottom: `1px solid ${palette.border}`,
  paddingBottom: 16
};

const titleStyle: CSSProperties = {
  fontSize: 28,
  margin: 0,
  color: palette.textPrimary,
  fontFamily: typography.fontFamily,
  letterSpacing: '-0.01em'
};

const subtitleStyle: CSSProperties = {
  fontSize: 16,
  margin: 0,
  color: palette.textSecondary,
  fontFamily: typography.accentFamily,
  letterSpacing: '0.02em',
  lineHeight: 1.5
};

const bodyStyle: CSSProperties = {
  margin: 0,
  color: palette.textSecondary,
  lineHeight: 1.6,
  fontSize: 15
};

const highlightStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  backgroundColor: palette.accentSoft,
  color: palette.primary,
  padding: '6px 12px',
  borderRadius: 12,
  fontSize: 13,
  fontFamily: typography.accentFamily,
  letterSpacing: '0.04em'
};

const FilesPage = () => (
  <section style={sectionStyle}>
    <header style={headerStyle}>
      <div style={highlightStyle}>Архив документов</div>
      <h1 style={titleStyle}>Файлы, договоры и медиа в единой структуре</h1>
      <p style={subtitleStyle}>
        Интеграции с Ceph RGW и MinIO позволяют хранить документы с контролем доступа и версионностью.
        Фирменные шрифты Onest и Inter поддерживают единый визуальный ритм интерфейса.
      </p>
    </header>
    <p style={bodyStyle}>
      Раздел поддерживает быстрый поиск, теги и предпросмотр. При необходимости подключаем OCR или автоматическое
      формирование метаданных, чтобы команда находила нужные материалы за секунды.
    </p>
  </section>
);

export default FilesPage;
