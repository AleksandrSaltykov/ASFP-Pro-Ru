import { expect, test } from '@playwright/test';

const gatewayBaseUrl = process.env.E2E_GATEWAY_URL ?? 'http://localhost:8080';
const rawCredentials = process.env.E2E_GATEWAY_BASIC_AUTH ?? 'admin@example.com:admin123';

const buildAuthHeader = () => {
  const trimmed = rawCredentials.trim();
  if (trimmed.toLowerCase().startsWith('basic ')) {
    return trimmed;
  }
  return `Basic ${Buffer.from(trimmed, 'utf-8').toString('base64')}`;
};

test.describe('Gateway auth profile', () => {
  test('GET /api/v1/auth/me returns current user profile', async ({ request }) => {
    const response = await request.get(`${gatewayBaseUrl}/api/v1/auth/me`, {
      headers: {
        Authorization: buildAuthHeader()
      }
    });

    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.id).toBeTruthy();
    expect(body.email).toContain('@');
    expect(Array.isArray(body.roles)).toBeTruthy();
  });
});

