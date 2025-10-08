import { useMemo } from 'react';
import {
  useMutation,
  type UseMutationOptions,
  useQuery,
  type UseQueryOptions,
  useQueryClient
} from '@tanstack/react-query';

import { type GatewayHttpClient, useGatewayHttpClient } from '../gateway';
import type { CrmCustomer, CrmCustomerPayload, CrmListResponse } from './types';

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

type CreateCustomerVariables = {
  payload: CrmCustomerPayload;
  limit?: number;
};

type UpdateCustomerVariables = {
  id: string;
  payload: CrmCustomerPayload;
  limit?: number;
};

export const useCreateCustomerMutation = (
  options?: UseMutationOptions<CrmCustomer, Error, CreateCustomerVariables>
) => {
  const http = useGatewayHttpClient();
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    mutationFn: ({ payload }: CreateCustomerVariables) =>
      http.request<CrmCustomer>('/api/v1/crm/customers', {
        method: 'POST',
        body: payload
      }),
    onSuccess: async (data, variables, context) => {
      const limit = variables?.limit ?? 25;
      await queryClient.invalidateQueries({ queryKey: customersKey(limit) });
      onSuccess?.(data, variables, context, undefined as never);
    },
    ...rest
  });
};

export const useUpdateCustomerMutation = (
  options?: UseMutationOptions<CrmCustomer, Error, UpdateCustomerVariables>
) => {
  const http = useGatewayHttpClient();
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    mutationFn: ({ id, payload }: UpdateCustomerVariables) =>
      http.request<CrmCustomer>(`/api/v1/crm/customers/${id}`, {
        method: 'PUT',
        body: payload
      }),
    onSuccess: async (data, variables, context) => {
      const limit = variables?.limit ?? 25;
      await queryClient.invalidateQueries({ queryKey: customersKey(limit) });
      onSuccess?.(data, variables, context, undefined as never);
    },
    ...rest
  });
};
