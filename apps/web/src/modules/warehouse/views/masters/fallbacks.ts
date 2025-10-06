import type {
  AttributeTemplate,
  CatalogLink,
  CatalogNode,
  Item,
  StockMovement,
  Warehouse,
  WarehouseCell,
  WarehouseZone
} from '@shared/api';
import type { CrmCustomer } from '@shared/api';

const now = () => new Date().toISOString();

export const fallbackCategories: CatalogNode[] = [
  {
    id: 'cat-root',
    type: 'category',
    parentId: null,
    code: 'ROOT',
    name: 'Категории',
    description: 'Корневая категория',
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
    parentId: 'cat-root',
    code: 'SIGNAGE',
    name: 'Рекламные конструкции',
    description: 'Вывески, короба, фасады',
    level: 1,
    path: 'ROOT.SIGNAGE',
    metadata: { color: '#3478f6' },
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
    parentId: 'cat-root',
    code: 'PRINT',
    name: 'Печатная продукция',
    description: 'Категория для печатных материалов',
    level: 1,
    path: 'ROOT.PRINT',
    metadata: {},
    sortOrder: 20,
    isActive: true,
    createdBy: null,
    updatedBy: null,
    createdAt: now(),
    updatedAt: now()
  }
];

export const fallbackUnits: CatalogNode[] = [
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
];

export const fallbackAttributeTemplates: AttributeTemplate[] = [
  {
    id: 'attr-color',
    code: 'COLOR',
    name: 'Цвет изделия',
    description: 'Базовый цвет исполнения',
    targetType: 'item',
    dataType: 'string',
    isRequired: false,
    metadata: {},
    uiSchema: {},
    position: 10,
    createdAt: now(),
    updatedAt: now()
  },
  {
    id: 'attr-power',
    code: 'POWER',
    name: 'Потребляемая мощность',
    description: 'Указывается в ваттах',
    targetType: 'item',
    dataType: 'number',
    isRequired: false,
    metadata: { unit: 'Вт' },
    uiSchema: {},
    position: 20,
    createdAt: now(),
    updatedAt: now()
  },
  {
    id: 'attr-outdoor',
    code: 'OUTDOOR',
    name: 'Для улицы',
    description: 'Подходит для наружной установки',
    targetType: 'item',
    dataType: 'boolean',
    isRequired: false,
    metadata: {},
    uiSchema: {},
    position: 30,
    createdAt: now(),
    updatedAt: now()
  }
];

export const fallbackItems: Item[] = [
  {
    id: 'item-demo-1',
    sku: 'DEMO-SIGN-001',
    name: 'Световая вывеска 1.5м',
    description: 'Демонстрационная модель вывески',
    categoryId: 'cat-signage',
    categoryPath: 'ROOT.SIGNAGE',
    category: fallbackCategories.find((c) => c.id === 'cat-signage'),
    unitId: 'unit-pcs',
    unit: fallbackUnits.find((unit) => unit.id === 'unit-pcs'),
    alternativeUnitId: 'unit-kg',
    alternativeUnit: fallbackUnits.find((unit) => unit.id === 'unit-kg'),
    conversionRate: 0.2,
    barcode: '4600000000017',
    weightKg: 32.4,
    volumeM3: 0.78,
    powerW: 180,
    metadata: { demo: true },
    warehouseIds: ['wh-main'],
    attributes: [],
    createdBy: null,
    updatedBy: null,
    createdAt: now(),
    updatedAt: now()
  },
  {
    id: 'item-demo-2',
    sku: 'DEMO-BANNER-003',
    name: 'Баннер ПВХ 3х6',
    description: 'Плотность 510 г/м², полноцвет',
    categoryId: 'cat-print',
    categoryPath: 'ROOT.PRINT',
    category: fallbackCategories.find((c) => c.id === 'cat-print'),
    unitId: 'unit-pcs',
    unit: fallbackUnits.find((unit) => unit.id === 'unit-pcs'),
    alternativeUnitId: 'unit-kg',
    alternativeUnit: fallbackUnits.find((unit) => unit.id === 'unit-kg'),
    conversionRate: 0.1,
    barcode: '4600000000024',
    weightKg: 18.2,
    volumeM3: 0.35,
    powerW: 120,
    metadata: { fabric: 'ПВХ' },
    warehouseIds: ['wh-main', 'wh-spb'],
    attributes: [],
    createdBy: null,
    updatedBy: null,
    createdAt: now(),
    updatedAt: now()
  }
];

