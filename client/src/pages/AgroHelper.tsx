import { useState } from "react";
import { CROP_OPTIONS, CropOption } from "@/data/agropom";
import { PROTECTION_SCHEMES, CropProtectionScheme } from "@/data/protectionSchemes";
import { PRICE_CATALOG, PriceItem } from "@/data/priceCatalog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ShieldCheck, Droplet, Filter, Download, Award } from "lucide-react";
import { Link } from "wouter";

const LOGO_IMAGE = "/manus-storage/doctor-farmer-mark_1fd4bf89.png";

export default function AgroHelper() {
  const [selectedCrop, setSelectedCrop] = useState<CropOption | null>(CROP_OPTIONS[0]);
  const [selectedTech, setSelectedTech] = useState<string>("Классическая");
  const [selectedProblemCategory, setSelectedProblemCategory] = useState<string>("all");
  const [fieldArea, setFieldArea] = useState<number>(100); // га

  // Заменители препаратов (ключ: cropId-stepIndex-productIndex)
  const [customReplacements, setCustomReplacements] = useState<Record<string, PriceItem>>({});

  // Найти схему защиты
  const currentScheme: CropProtectionScheme | undefined = PROTECTION_SCHEMES.find(
    s => s.cropId === selectedCrop?.id && (s.technology === selectedTech || s.technology === 'Классическая')
  ) ?? PROTECTION_SCHEMES.find(s => s.cropId === selectedCrop?.id);

  // Фильтрация этапов по выбранной категории задачи
  const filteredSteps = currentScheme?.steps.filter(step => {
    if (selectedProblemCategory === "all") return true;
    const taskLower = step.task.toLowerCase();
    const stageLower = step.stage.toLowerCase();
    
    if (selectedProblemCategory === "weeds") {
      return taskLower.includes('гербицид') || taskLower.includes('сорняк') || stageLower.includes('гербицид');
    }
    if (selectedProblemCategory === "diseases") {
      return taskLower.includes('фунгицид') || taskLower.includes('болезн') || taskLower.includes('протравливан') || stageLower.includes('протравливан');
    }
    if (selectedProblemCategory === "pests") {
      return taskLower.includes('инсектицид') || taskLower.includes('вредител') || stageLower.includes('вредител');
    }
    if (selectedProblemCategory === "nutrition") {
      return taskLower.includes('питани') || taskLower.includes('удобрен') || taskLower.includes('антистресс') || taskLower.includes('аминокислот');
    }
    return true;
  }) || [];

  // Строгая фильтрация замен
  const getRegisteredAlternatives = (requiredGroup: string): PriceItem[] => {
    if (!selectedCrop) return [];
    const cropName = selectedCrop.name.toLowerCase();
    const isCereals = cropName.includes('пшениц') || cropName.includes('ячмен') || cropName.includes('овес');

    return PRICE_CATALOG.filter(item => {
      if (item.group !== requiredGroup) {
        return false;
      }
      const isRegistered = item.cultures.some(c => {
        const itemCulture = c.toLowerCase();
        return cropName.includes(itemCulture) || itemCulture.includes(cropName.split(' ')[0]);
      });
      if (!isRegistered) return false;

      if (isCereals && requiredGroup === 'Гербицид (двудольные)') {
        if (item.name === 'Сикурс, ВР') return false;
        if (item.componentsCount && item.componentsCount < 2) return false;
      }

      return true;
    });
  };

  const handleExportPDF = () => {
    window.print();
  };

  const parseRateValue = (rateStr: string): number => {
    const match = rateStr.replace(',', '.').match(/([\d\.]+)/);
    return match ? parseFloat(match[1]) : 0;
  };

  const handleReplaceProduct = (key: string, item: PriceItem) => {
    setCustomReplacements(prev => ({
      ...prev,
      [key]: item
    }));
  };

  return (
    <div className="min-h-screen bg-[#F4F7F1] text-[#15211c] flex flex-col font-sans selection:bg-[#66a46c] selection:text-white">
      {/* Стили для печати: скрываем всё кроме печатаемого блока схемы */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden !important; }
          .printable-scheme-area, .printable-scheme-area * { visibility: visible !important; }
          .printable-scheme-area { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; background: #ffffff !important; padding: 20px !important; margin: 0 !important; }
          .no-print { display: none !important; }
        }
      ` }} />

      {/* Верхняя навигация в стиле теста с идеальной мобильной адаптацией */}
      <header className="w-full bg-[#fbfcf9] border-b border-[#dde5dc] sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-auto sm:h-20 py-3 sm:py-0 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2.5">
              <img src={LOGO_IMAGE} alt="Doctor Farmer" className="w-9 h-9 sm:w-11 sm:h-11 object-contain mix-blend-multiply flex-shrink-0" />
              <div>
                <span className="font-bold tracking-tight text-xs sm:text-base text-[#12352a] block">DOCTOR FARMER</span>
                <span className="block text-[9px] sm:text-[10px] text-[#6f7a73] font-mono tracking-wider">agro helper</span>
              </div>
            </div>
            {/* Кнопки для мобильных прямо в первой строке для удобства */}
            <div className="flex sm:hidden items-center gap-2">
              <Link href="/">
                <Button variant="outline" size="sm" className="border-[#2e7d52] text-[#194f38] hover:bg-[#e8efe5] text-[11px] h-8 px-2.5">
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" /> На главную
                </Button>
              </Link>
              <Link href="/quiz">
                <Button size="sm" className="bg-[#194f38] hover:bg-[#12352a] text-white text-[11px] h-8 px-2.5">
                  Тест
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
                <Award className="w-4 h-4 mr-1.5" /> Тест
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Основной контейнер */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Левая панель: фильтры и параметры (скрывается при печати) */}
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
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min={1}
                      max={100000}
                      value={fieldArea}
                      onChange={(e) => setFieldArea(Math.max(1, Number(e.target.value)))}
                      className="w-full h-11 px-3 border border-[#dde5dc] rounded-xl bg-[#f4f7f1] text-[#15211c] text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#66a46c]"
                    />
                  </div>
                  <span className="text-xs font-bold text-[#6f7a73]">га</span>
                </div>
              </div>

              {/* Фильтр по задаче */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#6f7a73] mb-2">Фильтр по задаче на поле</label>
                <select
                  value={selectedProblemCategory}
                  onChange={(e) => setSelectedProblemCategory(e.target.value)}
                  className="w-full h-11 px-3 border border-[#dde5dc] rounded-xl bg-[#f4f7f1] text-[#15211c] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#66a46c]"
                >
                  <option value="all">Все этапы защиты</option>
                  <option value="weeds">Борьба с сорняками (гербициды)</option>
                  <option value="diseases">Болезни и протравка (фунгициды)</option>
                  <option value="pests">Вредители (инсектициды)</option>
                  <option value="nutrition">Листовое питание и антистресс</option>
                </select>
              </div>

            </CardContent>
          </Card>

        </aside>

        {/* Правая область: схема защиты (печатается только этот блок) */}
        <section className="lg:col-span-8 space-y-6 printable-scheme-area">
          
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

                          const alternatives = getRegisteredAlternatives(activeProduct.group);

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

                              {/* Выбор замены препарата (в поле / без печати) с мобильной адаптацией */}
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

            {/* Подвал схемы */}
            <div className="mt-8 pt-6 border-t border-[#dde5dc] flex flex-col sm:flex-row items-center justify-between text-xs text-[#6f7a73] gap-4">
              <div>Документ сформирован АгроПомощником Doctor Farmer</div>
              <div className="font-mono">Регламенты соответствуют официальной продуктовой линейке</div>
            </div>

          </div>

        </section>

      </main>

      {/* Футер */}
      <footer className="bg-white border-t border-[#dde5dc] py-6 text-xs text-[#6f7a73] no-print">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono">
          <div>© Doctor Farmer. Все права защищены.</div>
          <div>Единая корпоративная база знаний</div>
        </div>
      </footer>

    </div>
  );
}
