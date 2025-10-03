import { useMemo } from 'react';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

import { type GatewayHttpClient, useGatewayHttpClient } from '../gateway';
import type { DocsDocument, DocsListResponse, DocsSigner, DocsTemplate } from './types';

const DOCS_PREFIX = ['docs'] as const;

const templatesKey = (limit: number) => [...DOCS_PREFIX, 'templates', limit] as const;
const signersKey = (limit: number) => [...DOCS_PREFIX, 'signers', limit] as const;
const documentsKey = (limit: number, status: string) => [...DOCS_PREFIX, 'documents', limit, status || 'all'] as const;

type QueryOptionsOverride<TQueryFnData, TData> = Omit<
  UseQueryOptions<TQueryFnData, Error, TData>,
  'queryKey' | 'queryFn'
>;

type TemplateQueryParams = {
  limit?: number;
};

type SignerQueryParams = {
  limit?: number;
};

type DocumentQueryParams = {
  limit?: number;
  status?: string;
};

const buildTemplatesQuery = (
  http: GatewayHttpClient,
  params: Required<TemplateQueryParams>,
  options?: QueryOptionsOverride<DocsListResponse<DocsTemplate>, DocsTemplate[]>
) => ({
  queryKey: templatesKey(params.limit),
  queryFn: () =>
    http.request<DocsListResponse<DocsTemplate>>('/api/v1/docs/templates', {
      query: { limit: String(params.limit) }
    }),
  select: (response: DocsListResponse<DocsTemplate>) => response.items,
  ...(options ?? {})
}) satisfies UseQueryOptions<DocsListResponse<DocsTemplate>, Error, DocsTemplate[]>;

const buildSignersQuery = (
  http: GatewayHttpClient,
  params: Required<SignerQueryParams>,
  options?: QueryOptionsOverride<DocsListResponse<DocsSigner>, DocsSigner[]>
) => ({
  queryKey: signersKey(params.limit),
  queryFn: () =>
    http.request<DocsListResponse<DocsSigner>>('/api/v1/docs/signers', {
      query: { limit: String(params.limit) }
    }),
  select: (response: DocsListResponse<DocsSigner>) => response.items,
  ...(options ?? {})
}) satisfies UseQueryOptions<DocsListResponse<DocsSigner>, Error, DocsSigner[]>;

const buildDocumentsQuery = (
  http: GatewayHttpClient,
  params: Required<DocumentQueryParams>,
  options?: QueryOptionsOverride<DocsListResponse<DocsDocument>, DocsDocument[]>
) => {
  const queryParams: Record<string, string> = {
    limit: String(params.limit)
  };
  if (params.status) {
    queryParams.status = params.status;
  }

  return {
    queryKey: documentsKey(params.limit, params.status),
    queryFn: () =>
      http.request<DocsListResponse<DocsDocument>>('/api/v1/docs/documents', {
        query: queryParams
      }),
    select: (response: DocsListResponse<DocsDocument>) => response.items,
    ...(options ?? {})
  } satisfies UseQueryOptions<DocsListResponse<DocsDocument>, Error, DocsDocument[]>;
};

export const useDocsTemplatesQuery = (
  { limit = 20 }: TemplateQueryParams = {},
  options?: QueryOptionsOverride<DocsListResponse<DocsTemplate>, DocsTemplate[]>
) => {
  const http = useGatewayHttpClient();
  const queryConfig = useMemo(() => buildTemplatesQuery(http, { limit }, options), [http, limit, options]);
  return useQuery(queryConfig);
};

export const useDocsSignersQuery = (
  { limit = 20 }: SignerQueryParams = {},
  options?: QueryOptionsOverride<DocsListResponse<DocsSigner>, DocsSigner[]>
) => {
  const http = useGatewayHttpClient();
  const queryConfig = useMemo(() => buildSignersQuery(http, { limit }, options), [http, limit, options]);
  return useQuery(queryConfig);
};

export const useDocsDocumentsQuery = (
  { limit = 20, status = '' }: DocumentQueryParams = {},
  options?: QueryOptionsOverride<DocsListResponse<DocsDocument>, DocsDocument[]>
) => {
  const http = useGatewayHttpClient();
  const queryConfig = useMemo(
    () => buildDocumentsQuery(http, { limit, status }, options),
    [http, limit, status, options]
  );
  return useQuery(queryConfig);
};
