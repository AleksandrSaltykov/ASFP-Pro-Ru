import { http, HttpResponse } from 'msw';

const now = () => new Date().toISOString();

// WMS sample data
const wmsWarehouses = [
  {
    id: 'wh-1',
    code: 'MSK-01',
    name: 'Центральный склад Москва',
    description: 'Основной распределительный центр',
    address: { city: 'Москва', street: 'ул. Складская, 10' },
    timezone: 'Europe/Moscow',
    status: 'active',
    operatingHours: { weekdays: { mon: '09:00-21:00', tue: '09:00-21:00' } },
    contact: { manager: 'Ирина Иванова', phone: '+7 495 000-00-00', email: 'warehouse@asfp.pro' },
    metadata: {},
    createdAt: now(),
    updatedAt: now()
  },
  {
    id: 'wh-2',
    code: 'SPB-02',
    name: 'СПб Север',
    description: 'Региональный склад',
    address: { city: 'Санкт-Петербург', street: 'пр. Индустриальный, 5' },
    timezone: 'Europe/Moscow',
    status: 'active',
    operatingHours: { weekdays: { mon: '08:00-20:00', tue: '08:00-20:00' } },
    contact: { manager: 'Петр Сидоров', phone: '+7 812 000-00-00', email: 'spb@asfp.pro' },
    metadata: {},
    createdAt: now(),
    updatedAt: now()
  }
];

const wmsZones = [
  {
    id: 'zone-1',
    warehouseId: 'wh-1',
    code: 'MSK-A',
    name: 'Зона A',
    zoneType: 'storage',
    isBuffer: false,
    temperatureMin: 5,
    temperatureMax: 20,
    hazardClass: 'none',
    accessRestrictions: ['forklift'],
    layout: { aisles: 5 },
    metadata: {},
    createdBy: null,
    updatedBy: null,
    createdAt: now(),
    updatedAt: now()
  },
  {
    id: 'zone-2',
    warehouseId: 'wh-1',
    code: 'MSK-B',
    name: 'Буфер',
    zoneType: 'buffer',
    isBuffer: true,
    temperatureMin: 2,
    temperatureMax: 18,
    hazardClass: 'none',
    accessRestrictions: ['manual'],
    layout: { aisles: 2 },
    metadata: {},
    createdBy: null,
    updatedBy: null,
    createdAt: now(),
    updatedAt: now()
  }
];

const wmsCells = [
  {
    id: 'cell-1',
    warehouseId: 'wh-1',
    zoneId: 'zone-1',
    code: 'A-01-01',
    label: 'Стеллаж A1',
    address: { aisle: 'A', rack: '01', level: '01' },
    cellType: 'rack',
    status: 'available',
    isPickFace: true,
    lengthMm: 1200,
    widthMm: 800,
    heightMm: 1500,
    maxWeightKg: 800,
    maxVolumeL: 500,
    allowedHandling: ['forklift'],
    temperatureMin: 5,
    temperatureMax: 20,
    hazardClasses: ['none'],
    metadata: {},
    createdBy: null,
    updatedBy: null,
    createdAt: now(),
    updatedAt: now()
  },
  {
    id: 'cell-2',
    warehouseId: 'wh-1',
    zoneId: 'zone-2',
    code: 'B-00-01',
    label: 'Буфер 1',
    address: { dock: '1' },
    cellType: 'buffer',
    status: 'busy',
    isPickFace: false,
    lengthMm: 1500,
    widthMm: 1200,
    heightMm: 1600,
    maxWeightKg: 1200,
    maxVolumeL: 700,
    allowedHandling: ['manual'],
    temperatureMin: 2,
    temperatureMax: 18,
    hazardClasses: ['none'],
    metadata: {},
    createdBy: null,
    updatedBy: null,
    createdAt: now(),
    updatedAt: now()
  }
];

const wmsEquipment = [
  {
    id: 'eq-1',
    warehouseId: 'wh-1',
    code: 'FLT-01',
    name: 'Погрузчик 1',
    type: 'forklift',
    status: 'active',
    manufacturer: 'Still',
    serialNumber: 'STL-001',
    commissioningDate: '2022-01-15',
    metadata: {},
    createdBy: null,
    updatedBy: null,
    createdAt: now(),
    updatedAt: now()
  }
];

const catalogRootId = 'cat-root';

