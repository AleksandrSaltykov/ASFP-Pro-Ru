import { setupWorker } from 'msw/browser';

import { handlers } from './handlers';

export const worker = setupWorker(...handlers);

export const enableMocks = async () => {
  if (import.meta.env.VITE_ENABLE_MSW === 'true') {
    await worker.start({ onUnhandledRequest: 'bypass' });
  }
};
