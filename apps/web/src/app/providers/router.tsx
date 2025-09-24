import { Suspense } from 'react';
import { RouterProvider } from 'react-router-dom';

import { router } from '../routes';
import { PageLoader } from '@shared/ui/PageLoader';

export const AppRouter = () => (
  <Suspense fallback={<PageLoader />}>
    <RouterProvider router={router} />
  </Suspense>
);
