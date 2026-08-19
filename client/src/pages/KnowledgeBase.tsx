import React, { useState } from "react";
import { Link } from "wouter";
import { DoctorFarmerLogo } from "@/components/DoctorFarmerLogo";
import { SupportModal } from "@/components/SupportModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BookOpen, Search, ShieldCheck, HelpCircle, Award, Sparkles, CheckCircle2, FileText, ExternalLink } from "lucide-react";
import { PRICE_CATALOG } from "@/data/priceCatalog";

interface KnowledgeItem {
  id: string;
  title: string;
  category: "препараты" | "действующие вещества" | "регламенты" | "технологии";
  subtitle: string;
  description: string;
  details: string[];
  tags: string[];
}

const KNOWLEDGE_BASE_ITEMS: KnowledgeItem[] = [
  {
    id: "dv-tribenuron",
    title: "Трибенурон-метил (Группа сульфонилмочевин)",
    category: "действующие вещества",
    subtitle: "Системный гербицид против двудольных сорняков в посевах зерновых",
    description: "Ингибирует фермент ацетолактатсинтазу (АЛС), что приводит к остановке деления клеток и гибели сорных растений. Эффективен против широкого спектра двудольных, включая устойчивые к 2,4-Д виды.",
    details: [
      "Применение: Зерновые культуры (пшеница, ячмень) от кущения до выхода в трубку.",
      "Температурный режим: +15...+25 °C (работает от +10 °C, но скорость действия снижается).",
      "Ограничения в севообороте: Отсутствуют при стандартной технологии. При пересеве через 60 дней можно сеять зерновые.",
      "Препараты в прайсе: Магнум, Магнум Твин, Триатлон Плюс, Триатлон Экстра."
    ],
    tags: ["Гербициды", "Двудольные", "Зерновые", "Сульфонилмочевины"]
  },
  {
    id: "dv-glyphosate",
    title: "Глифосат (изотропиламинная соль / калийная соль)",
    category: "действующие вещества",
    subtitle: "Системный гербицид сплошного действия для десикации и паров",
    description: "Проникает через надземные органы растений в корневую систему, блокируя синтез ароматических аминокислот. Уничтожает как однолетние, так и многолетние злаковые и двудольные сорняки.",
    details: [
      "Применение: Обработка полей по паровой технологии, десикация зерновых и масличных культур перед уборкой.",
      "Нормы расхода: Зависят от видового состава сорняков (от 1.5 до 3.0 л/га).",
      "Особенности: Не обладает почвенной активностью, действует только по вегетирующим сорнякам.",
      "Препараты в прайсе: Торнадо 540, Ураган Форте."
    ],
    tags: ["Десикация", "Пары", "Сплошное действие", "Глифосат"]
  },
  {
    id: "prep-klopethir-int",
    title: "КлопЭфир Интенсив (Клопиралид + Флорасулам + 2,4-Д)",
    category: "препараты",
    subtitle: "Высокоэффективный трехкомпонентный гербицид для зерновых",
    description: "Эталонный выбор для борьбы с самыми злостными двудольными сорняками (включая подмаренник цепкий, виды осота, бодяк, ромашку, марь белую) в посевах озимой и яровой пшеницы и ячменя.",
    details: [
      "Норма применения: 1 канистра на 12-16 га (стандартная средняя норма — 1 канистра на 14 га).",
      "Фаза культуры: Кущение зерновых до образования 2-го междоузлия.",
      "Баковые смеси: Отлично совместим с граминицидами и фунгицидами. Первыми в бак добавляются водорастворимые пакеты/порошки, затем суспензии и эмульсии.",
      "Регистрация: Пшеница озимая и яровая, ячмень озимый и яровой."
    ],
    tags: ["Зерновые", "Двудольные", "КлопЭфир", "Трехкомпонентный"]
  },
  {
    id: "reg-cereal-weeds",
    title: "Гербицидная защита зерновых от двудольных",
    category: "регламенты",
    subtitle: "Стратегия применения баковых смесей и двух/трехкомпонентных упаковок",
    description: "В защите зерновых (пшеница, ячмень) против двудольных сорняков ключевую роль играет фаза кущения культуры и фаза розетки у многолетних сорняков.",
    details: [
      "Правило подбора: Монопрепараты (например, Гуарил) не используются как базовые на зерновых; применяются проверенные бинарные и трехкомпонентные упаковки (КлопЭфир Интенсив, КлопЭфир Микс, Триатлон Плюс, Триатлон Экстра).",
      "Температурный оптимум: +12...+22 °C в солнечную безветренную погоду.",
      "Ограничения: Не проводить обработку при угрозе заморозков ночью или при сильной росе."
    ],
    tags: ["Зерновые", "Регламенты", "Гербициды", "Двудольные"]
  },
  {
    id: "tech-clearfield",
    title: "Технология Clearfield (Чистое поле)",
    category: "технологии",
    subtitle: "Возделывание устойчивых гибридов рапса, подсолнечника и льна",
    description: "Технология возделывания устойчивых гибридов с применением имидазолиноновых гербицидов (например, Евро-Лайтинг, Парадокс). Позволяет уничтожить весь спектр сорняков, включая трудноискорежимые (заразиха, амброзия).",
    details: [
      "Культуры: Подсолнечник ( Clearfield), Рапс (Clearfield).",
      "Особенность: Строго контролировать севооборот из-за последействия имидазолинонов на чувствительные культуры (свекла, овощные, злаковые при неблагоприятных условиях).",
      "Фаза внесения: 2-4 настоящих листа культуры."
    ],
    tags: ["Clearfield", "Подсолнечник", "Рапс", "Технологии"]
  },
  {
    id: "prep-verner-timeterr",
    title: "Протравители семян: Тиметерр и Вернер",
    category: "препараты",
    subtitle: "Фунгицидная и инсекто-фунгицидная защита семенного материала",
    description: "Обязательный этап предпосевной подготовки семян зерновых культур. Предотвращают развитие корневых гнилей, головневых болезней и защищают всходы от почвенных и ранних наземных вредителей.",
    details: [
      "Тиметерр: Надежный фунгицидный протравитель для зерновых против комплекса семенной и почвенной инфекции.",
      "Вернер: Комбинированный препарат с фунгицидным действием (содержит тебуконазол и др.), обеспечивающий длительное сохранение энергии прорастания.",
      "Качество обработки: Равномерное покрытие семян с обязательным контролем влажности семенного материала."
    ],
    tags: ["Протравливание", "Семена", "Фунгициды", "Зерновые"]
  }
];

