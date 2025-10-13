import {
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions
} from '@tanstack/react-query';

import { useWmsHttpClient, type WmsHttpClient } from './client';
import {
  PaginatedResponse,
  Receipt,
  ReceiptDetails,
  ReceiptPayload,
  ReceiptLinePayload,
  UUID
} from './types';

const RECEIVING_PREFIX = ['wms', 'inbound', 'receipts'] as const;

const receiptListKey = (filters: ReceiptsQueryFilters | undefined) =>
  [...RECEIVING_PREFIX, 'list', filters ?? {}] as const;
const receiptDetailsKey = (receiptId: string) => [...RECEIVING_PREFIX, receiptId] as const;
const receiptDetailsDisabledKey = [...RECEIVING_PREFIX, 'detail-disabled'] as const;

type Http = WmsHttpClient;

type QueryOptionsOverride<TQueryFnData, TData> = Omit<
  UseQueryOptions<TQueryFnData, Error, TData>,
  'queryKey' | 'queryFn'
>;

type MutationOptionsOverride<TData, TVariables> = Omit<
  UseMutationOptions<TData, Error, TVariables>,
  'mutationFn' | 'onSuccess'
> & {
  onSuccess?: UseMutationOptions<TData, Error, TVariables>['onSuccess'];
};

export type ReceiptsQueryFilters = {
  status?: string;
  warehouseId?: UUID;
  search?: string;
  limit?: number;
};

const sanitizeQuery = (params: ReceiptsQueryFilters | undefined) => {
  if (!params) {
    return undefined;
  }
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '');
  if (!entries.length) {
    return undefined;
  }
  return Object.fromEntries(entries);
};

const useReceivingHttpClient = (): Http => useWmsHttpClient();

export const useReceiptsQuery = (
  filters?: ReceiptsQueryFilters,
  options?: QueryOptionsOverride<PaginatedResponse<Receipt>, Receipt[]>
) => {
  const http = useReceivingHttpClient();
  return useQuery({
    queryKey: receiptListKey(filters),
    queryFn: () =>
      http.request<PaginatedResponse<Receipt>>('/api/v1/inbound/receipts', {
        query: sanitizeQuery(filters)
      }),
    select: (response) => response.items,
    ...(options ?? {})
  });
};

export const useReceiptDetailsQuery = (
  receiptId: string | undefined,
  options?: QueryOptionsOverride<ReceiptDetails, ReceiptDetails>
) => {
  const http = useReceivingHttpClient();
  const enabled = Boolean(receiptId);
  return useQuery({
    queryKey: enabled ? receiptDetailsKey(receiptId!) : receiptDetailsDisabledKey,
    queryFn: () => http.request<ReceiptDetails>(`/api/v1/inbound/receipts/${receiptId}`),
    enabled,
    ...(options ?? {})
  });
};

type CreateReceiptVariables = {
  payload: ReceiptPayload;
};

type UpdateReceiptVariables = {
  receiptId: string;
  payload: ReceiptPayload;
};

type DeleteReceiptVariables = {
  receiptId: string;
  actorId?: UUID;
};

const invalidateList = (http: Http, filters?: ReceiptsQueryFilters) =>
  http.invalidate(receiptListKey(filters));

const invalidateDetails = (http: Http, receiptId: string) =>
  http.invalidate(receiptDetailsKey(receiptId));

export const useCreateReceiptMutation = (
  filters?: ReceiptsQueryFilters,
  options?: MutationOptionsOverride<ReceiptDetails, CreateReceiptVariables>
) => {
  const http = useReceivingHttpClient();
  const { onSuccess, ...rest } = options ?? {};
  return useMutation({
    mutationFn: ({ payload }: CreateReceiptVariables) =>
      http.request<ReceiptDetails>('/api/v1/inbound/receipts', {
        method: 'POST',
        body: payload
      }),
    onSuccess: async (data, variables, context) => {
      await invalidateList(http, filters);
      onSuccess?.(data, variables, context, undefined as never);
    },
    ...rest
  });
};

export const useUpdateReceiptMutation = (
  filters?: ReceiptsQueryFilters,
  options?: MutationOptionsOverride<ReceiptDetails, UpdateReceiptVariables>
) => {
  const http = useReceivingHttpClient();
  const { onSuccess, ...rest } = options ?? {};
  return useMutation({
    mutationFn: ({ receiptId, payload }: UpdateReceiptVariables) =>
      http.request<ReceiptDetails>(`/api/v1/inbound/receipts/${receiptId}`, {
        method: 'PUT',
        body: payload
      }),
    onSuccess: async (data, variables, context) => {
      await Promise.all([
        invalidateList(http, filters),
        invalidateDetails(http, variables.receiptId)
      ]);
      onSuccess?.(data, variables, context, undefined as never);
    },
    ...rest
  });
};

export const useDeleteReceiptMutation = (
  filters?: ReceiptsQueryFilters,
  options?: MutationOptionsOverride<null, DeleteReceiptVariables>
) => {
  const http = useReceivingHttpClient();
  const { onSuccess, ...rest } = options ?? {};
  return useMutation({
    mutationFn: ({ receiptId, actorId }: DeleteReceiptVariables) =>
      http.request<null>(`/api/v1/inbound/receipts/${receiptId}`, {
        method: 'DELETE',
        query: actorId ? { actorId } : undefined
      }),
    onSuccess: async (data, variables, context) => {
      await Promise.all([
        invalidateList(http, filters),
        invalidateDetails(http, variables.receiptId)
      ]);
      onSuccess?.(data, variables, context, undefined as never);
    },
    ...rest
  });
};

export const buildReceiptPayload = (
  payload: ReceiptPayload
): ReceiptPayload => ({
  ...payload,
  lines: payload.lines.map((line: ReceiptLinePayload) => ({
    ...line,
    unitId: line.unitId ?? undefined,
    expectedQuantity: line.expectedQuantity ?? undefined,
    receivedQuantity: line.receivedQuantity ?? undefined,
    vatRate: line.vatRate ?? undefined,
    batchNumber: line.batchNumber ?? undefined,
    productionDate: line.productionDate ?? undefined,
    expirationDate: line.expirationDate ?? undefined,
    metadata: line.metadata ?? undefined
  })),
  notes: payload.notes?.trim() ?? undefined,
  externalReference: payload.externalReference?.trim() ?? undefined
});
