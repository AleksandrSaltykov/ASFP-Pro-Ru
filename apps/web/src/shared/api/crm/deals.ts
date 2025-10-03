import { useMemo } from 'react';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

import { type GatewayHttpClient, useGatewayHttpClient } from '../gateway';
import type { CrmDeal, CrmDealEvent, CrmListResponse } from './types';

const CRM_PREFIX = ['crm'] as const;

const dealsListKey = (stage: string, limit: number) => [...CRM_PREFIX, 'deals', stage || 'all', limit] as const;
const dealHistoryKey = (dealId: string, limit: number) =>
  [...CRM_PREFIX, 'deals', dealId, 'history', limit] as const;

type DealsQueryParams = {
  stage?: string;
  limit?: number;
};

type DealsQueryOptions = Omit<
  UseQueryOptions<CrmListResponse<CrmDeal>, Error, CrmDeal[]>,
  'queryKey' | 'queryFn'
>;

type DealHistoryOptions = Omit<
  UseQueryOptions<CrmListResponse<CrmDealEvent>, Error, CrmDealEvent[]>,
  'queryKey' | 'queryFn'
>;

const buildDealsQueryConfig = (
  http: GatewayHttpClient,
  params: Required<DealsQueryParams>,
  options?: DealsQueryOptions
) => {
  const queryParams: Record<string, string> = {
    limit: String(params.limit)
  };
  if (params.stage) {
    queryParams.stage = params.stage;
  }

  return {
    queryKey: dealsListKey(params.stage, params.limit),
    queryFn: () => http.request<CrmListResponse<CrmDeal>>('/api/v1/crm/deals', { query: queryParams }),
    select: (response: CrmListResponse<CrmDeal>) => response.items,
    ...(options ?? {})
  } satisfies UseQueryOptions<CrmListResponse<CrmDeal>, Error, CrmDeal[]>;
};

export const useDealsQuery = (
  { stage = '', limit = 25 }: DealsQueryParams = {},
  options?: DealsQueryOptions
) => {
  const http = useGatewayHttpClient();

  const queryConfig = useMemo(
    () => buildDealsQueryConfig(http, { stage, limit }, options),
    [http, stage, limit, options]
  );

  return useQuery(queryConfig);
};

const buildHistoryQueryConfig = (
  http: GatewayHttpClient,
  dealId: string,
  limit: number,
  options?: DealHistoryOptions
) => ({
  queryKey: dealHistoryKey(dealId, limit),
  queryFn: () =>
    http.request<CrmListResponse<CrmDealEvent>>(`/api/v1/crm/deals/${dealId}/history`, {
      query: { limit: String(limit) }
    }),
  select: (response: CrmListResponse<CrmDealEvent>) => response.items,
  enabled: Boolean(dealId),
  ...(options ?? {})
}) satisfies UseQueryOptions<CrmListResponse<CrmDealEvent>, Error, CrmDealEvent[]>;

export const useDealHistoryQuery = (dealId: string | undefined, limit = 20, options?: DealHistoryOptions) => {
  const http = useGatewayHttpClient();

  const queryConfig = useMemo(
    () =>
      dealId
        ? buildHistoryQueryConfig(http, dealId, limit, options)
        : {
            queryKey: dealHistoryKey('undefined', limit),
            enabled: false
          },
    [http, dealId, limit, options]
  );

  return useQuery(queryConfig as UseQueryOptions<CrmListResponse<CrmDealEvent>, Error, CrmDealEvent[]>);
};
