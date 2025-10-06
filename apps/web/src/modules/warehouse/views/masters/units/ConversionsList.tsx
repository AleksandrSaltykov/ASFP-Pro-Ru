import { useEffect, useMemo, useState } from 'react';

import {
  type CatalogLink,
  type CatalogNode,
  useCatalogLinksQuery,
  useCatalogNodesQuery
} from '@shared/api';
import { PageLoader } from '@shared/ui/PageLoader';

import { WarehouseShell } from '../../../layout/WarehouseShell';
import { ListForm } from '../../../layout/ListForm/ListForm';
import type { WarehouseColumn } from '../../../layout/types';
import { warehouseMenu } from '../../../menu/warehouse.menu';
import { masterCommands } from '../commands';
import { EmptyState, QueryErrorState } from '../../components/QueryState';
import { fallbackConversionLinks, fallbackUnits } from '../fallbacks';
import { formatBoolean, shouldUseFallback } from '../utils';

const extractRatio = (metadata?: Record<string, unknown>) => {
  if (!metadata) {
    return '—';
  }
  const possibleKeys = ['ratio', 'coefficient', 'factor', 'value'];
  for (const key of possibleKeys) {
    const value = metadata[key];
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }
  return JSON.stringify(metadata);
};

export const ConversionsList = () => {
  const unitsQuery = useCatalogNodesQuery('unit');
  const useUnitsFallback = shouldUseFallback(unitsQuery.error);
  const units = useMemo(() => {
    if (unitsQuery.data) {
      return unitsQuery.data;
    }
    if (useUnitsFallback) {
      return fallbackUnits;
    }
    return [];
  }, [unitsQuery.data, useUnitsFallback]);

  const [selectedUnitId, setSelectedUnitId] = useState<string | undefined>();

  useEffect(() => {
    if (!selectedUnitId && units.length > 0) {
      setSelectedUnitId(units[0].id);
    }
  }, [units, selectedUnitId]);

  const linksQuery = useCatalogLinksQuery('unit', selectedUnitId);
  const useLinksFallback = shouldUseFallback(linksQuery.error);
  const links = useMemo(() => {
    if (linksQuery.data) {
      return linksQuery.data;
    }
    if (useLinksFallback) {
      return fallbackConversionLinks.filter((link) => link.leftId === selectedUnitId);
    }
    return [];
  }, [linksQuery.data, useLinksFallback, selectedUnitId]);

  const unitsMap = useMemo(() => {
    const map = new Map<string, CatalogNode>();
    units.forEach((unit) => map.set(unit.id, unit));
    return map;
  }, [units]);

  const rows = useMemo(() => {
    return links.map((link) => {
      const target = unitsMap.get(link.rightId);
      return {
        link,
        target
      };
    });
  }, [links, unitsMap]);

  const columns: WarehouseColumn<{ link: CatalogLink; target?: CatalogNode }>[] = useMemo(
    () => [
      {
        id: 'relation',
        label: 'Связь',
        render: (row) => row.link.relationCode || '—'
      },
      {
        id: 'target',
        label: 'Единица назначения',
        render: (row) => (row.target ? `${row.target.name} (${row.target.code})` : row.link.rightId)
      },
      {
        id: 'ratio',
        label: 'Коэффициент',
        align: 'center',
        render: (row) => extractRatio(row.link.metadata)
      },
      {
        id: 'metadata',
        label: 'Дополнительно',
        render: (row) => {
          if (!row.link.metadata || Object.keys(row.link.metadata).length === 0) {
            return '—';
          }
          return (
            <pre className='warehouse-preformatted'>{JSON.stringify(row.link.metadata, null, 2)}</pre>
          );
        }
      }
    ],
    []
  );

  const renderFilters = () => (
    <div className='filters-panel'>
      <label>
        <span>Базовая единица</span>
        <select
          value={selectedUnitId ?? ''}
          onChange={(event) => setSelectedUnitId(event.target.value || undefined)}
          disabled={unitsQuery.isLoading || units.length === 0}
        >
          {units.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Активность базовой</span>
        <input type='text' disabled value={formatBoolean(unitsMap.get(selectedUnitId ?? '')?.isActive ?? false)} />
      </label>
    </div>
  );

  const isLoading = unitsQuery.isLoading || linksQuery.isLoading;
  const isError = (unitsQuery.isError && !useUnitsFallback) || (linksQuery.isError && !useLinksFallback);
  const errorMessage = unitsQuery.error?.message ?? linksQuery.error?.message ?? 'неизвестная ошибка';

  const commands = useMemo(
    () =>
      masterCommands.map((command) => {
        if (command.id === 'refresh' || command.id === 'export') {
          return command;
        }
        return { ...command, disabled: true };
      }),
    []
  );

  const handleConversionsCommand = (commandId: string) => {
    if (commandId === 'refresh') {
      unitsQuery.refetch();
      if (selectedUnitId) {
        linksQuery.refetch();
      }
      return;
    }
    if (commandId === 'export') {
      const payload = JSON.stringify(rows, null, 2);
      const blob = new Blob([payload], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `unit-conversions-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <WarehouseShell
      title='Пересчёты единиц'
      menu={warehouseMenu}
      activePath='/warehouse/masters/items/conversions'
      commands={commands}
      status={isLoading ? 'Загрузка…' : `Связей: ${rows.length}`}
      onCommand={handleConversionsCommand}
      renderFilters={renderFilters}
    >
      {isLoading ? (
        <PageLoader />
      ) : isError ? (
        <QueryErrorState message={`Не удалось загрузить пересчёты: ${errorMessage}`} />
      ) : rows.length === 0 ? (
        <EmptyState message='Для выбранной единицы пересчёты не настроены' />
      ) : (
        <ListForm
          columns={columns}
          rows={rows}
          primaryKey={(row) => `${row.link.leftId}:${row.link.rightId}:${row.link.relationCode}`}
          emptyMessage='Для выбранной единицы пересчёты не настроены'
        />
      )}
    </WarehouseShell>
  );
};

export default ConversionsList;
