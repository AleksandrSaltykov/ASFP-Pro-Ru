import type { Receipt, ReceiptDetails, ReceiptLine } from '@shared/api';

const now = () => new Date().toISOString();

const demoLines: ReceiptLine[] = [
  {
    id: 'rcpt-line-1',
    receiptId: 'rcpt-demo-1',
    itemId: 'demo-item-1',
    sku: 'SKU-DEMO-001',
    itemName: 'Демонстрационный баннер 3х6',
    unitId: 'unit-pcs',
    unitCode: 'PCS',
    quantity: 12,
    expectedQuantity: 12,
    receivedQuantity: 12,
    unitCost: 2500,
    vatRate: 20,
    vatAmount: 5000,
    totalCost: 30000,
    batchNumber: 'BCH-001',
    productionDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    expirationDate: null,
    metadata: { color: 'blue' },
    createdAt: now(),
    updatedAt: now()
  },
  {
    id: 'rcpt-line-2',
    receiptId: 'rcpt-demo-1',
    itemId: 'demo-item-2',
    sku: 'SKU-DEMO-002',
    itemName: 'Комплект световых коробов',
    unitId: 'unit-pcs',
    unitCode: 'PCS',
    quantity: 4,
    expectedQuantity: 4,
    receivedQuantity: 4,
    unitCost: 14800,
    vatRate: 20,
    vatAmount: 9866.67,
    totalCost: 59200,
    batchNumber: 'BCH-002',
    productionDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    expirationDate: null,
    metadata: { power: '220V' },
    createdAt: now(),
    updatedAt: now()
  }
];

export const fallbackReceipts: Receipt[] = [
  {
    id: 'rcpt-demo-1',
    code: 'RCPT-DEMO-2025-001',
    externalReference: 'ASN-001',
    status: 'completed',
    warehouseId: 'wh-msk-main',
    warehouseName: 'MSK-MAIN',
    supplierId: null,
    supplierName: 'ООО «Ритейл Промо»',
    supplierInn: '7708123456',
    currency: 'RUB',
    expectedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    receivedAt: null,
    totalAmount: 89200,
    totalVat: 14866.67,
    linesCount: demoLines.length,
    notes: 'Поставка для запуска кампании в Москве',
    metadata: { channel: 'offline-demo' },
    createdBy: null,
    updatedBy: null,
    createdAt: now(),
    updatedAt: now()
  }
];

export const fallbackReceiptDetails: Record<string, ReceiptDetails> = {
  'rcpt-demo-1': {
    ...fallbackReceipts[0],
    lines: demoLines
  }
};

export const resolveFallbackReceiptDetails = (receiptId: string): ReceiptDetails | undefined =>
  fallbackReceiptDetails[receiptId];
