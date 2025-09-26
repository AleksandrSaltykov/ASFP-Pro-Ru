import { useMemo } from 'react';
import {
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
  useQueryClient
} from '@tanstack/react-query';

import { API_ENDPOINTS } from '@shared/api/endpoints';
import { createHttpClient } from '@shared/api/http-client';
import {
  CellHistoryItem,
  CellPayload,
  EquipmentPayload,
  PaginatedResponse,
  Warehouse,
  WarehouseCell,
  WarehouseDetails,
  WarehouseEquipment,
  WarehousePayload,
  WarehouseZone,
  ZonePayload
} from './types';

const MASTER_DATA_PREFIX = ['wms', 'master-data'] as const;

const warehouseListKey = [...MASTER_DATA_PREFIX, 'warehouses'] as const;
const warehouseDetailsKey = (id: string) => [...MASTER_DATA_PREFIX, 'warehouse', id] as const;
const zoneListKey = (warehouseId: string) => [...MASTER_DATA_PREFIX, 'warehouses', warehouseId, 'zones'] as const;
const cellListKey = (warehouseId: string, zoneId: string) => [
  ...MASTER_DATA_PREFIX,
  'warehouses',
  warehouseId,
  'zones',
  zoneId,
  'cells'
] as const;
const equipmentListKey = (warehouseId: string) => [
  ...MASTER_DATA_PREFIX,
  'warehouses',
  warehouseId,
  'equipment'
] as const;
const cellHistoryKey = (cellId: string) => [...MASTER_DATA_PREFIX, 'cells', cellId, 'history'] as const;

type Http = ReturnType<typeof createHttpClient>;

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

const useWmsHttpClient = (): Http => {
  const queryClient = useQueryClient();
  return useMemo(() => createHttpClient(API_ENDPOINTS.wms, queryClient), [queryClient]);
};

export const useWarehousesQuery = (
  options?: QueryOptionsOverride<PaginatedResponse<Warehouse>, Warehouse[]>
) => {
  const http = useWmsHttpClient();
  return useQuery({
    queryKey: warehouseListKey,
    queryFn: () => http.request<PaginatedResponse<Warehouse>>('/api/v1/master-data/warehouses'),
    select: (response) => response.items,
    ...(options ?? {})
  });
};

export const useWarehouseDetailsQuery = (
  warehouseId: string,
  options?: QueryOptionsOverride<WarehouseDetails, WarehouseDetails>
) => {
  const http = useWmsHttpClient();
  return useQuery({
    queryKey: warehouseDetailsKey(warehouseId),
    queryFn: () => http.request<WarehouseDetails>(`/api/v1/master-data/warehouses/${warehouseId}`),
    enabled: Boolean(warehouseId),
    ...(options ?? {})
  });
};

export const useZonesQuery = (
  warehouseId: string | undefined,
  options?: QueryOptionsOverride<PaginatedResponse<WarehouseZone>, WarehouseZone[]>
) => {
  const http = useWmsHttpClient();
  return useQuery({
    queryKey: warehouseId ? zoneListKey(warehouseId) : [...MASTER_DATA_PREFIX, 'zones', 'disabled'],
    queryFn: () =>
      http.request<PaginatedResponse<WarehouseZone>>(
        `/api/v1/master-data/warehouses/${warehouseId}/zones`
      ),
    enabled: Boolean(warehouseId),
    select: (response) => response.items,
    ...(options ?? {})
  });
};

export const useCellsQuery = (
  warehouseId: string | undefined,
  zoneId: string | undefined,
  options?: QueryOptionsOverride<PaginatedResponse<WarehouseCell>, WarehouseCell[]>
) => {
  const http = useWmsHttpClient();
  const enabled = Boolean(warehouseId && zoneId);
  return useQuery({
    queryKey: enabled
      ? cellListKey(warehouseId!, zoneId!)
      : [...MASTER_DATA_PREFIX, 'cells', 'disabled'],
    queryFn: () =>
      http.request<PaginatedResponse<WarehouseCell>>(
        `/api/v1/master-data/warehouses/${warehouseId}/zones/${zoneId}/cells`
      ),
    enabled,
    select: (response) => response.items,
    ...(options ?? {})
  });
};

export const useEquipmentQuery = (
  warehouseId: string | undefined,
  options?: QueryOptionsOverride<PaginatedResponse<WarehouseEquipment>, WarehouseEquipment[]>
) => {
  const http = useWmsHttpClient();
  return useQuery({
    queryKey: warehouseId ? equipmentListKey(warehouseId) : [...MASTER_DATA_PREFIX, 'equipment', 'disabled'],
    queryFn: () =>
      http.request<PaginatedResponse<WarehouseEquipment>>(
        `/api/v1/master-data/warehouses/${warehouseId}/equipment`
      ),
    enabled: Boolean(warehouseId),
    select: (response) => response.items,
    ...(options ?? {})
  });
};

