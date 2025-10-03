import { FormEvent, useMemo, useState, type CSSProperties } from 'react';

import {
  useCreateOrgUnitMutation,
  useDeleteOrgUnitMutation,
  useOrgUnitsQuery,
  useRolesQuery,
  useUpdateOrgUnitMutation
} from '@shared/api';
import { useGatewayBasicAuthHeader } from '@shared/api/basic-auth';
import { PermissionGuard } from '@shared/ui/PermissionGuard';
import { PageLoader } from '@shared/ui/PageLoader';
import { palette, typography } from '@shared/ui/theme';

const layoutStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(260px, 320px) 1fr',
  gap: 24,
  alignItems: 'start'
};

const columnStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16
};

const cardStyle: CSSProperties = {
  borderRadius: 20,
  border: `1px solid ${palette.border}`,
  background: palette.layer,
  padding: 20,
  display: 'flex',
  flexDirection: 'column',
  gap: 14
};

const headingStyle: CSSProperties = {
  margin: 0,
  fontFamily: typography.fontFamily,
  fontSize: 26,
  fontWeight: 600,
  color: palette.textPrimary
};

const listStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  margin: 0,
  padding: 0,
  listStyle: 'none'
};

const unitItemStyle: CSSProperties = {
  borderRadius: 16,
  border: `1px solid ${palette.glassBorder}`,
  background: palette.surface,
  padding: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 10
};

const badgeStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '3px 10px',
  borderRadius: 999,
  background: palette.accentSoft,
  color: palette.primary,
  fontFamily: typography.accentFamily,
  fontSize: 11,
  letterSpacing: '0.08em',
  textTransform: 'uppercase'
};

const formControlStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6
};

const inputStyle: CSSProperties = {
  padding: '10px 12px',
  borderRadius: 12,
  border: `1px solid ${palette.glassBorder}`,
  background: palette.surface,
  fontFamily: typography.accentFamily,
  fontSize: 14
};

const submitButtonStyle: CSSProperties = {
  padding: '10px 14px',
  borderRadius: 12,
  border: 'none',
  background: palette.primary,
  color: '#fff',
  fontWeight: 600,
  cursor: 'pointer'
};

const dangerButtonStyle: CSSProperties = {
  padding: '8px 12px',
  borderRadius: 10,
  border: 'none',
  background: '#ff4d4f',
  color: '#fff',
  fontWeight: 600,
  cursor: 'pointer'
};

const secondaryButtonStyle: CSSProperties = {
  padding: '8px 12px',
  borderRadius: 10,
  border: `1px solid ${palette.border}`,
  background: palette.surface,
  color: palette.textPrimary,
  cursor: 'pointer'
};

type CreateFormState = {
  code: string;
  name: string;
  description: string;
  parentCode: string;
};

const defaultFormState: CreateFormState = {
  code: '',
  name: '',
  description: '',
  parentCode: ''
};

