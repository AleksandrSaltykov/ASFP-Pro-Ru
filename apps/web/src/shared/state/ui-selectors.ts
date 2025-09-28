import type { RootState } from "@app/providers/store";

import type { FeatureFlagKey, UiFeatureState } from "./ui-slice";

const normalizeRoles = (roles: string[]) => roles.map((role) => role.trim().toLowerCase());

const resolveFeatureFlag = (
  uiState: UiFeatureState,
  flag: FeatureFlagKey,
  userRoles: string[]
): boolean => {
  const override = uiState.featureFlags.overrides[flag];
  if (override !== undefined) {
    return override;
  }

  const normalizedRoles = normalizeRoles(userRoles);
  const allowedRoles = uiState.featureFlags.roleAccess[flag] ?? [];
  const allowedNormalized = allowedRoles.map((item) => item.trim().toLowerCase());

  if (normalizedRoles.some((role) => allowedNormalized.includes(role))) {
    return true;
  }

  return uiState.featureFlags.defaults[flag] ?? false;
};

export const selectUiState = (state: RootState) => state.ui;

export const selectIsFeatureEnabled = (state: RootState, flag: FeatureFlagKey): boolean => {
  const roles = state.auth.user?.roles ?? [];
  return resolveFeatureFlag(state.ui, flag, roles);
};

export const selectUiFavorites = (state: RootState) => state.ui.favorites;

export const selectUiRecent = (state: RootState) => state.ui.recent;

export const selectTileFavorites = (state: RootState) => state.ui.favoriteTiles;

export const selectProcessCounters = (state: RootState) => state.ui.process.counters;

export const selectKioskQueue = (state: RootState) => state.ui.kiosk.queue;

export const featureSelectors = {
  resolveFeatureFlag,
  normalizeRoles
};
