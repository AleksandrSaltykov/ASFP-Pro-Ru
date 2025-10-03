import { useMemo, type CSSProperties } from 'react';

import { useBpmProcessesQuery, useBpmTasksQuery, useBpmFormsQuery } from '@shared/api/bpm';
import { PageLoader } from '@shared/ui/PageLoader';
import { palette, typography } from '@shared/ui/theme';

const sectionStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 24
};

const headerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontFamily: typography.fontFamily,
  fontSize: 26,
  fontWeight: 600,
  color: palette.textPrimary
};

const subtitleStyle: CSSProperties = {
  margin: 0,
  fontFamily: typography.accentFamily,
  fontSize: 14,
  color: palette.textSecondary
};

const summaryGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: 12
};

const summaryItemStyle: CSSProperties = {
  borderRadius: 16,
  border: `1px solid ${palette.glassBorder}`,
  background: palette.layer,
  padding: '16px 18px',
  display: 'flex',
  flexDirection: 'column',
  gap: 6
};

const summaryLabelStyle: CSSProperties = {
  fontFamily: typography.accentFamily,
  fontSize: 12,
  textTransform: 'uppercase',
  color: palette.textMuted,
  letterSpacing: '0.08em'
};

const summaryValueStyle: CSSProperties = {
  fontFamily: typography.fontFamily,
  fontSize: 22,
  fontWeight: 600,
  color: palette.textPrimary
};

const listCardStyle: CSSProperties = {
  borderRadius: 18,
  border: `1px solid ${palette.glassBorder}`,
  background: palette.surface,
  padding: 20,
  display: 'flex',
  flexDirection: 'column',
  gap: 14
};

const listStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  margin: 0,
  padding: 0,
  listStyle: 'none'
};

const listItemStyle: CSSProperties = {
  borderRadius: 16,
  border: `1px solid ${palette.glassBorder}`,
  background: palette.layer,
  padding: '12px 16px',
  display: 'flex',
  flexDirection: 'column',
  gap: 6
};

const statusBadgeStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '4px 10px',
  borderRadius: 999,
  background: palette.accentSoft,
  color: palette.primary,
  fontFamily: typography.accentFamily,
  fontSize: 11,
  letterSpacing: '0.08em',
  textTransform: 'uppercase'
};

const metaRowStyle: CSSProperties = {
  display: 'flex',
  gap: 16,
  flexWrap: 'wrap',
  fontFamily: typography.accentFamily,
  fontSize: 13,
  color: palette.textSecondary
};

const formatDate = (value?: string) =>
  value
    ? new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }).format(new Date(value))
    : '—';

const TasksProjectsPage = () => {
  const processesQuery = useBpmProcessesQuery({ limit: 20 });
  const tasksQuery = useBpmTasksQuery({ limit: 20 });
  const formsQuery = useBpmFormsQuery({ limit: 20 });

  const isLoading = processesQuery.isLoading || tasksQuery.isLoading || formsQuery.isLoading;

  const summary = useMemo(() => {
    const processes = processesQuery.data ?? [];
    const activeProcesses = processes.filter((process) => process.status === 'active').length;
    const drafts = processes.filter((process) => process.status === 'draft').length;
    const tasks = tasksQuery.data ?? [];
    const overdueTasks = tasks.filter((task) => {
      if (!task.dueAt) {
        return false;
      }
      return new Date(task.dueAt).getTime() < Date.now() && task.status !== 'done';
    }).length;

    return [
      { label: 'Процессов', value: processes.length.toString() },
      { label: 'Активных процессов', value: activeProcesses.toString() },
      { label: 'Черновиков', value: drafts.toString() },
      { label: 'Задач в работе', value: tasks.length.toString() },
      { label: 'Просрочено', value: overdueTasks.toString() }
    ];
  }, [processesQuery.data, tasksQuery.data]);

  if (isLoading) {
    return <PageLoader />;
  }

  if (processesQuery.isError || tasksQuery.isError || formsQuery.isError) {
    return (
      <section style={sectionStyle}>
        <div style={listCardStyle}>
          <h1 style={titleStyle}>Задачи и процессы</h1>
          <p style={subtitleStyle}>
            Не удалось загрузить BPM данные: {processesQuery.error?.message ?? tasksQuery.error?.message ?? formsQuery.error?.message}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section style={sectionStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>Задачи и процессы</h1>
        <p style={subtitleStyle}>
          Список активных процессов, форм и задач из BPM сервиса. Здесь видно, что согласовано, что ждет доработки и кто в
          ответе за следующие шаги.
        </p>
      </div>

      <div style={summaryGridStyle}>
        {summary.map((item) => (
          <div key={item.label} style={summaryItemStyle}>
            <span style={summaryLabelStyle}>{item.label}</span>
            <span style={summaryValueStyle}>{item.value}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, alignItems: 'start' }}>
        <div style={listCardStyle}>
          <div style={headerStyle}>
            <h2 style={{ ...titleStyle, fontSize: 20 }}>Процессы</h2>
            <p style={subtitleStyle}>Отслеживайте состояния и версии ключевых процессов.</p>
          </div>
          <ul style={listStyle}>
            {processesQuery.data?.map((process) => (
              <li key={process.id} style={listItemStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <strong style={{ fontFamily: typography.fontFamily, fontSize: 16 }}>{process.name}</strong>
                  <span style={statusBadgeStyle}>{process.status}</span>
                </div>
                <p style={{ margin: 0, fontFamily: typography.accentFamily, fontSize: 13, color: palette.textSecondary }}>
                  {process.description || 'Описание не добавлено'}
                </p>
                <div style={metaRowStyle}>
                  <span>Версия {process.version}</span>
                  <span>Код {process.code}</span>
                  <span>Обновлен {formatDate(process.updatedAt)}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div style={listCardStyle}>
          <div style={headerStyle}>
            <h2 style={{ ...titleStyle, fontSize: 20 }}>Формы</h2>
            <p style={subtitleStyle}>Пользовательские формы, привязанные к процедурам согласования.</p>
          </div>
          <ul style={listStyle}>
            {formsQuery.data?.map((form) => (
              <li key={form.id} style={listItemStyle}>
                <strong style={{ fontFamily: typography.fontFamily, fontSize: 15 }}>{form.name}</strong>
                <div style={metaRowStyle}>
                  <span>Процесс {form.processId.slice(0, 8)}…</span>
                  <span>Версия {form.version}</span>
                  <span>Код {form.code}</span>
                </div>
                <span style={summaryLabelStyle}>Обновлено {formatDate(form.updatedAt)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div style={listCardStyle}>
        <div style={headerStyle}>
          <h2 style={{ ...titleStyle, fontSize: 20 }}>Задачи</h2>
          <p style={subtitleStyle}>Текущая загрузка исполнителей и сроки выполнения.</p>
        </div>
        <ul style={listStyle}>
          {tasksQuery.data?.map((task) => (
            <li key={task.id} style={listItemStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <strong style={{ fontFamily: typography.fontFamily, fontSize: 15 }}>{task.title}</strong>
                <span style={statusBadgeStyle}>{task.status}</span>
              </div>
              <div style={metaRowStyle}>
                <span>Исполнитель {task.assignee || 'не назначен'}</span>
                <span>Процесс {task.processId.slice(0, 8)}…</span>
                <span>Срок {formatDate(task.dueAt)}</span>
              </div>
            </li>
          ))}
          {tasksQuery.data && tasksQuery.data.length === 0 ? (
            <li style={subtitleStyle}>Активных задач нет.</li>
          ) : null}
        </ul>
      </div>
    </section>
  );
};

export default TasksProjectsPage;
