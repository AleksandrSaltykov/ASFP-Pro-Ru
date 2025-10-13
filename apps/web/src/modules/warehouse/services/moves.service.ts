// TODO: replace stubs with real API integrations once backend endpoints are ready.

type MoveStatus = 'PLANNED' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';

export type MoveLine = {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  uom: string;
};

export type MoveLink = {
  label: string;
  path: string;
};

export type InterWarehouseMoveRow = {
  id: string;
  code: string;
  status: MoveStatus;
  createdAt: string;
  scheduledDispatch?: string;
  shippedAt?: string;
  completedAt?: string;
  source: {
    warehouse: string;
  };
  destination: {
    warehouse: string;
  };
  lines: MoveLine[];
  transport?: string;
  reference?: string;
  links: MoveLink[];
  note?: string;
};

const wait = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

const pad2 = (value: number) => value.toString().padStart(2, '0');

const buildTimestampToken = (date: Date) =>
  `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}${pad2(date.getHours())}${pad2(
    date.getMinutes()
  )}${pad2(date.getSeconds())}`;

export const generateInterWarehouseMoveCode = () => {
  const now = new Date();
  return `IWM-${now.getFullYear()}${pad2(now.getMonth() + 1)}${pad2(now.getDate())}-${pad2(now.getHours())}${pad2(
    now.getMinutes()
  )}`;
};

const fallbackRandom = () => Math.floor(Math.random() * 10_000)
  .toString()
  .padStart(4, '0');

const nextMoveId = (code?: string) => {
  const token = buildTimestampToken(new Date());
  if (code) {
    return `${code.toLowerCase().replace(/\W+/g, '-')}-${fallbackRandom()}`;
  }
  return `iwm-${token}-${fallbackRandom()}`;
};

const STORAGE_KEY = 'warehouse.interWarehouseMoves';

export type CreateInterWarehouseMovePayload = {
  code?: string;
  dispatchAt?: string;
  source: {
    warehouse: string;
  };
  destination: {
    warehouse: string;
  };
  note?: string;
  lines: Array<{
    sku: string;
    name: string;
    quantity: number;
    uom: string;
  }>;
};

export async function fetchInternalMoves() {
  await wait();
  return [];
}

const DEFAULT_INTER_WAREHOUSE_MOVES: InterWarehouseMoveRow[] = [
  {
    id: 'iwm-2025-0042',
    code: 'IWM-2025-0042',
    status: 'IN_TRANSIT',
    createdAt: '2025-10-03T06:45:00Z',
    scheduledDispatch: '2025-10-03T08:00:00Z',
    shippedAt: '2025-10-03T08:12:00Z',
    source: {
      warehouse: 'MSK-MAIN'
    },
    destination: {
      warehouse: 'SPB-HUB'
    },
    lines: [
      {
        id: 'iwm-2025-0042-line-1',
        sku: 'SIGN-NEON-001',
        name: 'Неоновая вывеска, 1.5м',
        quantity: 6,
        uom: 'шт'
      },
      {
        id: 'iwm-2025-0042-line-2',
        sku: 'LED-MODULE-3528',
        name: 'LED модуль 3528',
        quantity: 120,
        uom: 'шт'
      }
    ],
    transport: 'Собственный транспорт • А777ВЕ77',
    reference: 'ORD-88312',
    links: [
      { label: 'История движений MV-4401', path: '/warehouse/stock/history?ref=MV-4401' },
      { label: 'Остатки SPB-HUB', path: '/warehouse/stock/balances?warehouse=SPB-HUB' }
    ],
    note: 'Отгружено, ожидает приёмку в СПб.'
  },
  {
    id: 'iwm-2025-0051',
    code: 'IWM-2025-0051',
    status: 'PLANNED',
    createdAt: '2025-10-05T11:20:00Z',
    scheduledDispatch: '2025-10-06T09:30:00Z',
    source: {
      warehouse: 'EKB-REGION'
    },
    destination: {
      warehouse: 'MSK-MAIN'
    },
    lines: [
      {
        id: 'iwm-2025-0051-line-1',
        sku: 'LED-MODULE-3528',
        name: 'LED модуль 3528',
        quantity: 180,
        uom: 'шт'
      },
      {
        id: 'iwm-2025-0051-line-2',
        sku: 'FRAME-ALU-900',
        name: 'Алюминиевый профиль 900мм',
        quantity: 40,
        uom: 'шт'
      }
    ],
    transport: 'Сторонний перевозчик • ТК «УралЭкспресс»',
    reference: 'REQ-55210',
    links: [
      { label: 'Остатки MSK-MAIN', path: '/warehouse/stock/balances?warehouse=MSK-MAIN' },
      { label: 'Резервы MSK-MAIN', path: '/warehouse/reserve/reservations?warehouse=MSK-MAIN' }
    ],
    note: 'Необходимо подтвердить наличие водителя до 05.10 18:00.'
  },
  {
    id: 'iwm-2025-0038',
    code: 'IWM-2025-0038',
    status: 'COMPLETED',
    createdAt: '2025-09-29T07:05:00Z',
    scheduledDispatch: '2025-09-29T10:00:00Z',
    shippedAt: '2025-09-29T10:08:00Z',
    completedAt: '2025-09-30T13:22:00Z',
    source: {
      warehouse: 'SPB-HUB'
    },
    destination: {
      warehouse: 'KRD-HUB'
    },
    lines: [
      {
        id: 'iwm-2025-0038-line-1',
        sku: 'PRINT-MESH-320',
        name: 'Баннерная сетка 3.2м',
        quantity: 14,
        uom: 'рул'
      }
    ],
    transport: '3PL «FTL Север-Юг» • C564РН198',
    reference: 'MV-4386',
    links: [
      { label: 'Приёмка KRD-HUB', path: '/warehouse/inbound/receipts?ref=PR-20881' },
      { label: 'История движений MV-4386', path: '/warehouse/stock/history?ref=MV-4386' }
    ],
    note: 'Товар принят без расхождений, закрыт актом 30/09.'
  }
];

