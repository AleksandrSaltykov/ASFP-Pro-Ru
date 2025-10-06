import { useState } from 'react';

import type { WarehouseFilter } from '../types';
import '../../styles/warehouse.css';

export type FiltersPanelProps = {
  filters: WarehouseFilter[];
  onChange?: (filterId: string, value: string | boolean | [string, string]) => void;
};

export const FiltersPanel = ({ filters, onChange }: FiltersPanelProps) => {
  const [values, setValues] = useState<Record<string, unknown>>({});

  const handleChange = (id: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [id]: value }));
    if (onChange) {
      onChange(id, value as string | boolean | [string, string]);
    }
  };

  return (
    <section className='filters-panel'>
      {filters.map((filter) => {
        if (filter.type === 'checkbox') {
          const checked = Boolean(values[filter.id]);
          return (
            <label key={filter.id}>
              <span>{filter.label}</span>
              <input
                type='checkbox'
                checked={checked}
                onChange={(event) => handleChange(filter.id, event.target.checked)}
              />
            </label>
          );
        }
        if (filter.type === 'search') {
          return (
            <label key={filter.id}>
              <span>{filter.label}</span>
              <input
                type='search'
                placeholder={filter.placeholder}
                onChange={(event) => handleChange(filter.id, event.target.value)}
              />
            </label>
          );
        }
        if (filter.type === 'daterange') {
          const startId = `${filter.id}-start`;
          const endId = `${filter.id}-end`;
          return (
            <div key={filter.id} className='filters-panel__group'>
              <span>{filter.label}</span>
              <div className='filters-panel__inline'>
                <input type='date' onChange={(event) => handleChange(startId, event.target.value)} />
                <input type='date' onChange={(event) => handleChange(endId, event.target.value)} />
              </div>
            </div>
          );
        }
        return (
          <label key={filter.id}>
            <span>{filter.label}</span>
            <select onChange={(event) => handleChange(filter.id, event.target.value)}>
              <option value=''>Все</option>
              {filter.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        );
      })}
    </section>
  );
};
