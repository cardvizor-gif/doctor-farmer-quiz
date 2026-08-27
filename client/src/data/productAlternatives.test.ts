import { describe, expect, it } from 'vitest';
import { PRICE_CATALOG } from './priceCatalog';
import { isAvailableAlternative } from './productAlternatives';
import { PROTECTION_SCHEMES } from './protectionSchemes';

const byName = (name: string) => PRICE_CATALOG.find(item => item.name === name)!;

describe('культурно-зависимые альтернативы', () => {
  it('даёт зарегистрированные протравители для культур и не предлагает позиции на регистрации', () => {
    expect(isAvailableAlternative(byName('Турион, КЭ'), 'peas', 'seed')).toBe(true);
    expect(isAvailableAlternative(byName('Редут, КС'), 'oats', 'seed')).toBe(true);
    expect(isAvailableAlternative(byName('Форсер Энто, КС'), 'oats', 'seed')).toBe(false);
    expect(isAvailableAlternative(byName('Меклонил, МЭ*'), 'peas', 'seed')).toBe(false);
  });

  it('отделяет листовые фунгициды от протравителей и фильтрует их по культуре', () => {
    expect(isAvailableAlternative(byName('Р-Ципрос, КЭ'), 'oats', 'fungicide')).toBe(true);
    expect(isAvailableAlternative(byName('Турион, КЭ'), 'oats', 'fungicide')).toBe(false);
    expect(isAvailableAlternative(byName('ПроТэб, КМЭ'), 'sunflower_express', 'fungicide')).toBe(true);
  });

  it('даёт микроудобрения по прямым и укрупнённым культурам прайса', () => {
    expect(isAvailableAlternative(byName('Контур Антистресс, ВР'), 'barley', 'fertilizer')).toBe(true);
    expect(isAvailableAlternative(byName('Контур Профи, ВР'), 'peas', 'fertilizer')).toBe(true);
    expect(isAvailableAlternative(byName('Контур Рост, ВР'), 'sunflower_express', 'fertilizer')).toBe(true);
  });

  it('покрывает все существующие схемы доступным вариантом в категориях протравливания, фунгицидов и микроудобрений', () => {
    const categoryForGroup = (group: string) => {
      const normalized = group.toLowerCase();
      if (normalized.includes('протрав')) return 'seed' as const;
      if (normalized.includes('фунгицид')) return 'fungicide' as const;
      if (normalized.includes('удобрен')) return 'fertilizer' as const;
      return null;
    };

    for (const scheme of PROTECTION_SCHEMES) {
      for (const product of scheme.steps.flatMap(step => step.products)) {
        const category = categoryForGroup(product.group);
        if (!category) continue;
        const alternatives = PRICE_CATALOG.filter(item => isAvailableAlternative(item, scheme.cropId, category));
        expect(alternatives.length, `${scheme.cropId}: ${category}`).toBeGreaterThan(0);
      }
    }
  });
});
