export interface AgronomicRule {
  cropId: string;
  technology?: string;
  category: string; // 'weeds' | 'diseases' | 'pests' | 'desiccation' | 'nutrition'
  allowedGroups: string[];
  requiredKeywords: string[];
  excludedKeywords: string[];
  strictCheck?: (drugName: string, dv: string, cult: string) => boolean;
}

export const AGRONOMIC_RULES: AgronomicRule[] = [
  // Пшеница / Ячмень — гербициды против двудольных и злаковых
  {
    cropId: 'wheat_winter',
    category: 'weeds',
    allowedGroups: ['Гербицид'],
    requiredKeywords: ['трибенурон', 'флорасулам', '2,4-д', 'дикамб', 'сульфонилмочевин', 'клопиралид'],
    excludedKeywords: ['глифосат', 'имазамокс', 'имазапир', 'хизалофоп'],
  },
  {
    cropId: 'wheat_spring',
    category: 'weeds',
    allowedGroups: ['Гербицид'],
    requiredKeywords: ['трибенурон', 'флорасулам', '2,4-д', 'дикамб', 'сульфонилмочевин', 'клопиралид'],
    excludedKeywords: ['глифосат', 'имазамокс', 'имазапир', 'хизалофоп'],
  },
  // Подсолнечник Clearfield — требует имидазолинонов (имазамокс + имазапир, например Евро-Лайтнинг / Скорпион / Р-Прадо)
  {
    cropId: 'sunflower_clearfield',
    category: 'weeds',
    allowedGroups: ['Гербицид'],
    requiredKeywords: ['имазамокс', 'имазапир', 'имазетапир'],
    excludedKeywords: ['трибенурон', '2,4-д', 'флорасулам'],
  },
  // Подсолнечник Express — требует трибенурон-метила
  {
    cropId: 'sunflower_express',
    category: 'weeds',
    allowedGroups: ['Гербицид'],
    requiredKeywords: ['трибенурон'],
    excludedKeywords: ['имазамокс', 'имазапир', '2,4-д'],
  },
  // Рапс Clearfield
  {
    cropId: 'rapeseed_clearfield',
    category: 'weeds',
    allowedGroups: ['Гербицид'],
    requiredKeywords: ['имазамокс', 'имазапир'],
    excludedKeywords: ['трибенурон', '2,4-д'],
  },
  // Протравливание зерновых
  {
    cropId: 'wheat_winter',
    category: 'diseases',
    allowedGroups: ['Протравитель'],
    requiredKeywords: ['тебуконазол', 'тиаметоксам', 'флудиоксонил', 'дифеноконазол', 'прохлораз', 'имазалил', 'тритиконазол'],
    excludedKeywords: [],
  },
  {
    cropId: 'wheat_spring',
    category: 'diseases',
    allowedGroups: ['Протравитель'],
    requiredKeywords: ['тебуконазол', 'тиаметоксам', 'флудиоксонил', 'дифеноконазол', 'прохлораз', 'имазалил', 'тритиконазол'],
    excludedKeywords: [],
  },
  // Фунгициды по листу
  {
    cropId: 'wheat_winter',
    category: 'diseases',
    allowedGroups: ['Фунгицид'],
    requiredKeywords: ['тебуконазол', 'азоксистробин', 'ципроконазол', 'пропиконазол', 'карбендазим'],
    excludedKeywords: [],
  },
  // Десикация
  {
    cropId: 'sunflower_classic',
    category: 'desiccation',
    allowedGroups: ['Десикант'],
    requiredKeywords: ['дикват'],
    excludedKeywords: [],
  },
  {
    cropId: 'sunflower_clearfield',
    category: 'desiccation',
    allowedGroups: ['Десикант'],
    requiredKeywords: ['дикват'],
    excludedKeywords: [],
  },
  {
    cropId: 'sunflower_express',
    category: 'desiccation',
    allowedGroups: ['Десикант'],
    requiredKeywords: ['дикват'],
    excludedKeywords: [],
  },
];
