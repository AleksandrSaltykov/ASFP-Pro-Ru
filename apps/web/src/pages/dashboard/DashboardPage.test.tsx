import { render, screen } from '@testing-library/react';

import DashboardPage from './DashboardPage';

describe('DashboardPage', () => {
  it('renders welcome message', () => {
    render(<DashboardPage />);
    expect(screen.getByText(/добро пожаловать/i)).toBeInTheDocument();
  });
});
