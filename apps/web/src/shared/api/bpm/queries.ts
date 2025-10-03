import { useMemo } from 'react';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

import { type GatewayHttpClient, useGatewayHttpClient } from '../gateway';
import type { BpmForm, BpmListResponse, BpmProcess, BpmTask } from './types';

const BPM_PREFIX = ['bpm'] as const;

const processesKey = (limit: number, status: string) => [...BPM_PREFIX, 'processes', limit, status || 'all'] as const;
const formsKey = (limit: number) => [...BPM_PREFIX, 'forms', limit] as const;
const tasksKey = (limit: number, status: string) => [...BPM_PREFIX, 'tasks', limit, status || 'all'] as const;

type QueryOptionsOverride<TQueryFnData, TData> = Omit<
  UseQueryOptions<TQueryFnData, Error, TData>,
  'queryKey' | 'queryFn'
>;

type ProcessQueryParams = {
  limit?: number;
  status?: string;
};

type FormQueryParams = {
  limit?: number;
};

type TaskQueryParams = {
  limit?: number;
  status?: string;
};

const buildProcessesQuery = (
  http: GatewayHttpClient,
  params: Required<ProcessQueryParams>,
  options?: QueryOptionsOverride<BpmListResponse<BpmProcess>, BpmProcess[]>
) => {
  const queryParams: Record<string, string> = { limit: String(params.limit) };
  if (params.status) {
    queryParams.status = params.status;
  }

  return {
    queryKey: processesKey(params.limit, params.status),
    queryFn: () =>
      http.request<BpmListResponse<BpmProcess>>('/api/v1/bpm/processes', {
        query: queryParams
      }),
    select: (response: BpmListResponse<BpmProcess>) => response.items,
    ...(options ?? {})
  } satisfies UseQueryOptions<BpmListResponse<BpmProcess>, Error, BpmProcess[]>;
};

const buildFormsQuery = (
  http: GatewayHttpClient,
  params: Required<FormQueryParams>,
  options?: QueryOptionsOverride<BpmListResponse<BpmForm>, BpmForm[]>
) => ({
  queryKey: formsKey(params.limit),
  queryFn: () =>
    http.request<BpmListResponse<BpmForm>>('/api/v1/bpm/forms', {
      query: { limit: String(params.limit) }
    }),
  select: (response: BpmListResponse<BpmForm>) => response.items,
  ...(options ?? {})
}) satisfies UseQueryOptions<BpmListResponse<BpmForm>, Error, BpmForm[]>;

const buildTasksQuery = (
  http: GatewayHttpClient,
  params: Required<TaskQueryParams>,
  options?: QueryOptionsOverride<BpmListResponse<BpmTask>, BpmTask[]>
) => {
  const queryParams: Record<string, string> = { limit: String(params.limit) };
  if (params.status) {
    queryParams.status = params.status;
  }

  return {
    queryKey: tasksKey(params.limit, params.status),
    queryFn: () =>
      http.request<BpmListResponse<BpmTask>>('/api/v1/bpm/tasks', {
        query: queryParams
      }),
    select: (response: BpmListResponse<BpmTask>) => response.items,
    ...(options ?? {})
  } satisfies UseQueryOptions<BpmListResponse<BpmTask>, Error, BpmTask[]>;
};

export const useBpmProcessesQuery = (
  { limit = 20, status = '' }: ProcessQueryParams = {},
  options?: QueryOptionsOverride<BpmListResponse<BpmProcess>, BpmProcess[]>
) => {
  const http = useGatewayHttpClient();
  const queryConfig = useMemo(
    () => buildProcessesQuery(http, { limit, status }, options),
    [http, limit, status, options]
  );
  return useQuery(queryConfig);
};

export const useBpmFormsQuery = (
  { limit = 20 }: FormQueryParams = {},
  options?: QueryOptionsOverride<BpmListResponse<BpmForm>, BpmForm[]>
) => {
  const http = useGatewayHttpClient();
  const queryConfig = useMemo(() => buildFormsQuery(http, { limit }, options), [http, limit, options]);
  return useQuery(queryConfig);
};

export const useBpmTasksQuery = (
  { limit = 20, status = '' }: TaskQueryParams = {},
  options?: QueryOptionsOverride<BpmListResponse<BpmTask>, BpmTask[]>
) => {
  const http = useGatewayHttpClient();
  const queryConfig = useMemo(
    () => buildTasksQuery(http, { limit, status }, options),
    [http, limit, status, options]
  );
  return useQuery(queryConfig);
};
