import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';

import type { Warehouse, WarehousePayload } from '@shared/api';
import { palette, typography } from '@shared/ui/theme';

type WarehouseFormProps = {
  mode: 'create' | 'edit';
  initial?: Warehouse | null;
  submitting?: boolean;
  onSubmit: (payload: WarehousePayload) => void;
  onCancel: () => void;
};

export const WarehouseForm = ({ mode, initial, submitting = false, onSubmit, onCancel }: WarehouseFormProps) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [timezone, setTimezone] = useState('UTC+03:00');
  const [status, setStatus] = useState('active');
  const [country, setCountry] = useState('');
  const [region, setRegion] = useState('');
  const [city, setCity] = useState('');
  const [street, setStreet] = useState('');
  const [building, setBuilding] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [manager, setManager] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [hours, setHours] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!initial) {
      setCode('');
      setName('');
      setDescription('');
      setTimezone('UTC+03:00');
      setStatus('active');
      setCountry('');
      setRegion('');
      setCity('');
      setStreet('');
      setBuilding('');
      setPostalCode('');
      setManager('');
      setPhone('');
      setEmail('');
      setHours('');
      return;
    }

    setCode(initial.code ?? '');
    setName(initial.name ?? '');
    setDescription(initial.description ?? '');
    setTimezone(initial.timezone ?? 'UTC');
    setStatus(initial.status ?? 'active');
    setCountry(initial.address?.country ?? '');
    setRegion(initial.address?.region ?? '');
    setCity(initial.address?.city ?? '');
    setStreet(initial.address?.street ?? '');
    setBuilding(initial.address?.building ?? '');
    setPostalCode(initial.address?.postalCode ?? '');
    setManager(initial.contact?.manager ?? '');
    setPhone(initial.contact?.phone ?? '');
    setEmail(initial.contact?.email ?? '');

    const defaultHours = (initial.operatingHours?.weekdays && Object.values(initial.operatingHours.weekdays)[0]) ?? '';
    setHours(defaultHours);
  }, [initial]);

  const title = useMemo(
    () => (mode === 'create' ? 'Новый склад' : 'Редактирование склада'),
    [mode]
  );

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmedCode = code.trim();
    const trimmedName = name.trim();

    if (!trimmedCode || !trimmedName) {
      setFormError('Укажите код и наименование склада');
      return;
    }

    const address = {
      country: country.trim() || undefined,
      region: region.trim() || undefined,
      city: city.trim() || undefined,
      street: street.trim() || undefined,
      building: building.trim() || undefined,
      postalCode: postalCode.trim() || undefined
    } as WarehousePayload['address'];
    const hasAddress = Boolean(
      address?.country || address?.region || address?.city || address?.street || address?.building || address?.postalCode
    );

    const contact = {
      manager: manager.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined
    } as WarehousePayload['contact'];
    const hasContact = Boolean(contact?.manager || contact?.phone || contact?.email);

    const payload: WarehousePayload = {
      code: trimmedCode,
      name: trimmedName,
      description: description.trim() || undefined,
      timezone: timezone.trim() || undefined,
      status: status.trim() || undefined,
      operatingHours: hours.trim() ? { default: hours.trim() } : undefined,
      metadata: initial?.metadata ?? undefined
    };

    if (hasAddress) {
      payload.address = address;
    }
    if (hasContact) {
      payload.contact = contact;
    }

    setFormError(null);
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} style={formContainerStyle}>
      <header style={formHeaderStyle}>
        <div>
          <h3 style={formTitleStyle}>{title}</h3>
          <p style={formSubtitleStyle}>
            {mode === 'create'
              ? 'Заполните ключевые атрибуты складской площадки'
              : 'Обновите сведения о складе и его контактных данных'}
          </p>
        </div>
        <div style={formHeaderActionsStyle}>
          <button type="button" onClick={onCancel} style={secondaryButtonStyle} disabled={submitting}>
            Отмена
          </button>
          <button type="submit" style={primaryButtonStyle} disabled={submitting}>
            {submitting ? 'Сохраняем…' : 'Сохранить'}
          </button>
        </div>
      </header>

      {formError ? <div style={errorStyle}>{formError}</div> : null}

      <div style={fieldsGridStyle}>
        <label style={fieldStyle}>
          <span style={labelStyle}>Код склада</span>
          <input
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="WMS-001"
            style={inputStyle}
            required
          />
        </label>

        <label style={fieldStyle}>
          <span style={labelStyle}>Название</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Центральный распределительный центр"
            style={inputStyle}
            required
          />
        </label>

        <label style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
          <span style={labelStyle}>Описание</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Кратко опишите специфику площадки"
            style={textareaStyle}
            rows={3}
          />
        </label>

        <label style={fieldStyle}>
          <span style={labelStyle}>Часовой пояс</span>
          <input
            value={timezone}
            onChange={(event) => setTimezone(event.target.value)}
            placeholder="UTC+03:00"
            style={inputStyle}
          />
        </label>

        <label style={fieldStyle}>
          <span style={labelStyle}>Статус</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)} style={inputStyle}>
            <option value="active">Активен</option>
            <option value="maintenance">На обслуживании</option>
            <option value="planned">Планируется</option>
            <option value="inactive">Неактивен</option>
          </select>
        </label>

        <label style={fieldStyle}>
          <span style={labelStyle}>Рабочие часы</span>
          <input
            value={hours}
            onChange={(event) => setHours(event.target.value)}
            placeholder="Пн-Пт 08:00-22:00"
            style={inputStyle}
          />
        </label>

        <div style={{ ...fieldGroupStyle, gridColumn: '1 / -1' }}>
          <span style={groupTitleStyle}>Адрес</span>
          <div style={fieldsGridStyle}>
            <label style={fieldStyle}>
              <span style={labelStyle}>Страна</span>
              <input value={country} onChange={(event) => setCountry(event.target.value)} style={inputStyle} />
            </label>
            <label style={fieldStyle}>
              <span style={labelStyle}>Регион</span>
              <input value={region} onChange={(event) => setRegion(event.target.value)} style={inputStyle} />
            </label>
            <label style={fieldStyle}>
              <span style={labelStyle}>Город</span>
              <input value={city} onChange={(event) => setCity(event.target.value)} style={inputStyle} />
            </label>
            <label style={fieldStyle}>
              <span style={labelStyle}>Улица</span>
              <input value={street} onChange={(event) => setStreet(event.target.value)} style={inputStyle} />
            </label>
            <label style={fieldStyle}>
              <span style={labelStyle}>Дом/корпус</span>
              <input value={building} onChange={(event) => setBuilding(event.target.value)} style={inputStyle} />
            </label>
            <label style={fieldStyle}>
              <span style={labelStyle}>Индекс</span>
              <input value={postalCode} onChange={(event) => setPostalCode(event.target.value)} style={inputStyle} />
            </label>
          </div>
        </div>

        <div style={{ ...fieldGroupStyle, gridColumn: '1 / -1' }}>
          <span style={groupTitleStyle}>Контакты</span>
          <div style={fieldsGridStyle}>
            <label style={fieldStyle}>
              <span style={labelStyle}>Ответственный</span>
              <input value={manager} onChange={(event) => setManager(event.target.value)} style={inputStyle} />
            </label>
            <label style={fieldStyle}>
              <span style={labelStyle}>Телефон</span>
              <input value={phone} onChange={(event) => setPhone(event.target.value)} style={inputStyle} />
            </label>
            <label style={fieldStyle}>
              <span style={labelStyle}>Email</span>
              <input value={email} onChange={(event) => setEmail(event.target.value)} style={inputStyle} />
            </label>
          </div>
        </div>
      </div>
    </form>
  );
};

const formContainerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 18,
  padding: 18,
  backgroundColor: palette.layer,
  borderRadius: 18,
  border: `1px solid ${palette.glassBorder}`,
  boxShadow: palette.shadowElevated,
  color: palette.textPrimary,
  fontFamily: typography.fontFamily
};

const formHeaderStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 12
};

const formHeaderActionsStyle: CSSProperties = {
  display: 'flex',
  gap: 8
};

const formTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontWeight: 600,
  letterSpacing: '-0.01em'
};

const formSubtitleStyle: CSSProperties = {
  margin: '6px 0 0',
  fontSize: 12,
  color: palette.textSoft,
  lineHeight: 1.5
};

const fieldsGridStyle: CSSProperties = {
  display: 'grid',
  gap: 12,
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))'
};

const fieldStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4
};

const labelStyle: CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: palette.textSoft
};

const inputBaseStyle: CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 12,
  border: `1px solid ${palette.glassBorder}`,
  backgroundColor: palette.layerStrong,
  color: palette.textPrimary,
  fontFamily: typography.accentFamily,
  fontSize: 13,
  outline: 'none',
  transition: 'border 0.2s ease, box-shadow 0.2s ease'
};

const inputStyle: CSSProperties = {
  ...inputBaseStyle
};

const textareaStyle: CSSProperties = {
  ...inputBaseStyle,
  resize: 'vertical'
};

const fieldGroupStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  padding: 14,
  borderRadius: 16,
  border: `1px dashed ${palette.glassBorder}`,
  backgroundColor: palette.layer
};

const groupTitleStyle: CSSProperties = {
  fontSize: 12,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: palette.textSoft
};

const primaryButtonStyle: CSSProperties = {
  padding: '10px 16px',
  borderRadius: 12,
  border: 'none',
  background: palette.accentSoft,
  color: palette.textPrimary,
  fontWeight: 600,
  fontFamily: typography.accentFamily,
  cursor: 'pointer',
  transition: 'opacity 0.2s ease'
};

const secondaryButtonStyle: CSSProperties = {
  padding: '10px 16px',
  borderRadius: 12,
  border: `1px solid ${palette.glassBorder}`,
  background: 'transparent',
  color: palette.textSoft,
  fontFamily: typography.accentFamily,
  cursor: 'pointer'
};

const errorStyle: CSSProperties = {
  padding: '10px 12px',
  borderRadius: 12,
  background: 'rgba(220, 86, 86, 0.12)',
  color: '#ff9494',
  fontSize: 12
};
