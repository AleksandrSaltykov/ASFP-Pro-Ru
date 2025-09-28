import '@testing-library/jest-dom';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { ProcessMap } from './ProcessMap';

describe('ProcessMap', () => {
  it('highlights selected stage and invokes callback', () => {
    const handleSelect = vi.fn();
    const stages = [
      { id: 'lead', title: 'Лид', count: 10 },
      { id: 'proposal', title: 'КП', count: 6 }
    ];

    render(<ProcessMap stages={stages} activeStageId="proposal" onSelectStage={handleSelect} />);

    const leadButton = screen.getByTestId('process-stage-lead');
    const proposalButton = screen.getByTestId('process-stage-proposal');

    expect(proposalButton).toHaveAttribute('aria-pressed', 'true');
    expect(leadButton).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(leadButton);

    expect(handleSelect).toHaveBeenCalledWith('lead');
  });
});
