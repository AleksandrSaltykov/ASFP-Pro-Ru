import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { WarehouseShell } from '../../layout/WarehouseShell';
import { ListForm } from '../../layout/ListForm/ListForm';
import type { WarehouseColumn, WarehouseFilter } from '../../layout/types';
import { warehouseMenu } from '../../menu/warehouse.menu';
import {
  createInterWarehouseMove,
  deleteInterWarehouseMove,
  fetchInterWarehouseMoves,
  type CreateInterWarehouseMovePayload,
  type InterWarehouseMoveRow
} from '../../services/moves.service';
import { iconMap } from '@shared/ui/icons';
import { InterWarehouseMoveDrawer } from './components/InterWarehouseMoveDrawer';

type MoveStatus = InterWarehouseMoveRow['status'];

const statusLabelMap: Record<MoveStatus, string> = {
  PLANNED: 'Запланировано',
  IN_TRANSIT: 'В пути',
  COMPLETED: 'Завершено',
  CANCELLED: 'Отменено'
};

const statusTone: Record<MoveStatus, { background: string; border: string; color: string }> = {
  PLANNED: {
    background: 'var(--wh-info-surface)',
    border: 'var(--wh-info-border)',
    color: 'var(--wh-text-strong)'
  },
  IN_TRANSIT: {
    background: 'rgba(243, 156, 18, 0.18)',
    border: 'rgba(230, 126, 34, 0.3)',
    color: '#8c4a05'
  },
  COMPLETED: {
    background: 'rgba(46, 204, 113, 0.18)',
    border: 'rgba(39, 174, 96, 0.35)',
    color: '#1f5c38'
  },
  CANCELLED: {
    background: 'var(--wh-danger-surface)',
    border: 'var(--wh-danger-border)',
    color: 'var(--wh-danger-text)'
  }
};

const StatusPill = ({ status }: { status: MoveStatus }) => {
  const tone = statusTone[status];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4px 12px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.02em',
        background: tone.background,
        border: `1px solid ${tone.border}`,
        color: tone.color,
        minWidth: 102
      }}
    >
      {statusLabelMap[status]}
    </span>
  );
};

const formatDateTime = (value?: string) => {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return `${date.toLocaleDateString('ru-RU')} ${date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  })}`;
};

const formatLocationTrail = (warehouse: string) => warehouse;

const buildFilters = (rows: InterWarehouseMoveRow[]): WarehouseFilter[] => {
  const unique = (selector: (row: InterWarehouseMoveRow) => string | undefined) =>
    Array.from(
      new Set(
        rows
          .map(selector)
          .filter((value): value is string => Boolean(value && value.trim()))
      )
    ).map((value) => ({ value, label: value }));

  return [
    { id: 'status', label: 'Статус', type: 'select', options: unique((row) => statusLabelMap[row.status]) },
    { id: 'from', label: 'Источник', type: 'select', options: unique((row) => row.source.warehouse) },
    { id: 'to', label: 'Получатель', type: 'select', options: unique((row) => row.destination.warehouse) },
    { id: 'search', label: 'Поиск', type: 'search', placeholder: 'Документ, SKU или примечание' }
  ];
};

