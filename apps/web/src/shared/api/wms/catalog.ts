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
  AttributeTemplate,
  CatalogLink,
  CatalogLinkPayload,
  CatalogNode,
  CatalogNodePayload,
  Item,
  ItemPayload,
  PaginatedResponse
} from './types';

const CATALOG_PREFIX = ['wms', 'catalog'] as const;

const catalogListKey = (catalogType: string) => [...CATALOG_PREFIX, 'nodes', catalogType] as const;
const attributeTemplatesKey = (targetType: string) => [...CATALOG_PREFIX, 'attribute-templates', targetType] as const;
const itemListKey = [...CATALOG_PREFIX, 'items'] as const;
const invalidateAttributeTemplates = (http: Http, targetType?: string) =>
  http.invalidate(attributeTemplatesKey(targetType || 'item'));
const itemDetailsKey = (itemId: string) => [...CATALOG_PREFIX, 'items', itemId] as const;
const itemDetailsDisabledKey = [...CATALOG_PREFIX, 'items', 'detail-disabled'] as const;
const catalogLinksKey = (leftType: string, leftId: string) => [...CATALOG_PREFIX, 'links', leftType, leftId] as const;
const catalogLinksDisabledKey = [...CATALOG_PREFIX, 'links', 'disabled'] as const;

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

type CreateCatalogNodeVariables = {
  catalogType: string;
  payload: CatalogNodePayload;
};

type UpdateCatalogNodeVariables = {
  catalogType: string;
  nodeId: string;
  payload: CatalogNodePayload;
};

type DeleteCatalogNodeVariables = {
  catalogType: string;
  nodeId: string;
};

type CreateAttributeTemplateVariables = {
  targetType?: string;
  payload: AttributeTemplatePayload;
};

type UpdateAttributeTemplateVariables = {
  templateId: string;
  targetType?: string;
  payload: AttributeTemplatePayload;
};

type DeleteAttributeTemplateVariables = {
  templateId: string;
  targetType?: string;
};

type UpdateItemVariables = {
  itemId: string;
  payload: ItemPayload;
};

type DeleteItemVariables = {
  itemId: string;
};

type ReplaceCatalogLinksVariables = {
  leftType: string;
  leftId: string;
  payload: CatalogLinkPayload[];
};

const useCatalogHttpClient = (): Http => {
  const queryClient = useQueryClient();
  return useMemo(() => createHttpClient(API_ENDPOINTS.wms, queryClient), [queryClient]);
};

const invalidateCatalogNodes = (http: Http, catalogType: string) =>
  http.invalidate(catalogListKey(catalogType));
const invalidateItems = (http: Http) => http.invalidate(itemListKey);
const invalidateItemDetails = (http: Http, itemId: string) =>
  http.invalidate(itemDetailsKey(itemId));
const invalidateCatalogLinks = (http: Http, leftType: string, leftId: string) =>
  http.invalidate(catalogLinksKey(leftType, leftId));

export const useCatalogNodesQuery = (
  catalogType: string,
  options?: QueryOptionsOverride<PaginatedResponse<CatalogNode>, CatalogNode[]>
) => {
  const http = useCatalogHttpClient();
  return useQuery({
    queryKey: catalogListKey(catalogType),
    queryFn: () =>
      http.request<PaginatedResponse<CatalogNode>>(`/api/v1/master-data/catalog/${catalogType}`),
    enabled: Boolean(catalogType),
    select: (response) => response.items,
    ...(options ?? {})
  });
};

export const useCreateCatalogNodeMutation = (
  options?: MutationOptionsOverride<CatalogNode, CreateCatalogNodeVariables>
) => {
  const http = useCatalogHttpClient();
  const { onSuccess, ...rest } = options ?? {};
  return useMutation({
    mutationFn: ({ catalogType, payload }: CreateCatalogNodeVariables) =>
      http.request<CatalogNode>(`/api/v1/master-data/catalog/${catalogType}`, {
        method: 'POST',
        body: payload
      }),
    onSuccess: async (data, variables, context) => {
      await invalidateCatalogNodes(http, variables.catalogType);
      onSuccess?.(data, variables, context, undefined as never);
    },
    ...rest
  });
};

