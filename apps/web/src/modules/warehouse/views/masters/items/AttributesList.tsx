import { useMemo, useState } from 'react';

import {
  type AttributeTemplate,
  useAttributeTemplatesQuery
} from '@shared/api';
import { PageLoader } from '@shared/ui/PageLoader';

import { WarehouseShell } from '../../../layout/WarehouseShell';
import { ListForm } from '../../../layout/ListForm/ListForm';
import type { WarehouseColumn } from '../../../layout/types';
import { warehouseMenu } from '../../../menu/warehouse.menu';
import { EmptyState, QueryErrorState } from '../../components/QueryState';
import { fallbackAttributeTemplates } from '../fallbacks';
import { formatBoolean, normalizeSearch, shouldUseFallback } from '../utils';

export const AttributesList = () => {
  const attributesQuery = useAttributeTemplatesQuery('item');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const useFallback = shouldUseFallback(attributesQuery.error);

  const templates = useMemo(() => {
    if (attributesQuery.data) {
      return attributesQuery.data;
    }
    if (useFallback) {
      return fallbackAttributeTemplates;
    }
    return [];
  }, [attributesQuery.data, useFallback]);

  const dataTypeOptions = useMemo(() => {
    return Array.from(new Set(templates.map((tpl) => tpl.dataType)))
      .filter((type): type is AttributeTemplate['dataType'] => Boolean(type))
      .map((type) => ({ value: type, label: type.toUpperCase() }));
  }, [templates]);

  const filtered = useMemo(() => {
    const needle = normalizeSearch(search);
    return templates.filter((template) => {
      if (typeFilter !== 'all' && template.dataType !== typeFilter) {
        return false;
      }
      if (!needle) {
        return true;
      }
      const description = template.description ? normalizeSearch(template.description) : '';
      return (
        normalizeSearch(template.name).includes(needle) ||
        normalizeSearch(template.code).includes(needle) ||
        description.includes(needle)
      );
    });
  }, [templates, search, typeFilter]);

  const columns: WarehouseColumn<AttributeTemplate>[] = useMemo(
    () => [
      {
        id: 'code',
        label: 'Код',
        render: (row) => <code>{row.code}</code>
      },
      {
        id: 'name',
        label: 'Наименование',
        render: (row) => (
          <div>
            <strong>{row.name}</strong>
            {row.description ? (
              <span className='list-form__meta'>{row.description}</span>
            ) : null}
          </div>
        )
      },
      {
        id: 'dataType',
        label: 'Тип данных',
        render: (row) => row.dataType.toUpperCase()
      },
      {
        id: 'isRequired',
        label: 'Обязательное',
        align: 'center',
        render: (row) => formatBoolean(row.isRequired)
      },
      {
        id: 'position',
        label: 'Позиция',
        align: 'right',
        render: (row) => row.position ?? '—'
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
          placeholder='Код или наименование атрибута'
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>
      <label>
        <span>Тип данных</span>
        <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
          <option value='all'>Все</option>
          {dataTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );

  return (
    <WarehouseShell
      title='Динамические атрибуты'
      menu={warehouseMenu}
      activePath='/warehouse/masters/items/attributes'
      status={attributesQuery.isLoading ? 'Загрузка…' : `Записей: ${filtered.length}`}
      renderFilters={renderFilters}
      commands={[]}
    >
      {attributesQuery.isLoading ? (
        <PageLoader />
      ) : attributesQuery.isError && !useFallback ? (
        <QueryErrorState message={`Не удалось загрузить атрибуты: ${attributesQuery.error?.message ?? 'неизвестная ошибка'}`} />
      ) : filtered.length === 0 ? (
        <EmptyState message={search || typeFilter !== 'all' ? 'Совпадений не найдено' : 'Справочник атрибутов пуст'} />
      ) : (
        <ListForm
          columns={columns}
          rows={filtered}
          primaryKey={(row) => row.id}
          emptyMessage='Справочник атрибутов пуст'
        />
      )}
    </WarehouseShell>
  );
};

export default AttributesList;
