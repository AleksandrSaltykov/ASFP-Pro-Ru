import { useEffect, useMemo, useState, type ChangeEvent } from 'react';

import type { CatalogNode, CatalogNodePayload } from '@shared/api';

import { ItemForm, type ItemFormTab } from '../../../layout/ItemForm/ItemForm';
import { generateCategoryCode } from '@shared/utils/identifiers';
import '../../../styles/warehouse.css';

export type CategoryEditorSubmitPayload = {
  payload: CatalogNodePayload;
  nodeId?: string;
};

export type CategoryEditorDrawerProps = {
  open: boolean;
  mode: 'create' | 'edit';
  node: CatalogNode | null;
  nodes: CatalogNode[];
  isSubmitting: boolean;
  error?: string;
  onSubmit: (payload: CategoryEditorSubmitPayload) => Promise<void>;
  onClose: () => void;
  onErrorDismiss?: () => void;
  defaultParentId?: string | null;
};

type FormState = {
  code: string;
  name: string;
  description: string;
  parentId: string;
  sortOrder: string;
  isActive: boolean;
  metadata: string;
};

const emptyState: FormState = {
  code: '',
  name: '',
  description: '',
  parentId: '',
  sortOrder: '',
  isActive: true,
  metadata: '{\n}'
};

const stringifyMetadata = (metadata?: Record<string, unknown>) => {
  try {
    return JSON.stringify(metadata ?? {}, null, 2);
  } catch {
    return '{\n}';
  }
};

const buildInitialState = (node: CatalogNode | null, defaultParentId?: string | null, defaultCode?: string): FormState => {
  if (!node) {
    return {
      ...emptyState,
      code: defaultCode ?? '',
      parentId: defaultParentId ?? ''
    };
  }
  return {
    code: node.code ?? defaultCode ?? '',
    name: node.name ?? '',
    description: node.description ?? '',
    parentId: node.parentId ?? '',
    sortOrder: node.sortOrder != null ? String(node.sortOrder) : '',
    isActive: node.isActive,
    metadata: stringifyMetadata(node.metadata)
  };
};

const parseSortOrder = (input: string): number | null => {
  if (!input.trim()) {
    return null;
  }
  const parsed = Number(input.trim());
  if (!Number.isFinite(parsed)) {
    throw new Error('Сортировка: укажите корректное число');
  }
  return parsed;
};

export const CategoryEditorDrawer = ({
  open,
  mode,
  node,
  nodes,
  isSubmitting,
  error,
  onSubmit,
  onClose,
  onErrorDismiss,
  defaultParentId
}: CategoryEditorDrawerProps) => {
  const [state, setState] = useState<FormState>(emptyState);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const code = mode === 'create' ? generateCategoryCode() : node?.code;
    setState(buildInitialState(node, defaultParentId, code));
    setLocalError(null);
    onErrorDismiss?.();
  }, [open, node, mode, defaultParentId, onErrorDismiss]);

  const parentOptions = useMemo(() => {
    if (!open) {
      return [] as { value: string; label: string }[];
    }
    const currentPath = node?.path ?? '';
    const options = nodes
      .filter((item) => {
        if (!node) {
          return true;
        }
        if (item.id === node.id) {
          return false;
        }
        if (currentPath && item.path && item.path.startsWith(`${currentPath}.`)) {
          return false;
        }
        return true;
      })
      .map((item) => ({
        value: item.id,
        label: `${item.name} (${item.code})`
      }));
    return [{ value: '', label: 'Корневой уровень' }, ...options];
  }, [nodes, node, open]);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
      setLocalError('Код группы не сгенерирован');
      return;
    }
    if (!state.name.trim()) {
      setLocalError('Укажите наименование группы');
      return;
    }

    let sortOrder: number | null;
    try {
      sortOrder = parseSortOrder(state.sortOrder);
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

    const payload: CatalogNodePayload = {
      code: state.code.trim(),
      name: state.name.trim(),
      description: state.description.trim() || undefined,
      parentId: state.parentId ? state.parentId : null,
      sortOrder,
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
              placeholder='Например, SIGNAGE'
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
              placeholder='Рекламные конструкции'
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
            <span className='warehouse-form__label'>Родитель</span>
            <select
              name='parentId'
              value={state.parentId}
              onChange={handleChange}
              disabled={isSubmitting}
            >
              {parentOptions.map((option) => (
                <option key={option.value || 'root'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className='warehouse-form__control'>
            <span className='warehouse-form__label'>Сортировка</span>
            <input
              name='sortOrder'
              type='number'
              value={state.sortOrder}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder='Например, 10'
            />
          </label>
        </div>
        <label className='warehouse-form__checkbox'>
          <input
            type='checkbox'
            name='isActive'
            checked={state.isActive}
            onChange={handleChange}
            disabled={isSubmitting}
          />
          <span>Группа активна</span>
        </label>
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
        <div className='warehouse-form__hint'>
          Можно указать дополнительные параметры (например, {`{"system": false}`}).
        </div>
      </div>
    )
  };

  const combinedError = localError ?? error;

  if (!open) {
    return null;
  }

  return (
    <ItemForm
      title={mode === 'create' ? 'Новая группа' : 'Редактирование группы'}
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

export default CategoryEditorDrawer;
