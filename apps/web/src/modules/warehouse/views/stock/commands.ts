import type { WarehouseCommand } from '../../layout/types';

export const baseCommands: WarehouseCommand[] = [
  { id: 'create', label: 'Создать' },
  { id: 'edit', label: 'Изменить' },
  { id: 'post', label: 'Провести' },
  { id: 'delete', label: 'Удалить' },
  { id: 'print', label: 'Печать' },
  { id: 'export', label: 'Экспорт' },
  { id: 'more', label: 'Ещё' }
];
