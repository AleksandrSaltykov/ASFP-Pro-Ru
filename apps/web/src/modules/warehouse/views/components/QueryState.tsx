import type { ReactNode } from 'react';

import '../../styles/warehouse.css';

type QueryStateProps = {
  message: string;
  action?: ReactNode;
};

export const QueryErrorState = ({ message, action }: QueryStateProps) => (
  <div className='query-state query-state--error'>
    <p className='query-state__message'>{message}</p>
    {action}
  </div>
);

export const EmptyState = ({ message, action }: QueryStateProps) => (
  <div className='query-state'>
    <p className='query-state__message'>{message}</p>
    {action}
  </div>
);
