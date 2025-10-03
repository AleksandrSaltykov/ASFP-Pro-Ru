import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { API_ENDPOINTS } from '../endpoints';
import { createHttpClient } from '../http-client';

export type GatewayHttpClient = ReturnType<typeof createHttpClient>;

export const useGatewayHttpClient = () => {
  const queryClient = useQueryClient();
  return useMemo(() => createHttpClient(API_ENDPOINTS.gateway, queryClient), [queryClient]);
};
