import { setupWorker } from 'msw/browser';

export const worker = setupWorker();

export const enableMocks = async () => {
  if (import.meta.env.DEV) {
    await worker.start({ onUnhandledRequest: 'bypass' });
  }
};
