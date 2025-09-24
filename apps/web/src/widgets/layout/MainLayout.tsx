import { Outlet } from 'react-router-dom';
import { NavigationLink } from '@shared/ui/NavigationLink';
import { useAppSelector } from '@app/hooks';

const navItems = [
  { to: '/', label: 'Дашборд' },
  { to: '/crm/deals', label: 'CRM: Сделки' },
  { to: '/wms/inventory', label: 'WMS: Остатки' },
  { to: '/files', label: 'Файлы' }
];

export const MainLayout = () => {
  const user = useAppSelector((state) => state.auth.user);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          padding: '16px 24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <strong>ASFP-Pro ERP</strong>
        <nav style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {navItems.map((item) => (
            <NavigationLink key={item.to} to={item.to}>
              {item.label}
            </NavigationLink>
          ))}
        </nav>
        <div style={{ fontSize: 14, color: '#4b5563' }}>
          {user ? user.name : 'Гость'}
        </div>
      </header>
      <main style={{ flex: 1, padding: '24px' }}>
        <Outlet />
      </main>
    </div>
  );
};