export const fallbackConversionLinks: CatalogLink[] = [
  {
    leftId: 'unit-pcs',
    leftType: 'unit',
    rightId: 'unit-kg',
    rightType: 'unit',
    relationCode: 'PCS_TO_KG',
    metadata: { ratio: 0.45 },
    createdAt: now()
  }
];

export const fallbackWarehouses: Warehouse[] = [
  {
    id: 'wh-main',
    code: 'MSK-MAIN',
    name: 'Центральный склад (Москва)',
    description: 'Основной склад компании',
    address: {
      city: 'Москва',
      street: 'ул. Промышленная',
      building: '12с3'
    },
    timezone: 'Europe/Moscow',
    status: 'active',
    operatingHours: { weekdays: 'Пн-Пт 09:00–18:00' },
    contact: {
      manager: 'Иван Петров',
      phone: '+7 495 000-00-01',
      email: 'warehouse@asfp.pro'
    },
    metadata: {},
    createdBy: null,
    updatedBy: null,
    createdAt: now(),
    updatedAt: now()
  },
  {
    id: 'wh-spb',
    code: 'SPB-HUB',
    name: 'Распределительный центр (Санкт-Петербург)',
    description: 'Региональный склад северо-запад',
    address: {
      city: 'Санкт-Петербург',
      street: 'ул. Логистическая',
      building: '7'
    },
    timezone: 'Europe/Moscow',
    status: 'active',
    operatingHours: { weekdays: 'Пн-Сб 08:00–20:00' },
    contact: {
      manager: 'Ольга Соколова',
      phone: '+7 812 000-00-02',
      email: 'spb@asfp.pro'
    },
    metadata: {},
    createdBy: null,
    updatedBy: null,
    createdAt: now(),
    updatedAt: now()
  }
];

export const fallbackZones: WarehouseZone[] = [
  {
    id: 'zone-main-storage',
    warehouseId: 'wh-main',
    code: 'STORAGE',
    name: 'Стеллажное хранение',
    zoneType: 'STORAGE',
    isBuffer: false,
    temperatureMin: 15,
    temperatureMax: 25,
    hazardClass: null,
    accessRestrictions: ['СИЗ'],
    layout: {},
    metadata: {},
    createdBy: null,
    updatedBy: null,
    createdAt: now(),
    updatedAt: now()
  },
  {
    id: 'zone-main-buffer',
    warehouseId: 'wh-main',
    code: 'BUFFER',
    name: 'Буфер отгрузки',
    zoneType: 'BUFFER',
    isBuffer: true,
    temperatureMin: null,
    temperatureMax: null,
    hazardClass: null,
    accessRestrictions: [],
    layout: {},
    metadata: {},
    createdBy: null,
    updatedBy: null,
    createdAt: now(),
    updatedAt: now()
  }
];

export const fallbackCells: WarehouseCell[] = [
  {
    id: 'cell-a-01',
    warehouseId: 'wh-main',
    zoneId: 'zone-main-storage',
    code: 'A-01-01',
    label: 'A-01-01',
    address: { aisle: 'A', row: '01', level: '01' },
    cellType: 'PALLET',
    status: 'available',
    isPickFace: false,
    lengthMm: 1200,
    widthMm: 800,
    heightMm: 1400,
    maxWeightKg: 800,
    maxVolumeL: 1100,
    allowedHandling: ['forklift'],
    temperatureMin: 15,
    temperatureMax: 25,
    hazardClasses: [],
    metadata: {},
    createdBy: null,
    updatedBy: null,
    createdAt: now(),
    updatedAt: now()
  },
  {
    id: 'cell-b-05',
    warehouseId: 'wh-main',
    zoneId: 'zone-main-buffer',
    code: 'B-05-00',
    label: 'Буфер 5',
    address: { gate: 'B', lane: 5 },
    cellType: 'BUFFER',
    status: 'occupied',
    isPickFace: true,
    lengthMm: null,
    widthMm: null,
    heightMm: null,
    maxWeightKg: null,
    maxVolumeL: null,
    allowedHandling: ['manual'],
    temperatureMin: null,
    temperatureMax: null,
    hazardClasses: [],
    metadata: { note: 'Отгрузка сегодня 16:00' },
    createdBy: null,
    updatedBy: null,
    createdAt: now(),
    updatedAt: now()
  }
];

