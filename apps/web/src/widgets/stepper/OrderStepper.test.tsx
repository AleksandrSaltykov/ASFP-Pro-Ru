import '@testing-library/jest-dom';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { OrderStepper, type Step } from './OrderStepper';

describe('OrderStepper', () => {
  const steps: Step[] = [
    { id: 'lead', title: 'Лид', done: true },
    { id: 'proposal', title: 'КП' },
    { id: 'order', title: 'Заказ', blocked: true }
  ];

  it('renders current step and advances when allowed', () => {
    const handleNext = vi.fn();
    render(<OrderStepper steps={steps} currentStepId="proposal" onRequestNext={handleNext} />);

    expect(screen.getByLabelText('КП')).toHaveAttribute('aria-current', 'true');

    fireEvent.click(screen.getByRole('button', { name: /Следующий этап/i }));

    expect(handleNext).toHaveBeenCalledWith('proposal');
  });

  it('disables advancing when blocked', () => {
    const handleNext = vi.fn();
    render(<OrderStepper steps={steps} currentStepId="order" onRequestNext={handleNext} />);

    const nextButton = screen.getByRole('button', { name: /Следующий этап/i });
    expect(nextButton).toBeDisabled();
    fireEvent.click(nextButton);
    expect(handleNext).not.toHaveBeenCalled();
  });
});
