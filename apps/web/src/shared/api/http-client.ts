import { QueryClient } from '@tanstack/react-query';
import { z } from 'zod';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type RequestConfig<TBody = unknown, TQuery = Record<string, string>> = {
  method?: HttpMethod;
  body?: TBody;
  query?: TQuery;
  token?: string;
  headers?: Record<string, string>;
};

const errorSchema = z.object({
  error: z.string().optional()
});

export const createHttpClient = (baseUrl: string, client: QueryClient) => {
  const request = async <TResponse>(path: string, config: RequestConfig = {}) => {
    const url = new URL(path, baseUrl);

    if (config.query) {
      Object.entries(config.query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(url.toString(), {
      method: config.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(config.token ? { Authorization: `Bearer ${config.token}` } : {}),
        ...(config.headers ?? {})
      },
      body: config.body ? JSON.stringify(config.body) : undefined
    });

    if (!response.ok) {
      const raw = await response.json().catch(() => ({}));
      const payload = errorSchema.safeParse(raw);
      let message = payload.success ? payload.data.error : response.statusText;

      if (response.status === 401) {
        message = message || 'Требуется повторная авторизация';
      } else if (response.status === 403) {
        message = message || 'Недостаточно прав для выполнения операции';
      }

      throw new Error(message || 'Ошибка запроса');
    }

    if (response.status === 204) {
      return null as TResponse;
    }

    return (await response.json()) as TResponse;
  };

  return {
    request,
    invalidate: (keys: readonly unknown[]) => client.invalidateQueries({ queryKey: keys })
  };
};
