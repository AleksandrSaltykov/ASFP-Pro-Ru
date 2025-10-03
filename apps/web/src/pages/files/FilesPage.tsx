import { useMemo, type CSSProperties } from 'react';

import {
  useDocsDocumentsQuery,
  useDocsSignersQuery,
  useDocsTemplatesQuery
} from '@shared/api/docs';
import { PageLoader } from '@shared/ui/PageLoader';
import { palette, typography } from '@shared/ui/theme';

const sectionStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 24
};

const cardStyle: CSSProperties = {
  borderRadius: 18,
  border: `1px solid ${palette.glassBorder}`,
  background: palette.surface,
  padding: 20,
  display: 'flex',
  flexDirection: 'column',
  gap: 16
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

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse'
};

const tableHeadCellStyle: CSSProperties = {
  textAlign: 'left',
  padding: '10px 12px',
  borderBottom: `1px solid ${palette.border}`,
  fontFamily: typography.accentFamily,
  fontSize: 12,
  textTransform: 'uppercase',
  color: palette.textMuted,
  letterSpacing: '0.06em'
};

const tableCellStyle: CSSProperties = {
  padding: '12px',
  borderBottom: `1px solid ${palette.glassBorder}`,
  fontFamily: typography.accentFamily,
  fontSize: 14,
  color: palette.textPrimary
};

const badgeStyle: CSSProperties = {
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
  padding: '14px 16px',
  display: 'flex',
  flexDirection: 'column',
  gap: 8
};

const formatDate = (value?: string) =>
  value
    ? new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }).format(new Date(value))
    : '—';

const FilesPage = () => {
  const templatesQuery = useDocsTemplatesQuery({ limit: 20 });
  const signersQuery = useDocsSignersQuery({ limit: 20 });
  const documentsQuery = useDocsDocumentsQuery({ limit: 20 });

  const isLoading = templatesQuery.isLoading || signersQuery.isLoading || documentsQuery.isLoading;

  const summary = useMemo(() => {
    const templates = templatesQuery.data ?? [];
    const signers = signersQuery.data ?? [];
    const documents = documentsQuery.data ?? [];
    const approved = documents.filter((doc) => doc.status === 'approved').length;
    const draft = documents.filter((doc) => doc.status === 'draft').length;

    return [
      { label: 'Шаблонов', value: templates.length.toString() },
      { label: 'Подписантов', value: signers.length.toString() },
      { label: 'Документов', value: documents.length.toString() },
      { label: 'Готово к отправке', value: approved.toString() },
      { label: 'Черновиков', value: draft.toString() }
    ];
  }, [templatesQuery.data, signersQuery.data, documentsQuery.data]);

  if (isLoading) {
    return <PageLoader />;
  }

  if (templatesQuery.isError || signersQuery.isError || documentsQuery.isError) {
    return (
      <section style={sectionStyle}>
        <div style={cardStyle}>
          <h1 style={titleStyle}>Архив документов</h1>
          <p style={subtitleStyle}>
            Не удалось загрузить данные: {templatesQuery.error?.message ?? signersQuery.error?.message ?? documentsQuery.error?.message}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section style={sectionStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>Архив документов</h1>
        <p style={subtitleStyle}>
          Данные подключены из gateway: шаблоны, подписанты и документы готовы к визуализации. Статусы позволяют
          контролировать прохождение согласования.
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

      <div style={cardStyle}>
        <div style={headerStyle}>
          <h2 style={{ ...titleStyle, fontSize: 20 }}>Документы</h2>
          <p style={subtitleStyle}>Последние выпущенные документы с указанием статуса и подписи.</p>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={tableHeadCellStyle}>Номер</th>
                <th style={tableHeadCellStyle}>Название</th>
                <th style={tableHeadCellStyle}>Статус</th>
                <th style={tableHeadCellStyle}>Выдан</th>
                <th style={tableHeadCellStyle}>Подписан</th>
              </tr>
            </thead>
            <tbody>
              {documentsQuery.data?.map((document) => (
                <tr key={document.id}>
                  <td style={tableCellStyle}>{document.number || '—'}</td>
                  <td style={tableCellStyle}>{document.title}</td>
                  <td style={tableCellStyle}>
                    <span style={badgeStyle}>{document.status}</span>
                  </td>
                  <td style={tableCellStyle}>{formatDate(document.issuedAt ?? document.createdAt)}</td>
                  <td style={tableCellStyle}>{formatDate(document.signedAt)}</td>
                </tr>
              ))}
              {documentsQuery.data && documentsQuery.data.length === 0 ? (
                <tr>
                  <td style={tableCellStyle} colSpan={5}>
                    Документы отсутствуют.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
        <div style={cardStyle}>
          <div style={headerStyle}>
            <h2 style={{ ...titleStyle, fontSize: 20 }}>Шаблоны</h2>
            <p style={subtitleStyle}>Используйте актуальные версии шаблонов для выпуска документов.</p>
          </div>
          <ul style={listStyle}>
            {templatesQuery.data?.map((template) => (
              <li key={template.id} style={listItemStyle}>
                <strong style={{ fontFamily: typography.fontFamily, fontSize: 16 }}>{template.name}</strong>
                <span style={subtitleStyle}>Версия {template.version}</span>
                <span style={subtitleStyle}>Код {template.code}</span>
                <p style={{ margin: 0, fontFamily: typography.accentFamily, fontSize: 13, color: palette.textSecondary }}>
                  {template.description || 'Описание не задано'}
                </p>
                <span style={summaryLabelStyle}>Обновлен {formatDate(template.updatedAt)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div style={cardStyle}>
          <div style={headerStyle}>
            <h2 style={{ ...titleStyle, fontSize: 20 }}>Подписанты</h2>
            <p style={subtitleStyle}>Контакты сотрудников, участвующих в электронном подписании.</p>
          </div>
          <ul style={listStyle}>
            {signersQuery.data?.map((signer) => (
              <li key={signer.id} style={listItemStyle}>
                <strong style={{ fontFamily: typography.fontFamily, fontSize: 16 }}>{signer.fullName}</strong>
                <span style={subtitleStyle}>{signer.position}</span>
                <span style={subtitleStyle}>{signer.email} · {signer.phone}</span>
                <span style={summaryLabelStyle}>Код {signer.code}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default FilesPage;