export const fallbackCustomers: CrmCustomer[] = [
  {
    id: 'cust-1',
    name: 'ООО «Ритейл Сити»',
    inn: '7701001001',
    kpp: '770101001',
    comment: 'Поставщик',
    phone: '+7 (495) 123-45-67',
    email: 'supply@retailcity.ru',
    website: 'https://retailcity.ru',
    legalAddress: '109012, г. Москва, ул. Ильинка, д. 4',
    actualAddress: '141400, г. Химки, ул. Лётная, д. 10',
    bankAccounts: [
      {
        id: 'cust-1-account-1',
        accountName: 'Основной расчётный счёт',
        bankName: 'ПАО «Сбербанк России»',
        accountNumber: '40702810500000000001',
        bik: '044525225',
        corrAccount: '30101810400000000225',
        comment: 'Основной'
      }
    ],
    contacts: [
      {
        id: 'cust-1-contact-1',
        name: 'Александр Журавлёв',
        position: 'Менеджер по закупкам',
        phone: '+7 (985) 555-12-34',
        email: 'zhuralyov@retailcity.ru'
      },
      {
        id: 'cust-1-contact-2',
        name: 'Мария Белова',
        position: 'Финансовый директор',
        phone: '+7 (495) 123-45-68',
        email: 'belova@retailcity.ru'
      }
    ],
    createdAt: now()
  },
  {
    id: 'cust-2',
    name: 'ООО «Северная реклама»',
    inn: '7802002002',
    kpp: '780201001',
    comment: 'Поставщик',
    phone: '+7 (812) 321-00-21',
    email: 'sales@northpromo.ru',
    website: 'https://northpromo.ru',
    legalAddress: '197101, г. Санкт-Петербург, Каменноостровский пр., д. 40',
    actualAddress: '197183, г. Санкт-Петербург, пр. Энгельса, д. 120',
    bankAccounts: [
      {
        id: 'cust-2-account-1',
        accountName: 'Расчётный счёт',
        bankName: 'Банк ВТБ (ПАО)',
        accountNumber: '40702810600000000002',
        bik: '044525411',
        corrAccount: '30101810700000000411',
        comment: 'Основной'
      },
      {
        id: 'cust-2-account-2',
        accountName: 'Резервный счёт',
        bankName: 'АО «Тинькофф Банк»',
        accountNumber: '40702810900000000003',
        bik: '044525974',
        corrAccount: '30101810145250000974',
        comment: 'Для крупных платежей'
      }
    ],
    contacts: [
      {
        id: 'cust-2-contact-1',
        name: 'Илья Смирнов',
        position: 'Коммерческий директор',
        phone: '+7 (921) 444-55-66',
        email: 'ismirnov@northpromo.ru'
      }
    ],
    createdAt: now()
  }
];

export const fallbackMovements: StockMovement[] = [
  {
    id: 'movement-1',
    occurredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    type: 'RECEIPT',
    itemCode: 'DEMO-SIGN-001',
    itemName: 'Световая вывеска 1.5м',
    fromWarehouse: 'Поставщик «НеонСнаб»',
    toWarehouse: 'MSK-MAIN',
    toZone: 'STORAGE',
    toBin: 'A-01-01',
    quantity: 8,
    uom: 'шт',
    reference: 'ASN-2025-001',
    actor: 'Иван Петров',
    note: 'Поставлено без замечаний'
  },
  {
    id: 'movement-2',
    occurredAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    type: 'MOVE',
    itemCode: 'DEMO-BANNER-003',
    itemName: 'Баннер ПВХ 3х6',
    fromWarehouse: 'MSK-MAIN',
    fromZone: 'STORAGE',
    fromBin: 'A-01-01',
    toWarehouse: 'MSK-MAIN',
    toZone: 'BUFFER',
    toBin: 'B-05-00',
    quantity: 5,
    uom: 'шт',
    reference: 'MOVE-4021',
    actor: 'Елена Новикова',
    note: 'Под отгрузку клиенту'
  }
];

export const fallbackData = {
  items: fallbackItems,
  attributeTemplates: fallbackAttributeTemplates,
  categories: fallbackCategories,
  units: fallbackUnits,
  conversionLinks: fallbackConversionLinks,
  warehouses: fallbackWarehouses,
  zones: fallbackZones,
  cells: fallbackCells,
  customers: fallbackCustomers,
  movements: fallbackMovements
};
