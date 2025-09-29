import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { API_ENDPOINTS } from '@shared/api/endpoints';
import { createHttpClient } from '@shared/api/http-client';

export type WmsHttpClient = ReturnType<typeof createHttpClient>;

export const useWmsHttpClient = () => {
  const queryClient = useQueryClient();
  return useMemo(() => createHttpClient(API_ENDPOINTS.wms, queryClient), [queryClient]);
};