let interWarehouseMovesCache: InterWarehouseMoveRow[] | null = null;

const cloneMove = (move: InterWarehouseMoveRow): InterWarehouseMoveRow => ({
  ...move,
  lines: move.lines.map((line) => ({ ...line }))
});

const loadMovesFromStorage = (): InterWarehouseMoveRow[] | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed as InterWarehouseMoveRow[];
    }
  } catch (error) {
    console.warn('[moves] failed to parse stored moves', error);
  }
  return null;
};

const persistCache = () => {
  if (typeof window === 'undefined' || !interWarehouseMovesCache) {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(interWarehouseMovesCache));
};

const ensureCache = () => {
  if (interWarehouseMovesCache) {
    return;
  }
  const stored = loadMovesFromStorage();
  interWarehouseMovesCache = stored ? stored : DEFAULT_INTER_WAREHOUSE_MOVES.slice();
  persistCache();
};

export async function fetchInterWarehouseMoves(): Promise<InterWarehouseMoveRow[]> {
  await wait();
  ensureCache();
  return (interWarehouseMovesCache ?? []).map(cloneMove);
}

export async function fetchReplenishmentMoves() {
  await wait();
  return [];
}

export async function fetchAdjustments() {
  await wait();
  return [];
}

export async function createInterWarehouseMove(
  payload: CreateInterWarehouseMovePayload
): Promise<InterWarehouseMoveRow> {
  await wait();
  ensureCache();
  const now = new Date();
  const code = (payload.code ?? '').trim() || generateInterWarehouseMoveCode();
  const id = nextMoveId(code);
  const normalize = (value?: string) => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
  };

  const dispatchAt = payload.dispatchAt ? new Date(payload.dispatchAt).toISOString() : now.toISOString();

  const result: InterWarehouseMoveRow = {
    id,
    code,
    status: 'PLANNED',
    createdAt: now.toISOString(),
    scheduledDispatch: dispatchAt,
    source: {
      warehouse: payload.source.warehouse.trim()
    },
    destination: {
      warehouse: payload.destination.warehouse.trim()
    },
    lines: payload.lines.map((line, index) => ({
      id: `${id}-line-${index + 1}`,
      sku: line.sku.trim(),
      name: line.name.trim(),
      quantity: line.quantity,
      uom: line.uom.trim()
    })),
    transport: undefined,
    reference: undefined,
    links: [],
    note: normalize(payload.note)
  };

  interWarehouseMovesCache = [result, ...(interWarehouseMovesCache ?? [])];
  persistCache();

  return cloneMove(result);
}

export async function deleteInterWarehouseMove(id: string): Promise<void> {
  await wait();
  ensureCache();
  interWarehouseMovesCache = (interWarehouseMovesCache ?? []).filter((move) => move.id !== id);
  persistCache();
}
