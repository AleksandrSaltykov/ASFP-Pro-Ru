import { expect, test } from '@playwright/test';

test.describe('WMS master data', () => {
  test('categories page renders tree and action', async ({ page }) => {
    await page.goto('/warehouse/masters/items/categories');
    await expect(page.getByRole('heading', { name: 'Категории номенклатуры' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Создать категорию' })).toBeVisible();
  });

  test('units page is available', async ({ page }) => {
    await page.goto('/warehouse/masters/items/units');
    await expect(page.getByRole('heading', { name: 'Единицы измерения' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Новая единица' })).toBeVisible();
  });

  test('attributes page is available', async ({ page }) => {
    await page.goto('/warehouse/masters/items/attributes');
    await expect(page.getByRole('heading', { name: 'Динамические атрибуты' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Новый атрибут' })).toBeVisible();
  });

  test('items page shows list and create action', async ({ page }) => {
    await page.goto('/warehouse/masters/items');
    await expect(page.getByRole('heading', { name: 'Номенклатура' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Создать изделие' })).toBeVisible();
  });
});
