import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { MovementsHistory } from '../../views/stock/MovementsHistory';

vi.mock('../../services/stock.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../services/stock.service')>();
  return {
    ...actual,
    fetchStockMovements: vi.fn().mockResolvedValue([
      {
        id: 'mv-1',
        occurredAt: '2025-10-04T09:32:00Z',
        type: 'Перемещение',
        itemName: 'Неоновая вывеска',
        itemCode: 'SIGN-NEON-001',
        from: 'MSK-MAIN',
        to: 'SPB-HUB',
        quantity: 6,
        uom: 'шт',
        reference: 'MV-4401',
        actor: 'Петрова А.',
        note: 'Согласовано'
      }
    ])
  };
});

describe('MovementsHistory', () => {
  it('renders movement rows', async () => {
    render(
      <MemoryRouter initialEntries={['/warehouse/stock/history']}>
        <MovementsHistory />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Неоновая вывеска')).toBeInTheDocument());
    expect(screen.getByText('MV-4401')).toBeInTheDocument();
  });
});
