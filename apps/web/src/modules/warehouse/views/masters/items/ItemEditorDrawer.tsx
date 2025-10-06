import { useEffect, useState, type ChangeEvent } from 'react';

import type { CatalogNode, Item, ItemPayload, Warehouse } from '@shared/api';

import { ItemForm, type ItemFormTab } from '../../../layout/ItemForm/ItemForm';
import { CategoryTreeSelect } from './components/CategoryTreeSelect';
import { generateSku } from '@shared/utils/identifiers';
import '../../../styles/warehouse.css';

export type ItemEditorSubmitPayload = {
  payload: ItemPayload;
  itemId?: string;
};

export type ItemEditorDrawerProps = {
  open: boolean;
  mode: 'create' | 'edit';
  item: Item | null;
  categories: CatalogNode[];
  units: CatalogNode[];
  warehouses: Warehouse[];
  isSubmitting: boolean;
  error?: string;
  onSubmit: (payload: ItemEditorSubmitPayload) => Promise<void>;
  onClose: () => void;
  onErrorDismiss?: () => void;
  onCategorySelectRequest?: (currentId: string | null, onSelect: (node: CatalogNode | null) => void) => void;
};

type FormState = {
  sku: string;
  name: string;
  description: string;
  categoryId: string;
  categoryName: string;
  unitId: string;
  alternativeUnitId: string;
  conversionRate: string;
  barcode: string;
  weightKg: string;
  volumeM3: string;
  metadata: string;
  warehouseIds: string[];
  powerW: string;
};

const emptyState: FormState = {
  sku: '',
  name: '',
  description: '',
  categoryId: '',
  categoryName: '',
  unitId: '',
  alternativeUnitId: '',
  conversionRate: '',
  barcode: '',
  weightKg: '',
  volumeM3: '',
  metadata: '{\n  "demo": false\n}',
  warehouseIds: [],
  powerW: ''
};

const stringify = (value: Record<string, unknown> | undefined) => {
  try {
    return JSON.stringify(value ?? {}, null, 2);
  } catch {
    return '{\n}';
  }
};

const buildInitialState = (item: Item | null, defaultSku?: string): FormState => {
  if (!item) {
    return {
      ...emptyState,
      sku: defaultSku ?? ''
    };
  }
  return {
    sku: item.sku ?? defaultSku ?? '',
    name: item.name ?? '',
    description: item.description ?? '',
    categoryId: item.categoryId ?? '',
    categoryName: item.category?.name ?? item.category?.code ?? '',
    unitId: item.unitId ?? '',
    alternativeUnitId: item.alternativeUnitId ?? '',
    conversionRate: item.conversionRate != null ? String(item.conversionRate) : '',
    barcode: item.barcode ?? '',
    weightKg: item.weightKg != null ? String(item.weightKg) : '',
    volumeM3: item.volumeM3 != null ? String(item.volumeM3) : '',
    metadata: stringify(item.metadata),
    warehouseIds: item.warehouseIds ?? [],
    powerW: item.powerW != null ? String(item.powerW) : ''
  };
};

const parseNumber = (value: string): number | null => {
  if (!value.trim()) {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error('Введите корректное число');
  }
  return parsed;
};

