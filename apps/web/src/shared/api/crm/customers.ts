import { useMemo } from 'react';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

import { type GatewayHttpClient, useGatewayHttpClient } from '../gateway';
import type { CrmCustomer, CrmListResponse } from './types';

const customersKey = (limit: number) => ['crm', 'customers', limit] as const;

type CustomersQueryParams = {
  limit?: number;
};

type CustomersQueryOptions = Omit<
  UseQueryOptions<CrmListResponse<CrmCustomer>, Error, CrmCustomer[]>,
  'queryKey' | 'queryFn'
>;

const buildCustomersQuery = (
  http: GatewayHttpClient,
  params: Required<CustomersQueryParams>,
  options?: CustomersQueryOptions
) => ({
  queryKey: customersKey(params.limit),
  queryFn: () =>
    http.request<CrmListResponse<CrmCustomer>>('/api/v1/crm/customers', {
      query: { limit: String(params.limit) }
    }),
  select: (response: CrmListResponse<CrmCustomer>) => response.items,
  ...(options ?? {})
}) satisfies UseQueryOptions<CrmListResponse<CrmCustomer>, Error, CrmCustomer[]>;

export const useCustomersQuery = (
  { limit = 25 }: CustomersQueryParams = {},
  options?: CustomersQueryOptions
) => {
  const http = useGatewayHttpClient();
  const queryConfig = useMemo(() => buildCustomersQuery(http, { limit }, options), [http, limit, options]);

  return useQuery(queryConfig);
};
