import type { ReactNode } from 'react';
import { useMemo } from 'react';

import { LeftNavPanel } from './LeftNav/LeftNavPanel';
import { CommandBar } from './CommandBar/CommandBar';
import { StatusBar } from './StatusBar/StatusBar';
import { FiltersPanel } from './FiltersPanel/FiltersPanel';
import type { WarehouseCommand, WarehouseFilter, WarehouseMenuNode } from './types';
import '../styles/warehouse.css';
import { useAppSelector } from '@app/hooks';
import { selectIsFeatureEnabled } from '@shared/state/ui-selectors';

export type WarehouseShellProps = {
  title: string;
  menu: WarehouseMenuNode[];
  activePath: string;
  commands?: WarehouseCommand[];
  filters?: WarehouseFilter[];
  status?: string;
  children: ReactNode;
  onCommand?: (commandId: string) => void;
  renderFilters?: () => ReactNode;
  headerActions?: ReactNode;
};

export const WarehouseShell = ({
  title,
  menu,
  activePath,
  commands,
  filters,
  status,
  children,
  onCommand,
  renderFilters,
  headerActions
}: WarehouseShellProps) => {
  const isRevampEnabled = useAppSelector((state) => selectIsFeatureEnabled(state, 'ui.viz_revamp'));
  const filterContent = useMemo(() => {
    if (renderFilters) {
      return renderFilters();
    }
    if (!filters?.length) {
      return null;
    }
    return <FiltersPanel filters={filters} />;
  }, [filters, renderFilters]);

  const effectiveCommands = commands ?? [];

  return (
    <div className={`warehouse-shell${isRevampEnabled ? ' warehouse-shell--no-nav' : ''}`}>
      {isRevampEnabled ? null : (
        <aside className='warehouse-shell__nav'>
          <LeftNavPanel items={menu} activePath={activePath} />
        </aside>
      )}
      <section className='warehouse-shell__main'>
        <header className='warehouse-shell__header'>
          <div className={`warehouse-shell__heading${headerActions ? ' warehouse-shell__heading--with-actions' : ''}`}>
            <h1 className='warehouse-shell__title'>{title}</h1>
            {headerActions ? <div className='warehouse-shell__actions'>{headerActions}</div> : null}
          </div>
          {effectiveCommands.length ? <CommandBar commands={effectiveCommands} onCommand={onCommand} /> : null}
        </header>
        {filterContent}
        <div className='warehouse-shell__content'>{children}</div>
        <StatusBar status={status} />
      </section>
    </div>
  );
};
