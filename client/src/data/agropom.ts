export interface CropOption {
  id: string;
  name: string;
  category: 'зерновые' | 'масличные' | 'зернобобовые';
  technologies: string[];
}

export const CROP_OPTIONS: CropOption[] = [
  { id: 'wheat_winter', name: 'Озимая пшеница', category: 'зерновые', technologies: ['Классическая'] },
  { id: 'wheat_spring', name: 'Яровая пшеница', category: 'зерновые', technologies: ['Классическая'] },
  { id: 'peas', name: 'Горох', category: 'зернобобовые', technologies: ['Классическая'] },
  { id: 'lentil_green', name: 'Чечевица зелёная', category: 'зернобобовые', technologies: ['Классическая'] },
  { id: 'lentil_red', name: 'Чечевица красная', category: 'зернобобовые', technologies: ['Классическая'] },
  { id: 'flax_classic', name: 'Лён масличный', category: 'масличные', technologies: ['Классическая'] },
  { id: 'sunflower_express', name: 'Подсолнечник — Экспресс', category: 'масличные', technologies: ['Express'] },
  { id: 'sunflower_clearfield', name: 'Подсолнечник — Система Clearfield', category: 'масличные', technologies: ['Clearfield'] },
  { id: 'fallow', name: 'Чистый пар (глифосат)', category: 'зерновые', technologies: ['Глифосат'] },
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
      'Двудольные и злаковые сорняки',
      'Гербицидная защита посевов',
      'Борьба с сорняками по технологии Express / Clearfield',
      'Обработка паровых полей глифосатом',
    ],
  },
  {
    id: 'diseases',
    name: 'Болезни и протравливание',
    icon: 'ShieldAlert',
    issues: [
      'Протравливание семян (фунгициды и инсектициды)',
      'Фунгицидная защита листьев и колоса',
      'Склеротиниоз, фомоз, альтернариоз',
    ],
  },
  {
    id: 'pests',
    name: 'Вредители',
    icon: 'Bug',
    issues: [
      'Инсектицидная защита посевов',
    ],
  },
  {
    id: 'nutrition',
    name: 'Питание и стимуляция',
    icon: 'Zap',
    issues: [
      'Листовые подкормки и антистрессанты',
    ],
  },
];
