import type { WarehouseCommand } from '../../layout/types';

export const masterCommands: WarehouseCommand[] = [
  { id: 'create', label: 'Создать' },
  { id: 'edit', label: 'Изменить' },
  { id: 'delete', label: 'Удалить' },
  { id: 'refresh', label: 'Обновить' },
  { id: 'export', label: 'Экспорт' }
];
