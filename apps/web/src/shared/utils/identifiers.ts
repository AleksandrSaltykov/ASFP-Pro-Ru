const randomSuffix = () => Math.random().toString(36).slice(2, 6).toUpperCase();
const timestampPart = () => Date.now().toString(36).toUpperCase();

const buildCode = (prefix: string) => `${prefix}-${timestampPart()}${randomSuffix()}`;

export const generateSku = () => buildCode('SKU');
export const generateCategoryCode = () => buildCode('GRP');
export const generateUnitCode = () => buildCode('UNT');
export const generateWarehouseCode = () => buildCode('WH');
