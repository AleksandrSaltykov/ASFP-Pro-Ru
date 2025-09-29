import { FormEvent, useMemo, useState, type CSSProperties } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';

import { API_ENDPOINTS } from '@shared/api/endpoints';
import { createHttpClient } from '@shared/api/http-client';

type AuditRecord = {
  id: number;
  occurredAt: string;
  actorId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  payload?: Record<string, unknown> | null;
};

type AuditResponse = {
  items: AuditRecord[];
};

type Filters = {
  actorId: string;
  entity: string;
  entityId: string;
  limit: number;
};

const containerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 24
};

const toolbarStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 12,
  alignItems: 'flex-end'
};

const inputColumnStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  minWidth: 160
};

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 14
};

const thStyle: CSSProperties = {
  textAlign: 'left',
  padding: '8px 12px',
  borderBottom: '1px solid rgba(0,0,0,0.1)',
  background: 'rgba(0,0,0,0.02)',
  fontWeight: 600
};

const tdStyle: CSSProperties = {
  padding: '8px 12px',
  verticalAlign: 'top',
  borderBottom: '1px solid rgba(0,0,0,0.06)'
};

const pillStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '2px 8px',
  borderRadius: 999,
  background: 'rgba(77, 107, 255, 0.1)',
  color: '#4d6bff',
  fontSize: 12,
  fontWeight: 600
};

const noteStyle: CSSProperties = {
  padding: '12px 16px',
  borderRadius: 12,
  background: 'rgba(255, 215, 0, 0.12)',
  color: '#6d5300',
  fontSize: 13
};

const loadMoreStyle: CSSProperties = {
  alignSelf: 'flex-start',
  padding: '10px 18px',
  borderRadius: 12,
  border: 'none',
  background: '#4d6bff',
  color: '#fff',
  cursor: 'pointer',
  fontWeight: 600
};

const formatDate = (value: string) => new Date(value).toLocaleString();

const encodeBasic = (credentials?: string) => {
  if (!credentials) {
    return undefined;
  }
  if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
    return `Basic ${window.btoa(credentials)}`;
  }
  return undefined;
};

const sanitizeFilters = (filters: Filters, pageParam?: number) => {
  const query: Record<string, string> = {
    limit: String(filters.limit)
  };

  if (filters.actorId.trim()) {
    query.actorId = filters.actorId.trim();
  }
  if (filters.entity.trim()) {
    query.entity = filters.entity.trim();
  }
  if (filters.entityId.trim()) {
    query.entityId = filters.entityId.trim();
  }
  if (pageParam !== undefined) {
    query.afterId = String(pageParam);
  }

  return query;
};

const defaultFilters: Filters = {
  actorId: '',
  entity: '',
  entityId: '',
  limit: 50
};

const defaultFormState = {
  actorId: '',
  entity: '',
  entityId: '',
  limit: '50'
};

const parseLimit = (value: string) => {
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return 50;
  }
  if (parsed > 200) {
    return 200;
  }
  return parsed;
};

const flattenPages = (pages?: AuditRecord[][]) => pages?.reduce<AuditRecord[]>((acc, page) => acc.concat(page), []) ?? [];

