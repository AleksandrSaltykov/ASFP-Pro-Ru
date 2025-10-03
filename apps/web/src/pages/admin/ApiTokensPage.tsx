import { FormEvent, useMemo, useState, type CSSProperties } from 'react';

import {
  useApiTokensQuery,
  useCreateApiTokenMutation,
  useRevokeApiTokenMutation,
  useRolePermissionsQuery,
  useRolesQuery
} from '@shared/api';
import { useGatewayBasicAuthHeader } from '@shared/api/basic-auth';
import { PermissionGuard } from '@shared/ui/PermissionGuard';
import { PageLoader } from '@shared/ui/PageLoader';
import { palette, typography } from '@shared/ui/theme';

const containerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 24
};

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(280px, 320px) 1fr',
  gap: 24,
  alignItems: 'start'
};

const cardStyle: CSSProperties = {
  borderRadius: 20,
  border: `1px solid ${palette.border}`,
  background: palette.layer,
  padding: 20,
  display: 'flex',
  flexDirection: 'column',
  gap: 16
};

const headingStyle: CSSProperties = {
  margin: 0,
  fontFamily: typography.fontFamily,
  fontSize: 26,
  fontWeight: 600,
  color: palette.textPrimary
};

const inputStyle: CSSProperties = {
  padding: '10px 12px',
  borderRadius: 12,
  border: `1px solid ${palette.glassBorder}`,
  background: palette.surface,
  fontFamily: typography.accentFamily,
  fontSize: 14
};

const formControlStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6
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

