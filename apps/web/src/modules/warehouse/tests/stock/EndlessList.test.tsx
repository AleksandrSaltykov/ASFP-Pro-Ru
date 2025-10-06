import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { EndlessList } from '../../views/stock/EndlessList';

vi.mock('../../services/stock.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../services/stock.service')>();
  return {
    ...actual,
    fetchEndlessPolicies: vi.fn().mockResolvedValue([
      {
        id: 'row-1',
        itemCode: 'TEST-001',
        itemName: 'Демотовар',
        warehouse: 'MSK',
        policy: 'MINMAX' as const,
        min: 10,
        max: 40,
        reorderPoint: null,
        safetyStock: 5,
        note: '',
        available: 8
      }
    ]),
    updateEndlessPolicy: vi.fn().mockResolvedValue(undefined),
    resetEndlessPolicy: vi.fn().mockResolvedValue(undefined)
  };
});

describe('EndlessList', () => {
  it('highlights critical rows', async () => {
    render(
      <MemoryRouter initialEntries={['/warehouse/stock/endless']}>
        <EndlessList />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByDisplayValue('MINMAX')).toBeInTheDocument());
    const row = screen.getByText('Демотовар').closest('tr');
    expect(row?.className).toContain('list-form__row--critical');
  });

  it('allows editing policy fields', async () => {
    render(
      <MemoryRouter initialEntries={['/warehouse/stock/endless']}>
        <EndlessList />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByDisplayValue('MINMAX')).toBeInTheDocument());
    const minInput = screen.getByDisplayValue('10') as HTMLInputElement;
    fireEvent.change(minInput, { target: { value: '12' } });
    expect(minInput.value).toBe('12');
  });
});
