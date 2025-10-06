import { useEffect, useState, type ChangeEvent } from 'react';

import type { CatalogNode, CatalogNodePayload } from '@shared/api';

import { ItemForm, type ItemFormTab } from '../../../layout/ItemForm/ItemForm';
import { generateUnitCode } from '@shared/utils/identifiers';
import '../../../styles/warehouse.css';

export type UnitEditorSubmitPayload = {
  payload: CatalogNodePayload;
  nodeId?: string;
};

export type UnitEditorDrawerProps = {
  open: boolean;
  mode: 'create' | 'edit';
  node: CatalogNode | null;
  isSubmitting: boolean;
  error?: string;
  onSubmit: (payload: UnitEditorSubmitPayload) => Promise<void>;
  onClose: () => void;
  onErrorDismiss?: () => void;
};

type FormState = {
  code: string;
  name: string;
  description: string;
  decimalPlaces: string;
  isActive: boolean;
  metadata: string;
};

const emptyState: FormState = {
  code: '',
  name: '',
  description: '',
  decimalPlaces: '',
  isActive: true,
  metadata: '{\n}'
};

const extractDecimals = (metadata?: Record<string, unknown>) => {
  if (!metadata) {
    return '';
  }
  const value = metadata.decimalPlaces ?? metadata.decimals;
  if (typeof value === 'number') {
    return String(value);
  }
  if (typeof value === 'string') {
    return value;
  }
  return '';
};

const stringifyMetadata = (metadata?: Record<string, unknown>) => {
  try {
    return JSON.stringify(metadata ?? {}, null, 2);
  } catch {
    return '{\n}';
  }
};

const buildInitialState = (node: CatalogNode | null, defaultCode?: string): FormState => {
  if (!node) {
    return {
      ...emptyState,
      code: defaultCode ?? ''
    };
  }
  return {
    code: node.code ?? defaultCode ?? '',
    name: node.name ?? '',
    description: node.description ?? '',
    decimalPlaces: extractDecimals(node.metadata),
    isActive: node.isActive,
    metadata: stringifyMetadata(node.metadata)
  };
};

const parseDecimalPlaces = (value: string) => {
  if (!value.trim()) {
    return undefined;
  }
  const parsed = Number(value.trim());
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error('Дробные знаки: укажите неотрицательное число');
  }
  return parsed;
};

export const UnitEditorDrawer = ({
  open,
  mode,
  node,
  isSubmitting,
  error,
  onSubmit,
  onClose,
  onErrorDismiss
}: UnitEditorDrawerProps) => {
  const [state, setState] = useState<FormState>(emptyState);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const code = mode === 'create' ? generateUnitCode() : node?.code;
    setState(buildInitialState(node, code));
    setLocalError(null);
    onErrorDismiss?.();
  }, [open, node, mode, onErrorDismiss]);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = event.target;
    setState((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async () => {
    if (!state.code.trim()) {
      setLocalError('Код единицы не сгенерирован');
      return;
    }
    if (!state.name.trim()) {
      setLocalError('Укажите наименование единицы');
      return;
    }

    let decimalPlaces: number | undefined;
    try {
      decimalPlaces = parseDecimalPlaces(state.decimalPlaces);
    } catch (parseError) {
      setLocalError((parseError as Error).message);
      return;
    }

    let metadata: Record<string, unknown> | undefined;
    if (state.metadata.trim()) {
      try {
        const parsed = JSON.parse(state.metadata);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          throw new Error('Метаданные: ожидается JSON-объект');
        }
        metadata = parsed as Record<string, unknown>;
      } catch (parseError) {
        setLocalError((parseError as Error).message);
        return;
      }
    }

    if (decimalPlaces !== undefined) {
      metadata = { ...(metadata ?? {}), decimalPlaces };
    }

    const payload: CatalogNodePayload = {
      code: state.code.trim(),
      name: state.name.trim(),
      description: state.description.trim() || undefined,
      isActive: state.isActive,
      metadata
    };

    try {
      await onSubmit({ payload, nodeId: node?.id });
      setLocalError(null);
    } catch (submitError) {
      setLocalError((submitError as Error).message);
      throw submitError;
    }
  };

  const generalTab: ItemFormTab = {
    id: 'general',
    label: 'Основное',
    content: (
      <div className='warehouse-form__section'>
        <div className='warehouse-form__row'>
          <label className='warehouse-form__control'>
            <span className='warehouse-form__label'>Код <span className='warehouse-form__required'>*</span></span>
            <input
              name='code'
              type='text'
              value={state.code}
              readOnly
              className='warehouse-input--readonly'
              disabled={isSubmitting}
              placeholder='Например, PCS'
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
              placeholder='Штуки'
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
            rows={3}
          />
        </label>
        <div className='warehouse-form__row'>
          <label className='warehouse-form__control'>
            <span className='warehouse-form__label'>Дробные знаки</span>
            <input
              name='decimalPlaces'
              type='number'
              value={state.decimalPlaces}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder='Например, 0'
              min={0}
            />
          </label>
          <label className='warehouse-form__checkbox warehouse-form__checkbox--centered'>
            <input
              type='checkbox'
              name='isActive'
              checked={state.isActive}
              onChange={handleChange}
              disabled={isSubmitting}
            />
            <span>Единица активна</span>
          </label>
        </div>
      </div>
    )
  };

  const metadataTab: ItemFormTab = {
    id: 'metadata',
    label: 'Метаданные',
    content: (
      <div className='warehouse-form__section'>
        <label className='warehouse-form__control'>
          <span className='warehouse-form__label'>JSON-метаданные</span>
          <textarea
            name='metadata'
            value={state.metadata}
            onChange={handleChange}
            disabled={isSubmitting}
            rows={8}
          />
        </label>
      </div>
    )
  };

  const combinedError = localError ?? error;

  if (!open) {
    return null;
  }

  return (
    <ItemForm
      title={mode === 'create' ? 'Новая единица измерения' : 'Редактирование единицы'}
      tabs={[generalTab, metadataTab]}
      onClose={onClose}
      onSave={handleSubmit}
      saveDisabled={isSubmitting}
    >
      {combinedError ? <div className='warehouse-form__error'>{combinedError}</div> : null}
      <div className='warehouse-form__footer-note'>Поля с * обязательны. Сохранение недоступно во время отправки.</div>
    </ItemForm>
  );
};

export default UnitEditorDrawer;
