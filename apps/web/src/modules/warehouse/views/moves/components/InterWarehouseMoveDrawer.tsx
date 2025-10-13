import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties
} from 'react';

import SlideOver from '@pages/warehouse/components/SlideOver';
import {
  type CreateInterWarehouseMovePayload,
  generateInterWarehouseMoveCode
} from '../../../services/moves.service';
import {
  type Item,
  type Warehouse,
  useItemsQuery,
  useWarehousesQuery
} from '@shared/api';
import { palette } from '@shared/ui/theme';
import { normalizeSearch, shouldUseFallback } from '../../masters/utils';
import { fallbackItems, fallbackWarehouses } from '../../masters/fallbacks';
import '../../../styles/warehouse.css';

type UnitOption = {
  id: string;
  label: string;
};

type LineState = {
  id: string;
  itemId: string;
  itemName: string;
  sku: string;
  unitId: string;
  unitOptions: UnitOption[];
  quantity: string;
};

type FormState = {
  code: string;
  dispatchAt: string;
  sourceWarehouse: string;
  destinationWarehouse: string;
  note: string;
  lines: LineState[];
};

const createLine = (): LineState => ({
  id: `line-${Math.random().toString(36).slice(2, 10)}`,
  itemId: '',
  itemName: '',
  sku: '',
  unitId: '',
  unitOptions: [],
  quantity: ''
});

const toDateTimeLocal = (date: Date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const buildInitialState = (): FormState => ({
  code: generateInterWarehouseMoveCode(),
  dispatchAt: toDateTimeLocal(new Date()),
  sourceWarehouse: '',
  destinationWarehouse: '',
  note: '',
  lines: [createLine()]
});

const addUnitOption = (options: UnitOption[], id?: string | null, label?: string | null) => {
  if (!id) {
    return;
  }
  if (!options.some((option) => option.id === id)) {
    options.push({
      id,
      label: (label?.trim() || id) as string
    });
  }
};

const buildUnitOptions = (item: Item | undefined, previous?: { unitId: string; unitOptions: UnitOption[] }) => {
  const options: UnitOption[] = [];

  if (item) {
    addUnitOption(options, item.unitId ?? undefined, item.unit?.name ?? item.unit?.code ?? null);
    addUnitOption(
      options,
      item.alternativeUnitId ?? undefined,
      item.alternativeUnit?.name ?? item.alternativeUnit?.code ?? null
    );
  }

  if (!options.length && previous) {
    previous.unitOptions.forEach((option) => addUnitOption(options, option.id, option.label));
  }

  return options;
};

const tableWrapperStyle: CSSProperties = {
  overflowX: 'auto'
};

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  minWidth: 600
};

const headCellStyle: CSSProperties = {
  textAlign: 'left',
  padding: '12px 16px',
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: palette.textSecondary,
  background: 'rgba(15, 39, 79, 0.05)'
};

const cellStyle: CSSProperties = {
  padding: '10px 16px',
  borderTop: '1px solid rgba(15, 39, 79, 0.08)',
  verticalAlign: 'middle'
};

const tableInputStyle: CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: 10,
  border: `1px solid ${palette.border}`,
  fontSize: 14,
  fontFamily: 'inherit'
};

const tableNumberInputStyle: CSSProperties = {
  ...tableInputStyle,
  textAlign: 'right'
};

const tableSelectStyle: CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: 10,
  border: `1px solid ${palette.border}`,
  fontSize: 14,
  fontFamily: 'inherit'
};

const suggestionWrapperStyle: CSSProperties = {
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  gap: 6
};

const suggestionContainerStyle: CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 4px)',
  left: 0,
  right: 0,
  zIndex: 30,
  borderRadius: 12,
  border: `1px solid ${palette.border}`,
  boxShadow: '0 14px 32px rgba(15, 39, 79, 0.18)',
  background: '#ffffff',
  overflow: 'hidden'
};

