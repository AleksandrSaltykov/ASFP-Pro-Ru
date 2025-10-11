import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { API_ENDPOINTS } from './endpoints';

export type StatusHealth = 'online' | 'degraded' | 'offline';

export type SystemStatusItem = {
  id: string;
  label: string;
  health: StatusHealth;
  scope: 'service' | 'dependency';
  details?: string;
};

type SystemStatusResponse = z.infer<typeof responseSchema>;

const itemSchema = z.object({
  id: z.string(),
  label: z.string(),
  scope: z.union([z.literal('service'), z.literal('dependency')]),
  health: z.union([z.literal('online'), z.literal('degraded'), z.literal('offline')]),
  details: z.string().optional()
});

const responseSchema = z.object({
  services: z.array(itemSchema),
  dependencies: z.array(itemSchema),
  updatedAt: z.string().optional()
});

const fetchSystemStatus = async (): Promise<SystemStatusResponse> => {
  const response = await fetch(`${API_ENDPOINTS.gateway}/api/v1/system/status`, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch system status: ${response.status} ${response.statusText}`.trim());
  }

  const payload = await response.json();
  return responseSchema.parse(payload);
};

export const useSystemStatus = () => {
  const query = useQuery({
    queryKey: ['system-status'],
    queryFn: fetchSystemStatus,
    refetchInterval: 30000,
    staleTime: 25000
  });

  const grouped = useMemo(() => {
    return {
      services: query.data?.services ?? [],
      dependencies: query.data?.dependencies ?? []
    };
  }, [query.data]);

  const updatedAt = useMemo(() => {
    if (!query.data?.updatedAt) {
      return null;
    }
    const parsed = new Date(query.data.updatedAt);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, [query.data?.updatedAt]);

  return {
    ...query,
    grouped,
    updatedAt
  };
};