const OrgUnitsPageContent = () => {
  const [formState, setFormState] = useState<CreateFormState>(defaultFormState);
  const authHeader = useGatewayBasicAuthHeader();
  const orgUnitsQuery = useOrgUnitsQuery();
  const rolesQuery = useRolesQuery();
  const createMutation = useCreateOrgUnitMutation();
  const updateMutation = useUpdateOrgUnitMutation();
  const deleteMutation = useDeleteOrgUnitMutation();

  const parentOptions = useMemo(
    () => orgUnitsQuery.data?.map((unit) => ({ code: unit.code, name: unit.name })) ?? [],
    [orgUnitsQuery.data]
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formState.code || !formState.name) {
      alert('Укажите код и название организационного юнита');
      return;
    }
    try {
      await createMutation.mutateAsync({
        code: formState.code,
        name: formState.name,
        description: formState.description || undefined,
        parentCode: formState.parentCode || undefined
      });
      setFormState(defaultFormState);
    } catch (error) {
      alert((error as Error).message ?? 'Не удалось создать оргюнит');
    }
  };

  const toggleUnit = async (code: string, isActive: boolean) => {
    try {
      await updateMutation.mutateAsync({ code, payload: { isActive: !isActive } });
    } catch (error) {
      alert((error as Error).message ?? 'Не удалось обновить статус');
    }
  };

  const removeUnit = async (code: string) => {
    if (!window.confirm(`Удалить оргюнит ${code}?`)) {
      return;
    }
    try {
      await deleteMutation.mutateAsync({ code });
    } catch (error) {
      alert((error as Error).message ?? 'Не удалось удалить оргюнит');
    }
  };

  const isLoading = orgUnitsQuery.isLoading || rolesQuery.isLoading;

  if (isLoading) {
    return <PageLoader />;
  }

  if (orgUnitsQuery.isError) {
    return <div>Не удалось загрузить оргструктуру: {(orgUnitsQuery.error as Error).message}</div>;
  }

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header>
        <h1 style={headingStyle}>Организационная структура</h1>
        <p style={{ margin: 0, color: palette.textSecondary }}>
          Управляйте иерархией доступов и матрицей прав. Новый юнит автоматически наследует путь родителя.
        </p>
      </header>

      {!authHeader && (
        <div style={{ ...cardStyle, borderStyle: 'dashed', background: palette.surfaceMuted }}>
          Укажите переменную <code>VITE_GATEWAY_BASIC_AUTH</code>, чтобы отправлять изменения в gateway. Без авторизации
          операции будут завершаться ошибкой 401.
        </div>
      )}

      <div style={layoutStyle}>
        <div style={columnStyle}>
          <form onSubmit={handleSubmit} style={cardStyle}>
            <h2 style={{ margin: 0, fontSize: 20, fontFamily: typography.fontFamily }}>Создать юнит</h2>
            <div style={formControlStyle}>
              <label htmlFor='org-code'>Код</label>
              <input
                id='org-code'
                value={formState.code}
                onChange={(event) => setFormState((state) => ({ ...state, code: event.target.value.toUpperCase() }))}
                style={inputStyle}
                placeholder='HQ-OPS'
              />
            </div>
            <div style={formControlStyle}>
              <label htmlFor='org-name'>Название</label>
              <input
                id='org-name'
                value={formState.name}
                onChange={(event) => setFormState((state) => ({ ...state, name: event.target.value }))}
                style={inputStyle}
                placeholder='Операционный блок'
              />
            </div>
            <div style={formControlStyle}>
              <label htmlFor='org-parent'>Родитель</label>
              <select
                id='org-parent'
                value={formState.parentCode}
                onChange={(event) => setFormState((state) => ({ ...state, parentCode: event.target.value }))}
                style={inputStyle}
              >
                <option value=''>Корень</option>
                {parentOptions.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.code} · {option.name}
                  </option>
                ))}
              </select>
            </div>
            <div style={formControlStyle}>
              <label htmlFor='org-description'>Описание</label>
              <textarea
                id='org-description'
                value={formState.description}
                onChange={(event) => setFormState((state) => ({ ...state, description: event.target.value }))}
                style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
                placeholder='Набор складов и логистических звеньев'
              />
            </div>
            <button type='submit' style={submitButtonStyle} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Создание…' : 'Создать юнит'}
            </button>
          </form>

          <div style={cardStyle}>
            <h2 style={{ margin: 0, fontSize: 20, fontFamily: typography.fontFamily }}>Матрица ролей</h2>
            {rolesQuery.data?.length ? (
              <ul style={listStyle}>
                {rolesQuery.data.map((role) => (
                  <li key={role.code} style={unitItemStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong>{role.code}</strong>
                      <span style={badgeStyle}>{role.description}</span>
                    </div>
                    <p style={{ margin: 0, color: palette.textSecondary, fontSize: 13 }}>
                      Настройте разрешения для роли на вкладке «API токены и права».
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ margin: 0 }}>Ролей пока нет.</p>
            )}
          </div>
        </div>

        <div style={{ ...columnStyle, gap: 12 }}>
          <div style={cardStyle}>
            <h2 style={{ margin: 0, fontSize: 20, fontFamily: typography.fontFamily }}>Список юнитов</h2>
            <p style={{ margin: '4px 0 12px', color: palette.textSecondary }}>
              Юнит наследует доступы родителя. Деактивация скрывает его из выпадающих списков.
            </p>
            <ul style={listStyle}>
              {(orgUnitsQuery.data ?? []).map((unit) => (
                <li key={unit.code} style={unitItemStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <strong>{unit.code}</strong>
                      <span style={{ color: palette.textSecondary, fontSize: 13 }}>{unit.name}</span>
                    </div>
                    <span style={badgeStyle}>{unit.isActive ? 'Активен' : 'Выключен'}</span>
                  </div>
                  <div style={{ color: palette.textMuted, fontSize: 12 }}>
                    Путь: {unit.path} · Уровень: {unit.level}
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      type='button'
                      style={secondaryButtonStyle}
                      onClick={() => toggleUnit(unit.code, unit.isActive)}
                      disabled={updateMutation.isPending}
                    >
                      {unit.isActive ? 'Деактивировать' : 'Активировать'}
                    </button>
                    <button
                      type='button'
                      style={dangerButtonStyle}
                      onClick={() => removeUnit(unit.code)}
                      disabled={deleteMutation.isPending}
                    >
                      Удалить
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

const OrgUnitsPage = () => (
  <PermissionGuard permissions={[{ resource: 'core.org_unit', action: 'read' }]}>
    <OrgUnitsPageContent />
  </PermissionGuard>
);

export default OrgUnitsPage;