export const InterWarehouseMovesJournal = () => {
  const [rows, setRows] = useState<InterWarehouseMoveRow[]>([]);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const navigate = useNavigate();

  const loadRows = useCallback(async () => {
    const data = await fetchInterWarehouseMoves();
    setRows(data);
  }, []);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const handleCreateClick = useCallback(() => {
    setCreateError(null);
    setCreateDrawerOpen(true);
  }, []);

  const handleDrawerClose = useCallback(() => {
    if (isSubmitting) {
      return;
    }
    setCreateDrawerOpen(false);
    setCreateError(null);
  }, [isSubmitting]);

  const handleCreateSubmit = useCallback(
    async (payload: CreateInterWarehouseMovePayload) => {
      setIsSubmitting(true);
      setCreateError(null);
      try {
        const created = await createInterWarehouseMove(payload);
        setRows((prev) => [created, ...prev]);
        setCreateDrawerOpen(false);
      } catch (error) {
        setCreateError((error as Error).message || 'Не удалось создать перемещение.');
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  const filters = useMemo(() => buildFilters(rows), [rows]);

  const statusSummary = useMemo(() => {
    return rows.reduce<Record<MoveStatus, number>>(
      (acc, row) => {
        acc[row.status] = (acc[row.status] ?? 0) + 1;
        return acc;
      },
      {
        PLANNED: 0,
        IN_TRANSIT: 0,
        COMPLETED: 0,
        CANCELLED: 0
      }
    );
  }, [rows]);

  const footerStatus = useMemo(() => {
    const parts = [
      `Всего: ${rows.length}`,
      statusSummary.PLANNED ? `План: ${statusSummary.PLANNED}` : null,
      statusSummary.IN_TRANSIT ? `В пути: ${statusSummary.IN_TRANSIT}` : null,
      statusSummary.COMPLETED ? `Завершено: ${statusSummary.COMPLETED}` : null,
      statusSummary.CANCELLED ? `Отменено: ${statusSummary.CANCELLED}` : null
    ].filter(Boolean);
    return parts.join(' • ');
  }, [rows.length, statusSummary]);

  const handleDeleteClick = useCallback(
    async (row: InterWarehouseMoveRow) => {
      const confirmed =
        typeof window === 'undefined'
          ? true
          : window.confirm(`Удалить перемещение ${row.code}?`);
      if (!confirmed) {
        return;
      }
      await deleteInterWarehouseMove(row.id);
      setRows((prev) => prev.filter((item) => item.id !== row.id));
    },
    []
  );
  const columns: WarehouseColumn<InterWarehouseMoveRow>[] = useMemo(
    () => [
      {
        id: 'document',
        label: 'Документ',
        render: (row) => (
          <div className='list-form__value'>
            <span className='list-form__title list-form__title--strong'>{row.code}</span>
            <span className='list-form__meta'>Создано: {formatDateTime(row.createdAt)}</span>
            <span className='list-form__meta'>
              Отгрузка: {formatDateTime(row.shippedAt ?? row.scheduledDispatch) ?? '—'}
            </span>
            {row.reference ? (
              <span className='list-form__meta'>Связь: {row.reference}</span>
            ) : null}
            {row.transport ? <span className='list-form__meta'>{row.transport}</span> : null}
          </div>
        )
      },
      {
        id: 'route',
        label: 'Маршрут',
        render: (row) => (
          <div className='list-form__value'>
            <span className='list-form__title'>
              <Link to={`/warehouse/masters/locations/warehouses?warehouse=${row.source.warehouse}`}>
                {row.source.warehouse}
              </Link>
              {' → '}
              <Link to={`/warehouse/masters/locations/warehouses?warehouse=${row.destination.warehouse}`}>
                {row.destination.warehouse}
              </Link>
            </span>
            <span className='list-form__meta'>
              {formatLocationTrail(row.source.warehouse)}
              {' → '}
              {formatLocationTrail(row.destination.warehouse)}
            </span>
          </div>
        )
      },
      {
        id: 'items',
        label: 'Номенклатура',
        render: (row) => {
          const [firstLine, ...rest] = row.lines;
          const restCount = rest.length;
          const totalQty = row.lines.reduce((acc, line) => acc + line.quantity, 0);

          return (
            <div className='list-form__value'>
              <span className='list-form__title'>{firstLine?.name ?? '—'}</span>
              <span className='list-form__meta'>
                {firstLine ? `${firstLine.quantity.toLocaleString('ru-RU')} ${firstLine.uom} • ${firstLine.sku}` : 'Нет строк'}
              </span>
              {restCount > 0 ? (
                <span className='list-form__meta-inline'>
                  + ещё {restCount} поз. / всего {totalQty.toLocaleString('ru-RU')} {firstLine?.uom ?? 'шт'}
                </span>
              ) : null}
            </div>
          );
        }
      },
      {
        id: 'status',
        label: 'Статус',
        align: 'center',
        render: (row) => (
          <div className='list-form__value' style={{ alignItems: 'center', gap: 6, textAlign: 'center' }}>
            <StatusPill status={row.status} />
            {row.completedAt ? (
              <span className='list-form__meta'>Закрыто: {formatDateTime(row.completedAt)}</span>
            ) : null}
            {!row.completedAt && row.note ? <span className='list-form__meta'>{row.note}</span> : null}
          </div>
        )
      },
      {
        id: 'links',
        label: 'Связанные разделы',
        render: (row) => (
          <div className='list-form__value' style={{ gap: 4 }}>
            {row.links.map((link) => (
              <Link key={`${row.id}-${link.label}`} to={link.path} className='list-form__meta-inline'>
                {link.label}
              </Link>
            ))}
            {row.note && row.completedAt ? <span className='list-form__meta'>{row.note}</span> : null}
          </div>
        )
      },
      {
        id: 'actions',
        label: '',
        align: 'center',
        render: (row) => (
          <div className='list-form__actions'>
            <button
              type='button'
              className='list-form__icon-button list-form__icon-button--edit'
              onClick={(event) => {
                event.stopPropagation();
                window.alert('Редактирование перемещений пока не реализовано.');
              }}
              title='Редактировать'
              aria-label={`Редактировать ${row.code}`}
            >
              <span className='list-form__icon'>{iconMap.gear}</span>
            </button>
            <button
              type='button'
              className='list-form__icon-button list-form__icon-button--delete'
              onClick={(event) => {
                event.stopPropagation();
                void handleDeleteClick(row);
              }}
              title='Удалить'
              aria-label={`Удалить ${row.code}`}
            >
              <span className='list-form__icon'>×</span>
            </button>
          </div>
        )
      }
    ],
    [handleDeleteClick]
  );

  const handleRowClick = useCallback(
    (row: InterWarehouseMoveRow) => {
      navigate(`/warehouse/stock/history?ref=${encodeURIComponent(row.code)}`);
    },
    [navigate]
  );

  return (
    <WarehouseShell
      title='Межскладовые перемещения'
      menu={warehouseMenu}
      activePath='/warehouse/moves/inter-warehouse'
      filters={filters}
      status={footerStatus}
      headerActions={
        <button type='button' className='warehouse-shell__primary-action' onClick={handleCreateClick}>
          Создать перемещение
        </button>
      }
    >
      <ListForm
        columns={columns}
        rows={rows}
        primaryKey={(row) => row.id}
        emptyMessage='Нет межскладовых перемещений по текущим условиям'
        onRowClick={handleRowClick}
      />
      <InterWarehouseMoveDrawer
        open={createDrawerOpen}
        isSubmitting={isSubmitting}
        error={createError}
        onSubmit={handleCreateSubmit}
        onClose={handleDrawerClose}
      />
    </WarehouseShell>
  );
};

export default InterWarehouseMovesJournal;
