import { WarehouseShell } from '../layout/WarehouseShell';
import { warehouseMenu } from '../menu/warehouse.menu';

export type PlaceholderViewProps = {
  title: string;
  path: string;
  description: string;
};

export const PlaceholderView = ({ title, path, description }: PlaceholderViewProps) => (
  <WarehouseShell
    title={title}
    menu={warehouseMenu}
    activePath={path}
    status='Функциональность в разработке'
  >
    <p className='placeholder-view__description'>{description}</p>
  </WarehouseShell>
);
