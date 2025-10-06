import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { BalancesList } from '../../views/stock/BalancesList';

vi.mock('../../services/stock.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../services/stock.service')>();
  return {
    ...actual,
    fetchStockBalances: vi.fn().mockResolvedValue([
      {
        id: 'balance-test',
        itemName: 'Тестовый товар',
        itemCode: 'TEST-001',
        warehouse: 'MSK',
        zone: 'A',
        bin: 'A-01',
        onHand: 5,
        uom: 'шт',
        updatedAt: '2025-10-01T12:00:00Z'
      }
    ])
  };
});

describe('BalancesList', () => {
  it('renders balances table after load', async () => {
    render(
      <MemoryRouter initialEntries={['/warehouse/stock/balances']}>
        <BalancesList />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Тестовый товар')).toBeInTheDocument());
    expect(screen.getByText('TEST-001')).toBeInTheDocument();
    expect(screen.getAllByText('MSK').length).toBeGreaterThan(0);
  });
});