type CatalogNodeMock = {
  id: string;
  type: string;
  parentId: string | null;
  code: string;
  name: string;
  description: string | null;
  level: number;
  path: string;
  metadata: Record<string, unknown>;
  sortOrder: number;
  isActive: boolean;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

const wmsCatalogNodes: Record<string, CatalogNodeMock[]> = {
  category: [
    {
      id: catalogRootId,
      type: 'category',
      parentId: null,
      code: 'ROOT',
      name: 'Root Catalog',
      description: 'System root node',
      level: 0,
      path: 'ROOT',
      metadata: { system: true },
      sortOrder: 0,
      isActive: true,
      createdBy: null,
      updatedBy: null,
      createdAt: now(),
      updatedAt: now()
    },
    {
      id: 'cat-signage',
      type: 'category',
      parentId: catalogRootId,
      code: 'SIGNAGE',
      name: 'Рекламные конструкции',
      description: 'Категория для наружных конструкций',
      level: 1,
      path: 'ROOT.SIGNAGE',
      metadata: { demo: true },
      sortOrder: 10,
      isActive: true,
      createdBy: null,
      updatedBy: null,
      createdAt: now(),
      updatedAt: now()
    },
    {
      id: 'cat-print',
      type: 'category',
      parentId: catalogRootId,
      code: 'PRINT',
      name: 'Печатная продукция',
      description: 'Категория для печатных материалов',
      level: 1,
      path: 'ROOT.PRINT',
      metadata: { demo: true },
      sortOrder: 20,
      isActive: true,
      createdBy: null,
      updatedBy: null,
      createdAt: now(),
      updatedAt: now()
    }
  ],
  unit: [
    {
      id: 'unit-pcs',
      type: 'unit',
      parentId: null,
      code: 'PCS',
      name: 'Штуки',
      description: 'Единицы поштучного учёта',
      level: 0,
      path: 'PCS',
      metadata: { decimalPlaces: 0 },
      sortOrder: 0,
      isActive: true,
      createdBy: null,
      updatedBy: null,
      createdAt: now(),
      updatedAt: now()
    },
    {
      id: 'unit-kg',
      type: 'unit',
      parentId: null,
      code: 'KG',
      name: 'Килограммы',
      description: 'Единицы массы',
      level: 0,
      path: 'KG',
      metadata: { decimalPlaces: 3 },
      sortOrder: 10,
      isActive: true,
      createdBy: null,
      updatedBy: null,
      createdAt: now(),
      updatedAt: now()
    }
  ]
};

const ensureCatalogCollection = (catalogType: string): CatalogNodeMock[] => {
  if (!wmsCatalogNodes[catalogType]) {
    wmsCatalogNodes[catalogType] = [];
  }
  return wmsCatalogNodes[catalogType];
};

const recalcHierarchy = (collection: CatalogNodeMock[], node: CatalogNodeMock) => {
  const parent = node.parentId ? collection.find((item) => item.id === node.parentId) : null;
  if (parent) {
    node.level = parent.level + 1;
    node.path = `${parent.path}.${node.code}`;
  } else {
    node.level = 0;
    node.path = node.code;
  }
};

const updateDescendantHierarchy = (collection: CatalogNodeMock[], node: CatalogNodeMock) => {
  recalcHierarchy(collection, node);
  for (const child of collection.filter((item) => item.parentId === node.id)) {
    updateDescendantHierarchy(collection, child);
  }
};

const nextCatalogId = (prefix: string) => `${prefix}-${Math.random().toString(16).slice(2, 8)}-${Date.now()}`;


type AttributeTemplateMock = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  targetType: string;
  dataType: string;
  isRequired: boolean;
  metadata: Record<string, unknown>;
  uiSchema: Record<string, unknown>;
  position: number;
  createdAt: string;
  updatedAt: string;
};

const wmsAttributeTemplates: Record<string, AttributeTemplateMock[]> = {
  item: [
    {
      id: 'tpl-color',
      code: 'color',
      name: 'Цвет конструкции',
      description: 'Основной цвет изделия',
      targetType: 'item',
      dataType: 'string',
      isRequired: false,
      metadata: { options: ['Синий', 'Красный', 'Белый'] },
      uiSchema: { component: 'Select' },
      position: 10,
      createdAt: now(),
      updatedAt: now()
    },
    {
      id: 'tpl-width',
      code: 'width_mm',
      name: 'Ширина, мм',
      description: 'Габаритная ширина',
      targetType: 'item',
      dataType: 'number',
      isRequired: true,
      metadata: { unit: 'mm' },
      uiSchema: { component: 'NumberInput', step: 1 },
      position: 20,
      createdAt: now(),
      updatedAt: now()
    },
    {
      id: 'tpl-outdoor',
      code: 'is_outdoor',
      name: 'Уличное размещение',
      description: 'Подходит для улицы',
      targetType: 'item',
      dataType: 'boolean',
      isRequired: false,
      metadata: {},
      uiSchema: { component: 'Switch' },
      position: 30,
      createdAt: now(),
      updatedAt: now()
    }
  ]
};

const ensureAttributeTemplateCollection = (targetType: string): AttributeTemplateMock[] => {
  if (!wmsAttributeTemplates[targetType]) {
    wmsAttributeTemplates[targetType] = [];
  }
  return wmsAttributeTemplates[targetType];
};

const nextTemplateId = () => `tpl-${Math.random().toString(16).slice(2, 8)}-${Date.now()}`;


type AttributeValueMock = {
  template: AttributeTemplateMock;
  stringValue?: string;
  numberValue?: number;
  booleanValue?: boolean;
  jsonValue?: Record<string, unknown>;
};

type ItemAttributePayload = {
  templateId?: string;
  templateID?: string;
  template_id?: string;
  stringValue?: string;
  numberValue?: number;
  booleanValue?: boolean;
  jsonValue?: unknown;
};

type ItemPayloadInput = {
  sku?: string;
  name?: string;
  description?: string;
  categoryId?: string;
  unitId?: string;
  barcode?: string;
  weightKg?: number;
  volumeM3?: number;
  metadata?: Record<string, unknown>;
  attributes?: ItemAttributePayload[];
  warehouseIds?: string[];
};

type ItemMock = {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  categoryPath: string;
  category?: {
    id: string;
    code: string;
    name: string;
    path: string;
    metadata: Record<string, unknown>;
  };
  unitId: string;
  unit?: {
    id: string;
    code: string;
    name: string;
    metadata: Record<string, unknown>;
  };
  barcode: string | null;
  weightKg: number | null;
  volumeM3: number | null;
  metadata: Record<string, unknown>;
  attributes: AttributeValueMock[];
  warehouseIds: string[];
  createdAt: string;
  updatedAt: string;
};

const nextItemId = () => `item-${Math.random().toString(16).slice(2, 8)}-${Date.now()}`;

const buildAttributeValue = (attr: ItemAttributePayload): AttributeValueMock | null => {
  const templateId = attr.templateId ?? attr.templateID ?? attr.template_id ?? '';
  if (!templateId) {
    return null;
  }
  const templates = ensureAttributeTemplateCollection('item');
  const template = templates.find((tpl) => tpl.id === templateId);
  if (!template) {
    return null;
  }
  return {
    template,
    stringValue: attr.stringValue,
    numberValue: attr.numberValue,
    booleanValue: attr.booleanValue,
    jsonValue: attr.jsonValue ?? undefined
  };
};

