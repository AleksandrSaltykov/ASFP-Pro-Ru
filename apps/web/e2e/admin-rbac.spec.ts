import { expect, test } from '@playwright/test';

test.describe('Admin RBAC console', () => {
  test('org units page renders forms', async ({ page }) => {
    await page.goto('/admin/org-units');
    await expect(page.getByRole('heading', { name: 'Организационная структура' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Создать юнит' })).toBeVisible();
  });

  test('api tokens page shows issuance form', async ({ page }) => {
    await page.goto('/admin/api-tokens');
    await expect(page.getByRole('heading', { name: 'API токены и права' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Выпустить токен' })).toBeVisible();
  });
});
