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
  isActive: boolean;
};

const emptyState: FormState = {
  code: '',
  name: '',
  description: '',
  isActive: true
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
    isActive: node.isActive
  };
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
    const { name, value, type } = event.currentTarget;
    const nextValue =
      type === 'checkbox' && event.currentTarget instanceof HTMLInputElement
        ? event.currentTarget.checked
        : value;
    setState((prev) => ({
      ...prev,
      [name]: nextValue
    }));
  };

  const handleSubmit = async () => {
    if (!state.code.trim()) {
      setLocalError('Код не удалось сгенерировать, попробуйте ещё раз');
      return;
    }
    if (!state.name.trim()) {
      setLocalError('Укажите наименование единицы');
      return;
    }

    const payload: CatalogNodePayload = {
      code: state.code.trim(),
      name: state.name.trim(),
      description: state.description.trim() || undefined,
      isActive: state.isActive
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
              placeholder='Будет создан автоматически'
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
    )
  };

  const combinedError = localError ?? error;

  if (!open) {
    return null;
  }

  return (
    <ItemForm
      title={mode === 'create' ? 'Новая единица измерения' : 'Редактирование единицы'}
      tabs={[generalTab]}
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
