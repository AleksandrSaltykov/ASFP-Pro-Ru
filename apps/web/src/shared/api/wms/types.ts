export type UUID = string;

export type PaginatedResponse<TItem> = {
  items: TItem[];
};

export type CatalogType = 'category' | 'unit' | string;

export type CatalogNode = {
  id: UUID;
  type: CatalogType;
  parentId?: UUID | null;
  code: string;
  name: string;
  description?: string;
  level?: number;
  path?: string;
  metadata?: Record<string, unknown>;
  sortOrder?: number;
  isActive: boolean;
  createdBy?: UUID;
  updatedBy?: UUID;
  createdAt: string;
  updatedAt: string;
};

export type CatalogNodePayload = {
  parentId?: UUID | null;
  code: string;
  name: string;
  description?: string;
  sortOrder?: number | null;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
};

export type AttributeDataType = 'string' | 'number' | 'boolean' | 'json';

export type AttributeTemplate = {
  id: UUID;
  code: string;
  name: string;
  description?: string;
  targetType: string;
  dataType: AttributeDataType;
  isRequired: boolean;
  metadata?: Record<string, unknown>;
  uiSchema?: Record<string, unknown>;
  position: number;
  createdAt: string;
  updatedAt: string;
};

export type AttributeValue = {
  template: AttributeTemplate;
  ownerType?: string;
  ownerId?: UUID;
  stringValue?: string;
  numberValue?: number;
  booleanValue?: boolean;
  jsonValue?: unknown;
  updatedAt: string;
};

export type AttributeValueInput = {
  templateId: UUID;
  stringValue?: string;
  numberValue?: number;
  booleanValue?: boolean;
  jsonValue?: unknown;
};

export type CatalogLink = {
  leftId: UUID;
  leftType: string;
  rightId: UUID;
  rightType: string;
  relationCode: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

export type CatalogLinkPayload = {
  rightId: UUID;
  rightType: string;
  relationCode: string;
  metadata?: Record<string, unknown>;
};

export type WarehouseAddress = {
  country?: string;
  region?: string;
  city?: string;
  street?: string;
  building?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
};

export type WarehouseOperatingHours = {
  weekdays?: Record<string, string>;
  notes?: string;
};

export type WarehouseContact = {
  phone?: string;
  email?: string;
  manager?: string;
  comment?: string;
};

export type Warehouse = {
  id: UUID;
  code: string;
  name: string;
  description?: string;
  address: WarehouseAddress;
  timezone: string;
  status: string;
  operatingHours: WarehouseOperatingHours;
  contact: WarehouseContact;
  metadata?: Record<string, unknown>;
  createdBy?: UUID;
  updatedBy?: UUID;
  createdAt: string;
  updatedAt: string;
};

export type WarehouseZone = {
  id: UUID;
  warehouseId: UUID;
  code: string;
  name: string;
  zoneType: string;
  isBuffer: boolean;
  temperatureMin?: number;
  temperatureMax?: number;
  hazardClass?: string;
  accessRestrictions?: string[];
  layout?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdBy?: UUID;
  updatedBy?: UUID;
  createdAt: string;
  updatedAt: string;
};

export type WarehouseCell = {
  id: UUID;
  warehouseId: UUID;
  zoneId: UUID;
  code: string;
  label?: string;
  address: Record<string, unknown>;
  cellType: string;
  status: string;
  isPickFace: boolean;
  lengthMm?: number;
  widthMm?: number;
  heightMm?: number;
  maxWeightKg?: number;
  maxVolumeL?: number;
  allowedHandling?: string[];
  temperatureMin?: number;
  temperatureMax?: number;
  hazardClasses?: string[];
  metadata?: Record<string, unknown>;
  createdBy?: UUID;
  updatedBy?: UUID;
  createdAt: string;
  updatedAt: string;
};

export type WarehouseEquipment = {
  id: UUID;
  warehouseId: UUID;
  code: string;
  name: string;
  type: string;
  status: string;
  manufacturer?: string;
  serialNumber?: string;
  commissioningDate?: string;
  metadata?: Record<string, unknown>;
  createdBy?: UUID;
  updatedBy?: UUID;
  createdAt: string;
  updatedAt: string;
};

export type WarehouseDetails = {
  warehouse: Warehouse;
  zones: WarehouseZone[];
  cells: WarehouseCell[];
  equipment: WarehouseEquipment[];
};

export type Item = {
  id: UUID;
  sku: string;
  name: string;
  description?: string;
  categoryId?: UUID;
  categoryPath?: string;
  category?: CatalogNode;
  unitId: UUID;
  unit?: CatalogNode;
  barcode?: string;
  weightKg?: number;
  volumeM3?: number;
  metadata?: Record<string, unknown>;
  warehouseIds?: UUID[];
  attributes?: AttributeValue[];
  createdBy?: UUID;
  updatedBy?: UUID;
  createdAt: string;
  updatedAt: string;
};

export type ItemPayload = {
  sku: string;
  name: string;
  description?: string;
  categoryId?: UUID | null;
  unitId: UUID;
  barcode?: string;
  weightKg?: number | null;
  volumeM3?: number | null;
  metadata?: Record<string, unknown>;
  warehouseIds?: UUID[];
  attributes?: AttributeValueInput[];
  actorId?: UUID;
};

export type CellHistoryItem = {
  id: number;
  cellId: UUID;
  changedAt: string;
  changedBy?: UUID;
  changeType: string;
  payload?: unknown;
};

export type WarehousePayload = {
  code: string;
  name: string;
  description?: string;
  address?: WarehouseAddress;
  timezone?: string;
  status?: string;
  operatingHours?: Record<string, string>;
  contact?: WarehouseContact;
  metadata?: Record<string, unknown>;
};

export type ZonePayload = {
  code: string;
  name: string;
  zoneType: string;
  isBuffer?: boolean;
  temperatureMin?: number | null;
  temperatureMax?: number | null;
  hazardClass?: string;
  accessRestrictions?: string[];
  layout?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

export type CellPayload = {
  code: string;
  label?: string;
  address?: Record<string, unknown>;
  cellType: string;
  status?: string;
  isPickFace?: boolean;
  lengthMm?: number | null;
  widthMm?: number | null;
  heightMm?: number | null;
  maxWeightKg?: number | null;
  maxVolumeL?: number | null;
  allowedHandling?: string[];
  temperatureMin?: number | null;
  temperatureMax?: number | null;
  hazardClasses?: string[];
  metadata?: Record<string, unknown>;
  actorId?: UUID;
};

export type EquipmentPayload = {
  code: string;
  name: string;
  type: string;
  status?: string;
  manufacturer?: string;
  serialNumber?: string;
  commissioningDate?: string;
  metadata?: Record<string, unknown>;
  actorId?: UUID;
};

export type StockItem = {
  sku: string;
  warehouse: string;
  quantity: number;
  uom: string;
  updatedAt: string;
};
