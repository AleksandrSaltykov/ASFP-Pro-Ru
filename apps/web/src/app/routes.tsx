import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import { MainLayout } from '@widgets/layout/MainLayout';

const DashboardPage = lazy(() => import('@pages/dashboard/DashboardPage'));
const LoginPage = lazy(() => import('@pages/login/LoginPage'));
const DealsPage = lazy(() => import('@pages/crm/DealsPage'));
const InventoryPage = lazy(() => import('@pages/wms/InventoryPage'));
const FilesPage = lazy(() => import('@pages/files/FilesPage'));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'crm/deals', element: <DealsPage /> },
      { path: 'wms/inventory', element: <InventoryPage /> },
      { path: 'files', element: <FilesPage /> }
    ]
  },
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '*',
    element: <Navigate to="/" replace />
  }
]);
