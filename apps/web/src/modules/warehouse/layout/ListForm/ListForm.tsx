import '../../styles/warehouse.css';
import type { WarehouseListFormProps } from '../types';

export const ListForm = <T,>({ columns, rows, primaryKey, emptyMessage, getRowClassName, selectedKey, onRowClick }: WarehouseListFormProps<T>) => (
  <div className='list-form'>
    <table className='list-form__table'>
      <thead>
        <tr>
          {columns.map((column) => (
            <th
              key={column.id}
              className={['list-form__header-cell', column.align ? `list-form__cell--align-${column.align}` : undefined]
                .filter(Boolean)
                .join(' ')}
              style={column.width ? { width: column.width } : undefined}
            >
              {column.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length ? (
          rows.map((row) => (
            <tr
              key={primaryKey(row)}
              className={[getRowClassName?.(row), selectedKey && selectedKey === primaryKey(row) ? 'list-form__row--selected' : undefined]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onRowClick?.(row)}
              style={onRowClick ? { cursor: 'pointer' } : undefined}
            >
              {columns.map((column) => (
                <td
                  key={column.id}
                  className={['list-form__cell', column.align ? `list-form__cell--align-${column.align}` : undefined]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={columns.length} className='list-form__empty'>
              {emptyMessage ?? 'Нет данных для отображения'}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);
