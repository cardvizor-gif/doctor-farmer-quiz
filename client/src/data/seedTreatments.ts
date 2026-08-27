import type { PriceItem } from './priceCatalog';

// Номенклатура из раздела «Протравители», исключая позиции со знаком *.
const REGISTERED_SEED_TREATMENTS = new Set([
  'Кардон, КС|1,0-1,5',
  'Редут, КС|0,4-0,5',
  'Тиматерр, КС (красный)|0,5-1,0',
  'Турион, КЭ|0,28-0,4',
  'Вернер, КС|0,2-0,5',
  'Форсер Энто, КС|0,3-0,6',
]);

export function isRegisteredSeedTreatment(item: PriceItem) {
  return REGISTERED_SEED_TREATMENTS.has(`${item.name}|${item.rate}`);
}
