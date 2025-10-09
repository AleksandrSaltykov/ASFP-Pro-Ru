import { useMemo } from 'react';

import {
  type AnalyticsManagerLoadRow,
  useAnalyticsManagerLoadQuery
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

export const ReportsKpiPicking = () => {
  const managerLoadQuery = useAnalyticsManagerLoadQuery();
  const rows = useMemo(() => managerLoadQuery.data ?? [], [managerLoadQuery.data]);

  const totalDeals = useMemo(() => rows.reduce((acc, row) => acc + row.totalCount, 0), [rows]);
  const totalAmount = useMemo(() => rows.reduce((acc, row) => acc + row.totalAmount, 0), [rows]);

  const enrichedRows = useMemo(
    () =>
      rows.map((row) => ({
        ...row,
        share: totalDeals > 0 ? row.totalCount / totalDeals : 0,
        avgAmount: row.totalCount > 0 ? row.totalAmount / row.totalCount : 0
      })),
    [rows, totalDeals]
  );

  const summary = useMemo(() => {
    if (!rows.length) {
      return [];
    }
    const avgLoad = totalDeals / rows.length;
    const topManager = rows.reduce(
      (top, row) => (row.totalCount > top.totalCount ? row : top),
      rows[0]
    );

    return [
      { label: 'Всего сделок', value: totalDeals.toLocaleString('ru-RU') },
      { label: 'Оборот', value: formatCurrency(totalAmount) },
      { label: 'Средняя нагрузка', value: `${avgLoad.toFixed(1)} сделок` },
      { label: 'Лидер по сделкам', value: `${topManager.manager}: ${topManager.totalCount}` }
    ];
  }, [rows, totalDeals, totalAmount]);

  const columns = useMemo<WarehouseColumn<(AnalyticsManagerLoadRow & { share: number; avgAmount: number })>[]>(
    () => [
      {
        id: 'manager',
        label: 'Менеджер',
        render: (row) => row.manager || '—'
      },
      {
        id: 'totalCount',
        label: 'Сделок',
        align: 'right',
        render: (row) => row.totalCount.toLocaleString('ru-RU')
      },
      {
        id: 'totalAmount',
        label: 'Оборот',
        align: 'right',
        render: (row) => formatCurrency(row.totalAmount)
      },
      {
        id: 'avgAmount',
        label: 'Средний чек',
        align: 'right',
        render: (row) => formatCurrency(row.avgAmount)
      },
      {
        id: 'share',
        label: 'Доля сделок',
        align: 'right',
        render: (row) => formatPercent(row.share)
      }
    ],
    []
  );

  const status = managerLoadQuery.isLoading ? 'Загрузка…' : `Менеджеров: ${rows.length}`;

  return (
    <WarehouseShell
      title='KPI отбора'
      menu={warehouseMenu}
      activePath='/warehouse/reports/load'
      status={status}
    >
      <div className='warehouse-report__section'>
        {managerLoadQuery.isLoading ? (
          <PageLoader />
        ) : managerLoadQuery.isError ? (
          <QueryErrorState message={`Не удалось загрузить KPI отбора: ${managerLoadQuery.error?.message ?? 'неизвестная ошибка'}`} />
        ) : enrichedRows.length === 0 ? (
          <EmptyState message='Нет данных по загрузке менеджеров.' />
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
              primaryKey={(row) => row.manager || 'unknown'}
              emptyMessage='Нет данных по загрузке менеджеров.'
            />
          </>
        )}
      </div>
    </WarehouseShell>
  );
};

export default ReportsKpiPicking;
