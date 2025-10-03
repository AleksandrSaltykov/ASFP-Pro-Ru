import type { ReactNode } from 'react';

import { usePermissionMatrix } from '@shared/hooks/usePermissionMatrix';

export type PermissionRequirement = {
  resource: string;
  action: string;
};

type PermissionGuardProps = {
  permissions: PermissionRequirement[];
  fallback?: ReactNode;
  children: ReactNode;
};

export const PermissionGuard = ({ permissions, fallback, children }: PermissionGuardProps) => {
  const { hasPermission, isLoading, isError, error } = usePermissionMatrix();

  if (isLoading) {
    return <div>Загрузка прав доступа…</div>;
  }

  if (isError) {
    if (import.meta.env.DEV) {
      console.warn('Permission check failed, falling back to optimistic access:', error);
    }
    return <>{fallback ?? children}</>;
  }

  const allowed = permissions.every((requirement) =>
    hasPermission(requirement.resource, requirement.action)
  );

  if (!allowed) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return <div>Недостаточно прав для просмотра этого раздела.</div>;
  }

  return <>{children}</>;
};

