import { configureStore } from "@reduxjs/toolkit";

import { authSlice } from "@shared/api/auth-slice";
import { uiSlice } from "@shared/state/ui-slice";

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    ui: uiSlice.reducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
