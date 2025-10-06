import { useMemo, useState } from 'react';

import {
  type StockMovement,
  useStockHistory
} from '@shared/api';
import { PageLoader } from '@shared/ui/PageLoader';

import { WarehouseShell } from '../../../layout/WarehouseShell';
import { ListForm } from '../../../layout/ListForm/ListForm';
import type { WarehouseColumn } from '../../../layout/types';
import { warehouseMenu } from '../../../menu/warehouse.menu';
import { EmptyState, QueryErrorState } from '../../components/QueryState';
import { fallbackMovements } from '../fallbacks';
import { formatDateTime, normalizeSearch, shouldUseFallback } from '../utils';

type StatusRow = {
  code: StockMovement['type'];
  name: string;
  operations: number;
  lastOccurredAt: string;
  sampleItem?: string;
};

const typeLabels: Record<StockMovement['type'], string> = {
  RECEIPT: 'Приёмка',
  MOVE: 'Перемещение',
  ISSUE: 'Списание/отгрузка',
  ADJUST: 'Корректировка',
  COUNT: 'Инвентаризация',
  RESERVE: 'Резервирование',
  UNRESERVE: 'Снятие резерва'
};

const aggregateStatuses = (history: StockMovement[]): StatusRow[] => {
  const map = new Map<StockMovement['type'], StatusRow>();
  history.forEach((movement) => {
    const existing = map.get(movement.type);
    if (!existing) {
      map.set(movement.type, {
        code: movement.type,
        name: typeLabels[movement.type] ?? movement.type,
        operations: 1,
        lastOccurredAt: movement.occurredAt,
        sampleItem: movement.itemName
      });
      return;
    }
    existing.operations += 1;
    if (new Date(movement.occurredAt).getTime() > new Date(existing.lastOccurredAt).getTime()) {
      existing.lastOccurredAt = movement.occurredAt;
      existing.sampleItem = movement.itemName;
    }
  });
  return Array.from(map.values()).sort((a, b) => b.operations - a.operations);
};

export const OperationStatusesList = () => {
  const historyQuery = useStockHistory();
  const [search, setSearch] = useState('');

  const useFallback = shouldUseFallback(historyQuery.error);

  const statuses = useMemo(() => {
    if (historyQuery.data) {
      return aggregateStatuses(historyQuery.data);
    }
    if (useFallback) {
      return aggregateStatuses(fallbackMovements);
    }
    return [];
  }, [historyQuery.data, useFallback]);

  const filtered = useMemo(() => {
    const needle = normalizeSearch(search);
    return statuses.filter((status) => {
      if (!needle) {
        return true;
      }
      return (
        normalizeSearch(status.code).includes(needle) ||
        normalizeSearch(status.name).includes(needle) ||
        (status.sampleItem ? normalizeSearch(status.sampleItem).includes(needle) : false)
      );
    });
  }, [statuses, search]);

  const columns: WarehouseColumn<StatusRow>[] = useMemo(
    () => [
      {
        id: 'code',
        label: 'Код',
        render: (row) => <code>{row.code}</code>
      },
      {
        id: 'name',
        label: 'Описание',
        render: (row) => row.name
      },
      {
        id: 'operations',
        label: 'Выполнено операций',
        align: 'right',
        render: (row) => row.operations
      },
      {
        id: 'updated',
        label: 'Последнее выполнение',
        render: (row) => formatDateTime(row.lastOccurredAt)
      },
      {
        id: 'sample',
        label: 'Пример номенклатуры',
        render: (row) => row.sampleItem ?? '—'
      }
    ],
    []
  );

  const renderFilters = () => (
    <div className='filters-panel'>
      <label>
        <span>Поиск</span>
        <input
          type='search'
          placeholder='Код или описание статуса'
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>
    </div>
  );

  return (
    <WarehouseShell
      title='Типы операций'
      menu={warehouseMenu}
      activePath='/warehouse/masters/op-statuses'
      status={historyQuery.isLoading ? 'Загрузка…' : `Типов: ${filtered.length}`}
      renderFilters={renderFilters}
      headerActions={
        <button type='button' className='warehouse-shell__secondary-action' onClick={() => historyQuery.refetch()}>
          Обновить
        </button>
      }
    >
      {historyQuery.isLoading ? (
        <PageLoader />
      ) : historyQuery.isError && !useFallback ? (
        <QueryErrorState message={`Не удалось загрузить историю движений: ${historyQuery.error?.message ?? 'неизвестная ошибка'}`} />
      ) : filtered.length === 0 ? (
        <EmptyState message={search ? 'Совпадений не найдено' : 'Операции склада пока не зарегистрированы'} />
      ) : (
        <ListForm
          columns={columns}
          rows={filtered}
          primaryKey={(row) => row.code}
          emptyMessage='Операции склада пока не зарегистрированы'
        />
      )}
    </WarehouseShell>
  );
};

export default OperationStatusesList;
