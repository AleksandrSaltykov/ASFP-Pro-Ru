import type { ReactNode } from 'react';

export type WarehouseCommand = {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
};

export type WarehouseMenuNode = {
  id: string;
  label: string;
  path?: string;
  children?: WarehouseMenuNode[];
};

export type WarehouseFilterOption = {
  label: string;
  value: string;
};

export type WarehouseFilter = {
  id: string;
  label: string;
  type: 'select' | 'search' | 'checkbox' | 'daterange';
  options?: WarehouseFilterOption[];
  placeholder?: string;
};

export type WarehouseColumn<T = unknown> = {
  id: string;
  label: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render: (row: T) => ReactNode;
};

export type WarehouseListFormProps<T = unknown> = {
  columns: WarehouseColumn<T>[];
  rows: T[];
  primaryKey: (row: T) => string;
  emptyMessage?: string;
  getRowClassName?: (row: T) => string | undefined;
  selectedKey?: string;
  onRowClick?: (row: T) => void;
};