export const useCellHistoryQuery = (
  cellId: string | undefined,
  limit = 50,
  options?: QueryOptionsOverride<PaginatedResponse<CellHistoryItem>, CellHistoryItem[]>
) => {
  const http = useWmsHttpClient();
  return useQuery({
    queryKey: cellId ? [...cellHistoryKey(cellId), limit] : [...cellHistoryKey('disabled'), limit],
    queryFn: () =>
      http.request<PaginatedResponse<CellHistoryItem>>(
        `/api/v1/master-data/cells/${cellId}/history`,
        {
          query: { limit: String(limit) }
        }
      ),
    enabled: Boolean(cellId),
    select: (response) => response.items,
    ...(options ?? {})
  });
};

const invalidateWarehouses = (http: Http) => http.invalidate(warehouseListKey);
const invalidateZones = (http: Http, warehouseId: string) => http.invalidate(zoneListKey(warehouseId));
const invalidateCells = (http: Http, warehouseId: string, zoneId: string) =>
  http.invalidate(cellListKey(warehouseId, zoneId));
const invalidateEquipment = (http: Http, warehouseId: string) =>
  http.invalidate(equipmentListKey(warehouseId));
const invalidateWarehouseDetails = (http: Http, warehouseId: string) =>
  http.invalidate(warehouseDetailsKey(warehouseId));

export const useCreateWarehouseMutation = (
  options?: MutationOptionsOverride<Warehouse, WarehousePayload>
) => {
  const http = useWmsHttpClient();
  const { onSuccess, ...rest } = options ?? {};
  return useMutation({
    mutationFn: (payload: WarehousePayload) =>
      http.request<Warehouse>('/api/v1/master-data/warehouses', {
        method: 'POST',
        body: payload
      }),
    onSuccess: async (data, variables, context) => {
      await invalidateWarehouses(http);
      onSuccess?.(data, variables, context, undefined as never);
    },
    ...rest
  });
};

type UpdateWarehouseVariables = {
  warehouseId: string;
  payload: WarehousePayload;
};

export const useUpdateWarehouseMutation = (
  options?: MutationOptionsOverride<Warehouse, UpdateWarehouseVariables>
) => {
  const http = useWmsHttpClient();
  const { onSuccess, ...rest } = options ?? {};
  return useMutation({
    mutationFn: ({ warehouseId, payload }: UpdateWarehouseVariables) =>
      http.request<Warehouse>(`/api/v1/master-data/warehouses/${warehouseId}`, {
        method: 'PUT',
        body: payload
      }),
    onSuccess: async (data, variables, context) => {
      await Promise.all([
        invalidateWarehouses(http),
        invalidateWarehouseDetails(http, variables.warehouseId)
      ]);
      onSuccess?.(data, variables, context, undefined as never);
    },
    ...rest
  });
};

export const useDeleteWarehouseMutation = (
  options?: MutationOptionsOverride<null, string>
) => {
  const http = useWmsHttpClient();
  const { onSuccess, ...rest } = options ?? {};
  return useMutation({
    mutationFn: (warehouseId: string) =>
      http.request<null>(`/api/v1/master-data/warehouses/${warehouseId}`, {
        method: 'DELETE'
      }),
    onSuccess: async (data, warehouseId, context) => {
      await Promise.all([
        invalidateWarehouses(http),
        invalidateWarehouseDetails(http, warehouseId)
      ]);
      onSuccess?.(data, warehouseId, context, undefined as never);
    },
    ...rest
  });
};

type CreateZoneVariables = {
  warehouseId: string;
  payload: ZonePayload;
};

type UpdateZoneVariables = {
  warehouseId: string;
  zoneId: string;
  payload: ZonePayload;
};

type DeleteZoneVariables = {
  warehouseId: string;
  zoneId: string;
};

export const useCreateZoneMutation = (
  options?: MutationOptionsOverride<WarehouseZone, CreateZoneVariables>
) => {
  const http = useWmsHttpClient();
  const { onSuccess, ...rest } = options ?? {};
  return useMutation({
    mutationFn: ({ warehouseId, payload }: CreateZoneVariables) =>
      http.request<WarehouseZone>(`/api/v1/master-data/warehouses/${warehouseId}/zones`, {
        method: 'POST',
        body: payload
      }),
    onSuccess: async (data, variables, context) => {
      await Promise.all([
        invalidateZones(http, variables.warehouseId),
        invalidateWarehouseDetails(http, variables.warehouseId)
      ]);
      onSuccess?.(data, variables, context, undefined as never);
    },
    ...rest
  });
};