const AuditLogPage = () => {
  const queryClient = useQueryClient();
  const http = useMemo(() => createHttpClient(API_ENDPOINTS.gateway, queryClient), [queryClient]);
  const [formState, setFormState] = useState(defaultFormState);
  const [filters, setFilters] = useState<Filters>(defaultFilters);

  const basicCredentials = import.meta.env.VITE_GATEWAY_BASIC_AUTH as string | undefined;
  const authHeader = useMemo(() => encodeBasic(basicCredentials), [basicCredentials]);

  const query = useInfiniteQuery<AuditRecord[], Error>({
    queryKey: ['audit-log', filters, authHeader],
    initialPageParam: undefined as number | undefined,
    queryFn: async ({ pageParam }) => {
      const queryParams = sanitizeFilters(filters, pageParam as number | undefined);
      const response = await http.request<AuditResponse>('/api/v1/audit', {
        query: queryParams,
        headers: authHeader ? { Authorization: authHeader } : undefined
      });
      return response.items;
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage || lastPage.length === 0) {
        return undefined;
      }
      return lastPage.length === filters.limit ? lastPage[lastPage.length - 1].id : undefined;
    }
  });

  const records = flattenPages(query.data?.pages);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFilters({
      actorId: formState.actorId,
      entity: formState.entity,
      entityId: formState.entityId,
      limit: parseLimit(formState.limit)
    });
  };

  const handleReset = () => {
    setFormState(defaultFormState);
    setFilters(defaultFilters);
  };

  return (
    <div style={containerStyle}>
      <header>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Журнал аудита</h1>
        <p style={{ marginTop: 4, color: 'rgba(0,0,0,0.65)' }}>
          Фиксируются изменения CRM/WMS, обработка событий аналитики и операции в шлюзе.
        </p>
      </header>

      {!authHeader && (
        <div style={noteStyle}>
          Укажите итоговую пару логин/пароль в переменной <code>VITE_GATEWAY_BASIC_AUTH</code>, чтобы клиент смог
          обращаться к защищённому эндпоинту gateway. После изменения переменных окружения перезапустите dev-сервер фронтенда.
        </div>
      )}

      <form onSubmit={handleSubmit} style={toolbarStyle}>
        <div style={inputColumnStyle}>
          <label htmlFor='actorId'>Пользователь (UUID)</label>
          <input
            id='actorId'
            name='actorId'
            value={formState.actorId}
            onChange={(event) => setFormState((state) => ({ ...state, actorId: event.target.value }))}
            placeholder='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
            style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)' }}
          />
        </div>
        <div style={inputColumnStyle}>
          <label htmlFor='entity'>Сущность</label>
          <input
            id='entity'
            name='entity'
            value={formState.entity}
            onChange={(event) => setFormState((state) => ({ ...state, entity: event.target.value }))}
            placeholder='crm.deal'
            style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)' }}
          />
        </div>
        <div style={inputColumnStyle}>
          <label htmlFor='entityId'>Идентификатор сущности</label>
          <input
            id='entityId'
            name='entityId'
            value={formState.entityId}
            onChange={(event) => setFormState((state) => ({ ...state, entityId: event.target.value }))}
            placeholder='deal-123'
            style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)' }}
          />
        </div>
        <div style={{ ...inputColumnStyle, maxWidth: 120 }}>
          <label htmlFor='limit'>Лимит</label>
          <input
            id='limit'
            name='limit'
            type='number'
            min={1}
            max={200}
            value={formState.limit}
            onChange={(event) => setFormState((state) => ({ ...state, limit: event.target.value }))}
            style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)' }}
          />
        </div>
        <button
          type='submit'
          style={{ ...loadMoreStyle, background: '#222', padding: '10px 20px' }}
          disabled={query.isFetching && !query.isFetchingNextPage}
        >
          Применить
        </button>
        <button
          type='button'
          onClick={handleReset}
          style={{ ...loadMoreStyle, background: 'rgba(0,0,0,0.08)', color: '#222' }}
        >
          Сбросить
        </button>
      </form>

      {query.error ? (
        <div style={{ ...noteStyle, background: 'rgba(255, 99, 71, 0.12)', color: '#7a1f1f' }}>
          Не удалось загрузить журнал: {query.error.message}
        </div>
      ) : null}

      <div style={{ overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>ID</th>
              <th style={thStyle}>Время</th>
              <th style={thStyle}>Пользователь</th>
              <th style={thStyle}>Действие</th>
              <th style={thStyle}>Сущность</th>
              <th style={thStyle}>Детали</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id}>
                <td style={tdStyle}>{record.id}</td>
                <td style={tdStyle}>{formatDate(record.occurredAt)}</td>
                <td style={tdStyle}>{record.actorId ? <span style={pillStyle}>{record.actorId}</span> : '—'}</td>
                <td style={tdStyle}>{record.action}</td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span>{record.entity}</span>
                    {record.entityId ? <span style={pillStyle}>{record.entityId}</span> : null}
                  </div>
                </td>
                <td style={tdStyle}>
                  {record.payload ? (
                    <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: 12, whiteSpace: 'pre-wrap' }}>
                      {JSON.stringify(record.payload, null, 2)}
                    </pre>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            ))}
            {records.length === 0 && !query.isFetching ? (
              <tr>
                <td style={{ ...tdStyle, textAlign: 'center' }} colSpan={6}>
                  Записи не найдены
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button
          type='button'
          style={loadMoreStyle}
          onClick={() => query.fetchNextPage()}
          disabled={!query.hasNextPage || query.isFetchingNextPage}
        >
          {query.isFetchingNextPage ? 'Загрузка…' : 'Показать ещё'}
        </button>
        {query.isFetching && !query.isFetchingNextPage ? <span>Обновление…</span> : null}
      </div>
    </div>
  );
};

export default AuditLogPage;
