export interface CropOption {
  id: string;
  name: string;
  category: 'зерновые' | 'масличные' | 'зернобобовые' | 'крупяные';
  technologies: string[];
}

export const CROP_OPTIONS: CropOption[] = [
  { id: 'wheat_winter', name: 'Пшеница озимая', category: 'зерновые', technologies: ['Классическая', 'Интенсивная'] },
  { id: 'wheat_spring', name: 'Пшеница яровая', category: 'зерновые', technologies: ['Классическая'] },
  { id: 'barley_winter', name: 'Ячмень озимый', category: 'зерновые', technologies: ['Классическая'] },
  { id: 'barley_spring', name: 'Ячмень яровой', category: 'зерновые', technologies: ['Классическая'] },
  { id: 'sunflower_classic', name: 'Подсолнечник (сортовой / классика)', category: 'масличные', technologies: ['Классическая'] },
  { id: 'sunflower_clearfield', name: 'Подсолнечник (Clearfield / Евро-Лайтнинг)', category: 'масличные', technologies: ['Clearfield'] },
  { id: 'sunflower_express', name: 'Подсолнечник (Express / под гранстар)', category: 'масличные', technologies: ['Express (Трио/Экспресс)'] },
  { id: 'rapeseed_classic', name: 'Рапс (классический)', category: 'масличные', technologies: ['Классическая'] },
  { id: 'peas', name: 'Горох', category: 'зернобобовые', technologies: ['Классическая'] },
  { id: 'lentil_green', name: 'Чечевица зелёная', category: 'зернобобовые', technologies: ['Классическая'] },
  { id: 'lentil_red', name: 'Чечевица красная', category: 'зернобобовые', technologies: ['Классическая'] },
  { id: 'flax_classic', name: 'Лён масличный', category: 'масличные', technologies: ['Классическая'] },
  { id: 'fallow', name: 'Чистый пар', category: 'зерновые', technologies: ['Классическая'] },
  { id: 'rapeseed_clearfield', name: 'Рапс (Clearfield)', category: 'масличные', technologies: ['Clearfield'] },
  { id: 'flax_classic', name: 'Лён (классический)', category: 'масличные', technologies: ['Классическая'] },
  { id: 'flax_clearfield', name: 'Лён (Clearfield)', category: 'масличные', technologies: ['Clearfield'] },
  { id: 'soybean', name: 'Соя', category: 'зернобобовые', technologies: ['Классическая'] },
  { id: 'corn', name: 'Кукуруза', category: 'зерновые', technologies: ['Классическая'] },
  { id: 'buckwheat', name: 'Гречиха', category: 'крупяные', technologies: ['Классическая'] },
  { id: 'oats', name: 'Овёс', category: 'зерновые', technologies: ['Классическая'] },
  { id: 'millet', name: 'Просо', category: 'крупяные', technologies: ['Классическая'] },
];

export interface ProblemCategory {
  id: string;
  name: string;
  icon: string;
  issues: string[];
}

export const PROBLEM_CATEGORIES: ProblemCategory[] = [
  {
    id: 'weeds',
    name: 'Сорняки (гербицидная защита)',
    icon: 'Sprout',
    issues: [
      'Двудольные сорняки в посевах',
      'Злаковые сорняки',
      'Падалица подсолнечника (в зерновых)',
      'Сложные многолетние сорняки (осот, вьюнок)',
      'Подмаренник цепкий',
      'Зернобобовые / соя: защита от сорняков',
    ],
  },
  {
    id: 'diseases',
    name: 'Болезни (фунгицидная защита и протравливание)',
    icon: 'ShieldAlert',
    issues: [
      'Корневые гнили и семенная инфекция (протравливание)',
      'Мучнистая роса, септориоз, ржавчина (листовые болезни зерновых)',
      'Альтернариоз, склеротиниоз, фомоз (на масличных)',
      'Фузариоз колоса',
    ],
  },
  {
    id: 'pests',
    name: 'Вредители (инсектицидная защита)',
    icon: 'Bug',
    issues: [
      'Злаковые мухи, пьявица, тли',
      'Клоп вредная черепашка',
      'Рапсовый цветоед, крестоцветные блошки',
      'Совки, луговой мотылек',
    ],
  },
  {
    id: 'desiccation',
    name: 'Десикация и подработка',
    icon: 'Sun',
    issues: [
      'Предуборочная десикация посевов (подсолнечник, рапс, зерновые)',
    ],
  },
  {
    id: 'nutrition',
    name: 'Питание и стимуляция (микроудобрения и регуляторы)',
    icon: 'Zap',
    issues: [
      'Антистрессовая обработка, стимуляция роста',
      'Дефицит микроэлементов (комплексное питание)',
    ],
  },
];