const wmsItems: ItemMock[] = [
  (() => {
    const templates = ensureAttributeTemplateCollection('item');
    const nowTs = now();
    const category = ensureCatalogCollection('category').find((node) => node.id === 'cat-signage');
    const unit = ensureCatalogCollection('unit').find((node) => node.id === 'unit-pcs');
    const attrs = [
      { templateId: templates[0].id, stringValue: 'Синий' },
      { templateId: templates[1].id, numberValue: 2400 },
      { templateId: templates[2].id, booleanValue: true }
    ];
    return {
      id: 'item-demo-1',
      sku: 'DEMO-SIGN-001',
      name: 'Демонстрационная вывеска',
      description: 'Базовая демонстрационная карточка изделия',
      categoryId: category?.id ?? null,
      categoryPath: category?.path ?? '',
      category: category
        ? { id: category.id, code: category.code, name: category.name, path: category.path, metadata: category.metadata }
        : undefined,
      unitId: unit?.id ?? 'unit-pcs',
      unit: unit ? { id: unit.id, code: unit.code, name: unit.name, metadata: unit.metadata } : undefined,
      barcode: '4600000000017',
      weightKg: 35.5,
      volumeM3: 0.8,
      metadata: { demo: true },
      attributes: attrs.map((attr) => buildAttributeValue(attr)).filter(Boolean) as AttributeValueMock[],
      warehouseIds: ['wh-1'],
      createdAt: nowTs,
      updatedAt: nowTs
    } as ItemMock;
  })()
];

const collectCatalogDescendants = (collection: CatalogNodeMock[], nodeId: string): Set<string> => {
  const descendants = new Set<string>([nodeId]);
  const stack = [nodeId];
  while (stack.length) {
    const current = stack.pop();
    for (const child of collection.filter((item) => item.parentId === current)) {
      if (!descendants.has(child.id)) {
        descendants.add(child.id);
        stack.push(child.id);
      }
    }
  }
  return descendants;
};

const stockItems = [
  { sku: 'SKU-001', warehouse: 'MSK-01', quantity: 125, uom: 'pcs', updatedAt: now() },
  { sku: 'SKU-002', warehouse: 'MSK-01', quantity: 12, uom: 'pcs', updatedAt: now() },
  { sku: 'SKU-003', warehouse: 'MSK-01', quantity: 4, uom: 'pcs', updatedAt: now() },
  { sku: 'SKU-004', warehouse: 'SPB-02', quantity: 87, uom: 'pcs', updatedAt: now() },
  { sku: 'SKU-005', warehouse: 'SPB-02', quantity: 240, uom: 'pcs', updatedAt: now() }
];

// Core RBAC sample data
const coreRoles = [
  { code: 'director', description: 'Генеральный директор' },
  { code: 'sales', description: 'Продажи' },
  { code: 'warehouse', description: 'Склад' }
];

const coreOrgUnits = [
  {
    id: 'org-1',
    parentId: null,
    code: 'HQ',
    name: 'Головной офис',
    description: 'Корневой юнит',
    path: 'HQ',
    level: 0,
    isActive: true,
    metadata: {},
    createdAt: now(),
    updatedAt: now()
  },
  {
    id: 'org-2',
    parentId: 'org-1',
    code: 'HQ-SALES',
    name: 'Отдел продаж',
    description: 'Коммерческий блок',
    path: 'HQ.HQ-SALES',
    level: 1,
    isActive: true,
    metadata: {},
    createdAt: now(),
    updatedAt: now()
  }
];

const coreRolePermissions = [
  {
    roleCode: 'director',
    resource: '*',
    action: '*',
    scope: '*',
    effect: 'allow',
    metadata: {},
    createdAt: now(),
    updatedAt: now()
  },
  {
    roleCode: 'sales',
    resource: 'crm.deal',
    action: 'write',
    scope: 'HQ-SALES',
    effect: 'allow',
    metadata: {},
    createdAt: now(),
    updatedAt: now()
  }
];

type CoreApiTokenMock = {
  id: string;
  name: string;
  roleCode: string;
  scope: string;
  createdAt: string;
  createdBy: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
};

const coreApiTokens: CoreApiTokenMock[] = [
  {
    id: 'token-1',
    name: 'CRM Integration',
    roleCode: 'sales',
    scope: 'HQ-SALES',
    createdAt: now(),
    createdBy: '10000000-0000-0000-0000-000000000001',
    lastUsedAt: now(),
    revokedAt: null
  }
];

const getWarehouseDetails = (warehouseId: string) => {
  const warehouse = wmsWarehouses.find((item) => item.id === warehouseId);
  if (!warehouse) {
    return null;
  }

  return {
    warehouse,
    zones: wmsZones.filter((zone) => zone.warehouseId === warehouseId),
    cells: wmsCells.filter((cell) => cell.warehouseId === warehouseId),
    equipment: wmsEquipment.filter((item) => item.warehouseId === warehouseId)
  };
};

// CRM sample data
const crmCustomers = [
  {
    id: 'cust-1',
    name: 'ООО «Интеграция»',
    inn: '7701234567',
    kpp: '770101001',
    createdAt: now()
  },
  {
    id: 'cust-2',
    name: 'АО «Фабрика решений»',
    inn: '7809876543',
    kpp: '780901001',
    createdAt: now()
  }
];

const crmDeals = [
  {
    id: 'deal-1',
    title: 'Внедрение WMS',
    customerId: 'cust-1',
    stage: 'proposal',
    amount: 3500000,
    currency: 'RUB',
    createdBy: 'manager@asfp.pro',
    createdAt: now()
  },
  {
    id: 'deal-2',
    title: 'CRM автоматизация',
    customerId: 'cust-2',
    stage: 'negotiation',
    amount: 1800000,
    currency: 'RUB',
    createdBy: 'manager@asfp.pro',
    createdAt: now()
  }
];

