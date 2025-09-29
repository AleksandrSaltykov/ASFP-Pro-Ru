import { expect, test } from '@playwright/test';

const directoriesPath = '/directories';

const catalogsHeading = 'Категории товаров';
const signageName = 'Рекламные конструкции';
const signageCode = 'SIGNAGE';
const itemsToggle = 'Номенклатура';
const demoItemName = 'Демонстрационная вывеска';
const demoItemSku = 'DEMO-SIGN-001';

test.describe('WMS master data directories', () => {
  test('shows seeded catalogs and demo item', async ({ page }) => {
    await page.goto(directoriesPath);

    await expect(page.getByRole('heading', { name: 'Справочники ASFP-Pro' })).toBeVisible();
    await expect(page.getByText(catalogsHeading)).toBeVisible();

    const signageCard = page.locator('article').filter({ hasText: signageName });
    await expect(signageCard).toBeVisible();
    await expect(signageCard).toContainText(`Код: ${signageCode}`);

    await page.getByRole('button', { name: itemsToggle }).click();

    await expect(page.getByText(demoItemName)).toBeVisible();
    await expect(page.getByText(`SKU: ${demoItemSku}`)).toBeVisible();
  });
});
