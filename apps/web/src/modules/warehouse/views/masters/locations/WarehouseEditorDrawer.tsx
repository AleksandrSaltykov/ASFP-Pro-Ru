import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react';

import type { Warehouse, WarehousePayload } from '@shared/api';

import { ItemForm, type ItemFormTab } from '../../../layout/ItemForm/ItemForm';
import { generateWarehouseCode } from '@shared/utils/identifiers';
import '../../../styles/warehouse.css';

export type WarehouseEditorSubmitPayload = {
  payload: WarehousePayload;
  warehouseId?: string;
};

export type WarehouseEditorDrawerProps = {
  open: boolean;
  mode: 'create' | 'edit';
  warehouse: Warehouse | null;
  isSubmitting: boolean;
  error?: string;
  onSubmit: (payload: WarehouseEditorSubmitPayload) => Promise<void>;
  onClose: () => void;
  onErrorDismiss?: () => void;
};

type FormState = {
  code: string;
  name: string;
  description: string;
  timezone: string;
  status: string;
  addressCountry: string;
  addressRegion: string;
  addressCity: string;
  addressStreet: string;
  addressBuilding: string;
  addressPostalCode: string;
  addressLatitude: string;
  addressLongitude: string;
  contactManager: string;
  contactPhone: string;
  contactEmail: string;
  contactComment: string;
  operatingHours: string;
  metadata: string;
};

const emptyState: FormState = {
  code: '',
  name: '',
  description: '',
  timezone: 'Europe/Moscow',
  status: 'active',
  addressCountry: '',
  addressRegion: '',
  addressCity: '',
  addressStreet: '',
  addressBuilding: '',
  addressPostalCode: '',
  addressLatitude: '',
  addressLongitude: '',
  contactManager: '',
  contactPhone: '',
  contactEmail: '',
  contactComment: '',
  operatingHours: '{\n  "weekdays": "Пн-Пт 09:00–18:00"\n}',
  metadata: '{\n}'
};

const stringifyObject = (value: Record<string, unknown> | undefined) => {
  try {
    return JSON.stringify(value ?? {}, null, 2);
  } catch {
    return '{\n}';
  }
};

const stringifyOperatingHours = (value: Warehouse['operatingHours'] | undefined) => {
  if (!value) {
    return '{\n}';
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return '{\n}';
  }
};

const formatNumber = (value: number | undefined) => (value != null ? String(value) : '');

const buildInitialState = (warehouse: Warehouse | null, defaultCode?: string): FormState => {
  if (!warehouse) {
    return {
      ...emptyState,
      code: defaultCode ?? ''
    };
  }
  return {
    code: warehouse.code ?? defaultCode ?? '',
    name: warehouse.name ?? '',
    description: warehouse.description ?? '',
    timezone: warehouse.timezone ?? 'Europe/Moscow',
    status: warehouse.status ?? 'active',
    addressCountry: warehouse.address?.country ?? '',
    addressRegion: warehouse.address?.region ?? '',
    addressCity: warehouse.address?.city ?? '',
    addressStreet: warehouse.address?.street ?? '',
    addressBuilding: warehouse.address?.building ?? '',
    addressPostalCode: warehouse.address?.postalCode ?? '',
    addressLatitude: formatNumber(warehouse.address?.latitude),
    addressLongitude: formatNumber(warehouse.address?.longitude),
    contactManager: warehouse.contact?.manager ?? '',
    contactPhone: warehouse.contact?.phone ?? '',
    contactEmail: warehouse.contact?.email ?? '',
    contactComment: warehouse.contact?.comment ?? '',
    operatingHours: stringifyOperatingHours(warehouse.operatingHours),
    metadata: stringifyObject(warehouse.metadata)
  };
};

