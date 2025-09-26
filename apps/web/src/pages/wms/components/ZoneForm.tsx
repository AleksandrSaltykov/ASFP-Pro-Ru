import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';

import type { WarehouseZone, ZonePayload } from '@shared/api';
import { palette, typography } from '@shared/ui/theme';

type ZoneFormProps = {
  mode: 'create' | 'edit';
  initial?: WarehouseZone | null;
  submitting?: boolean;
  onSubmit: (payload: ZonePayload) => void;
  onCancel: () => void;
};

export const ZoneForm = ({ mode, initial, submitting = false, onSubmit, onCancel }: ZoneFormProps) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [zoneType, setZoneType] = useState('storage');
  const [isBuffer, setIsBuffer] = useState(false);
  const [hazardClass, setHazardClass] = useState('');
  const [temperatureMin, setTemperatureMin] = useState('');
  const [temperatureMax, setTemperatureMax] = useState('');
  const [accessRestrictions, setAccessRestrictions] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!initial) {
      setCode('');
      setName('');
      setZoneType('storage');
      setIsBuffer(false);
      setHazardClass('');
      setTemperatureMin('');
      setTemperatureMax('');
      setAccessRestrictions('');
      return;
    }

    setCode(initial.code ?? '');
    setName(initial.name ?? '');
    setZoneType(initial.zoneType ?? 'storage');
    setIsBuffer(initial.isBuffer ?? false);
    setHazardClass(initial.hazardClass ?? '');
    setTemperatureMin(initial.temperatureMin?.toString() ?? '');
    setTemperatureMax(initial.temperatureMax?.toString() ?? '');
    setAccessRestrictions((initial.accessRestrictions ?? []).join(', '));
  }, [initial]);

  const title = useMemo(() => (mode === 'create' ? 'Новая зона' : 'Редактирование зоны'), [mode]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmedCode = code.trim();
    const trimmedName = name.trim();
    const trimmedType = zoneType.trim();

    if (!trimmedCode || !trimmedName || !trimmedType) {
      setFormError('Введите код, название и тип зоны');
      return;
    }

    const toNumber = (value: string) => {
      const normalized = value.replace(',', '.').trim();
      if (!normalized) {
        return undefined;
      }
      const parsed = Number(normalized);
      return Number.isNaN(parsed) ? undefined : parsed;
    };

    const payload: ZonePayload = {
      code: trimmedCode,
      name: trimmedName,
      zoneType: trimmedType,
      isBuffer,
      hazardClass: hazardClass.trim() || undefined,
      temperatureMin: toNumber(temperatureMin) ?? undefined,
      temperatureMax: toNumber(temperatureMax) ?? undefined,
      accessRestrictions: accessRestrictions
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    };

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
              ? 'Опишите функциональную зону склада и ограничения доступа'
              : 'Измените параметры зоны и условия хранения'}
          </p>
        </div>
        <div style={actionGroupStyle}>
          <button type="button" onClick={onCancel} style={secondaryButtonStyle} disabled={submitting}>
            Отмена
          </button>
          <button type="submit" style={primaryButtonStyle} disabled={submitting}>
            {submitting ? 'Сохраняем…' : 'Сохранить'}
          </button>
        </div>
      </header>

      {formError ? <div style={errorStyle}>{formError}</div> : null}

      <div style={gridStyle}>
        <label style={fieldStyle}>
          <span style={labelStyle}>Код</span>
          <input value={code} onChange={(event) => setCode(event.target.value)} style={inputStyle} required />
        </label>

        <label style={fieldStyle}>
          <span style={labelStyle}>Название</span>
          <input value={name} onChange={(event) => setName(event.target.value)} style={inputStyle} required />
        </label>

        <label style={fieldStyle}>
          <span style={labelStyle}>Тип зоны</span>
          <select value={zoneType} onChange={(event) => setZoneType(event.target.value)} style={inputStyle}>
            <option value="storage">Хранение</option>
            <option value="receiving">Приёмка</option>
            <option value="shipping">Отгрузка</option>
            <option value="buffer">Буфер</option>
            <option value="production">Производственный буфер</option>
            <option value="quality">Контроль качества</option>
            <option value="hazard">Опасные грузы</option>
          </select>
        </label>

        <label style={checkboxFieldStyle}>
          <input
            type="checkbox"
            checked={isBuffer}
            onChange={(event) => setIsBuffer(event.target.checked)}
            style={checkboxStyle}
          />
          <span style={checkboxLabelStyle}>Буферная зона</span>
        </label>

        <label style={fieldStyle}>
          <span style={labelStyle}>Класс опасности</span>
          <input value={hazardClass} onChange={(event) => setHazardClass(event.target.value)} style={inputStyle} />
        </label>

        <label style={fieldStyle}>
          <span style={labelStyle}>Температура min, °C</span>
          <input value={temperatureMin} onChange={(event) => setTemperatureMin(event.target.value)} style={inputStyle} />
        </label>

        <label style={fieldStyle}>
          <span style={labelStyle}>Температура max, °C</span>
          <input value={temperatureMax} onChange={(event) => setTemperatureMax(event.target.value)} style={inputStyle} />
        </label>

        <label style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
          <span style={labelStyle}>Ограничения доступа</span>
          <input
            value={accessRestrictions}
            onChange={(event) => setAccessRestrictions(event.target.value)}
            placeholder="например: только смена А, подготовленные специалисты"
            style={inputStyle}
          />
        </label>
      </div>
    </form>
  );
};

const formContainerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  padding: 16,
  borderRadius: 16,
  border: `1px solid ${palette.glassBorder}`,
  backgroundColor: palette.layer,
  boxShadow: palette.shadowElevated
};

const formHeaderStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 12
};

const actionGroupStyle: CSSProperties = {
  display: 'flex',
  gap: 8
};

const formTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 16,
  fontWeight: 600,
  letterSpacing: '-0.01em',
  color: palette.textPrimary
};

const formSubtitleStyle: CSSProperties = {
  margin: '6px 0 0',
  fontSize: 12,
  color: palette.textSoft
};

const gridStyle: CSSProperties = {
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

const inputStyle: CSSProperties = {
  padding: '10px 12px',
  borderRadius: 12,
  border: `1px solid ${palette.glassBorder}`,
  backgroundColor: palette.layerStrong,
  color: palette.textPrimary,
  fontFamily: typography.accentFamily,
  fontSize: 13
};

const checkboxFieldStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 12px',
  borderRadius: 12,
  border: `1px solid ${palette.glassBorder}`,
  backgroundColor: palette.layerStrong
};

const checkboxStyle: CSSProperties = {
  width: 16,
  height: 16
};

const checkboxLabelStyle: CSSProperties = {
  fontSize: 12,
  color: palette.textPrimary
};

const primaryButtonStyle: CSSProperties = {
  padding: '10px 16px',
  borderRadius: 12,
  border: 'none',
  background: palette.accentSoft,
  color: palette.textPrimary,
  fontWeight: 600,
  fontFamily: typography.accentFamily,
  cursor: 'pointer'
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
  padding: '8px 12px',
  borderRadius: 12,
  background: 'rgba(220, 86, 86, 0.12)',
  color: '#ff9494',
  fontSize: 12
};