const crmDealHistory = {
  'deal-1': [
    { id: 1, dealId: 'deal-1', eventType: 'stage.changed', payload: { from: 'lead', to: 'proposal' }, createdAt: now() },
    { id: 2, dealId: 'deal-1', eventType: 'note.added', payload: { author: 'manager', text: 'Подготовлено ТКП' }, createdAt: now() }
  ],
  'deal-2': [
    { id: 3, dealId: 'deal-2', eventType: 'stage.changed', payload: { from: 'proposal', to: 'negotiation' }, createdAt: now() }
  ],
  unit: [
    {
      id: 'unit-pcs',
      type: 'unit',
      parentId: null,
      code: 'PCS',
      name: 'Штуки',
      description: 'Единицы поштучного учёта',
      level: 0,
      path: 'PCS',
      metadata: { decimalPlaces: 0 },
      sortOrder: 0,
      isActive: true,
      createdBy: null,
      updatedBy: null,
      createdAt: now(),
      updatedAt: now()
    },
    {
      id: 'unit-kg',
      type: 'unit',
      parentId: null,
      code: 'KG',
      name: 'Килограммы',
      description: 'Единицы массы',
      level: 0,
      path: 'KG',
      metadata: { decimalPlaces: 3 },
      sortOrder: 10,
      isActive: true,
      createdBy: null,
      updatedBy: null,
      createdAt: now(),
      updatedAt: now()
    }
  ]
};

// Docs sample data
const docsTemplates = [
  {
    id: 'tpl-1',
    code: 'AGR-001',
    name: 'Договор поставки',
    description: 'Базовый договор поставки оборудования',
    version: 3,
    body: { sections: ['Вводная часть', 'Платежи', 'Сроки'] },
    createdAt: now(),
    updatedAt: now()
  }
];

const docsSigners = [
  {
    id: 'signer-1',
    code: 'CEO',
    fullName: 'Алексей Смирнов',
    position: 'Генеральный директор',
    email: 'ceo@asfp.pro',
    phone: '+7 495 000-00-01',
    createdAt: now(),
    updatedAt: now()
  }
];

const docsDocuments = [
  {
    id: 'doc-1',
    templateId: 'tpl-1',
    sequenceId: 'seq-1',
    number: 'AGR-2025/001',
    title: 'Договор с ООО «Интеграция»',
    status: 'approved',
    payload: {},
    issuedAt: now(),
    signedAt: now(),
    archivedAt: null,
    createdAt: now(),
    updatedAt: now(),
    signers: [
      {
        id: 'doc-sign-1',
        signerId: 'signer-1',
        fullName: 'Алексей Смирнов',
        email: 'ceo@asfp.pro',
        status: 'signed',
        order: 1,
        signedAt: now(),
        updatedAt: now()
      }
    ]
  }
];

// BPM sample data
const bpmProcesses = [
  {
    id: 'proc-1',
    code: 'onboarding',
    name: 'Онбординг клиента',
    description: 'Контроль этапов запуска проекта',
    version: 2,
    status: 'active',
    definition: { steps: 5 },
    createdAt: now(),
    updatedAt: now()
  },
  {
    id: 'proc-2',
    code: 'contract',
    name: 'Согласование договора',
    description: 'Маршрут согласования документов',
    version: 1,
    status: 'draft',
    definition: { steps: 3 },
    createdAt: now(),
    updatedAt: now()
  }
];

const bpmForms = [
  {
    id: 'form-1',
    processId: 'proc-1',
    code: 'onboarding-main',
    name: 'Основная анкета клиента',
    version: 4,
    schema: { type: 'object' },
    uiSchema: { order: ['name', 'contacts'] },
    createdAt: now(),
    updatedAt: now()
  }
];

const bpmTasks = [
  {
    id: 'task-1',
    processId: 'proc-1',
    code: 'kickoff',
    title: 'Назначить встречу для запуска',
    status: 'in_progress',
    assignee: 'manager@asfp.pro',
    dueAt: now(),
    payload: { project: 'CRM' },
    createdAt: now(),
    updatedAt: now()
  },
  {
    id: 'task-2',
    processId: 'proc-2',
    code: 'legal-review',
    title: 'Юридическая проверка',
    status: 'todo',
    assignee: '',
    dueAt: null,
    payload: {},
    createdAt: now(),
    updatedAt: now()
  }
];

// Analytics sample data
const analyticsConversion = [
  {
    period: now(),
    totalCount: 12,
    wonCount: 4,
    totalAmount: 7200000,
    wonAmount: 3200000,
    conversionRate: 0.33
  },
  {
    period: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    totalCount: 9,
    wonCount: 2,
    totalAmount: 5400000,
    wonAmount: 1500000,
    conversionRate: 0.22
  }
];

const analyticsManagerLoad = [
  { manager: 'Ирина Иванова', totalCount: 5, totalAmount: 3200000 },
  { manager: 'Петр Сидоров', totalCount: 4, totalAmount: 2800000 }
];

