import { describe, expect, it } from 'vitest';
import { CROP_OPTIONS } from './agropom';
import { PROTECTION_SCHEMES } from './protectionSchemes';
import { getCropRecommendation } from './cropRecommendations';

describe('схемы защиты ячменя и овса', () => {
  it('показывает обе новые культуры в АгроПомощнике', () => {
    expect(CROP_OPTIONS.map(crop => crop.id)).toEqual(expect.arrayContaining(['barley', 'oats']));
  });

  it('даёт ячменю и овсу схему с этапом протравливания', () => {
    for (const cropId of ['barley', 'oats']) {
      const scheme = PROTECTION_SCHEMES.find(item => item.cropId === cropId);
      expect(scheme?.steps.length).toBeGreaterThanOrEqual(3);
      expect(scheme?.steps[0]?.products.some(product => product.group === 'Протравитель')).toBe(true);
    }
  });

  it('даёт новым культурам специальные рекомендации вместо общего текста', () => {
    expect(getCropRecommendation('barley').growthPhase).toContain('Кущение');
    expect(getCropRecommendation('oats').specialNotes).toContain('овса');
  });
});
