import { useState } from "react";
import { Link } from "wouter";
import { DoctorFarmerLogo } from "@/components/DoctorFarmerLogo";
import { SupportModal } from "@/components/SupportModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Search, HelpCircle, Calendar, AlertCircle } from "lucide-react";
import { PRICE_CATALOG } from "@/data/priceCatalog";

export default function KnowledgeBase() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [selectedCulture, setSelectedCulture] = useState<string>("all");
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  const allGroups = Array.from(new Set(PRICE_CATALOG.map(item => item.group)));
  const allCulturesSet = new Set<string>();
  PRICE_CATALOG.forEach(item => {
    item.cultures.forEach(c => allCulturesSet.add(c));
  });
  const allCultures = Array.from(allCulturesSet).sort();

  const filteredItems = PRICE_CATALOG.filter((item) => {
    const matchesGroup = selectedGroup === "all" || item.group === selectedGroup;
    const matchesCulture = selectedCulture === "all" || item.cultures.includes(selectedCulture);
    const q = searchQuery.toLowerCase();
    const matchesQuery = 
      item.name.toLowerCase().includes(q) ||
      item.dv.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.cultures.some(c => c.toLowerCase().includes(q)) ||
      item.regulation?.phase || 'Требует уточнения регламента'.toLowerCase().includes(q) ||
      item.regulation?.objects || 'Вредные объекты по регламенту'.toLowerCase().includes(q);
    return matchesGroup && matchesCulture && matchesQuery;
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e8efe5] border border-[#2e7d52]/20 text-[#194f38] text-xs font-bold uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5 text-[#2e7d52]" /> Экспертный справочник регламентов
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#12352a] tracking-tight">
            База знаний агронома
          </h1>
          <p className="text-sm sm:text-base text-[#6f7a73] max-w-2xl mx-auto font-medium">
            Полный каталог препаратов с регламентами применения. Выберите группу или культуру для фильтрации.
          </p>

          {/* Поиск и компактные выпадающие фильтры */}
          <div className="pt-6 max-w-2xl mx-auto space-y-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6f7a73]" />
              <Input
                type="text"
                placeholder="Поиск по названию, действующему веществу..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#f4f7f1] border-[#dde5dc] text-[#15211c] placeholder:text-[#6f7a73] text-sm h-11 rounded-xl focus-visible:ring-[#2e7d52]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              <div>
                <label className="text-xs font-bold text-[#6f7a73] block mb-1">Группа препаратов:</label>
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="w-full bg-[#f4f7f1] border border-[#dde5dc] rounded-xl px-3 py-2 text-xs font-semibold text-[#15211c] focus:outline-none focus:ring-2 focus:ring-[#2e7d52]"
                >
                  <option value="all">Все группы ({PRICE_CATALOG.length} позиций)</option>
                  {allGroups.map((group) => (
                    <option key={group} value={group}>{group}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#6f7a73] block mb-1">Культура:</label>
                <select
                  value={selectedCulture}
                  onChange={(e) => setSelectedCulture(e.target.value)}
                  className="w-full bg-[#f4f7f1] border border-[#dde5dc] rounded-xl px-3 py-2 text-xs font-semibold text-[#15211c] focus:outline-none focus:ring-2 focus:ring-[#2e7d52]"
                >
                  <option value="all">Все культуры</option>
                  {allCultures.map((cult) => (
                    <option key={cult} value={cult}>{cult}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Контент */}
      <main className="max-w-5xl mx-auto px-4 sm:px-8 py-8 flex-1 w-full">
        {filteredItems.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-[#dde5dc] p-8">
            <BookOpen className="w-12 h-12 text-[#6f7a73] mx-auto mb-3 opacity-40" />
            <h3 className="text-lg font-bold text-[#12352a]">Ничего не найдено</h3>
            <p className="text-sm text-[#6f7a73] mt-1">Попробуйте изменить поисковый запрос или сбросить фильтры.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredItems.map((item, idx) => (
              <Card key={idx} className="bg-white border border-[#dde5dc] shadow-xs rounded-2xl overflow-hidden hover:shadow-md transition-shadow flex flex-col justify-between">
                <div>
                  <CardHeader className="pb-3 border-b border-[#dde5dc] bg-[#fbfcf9]">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider text-[#194f38] border-[#2e7d52]/30 bg-[#e8efe5]">
                        {item.group}
                      </Badge>
                      <span className="text-[11px] font-semibold text-[#6f7a73]">{item.category}</span>
                    </div>
                    <CardTitle className="text-lg font-bold text-[#12352a] leading-tight">
                      {item.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3">
                    <div>
                      <span className="text-[11px] font-bold text-[#6f7a73] uppercase tracking-wider block mb-1">Действующее вещество:</span>
                      <p className="text-xs text-[#15211c] font-medium leading-relaxed bg-[#f4f7f1] p-2.5 rounded-xl border border-[#dde5dc]">
                        {item.dv}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div className="bg-[#fbfcf9] p-2 rounded-xl border border-[#dde5dc]">
                        <span className="text-[10px] font-bold text-[#6f7a73] uppercase block">Норма расхода:</span>
                        <span className="font-bold text-[#12352a]">{item.rate}</span>
                      </div>
                      <div className="bg-[#fbfcf9] p-2 rounded-xl border border-[#dde5dc]">
                        <span className="text-[10px] font-bold text-[#6f7a73] uppercase block">Профиль применения:</span>
                        <span className="font-bold text-[#194f38]">{item.regulation ? 'Заполнен' : 'Не указан'}</span>
                      </div>
                    </div>

                    {/* Блок регламента применения */}
                    <div className="space-y-2 pt-2 border-t border-[#dde5dc]">
                      <span className="text-[11px] font-bold text-[#194f38] uppercase tracking-wider flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-[#2e7d52]" /> Регламент применения:
                        </span>
                        {!item.regulation && (
                          <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-0.5 font-medium">
                            <AlertCircle className="w-3 h-3" /> Требует уточнения
                          </span>
                        )}
                      </span>
                      <div className="bg-[#f8faf6] p-3 rounded-xl border border-[#dde5dc] space-y-2 text-xs text-[#15211c]">
                        <div>
                          <span className="font-bold text-[#2e7d52]">Фаза и время внесения:</span>
                          <p className="mt-0.5 text-[#334138]">{item.regulation?.phase || 'Требует уточнения регламента'}</p>
                        </div>
                        <div>
                          <span className="font-bold text-[#2e7d52]">Вредные объекты / назначение:</span>
                          <p className="mt-0.5 text-[#334138]">{item.regulation?.objects || 'Вредные объекты по регламенту'}</p>
                        </div>
                        <div>
                          <span className="font-bold text-[#2e7d52]">Условия и температура:</span>
                          <p className="mt-0.5 text-[#334138]">{item.regulation?.conditions || 'Применять по рекомендациям агрономической службы (+10...+25 °C).'}</p>
                        </div>
                        <div>
                          <span className="font-bold text-[#b91c1c]">Ограничения и требования:</span>
                          <p className="mt-0.5 text-[#7f1d1d]">{item.regulation?.restrictions || 'Соблюдать регламент безопасности и нормы расхода.'}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </div>

                <div className="px-6 pb-5 pt-3 border-t border-[#dde5dc] bg-[#fbfcf9]">
                  <span className="text-[10px] font-bold text-[#6f7a73] uppercase tracking-wider block mb-1.5">Культуры применения:</span>
                  <div className="flex flex-wrap gap-1">
                    {item.cultures.map((cul, cIdx) => (
                      <span key={cIdx} className="px-2 py-0.5 bg-[#e8efe5] text-[#194f38] rounded-md text-[10px] font-semibold border border-[#2e7d52]/20">
                        {cul}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Футер */}
      <footer className="bg-white border-t border-[#dde5dc] py-6 px-4 text-center text-xs text-[#6f7a73]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <DoctorFarmerLogo className="h-6 w-auto" />
            <span className="font-semibold text-[#12352a]">Doctor Farmer • Кабинет команды</span>
          </div>
          <div className="flex items-center gap-4">
            <span onClick={() => window.location.href = "/"} className="cursor-pointer hover:text-[#2e7d52] transition-colors">Главная</span>
            <span onClick={() => window.location.href = "/agro-helper"} className="cursor-pointer hover:text-[#2e7d52] transition-colors">АгроПомощник</span>
            <span onClick={() => window.location.href = "/quiz"} className="cursor-pointer hover:text-[#2e7d52] transition-colors">Тестирование</span>
            <button onClick={() => setIsSupportOpen(true)} className="hover:text-[#2e7d52] transition-colors">Поддержка</button>
          </div>
        </div>
      </footer>

      <SupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />
    </div>
  );
}