export const useUpdateZoneMutation = (
  options?: MutationOptionsOverride<WarehouseZone, UpdateZoneVariables>
) => {
  const http = useWmsHttpClient();
  const { onSuccess, ...rest } = options ?? {};
  return useMutation({
    mutationFn: ({ warehouseId, zoneId, payload }: UpdateZoneVariables) =>
      http.request<WarehouseZone>(
        `/api/v1/master-data/warehouses/${warehouseId}/zones/${zoneId}`,
        {
          method: 'PUT',
          body: payload
        }
      ),
    onSuccess: async (data, variables, context) => {
      await Promise.all([
        invalidateZones(http, variables.warehouseId),
        invalidateWarehouseDetails(http, variables.warehouseId)
      ]);
      onSuccess?.(data, variables, context, undefined as never);
    },
    ...rest
  });
};

export const useDeleteZoneMutation = (
  options?: MutationOptionsOverride<null, DeleteZoneVariables>
) => {
  const http = useWmsHttpClient();
  const { onSuccess, ...rest } = options ?? {};
  return useMutation({
    mutationFn: ({ warehouseId, zoneId }: DeleteZoneVariables) =>
      http.request<null>(`/api/v1/master-data/warehouses/${warehouseId}/zones/${zoneId}`, {
        method: 'DELETE'
      }),
    onSuccess: async (data, variables, context) => {
      await Promise.all([
        invalidateZones(http, variables.warehouseId),
        invalidateWarehouseDetails(http, variables.warehouseId)
      ]);
      onSuccess?.(data, variables, context, undefined as never);
    },
    ...rest
  });
};

type CreateCellVariables = {
  warehouseId: string;
  zoneId: string;
  payload: CellPayload;
};

type UpdateCellVariables = {
  warehouseId: string;
  zoneId: string;
  cellId: string;
  payload: CellPayload;
};

type DeleteCellVariables = {
  warehouseId: string;
  zoneId: string;
  cellId: string;
  actorId?: string;
};

export const useCreateCellMutation = (
  options?: MutationOptionsOverride<WarehouseCell, CreateCellVariables>
) => {
  const http = useWmsHttpClient();
  const { onSuccess, ...rest } = options ?? {};
  return useMutation({
    mutationFn: ({ warehouseId, zoneId, payload }: CreateCellVariables) =>
      http.request<WarehouseCell>(
        `/api/v1/master-data/warehouses/${warehouseId}/zones/${zoneId}/cells`,
        {
          method: 'POST',
          body: payload
        }
      ),
    onSuccess: async (data, variables, context) => {
      await Promise.all([
        invalidateCells(http, variables.warehouseId, variables.zoneId),
        invalidateWarehouseDetails(http, variables.warehouseId)
      ]);
      onSuccess?.(data, variables, context, undefined as never);
    },
    ...rest
  });
};

export const useUpdateCellMutation = (
  options?: MutationOptionsOverride<WarehouseCell, UpdateCellVariables>
) => {
  const http = useWmsHttpClient();
  const { onSuccess, ...rest } = options ?? {};
  return useMutation({
    mutationFn: ({ warehouseId, zoneId, cellId, payload }: UpdateCellVariables) =>
      http.request<WarehouseCell>(
        `/api/v1/master-data/warehouses/${warehouseId}/zones/${zoneId}/cells/${cellId}`,
        {
          method: 'PUT',
          body: payload
        }
      ),
    onSuccess: async (data, variables, context) => {
      await Promise.all([
        invalidateCells(http, variables.warehouseId, variables.zoneId),
        invalidateWarehouseDetails(http, variables.warehouseId),
        http.invalidate(cellHistoryKey(variables.cellId))
      ]);
      onSuccess?.(data, variables, context, undefined as never);
    },
    ...rest
  });
};

export const useDeleteCellMutation = (
  options?: MutationOptionsOverride<null, DeleteCellVariables>
) => {
  const http = useWmsHttpClient();
  const { onSuccess, ...rest } = options ?? {};
  return useMutation({
    mutationFn: ({ warehouseId, zoneId, cellId, actorId }: DeleteCellVariables) =>
      http.request<null>(
        `/api/v1/master-data/warehouses/${warehouseId}/zones/${zoneId}/cells/${cellId}`,
        {
          method: 'DELETE',
          query: actorId ? { actorId } : undefined
        }
      ),
    onSuccess: async (data, variables, context) => {
      await Promise.all([
        invalidateCells(http, variables.warehouseId, variables.zoneId),
        invalidateWarehouseDetails(http, variables.warehouseId),
        http.invalidate(cellHistoryKey(variables.cellId))
      ]);
      onSuccess?.(data, variables, context, undefined as never);
    },
    ...rest
  });
};

