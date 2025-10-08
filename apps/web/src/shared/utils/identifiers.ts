const randomSuffix = () => Math.random().toString(36).slice(2, 6).toUpperCase();
const timestampPart = () => Date.now().toString(36).toUpperCase();

const buildCode = (prefix: string) => `${prefix}-${timestampPart()}${randomSuffix()}`;

const generateDigits = (length: number) => {
  let digits = '';
  for (let i = 0; i < length; i += 1) {
    digits += Math.floor(Math.random() * 10).toString();
  }
  return digits;
};

const withCheckDigit = (base: string) => {
  const digits = base.split('').map((char) => Number.parseInt(char, 10));
  let sum = 0;
  for (let i = digits.length - 1, alt = true; i >= 0; i -= 1, alt = !alt) {
    let value = digits[i];
    if (alt) {
      value *= 3;
    }
    sum += value;
  }
  const mod = sum % 10;
  return `${base}${(10 - mod) % 10}`;
};

export const generateSku = () => buildCode('SKU');
export const generateCategoryCode = () => buildCode('GRP');
export const generateUnitCode = () => buildCode('UNT');
export const generateWarehouseCode = () => buildCode('WH');
export const generateBarcode = () => withCheckDigit(generateDigits(12));
export const generateDocumentNumber = (prefix: string) => buildCode(prefix.toUpperCase());
