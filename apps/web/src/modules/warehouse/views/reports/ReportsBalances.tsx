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

const formatPeriod = (value: string) =>
  new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(new Date(value));

export const ReportsBalances = () => {
  const conversionQuery = useAnalyticsConversionQuery();

  const rows = useMemo(() => conversionQuery.data ?? [], [conversionQuery.data]);
  const summary = useMemo(() => {
    if (!rows.length) {
      return [];
    }
    const totalDeals = rows.reduce((acc, row) => acc + row.totalCount, 0);
    const totalWon = rows.reduce((acc, row) => acc + row.wonCount, 0);
    const totalAmount = rows.reduce((acc, row) => acc + row.totalAmount, 0);
    const wonAmount = rows.reduce((acc, row) => acc + row.wonAmount, 0);

    return [
      { label: 'Всего сделок', value: totalDeals.toLocaleString('ru-RU') },
      { label: 'Выигранных', value: totalWon.toLocaleString('ru-RU') },
      { label: 'Оборот', value: formatCurrency(totalAmount) },
      { label: 'Выигранный оборот', value: formatCurrency(wonAmount) }
    ];
  }, [rows]);

  const columns = useMemo<WarehouseColumn<AnalyticsConversionRow>[]>(
    () => [
      {
        id: 'period',
        label: 'Период',
        render: (row) => formatPeriod(row.period)
      },
      {
        id: 'totalCount',
        label: 'Сделок всего',
        align: 'right',
        render: (row) => row.totalCount.toLocaleString('ru-RU')
      },
      {
        id: 'wonCount',
        label: 'Выиграно',
        align: 'right',
        render: (row) => row.wonCount.toLocaleString('ru-RU')
      },
      {
        id: 'totalAmount',
        label: 'Оборот',
        align: 'right',
        render: (row) => formatCurrency(row.totalAmount)
      },
      {
        id: 'wonAmount',
        label: 'Выигранный оборот',
        align: 'right',
        render: (row) => formatCurrency(row.wonAmount)
      },
      {
        id: 'conversion',
        label: 'Конверсия',
        align: 'right',
        render: (row) => `${(row.conversionRate * 100).toFixed(1)}%`
      }
    ],
    []
  );

  const status = conversionQuery.isLoading ? 'Загрузка…' : `Периодов: ${rows.length}`;

  return (
    <WarehouseShell
      title='Остатки и движения'
      menu={warehouseMenu}
      activePath='/warehouse/reports/kpis'
      status={status}
    >
      <div className='warehouse-report__section'>
        {conversionQuery.isLoading ? (
          <PageLoader />
        ) : conversionQuery.isError ? (
          <QueryErrorState message={`Не удалось загрузить отчёт: ${conversionQuery.error?.message ?? 'неизвестная ошибка'}`} />
        ) : rows.length === 0 ? (
          <EmptyState message='Нет данных для отображения отчёта.' />
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
              rows={rows}
              primaryKey={(row) => row.period}
              emptyMessage='Нет данных за выбранный период'
            />
          </>
        )}
      </div>
    </WarehouseShell>
  );
};

export default ReportsBalances;
