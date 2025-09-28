import { Navigate } from 'react-router-dom';

import { useAppSelector } from '@app/hooks';
import { selectIsFeatureEnabled } from '@shared/state/ui-selectors';

const DashboardPage = () => {
  const isRevampEnabled = useAppSelector((state) => selectIsFeatureEnabled(state, 'ui.viz_revamp'));

  if (isRevampEnabled) {
    return <Navigate to="/home-exec" replace />;
  }

  return (
    <section>
      <h1>Добро пожаловать в ASFP-Pro</h1>
      <p>
        Здесь появятся дашборды и сводки: KPI отдела, динамика сделок и нагрузка на
        производственные линии.
      </p>
    </section>
  );
};

export default DashboardPage;