type CreateEquipmentVariables = {
  warehouseId: string;
  payload: EquipmentPayload;
};

type UpdateEquipmentVariables = {
  warehouseId: string;
  equipmentId: string;
  payload: EquipmentPayload;
};

type DeleteEquipmentVariables = {
  warehouseId: string;
  equipmentId: string;
};

type AssignEquipmentVariables = {
  cellId: string;
  equipmentId: string;
  actorId?: string;
};

type UnassignEquipmentVariables = {
  cellId: string;
  equipmentId: string;
};

export const useCreateEquipmentMutation = (
  options?: MutationOptionsOverride<WarehouseEquipment, CreateEquipmentVariables>
) => {
  const http = useWmsHttpClient();
  const { onSuccess, ...rest } = options ?? {};
  return useMutation({
    mutationFn: ({ warehouseId, payload }: CreateEquipmentVariables) =>
      http.request<WarehouseEquipment>(
        `/api/v1/master-data/warehouses/${warehouseId}/equipment`,
        {
          method: 'POST',
          body: payload
        }
      ),
    onSuccess: async (data, variables, context) => {
      await Promise.all([
        invalidateEquipment(http, variables.warehouseId),
        invalidateWarehouseDetails(http, variables.warehouseId)
      ]);
      onSuccess?.(data, variables, context, undefined as never);
    },
    ...rest
  });
};

export const useUpdateEquipmentMutation = (
  options?: MutationOptionsOverride<WarehouseEquipment, UpdateEquipmentVariables>
) => {
  const http = useWmsHttpClient();
  const { onSuccess, ...rest } = options ?? {};
  return useMutation({
    mutationFn: ({ warehouseId, equipmentId, payload }: UpdateEquipmentVariables) =>
      http.request<WarehouseEquipment>(
        `/api/v1/master-data/warehouses/${warehouseId}/equipment/${equipmentId}`,
        {
          method: 'PUT',
          body: payload
        }
      ),
    onSuccess: async (data, variables, context) => {
      await Promise.all([
        invalidateEquipment(http, variables.warehouseId),
        invalidateWarehouseDetails(http, variables.warehouseId)
      ]);
      onSuccess?.(data, variables, context, undefined as never);
    },
    ...rest
  });
};

export const useDeleteEquipmentMutation = (
  options?: MutationOptionsOverride<null, DeleteEquipmentVariables>
) => {
  const http = useWmsHttpClient();
  const { onSuccess, ...rest } = options ?? {};
  return useMutation({
    mutationFn: ({ warehouseId, equipmentId }: DeleteEquipmentVariables) =>
      http.request<null>(
        `/api/v1/master-data/warehouses/${warehouseId}/equipment/${equipmentId}`,
        {
          method: 'DELETE'
        }
      ),
    onSuccess: async (data, variables, context) => {
      await Promise.all([
        invalidateEquipment(http, variables.warehouseId),
        invalidateWarehouseDetails(http, variables.warehouseId)
      ]);
      onSuccess?.(data, variables, context, undefined as never);
    },
    ...rest
  });
};

export const useAssignEquipmentMutation = (
  options?: MutationOptionsOverride<null, AssignEquipmentVariables>
) => {
  const http = useWmsHttpClient();
  const { onSuccess, ...rest } = options ?? {};
  return useMutation({
    mutationFn: ({ cellId, equipmentId, actorId }: AssignEquipmentVariables) =>
      http.request<null>(
        `/api/v1/master-data/cells/${cellId}/equipment/${equipmentId}`,
        {
          method: 'POST',
          query: actorId ? { actorId } : undefined
        }
      ),
    onSuccess: async (data, variables, context) => {
      await http.invalidate(cellHistoryKey(variables.cellId));
      onSuccess?.(data, variables, context, undefined as never);
    },
    ...rest
  });
};

export const useUnassignEquipmentMutation = (
  options?: MutationOptionsOverride<null, UnassignEquipmentVariables>
) => {
  const http = useWmsHttpClient();
  const { onSuccess, ...rest } = options ?? {};
  return useMutation({
    mutationFn: ({ cellId, equipmentId }: UnassignEquipmentVariables) =>
      http.request<null>(
        `/api/v1/master-data/cells/${cellId}/equipment/${equipmentId}`,
        {
          method: 'DELETE'
        }
      ),
    onSuccess: async (data, variables, context) => {
      await http.invalidate(cellHistoryKey(variables.cellId));
      onSuccess?.(data, variables, context, undefined as never);
    },
    ...rest
  });
};