export default function KnowledgeBase() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  const filteredItems = KNOWLEDGE_BASE_ITEMS.filter((item) => {
    const matchesCat = selectedCategory === "all" || item.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesQuery = 
      item.title.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.tags.some(t => t.toLowerCase().includes(q));
    return matchesCat && matchesQuery;
  });

  return (
    <div className="min-h-screen bg-[#f4f7f1] text-[#15211c] font-sans antialiased pb-20 flex flex-col">
      {/* Шапка */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#dde5dc] px-3 py-2.5 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <Link href="/" className="flex items-center cursor-pointer shrink-0">
            <DoctorFarmerLogo className="h-7 sm:h-9 w-auto" />
          </Link>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Link href="/agro-helper">
              <Button variant="outline" size="sm" className="border-[#dde5dc] text-[#15211c] hover:bg-[#f4f7f1] text-[11px] sm:text-xs px-2.5 sm:px-3 h-8">
                АгроПомощник
              </Button>
            </Link>
            <Link href="/quiz">
              <Button variant="outline" size="sm" className="border-[#dde5dc] text-[#15211c] hover:bg-[#f4f7f1] text-[11px] sm:text-xs px-2.5 sm:px-3 h-8">
                Тестирование
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSupportOpen(true)}
              className="border-[#dde5dc] text-[#15211c] hover:bg-[#f4f7f1] text-[11px] sm:text-xs px-2.5 sm:px-3 h-8 gap-1"
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#2e7d52] shrink-0" /> <span className="hidden xs:inline">Поддержка</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero-секция */}
      <section className="bg-white border-b border-[#dde5dc] py-10 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e8efe5] text-[#194f38] text-xs font-bold">
            <BookOpen className="w-4 h-4 text-[#2e7d52]" /> Экспертный справочник
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#12352a]">
            База знаний агронома
          </h1>
          <p className="text-sm sm:text-base text-[#6f7a73] max-w-2xl mx-auto font-medium">
            Официальные регламенты, свойства действующих веществ, особенности препаратов из каталога Doctor Farmer и проверенные агрономические практики.
          </p>

          {/* Поиск */}
          <div className="pt-4 max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6f7a73]" />
            <Input
              placeholder="Поиск по препаратам, действующим веществам, терминам..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 pr-4 py-3 bg-[#f4f7f1] border border-[#dde5dc] rounded-2xl text-sm focus:border-[#2e7d52] focus:ring-[#2e7d52] shadow-xs"
            />
          </div>

          {/* Фильтры категорий */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-3">
            {[
              { id: "all", label: "Все темы" },
              { id: "препараты", label: "Препараты" },
              { id: "действующие вещества", label: "Действующие вещества" },
              { id: "регламенты", label: "Регламенты" },
              { id: "технологии", label: "Технологии" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedCategory === cat.id
                    ? "bg-[#194f38] text-white shadow-xs"
                    : "bg-[#f4f7f1] text-[#6f7a73] border border-[#dde5dc] hover:border-[#66a46c]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Контент */}
      <main className="max-w-5xl mx-auto px-4 sm:px-8 py-8 flex-1 w-full">
        {filteredItems.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-[#dde5dc] p-8">
            <BookOpen className="w-12 h-12 text-[#6f7a73] mx-auto mb-3 opacity-40" />
            <h3 className="text-lg font-bold text-[#12352a]">Ничего не найдено</h3>
            <p className="text-sm text-[#6f7a73] mt-1">Попробуйте изменить поисковый запрос или выбрать другую категорию.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredItems.map((item) => (
              <Card key={item.id} className="bg-white border border-[#dde5dc] shadow-xs rounded-2xl overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                <CardHeader className="pb-3 border-b border-[#dde5dc] bg-[#fbfcf9]">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider text-[#194f38] border-[#2e7d52]/30 bg-[#e8efe5]">
                      {item.category}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg font-bold text-[#12352a] leading-tight">
                    {item.title}
                  </CardTitle>
                  <p className="text-xs font-semibold text-[#2e7d52] mt-1">{item.subtitle}</p>
                </CardHeader>
                <CardContent className="pt-4 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <p className="text-xs text-[#15211c] leading-relaxed">
                      {item.description}
                    </p>

                    <div className="space-y-1.5 pt-2 border-t border-[#dde5dc]">
                      <span className="text-[11px] font-bold text-[#6f7a73] uppercase tracking-wider">Ключевые факты:</span>
                      <ul className="space-y-1 text-xs text-[#15211c]">
                        {item.details.map((d, dIdx) => (
                          <li key={dIdx} className="flex items-start gap-1.5">
                            <span className="text-[#2e7d52] font-bold mt-0.5">•</span>
                            <span>{d}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-4 border-t border-[#dde5dc] mt-4">
                    {item.tags.map((tag, tIdx) => (
                      <span key={tIdx} className="text-[10px] font-mono px-2 py-0.5 bg-[#f4f7f1] text-[#6f7a73] rounded-md border border-[#dde5dc]">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Футер */}
      <footer className="bg-[#fbfcf9] border-t border-[#dde5dc] py-8 px-4 sm:px-6 text-xs text-[#6f7a73] relative z-10 mt-auto">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <DoctorFarmerLogo className="h-6 w-auto" />
            <span className="font-bold text-[#12352a]">DOCTOR FARMER</span>
          </div>
          <p>© 2026 ООО ТД Доктор Фармер. Внутренний корпоративный портал.</p>
          <span 
            onClick={() => setIsSupportOpen(true)}
            className="cursor-pointer text-[#194f38] font-semibold hover:underline inline-flex items-center gap-1 justify-center"
          >
            <HelpCircle className="w-3.5 h-3.5" /> Поддержка
          </span>
        </div>
      </footer>

      {/* Модальное окно поддержки */}
      <SupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />
    </div>
  );
}
