import { useMemo } from 'react';
import { useQuery, UseQueryOptions } from '@tanstack/react-query';

import { useWmsHttpClient, WmsHttpClient } from './client';
import type { PaginatedResponse, StockItem } from './types';

const INVENTORY_PREFIX = ['wms', 'inventory'] as const;

const stockListKey = (warehouseCode: string, limit: number, sku: string) => [
  ...INVENTORY_PREFIX,
  'stock',
  warehouseCode || 'all',
  limit,
  sku || 'all'
] as const;

type StockQueryParams = {
  warehouseCode?: string;
  limit?: number;
  sku?: string;
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
  const { warehouseCode, limit, sku } = params;
  return {
    queryKey: stockListKey(warehouseCode, limit, sku),
    queryFn: () =>
      http.request<PaginatedResponse<StockItem>>('/api/v1/stock/', {
        query: {
          warehouse: warehouseCode,
          limit: String(limit),
          ...(sku ? { sku } : {})
        }
      }),
    select: (response: PaginatedResponse<StockItem>) => response.items,
    ...(options ?? {})
  } satisfies UseQueryOptions<PaginatedResponse<StockItem>, Error, StockItem[]>;
};

export const useStockQuery = (
  { warehouseCode = '', limit = 100, sku = '' }: StockQueryParams = {},
  options?: QueryOptionsOverride<PaginatedResponse<StockItem>, StockItem[]>
) => {
  const http = useWmsHttpClient();
  const queryConfig = useMemo(() => buildQueryConfig(http, { warehouseCode, limit, sku }, options), [
    http,
    warehouseCode,
    limit,
    sku,
    options
  ]);

  return useQuery(queryConfig);
};
