import { useMemo } from 'react';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

import { type GatewayHttpClient, useGatewayHttpClient } from '../gateway';
import type {
  AnalyticsConversionRow,
  AnalyticsListResponse,
  AnalyticsManagerLoadRow,
  AnalyticsRange
} from './types';

const ANALYTICS_PREFIX = ['analytics'] as const;

const conversionKey = (from?: string, to?: string) => [...ANALYTICS_PREFIX, 'conversion', from ?? 'auto', to ?? 'auto'] as const;
const managerLoadKey = (from?: string, to?: string) =>
  [...ANALYTICS_PREFIX, 'manager-load', from ?? 'auto', to ?? 'auto'] as const;

type QueryOptionsOverride<TQueryFnData, TData> = Omit<
  UseQueryOptions<TQueryFnData, Error, TData>,
  'queryKey' | 'queryFn'
>;

const normalizeTimestamp = (input?: Date | string) => {
  if (!input) {
    return undefined;
  }

  if (input instanceof Date) {
    return input.toISOString();
  }

  const parsed = new Date(input);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
};

const buildConversionQuery = (
  http: GatewayHttpClient,
  fromInput: AnalyticsRange['from'],
  toInput: AnalyticsRange['to'],
  options?: QueryOptionsOverride<AnalyticsListResponse<AnalyticsConversionRow>, AnalyticsConversionRow[]>
) => {
  const from = normalizeTimestamp(fromInput);
  const to = normalizeTimestamp(toInput);
  const queryParams: Record<string, string> = {};
  if (from) {
    queryParams.from = from;
  }
  if (to) {
    queryParams.to = to;
  }

  return {
    queryKey: conversionKey(from, to),
    queryFn: () =>
      http.request<AnalyticsListResponse<AnalyticsConversionRow>>('/api/v1/analytics/reports/conversion', {
        query: queryParams
      }),
    select: (response: AnalyticsListResponse<AnalyticsConversionRow>) => response.items,
    ...(options ?? {})
  } satisfies UseQueryOptions<AnalyticsListResponse<AnalyticsConversionRow>, Error, AnalyticsConversionRow[]>;
};

const buildManagerLoadQuery = (
  http: GatewayHttpClient,
  fromInput: AnalyticsRange['from'],
  toInput: AnalyticsRange['to'],
  options?: QueryOptionsOverride<AnalyticsListResponse<AnalyticsManagerLoadRow>, AnalyticsManagerLoadRow[]>
) => {
  const from = normalizeTimestamp(fromInput);
  const to = normalizeTimestamp(toInput);
  const queryParams: Record<string, string> = {};
  if (from) {
    queryParams.from = from;
  }
  if (to) {
    queryParams.to = to;
  }

  return {
    queryKey: managerLoadKey(from, to),
    queryFn: () =>
      http.request<AnalyticsListResponse<AnalyticsManagerLoadRow>>('/api/v1/analytics/reports/manager-load', {
        query: queryParams
      }),
    select: (response: AnalyticsListResponse<AnalyticsManagerLoadRow>) => response.items,
    ...(options ?? {})
  } satisfies UseQueryOptions<
    AnalyticsListResponse<AnalyticsManagerLoadRow>,
    Error,
    AnalyticsManagerLoadRow[]
  >;
};

export const useAnalyticsConversionQuery = (
  range: AnalyticsRange = {},
  options?: QueryOptionsOverride<AnalyticsListResponse<AnalyticsConversionRow>, AnalyticsConversionRow[]>
) => {
  const http = useGatewayHttpClient();
  const { from, to } = range;
  const queryConfig = useMemo(() => buildConversionQuery(http, from, to, options), [http, options, from, to]);
  return useQuery(queryConfig);
};

export const useAnalyticsManagerLoadQuery = (
  range: AnalyticsRange = {},
  options?: QueryOptionsOverride<AnalyticsListResponse<AnalyticsManagerLoadRow>, AnalyticsManagerLoadRow[]>
) => {
  const http = useGatewayHttpClient();
  const { from, to } = range;
  const queryConfig = useMemo(() => buildManagerLoadQuery(http, from, to, options), [http, options, from, to]);
  return useQuery(queryConfig);
};
