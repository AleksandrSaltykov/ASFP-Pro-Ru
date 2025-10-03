import { useMemo, type CSSProperties } from 'react';

import {
  useAnalyticsConversionQuery,
  useAnalyticsManagerLoadQuery
} from '@shared/api/analytics';
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

const cardStyle: CSSProperties = {
  borderRadius: 18,
  border: `1px solid ${palette.glassBorder}`,
  background: palette.surface,
  padding: 20,
  display: 'flex',
  flexDirection: 'column',
  gap: 14
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
  letterSpacing: '0.06em',
  color: palette.textMuted
};

const tableCellStyle: CSSProperties = {
  padding: '12px',
  borderBottom: `1px solid ${palette.glassBorder}`,
  fontFamily: typography.accentFamily,
  fontSize: 14,
  color: palette.textPrimary
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

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(value);

const formatPeriod = (value: string) =>
  new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short'
  }).format(new Date(value));

const ServicesPage = () => {
  const conversionQuery = useAnalyticsConversionQuery();
  const managerLoadQuery = useAnalyticsManagerLoadQuery();

  const isLoading = conversionQuery.isLoading || managerLoadQuery.isLoading;

  const summary = useMemo(() => {
    const conversion = conversionQuery.data ?? [];
    if (conversion.length === 0) {
      return [];
    }
    const latest = conversion[0];
    const totalAmount = conversion.reduce((sum, row) => sum + row.totalAmount, 0);
    const wonAmount = conversion.reduce((sum, row) => sum + row.wonAmount, 0);

    return [
      { label: 'Последний период', value: formatPeriod(latest.period) },
      { label: 'Общий оборот', value: formatCurrency(totalAmount) },
      { label: 'Выигранные сделки', value: formatCurrency(wonAmount) },
      { label: 'Средняя конверсия', value: `${(latest.conversionRate * 100).toFixed(1)}%` }
    ];
  }, [conversionQuery.data]);

  if (isLoading) {
    return <PageLoader />;
  }

  if (conversionQuery.isError || managerLoadQuery.isError) {
    return (
      <section style={sectionStyle}>
        <div style={cardStyle}>
          <h1 style={titleStyle}>Сервисы и отчеты</h1>
          <p style={subtitleStyle}>
            Не удалось подгрузить аналитические данные: {conversionQuery.error?.message ?? managerLoadQuery.error?.message}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section style={sectionStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>Сервисы и отчеты</h1>
        <p style={subtitleStyle}>
          Аналитические сервисы gateway готовы: показатели конверсии по периодам и загрузка менеджеров доступны для
          управления воронкой.
        </p>
      </div>

      {summary.length > 0 ? (
        <div style={summaryGridStyle}>
          {summary.map((item) => (
            <div key={item.label} style={summaryItemStyle}>
              <span style={summaryLabelStyle}>{item.label}</span>
              <span style={summaryValueStyle}>{item.value}</span>
            </div>
          ))}
        </div>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, alignItems: 'start' }}>
        <div style={cardStyle}>
          <div style={headerStyle}>
            <h2 style={{ ...titleStyle, fontSize: 20 }}>Конверсия по периодам</h2>
            <p style={subtitleStyle}>Сравните общую выручку и долю выигранных сделок за последние недели.</p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={tableHeadCellStyle}>Дата</th>
                  <th style={tableHeadCellStyle}>Сделок всего</th>
                  <th style={tableHeadCellStyle}>Выиграно</th>
                  <th style={tableHeadCellStyle}>Сумма всего</th>
                  <th style={tableHeadCellStyle}>Выигранная сумма</th>
                  <th style={tableHeadCellStyle}>Конверсия</th>
                </tr>
              </thead>
              <tbody>
                {conversionQuery.data?.map((row) => (
                  <tr key={row.period}>
                    <td style={tableCellStyle}>{formatPeriod(row.period)}</td>
                    <td style={tableCellStyle}>{row.totalCount}</td>
                    <td style={tableCellStyle}>{row.wonCount}</td>
                    <td style={tableCellStyle}>{formatCurrency(row.totalAmount)}</td>
                    <td style={tableCellStyle}>{formatCurrency(row.wonAmount)}</td>
                    <td style={tableCellStyle}>{(row.conversionRate * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={headerStyle}>
            <h2 style={{ ...titleStyle, fontSize: 20 }}>Нагрузка менеджеров</h2>
            <p style={subtitleStyle}>Контроль распределения сделок по команде продаж.</p>
          </div>
          <ul style={listStyle}>
            {managerLoadQuery.data?.map((row) => (
              <li key={row.manager} style={listItemStyle}>
                <strong style={{ fontFamily: typography.fontFamily, fontSize: 16 }}>{row.manager}</strong>
                <span style={subtitleStyle}>Сделок: {row.totalCount}</span>
                <span style={subtitleStyle}>Оборот: {formatCurrency(row.totalAmount)}</span>
              </li>
            ))}
            {managerLoadQuery.data && managerLoadQuery.data.length === 0 ? (
              <li style={subtitleStyle}>Нет данных по менеджерам.</li>
            ) : null}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default ServicesPage;