export const handlers = [
  // WMS
  http.get('*/api/v1/master-data/warehouses', () => HttpResponse.json({ items: wmsWarehouses })),
  http.get('*/api/v1/master-data/warehouses/:id', ({ params }) => {
    const { id } = params as { id: string };
    const details = getWarehouseDetails(id);
    if (!details) {
      return HttpResponse.json({ message: 'Warehouse not found' }, { status: 404 });
    }
    return HttpResponse.json(details);
  }),
  http.get('*/api/v1/master-data/catalog/:type', ({ params }) => {
    const { type } = params as { type: string };
    const collection = ensureCatalogCollection(type);
    return HttpResponse.json({ items: collection });
  }),
  http.post('*/api/v1/master-data/catalog/:type', async ({ params, request }) => {
    const { type } = params as { type: string };
    const payload = (await request.json()) as {
      parentId?: string | null;
      code?: string;
      name?: string;
      description?: string;
      sortOrder?: number;
      isActive?: boolean;
      metadata?: Record<string, unknown>;
    };
    const collection = ensureCatalogCollection(type);
    const code = (payload.code ?? '').trim();
    const name = (payload.name ?? '').trim();
    if (!code || !name) {
      return HttpResponse.json({ message: 'code and name are required' }, { status: 400 });
    }
    if (collection.some((node) => node.code.toLowerCase() === code.toLowerCase())) {
      return HttpResponse.json({ message: 'duplicate code' }, { status: 409 });
    }

    const defaultParent = collection.find((node) => node.parentId === null) ?? null;
    const parent = payload.parentId ? collection.find((node) => node.id === payload.parentId) : defaultParent;

    const node: CatalogNodeMock = {
      id: nextCatalogId(type),
      type,
      parentId: parent?.id ?? null,
      code,
      name,
      description: payload.description?.trim() || null,
      level: 0,
      path: code,
      metadata: payload.metadata && typeof payload.metadata === 'object' && !Array.isArray(payload.metadata)
        ? payload.metadata
        : {},
      sortOrder:
        typeof payload.sortOrder === 'number' && Number.isFinite(payload.sortOrder)
          ? payload.sortOrder
          : (parent ? parent.level + 1 : 0) * 100 + 10,
      isActive: payload.isActive ?? true,
      createdBy: null,
      updatedBy: null,
      createdAt: now(),
      updatedAt: now()
    };

    collection.push(node);
    updateDescendantHierarchy(collection, node);

    return HttpResponse.json(node, { status: 201 });
  }),
  http.put('*/api/v1/master-data/catalog/:type/:id', async ({ params, request }) => {
    const { type, id } = params as { type: string; id: string };
    const payload = (await request.json()) as {
      parentId?: string | null;
      code?: string;
      name?: string;
      description?: string;
      sortOrder?: number;
      isActive?: boolean;
      metadata?: Record<string, unknown>;
    };
    const collection = ensureCatalogCollection(type);
    const node = collection.find((item) => item.id === id);
    if (!node) {
      return HttpResponse.json({ message: 'not found' }, { status: 404 });
    }

    if (payload.code) {
      const trimmed = payload.code.trim();
      if (!trimmed) {
        return HttpResponse.json({ message: 'code is required' }, { status: 400 });
      }
      if (
        collection.some((item) => item.id !== node.id && item.code.toLowerCase() === trimmed.toLowerCase())
      ) {
        return HttpResponse.json({ message: 'duplicate code' }, { status: 409 });
      }
      node.code = trimmed;
    }

    if (payload.name) {
      node.name = payload.name.trim() || node.name;
    }
    if (payload.description !== undefined) {
      node.description = payload.description?.trim() || null;
    }
    if (payload.metadata && typeof payload.metadata === 'object' && !Array.isArray(payload.metadata)) {
      node.metadata = payload.metadata;
    }
    if (typeof payload.sortOrder === 'number' && Number.isFinite(payload.sortOrder)) {
      node.sortOrder = payload.sortOrder;
    }
    if (typeof payload.isActive === 'boolean') {
      node.isActive = payload.isActive;
    }

    if (payload.parentId !== undefined) {
      const parent = payload.parentId ? collection.find((item) => item.id === payload.parentId) : null;
      if (parent && parent.id === node.id) {
        return HttpResponse.json({ message: 'parent cannot be self' }, { status: 400 });
      }
      if (payload.parentId && !parent) {
        return HttpResponse.json({ message: 'parent not found' }, { status: 404 });
      }
      if (parent) {
        const descendants = collectCatalogDescendants(collection, node.id);
        if (descendants.has(parent.id)) {
          return HttpResponse.json({ message: 'parent cannot be descendant' }, { status: 400 });
        }
      }
      node.parentId = parent?.id ?? null;
    }

    node.updatedAt = now();
    updateDescendantHierarchy(collection, node);

    return HttpResponse.json(node);
  }),
  http.delete('*/api/v1/master-data/catalog/:type/:id', ({ params }) => {
    const { type, id } = params as { type: string; id: string };
    const collection = ensureCatalogCollection(type);
    const index = collection.findIndex((item) => item.id === id);
    if (index < 0) {
      return HttpResponse.json({ message: 'not found' }, { status: 404 });
    }
    const node = collection[index];
    if (node.parentId === null) {
      return HttpResponse.json({ message: 'root cannot be removed' }, { status: 400 });
    }
    if (collection.some((item) => item.parentId === node.id)) {
      return HttpResponse.json({ message: 'delete children first' }, { status: 409 });
    }
    collection.splice(index, 1);
    return HttpResponse.json(null, { status: 204 });
  }),
  http.get('*/api/v1/master-data/attribute-templates', ({ request }) => {
    const url = new URL(request.url);
    const target = (url.searchParams.get('target') ?? 'item').trim() || 'item';
    const templates = ensureAttributeTemplateCollection(target);
    return HttpResponse.json({ items: templates });
  }),
  http.post('*/api/v1/master-data/attribute-templates', async ({ request }) => {
    const payload = (await request.json()) as {
      code?: string;
      name?: string;
      description?: string;
      targetType?: string;
      dataType?: string;
      isRequired?: boolean;
      position?: number;
      metadata?: Record<string, unknown>;
      uiSchema?: Record<string, unknown>;
    };
    const code = (payload.code ?? '').trim();
    const name = (payload.name ?? '').trim();
    const dataType = (payload.dataType ?? '').trim();
    if (!code || !name || !dataType) {
      return HttpResponse.json({ message: 'code, name and dataType are required' }, { status: 400 });
    }
    const target = (payload.targetType ?? 'item').trim() || 'item';
    const collection = ensureAttributeTemplateCollection(target);
    if (collection.some((tpl) => tpl.code === code)) {
      return HttpResponse.json({ message: 'duplicate code' }, { status: 409 });
    }
    const template: AttributeTemplateMock = {
      id: nextTemplateId(),
      code,
      name,
      description: payload.description?.trim() || null,
      targetType: target,
      dataType: dataType.toLowerCase(),
      isRequired: Boolean(payload.isRequired),
      metadata:
        payload.metadata && typeof payload.metadata === 'object' && !Array.isArray(payload.metadata)
          ? payload.metadata
          : {},
      uiSchema:
        payload.uiSchema && typeof payload.uiSchema === 'object' && !Array.isArray(payload.uiSchema)
          ? payload.uiSchema
          : {},
      position:
        typeof payload.position === 'number' && Number.isFinite(payload.position)
          ? payload.position
          : collection.length * 10 + 10,
      createdAt: now(),
      updatedAt: now()
    };
    collection.push(template);
    return HttpResponse.json(template, { status: 201 });
  }),
  http.put('*/api/v1/master-data/attribute-templates/:templateId', async ({ params, request }) => {
    const { templateId } = params as { templateId: string };
    const payload = (await request.json()) as {
      name?: string;
      description?: string;
      dataType?: string;
      isRequired?: boolean;
      position?: number;
      metadata?: Record<string, unknown>;
      uiSchema?: Record<string, unknown>;
    };
    const collections = Object.values(wmsAttributeTemplates);
    let template: AttributeTemplateMock | undefined;
    for (const templates of collections) {
      const found = templates.find((tpl) => tpl.id === templateId);
      if (found) {
        template = found;
        break;
      }
    }
    if (!template) {
      return HttpResponse.json({ message: 'not found' }, { status: 404 });
    }
    if (payload.name !== undefined) {
      const name = payload.name.trim();
      if (!name) {
        return HttpResponse.json({ message: 'name is required' }, { status: 400 });
      }
      template.name = name;
    }
    if (payload.description !== undefined) {
      template.description = payload.description?.trim() || null;
    }
    if (payload.dataType) {
      template.dataType = payload.dataType.trim().toLowerCase();
    }
    if (payload.isRequired !== undefined) {
      template.isRequired = Boolean(payload.isRequired);
    }
    if (payload.position !== undefined && Number.isFinite(payload.position)) {
      template.position = Number(payload.position);
    }
    if (payload.metadata && typeof payload.metadata === 'object' && !Array.isArray(payload.metadata)) {
      template.metadata = payload.metadata;
    }
    if (payload.uiSchema && typeof payload.uiSchema === 'object' && !Array.isArray(payload.uiSchema)) {
      template.uiSchema = payload.uiSchema;
    }
    template.updatedAt = now();
    return HttpResponse.json(template);
  }),
  http.delete('*/api/v1/master-data/attribute-templates/:templateId', ({ params }) => {
    const { templateId } = params as { templateId: string };
    const collections = Object.values(wmsAttributeTemplates);
    for (const templates of collections) {
      const index = templates.findIndex((tpl) => tpl.id === templateId);
      if (index >= 0) {
        templates.splice(index, 1);
        return HttpResponse.json(null, { status: 204 });
      }
    }
    return HttpResponse.json({ message: 'not found' }, { status: 404 });
  }),
  http.get('*/api/v1/master-data/items', () => HttpResponse.json({ items: wmsItems })),
  http.get('*/api/v1/master-data/items/:id', ({ params }) => {
    const { id } = params as { id: string };
    const item = wmsItems.find((entry) => entry.id === id);
    if (!item) {
      return HttpResponse.json({ message: 'not found' }, { status: 404 });
    }
    return HttpResponse.json(item);
  }),
  http.post('*/api/v1/master-data/items', async ({ request }) => {
    const payload = (await request.json()) as ItemPayloadInput;
    const sku = (payload.sku ?? '').trim();
    const name = (payload.name ?? '').trim();
    const unitId = (payload.unitId ?? '').trim();
    if (!sku || !name || !unitId) {
      return HttpResponse.json({ message: 'sku, name and unitId are required' }, { status: 400 });
    }
    const unit = ensureCatalogCollection('unit').find((node) => node.id === unitId);
    if (!unit) {
      return HttpResponse.json({ message: 'unit not found' }, { status: 400 });
    }
    const category = payload.categoryId ? ensureCatalogCollection('category').find((node) => node.id === payload.categoryId) : null;
    const attributesPayload = Array.isArray(payload.attributes) ? payload.attributes : [];
    const attributes = attributesPayload
      .map((attr) => buildAttributeValue(attr))
      .filter(Boolean) as AttributeValueMock[];
    const nowTs = now();
    const item: ItemMock = {
      id: nextItemId(),
      sku,
      name,
      description: payload.description?.trim() || null,
      categoryId: category?.id ?? null,
      categoryPath: category?.path ?? '',
      category: category
        ? { id: category.id, code: category.code, name: category.name, path: category.path, metadata: category.metadata }
        : undefined,
      unitId: unit.id,
      unit: { id: unit.id, code: unit.code, name: unit.name, metadata: unit.metadata },
      barcode: payload.barcode?.trim() || null,
      weightKg: typeof payload.weightKg === 'number' ? payload.weightKg : null,
      volumeM3: typeof payload.volumeM3 === 'number' ? payload.volumeM3 : null,
      metadata:
        payload.metadata && typeof payload.metadata === 'object' && !Array.isArray(payload.metadata)
          ? payload.metadata
          : {},
      attributes,
      warehouseIds: Array.isArray(payload.warehouseIds) ? payload.warehouseIds : [],
      createdAt: nowTs,
      updatedAt: nowTs
    };
    wmsItems.push(item);
    return HttpResponse.json(item, { status: 201 });
  }),
  http.put('*/api/v1/master-data/items/:id', async ({ params, request }) => {
    const { id } = params as { id: string };
    const index = wmsItems.findIndex((entry) => entry.id === id);
    if (index < 0) {
      return HttpResponse.json({ message: 'not found' }, { status: 404 });
    }
    const payload = (await request.json()) as ItemPayloadInput;
    const sku = (payload.sku ?? '').trim();
    const name = (payload.name ?? '').trim();
    const unitId = (payload.unitId ?? '').trim();
    if (!sku || !name || !unitId) {
      return HttpResponse.json({ message: 'sku, name and unitId are required' }, { status: 400 });
    }
    const unit = ensureCatalogCollection('unit').find((node) => node.id === unitId);
    if (!unit) {
      return HttpResponse.json({ message: 'unit not found' }, { status: 400 });
    }
    const category = payload.categoryId ? ensureCatalogCollection('category').find((node) => node.id === payload.categoryId) : null;
    const attributesPayload = Array.isArray(payload.attributes) ? payload.attributes : [];
    const attributes = attributesPayload
      .map((attr) => buildAttributeValue(attr))
      .filter(Boolean) as AttributeValueMock[];
    const existing = wmsItems[index];
    const updated: ItemMock = {
      ...existing,
      sku,
      name,
      description: payload.description?.trim() || null,
      categoryId: category?.id ?? null,
      categoryPath: category?.path ?? '',
      category: category
        ? { id: category.id, code: category.code, name: category.name, path: category.path, metadata: category.metadata }
        : undefined,
      unitId: unit.id,
      unit: { id: unit.id, code: unit.code, name: unit.name, metadata: unit.metadata },
      barcode: payload.barcode?.trim() || null,
      weightKg: typeof payload.weightKg === 'number' ? payload.weightKg : null,
      volumeM3: typeof payload.volumeM3 === 'number' ? payload.volumeM3 : null,
      metadata:
        payload.metadata && typeof payload.metadata === 'object' && !Array.isArray(payload.metadata)
          ? payload.metadata
          : {},
      attributes,
      warehouseIds: Array.isArray(payload.warehouseIds) ? payload.warehouseIds : existing.warehouseIds,
      updatedAt: now()
    };
    wmsItems[index] = updated;
    return HttpResponse.json(updated);
  }),
  http.delete('*/api/v1/master-data/items/:id', ({ params }) => {
    const { id } = params as { id: string };
    const index = wmsItems.findIndex((entry) => entry.id === id);
    if (index < 0) {
      return HttpResponse.json({ message: 'not found' }, { status: 404 });
    }
    wmsItems.splice(index, 1);
    return HttpResponse.json(null, { status: 204 });
  }),
  http.get('*/api/v1/stock/', ({ request }) => {
    if (request.headers.get('x-mock-rbac') === 'deny') {
      return HttpResponse.json({ error: 'Недостаточно прав' }, { status: 403 });
    }
    const url = new URL(request.url);
    const warehouse = url.searchParams.get('warehouse') ?? '';
    const limitParam = Number.parseInt(url.searchParams.get('limit') ?? '200', 10);
    const sku = (url.searchParams.get('sku') ?? '').trim().toLowerCase();

    let items = stockItems;
    if (warehouse) {
      items = items.filter((item) => item.warehouse === warehouse);
    }
    if (sku) {
      items = items.filter((item) => item.sku.toLowerCase().includes(sku));
    }

    const limit = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 200;
    return HttpResponse.json({ items: items.slice(0, limit) });
  }),

  // CRM
  http.get('*/api/v1/crm/customers', ({ request }) => {
    const url = new URL(request.url);
    const limit = Number.parseInt(url.searchParams.get('limit') ?? '25', 10);
    return HttpResponse.json({ items: crmCustomers.slice(0, Number.isFinite(limit) ? limit : 25) });
  }),
  http.get('*/api/v1/crm/deals', ({ request }) => {
    if (request.headers.get('x-mock-rbac') === 'deny') {
      return HttpResponse.json({ error: 'Недостаточно прав' }, { status: 403 });
    }
    const url = new URL(request.url);
    const stage = (url.searchParams.get('stage') ?? '').trim();
    const limit = Number.parseInt(url.searchParams.get('limit') ?? '25', 10);
    const filtered = stage ? crmDeals.filter((deal) => deal.stage === stage) : crmDeals;
    return HttpResponse.json({ items: filtered.slice(0, Number.isFinite(limit) ? limit : 25) });
  }),
  http.get('*/api/v1/crm/deals/:id/history', ({ params, request }) => {
    const { id } = params as { id: string };
    const url = new URL(request.url);
    const limit = Number.parseInt(url.searchParams.get('limit') ?? '20', 10);
    const history = crmDealHistory[id as keyof typeof crmDealHistory] ?? [];
    return HttpResponse.json({ items: history.slice(0, Number.isFinite(limit) ? limit : 20) });
  }),

  // Docs
  http.get('*/api/v1/docs/templates', ({ request }) => {
    const url = new URL(request.url);
    const limit = Number.parseInt(url.searchParams.get('limit') ?? '20', 10);
    return HttpResponse.json({ items: docsTemplates.slice(0, Number.isFinite(limit) ? limit : 20) });
  }),
  http.get('*/api/v1/docs/signers', ({ request }) => {
    const url = new URL(request.url);
    const limit = Number.parseInt(url.searchParams.get('limit') ?? '20', 10);
    return HttpResponse.json({ items: docsSigners.slice(0, Number.isFinite(limit) ? limit : 20) });
  }),
  http.get('*/api/v1/docs/documents', ({ request }) => {
    const url = new URL(request.url);
    const limit = Number.parseInt(url.searchParams.get('limit') ?? '20', 10);
    const status = (url.searchParams.get('status') ?? '').trim();
    const filtered = status ? docsDocuments.filter((doc) => doc.status === status) : docsDocuments;
    return HttpResponse.json({ items: filtered.slice(0, Number.isFinite(limit) ? limit : 20) });
  }),

  // BPM
  http.get('*/api/v1/bpm/processes', ({ request }) => {
    const url = new URL(request.url);
    const limit = Number.parseInt(url.searchParams.get('limit') ?? '20', 10);
    const status = (url.searchParams.get('status') ?? '').trim();
    const filtered = status ? bpmProcesses.filter((proc) => proc.status === status) : bpmProcesses;
    return HttpResponse.json({ items: filtered.slice(0, Number.isFinite(limit) ? limit : 20) });
  }),
  http.get('*/api/v1/bpm/forms', ({ request }) => {
    const url = new URL(request.url);
    const limit = Number.parseInt(url.searchParams.get('limit') ?? '20', 10);
    return HttpResponse.json({ items: bpmForms.slice(0, Number.isFinite(limit) ? limit : 20) });
  }),
  http.get('*/api/v1/bpm/tasks', ({ request }) => {
    const url = new URL(request.url);
    const limit = Number.parseInt(url.searchParams.get('limit') ?? '20', 10);
    const status = (url.searchParams.get('status') ?? '').trim();
    const filtered = status ? bpmTasks.filter((task) => task.status === status) : bpmTasks;
    return HttpResponse.json({ items: filtered.slice(0, Number.isFinite(limit) ? limit : 20) });
  }),

  // Core RBAC
  http.get('*/api/v1/auth/me', () =>
    HttpResponse.json({
      id: '10000000-0000-0000-0000-000000000001',
      email: 'admin@example.com',
      fullName: 'Администратор',
      roles: [
        { code: 'director', scope: '*' },
        { code: 'sales', scope: 'HQ-SALES' }
      ],
      orgUnits: ['HQ', 'HQ-SALES']
    })
  ),
  http.get('*/api/v1/roles', () => HttpResponse.json({ items: coreRoles })),
  http.get('*/api/v1/roles/:code/permissions', ({ params }) => {
    const { code } = params as { code: string };
    const filtered = coreRolePermissions.filter((perm) => perm.roleCode === code || perm.roleCode === '*');
    return HttpResponse.json({ items: filtered });
  }),
  http.get('*/api/v1/org-units', () => HttpResponse.json({ items: coreOrgUnits })),
  http.post('*/api/v1/org-units', async ({ request }) => {
    const payload = (await request.json()) as { code: string; name: string; parentCode?: string };
    const code = payload.code?.toUpperCase();
    const parent = coreOrgUnits.find((unit) => unit.code === (payload.parentCode ?? '').toUpperCase());
    const unit = {
      id: `org-${Date.now()}`,
      parentId: parent?.id ?? null,
      code,
      name: payload.name ?? code,
      description: payload.description ?? null,
      path: parent ? `${parent.path}.${code}` : code,
      level: parent ? parent.level + 1 : 0,
      isActive: true,
      metadata: {},
      createdAt: now(),
      updatedAt: now()
    };
    coreOrgUnits.push(unit);
    return HttpResponse.json(unit, { status: 201 });
  }),
  http.put('*/api/v1/org-units/:code', async ({ params, request }) => {
    const { code } = params as { code: string };
    const payload = (await request.json()) as { name?: string; isActive?: boolean };
    const unit = coreOrgUnits.find((item) => item.code === code);
    if (!unit) {
      return HttpResponse.json({ error: 'not found' }, { status: 404 });
    }
    unit.name = payload.name ?? unit.name;
    if (typeof payload.isActive === 'boolean') {
      unit.isActive = payload.isActive;
    }
    unit.updatedAt = now();
    return HttpResponse.json(unit);
  }),
  http.delete('*/api/v1/org-units/:code', ({ params }) => {
    const { code } = params as { code: string };
    const index = coreOrgUnits.findIndex((unit) => unit.code === code);
    if (index >= 0) {
      coreOrgUnits.splice(index, 1);
    }
    return HttpResponse.json(null, { status: 204 });
  }),
  http.get('*/api/v1/api-tokens', () => HttpResponse.json({ items: coreApiTokens })),
  http.post('*/api/v1/api-tokens', async ({ request }) => {
    const payload = (await request.json()) as { name: string; roleCode: string; scope?: string };
    const token = {
      id: `token-${Date.now()}`,
      name: payload.name,
      roleCode: payload.roleCode,
      scope: payload.scope ?? '*',
      createdAt: now(),
      createdBy: '10000000-0000-0000-0000-000000000001',
      lastUsedAt: null,
      revokedAt: null
    };
    coreApiTokens.push(token);
    return HttpResponse.json({ ...token, token: 'mock-token-secret' }, { status: 201 });
  }),
  http.delete('*/api/v1/api-tokens/:id', ({ params }) => {
    const { id } = params as { id: string };
    const token = coreApiTokens.find((item) => item.id === id);
    if (!token) {
      return HttpResponse.json({ error: 'not found' }, { status: 404 });
    }
    token.revokedAt = now();
    return HttpResponse.json(token);
  }),

  // Analytics
  http.get('*/api/v1/analytics/reports/conversion', () => HttpResponse.json({ items: analyticsConversion })),
  http.get('*/api/v1/analytics/reports/manager-load', () => HttpResponse.json({ items: analyticsManagerLoad }))
];
