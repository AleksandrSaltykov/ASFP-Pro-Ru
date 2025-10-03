import { expect, test } from '@playwright/test';

test.describe('RBAC forbidden flows', () => {
  test('WMS inventory page shows error when stock API returns 403', async ({ page }) => {
    await page.route('**/api/v1/stock/**', (route) => {
      const headers = {
        ...route.request().headers(),
        'x-mock-rbac': 'deny'
      };
      return route.continue({ headers });
    });

    await page.goto('/wms/inventory');

    await expect(page.getByRole('heading', { name: 'Не удалось загрузить данные склада' })).toBeVisible();
    await expect(page.getByText('Недостаточно прав', { exact: false })).toBeVisible();
  });

  test('CRM deals page surfaces forbidden message', async ({ page }) => {
    await page.route('**/api/v1/crm/deals**', (route) => {
      const headers = {
        ...route.request().headers(),
        'x-mock-rbac': 'deny'
      };
      return route.continue({ headers });
    });

    await page.route('**/api/v1/crm/customers**', (route) => {
      const headers = {
        ...route.request().headers(),
        'x-mock-rbac': 'deny'
      };
      return route.continue({ headers });
    });

    await page.goto('/crm/deals');

    await expect(page.getByRole('heading', { name: 'Не удалось загрузить CRM данные' })).toBeVisible();
    await expect(page.getByText('Недостаточно прав', { exact: false })).toBeVisible();
  });
});
