import { useMemo } from 'react';

import {
  type AnalyticsConversionRow,
  useAnalyticsConversionQuery
} from '@shared/api/analytics';
import { PageLoader } from '@shared/ui/PageLoader';

import { WarehouseShell } from '../../../layout/WarehouseShell';
import { ListForm } from '../../../layout/ListForm/ListForm';
import type { WarehouseColumn } from '../../../layout/types';
import { warehouseMenu } from '../../../menu/warehouse.menu';
import { EmptyState, QueryErrorState } from '../../components/QueryState';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(value);

const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

const formatPeriod = (value: string) =>
  new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(new Date(value));

const formatDelta = (value: number) => {
  const formatted = formatCurrency(Math.abs(value));
  if (value === 0) {
    return '—';
  }
  return value > 0 ? `+${formatted}` : `-${formatted}`;
};

export const ReportsTurnover = () => {
  const conversionQuery = useAnalyticsConversionQuery();
  const rows = useMemo(() => conversionQuery.data ?? [], [conversionQuery.data]);

  const enrichedRows = useMemo(() => {
    if (rows.length === 0) {
      return [];
    }
    return rows.map((row, index) => {
      const previous = rows[index + 1];
      const turnoverDelta = previous ? row.totalAmount - previous.totalAmount : 0;
      const conversionDelta = previous ? row.conversionRate - previous.conversionRate : 0;
      return { ...row, turnoverDelta, conversionDelta };
    });
  }, [rows]);

  const summary = useMemo(() => {
    if (!rows.length) {
      return [];
    }
    const totalAmount = rows.reduce((acc, row) => acc + row.totalAmount, 0);
    const wonAmount = rows.reduce((acc, row) => acc + row.wonAmount, 0);
    const totalCount = rows.reduce((acc, row) => acc + row.totalCount, 0);
    const avgConversion = rows.reduce((acc, row) => acc + row.conversionRate, 0) / rows.length;
    const avgCheck = totalCount > 0 ? totalAmount / totalCount : 0;
    const maxTurnover = rows.reduce((max, row) => Math.max(max, row.totalAmount), 0);

    return [
      { label: 'Совокупный оборот', value: formatCurrency(totalAmount) },
      { label: 'Выигранный оборот', value: formatCurrency(wonAmount) },
      { label: 'Средняя конверсия', value: formatPercent(avgConversion) },
      { label: 'Средний чек', value: formatCurrency(avgCheck) },
      { label: 'Пик оборота', value: formatCurrency(maxTurnover) }
    ];
  }, [rows]);

  const columns = useMemo<WarehouseColumn<(AnalyticsConversionRow & { turnoverDelta: number; conversionDelta: number })>[]>(
    () => [
      {
        id: 'period',
        label: 'Период',
        render: (row) => formatPeriod(row.period)
      },
      {
        id: 'totalAmount',
        label: 'Оборот',
        align: 'right',
        render: (row) => formatCurrency(row.totalAmount)
      },
      {
        id: 'turnoverDelta',
        label: 'Δ к прошлому периоду',
        align: 'right',
        render: (row) => formatDelta(row.turnoverDelta)
      },
      {
        id: 'wonAmount',
        label: 'Выигранный оборот',
        align: 'right',
        render: (row) => formatCurrency(row.wonAmount)
      },
      {
        id: 'conversionRate',
        label: 'Конверсия',
        align: 'right',
        render: (row) => formatPercent(row.conversionRate)
      },
      {
        id: 'conversionDelta',
        label: 'Δ конверсии',
        align: 'right',
        render: (row) => {
          const percent = (row.conversionDelta * 100).toFixed(1);
          if (row.conversionDelta === 0) {
            return '—';
          }
          return row.conversionDelta > 0 ? `+${percent}%` : `${percent}%`;
        }
      }
    ],
    []
  );

  const status = conversionQuery.isLoading ? 'Загрузка…' : `Периодов: ${rows.length}`;

  return (
    <WarehouseShell
      title='Оборачиваемость и потери'
      menu={warehouseMenu}
      activePath='/warehouse/reports/turnover'
      status={status}
    >
      <div className='warehouse-report__section'>
        {conversionQuery.isLoading ? (
          <PageLoader />
        ) : conversionQuery.isError ? (
          <QueryErrorState message={`Не удалось загрузить показатели оборачиваемости: ${conversionQuery.error?.message ?? 'неизвестная ошибка'}`} />
        ) : enrichedRows.length === 0 ? (
          <EmptyState message='Нет данных по оборачиваемости.' />
        ) : (
          <>
            {summary.length ? (
              <div className='warehouse-report__grid'>
                {summary.map((item) => (
                  <div key={item.label} className='warehouse-report__card'>
                    <span className='warehouse-report__card-label'>{item.label}</span>
                    <span className='warehouse-report__card-value'>{item.value}</span>
                  </div>
                ))}
              </div>
            ) : null}
            <ListForm
              columns={columns}
              rows={enrichedRows}
              primaryKey={(row) => row.period}
              emptyMessage='Нет данных по оборачиваемости.'
            />
          </>
        )}
      </div>
    </WarehouseShell>
  );
};

export default ReportsTurnover;
