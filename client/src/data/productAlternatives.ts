import type { PriceItem } from './priceCatalog';
import { isRegisteredSeedTreatment } from './seedTreatments';

export type AlternativeCategory = 'seed' | 'fungicide' | 'fertilizer' | 'herbicide' | 'insecticide';

const CROP_TERMS: Record<string, string[]> = {
  wheat_winter: ['пшениц', 'зернов'], wheat_spring: ['пшениц', 'зернов'], barley: ['ячмен', 'зернов'], oats: ['овес', 'овёс', 'зернов'],
  peas: ['горох', 'зернобобов'], lentil_green: ['чечевиц', 'зернобобов'], lentil_red: ['чечевиц', 'зернобобов'],
  flax_classic: ['лен', 'лён'], sunflower_express: ['подсолнеч'], sunflower_clearfield: ['подсолнеч'],
  rapeseed: ['рапс'], corn: ['кукуруз', 'зернов'], fallow: [],
};

export function isForCrop(item: PriceItem, cropId: string) {
  const terms = CROP_TERMS[cropId] ?? [];
  return terms.length === 0 || item.cultures.some(culture => {
    const normalized = culture.toLowerCase();
    return terms.some(term => normalized.includes(term));
  });
}

export function isAvailableAlternative(item: PriceItem, cropId: string, category: AlternativeCategory) {
  if (item.name.includes('*') || !isForCrop(item, cropId)) return false;
  const group = item.group.toLowerCase();

  if (category === 'seed') return isRegisteredSeedTreatment(item);
  if (category === 'fungicide') return group.includes('фунгицид') && !group.includes('протрав');
  if (category === 'fertilizer') return group.includes('удобрен') || group.includes('биостимулятор');
  if (category === 'herbicide') return group.includes('гербицид');
  return group.includes('инсектицид') && !group.includes('протрав');
}
