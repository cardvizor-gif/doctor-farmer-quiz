import { describe, expect, it } from 'vitest';
import { PRICE_CATALOG } from './priceCatalog';
import { isRegisteredSeedTreatment } from './seedTreatments';

describe('зарегистрированные протравители', () => {
  it('оставляет только подтверждённые позиции из раздела протравителей', () => {
    const names = PRICE_CATALOG.filter(isRegisteredSeedTreatment).map(item => item.name);

    expect(names).toEqual(expect.arrayContaining(['Редут, КС', 'Турион, КЭ', 'Форсер Энто, КС']));
    expect(names).not.toContain('Меклонил, МЭ*');
    expect(names).not.toContain('Битрин, КС* (с краской)');
  });
});
