import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useGatewayBasicAuthHeader } from '@shared/api/basic-auth';
import { API_ENDPOINTS } from '@shared/api/endpoints';
import { createHttpClient } from '@shared/api/http-client';

export type WmsHttpClient = ReturnType<typeof createHttpClient>;

export const useWmsHttpClient = (): WmsHttpClient => {
  const queryClient = useQueryClient();
  const authHeader = useGatewayBasicAuthHeader();

  const base = useMemo(() => createHttpClient(API_ENDPOINTS.wms, queryClient), [queryClient]);

  return useMemo(() => {
    const request: WmsHttpClient['request'] = (path, config) =>
      base.request(path, {
        ...(config ?? {}),
        headers: {
          ...((config?.headers) ?? {}),
          ...(authHeader ? { Authorization: authHeader } : {})
        }
      });

    return {
      request,
      invalidate: base.invalidate
    };
  }, [base, authHeader]);
};
