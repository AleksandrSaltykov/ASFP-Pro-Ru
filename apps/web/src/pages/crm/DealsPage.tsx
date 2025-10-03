import { useMemo, useState, type CSSProperties } from 'react';

import { useDealsQuery, useCustomersQuery, useDealHistoryQuery } from '@shared/api/crm';
import type { CrmDeal } from '@shared/api/crm';
import { PermissionGuard } from '@shared/ui/PermissionGuard';
import { PageLoader } from '@shared/ui/PageLoader';
import { palette, typography } from '@shared/ui/theme';

const pageStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '2fr 1fr',
  gap: 24,
  alignItems: 'start'
};

const columnStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 18
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

const filterListStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  margin: 0,
  padding: 0,
  listStyle: 'none'
};

const filterButtonStyle: CSSProperties = {
  padding: '8px 14px',
  borderRadius: 14,
  border: `1px solid ${palette.glassBorder}`,
  background: palette.layer,
  color: palette.textSecondary,
  fontFamily: typography.accentFamily,
  fontSize: 13,
  cursor: 'pointer'
};

const filterButtonActive: CSSProperties = {
  ...filterButtonStyle,
  background: palette.primary,
  borderColor: palette.primary,
  color: '#fff'
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
  color: palette.textPrimary,
  verticalAlign: 'top'
};

const dealRowStyle: CSSProperties = {
  cursor: 'pointer'
};

const summaryGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
  gap: 12
};

const summaryItemStyle: CSSProperties = {
  borderRadius: 16,
  border: `1px solid ${palette.glassBorder}`,
  background: palette.layer,
  padding: '14px 16px',
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

const historyListStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  margin: 0,
  padding: 0,
  listStyle: 'none'
};

const historyItemStyle: CSSProperties = {
  borderRadius: 14,
  border: `1px solid ${palette.glassBorder}`,
  background: palette.layer,
  padding: '12px 14px',
  display: 'flex',
  flexDirection: 'column',
  gap: 6
};

const badgeStyle: CSSProperties = {
  alignSelf: 'flex-start',
  padding: '4px 10px',
  borderRadius: 999,
  background: palette.accentSoft,
  color: palette.primary,
  fontFamily: typography.accentFamily,
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.08em'
};

const formatCurrency = (amount: number, currency: string) =>
  new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(amount);

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date(value));