export const ItemEditorDrawer = ({
  open,
  mode,
  item,
  categories,
  units,
  warehouses,
  onSubmit,
  onClose,
  isSubmitting,
  error,
  onErrorDismiss,
  onCategorySelectRequest
}: ItemEditorDrawerProps) => {
  const [state, setState] = useState<FormState>(emptyState);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const generatedSku = mode === 'create' ? generateSku() : item?.sku ?? '';
    setState(buildInitialState(item, generatedSku));
    setLocalError(null);
    onErrorDismiss?.();
    // onErrorDismiss изменяется при каждом рендере родителя, но повторный вызов эффекта нам не нужен
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item, mode]);

  useEffect(() => {
    if (!state.categoryId || state.categoryName) {
      return;
    }
    const found = categories.find((category) => category.id === state.categoryId);
    if (found) {
      setState((prev) => ({
        ...prev,
        categoryName: found.name ?? found.code ?? ''
      }));
    }
  }, [state.categoryId, state.categoryName, categories]);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setState((prev) => ({ ...prev, [name]: value }));
  };

  const handleWarehouseToggle = (warehouseId: string) => {
    setState((prev) => {
      const exists = prev.warehouseIds.includes(warehouseId);
      return {
        ...prev,
        warehouseIds: exists
          ? prev.warehouseIds.filter((id) => id !== warehouseId)
          : [...prev.warehouseIds, warehouseId]
      };
    });
  };

  const handleCategorySelectRequest = () => {
    onCategorySelectRequest?.(state.categoryId || null, (node) => {
      setState((prev) => ({
        ...prev,
        categoryId: node?.id ?? '',
        categoryName: node?.name?.trim() ?? node?.code?.trim() ?? ''
      }));
    });
  };

  const selectedCategory = categories.find((category) => category.id === state.categoryId);
  const categoryLabel =
    state.categoryName?.trim() ||
    selectedCategory?.name?.trim() ||
    selectedCategory?.code?.trim() ||
    state.categoryId ||
    '';

  const findUnitById = (id?: string | null) => (id ? units.find((unit) => unit.id === id) : undefined);
  const baseUnit = findUnitById(state.unitId);
  const alternativeUnit = findUnitById(state.alternativeUnitId || null);
  const formatUnitName = (unit?: CatalogNode) => unit?.name?.trim() || unit?.code?.trim() || unit?.id || '';
  const rawConversion = state.conversionRate.replace(',', '.');
  const conversionRateValue = rawConversion ? Number.parseFloat(rawConversion) : NaN;
  const hasConversionValue = Number.isFinite(conversionRateValue) && conversionRateValue > 0;
  const formattedConversion = hasConversionValue
    ? new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 6 }).format(conversionRateValue)
    : '';
  let conversionHint: string | null = null;
  if (alternativeUnit && baseUnit) {
    const altLabel = formatUnitName(alternativeUnit);
    const baseLabel = formatUnitName(baseUnit);
    conversionHint = hasConversionValue
      ? `1 ${altLabel} = ${formattedConversion} ${baseLabel}`
      : `Укажите, сколько ${baseLabel} содержится в 1 ${altLabel}`;
  }


  const handleSubmit = async () => {
    if (!state.sku.trim()) {
      setLocalError('Не удалось сгенерировать артикул (SKU)');
      return;
    }
    if (!state.name.trim()) {
      setLocalError('Укажите наименование');
      return;
    }
    if (!state.unitId) {
      setLocalError('Выберите единицу измерения');
      return;
    }
    if (state.alternativeUnitId && !state.conversionRate.trim()) {
      setLocalError('Укажите коэффициент перерасчёта для альтернативной единицы');
      return;
    }
    if (!state.alternativeUnitId && state.conversionRate.trim()) {
      setLocalError('Выберите альтернативную единицу измерения');
      return;
    }

    let metadataObject: Record<string, unknown> | undefined = undefined;
    if (state.metadata.trim()) {
      try {
        metadataObject = JSON.parse(state.metadata);
      } catch {
        setLocalError('Метаданные: некорректный JSON');
        return;
      }
    }

    let weightKg: number | null;
    let volumeM3: number | null;
    let powerW: number | null;
    let conversionRate: number | null;
    try {
      weightKg = parseNumber(state.weightKg);
      volumeM3 = parseNumber(state.volumeM3);
      powerW = parseNumber(state.powerW);
      conversionRate = parseNumber(state.conversionRate);
    } catch (parseError) {
      setLocalError((parseError as Error).message);
      return;
    }

    if (conversionRate != null && conversionRate <= 0) {
      setLocalError('Коэффициент перерасчёта должен быть больше нуля');
      return;
    }

    const payload: ItemPayload = {
      sku: state.sku.trim(),
      name: state.name.trim(),
      description: state.description.trim() || undefined,
      categoryId: state.categoryId || null,
      unitId: state.unitId,
      barcode: state.barcode.trim() || undefined,
      weightKg,
      volumeM3,
      powerW,
      alternativeUnitId: state.alternativeUnitId || null,
      conversionRate,
      metadata: metadataObject,
      warehouseIds: state.warehouseIds
    };

    try {
      await onSubmit({ payload, itemId: item?.id });
      setLocalError(null);
    } catch (submitError) {
      const message = (submitError as Error).message;
      setLocalError(message);
    }
  };