export const useUpdateCatalogNodeMutation = (
  options?: MutationOptionsOverride<CatalogNode, UpdateCatalogNodeVariables>
) => {
  const http = useCatalogHttpClient();
  const { onSuccess, ...rest } = options ?? {};
  return useMutation({
    mutationFn: ({ catalogType, nodeId, payload }: UpdateCatalogNodeVariables) =>
      http.request<CatalogNode>(`/api/v1/master-data/catalog/${catalogType}/${nodeId}`, {
        method: 'PUT',
        body: payload
      }),
    onSuccess: async (data, variables, context) => {
      await invalidateCatalogNodes(http, variables.catalogType);
      onSuccess?.(data, variables, context, undefined as never);
    },
    ...rest
  });
};

export const useDeleteCatalogNodeMutation = (
  options?: MutationOptionsOverride<null, DeleteCatalogNodeVariables>
) => {
  const http = useCatalogHttpClient();
  const { onSuccess, ...rest } = options ?? {};
  return useMutation({
    mutationFn: ({ catalogType, nodeId }: DeleteCatalogNodeVariables) =>
      http.request<null>(`/api/v1/master-data/catalog/${catalogType}/${nodeId}`, {
        method: 'DELETE'
      }),
    onSuccess: async (data, variables, context) => {
      await invalidateCatalogNodes(http, variables.catalogType);
      onSuccess?.(data, variables, context, undefined as never);
    },
    ...rest
  });
};

export const useCreateAttributeTemplateMutation = (
  options?: MutationOptionsOverride<AttributeTemplate, CreateAttributeTemplateVariables>
) => {
  const http = useCatalogHttpClient();
  const { onSuccess, ...rest } = options ?? {};
  return useMutation({
    mutationFn: ({ targetType, payload }: CreateAttributeTemplateVariables) => {
      const target = targetType ?? payload.targetType ?? 'item';
      return http.request<AttributeTemplate>('/api/v1/master-data/attribute-templates', {
        method: 'POST',
        body: { ...payload, targetType: target }
      });
    },
    onSuccess: async (data, variables, context) => {
      const target = variables.targetType ?? variables.payload.targetType ?? 'item';
      await invalidateAttributeTemplates(http, target);
      onSuccess?.(data, variables, context, undefined as never);
    },
    ...rest
  });
};

export const useUpdateAttributeTemplateMutation = (
  options?: MutationOptionsOverride<AttributeTemplate, UpdateAttributeTemplateVariables>
) => {
  const http = useCatalogHttpClient();
  const { onSuccess, ...rest } = options ?? {};
  return useMutation({
    mutationFn: ({ templateId, targetType, payload }: UpdateAttributeTemplateVariables) => {
      const target = targetType ?? payload.targetType ?? 'item';
      return http.request<AttributeTemplate>(`/api/v1/master-data/attribute-templates/${templateId}`, {
        method: 'PUT',
        body: { ...payload, targetType: target }
      });
    },
    onSuccess: async (data, variables, context) => {
      const target = variables.targetType ?? variables.payload.targetType ?? 'item';
      await invalidateAttributeTemplates(http, target);
      onSuccess?.(data, variables, context, undefined as never);
    },
    ...rest
  });
};

export const useDeleteAttributeTemplateMutation = (
  options?: MutationOptionsOverride<null, DeleteAttributeTemplateVariables>
) => {
  const http = useCatalogHttpClient();
  const { onSuccess, ...rest } = options ?? {};
  return useMutation({
    mutationFn: ({ templateId }: DeleteAttributeTemplateVariables) =>
      http.request<null>(`/api/v1/master-data/attribute-templates/${templateId}`, {
        method: 'DELETE'
      }),
    onSuccess: async (data, variables, context) => {
      const target = variables.targetType ?? 'item';
      await invalidateAttributeTemplates(http, target);
      onSuccess?.(data, variables, context, undefined as never);
    },
    ...rest
  });
};

export const useAttributeTemplatesQuery = (
  targetType = 'item',
  options?: QueryOptionsOverride<PaginatedResponse<AttributeTemplate>, AttributeTemplate[]>
) => {
  const http = useCatalogHttpClient();
  return useQuery({
    queryKey: attributeTemplatesKey(targetType),
    queryFn: () =>
      http.request<PaginatedResponse<AttributeTemplate>>('/api/v1/master-data/attribute-templates', {
        query: targetType ? { target: targetType } : undefined
      }),
    select: (response) => response.items,
    ...(options ?? {})
  });
};

