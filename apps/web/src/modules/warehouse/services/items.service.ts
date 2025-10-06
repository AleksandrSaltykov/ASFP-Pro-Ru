// TODO: replace with integration to existing items API.

export type WarehouseItem = {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
};

export async function fetchItems(): Promise<WarehouseItem[]> {
  return [
    { id: 'item-1', sku: 'SIGN-NEON-001', name: 'Неоновая вывеска, 1.5м', category: 'Реклама', unit: 'шт' },
    { id: 'item-2', sku: 'LED-MODULE-3528', name: 'LED модуль 3528', category: 'Светотехника', unit: 'шт' }
  ];
}
