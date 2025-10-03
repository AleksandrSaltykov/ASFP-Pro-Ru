import { useMemo } from 'react';

const encode = (credentials?: string) => {
  const trimmed = credentials?.trim();
  if (!trimmed) {
    return undefined;
  }
  if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
    return `Basic ${window.btoa(trimmed)}`;
  }
  // Fallback for environments without btoa (e.g. SSR/tests)
  try {
    const buffer = typeof Buffer !== 'undefined' ? Buffer.from(trimmed, 'utf-8') : null;
    if (buffer) {
      return `Basic ${buffer.toString('base64')}`;
    }
  } catch (error) {
    console.warn('Failed to encode basic auth credentials:', error);
  }
  return undefined;
};

export const buildBasicAuthHeader = (credentials?: string) => encode(credentials);

export const useGatewayBasicAuthHeader = () => {
  const credentials = import.meta.env.VITE_GATEWAY_BASIC_AUTH as string | undefined;
  return useMemo(() => encode(credentials), [credentials]);
};