const optionalTrim = (value: string) => {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

const parseOptionalNumber = (value: string, label: string) => {
  if (!value.trim()) {
    return undefined;
  }
  const normalized = value.replace(',', '.');
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${label}: некорректное число`);
  }
  return parsed;
};

const normalizeOperatingHours = (value: unknown): Record<string, string> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('График работы: ожидается объект с ключами и строковыми значениями');
  }
  return Object.entries(value).reduce<Record<string, string>>((acc, [key, entry]) => {
    acc[key] = String(entry);
    return acc;
  }, {});
};

export const WarehouseEditorDrawer = ({
  open,
  mode,
  warehouse,
  isSubmitting,
  error,
  onSubmit,
  onClose,
  onErrorDismiss
}: WarehouseEditorDrawerProps) => {
  const [state, setState] = useState<FormState>(emptyState);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const code = mode === 'create' ? generateWarehouseCode() : warehouse?.code;
    setState(buildInitialState(warehouse, code));
    setLocalError(null);
    onErrorDismiss?.();
  }, [open, warehouse, mode, onErrorDismiss]);

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = event.target;
      setState((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  const statusOptions = useMemo(
    () => [
      { value: 'active', label: 'Активен' },
      { value: 'inactive', label: 'Неактивен' },
      { value: 'archived', label: 'Архив' }
    ],
    []
  );

  const timezoneOptions = useMemo(
    () => [
      'Europe/Kaliningrad',
      'Europe/Moscow',
      'Europe/Samara',
      'Asia/Yekaterinburg',
      'Asia/Omsk',
      'Asia/Novosibirsk',
      'Asia/Krasnoyarsk',
      'Asia/Irkutsk',
      'Asia/Yakutsk',
      'Asia/Vladivostok',
      'Asia/Magadan',
      'Asia/Sakhalin',
      'Asia/Kamchatka'
    ],
    []
  );

  const handleSubmit = useCallback(async () => {
    if (!state.code.trim()) {
      setLocalError('Код склада не сгенерирован');
      return;
    }
    if (!state.name.trim()) {
      setLocalError('Укажите наименование склада');
      return;
    }

    let operatingHours: Record<string, string> | undefined;
    if (state.operatingHours.trim()) {
      try {
        const parsed = JSON.parse(state.operatingHours);
        operatingHours = normalizeOperatingHours(parsed);
      } catch (parseError) {
        setLocalError((parseError as Error).message);
        return;
      }
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

    let latitude: number | undefined;
    let longitude: number | undefined;
    try {
      latitude = parseOptionalNumber(state.addressLatitude, 'Широта');
      longitude = parseOptionalNumber(state.addressLongitude, 'Долгота');
    } catch (parseError) {
      setLocalError((parseError as Error).message);
      return;
    }

    const addressEntries = {
      country: optionalTrim(state.addressCountry),
      region: optionalTrim(state.addressRegion),
      city: optionalTrim(state.addressCity),
      street: optionalTrim(state.addressStreet),
      building: optionalTrim(state.addressBuilding),
      postalCode: optionalTrim(state.addressPostalCode),
      latitude,
      longitude
    };
    const address = Object.entries(addressEntries).reduce<Record<string, unknown>>((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {});

    const contactEntries = {
      manager: optionalTrim(state.contactManager),
      phone: optionalTrim(state.contactPhone),
      email: optionalTrim(state.contactEmail),
      comment: optionalTrim(state.contactComment)
    };
    const contact = Object.entries(contactEntries).reduce<Record<string, string>>((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {});

    const payload: WarehousePayload = {
      code: state.code.trim(),
      name: state.name.trim(),
      description: optionalTrim(state.description),
      timezone: optionalTrim(state.timezone),
      status: optionalTrim(state.status),
      address: Object.keys(address).length ? (address as WarehousePayload['address']) : undefined,
      operatingHours,
      contact: Object.keys(contact).length ? contact : undefined,
      metadata
    };

    try {
      await onSubmit({ payload, warehouseId: warehouse?.id });
      setLocalError(null);
    } catch (submitError) {
      setLocalError((submitError as Error).message);
    }
  }, [state, onSubmit, warehouse?.id]);

  const generalTab: ItemFormTab = useMemo(
    () => ({
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
                placeholder='Например, MSK-MAIN'
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
                placeholder='Центральный склад'
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
              placeholder='Ключевой склад МСК'
              rows={3}
            />
          </label>
          <div className='warehouse-form__row'>
            <label className='warehouse-form__control'>
              <span className='warehouse-form__label'>Часовой пояс</span>
              <select
                name='timezone'
                value={state.timezone}
                onChange={handleChange}
                disabled={isSubmitting}
              >
                <option value=''>Не указан</option>
                {timezoneOptions.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </select>
            </label>
            <label className='warehouse-form__control'>
              <span className='warehouse-form__label'>Статус</span>
              <select
                name='status'
                value={state.status}
                onChange={handleChange}
                disabled={isSubmitting}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      )
    }),
    [state.code, state.name, state.description, state.timezone, state.status, handleChange, isSubmitting, statusOptions, timezoneOptions]
  );

  const addressTab: ItemFormTab = useMemo(
    () => ({
      id: 'address',
      label: 'Адрес и контакты',
      content: (
        <div className='warehouse-form__section'>
          <div className='warehouse-form__row'>
            <label className='warehouse-form__control'>
              <span className='warehouse-form__label'>Страна</span>
              <input
                name='addressCountry'
                type='text'
                value={state.addressCountry}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </label>
            <label className='warehouse-form__control'>
              <span className='warehouse-form__label'>Регион</span>
              <input
                name='addressRegion'
                type='text'
                value={state.addressRegion}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </label>
          </div>
          <div className='warehouse-form__row'>
            <label className='warehouse-form__control'>
              <span className='warehouse-form__label'>Город</span>
              <input
                name='addressCity'
                type='text'
                value={state.addressCity}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </label>
            <label className='warehouse-form__control'>
              <span className='warehouse-form__label'>Улица</span>
              <input
                name='addressStreet'
                type='text'
                value={state.addressStreet}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </label>
          </div>
          <div className='warehouse-form__row'>
            <label className='warehouse-form__control'>
              <span className='warehouse-form__label'>Дом / строение</span>
              <input
                name='addressBuilding'
                type='text'
                value={state.addressBuilding}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </label>
            <label className='warehouse-form__control'>
              <span className='warehouse-form__label'>Почтовый индекс</span>
              <input
                name='addressPostalCode'
                type='text'
                value={state.addressPostalCode}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </label>
          </div>
          <div className='warehouse-form__row'>
            <label className='warehouse-form__control'>
              <span className='warehouse-form__label'>Широта</span>
              <input
                name='addressLatitude'
                type='text'
                value={state.addressLatitude}
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder='55.7558'
              />
            </label>
            <label className='warehouse-form__control'>
              <span className='warehouse-form__label'>Долгота</span>
              <input
                name='addressLongitude'
                type='text'
                value={state.addressLongitude}
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder='37.6176'
              />
            </label>
          </div>
          <fieldset className='warehouse-form__fieldset'>
            <legend>Контакты</legend>
            <div className='warehouse-form__row'>
              <label className='warehouse-form__control'>
                <span className='warehouse-form__label'>Ответственный</span>
                <input
                  name='contactManager'
                  type='text'
                  value={state.contactManager}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </label>
              <label className='warehouse-form__control'>
                <span className='warehouse-form__label'>Телефон</span>
                <input
                  name='contactPhone'
                  type='tel'
                  value={state.contactPhone}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </label>
            </div>
            <div className='warehouse-form__row'>
              <label className='warehouse-form__control'>
                <span className='warehouse-form__label'>Email</span>
                <input
                  name='contactEmail'
                  type='email'
                  value={state.contactEmail}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </label>
              <label className='warehouse-form__control'>
                <span className='warehouse-form__label'>Комментарий</span>
                <input
                  name='contactComment'
                  type='text'
                  value={state.contactComment}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </label>
            </div>
          </fieldset>
        </div>
      )
    }),
    [state.addressCountry, state.addressRegion, state.addressCity, state.addressStreet, state.addressBuilding, state.addressPostalCode, state.addressLatitude, state.addressLongitude, state.contactManager, state.contactPhone, state.contactEmail, state.contactComment, handleChange, isSubmitting]
  );

  const additionalTab: ItemFormTab = useMemo(
    () => ({
      id: 'additional',
      label: 'Дополнительно',
      content: (
        <div className='warehouse-form__section'>
          <label className='warehouse-form__control'>
            <span className='warehouse-form__label'>График работы (JSON)</span>
            <textarea
              name='operatingHours'
              value={state.operatingHours}
              onChange={handleChange}
              disabled={isSubmitting}
              rows={6}
            />
          </label>
          <label className='warehouse-form__control'>
            <span className='warehouse-form__label'>Метаданные (JSON)</span>
            <textarea
              name='metadata'
              value={state.metadata}
              onChange={handleChange}
              disabled={isSubmitting}
              rows={6}
            />
          </label>
          <div className='warehouse-form__hint'>
            В разделе «График работы» перечислите нужные ключи, например {`{"weekdays":"Пн-Пт 09:00–18:00"}`}.
          </div>
        </div>
      )
    }),
    [state.operatingHours, state.metadata, handleChange, isSubmitting]
  );

  const combinedError = localError ?? error;

  if (!open) {
    return null;
  }

  return (
    <ItemForm
      title={mode === 'create' ? 'Новый склад' : 'Редактирование склада'}
      tabs={[generalTab, addressTab, additionalTab]}
      onClose={onClose}
      onSave={handleSubmit}
      saveDisabled={isSubmitting}
    >
      {combinedError ? <div className='warehouse-form__error'>{combinedError}</div> : null}
      <div className='warehouse-form__footer-note'>
        Поля с * обязательны. Сохранение недоступно во время отправки.
      </div>
    </ItemForm>
  );
};

export default WarehouseEditorDrawer;
