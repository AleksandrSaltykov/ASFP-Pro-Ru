import { createAction, createSlice, nanoid, PayloadAction } from "@reduxjs/toolkit";

export type FeatureFlagKey = "ui.viz_revamp" | "ui.warehouse.rebuild";

type FeatureFlagState = {
  defaults: Record<FeatureFlagKey, boolean>;
  overrides: Partial<Record<FeatureFlagKey, boolean>>;
  roleAccess: Record<FeatureFlagKey, string[]>;
};

export type KioskQueueItem = {
  id: string;
  type: "scan" | "status";
  payload: Record<string, unknown>;
  createdAt: string;
};

export type UiState = {
  featureFlags: FeatureFlagState;
  recent: string[];
  favorites: string[];
  favoriteTiles: string[];
  kiosk: {
    queue: KioskQueueItem[];
  };
  process: {
    counters: Record<string, number>;
  };
};

export const toggleTileFavorite = createAction<string>("ui/toggleTileFavorite");

const MAX_RECENT = 12;

const initialState: UiState = {
  featureFlags: {
    defaults: {
      "ui.viz_revamp": false,
      "ui.warehouse.rebuild": true
    },
    overrides: {},
    roleAccess: {
      "ui.viz_revamp": ["ui-tester"],
      "ui.warehouse.rebuild": []
    }
  },
  recent: ["/sales", "/directories", "/orders/demo"],
  favorites: ["/sales"],
  favoriteTiles: ["tile:create-quote"],
  kiosk: {
    queue: []
  },
  process: {
    counters: {
      lead: 18,
      proposal: 12,
      order: 9,
      design: 6,
      approval: 10,
      plan: 4,
      production: 14,
      qc: 5,
      delivery: 3,
      install: 2,
      act: 7
    }
  }
};

const ensureRecent = (items: string[], payload: string) => {
  const next = items.filter((item) => item !== payload);
  next.unshift(payload);
  if (next.length > MAX_RECENT) {
    next.length = MAX_RECENT;
  }
  return next;
};

export const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    addRecent(state, action: PayloadAction<string>) {
      state.recent = ensureRecent(state.recent, action.payload);
    },
    toggleFavorite(state, action: PayloadAction<string>) {
      const target = action.payload;
      if (state.favorites.includes(target)) {
        state.favorites = state.favorites.filter((item) => item !== target);
      } else {
        state.favorites = [...state.favorites, target];
      }
    },
    setFeatureFlagOverride(state, action: PayloadAction<{ flag: FeatureFlagKey; value: boolean }>) {
      const { flag, value } = action.payload;
      state.featureFlags.overrides[flag] = value;
    },
    clearFeatureFlagOverride(state, action: PayloadAction<FeatureFlagKey>) {
      const flag = action.payload;
      delete state.featureFlags.overrides[flag];
    },
    setFeatureFlagRoles(state, action: PayloadAction<{ flag: FeatureFlagKey; roles: string[] }>) {
      const { flag, roles } = action.payload;
      state.featureFlags.roleAccess[flag] = roles;
    },
    enqueueKioskEvent(
      state,
      action: PayloadAction<{ type: KioskQueueItem["type"]; payload: Record<string, unknown> }>
    ) {
      state.kiosk.queue.push({
        id: nanoid(),
        type: action.payload.type,
        payload: action.payload.payload,
        createdAt: new Date().toISOString()
      });
    },
    dequeueKioskEvent(state) {
      state.kiosk.queue.shift();
    },
    setProcessCounter(state, action: PayloadAction<{ stage: string; value: number }>) {
      const { stage, value } = action.payload;
      state.process.counters[stage] = value;
    }
  },
  extraReducers: (builder) => {
    builder.addCase(toggleTileFavorite, (state, action) => {
      const tileId = action.payload;
      if (state.favoriteTiles.includes(tileId)) {
        state.favoriteTiles = state.favoriteTiles.filter((item) => item !== tileId);
      } else {
        state.favoriteTiles = [...state.favoriteTiles, tileId];
      }
    });
  }
});

export const {
  addRecent,
  toggleFavorite,
  setFeatureFlagOverride,
  clearFeatureFlagOverride,
  setFeatureFlagRoles,
  enqueueKioskEvent,
  dequeueKioskEvent,
  setProcessCounter
} = uiSlice.actions;

export type { UiState as UiFeatureState };

