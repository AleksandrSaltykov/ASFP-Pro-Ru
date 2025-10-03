import { useMemo } from 'react';
import {
  useMutation,
  type UseMutationOptions,
  useQuery,
  type UseQueryOptions,
  useQueryClient
} from '@tanstack/react-query';

import { API_ENDPOINTS } from '../endpoints';
import { createHttpClient } from '../http-client';
import { buildBasicAuthHeader, useGatewayBasicAuthHeader } from '../basic-auth';

type QueryOverride<TQueryFnData, TData> = Omit<UseQueryOptions<TQueryFnData, Error, TData>, 'queryKey' | 'queryFn'>;
type MutationOverride<TData, TVariables> = Omit<UseMutationOptions<TData, Error, TVariables>, 'mutationFn' | 'onSuccess'> & {
  onSuccess?: UseMutationOptions<TData, Error, TVariables>['onSuccess'];
};

const CORE_PREFIX = ['core'] as const;

const orgUnitsKey = () => [...CORE_PREFIX, 'org-units'] as const;
const rolesKey = () => [...CORE_PREFIX, 'roles'] as const;
const permissionsKey = (role: string) => [...CORE_PREFIX, 'permissions', role] as const;
const tokensKey = () => [...CORE_PREFIX, 'api-tokens'] as const;
const currentUserKey = () => [...CORE_PREFIX, 'current-user'] as const;

export type CoreOrgUnit = {
  id: string;
  parentId?: string | null;
  code: string;
  name: string;
  description?: string | null;
  path: string;
  level: number;
  isActive: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type CoreRolePermission = {
  roleCode: string;
  resource: string;
  action: string;
  scope: string;
  effect: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type CoreCurrentUserRole = {
  code: string;
  scope: string;
};

export type CoreCurrentUser = {
  id: string;
  email: string;
  fullName: string;
  roles: CoreCurrentUserRole[];
  orgUnits: string[];
};

export type CoreApiToken = {
  id: string;
  name: string;
  roleCode: string;
  scope: string;
  createdAt: string;
  createdBy?: string | null;
  lastUsedAt?: string | null;
  revokedAt?: string | null;
};

export type CoreApiTokenWithSecret = CoreApiToken & {
  token: string;
};

type OrgUnitCreateInput = {
  code: string;
  name: string;
  description?: string;
  parentCode?: string;
  metadata?: Record<string, unknown>;
};

type OrgUnitUpdateInput = {
  name?: string;
  description?: string;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
};

type CoreRole = {
  code: string;
  description: string;
};

const useCoreHttpClient = () => {
  const queryClient = useQueryClient();
  return useMemo(() => createHttpClient(API_ENDPOINTS.gateway, queryClient), [queryClient]);
};

const authHeaders = (authHeader?: string) => (authHeader ? { Authorization: authHeader } : undefined);

export const useRolesQuery = (options?: QueryOverride<{ items: CoreRole[] }, CoreRole[]>) => {
  const http = useCoreHttpClient();
  const header = useGatewayBasicAuthHeader();
  return useQuery<{ items: CoreRole[] }, Error, CoreRole[]>({
    queryKey: rolesKey(),
    queryFn: () =>
      http.request<{ items: CoreRole[] }>('/api/v1/roles', {
        headers: authHeaders(header)
      }),
    select: (response) => response.items,
    ...(options ?? {})
  });
};

export const useOrgUnitsQuery = (options?: QueryOverride<{ items: CoreOrgUnit[] }, CoreOrgUnit[]>) => {
  const http = useCoreHttpClient();
  const header = useGatewayBasicAuthHeader();
  return useQuery<{ items: CoreOrgUnit[] }, Error, CoreOrgUnit[]>({
    queryKey: orgUnitsKey(),
    queryFn: () =>
      http.request<{ items: CoreOrgUnit[] }>('/api/v1/org-units', {
        headers: authHeaders(header)
      }),
    select: (response) => response.items,
    ...(options ?? {})
  });
};

export const useCurrentUserQuery = (options?: QueryOverride<CoreCurrentUser, CoreCurrentUser>) => {
  const http = useCoreHttpClient();
  const header = useGatewayBasicAuthHeader();
  return useQuery<CoreCurrentUser, Error, CoreCurrentUser>({
    queryKey: currentUserKey(),
    queryFn: () =>
      http.request<CoreCurrentUser>('/api/v1/auth/me', {
        headers: authHeaders(header)
      }),
    ...(options ?? {})
  });
};

export const useCreateOrgUnitMutation = (
  options?: MutationOverride<CoreOrgUnit, OrgUnitCreateInput>
) => {
  const http = useCoreHttpClient();
  const queryClient = useQueryClient();
  const header = useGatewayBasicAuthHeader();
  const { onSuccess, ...rest } = options ?? {};
  return useMutation({
    mutationFn: async (input: OrgUnitCreateInput) =>
      http.request<CoreOrgUnit>('/api/v1/org-units', {
        method: 'POST',
        body: input,
        headers: authHeaders(header)
      }),
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({ queryKey: orgUnitsKey() });
      onSuccess?.(data, variables, context, undefined as never);
    },
    ...rest
  });
};

export const useUpdateOrgUnitMutation = (
  options?: MutationOverride<CoreOrgUnit, { code: string; payload: OrgUnitUpdateInput }>
) => {
  const http = useCoreHttpClient();
  const queryClient = useQueryClient();
  const header = useGatewayBasicAuthHeader();
  const { onSuccess, ...rest } = options ?? {};
  return useMutation({
    mutationFn: async ({ code, payload }) =>
      http.request<CoreOrgUnit>(`/api/v1/org-units/${code}`, {
        method: 'PUT',
        body: payload,
        headers: authHeaders(header)
      }),
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({ queryKey: orgUnitsKey() });
      onSuccess?.(data, variables, context, undefined as never);
    },
    ...rest
  });
};

