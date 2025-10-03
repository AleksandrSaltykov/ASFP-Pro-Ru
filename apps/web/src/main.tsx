import '@shared/ui/theme.css';
import React from 'react';
import ReactDOM from 'react-dom/client';

import { AppProviders } from '@app/providers';
import { App } from '@app/App';

const shouldEnableMocks = () => {
  if (import.meta.env.VITE_ENABLE_MSW === 'true') {
    return true;
  }
  if (import.meta.env.VITE_ENABLE_MSW === 'false') {
    return false;
  }
  return import.meta.env.DEV;
};

const enableMocks = async () => {
  if (!shouldEnableMocks()) {
    return;
  }
  const { enableMocks: startWorker } = await import('@shared/api/mocks/browser');
  await startWorker();
};

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element not found');
}

enableMocks().finally(() => {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <AppProviders>
        <App />
      </AppProviders>
    </React.StrictMode>,
  );
});
