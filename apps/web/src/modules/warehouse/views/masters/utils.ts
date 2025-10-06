const OFFLINE_MODE = import.meta.env.VITE_ENABLE_OFFLINE === 'true';

export const normalizeSearch = (value: string) => value.trim().toLowerCase();

export const formatDateTime = (value: string) => {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return value;
  }
  return new Date(timestamp).toLocaleString('ru-RU');
};

export const formatBoolean = (value: boolean | null | undefined) => (value ? 'Да' : 'Нет');

export const shouldUseFallback = (error: unknown): boolean => {
  if (!error) {
    return false;
  }

  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();

  if (OFFLINE_MODE) {
    if (normalized.includes('failed to fetch') || normalized.includes('network') || normalized.includes('offline')) {
      return true;
    }
  }

  return (
    normalized.includes('недостаточно прав') ||
    normalized.includes('forbidden') ||
    normalized.includes('status code 403') ||
    normalized.includes('403')
  );
};
