import { PropsWithChildren } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { queryClient } from './query-client';
import { store } from './store';

export const AppProviders = ({ children }: PropsWithChildren) => (
  <ReduxProvider store={store}>
    <QueryClientProvider client={queryClient}>
      {children}
      {import.meta.env.DEV ? (
        <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
      ) : null}
    </QueryClientProvider>
  </ReduxProvider>
);
