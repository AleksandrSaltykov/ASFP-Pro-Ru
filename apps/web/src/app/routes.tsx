import { lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

import { MainLayout } from "@widgets/layout/MainLayout";
import { WAREHOUSE_PLACEHOLDER_ROUTES } from "@pages/warehouse/structure";

const DashboardPage = lazy(() => import("@pages/dashboard/DashboardPage"));
const LoginPage = lazy(() => import("@pages/login/LoginPage"));
const DealsPage = lazy(() => import("@pages/crm/DealsPage"));
const FilesPage = lazy(() => import("@pages/files/FilesPage"));
const TasksProjectsPage = lazy(() => import("@pages/tasks/TasksProjectsPage"));
const HrOrgStructurePage = lazy(() => import("@pages/hr/HrOrgStructurePage"));
const MessengerPage = lazy(() => import("@pages/messenger/MessengerPage"));
const ServicesPage = lazy(() => import("@pages/services/ServicesPage"));
const ProductionPage = lazy(() => import("@pages/production/ProductionPage"));
const LogisticsPage = lazy(() => import("@pages/logistics/LogisticsPage"));
const SettingsPage = lazy(() => import("@pages/settings/SettingsPage"));
const DirectoriesPage = lazy(() => import("@pages/directories/DirectoriesPage"));
const HomeExecPage = lazy(() => import("@pages/home-exec/HomeExecPage"));
const SalesLaunchpadPage = lazy(() => import("@pages/sales/SalesLaunchpadPage"));
const OrderDetailsPage = lazy(() => import("@pages/orders/OrderDetailsPage"));
const KioskPage = lazy(() => import("@pages/kiosk/KioskPage"));
const AuditLogPage = lazy(() => import("@pages/admin/AuditLogPage"));
const OrgUnitsPage = lazy(() => import("@pages/admin/OrgUnitsPage"));
const ApiTokensPage = lazy(() => import("@pages/admin/ApiTokensPage"));
const WarehouseModule = lazy(() => import("@pages/warehouse/WarehouseModule"));
const WarehousePlaceholderPage = lazy(() => import("@pages/warehouse/PlaceholderPage"));
const StockBalancesPage = lazy(() => import("@pages/warehouse/stock/BalancesPage"));
const StockAvailabilityPage = lazy(() => import("@pages/warehouse/stock/AvailabilityPage"));
const StockEndlessPage = lazy(() => import("@pages/warehouse/stock/EndlessPage"));
const StockHistoryPage = lazy(() => import("@pages/warehouse/stock/HistoryPage"));

const warehousePlaceholderRoutes = WAREHOUSE_PLACEHOLDER_ROUTES.map(({ path, label }) => ({
  path,
  element: <WarehousePlaceholderPage title={label} />
}));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />, 
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'home-exec', element: <HomeExecPage /> },
      { path: 'sales', element: <SalesLaunchpadPage /> },
      { path: 'orders/:id', element: <OrderDetailsPage /> },
      { path: 'kiosk', element: <KioskPage /> },
      { path: 'crm/deals', element: <DealsPage /> },
      {
        path: 'warehouse',
        element: <WarehouseModule />,
        children: [
          { index: true, element: <Navigate to='stock/balances' replace /> },
          { path: 'stock', element: <Navigate to='stock/balances' replace /> },
          { path: 'stock/balances', element: <StockBalancesPage /> },
          { path: 'stock/availability', element: <StockAvailabilityPage /> },
          { path: 'stock/endless', element: <StockEndlessPage /> },
          { path: 'stock/history', element: <StockHistoryPage /> },
          ...warehousePlaceholderRoutes
        ]
      },
      { path: 'files', element: <FilesPage /> },
      { path: 'tasks-projects', element: <TasksProjectsPage /> },
      { path: 'hr/org-structure', element: <HrOrgStructurePage /> },
      { path: 'messenger', element: <MessengerPage /> },
      { path: 'services', element: <ServicesPage /> },
      { path: 'production', element: <ProductionPage /> },
      { path: 'logistics', element: <LogisticsPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'directories', element: <DirectoriesPage /> },
      { path: 'wms/inventory', element: <Navigate to='/warehouse/stock/balances' replace /> },
      { path: 'admin', element: <Navigate to='admin/audit' replace /> },
      { path: 'admin/audit', element: <AuditLogPage /> },
      { path: 'admin/org-units', element: <OrgUnitsPage /> },
      { path: 'admin/api-tokens', element: <ApiTokensPage /> }
    ]
  },
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '*',
    element: <Navigate to='/' replace />
  }
]);