const suggestionOptionStyle: CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  border: 'none',
  background: 'transparent',
  textAlign: 'left',
  fontSize: 14,
  cursor: 'pointer'
};

const suggestionEmptyStyle: CSSProperties = {
  display: 'block',
  padding: '12px 14px',
  color: palette.textSecondary,
  fontSize: 13
};

type InterWarehouseMoveDrawerProps = {
  open: boolean;
  isSubmitting: boolean;
  error?: string | null;
  onSubmit: (payload: CreateInterWarehouseMovePayload) => Promise<void>;
  onClose: () => void;
};

export const InterWarehouseMoveDrawer = ({
  open,
  isSubmitting,
  error,
  onSubmit,
  onClose
}: InterWarehouseMoveDrawerProps) => {
  const [state, setState] = useState<FormState>(() => buildInitialState());
  const [localError, setLocalError] = useState<string | null>(null);
  const [activeLineId, setActiveLineId] = useState<string | null>(null);
  const suggestionCloseTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const warehousesQuery = useWarehousesQuery();
  const itemsQuery = useItemsQuery();

  const useWarehousesFallback = shouldUseFallback(warehousesQuery.error);
  const useItemsFallback = shouldUseFallback(itemsQuery.error);

  const warehouses: Warehouse[] = useWarehousesFallback
    ? fallbackWarehouses
    : warehousesQuery.data ?? [];
  const items: Item[] = useItemsFallback ? fallbackItems : itemsQuery.data ?? [];

  const isWarehousesLoading = warehousesQuery.isLoading && !warehouses.length;
  const isItemsLoading = itemsQuery.isLoading && !items.length;

  useEffect(() => {
    if (open) {
      setState(buildInitialState());
      setLocalError(null);
      setActiveLineId(null);
    }
  }, [open]);

  const handleFieldChange = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = event.target;
      setState((prev) => ({
        ...prev,
        [name]: value
      }));
      setLocalError(null);
    },
    []
  );

  const warehouseOptions = useMemo(() => {
    const options = warehouses.map((warehouse) => ({
      value: warehouse.id,
      label: warehouse.name || warehouse.code || warehouse.id
    }));
    const ensureOption = (value: string) => {
      if (!value) {
        return;
      }
      if (!options.some((option) => option.value === value)) {
        options.push({
          value,
          label: value
        });
      }
    };
    ensureOption(state.sourceWarehouse);
    ensureOption(state.destinationWarehouse);
    return options;
  }, [warehouses, state.sourceWarehouse, state.destinationWarehouse]);

  const findItemSuggestions = useCallback(
    (query: string) => {
      const normalized = normalizeSearch(query);
      if (!normalized) {
        return items.slice(0, 8);
      }
      return items
        .filter((item) => {
          const name = normalizeSearch(item.name);
          const sku = normalizeSearch(item.sku ?? '');
          return name.includes(normalized) || sku.includes(normalized);
        })
        .slice(0, 8);
    },
    [items]
  );

  const cancelSuggestionsClose = useCallback(() => {
    if (suggestionCloseTimeout.current) {
      clearTimeout(suggestionCloseTimeout.current);
      suggestionCloseTimeout.current = null;
    }
  }, []);

  const openSuggestions = useCallback(
    (lineId: string) => {
      cancelSuggestionsClose();
      setActiveLineId(lineId);
    },
    [cancelSuggestionsClose]
  );

  const scheduleSuggestionsClose = useCallback(() => {
    cancelSuggestionsClose();
    suggestionCloseTimeout.current = setTimeout(() => {
      setActiveLineId(null);
      suggestionCloseTimeout.current = null;
    }, 150);
  }, [cancelSuggestionsClose]);

  useEffect(
    () => () => {
      if (suggestionCloseTimeout.current) {
        clearTimeout(suggestionCloseTimeout.current);
        suggestionCloseTimeout.current = null;
      }
    },
    []
  );

  useEffect(() => {
    if (!items.length) {
      return;
    }
    setState((prev) => {
      let changed = false;
      const nextLines = prev.lines.map((line) => {
        const item = items.find((candidate) => candidate.id === line.itemId);
        if (!item) {
          return line;
        }
        const unitOptions = buildUnitOptions(item, line);
        const nextUnitId =
          line.unitId && unitOptions.some((option) => option.id === line.unitId)
            ? line.unitId
            : unitOptions[0]?.id ?? '';
        const sameOptions =
          unitOptions.length === line.unitOptions.length &&
          unitOptions.every((option, index) => option.id === line.unitOptions[index]?.id);
        if (nextUnitId === line.unitId && sameOptions) {
          return line;
        }
        changed = true;
        return {
          ...line,
          unitId: nextUnitId,
          unitOptions
        };
      });
      return changed ? { ...prev, lines: nextLines } : prev;
    });
  }, [items]);

  const handleWarehouseSelect = useCallback(
    (field: 'sourceWarehouse' | 'destinationWarehouse') =>
      (event: ChangeEvent<HTMLSelectElement>) => {
        const { value } = event.target;
        setState((prev) => ({ ...prev, [field]: value }));
        setLocalError(null);
      },
    []
  );

  const handleItemNameChange = useCallback(
    (lineId: string) => (event: ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      setState((prev) => ({
        ...prev,
        lines: prev.lines.map((line) =>
          line.id === lineId
            ? {
                ...line,
                itemName: value,
                itemId: '',
                sku: '',
                unitId: '',
                unitOptions: []
              }
            : line
        )
      }));
      setLocalError(null);
    },
    []
  );

  const handleItemSelect = useCallback(
    (lineId: string, item: Item) => {
      cancelSuggestionsClose();
      setState((prev) => ({
        ...prev,
        lines: prev.lines.map((line) => {
          if (line.id !== lineId) {
            return line;
          }
          const unitOptions = buildUnitOptions(item, line);
          return {
            ...line,
            itemId: item.id,
            itemName: item.name,
            sku: item.sku ?? item.id,
            unitId: unitOptions[0]?.id ?? '',
            unitOptions
          };
        })
      }));
      setLocalError(null);
      setActiveLineId(null);
    },
    [cancelSuggestionsClose]
  );

  const handleUnitChange = useCallback(
    (lineId: string) => (event: ChangeEvent<HTMLSelectElement>) => {
      const { value } = event.target;
      setState((prev) => ({
        ...prev,
        lines: prev.lines.map((line) =>
          line.id === lineId
            ? {
                ...line,
                unitId: value
              }
            : line
        )
      }));
      setLocalError(null);
    },
    []
  );

  const handleQuantityChange = useCallback(
    (lineId: string) => (event: ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      setState((prev) => ({
        ...prev,
        lines: prev.lines.map((line) =>
          line.id === lineId
            ? {
                ...line,
                quantity: value
              }
            : line
        )
      }));
      setLocalError(null);
    },
    []
  );

  const handleAddLine = useCallback(() => {
    setState((prev) => ({ ...prev, lines: [...prev.lines, createLine()] }));
    setLocalError(null);
  }, []);

  const handleRemoveLine = useCallback((lineId: string) => {
    setState((prev) => {
      const nextLines = prev.lines.filter((line) => line.id !== lineId);
      return {
        ...prev,
        lines: nextLines.length ? nextLines : [createLine()]
      };
    });
    setLocalError(null);
  }, []);

  const totalQuantity = useMemo(
    () =>
      state.lines.reduce((acc, line) => {
        const qty = Number(line.quantity);
        if (Number.isFinite(qty)) {
          return acc + qty;
        }
        return acc;
      }, 0),
    [state.lines]
  );

  const validate = () => {
    if (!state.sourceWarehouse.trim()) {
      return 'Укажите склад-источник.';
    }
    if (!state.destinationWarehouse.trim()) {
      return 'Укажите склад-получатель.';
    }
    for (const [index, line] of state.lines.entries()) {
      if (!line.itemId) {
        return `Выберите номенклатуру для позиции №${index + 1}.`;
      }
      if (!line.unitId) {
        return `Укажите единицу измерения для позиции №${index + 1}.`;
      }
      const qty = Number(line.quantity);
      if (!Number.isFinite(qty) || qty <= 0) {
        return `Количество в позиции №${index + 1} должно быть положительным числом.`;
      }
    }
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setLocalError(validationError);
      return;
    }

    const payload: CreateInterWarehouseMovePayload = {
      code: state.code,
      dispatchAt: state.dispatchAt ? new Date(state.dispatchAt).toISOString() : undefined,
      source: {
        warehouse: state.sourceWarehouse.trim()
      },
      destination: {
        warehouse: state.destinationWarehouse.trim()
      },
      note: state.note.trim() || undefined,
      lines: state.lines.map((line) => {
        const unitLabel = line.unitOptions.find((option) => option.id === line.unitId)?.label || line.unitId;
        return {
          sku: line.sku || line.itemId,
          name: line.itemName,
          quantity: Number(line.quantity),
          uom: unitLabel
        };
      })
    };

    try {
      await onSubmit(payload);
      setLocalError(null);
    } catch (submitError) {
      setLocalError((submitError as Error).message || 'Не удалось создать перемещение.');
    }
  };

  const combinedError = localError || error || null;

  if (!open) {
    return null;
  }

  return (
    <SlideOver title='Новое межскладовое перемещение' onClose={onClose}>
      <div className='warehouse-form__section'>
        <div className='warehouse-form__row'>
          <label className='warehouse-form__control'>
            <span className='warehouse-form__label'>Номер документа</span>
            <input
              name='code'
              type='text'
              value={state.code}
              readOnly
              className='warehouse-input--readonly'
            />
          </label>
          <label className='warehouse-form__control'>
            <span className='warehouse-form__label'>Дата отгрузки</span>
            <input
              name='dispatchAt'
              type='datetime-local'
              value={state.dispatchAt}
              onChange={handleFieldChange}
              disabled={isSubmitting}
              max='9999-12-31T23:59'
            />
          </label>
        </div>
        <div className='warehouse-form__row'>
          <label className='warehouse-form__control'>
            <span className='warehouse-form__label'>Склад-источник <span className='warehouse-form__required'>*</span></span>
            <select
              name='sourceWarehouse'
              value={state.sourceWarehouse}
              onChange={handleWarehouseSelect('sourceWarehouse')}
              disabled={isSubmitting || isWarehousesLoading}
              required
            >
              <option value=''>Выберите склад</option>
              {warehouseOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className='warehouse-form__control'>
            <span className='warehouse-form__label'>Склад-получатель <span className='warehouse-form__required'>*</span></span>
            <select
              name='destinationWarehouse'
              value={state.destinationWarehouse}
              onChange={handleWarehouseSelect('destinationWarehouse')}
              disabled={isSubmitting || isWarehousesLoading}
              required
            >
              <option value=''>Выберите склад</option>
              {warehouseOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className='warehouse-form__control'>
          <span className='warehouse-form__label'>Комментарий</span>
          <textarea
            name='note'
            rows={3}
            value={state.note}
            onChange={handleFieldChange}
            disabled={isSubmitting}
            placeholder='Дополнительная информация для склада'
          />
        </label>
      </div>

      <div className='warehouse-form__section warehouse-form__repeater'>
        <div className='warehouse-form__row'>
          <span className='warehouse-form__label'>Позиции <span className='warehouse-form__required'>*</span></span>
          <span className='warehouse-form__hint'>
            Всего позиций: {state.lines.length}; суммарно {totalQuantity.toLocaleString('ru-RU')} шт.
          </span>
        </div>
        <div style={tableWrapperStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={{ ...headCellStyle, width: 48 }}>№</th>
                <th style={headCellStyle}>Номенклатура</th>
                <th style={{ ...headCellStyle, width: 160 }}>Ед. изм.</th>
                <th style={{ ...headCellStyle, width: 140, textAlign: 'right' }}>Кол-во</th>
                <th style={{ ...headCellStyle, width: 64 }} />
              </tr>
            </thead>
            <tbody>
              {state.lines.map((line, index) => {
                const isActive = activeLineId === line.id;
                const suggestions = isActive ? findItemSuggestions(line.itemName) : [];
                const showSuggestions = isActive && (isItemsLoading || suggestions.length > 0);
                const unitSelectDisabled = line.unitOptions.length === 0;

                return (
                  <tr key={line.id}>
                    <td style={{ ...cellStyle, textAlign: 'center' }}>{index + 1}</td>
                    <td style={cellStyle}>
                      <div style={suggestionWrapperStyle}>
                        <input
                          style={tableInputStyle}
                          value={line.itemName}
                          onChange={handleItemNameChange(line.id)}
                          onFocus={() => openSuggestions(line.id)}
                          onBlur={scheduleSuggestionsClose}
                          placeholder='Начните вводить товар'
                          autoComplete='off'
                          disabled={isSubmitting}
                        />
                        {showSuggestions ? (
                          <div
                            style={suggestionContainerStyle}
                            onMouseEnter={cancelSuggestionsClose}
                            onMouseLeave={scheduleSuggestionsClose}
                          >
                            {isItemsLoading ? (
                              <span style={suggestionEmptyStyle}>Загрузка...</span>
                            ) : suggestions.length ? (
                              suggestions.map((item) => (
                                <button
                                  key={item.id}
                                  type='button'
                                  style={suggestionOptionStyle}
                                  onMouseDown={(event) => {
                                    event.preventDefault();
                                    handleItemSelect(line.id, item);
                                  }}
                                >
                                  <span>{item.name}</span>
                                </button>
                              ))
                            ) : (
                              <span style={suggestionEmptyStyle}>Ничего не найдено</span>
                            )}
                          </div>
                        ) : null}
                      </div>
                    </td>
                    <td style={{ ...cellStyle, width: 160 }}>
                      <select
                        style={tableSelectStyle}
                        value={line.unitId}
                        onChange={handleUnitChange(line.id)}
                        disabled={isSubmitting || unitSelectDisabled}
                      >
                        <option value=''>Выберите единицу</option>
                        {line.unitOptions.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={{ ...cellStyle, width: 140 }}>
                      <input
                        type='number'
                        min='0'
                        step='0.01'
                        style={tableNumberInputStyle}
                        value={line.quantity}
                        onChange={handleQuantityChange(line.id)}
                        disabled={isSubmitting}
                      />
                    </td>
                    <td style={{ ...cellStyle, textAlign: 'center', width: 64 }}>
                      <button
                        type='button'
                        className='warehouse-shell__secondary-action'
                        onClick={() => handleRemoveLine(line.id)}
                        disabled={isSubmitting || state.lines.length === 1}
                      >
                        Удалить
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <button
          type='button'
          className='warehouse-shell__secondary-action warehouse-form__repeater-add'
          onClick={handleAddLine}
          disabled={isSubmitting}
        >
          Добавить позицию
        </button>
      </div>

      {combinedError ? <div className='warehouse-form__error'>{combinedError}</div> : null}
      <div className='warehouse-form__inline-actions'>
        <button
          type='button'
          className='warehouse-shell__primary-action'
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          Создать перемещение
        </button>
        <button
          type='button'
          className='warehouse-shell__secondary-action'
          onClick={onClose}
          disabled={isSubmitting}
        >
          Отмена
        </button>
      </div>
      <div className='warehouse-form__footer-note'>
        Поля с <span className='warehouse-form__required'>*</span> обязательны. Создание недоступно во время отправки формы.
      </div>
    </SlideOver>
  );
};

export default InterWarehouseMoveDrawer;