export const useItemsQuery = (
  options?: QueryOptionsOverride<PaginatedResponse<Item>, Item[]>
) => {
  const http = useCatalogHttpClient();
  return useQuery({
    queryKey: itemListKey,
    queryFn: () => http.request<PaginatedResponse<Item>>('/api/v1/master-data/items'),
    select: (response) => response.items,
    ...(options ?? {})
  });
};

export const useItemDetailsQuery = (
  itemId: string | undefined,
  options?: QueryOptionsOverride<Item, Item>
) => {
  const http = useCatalogHttpClient();
  const enabled = Boolean(itemId);
  return useQuery({
    queryKey: enabled ? itemDetailsKey(itemId!) : itemDetailsDisabledKey,
    queryFn: () => http.request<Item>(`/api/v1/master-data/items/${itemId}`),
    enabled,
    ...(options ?? {})
  });
};

export const useCreateItemMutation = (
  options?: MutationOptionsOverride<Item, ItemPayload>
) => {
  const http = useCatalogHttpClient();
  const { onSuccess, ...rest } = options ?? {};
  return useMutation({
    mutationFn: (payload: ItemPayload) =>
      http.request<Item>('/api/v1/master-data/items', {
        method: 'POST',
        body: payload
      }),
    onSuccess: async (data, variables, context) => {
      await invalidateItems(http);
      onSuccess?.(data, variables, context, undefined as never);
    },
    ...rest
  });
};

export const useUpdateItemMutation = (
  options?: MutationOptionsOverride<Item, UpdateItemVariables>
) => {
  const http = useCatalogHttpClient();
  const { onSuccess, ...rest } = options ?? {};
  return useMutation({
    mutationFn: ({ itemId, payload }: UpdateItemVariables) =>
      http.request<Item>(`/api/v1/master-data/items/${itemId}`, {
        method: 'PUT',
        body: payload
      }),
    onSuccess: async (data, variables, context) => {
      await Promise.all([
        invalidateItems(http),
        invalidateItemDetails(http, variables.itemId)
      ]);
      onSuccess?.(data, variables, context, undefined as never);
    },
    ...rest
  });
};

export const useDeleteItemMutation = (
  options?: MutationOptionsOverride<null, DeleteItemVariables>
) => {
  const http = useCatalogHttpClient();
  const { onSuccess, ...rest } = options ?? {};
  return useMutation({
    mutationFn: ({ itemId }: DeleteItemVariables) =>
      http.request<null>(`/api/v1/master-data/items/${itemId}`, {
        method: 'DELETE'
      }),
    onSuccess: async (data, variables, context) => {
      await Promise.all([
        invalidateItems(http),
        invalidateItemDetails(http, variables.itemId)
      ]);
      onSuccess?.(data, variables, context, undefined as never);
    },
    ...rest
  });
};

export const useCatalogLinksQuery = (
  leftType: string | undefined,
  leftId: string | undefined,
  options?: QueryOptionsOverride<PaginatedResponse<CatalogLink>, CatalogLink[]>
) => {
  const http = useCatalogHttpClient();
  const enabled = Boolean(leftType && leftId);
  return useQuery({
    queryKey: enabled ? catalogLinksKey(leftType!, leftId!) : catalogLinksDisabledKey,
    queryFn: () =>
      http.request<PaginatedResponse<CatalogLink>>(
        `/api/v1/master-data/catalog-links/${leftType}/${leftId}`
      ),
    enabled,
    select: (response) => response.items,
    ...(options ?? {})
  });
};

export const useReplaceCatalogLinksMutation = (
  options?: MutationOptionsOverride<null, ReplaceCatalogLinksVariables>
) => {
  const http = useCatalogHttpClient();
  const { onSuccess, ...rest } = options ?? {};
  return useMutation({
    mutationFn: ({ leftType, leftId, payload }: ReplaceCatalogLinksVariables) =>
      http.request<null>(`/api/v1/master-data/catalog-links/${leftType}/${leftId}`, {
        method: 'PUT',
        body: payload
      }),
    onSuccess: async (data, variables, context) => {
      await invalidateCatalogLinks(http, variables.leftType, variables.leftId);
      onSuccess?.(data, variables, context, undefined as never);
    },
    ...rest
  });
};
