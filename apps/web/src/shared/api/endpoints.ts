export const API_ENDPOINTS = {
  gateway: import.meta.env.VITE_GATEWAY_URL ?? 'http://localhost:8080',
  crm: import.meta.env.VITE_CRM_URL ?? 'http://localhost:8081',
  wms: import.meta.env.VITE_WMS_URL ?? 'http://localhost:8082'
} as const;
