import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';

import type { CellPayload, WarehouseCell } from '@shared/api';
import { palette, typography } from '@shared/ui/theme';

type CellFormProps = {
  mode: 'create' | 'edit';
  initial?: WarehouseCell | null;
  submitting?: boolean;
  onSubmit: (payload: CellPayload) => void;
  onCancel: () => void;
};

export const CellForm = ({ mode, initial, submitting = false, onSubmit, onCancel }: CellFormProps) => {
  const [code, setCode] = useState('');
  const [label, setLabel] = useState('');
  const [cellType, setCellType] = useState('pallet');
  const [status, setStatus] = useState('active');
  const [isPickFace, setIsPickFace] = useState(false);
  const [lengthMm, setLengthMm] = useState('');
  const [widthMm, setWidthMm] = useState('');
  const [heightMm, setHeightMm] = useState('');
  const [maxWeightKg, setMaxWeightKg] = useState('');
  const [maxVolumeL, setMaxVolumeL] = useState('');
  const [allowedHandling, setAllowedHandling] = useState('');
  const [temperatureMin, setTemperatureMin] = useState('');
  const [temperatureMax, setTemperatureMax] = useState('');
  const [hazardClasses, setHazardClasses] = useState('');
  const [section, setSection] = useState('');
  const [aisle, setAisle] = useState('');
  const [rack, setRack] = useState('');
  const [level, setLevel] = useState('');
  const [position, setPosition] = useState('');
  const [actorId, setActorId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!initial) {
      setCode('');
      setLabel('');
      setCellType('pallet');
      setStatus('active');
      setIsPickFace(false);
      setLengthMm('');
      setWidthMm('');
      setHeightMm('');
      setMaxWeightKg('');
      setMaxVolumeL('');
      setAllowedHandling('');
      setTemperatureMin('');
      setTemperatureMax('');
      setHazardClasses('');
      setSection('');
      setAisle('');
      setRack('');
      setLevel('');
      setPosition('');
      setActorId('');
      return;
    }

    setCode(initial.code ?? '');
    setLabel(initial.label ?? '');
    setCellType(initial.cellType ?? 'pallet');
    setStatus(initial.status ?? 'active');
    setIsPickFace(initial.isPickFace ?? false);
    setLengthMm(initial.lengthMm?.toString() ?? '');
    setWidthMm(initial.widthMm?.toString() ?? '');
    setHeightMm(initial.heightMm?.toString() ?? '');
    setMaxWeightKg(initial.maxWeightKg?.toString() ?? '');
    setMaxVolumeL(initial.maxVolumeL?.toString() ?? '');
    setAllowedHandling((initial.allowedHandling ?? []).join(', '));
    setTemperatureMin(initial.temperatureMin?.toString() ?? '');
    setTemperatureMax(initial.temperatureMax?.toString() ?? '');
    setHazardClasses((initial.hazardClasses ?? []).join(', '));
    setSection((initial.address?.section as string) ?? '');
    setAisle((initial.address?.aisle as string) ?? '');
    setRack((initial.address?.rack as string) ?? '');
    setLevel((initial.address?.level as string) ?? '');
    setPosition((initial.address?.position as string) ?? '');
    setActorId(initial.createdBy ?? '');
  }, [initial]);

  const title = useMemo(() => (mode === 'create' ? 'Новая ячейка' : 'Редактирование ячейки'), [mode]);

  const toNumber = (value: string) => {
    const normalized = value.replace(',', '.').trim();
    if (!normalized) {
      return undefined;
    }
    const parsed = Number(normalized);
    return Number.isNaN(parsed) ? undefined : parsed;
  };

  const toInteger = (value: string) => {
    const normalized = value.trim();
    if (!normalized) {
      return undefined;
    }
    const parsed = parseInt(normalized, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmedCode = code.trim();
    const trimmedType = cellType.trim();

    if (!trimmedCode || !trimmedType) {
      setFormError('Код и тип ячейки обязательны');
      return;
    }

    const addressEntries = {
      section: section.trim() || undefined,
      aisle: aisle.trim() || undefined,
      rack: rack.trim() || undefined,
      level: level.trim() || undefined,
      position: position.trim() || undefined
    } as Record<string, string | undefined>;

    const hasAddress = Object.values(addressEntries).some(Boolean);

    const payload: CellPayload = {
      code: trimmedCode,
      label: label.trim() || undefined,
      cellType: trimmedType,
      status: status.trim() || undefined,
      isPickFace,
      lengthMm: toInteger(lengthMm) ?? undefined,
      widthMm: toInteger(widthMm) ?? undefined,
      heightMm: toInteger(heightMm) ?? undefined,
      maxWeightKg: toNumber(maxWeightKg) ?? undefined,
      maxVolumeL: toNumber(maxVolumeL) ?? undefined,
      allowedHandling: allowedHandling
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      temperatureMin: toNumber(temperatureMin) ?? undefined,
      temperatureMax: toNumber(temperatureMax) ?? undefined,
      hazardClasses: hazardClasses
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      metadata: initial?.metadata ?? undefined,
      actorId: actorId.trim() || undefined
    };

    if (hasAddress) {
      payload.address = Object.fromEntries(
        Object.entries(addressEntries).filter(([, value]) => Boolean(value))
      );
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
              ? 'Опишите адресную ячейку, её габариты и ограничения'
              : 'Обновите параметры ячейки и условия размещения'}
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
          <span style={labelStyle}>Код ячейки</span>
          <input value={code} onChange={(event) => setCode(event.target.value)} style={inputStyle} required />
        </label>

        <label style={fieldStyle}>
          <span style={labelStyle}>Подпись</span>
          <input value={label} onChange={(event) => setLabel(event.target.value)} style={inputStyle} />
        </label>

        <label style={fieldStyle}>
          <span style={labelStyle}>Тип</span>
          <select value={cellType} onChange={(event) => setCellType(event.target.value)} style={inputStyle}>
            <option value="pallet">Паллетная</option>
            <option value="shelf">Полочная</option>
            <option value="floor">Напольная</option>
            <option value="flow">Гравитационная</option>
            <option value="deep">Глубокая</option>
            <option value="cold">Холодильная</option>
          </select>
        </label>

        <label style={fieldStyle}>
          <span style={labelStyle}>Статус</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)} style={inputStyle}>
            <option value="active">Активна</option>
            <option value="reserved">Зарезервирована</option>
            <option value="blocked">Заблокирована</option>
            <option value="maintenance">Обслуживание</option>
          </select>
        </label>

        <label style={checkboxFieldStyle}>
          <input
            type="checkbox"
            checked={isPickFace}
            onChange={(event) => setIsPickFace(event.target.checked)}
            style={checkboxStyle}
          />
          <span style={checkboxLabelStyle}>Пикинговая ячейка</span>
        </label>

        <label style={fieldStyle}>
          <span style={labelStyle}>Длина, мм</span>
          <input value={lengthMm} onChange={(event) => setLengthMm(event.target.value)} style={inputStyle} />
        </label>

        <label style={fieldStyle}>
          <span style={labelStyle}>Ширина, мм</span>
          <input value={widthMm} onChange={(event) => setWidthMm(event.target.value)} style={inputStyle} />
        </label>

        <label style={fieldStyle}>
          <span style={labelStyle}>Высота, мм</span>
          <input value={heightMm} onChange={(event) => setHeightMm(event.target.value)} style={inputStyle} />
        </label>

        <label style={fieldStyle}>
          <span style={labelStyle}>Макс. вес, кг</span>
          <input value={maxWeightKg} onChange={(event) => setMaxWeightKg(event.target.value)} style={inputStyle} />
        </label>

        <label style={fieldStyle}>
          <span style={labelStyle}>Макс. объём, л</span>
          <input value={maxVolumeL} onChange={(event) => setMaxVolumeL(event.target.value)} style={inputStyle} />
        </label>

        <label style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
          <span style={labelStyle}>Допустимые операции</span>
          <input
            value={allowedHandling}
            onChange={(event) => setAllowedHandling(event.target.value)}
            placeholder="пикинг, паллет"
            style={inputStyle}
          />
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
          <span style={labelStyle}>Классы опасности</span>
          <input
            value={hazardClasses}
            onChange={(event) => setHazardClasses(event.target.value)}
            placeholder="ADR 3, ADR 8"
            style={inputStyle}
          />
        </label>

        <div style={{ ...fieldGroupStyle, gridColumn: '1 / -1' }}>
          <span style={groupTitleStyle}>Адрес в топологии</span>
          <div style={gridStyle}>
            <label style={fieldStyle}>
              <span style={labelStyle}>Секция</span>
              <input value={section} onChange={(event) => setSection(event.target.value)} style={inputStyle} />
            </label>
            <label style={fieldStyle}>
              <span style={labelStyle}>Ряд</span>
              <input value={aisle} onChange={(event) => setAisle(event.target.value)} style={inputStyle} />
            </label>
            <label style={fieldStyle}>
              <span style={labelStyle}>Стеллаж</span>
              <input value={rack} onChange={(event) => setRack(event.target.value)} style={inputStyle} />
            </label>
            <label style={fieldStyle}>
              <span style={labelStyle}>Уровень</span>
              <input value={level} onChange={(event) => setLevel(event.target.value)} style={inputStyle} />
            </label>
            <label style={fieldStyle}>
              <span style={labelStyle}>Позиция</span>
              <input value={position} onChange={(event) => setPosition(event.target.value)} style={inputStyle} />
            </label>
          </div>
        </div>

        <label style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
          <span style={labelStyle}>ID оператора (для истории)</span>
          <input value={actorId} onChange={(event) => setActorId(event.target.value)} style={inputStyle} />
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