const DealsPageContent = () => {
  const [stageFilter, setStageFilter] = useState<string>('');
  const [selectedDealId, setSelectedDealId] = useState<string | undefined>();

  const dealsQuery = useDealsQuery({ stage: stageFilter || undefined, limit: 100 });
  const customersQuery = useCustomersQuery({ limit: 100 });
  const historyQuery = useDealHistoryQuery(selectedDealId, 15, { enabled: Boolean(selectedDealId) });

  const isLoading = dealsQuery.isLoading || customersQuery.isLoading;

  const customerById = useMemo(() => {
    if (!customersQuery.data) {
      return new Map<string, string>();
    }
    return new Map(customersQuery.data.map((customer) => [customer.id, customer.name]));
  }, [customersQuery.data]);

  const stageOptions = useMemo(() => {
    const stages = new Set<string>();
    dealsQuery.data?.forEach((deal) => {
      if (deal.stage) {
        stages.add(deal.stage);
      }
    });
    return [''].concat(Array.from(stages));
  }, [dealsQuery.data]);

  const summary = useMemo(() => {
    const totalDeals = dealsQuery.data?.length ?? 0;
    const totalAmount = dealsQuery.data?.reduce((sum, deal) => sum + deal.amount, 0) ?? 0;
    const avgAmount = totalDeals > 0 ? totalAmount / totalDeals : 0;

    return [
      { label: 'Всего сделок', value: totalDeals.toString() },
      { label: 'Общий оборот', value: formatCurrency(totalAmount, 'RUB') },
      { label: 'Средний чек', value: formatCurrency(avgAmount, 'RUB') }
    ];
  }, [dealsQuery.data]);

  const handleDealClick = (deal: CrmDeal) => {
    setSelectedDealId(deal.id);
  };

  if (isLoading) {
    return <PageLoader />;
  }

  if (dealsQuery.isError || customersQuery.isError) {
    return (
      <div style={cardStyle}>
        <h2 style={titleStyle}>Не удалось загрузить CRM данные</h2>
        <p style={subtitleStyle}>{dealsQuery.error?.message ?? customersQuery.error?.message}</p>
      </div>
    );
  }

  const selectedDeal = dealsQuery.data?.find((deal) => deal.id === selectedDealId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={titleStyle}>CRM · Сделки</h1>
        <p style={subtitleStyle}>
          Актуальные сделки и клиенты из шины gateway. Используйте фильтр по стадиям и отслеживайте историю изменений
          карточки.
        </p>
      </header>

      <div style={summaryGridStyle}>
        {summary.map((item) => (
          <div key={item.label} style={summaryItemStyle}>
            <span style={summaryLabelStyle}>{item.label}</span>
            <span style={summaryValueStyle}>{item.value}</span>
          </div>
        ))}
      </div>

      <div style={pageStyle}>
        <section style={columnStyle}>
          <div style={cardStyle}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <h2 style={{ ...titleStyle, fontSize: 20 }}>Воронка</h2>
              <p style={subtitleStyle}>Выберите стадию, чтобы сосредоточиться на нужной части pipeline.</p>
            </div>

            <ul style={filterListStyle}>
              {stageOptions.map((stage) => (
                <li key={stage || 'all'}>
                  <button
                    type='button'
                    style={stage === stageFilter ? filterButtonActive : filterButtonStyle}
                    onClick={() => setStageFilter(stage)}
                  >
                    {stage === '' ? 'Все' : stage}
                  </button>
                </li>
              ))}
            </ul>

            <div style={{ overflowX: 'auto' }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={tableHeadCellStyle}>Сделка</th>
                    <th style={tableHeadCellStyle}>Клиент</th>
                    <th style={tableHeadCellStyle}>Стадия</th>
                    <th style={tableHeadCellStyle}>Сумма</th>
                    <th style={tableHeadCellStyle}>Создано</th>
                  </tr>
                </thead>
                <tbody>
                  {dealsQuery.data?.map((deal) => (
                    <tr
                      key={deal.id}
                      style={dealRowStyle}
                      onClick={() => handleDealClick(deal)}
                      data-selected={deal.id === selectedDealId}
                    >
                      <td style={tableCellStyle}>{deal.title}</td>
                      <td style={tableCellStyle}>{customerById.get(deal.customerId) ?? 'Неизвестный клиент'}</td>
                      <td style={tableCellStyle}>{deal.stage || '—'}</td>
                      <td style={tableCellStyle}>{formatCurrency(deal.amount, deal.currency || 'RUB')}</td>
                      <td style={tableCellStyle}>{formatDate(deal.createdAt)}</td>
                    </tr>
                  ))}
                  {dealsQuery.data && dealsQuery.data.length === 0 ? (
                    <tr>
                      <td style={tableCellStyle} colSpan={5}>
                        Сделок на выбранной стадии нет.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          {selectedDeal ? (
            <div style={cardStyle}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={badgeStyle}>{selectedDeal.stage || 'Стадия не указана'}</span>
                <h2 style={{ ...titleStyle, fontSize: 20 }}>{selectedDeal.title}</h2>
                <p style={subtitleStyle}>
                  Клиент: {customerById.get(selectedDeal.customerId) ?? selectedDeal.customerId} · Сумма:{' '}
                  {formatCurrency(selectedDeal.amount, selectedDeal.currency || 'RUB')}
                </p>
              </div>

              {historyQuery.isLoading ? (
                <PageLoader />
              ) : historyQuery.isError ? (
                <p style={subtitleStyle}>Не удалось загрузить историю: {historyQuery.error?.message}</p>
              ) : (
                <ul style={historyListStyle}>
                  {historyQuery.data?.map((event) => (
                    <li key={event.id} style={historyItemStyle}>
                      <span style={summaryLabelStyle}>{formatDate(event.createdAt)}</span>
                      <span style={{ fontFamily: typography.accentFamily, fontSize: 14 }}>
                        {event.eventType}
                      </span>
                      {event.payload ? (
                        <pre
                          style={{
                            margin: 0,
                            background: palette.surface,
                            borderRadius: 12,
                            padding: 12,
                            fontSize: 12,
                            maxHeight: 180,
                            overflow: 'auto'
                          }}
                        >
                          {JSON.stringify(event.payload, null, 2)}
                        </pre>
                      ) : null}
                    </li>
                  ))}
                  {historyQuery.data && historyQuery.data.length === 0 ? (
                    <li style={subtitleStyle}>История событий пока пустая.</li>
                  ) : null}
                </ul>
              )}
            </div>
          ) : null}
        </section>

        <aside style={columnStyle}>
          <div style={cardStyle}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <h2 style={{ ...titleStyle, fontSize: 20 }}>Клиенты</h2>
              <p style={subtitleStyle}>Последние компании из CRM. Выберите карточку, чтобы познакомиться с деталями.</p>
            </div>

            <ul style={{ ...historyListStyle, gap: 12 }}>
              {customersQuery.data?.map((customer) => (
                <li key={customer.id} style={historyItemStyle}>
                  <strong style={{ fontFamily: typography.fontFamily, fontSize: 16 }}>{customer.name}</strong>
                  <span style={subtitleStyle}>ИНН {customer.inn || '—'} · КПП {customer.kpp || '—'}</span>
                  <span style={summaryLabelStyle}>{formatDate(customer.createdAt)}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
};

const DealsPage = () => (
  <PermissionGuard permissions={[{ resource: 'crm.deal', action: 'read' }]}>
    <DealsPageContent />
  </PermissionGuard>
);

export default DealsPage;
