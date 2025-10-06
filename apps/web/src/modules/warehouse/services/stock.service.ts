// TODO: replace stubs with real API integrations once backend endpoints are ready.

export type StockBalanceRow = {
  id: string;
  itemName: string;
  itemCode: string;
  warehouse: string;
  zone: string;
  bin: string;
  onHand: number;
  uom: string;
  updatedAt: string;
};

export type StockAvailabilityRow = {
  id: string;
  itemName: string;
  itemCode: string;
  warehouse: string;
  onHand: number;
  reserved: number;
  onOrder: number;
  available: number;
  uom: string;
};

export type EndlessPolicyRow = {
  id: string;
  itemCode: string;
  itemName: string;
  warehouse: string;
  policy: 'MINMAX' | 'ROP' | 'NONE';
  min?: number;
  max?: number;
  reorderPoint?: number;
  safetyStock?: number;
  note?: string;
  available: number;
};

export type StockMovementRow = {
  id: string;
  occurredAt: string;
  type: string;
  itemName: string;
  itemCode: string;
  from: string;
  to: string;
  quantity: number;
  uom: string;
  reference?: string;
  actor?: string;
  note?: string;
};

const wait = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchStockBalances(): Promise<StockBalanceRow[]> {
  await wait();
  return [
    {
      id: 'balance-1',
      itemName: 'Неоновая вывеска, 1.5м',
      itemCode: 'SIGN-NEON-001',
      warehouse: 'MSK-MAIN',
      zone: 'STORAGE',
      bin: 'A-01',
      onHand: 56,
      uom: 'шт',
      updatedAt: '2025-10-02T22:15:00Z'
    },
    {
      id: 'balance-2',
      itemName: 'Ролл-ап 800х2000',
      itemCode: 'STAND-ROLLUP-001',
      warehouse: 'MSK-MAIN',
      zone: 'RECEIVING',
      bin: 'D-03',
      onHand: 4,
      uom: 'шт',
      updatedAt: '2025-10-03T12:05:00Z'
    }
  ];
}

export async function fetchStockAvailability(): Promise<StockAvailabilityRow[]> {
  await wait();
  return [
    {
      id: 'availability-1',
      itemName: 'LED модуль 3528',
      itemCode: 'LED-MODULE-3528',
      warehouse: 'EKB-REGION',
      onHand: 240,
      reserved: 120,
      onOrder: 40,
      available: 120,
      uom: 'шт'
    },
    {
      id: 'availability-2',
      itemName: 'Неоновая вывеска, 1.5м',
      itemCode: 'SIGN-NEON-001',
      warehouse: 'SPB-HUB',
      onHand: 18,
      reserved: 8,
      onOrder: 10,
      available: 20,
      uom: 'шт'
    }
  ];
}

export async function fetchEndlessPolicies(): Promise<EndlessPolicyRow[]> {
  await wait();
  return [
    {
      id: 'endless-1',
      itemCode: 'LED-MODULE-3528',
      itemName: 'LED модуль 3528',
      warehouse: 'EKB-REGION',
      policy: 'MINMAX',
      min: 100,
      max: 400,
      safetyStock: 60,
      note: 'Поддерживать складской запас для световых панелей',
      available: 120
    },
    {
      id: 'endless-2',
      itemCode: 'SIGN-NEON-001',
      itemName: 'Неоновая вывеска, 1.5м',
      warehouse: 'MSK-MAIN',
      policy: 'ROP',
      reorderPoint: 30,
      safetyStock: 20,
      available: 18
    }
  ];
}

export async function updateEndlessPolicy(row: EndlessPolicyRow): Promise<void> {
  await wait();
  console.info('[warehouse/endless] update policy', row);
}

export async function resetEndlessPolicy(id: string): Promise<void> {
  await wait();
  console.info('[warehouse/endless] reset policy', id);
}

export async function fetchStockMovements(): Promise<StockMovementRow[]> {
  await wait();
  return [
    {
      id: 'movement-1',
      occurredAt: '2025-10-03T12:15:00Z',
      type: 'Приёмка',
      itemName: 'LED модуль 3528',
      itemCode: 'LED-MODULE-3528',
      from: 'Поставщик: СветЛайн',
      to: 'EKB-REGION / REG-A / BIN-07',
      quantity: 120,
      uom: 'шт',
      reference: 'PR-10293',
      actor: 'Иванов П.',
      note: ''
    },
    {
      id: 'movement-2',
      occurredAt: '2025-10-04T09:32:00Z',
      type: 'Перемещение',
      itemName: 'Неоновая вывеска, 1.5м',
      itemCode: 'SIGN-NEON-001',
      from: 'MSK-MAIN / STORAGE / A-01',
      to: 'SPB-HUB / BUFFER / B-12',
      quantity: 6,
      uom: 'шт',
      reference: 'MV-4401',
      actor: 'Петрова А.',
      note: 'Согласовано'
    }
  ];
}