export const useDeleteOrgUnitMutation = (
  options?: MutationOverride<null, { code: string }>
) => {
  const http = useCoreHttpClient();
  const queryClient = useQueryClient();
  const header = useGatewayBasicAuthHeader();
  const { onSuccess, ...rest } = options ?? {};
  return useMutation({
    mutationFn: async ({ code }) =>
      http.request<null>(`/api/v1/org-units/${code}`, {
        method: 'DELETE',
        headers: authHeaders(header)
      }),
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({ queryKey: orgUnitsKey() });
      onSuccess?.(data, variables, context, undefined as never);
    },
    ...rest
  });
};

export const useRolePermissionsQuery = (
  roleCode: string,
  options?: QueryOverride<{ items: CoreRolePermission[] }, CoreRolePermission[]>
) => {
  const http = useCoreHttpClient();
  const header = useGatewayBasicAuthHeader();
  return useQuery<{ items: CoreRolePermission[] }, Error, CoreRolePermission[]>({
    queryKey: permissionsKey(roleCode),
    enabled: roleCode.trim().length > 0,
    queryFn: () =>
      http.request<{ items: CoreRolePermission[] }>(`/api/v1/roles/${roleCode}/permissions`, {
        headers: authHeaders(header)
      }),
    select: (response) => response.items,
    ...(options ?? {})
  });
};

const aggregatedPermissionsKey = (roleCodes: string[]) => [
  ...CORE_PREFIX,
  'permissions-aggregate',
  ...roleCodes
] as const;

export const useAggregatedRolePermissionsQuery = (
  roleCodes: string[],
  options?: QueryOverride<CoreRolePermission[], CoreRolePermission[]>
) => {
  const http = useCoreHttpClient();
  const header = useGatewayBasicAuthHeader();
  const normalized = useMemo(() => {
    const unique = new Set<string>();
    roleCodes.forEach((code) => {
      const trimmed = code.trim();
      if (trimmed) {
        unique.add(trimmed.toLowerCase());
      }
    });
    return Array.from(unique).sort();
  }, [roleCodes]);

  return useQuery<CoreRolePermission[], Error, CoreRolePermission[]>({
    queryKey: aggregatedPermissionsKey(normalized),
    enabled: normalized.length > 0,
    queryFn: async () => {
      if (normalized.length === 0) {
        return [];
      }
      const responses = await Promise.all(
        normalized.map((roleCode) =>
          http.request<{ items: CoreRolePermission[] }>(`/api/v1/roles/${roleCode}/permissions`, {
            headers: authHeaders(header)
          })
        )
      );
      return responses.flatMap((response) => response.items);
    },
    ...(options ?? {})
  });
};

export const useUpdateRolePermissionsMutation = (
  options?: MutationOverride<CoreRolePermission[], { roleCode: string; items: CoreRolePermissionInput[] }>
) => {
  const http = useCoreHttpClient();
  const queryClient = useQueryClient();
  const header = useGatewayBasicAuthHeader();
  const { onSuccess, ...rest } = options ?? {};
  return useMutation({
    mutationFn: async ({ roleCode, items }) => {
      const response = await http.request<{ items: CoreRolePermission[] }>(`/api/v1/roles/${roleCode}/permissions`, {
        method: 'PUT',
        body: { items },
        headers: authHeaders(header)
      });
      return response.items;
    },
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({ queryKey: permissionsKey(variables.roleCode) });
      onSuccess?.(data, variables, context, undefined as never);
    },
    ...rest
  });
};

export type CoreRolePermissionInput = {
  resource: string;
  action: string;
  scope: string;
  effect?: string;
  metadata?: Record<string, unknown>;
};

export const useApiTokensQuery = (options?: QueryOverride<{ items: CoreApiToken[] }, CoreApiToken[]>) => {
  const http = useCoreHttpClient();
  const header = useGatewayBasicAuthHeader();
  return useQuery<{ items: CoreApiToken[] }, Error, CoreApiToken[]>({
    queryKey: tokensKey(),
    queryFn: () =>
      http.request<{ items: CoreApiToken[] }>('/api/v1/api-tokens', {
        headers: authHeaders(header)
      }),
    select: (response) => response.items,
    ...(options ?? {})
  });
};

export const useCreateApiTokenMutation = (
  options?: MutationOverride<CoreApiTokenWithSecret, { name: string; roleCode: string; scope?: string }>
) => {
  const http = useCoreHttpClient();
  const queryClient = useQueryClient();
  const header = useGatewayBasicAuthHeader();
  const { onSuccess, ...rest } = options ?? {};
  return useMutation({
    mutationFn: async (payload) =>
      http.request<CoreApiTokenWithSecret>('/api/v1/api-tokens', {
        method: 'POST',
        body: payload,
        headers: authHeaders(header)
      }),
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({ queryKey: tokensKey() });
      onSuccess?.(data, variables, context, undefined as never);
    },
    ...rest
  });
};

export const useRevokeApiTokenMutation = (
  options?: MutationOverride<CoreApiToken, { id: string }>
) => {
  const http = useCoreHttpClient();
  const queryClient = useQueryClient();
  const header = useGatewayBasicAuthHeader();
  const { onSuccess, ...rest } = options ?? {};
  return useMutation({
    mutationFn: async ({ id }) =>
      http.request<CoreApiToken>(`/api/v1/api-tokens/${id}`, {
        method: 'DELETE',
        headers: authHeaders(header)
      }),
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({ queryKey: tokensKey() });
      onSuccess?.(data, variables, context, undefined as never);
    },
    ...rest
  });
};

export const buildBasicAuth = buildBasicAuthHeader;
