import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { authSlice } from '@shared/api/auth-slice';
import { uiSlice } from '@shared/state/ui-slice';

import DashboardPage from './DashboardPage';

const createStore = () =>
  configureStore({
    reducer: {
      auth: authSlice.reducer,
      ui: uiSlice.reducer
    }
  });

describe('DashboardPage', () => {
  it('renders legacy welcome for non-revamp users', () => {
    const store = createStore();

    render(
      <Provider store={store}>
        <DashboardPage />
      </Provider>
    );

    expect(screen.getByText(/Добро пожаловать в ASFP-Pro/i)).toBeInTheDocument();
  });
});
