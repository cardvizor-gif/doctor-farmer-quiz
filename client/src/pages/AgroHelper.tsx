import { useState, useMemo, useEffect } from "react";
import { CROP_OPTIONS, CropOption } from "@/data/agropom";
import { PROTECTION_SCHEMES, CropProtectionScheme } from '../data/protectionSchemes';
import { getCropRecommendation } from '../data/cropRecommendations';
import { PRICE_CATALOG, PriceItem } from "@/data/priceCatalog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ShieldCheck, Droplet, Filter, Download, Award, BookmarkCheck, Thermometer, Clock, Info } from "lucide-react";
import { Link } from "wouter";
import { DoctorFarmerLogo } from "@/components/DoctorFarmerLogo";
import { SupportModal } from "@/components/SupportModal";
import { HelpCircle } from "lucide-react";

export default function AgroHelper() {
  const [selectedCrop, setSelectedCrop] = useState<CropOption | null>(CROP_OPTIONS[0]);
  const [selectedTech, setSelectedTech] = useState<string>("Классическая");
  const [selectedProblemCategory, setSelectedProblemCategory] = useState<string>("all");
  const [fieldArea, setFieldArea] = useState<number>(100); // га

  // Заменители препаратов (ключ: cropId-stepIndex-productIndex)
  const [customReplacements, setCustomReplacements] = useState<Record<string, PriceItem>>({});

  // Сохраненные схемы в localStorage
  const [savedSchemes, setSavedSchemes] = useState<Array<{ id: string; name: string; date: string; crop: string; tech: string; area: number }>>([]);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Модалка Поддержки
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("doctor_farmer_saved_schemes");
      if (stored) {
        setSavedSchemes(JSON.parse(stored));
      }
    } catch (e) {}
  }, []);

  function handleSaveScheme() {
    if (!selectedCrop) return;
    const newScheme = {
      id: `${selectedCrop.id}-${selectedTech}-${Date.now()}`,
      name: `${selectedCrop.name} (${selectedTech}) — ${fieldArea} га`,
      date: new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
      crop: selectedCrop.name,
      tech: selectedTech,
      area: fieldArea,
    };
    const updated = [newScheme, ...savedSchemes.slice(0, 9)];
    setSavedSchemes(updated);
    try {
      localStorage.setItem("doctor_farmer_saved_schemes", JSON.stringify(updated));
      setSaveSuccessMsg("Схема успешно сохранена!");
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (e) {}
  }

  // Найти схему защиты
  const currentScheme: CropProtectionScheme | undefined = PROTECTION_SCHEMES.find(
    s => s.cropId === selectedCrop?.id && (s.technology === selectedTech || s.technology === 'Классическая')
  ) ?? PROTECTION_SCHEMES.find(s => s.cropId === selectedCrop?.id);

  // Фильтрация этапов по категории проблем
  const filteredSteps = useMemo(() => {
    if (!currentScheme) return [];
    if (selectedProblemCategory === "all") return currentScheme.steps;
    return currentScheme.steps.map(step => {
      const filteredProducts = step.products.filter(prod => {
        const groupLower = prod.group.toLowerCase();
        if (selectedProblemCategory === "herbicide") return groupLower.includes('гербицид');
        if (selectedProblemCategory === "fungicide") return groupLower.includes('фунгицид');
        if (selectedProblemCategory === "insecticide") return groupLower.includes('инсектицид');
        if (selectedProblemCategory === "seed") return groupLower.includes('протравитель') || groupLower.includes('протравка');
        if (selectedProblemCategory === "desiccant") return groupLower.includes('десикант') || groupLower.includes('адъювант');
        return true;
      });
      return { ...step, products: filteredProducts };
    }).filter(step => step.products.length > 0);
  }, [currentScheme, selectedProblemCategory]);

  // Список доступных альтернатив из прайса по группе (для зерновых против двудольных — только заводские бинарные упаковки)
  function getRegisteredAlternatives(group: string, currentProductName: string): PriceItem[] {
    const lower = group.toLowerCase();
    const isBinaryBilingualGroup = lower.includes('гербицид') && (currentProductName.includes('КлопЭфир') || currentProductName.includes('Триатлон') || currentProductName.includes('Биогем') || currentProductName.includes('Магнум') || currentProductName.includes('Интенсив'));

    return PRICE_CATALOG.filter(item => {
      const itemGroup = item.group.toLowerCase();
      const itemName = item.name.toLowerCase();

      if (isBinaryBilingualGroup) {
        // Оставляем только заводские бинарные упаковки для зерновых из прайса
        const isBinary = itemName.includes('клопэфир') || itemName.includes('триатлон') || itemName.includes('биогем') || itemName.includes('магнум твин');
        return isBinary && item.cultures.some(c => c.toLowerCase().includes('пшениц') || c.toLowerCase().includes('ячмен') || c.toLowerCase().includes('зернов'));
      }

      if (lower.includes('гербицид') && itemGroup.includes('гербицид')) return true;
      if (lower.includes('фунгицид') && itemGroup.includes('фунгицид')) return true;
      if (lower.includes('инсектицид') && itemGroup.includes('инсектицид')) return true;
      if ((lower.includes('протравитель') || lower.includes('протравка')) && (itemGroup.includes('протравитель') || itemGroup.includes('протравка'))) return true;
      return itemGroup === lower;
    });
  }

  function handleReplaceProduct(key: string, newProduct: PriceItem) {
    setCustomReplacements(prev => ({
      ...prev,
      [key]: newProduct
    }));
  }

  function parseRateValue(rateStr: string): number {
    const match = rateStr.match(/[\d,.]+/);
    if (!match) return 0;
    return parseFloat(match[0].replace(',', '.'));
  }

  function handleExportPDF() {
    window.print();
  }

  return (
    <div className="min-h-screen bg-[#f4f7f1] text-[#15211c] flex flex-col font-sans selection:bg-[#66a46c] selection:text-white">
      
      {/* Стили для печати (экспорта в PDF) */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { background: white !important; color: black !important; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          header { display: none !important; }
          aside { display: none !important; }
          main { display: block !important; padding: 0 !important; max-width: 100% !important; }
          .shadow-sm, .shadow-xl, .shadow-2xs { box-shadow: none !important; }
          border { border-color: #ccc !important; }
        }
      ` }} />

      {/* Верхняя навигация */}
      <header className="w-full bg-[#fbfcf9] border-b border-[#dde5dc] sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-auto sm:h-20 py-3 sm:py-0 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2.5">
              <DoctorFarmerLogo className="h-10 w-auto" />
            </div>
            {/* Кнопки для мобильных */}
            <div className="flex sm:hidden items-center gap-2">
              <Link href="/">
                <Button variant="outline" size="sm" className="border-[#2e7d52] text-[#194f38] hover:bg-[#e8efe5] text-[11px] h-8 px-2.5">
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" /> На главную
                </Button>
              </Link>
              <Link href="/quiz">
                <Button size="sm" className="bg-[#194f38] hover:bg-[#12352a] text-white text-[11px] h-8 px-2.5">
                  Тестирование
                </Button>
              </Link>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-3">
            <Link href="/">
              <Button variant="outline" size="sm" className="border-[#2e7d52] text-[#194f38] hover:bg-[#e8efe5] text-xs h-9">
                <ArrowLeft className="w-4 h-4 mr-1.5" /> На главную
              </Button>
            </Link>
            <Link href="/quiz">
              <Button size="sm" className="bg-[#194f38] hover:bg-[#12352a] text-white text-xs h-9">
                <Award className="w-4 h-4 mr-1.5" /> Тестирование
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSupportOpen(true)}
              className="border-[#2e7d52] text-[#194f38] hover:bg-[#e8efe5] text-xs h-9 gap-1.5"
            >
              <HelpCircle className="w-4 h-4 text-[#2e7d52]" /> Поддержка
            </Button>
          </div>
        </div>
      </header>

      {/* Основной контейнер */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Левая панель: фильтры и параметры */}
        <aside className="lg:col-span-4 space-y-6 no-print">
          
          <Card className="bg-[#ffffff] border border-[#dde5dc] shadow-sm rounded-2xl">
            <CardHeader className="pb-4 border-b border-[#dde5dc]">
              <CardTitle className="text-base font-bold text-[#12352a] flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#2e7d52]" /> Выбор культуры и технологии
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
              
              {/* Выбор культуры */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#6f7a73] mb-2">Сельхозкультура</label>
                <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {CROP_OPTIONS.map((crop) => {
                    const active = selectedCrop?.id === crop.id;
                    return (
                      <button
                        key={crop.id}
                        type="button"
                        onClick={() => {
                          setSelectedCrop(crop);
                          if (!crop.technologies.includes(selectedTech)) {
                            setSelectedTech(crop.technologies[0] || 'Классическая');
                          }
                        }}
                        className={`text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-all border ${
                          active 
                            ? 'bg-[#194f38] text-white border-[#194f38] shadow-xs' 
                            : 'bg-[#f4f7f1] text-[#15211c] border-[#dde5dc] hover:border-[#66a46c]'
                        }`}
                      >
                        {crop.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Выбор технологии */}
              {selectedCrop && selectedCrop.technologies.length > 1 && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#6f7a73] mb-2">Технология возделывания</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedCrop.technologies.map((tech) => {
                      const active = selectedTech === tech;
                      return (
                        <button
                          key={tech}
                          type="button"
                          onClick={() => setSelectedTech(tech)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                            active 
                              ? 'bg-[#d5a642] text-[#15211c] border-[#d5a642] font-bold shadow-xs' 
                              : 'bg-[#f4f7f1] text-[#15211c] border-[#dde5dc] hover:border-[#66a46c]'
                          }`}
                        >
                          {tech}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Площадь поля */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#6f7a73] mb-2">Площадь обработки (га)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max="100000"
                    value={fieldArea}
                    onChange={(e) => setFieldArea(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-full px-3.5 py-2.5 text-sm font-bold border border-[#dde5dc] rounded-xl bg-[#f4f7f1] text-[#12352a] focus:outline-none focus:ring-2 focus:ring-[#2e7d52]"
                  />
                  <span className="text-xs font-mono font-semibold text-[#6f7a73]">га</span>
                </div>
              </div>

              {/* Фильтр по типу задач */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#6f7a73] mb-2">Фильтр по задаче / препарату</label>
                <select
                  value={selectedProblemCategory}
                  onChange={(e) => setSelectedProblemCategory(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 border border-[#dde5dc] rounded-xl bg-[#f4f7f1] text-[#15211c] font-medium focus:outline-none focus:ring-2 focus:ring-[#2e7d52]"
                >
                  <option value="all">Все этапы защиты</option>
                  <option value="seed">Протравливание семян</option>
                  <option value="herbicide">Гербицидная защита</option>
                  <option value="fungicide">Фунгицидная защита</option>
                  <option value="insecticide">Инсектицидная защита</option>
                  <option value="desiccant">Десикация / Адъюванты</option>
                </select>
              </div>

              {/* Кнопка сохранения схемы */}
              <div className="pt-2 border-t border-[#dde5dc]">
                <Button
                  onClick={handleSaveScheme}
                  className="w-full bg-[#d5a642] hover:bg-[#c2953a] text-[#12352a] font-bold text-xs py-2.5 rounded-xl gap-2 shadow-xs"
                >
                  <BookmarkCheck className="w-4 h-4" /> Сохранить текущую схему
                </Button>
                {saveSuccessMsg && (
                  <p className="text-[11px] text-[#2e7d52] font-semibold text-center mt-2 animate-pulse">{saveSuccessMsg}</p>
                )}
              </div>

            </CardContent>
          </Card>

          {/* Сохраненные схемы в браузере */}
          {savedSchemes.length > 0 && (
            <Card className="bg-[#ffffff] border border-[#dde5dc] shadow-sm rounded-2xl">
              <CardHeader className="pb-3 border-b border-[#dde5dc]">
                <CardTitle className="text-sm font-bold text-[#12352a] flex items-center gap-2">
                  <BookmarkCheck className="w-4 h-4 text-[#d5a642]" /> Сохранённые схемы ({savedSchemes.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-3 max-h-48 overflow-y-auto">
                {savedSchemes.map((item) => (
                  <div key={item.id} className="p-2.5 rounded-xl bg-[#f4f7f1] border border-[#dde5dc] flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-[#12352a]">{item.crop} <span className="text-[#6f7a73] font-normal">({item.tech})</span></div>
                      <div className="text-[10px] text-[#6f7a73] font-mono">{item.area} га · {item.date}</div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const cropObj = CROP_OPTIONS.find(c => c.name === item.crop);
                        if (cropObj) {
                          setSelectedCrop(cropObj);
                          setSelectedTech(item.tech);
                          setFieldArea(item.area);
                        }
                      }}
                      className="text-[10px] h-7 px-2 border-[#2e7d52] text-[#194f38] hover:bg-[#e8efe5]"
                    >
                      Открыть
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

        </aside>

        {/* Правая панель: детализированная схема защиты с подсказками и калькулятором */}
        <section className="lg:col-span-8 space-y-6">
          
          <div className="bg-white border border-[#dde5dc] rounded-2xl p-6 sm:p-8 shadow-sm">
            
            {/* Шапка схемы */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#dde5dc]">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e8efe5] text-[#194f38] text-xs font-bold mb-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#2e7d52]" /> Регламент защиты растений
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#12352a]">
                  {selectedCrop?.name ?? 'Культура'}
                  {selectedTech && <span className="text-[#6f7a73] font-normal text-lg ml-2">({selectedTech})</span>}
                </h1>
                <p className="text-xs text-[#6f7a73] mt-1 font-mono">
                  Расчёт на площадь: <strong className="text-[#15211c]">{fieldArea.toLocaleString()} га</strong> | Этапов в схеме: {filteredSteps.length}
                </p>
              </div>

              <div className="no-print">
                <Button 
                  onClick={handleExportPDF}
                  className="bg-[#194f38] hover:bg-[#12352a] text-white text-xs font-bold gap-2 shadow-xs"
                >
                  <Download className="w-4 h-4" /> Экспорт в PDF / Печать
                </Button>
              </div>
            </div>

            {/* Агрономические подсказки по баковым смесям и температурным режимам (динамические по культуре) */}
            {selectedCrop && (() => {
              const rec = getCropRecommendation(selectedCrop.id);
              return (
                <div className="mt-6 p-4 rounded-xl bg-[#f4f7f1] border border-[#dde5dc] space-y-2 text-xs text-[#15211c]">
                  <div className="font-bold text-[#12352a] flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-[#2e7d52]" />
                    <span>Рекомендации агронома по применению баковых смесей ({selectedCrop.name}):</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-1 text-[#6f7a73]">
                    <li><strong className="text-[#15211c]">Оптимальная температура:</strong> {rec.optimalTemp}</li>
                    <li><strong className="text-[#15211c]">Фазы развития:</strong> {rec.growthPhase}</li>
                    <li><strong className="text-[#15211c]">Порядок смешивания в баке:</strong> {rec.mixingOrder}</li>
                    {rec.specialNotes && (
                      <li><strong className="text-[#15211c]">Особенности технологии:</strong> {rec.specialNotes}</li>
                    )}
                  </ul>
                </div>
              );
            })()}

            {/* Список этапов схемы */}
            <div className="space-y-6 pt-6">
              {filteredSteps.length === 0 ? (
                <div className="text-center py-12 text-[#6f7a73] bg-[#f4f7f1] rounded-xl border border-[#dde5dc]">
                  <p className="text-sm font-medium">По выбранному фильтру задач этапы не найдены.</p>
                </div>
              ) : (
                filteredSteps.map((step, stepIndex) => {
                  return (
                    <div key={stepIndex} className="border border-[#dde5dc] rounded-xl p-5 bg-[#fbfcf9] shadow-2xs space-y-4">
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#dde5dc]">
                        <div>
                          <span className="text-[10px] font-mono tracking-wider uppercase text-[#2e7d52] bg-[#e8efe5] px-2.5 py-1 rounded-md font-bold">
                            Этап {stepIndex + 1}: {step.stage}
                          </span>
                          <h3 className="text-base font-bold text-[#12352a] mt-1.5">{step.task}</h3>
                        </div>
                      </div>

                      {/* Список препаратов в этапе */}
                      <div className="space-y-3">
                        {step.products.map((prod, prodIndex) => {
                          const replacementKey = `${selectedCrop?.id}-${stepIndex}-${prodIndex}`;
                          const activeProduct = customReplacements[replacementKey] || {
                            name: prod.name,
                            dv: prod.dv,
                            group: prod.group,
                            rate: prod.rate
                          };

                          const rateVal = parseRateValue(activeProduct.rate);
                          const totalNeeded = rateVal * fieldArea;

                          const alternatives = getRegisteredAlternatives(activeProduct.group, activeProduct.name);

                          return (
                            <div key={prodIndex} className="bg-white border border-[#dde5dc] rounded-xl p-4 space-y-3">
                              
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-bold text-[#12352a]">{activeProduct.name}</span>
                                    <Badge variant="secondary" className="bg-[#e8efe5] text-[#194f38] text-[10px] font-mono border-0">
                                      {activeProduct.group}
                                    </Badge>
                                  </div>
                                  <div className="text-xs text-[#6f7a73]">
                                    Действующее вещество: <span className="font-semibold text-[#15211c]">{activeProduct.dv}</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-4 bg-[#f4f7f1] px-3.5 py-2 rounded-lg border border-[#dde5dc]">
                                  <div>
                                    <div className="text-[10px] font-mono text-[#6f7a73] uppercase">Норма расхода</div>
                                    <div className="text-xs font-bold text-[#12352a]">{activeProduct.rate}</div>
                                  </div>
                                  <div className="w-px h-8 bg-[#dde5dc]" />
                                  <div>
                                    <div className="text-[10px] font-mono text-[#6f7a73] uppercase">Общий объём ({fieldArea} га)</div>
                                    <div className="text-xs font-bold text-[#2e7d52]">
                                      {totalNeeded > 0 ? `${totalNeeded.toLocaleString()} л / кг` : 'По регламенту'}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Выбор замены препарата (в поле / без печати) */}
                              <div className="pt-3 border-t border-[#dde5dc] flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
                                <div className="text-xs text-[#6f7a73] flex items-center gap-1.5">
                                  <Droplet className="w-3.5 h-3.5 text-[#66a46c] flex-shrink-0" />
                                  <span>Заменить препарат:</span>
                                </div>
                                <select
                                  value={activeProduct.name}
                                  onChange={(e) => {
                                    const found = alternatives.find(a => a.name === e.target.value);
                                    if (found) handleReplaceProduct(replacementKey, found);
                                  }}
                                  className="text-xs px-3 py-2 border border-[#dde5dc] rounded-lg bg-white text-[#15211c] font-medium w-full sm:max-w-xs focus:outline-none focus:ring-1 focus:ring-[#66a46c]"
                                >
                                  <option value={activeProduct.name}>{activeProduct.name} (текущий)</option>
                                  {alternatives.filter(a => a.name !== activeProduct.name).map((alt, altIdx) => (
                                    <option key={altIdx} value={alt.name}>
                                      {alt.name} ({alt.rate})
                                    </option>
                                  ))}
                                </select>
                              </div>

                            </div>
                          );
                        })}
                      </div>

                    </div>
                  );
                })
              )}
            </div>

          </div>

        </section>

      </main>

      {/* Футер */}
      <footer className="bg-[#fbfcf9] border-t border-[#dde5dc] py-6 sm:py-8 text-[#6f7a73] no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-center sm:text-left">
          <div>© Doctor Farmer. Все права защищены.</div>
          <div className="flex items-center space-x-6">
            <span className="cursor-pointer hover:text-[#15211c]">Политика конфиденциальности</span>
            <span 
              onClick={() => setIsSupportOpen(true)}
              className="cursor-pointer text-[#194f38] font-semibold hover:underline flex items-center gap-1"
            >
              <HelpCircle className="w-3.5 h-3.5" /> Поддержка
            </span>
          </div>
        </div>
      </footer>

      {/* Модальное окно поддержки */}
      <SupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />

    </div>
  );
}
