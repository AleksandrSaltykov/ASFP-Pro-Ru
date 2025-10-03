import { useCallback, useMemo } from 'react';

import {
  useAggregatedRolePermissionsQuery,
  useCurrentUserQuery,
  type CoreRolePermission
} from '@shared/api/core';

type PermissionDescriptor = {
  resource: string;
  action: string;
};

const buildPermissionSet = (permissions: CoreRolePermission[]) => {
  const set = new Set<string>();
  permissions.forEach((permission) => {
    if (permission.effect.toLowerCase() !== 'allow') {
      return;
    }
    const resource = permission.resource.trim().toLowerCase();
    const action = permission.action.trim().toLowerCase();
    if (!resource || !action) {
      return;
    }
    set.add(`${resource}:${action}`);
    if (resource === '*') {
      set.add(`*:${action}`);
    }
    if (action === '*') {
      set.add(`${resource}:*`);
    }
    if (resource === '*' && action === '*') {
      set.add('*:*');
    }
  });
  return set;
};

const checkPermission = (set: Set<string>, descriptor: PermissionDescriptor) => {
  const resource = descriptor.resource.trim().toLowerCase();
  const action = descriptor.action.trim().toLowerCase();
  if (!resource || !action) {
    return false;
  }
  return (
    set.has('*:*') ||
    set.has(`${resource}:${action}`) ||
    set.has(`${resource}:*`) ||
    set.has(`*:${action}`)
  );
};

export const usePermissionMatrix = () => {
  const currentUserQuery = useCurrentUserQuery();

  const currentUser = currentUserQuery.data;

  const roleCodes = useMemo(() => {
    if (!currentUser) {
      return [] as string[];
    }
    return currentUser.roles.map((role) => role.code);
  }, [currentUser]);

  const permissionsQuery = useAggregatedRolePermissionsQuery(roleCodes);

  const permissionSet = useMemo(() => {
    if (!permissionsQuery.data) {
      return new Set<string>();
    }
    return buildPermissionSet(permissionsQuery.data);
  }, [permissionsQuery.data]);

  const hasPermission = useCallback(
    (resource: string, action: string) => checkPermission(permissionSet, { resource, action }),
    [permissionSet]
  );

  const isLoading = currentUserQuery.isLoading || permissionsQuery.isLoading;
  const error = currentUserQuery.error ?? permissionsQuery.error ?? null;

  return {
    isLoading,
    isError: Boolean(currentUserQuery.error || permissionsQuery.error),
    error,
    hasPermission
  };
};

export type UsePermissionMatrixResult = ReturnType<typeof usePermissionMatrix>;

export const useHasPermission = (descriptor: PermissionDescriptor) => {
  const { hasPermission, isLoading } = usePermissionMatrix();
  return {
    isLoading,
    allowed: hasPermission(descriptor.resource, descriptor.action)
  };
};
