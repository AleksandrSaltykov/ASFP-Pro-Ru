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

const TasksProjectsPage = () => (
  <section style={sectionStyle}>
    <header style={headerStyle}>
      <div style={highlightStyle}>Задачи и проекты</div>
      <h1 style={titleStyle}>Общий контур задач и проектных потоков</h1>
      <p style={subtitleStyle}>
        Планируем этапы, отслеживаем исполнение и контролируем загрузку команды в одной панели. Виджеты готовы
        к интеграции с Kanban, диаграммами Ганта и чек-листами.
      </p>
    </header>
    <p style={bodyStyle}>
      Здесь появятся статусы задач, синхронизация с календарями и связка с CRM воронками. Компонентная база
      уже унифицирована, достаточно подключить источники данных и описать сценарии работы.
    </p>
  </section>
);

export default TasksProjectsPage;
