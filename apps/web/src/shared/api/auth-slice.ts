import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type AuthState = {
  status: 'anonymous' | 'authenticated';
  user?: {
    email: string;
    name: string;
    roles: string[];
  };
};

const initialState: AuthState = {
  status: 'anonymous'
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    signedIn(state, action: PayloadAction<AuthState['user']>) {
      state.status = 'authenticated';
      state.user = action.payload;
    },
    signedOut(state) {
      state.status = 'anonymous';
      state.user = undefined;
    }
  }
});

export const { signedIn, signedOut } = authSlice.actions;