const generalTab: ItemFormTab = {
  id: 'general',
  label: 'Основное',
  content: (
    <div className='warehouse-form__section'>
      <div className='warehouse-form__row'>
        <label className='warehouse-form__control'>
          <span className='warehouse-form__label'>Артикул (SKU) <span className='warehouse-form__required'>*</span></span>
          <input
            name='sku'
            type='text'
            value={state.sku}
            readOnly
            className='warehouse-input--readonly'
            disabled={isSubmitting}
            placeholder='Например, SIGN-NEON-001'
          />
        </label>
        <label className='warehouse-form__control'>
          <span className='warehouse-form__label'>Наименование <span className='warehouse-form__required'>*</span></span>
          <input
            name='name'
            type='text'
            value={state.name}
            onChange={handleChange}
            disabled={isSubmitting}
            placeholder='Неоновая вывеска 1.5 м'
          />
        </label>
      </div>
      <label className='warehouse-form__control'>
        <span className='warehouse-form__label'>Описание</span>
        <textarea
          name='description'
          value={state.description}
          onChange={handleChange}
          disabled={isSubmitting}
            rows={4}
          />
      </label>
      <div className='warehouse-form__row'>
        <div className='warehouse-form__stack'>
          <label className='warehouse-form__control'>
            <span className='warehouse-form__label'>Группа номенклатуры</span>
            <CategoryTreeSelect
              nodes={categories}
              value={state.categoryId}
              label={categoryLabel}
              disabled={isSubmitting}
              onOpenSelector={handleCategorySelectRequest}
            />
          </label>
          <label className='warehouse-form__control'>
            <span className='warehouse-form__label'>Коэффициент перерасчёта</span>
            <input
              name='conversionRate'
              type='text'
              value={state.conversionRate}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder='Например, 0.5'
            />
            {conversionHint ? <span className='warehouse-form__hint'>{conversionHint}</span> : null}
          </label>
        </div>
        <div className='warehouse-form__stack'>
          <label className='warehouse-form__control'>
            <span className='warehouse-form__label'>Основная единица <span className='warehouse-form__required'>*</span></span>
            <select
              name='unitId'
              value={state.unitId}
              onChange={handleChange}
              disabled={isSubmitting}
            >
              <option value=''>Не выбрано</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name ?? unit.code}
                </option>
              ))}
            </select>
          </label>
          <label className='warehouse-form__control'>
            <span className='warehouse-form__label'>Альтернативная единица измерения</span>
            <select
              name='alternativeUnitId'
              value={state.alternativeUnitId}
              onChange={handleChange}
              disabled={isSubmitting}
            >
              <option value=''>Не выбрано</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name ?? unit.code}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
      <div className='warehouse-form__row'>
        <label className='warehouse-form__control'>
          <span className='warehouse-form__label'>Штрихкод</span>
          <input
            name='barcode'
            type='text'
            value={state.barcode}
            onChange={handleChange}
            disabled={isSubmitting}
            placeholder='EAN-13 / внутренний код'
          />
        </label>
        <label className='warehouse-form__control'>
          <span className='warehouse-form__label'>Вес основной ед., кг</span>
          <input
            name='weightKg'
            type='text'
            value={state.weightKg}
            onChange={handleChange}
            disabled={isSubmitting}
            placeholder='Например, 12.5'
          />
        </label>
        <label className='warehouse-form__control'>
          <span className='warehouse-form__label'>Объём, м³</span>
          <input
            name='volumeM3'
            type='text'
            value={state.volumeM3}
            onChange={handleChange}
            disabled={isSubmitting}
            placeholder='Например, 0.8'
          />
        </label>
        <label className='warehouse-form__control'>
          <span className='warehouse-form__label'>Мощность, Вт</span>
          <input
            name='powerW'
            type='text'
            value={state.powerW}
            onChange={handleChange}
            disabled={isSubmitting}
            placeholder='Например, 180'
          />
        </label>
      </div>
    </div>
  )
  };

const metadataTab: ItemFormTab = {
  id: 'extra',
  label: 'Дополнительно',
  content: (
    <div className='warehouse-form__section'>
      <label className='warehouse-form__control'>
        <span className='warehouse-form__label'>Метаданные (JSON)</span>
        <textarea
          name='metadata'
          value={state.metadata}
          onChange={handleChange}
          disabled={isSubmitting}
            rows={12}
          />
        </label>
      <fieldset className='warehouse-form__fieldset'>
        <legend>Доступные склады</legend>
        <div className='warehouse-form__checkbox-grid'>
          {warehouses.map((warehouse) => (
            <label key={warehouse.id} className='warehouse-form__checkbox'>
              <input
                type='checkbox'
                  checked={state.warehouseIds.includes(warehouse.id)}
                  onChange={() => handleWarehouseToggle(warehouse.id)}
                  disabled={isSubmitting}
                />
                <span>{warehouse.name}</span>
              </label>
            ))}
            {warehouses.length === 0 ? <span className='warehouse-form__hint'>Нет доступных складов</span> : null}
          </div>
        </fieldset>
      </div>
    )
  };

  const combinedError = localError ?? error;

  if (!open) {
    return null;
  }

  return (
    <ItemForm
      title={mode === 'create' ? 'Новая номенклатура' : 'Редактирование номенклатуры'}
      tabs={[generalTab, metadataTab]}
      onClose={onClose}
      onSave={handleSubmit}
      saveDisabled={isSubmitting}
    >
      {combinedError ? <div className='warehouse-form__error'>{combinedError}</div> : null}
      <div className='warehouse-form__footer-note'>
        Все поля со * обязательны для заполнения. Сохранение недоступно во время отправки.
      </div>
    </ItemForm>
  );
};

export default ItemEditorDrawer;