const secondaryButtonStyle: CSSProperties = {
  padding: '8px 12px',
  borderRadius: 10,
  border: `1px solid ${palette.border}`,
  background: palette.surface,
  color: palette.textPrimary,
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

type TokenFormState = {
  name: string;
  roleCode: string;
  scope: string;
};

const defaultTokenFormState: TokenFormState = {
  name: '',
  roleCode: '',
  scope: ''
};

const ApiTokensPageContent = () => {
  const authHeader = useGatewayBasicAuthHeader();
  const [formState, setFormState] = useState<TokenFormState>(defaultTokenFormState);
  const [secret, setSecret] = useState<string | null>(null);
  const rolesQuery = useRolesQuery();
  const tokensQuery = useApiTokensQuery();
  const createToken = useCreateApiTokenMutation();
  const revokeToken = useRevokeApiTokenMutation();

  const [selectedRole, setSelectedRole] = useState<string>('director');
  const permissionsQuery = useRolePermissionsQuery(selectedRole || 'director');

  const handleCreateToken = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formState.name || !formState.roleCode) {
      alert('Укажите название и роль для токена');
      return;
    }
    try {
      const result = await createToken.mutateAsync({
        name: formState.name,
        roleCode: formState.roleCode,
        scope: formState.scope || undefined
      });
      setSecret(result.token);
      setFormState(defaultTokenFormState);
    } catch (error) {
      alert((error as Error).message ?? 'Не удалось выпустить токен');
    }
  };

  const handleRevoke = async (id: string) => {
    if (!window.confirm('Отозвать токен?')) {
      return;
    }
    try {
      await revokeToken.mutateAsync({ id });
    } catch (error) {
      alert((error as Error).message ?? 'Не удалось отозвать токен');
    }
  };

  const roleOptions = useMemo(() => rolesQuery.data ?? [], [rolesQuery.data]);

  const isLoading = rolesQuery.isLoading || tokensQuery.isLoading;
  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <section style={containerStyle}>
      <header>
        <h1 style={headingStyle}>API токены и права</h1>
        <p style={{ margin: 0, color: palette.textSecondary }}>
          Выпускайте токены для интеграций и управляйте разрешениями ролей. Токен показывается только один раз.
        </p>
      </header>

      {!authHeader && (
        <div style={{ ...cardStyle, borderStyle: 'dashed', background: palette.surfaceMuted }}>
          Для работы API необходимо указать пару в <code>VITE_GATEWAY_BASIC_AUTH</code>. Без авторизации запросы вернут 401.
        </div>
      )}

      <div style={gridStyle}>
        <form onSubmit={handleCreateToken} style={cardStyle}>
          <h2 style={{ margin: 0, fontSize: 20 }}>Выпуск токена</h2>
          <div style={formControlStyle}>
            <label htmlFor='token-name'>Название</label>
            <input
              id='token-name'
              value={formState.name}
              onChange={(event) => setFormState((state) => ({ ...state, name: event.target.value }))}
              style={inputStyle}
              placeholder='Интеграция CRM'
            />
          </div>
          <div style={formControlStyle}>
            <label htmlFor='token-role'>Роль</label>
            <select
              id='token-role'
              value={formState.roleCode}
              onChange={(event) => setFormState((state) => ({ ...state, roleCode: event.target.value }))}
              style={inputStyle}
            >
              <option value=''>Выберите роль</option>
              {roleOptions.map((role) => (
                <option key={role.code} value={role.code}>
                  {role.code} · {role.description}
                </option>
              ))}
            </select>
          </div>
          <div style={formControlStyle}>
            <label htmlFor='token-scope'>Скоуп (оргюнит)</label>
            <input
              id='token-scope'
              value={formState.scope}
              onChange={(event) => setFormState((state) => ({ ...state, scope: event.target.value }))}
              style={inputStyle}
              placeholder='HQ или HQ-SALES'
            />
            <span style={{ fontSize: 12, color: palette.textSecondary }}>
              Оставьте пустым, чтобы использовать глобальный доступ роли.
            </span>
          </div>
          <button type='submit' style={submitButtonStyle} disabled={createToken.isPending}>
            {createToken.isPending ? 'Выпуск…' : 'Выпустить токен'}
          </button>

          {secret && (
            <div style={{ ...cardStyle, background: palette.surfaceMuted, borderStyle: 'dashed' }}>
              <strong>Секрет токена:</strong>
              <code style={{ wordBreak: 'break-all' }}>{secret}</code>
              <span style={{ fontSize: 12, color: palette.textSecondary }}>Скопируйте значение — повторно его посмотреть нельзя.</span>
            </div>
          )}
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={cardStyle}>
            <h2 style={{ margin: 0, fontSize: 20 }}>Активные токены</h2>
            <p style={{ margin: '4px 0 12px', color: palette.textSecondary }}>
              Токены используют базовую авторизацию gateway. Отзывайте секреты при смене интеграций.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(tokensQuery.data ?? []).map((token) => (
                <div key={token.id} style={{ ...cardStyle, padding: 16, gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>{token.name}</strong>
                    <span style={{ fontSize: 12, color: palette.textSecondary }}>
                      Роль: {token.roleCode} · Скоуп: {token.scope || '*'}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: palette.textMuted }}>
                    Выпущен: {new Date(token.createdAt).toLocaleString('ru-RU')}{' '}
                    {token.revokedAt ? `· Отозван: ${new Date(token.revokedAt).toLocaleString('ru-RU')}` : ''}
                  </div>
                  {!token.revokedAt ? (
                    <button type='button' style={dangerButtonStyle} onClick={() => handleRevoke(token.id)}>
                      Отозвать токен
                    </button>
                  ) : (
                    <span style={{ ...secondaryButtonStyle, pointerEvents: 'none', opacity: 0.6 }}>Токен отозван</span>
                  )}
                </div>
              ))}
              {!tokensQuery.data?.length && (
                <p style={{ margin: 0 }}>Токенов пока нет.</p>
              )}
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 20 }}>Права роли</h2>
              <select
                value={selectedRole}
                onChange={(event) => setSelectedRole(event.target.value)}
                style={inputStyle}
                aria-label='Роль'
              >
                {roleOptions.map((role) => (
                  <option key={role.code} value={role.code}>
                    {role.code}
                  </option>
                ))}
              </select>
            </div>
            <p style={{ margin: '4px 0 12px', color: palette.textSecondary }}>
              Список прав доступен только для чтения. Обновляйте матрицу через REST API или seed, чтобы избежать случайных
              изменений.
            </p>
            {permissionsQuery.isLoading ? (
              <PageLoader />
            ) : (
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 8, listStyle: 'none', margin: 0, padding: 0 }}>
                {(permissionsQuery.data ?? []).map((permission) => (
                  <li key={`${permission.resource}:${permission.action}:${permission.scope}`} style={{ ...cardStyle, padding: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>
                        <strong>{permission.resource}</strong> · {permission.action}
                      </span>
                      <span style={{ fontSize: 12, color: palette.textMuted }}>Скоуп: {permission.scope}</span>
                    </div>
                  </li>
                ))}
                {!permissionsQuery.data?.length && <li>Прав для выбранной роли не найдено.</li>}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

const ApiTokensPage = () => (
  <PermissionGuard permissions={[{ resource: 'core.api_token', action: 'read' }]}>
    <ApiTokensPageContent />
  </PermissionGuard>
);

export default ApiTokensPage;
