import { expect, test } from '@playwright/test';

test.describe('CRM deals landing', () => {
  test('shows hero content and highlights', async ({ page }) => {
    await page.goto('/crm/deals');

    await expect(page.getByRole('heading', { name: 'Продажи под контролем и прозрачные воронки' })).toBeVisible();
    await expect(page.getByText('Модуль CRM')).toBeVisible();
    await expect(page.getByText('Карточки клиентов собирают сделки, документы и историю общения.', { exact: false })).toBeVisible();
  });
});

// Placeholders for upcoming domains (enabled once API/UI is ready)
test.describe('Future domain placeholders', () => {
  test.skip('MES work orders dashboard', () => {
    // Enable when MES minimal API and UI are available.
  });

  test.skip('Montage assignments board', () => {
    // Enable when Montage endpoints and UI are implemented.
  });

  test.skip('Docs document flow overview', () => {
    // Enable after Docs module exposes templates/documents pages.
  });
});
