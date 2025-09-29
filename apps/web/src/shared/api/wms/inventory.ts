import { useMemo } from 'react';
import { useQuery, UseQueryOptions } from '@tanstack/react-query';

import { useWmsHttpClient, WmsHttpClient } from './client';
import type { PaginatedResponse, StockItem } from './types';

const INVENTORY_PREFIX = ['wms', 'inventory'] as const;

const stockListKey = (warehouseCode: string, limit: number) => [
  ...INVENTORY_PREFIX,
  'stock',
  warehouseCode || 'all',
  limit
] as const;

type StockQueryParams = {
  warehouseCode?: string;
  limit?: number;
};

type QueryOptionsOverride<TQueryFnData, TData> = Omit<
  UseQueryOptions<TQueryFnData, Error, TData>,
  'queryKey' | 'queryFn'
>;

const buildQueryConfig = (
  http: WmsHttpClient,
  params: Required<StockQueryParams>,
  options?: QueryOptionsOverride<PaginatedResponse<StockItem>, StockItem[]>
) => {
  const { warehouseCode, limit } = params;
  return {
    queryKey: stockListKey(warehouseCode, limit),
    queryFn: () =>
      http.request<PaginatedResponse<StockItem>>('/api/v1/stock/', {
        query: {
          warehouse: warehouseCode,
          limit: String(limit)
        }
      }),
    select: (response: PaginatedResponse<StockItem>) => response.items,
    ...(options ?? {})
  } satisfies UseQueryOptions<PaginatedResponse<StockItem>, Error, StockItem[]>;
};

export const useStockQuery = (
  { warehouseCode = '', limit = 100 }: StockQueryParams = {},
  options?: QueryOptionsOverride<PaginatedResponse<StockItem>, StockItem[]>
) => {
  const http = useWmsHttpClient();
  const queryConfig = useMemo(() => buildQueryConfig(http, { warehouseCode, limit }, options), [
    http,
    warehouseCode,
    limit,
    options
  ]);

  return useQuery(queryConfig);
};
