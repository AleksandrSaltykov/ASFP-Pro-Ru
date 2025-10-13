import {
  useMutation,
  useQuery,
  type UseMutationOptions,
  type UseQueryOptions
} from "@tanstack/react-query";

import { useWmsHttpClient } from "./client";
import type {
  EndlessPolicy,
  EndlessPolicyKind,
  EndlessPolicyUpdatePayload,
  PaginatedResponse,
  StockAvailability,
  StockBalance,
  StockMovement
} from "./types";

const STOCK_NAMESPACE = ["wms", "stock"] as const;

const balancesKey = (filters?: StockBalanceFilters) => [...STOCK_NAMESPACE, "balances", filters ?? {}] as const;
const availabilityKey = (filters?: StockAvailabilityFilters) =>
  [...STOCK_NAMESPACE, "availability", filters ?? {}] as const;
const endlessKey = (filters?: EndlessPolicyFilters) => [...STOCK_NAMESPACE, "endless", filters ?? {}] as const;
const historyKey = (filters?: StockHistoryFilters) => [...STOCK_NAMESPACE, "history", filters ?? {}] as const;

type StockBalanceFilters = {
  warehouse?: string;
  sku?: string;
  limit?: number;
};

type StockAvailabilityFilters = StockBalanceFilters;

type EndlessPolicyFilters = {
  warehouse?: string;
};

type StockHistoryFilters = {
  warehouse?: string;
  limit?: number;
};

const sanitizeFilters = (filters?: Record<string, string | number | undefined | null>) => {
  if (!filters) {
    return undefined;
  }
  const query: Record<string, string> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }
    query[key] = String(value);
  }
  return Object.keys(query).length > 0 ? query : undefined;
};

type QueryOptionsOverride<TQueryFnData, TData> = Omit<
  UseQueryOptions<TQueryFnData, Error, TData>,
  "queryKey" | "queryFn"
>;

export const useStockBalances = (
  filters?: StockBalanceFilters,
  options?: QueryOptionsOverride<PaginatedResponse<StockBalance>, StockBalance[]>
) => {
  const http = useWmsHttpClient();
  return useQuery({
    queryKey: balancesKey(filters),
    queryFn: () =>
      http.request<PaginatedResponse<StockBalance>>("/api/v1/stock/balances", {
        query: sanitizeFilters(filters)
      }),
    select: (response) => response.items,
    ...options
  });
};

export const useStockAvailability = (
  filters?: StockAvailabilityFilters,
  options?: QueryOptionsOverride<PaginatedResponse<StockAvailability>, StockAvailability[]>
) => {
  const http = useWmsHttpClient();
  return useQuery({
    queryKey: availabilityKey(filters),
    queryFn: () =>
      http.request<PaginatedResponse<StockAvailability>>("/api/v1/stock/availability", {
        query: sanitizeFilters(filters)
      }),
    select: (response) => response.items,
    ...options
  });
};

export const useEndlessPolicies = (
  filters?: EndlessPolicyFilters,
  options?: QueryOptionsOverride<PaginatedResponse<EndlessPolicy>, EndlessPolicy[]>
) => {
  const http = useWmsHttpClient();
  return useQuery({
    queryKey: endlessKey(filters),
    queryFn: () =>
      http.request<PaginatedResponse<EndlessPolicy>>("/api/v1/stock/endless", {
        query: sanitizeFilters(filters)
      }),
    select: (response) => response.items,
    ...options
  });
};

export const useStockHistory = (
  filters?: StockHistoryFilters,
  options?: QueryOptionsOverride<PaginatedResponse<StockMovement>, StockMovement[]>
) => {
  const http = useWmsHttpClient();
  return useQuery({
    queryKey: historyKey(filters),
    queryFn: () =>
      http.request<PaginatedResponse<StockMovement>>("/api/v1/stock/history", {
        query: sanitizeFilters(filters)
      }),
    select: (response) => response.items,
    ...options
  });
};

type UpdateMutationOptions = MutationOptionsOverride<EndlessPolicy, EndlessPolicyUpdatePayload>;

type MutationOptionsOverride<TData, TVariables> = Omit<
  UseMutationOptions<TData, Error, TVariables>,
  "mutationFn" | "onSuccess"
> & {
  onSuccess?: UseMutationOptions<TData, Error, TVariables>["onSuccess"];
};

const invalidateEndless = (invalidate: (key: readonly unknown[]) => Promise<void>, filters?: EndlessPolicyFilters) =>
  invalidate(endlessKey(filters));

const invalidateAvailability = (
  invalidate: (key: readonly unknown[]) => Promise<void>,
  filters?: StockAvailabilityFilters
) => invalidate(availabilityKey(filters));

export const useUpdateEndlessPolicy = (
  filters?: EndlessPolicyFilters,
  options?: UpdateMutationOptions
) => {
  const http = useWmsHttpClient();
  const { onSuccess, ...rest } = options ?? {};
  return useMutation({
    mutationFn: (payload: EndlessPolicyUpdatePayload) =>
      http.request<EndlessPolicy>("/api/v1/stock/endless", {
        method: "PUT",
        body: buildEndlessUpdateBody(payload)
      }),
    onSuccess: async (data, variables, context) => {
      await Promise.all([
        invalidateEndless(http.invalidate, filters),
        invalidateAvailability(http.invalidate)
      ]);
      onSuccess?.(data, variables, context, undefined as never);
    },
    ...rest
  });
};

export const useResetEndlessPolicy = (
  filters?: EndlessPolicyFilters,
  options?: MutationOptionsOverride<EndlessPolicy, EndlessPolicyResetVariables>
) => {
  const http = useWmsHttpClient();
  const { onSuccess, ...rest } = options ?? {};
  return useMutation({
    mutationFn: (variables: EndlessPolicyResetVariables) =>
      http.request<EndlessPolicy>("/api/v1/stock/endless/reset", {
        method: "POST",
        body: {
          itemCode: variables.itemCode,
          warehouse: variables.warehouse
        }
      }),
    onSuccess: async (data, variables, context) => {
      await Promise.all([
        invalidateEndless(http.invalidate, filters),
        invalidateAvailability(http.invalidate)
      ]);
      onSuccess?.(data, variables, context, undefined as never);
    },
    ...rest
  });
};

type EndlessPolicyResetVariables = {
  id: string;
  itemCode: string;
  warehouse: string;
};

const buildEndlessUpdateBody = (payload: EndlessPolicyUpdatePayload) => {
  const body: {
    itemCode: string;
    warehouse: string;
    policy: EndlessPolicyKind;
    min?: number | null;
    max?: number | null;
    reorderPoint?: number | null;
    safetyStock?: number | null;
    note?: string | null;
  } = {
    itemCode: payload.itemCode,
    warehouse: payload.warehouse,
    policy: payload.policy,
    min: payload.min ?? null,
    max: payload.max ?? null,
    reorderPoint: payload.reorderPoint ?? null,
    safetyStock: payload.safetyStock ?? null,
    note: payload.note ?? null
  };

  if (payload.policy === "NONE") {
    body.min = null;
    body.max = null;
    body.reorderPoint = null;
    body.safetyStock = null;
  } else if (payload.policy === "ROP") {
    body.min = payload.reorderPoint ?? null;
    body.max = null;
  }

  return body;
};
