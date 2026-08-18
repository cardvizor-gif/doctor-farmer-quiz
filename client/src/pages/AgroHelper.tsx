import React, { useState } from "react";
import { CROP_OPTIONS, CropOption } from "@/data/agropom";
import { PROTECTION_SCHEMES, CropProtectionScheme } from "@/data/protectionSchemes";
import { PRICE_CATALOG, PriceItem } from "@/data/priceCatalog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle2, ShieldCheck, Droplet, Filter, Calculator, Download } from "lucide-react";
import { Link } from "wouter";

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
    <div className="min-h-screen bg-[#F7F9F6] text-[#1B2A1E] flex flex-col font-sans">
      {/* Шапка */}
      <header className="border-b border-[#DDE6DD] bg-[#FFFDF8] sticky top-0 z-20 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:h-16 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center" aria-label="Doctor Farmer">
              <img src="/manus-storage/doctor-farmer-mark_1fd4bf89.png" alt="Doctor Farmer" className="w-10 h-10 object-contain" />
            </div>
            <div className="leading-none">
              <div className="font-mono text-[10px] font-bold tracking-[0.18em] text-[#194F38]">DOCTOR FARMER</div>
              <h1 className="mt-1 font-bold text-base sm:text-lg tracking-tight text-[#194F38]">АгроПомощник ДФ</h1>
              <p className="mt-1 font-mono text-[9px] tracking-wide text-gray-500">FIELD NOTE / РАСЧЁТ СХЕМЫ ЗАЩИТЫ</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <Link href="/" className="w-full sm:w-auto">
              <Button variant="outline" size="sm" className="w-full sm:w-auto border-[#1B4D3E] text-[#1B4D3E] hover:bg-[#1B4D3E]/10">
                <ArrowLeft className="w-4 h-4 mr-1.5" /> К тесту
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <main className="max-w-6xl mx-auto px-4 py-3 sm:py-5 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-5">
        
        {/* Левая колонка */}
        <div className="lg:col-span-4 space-y-3">
          <Card className="border-[#DDE6DD] shadow-xs bg-[#FFFDF8]">
            <CardHeader className="p-3 sm:p-4 pb-2">
              <CardTitle className="text-sm font-semibold text-[#194F38] flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-[0.08em]">Культура / поле</span>
                {selectedCrop && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0 space-y-3">
              <select
                value={selectedCrop?.id ?? ""}
                onChange={(e) => {
                  const crop = CROP_OPTIONS.find((item) => item.id === e.target.value);
                  if (crop) {
                    setSelectedCrop(crop);
                    setSelectedTech(crop.technologies[0]);
                    setCustomReplacements({});
                  }
                }}
                className="sm:hidden w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#1B4D3E]"
                aria-label="Выберите культуру"
              >
                {CROP_OPTIONS.map((crop) => <option key={crop.id} value={crop.id}>{crop.name}</option>)}
              </select>
              <div className="hidden sm:grid grid-cols-1 gap-1 max-h-48 overflow-y-auto pr-1">
                {CROP_OPTIONS.map((crop) => (
                  <button
                    key={crop.id}
                    onClick={() => {
                      setSelectedCrop(crop);
                      setSelectedTech(crop.technologies[0]);
                      setCustomReplacements({});
                    }}
                    className={`text-left text-xs p-2 rounded-lg border transition-all ${
                      selectedCrop?.id === crop.id
                        ? "bg-[#1B4D3E] text-white border-[#1B4D3E] shadow-xs font-medium"
                        : "bg-white text-gray-700 border-gray-200 hover:border-[#1B4D3E]/40"
                    }`}
                  >
                    {crop.name}
                  </button>
                ))}
              </div>

              {selectedCrop && selectedCrop.technologies.length > 1 && (
                <div className="pt-2 border-t border-gray-100">
                  <label className="text-[11px] font-medium text-gray-600 block mb-1">Технология возделывания:</label>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCrop.technologies.map(tech => (
                      <button
                        key={tech}
                        onClick={() => setSelectedTech(tech)}
                        className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                          selectedTech === tech
                            ? "bg-emerald-700 text-white border-emerald-700 font-medium"
                            : "bg-gray-50 text-gray-600 border-gray-200"
                        }`}
                      >
                        {tech}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Фильтрация по задачам */}
          <Card className="border-[#DDE6DD] shadow-xs bg-[#FFFDF8]">
            <CardHeader className="p-3 sm:p-4 pb-2">
              <CardTitle className="text-sm font-semibold text-[#194F38] flex items-center gap-2">
                <Filter className="w-4 h-4 text-emerald-600" /> Фильтр по задачам
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0 space-y-1.5">
              <button
                onClick={() => setSelectedProblemCategory("all")}
                className={`w-full text-left text-xs p-2 rounded-lg border transition-all ${
                  selectedProblemCategory === "all" ? "bg-[#1B4D3E] text-white border-[#1B4D3E]" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                }`}
              >
                Все этапы защиты
              </button>
              <button
                onClick={() => setSelectedProblemCategory("weeds")}
                className={`w-full text-left text-xs p-2 rounded-lg border transition-all ${
                  selectedProblemCategory === "weeds" ? "bg-[#1B4D3E] text-white border-[#1B4D3E]" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                }`}
              >
                🌾 Гербицидная защита (сорняки)
              </button>
              <button
                onClick={() => setSelectedProblemCategory("diseases")}
                className={`w-full text-left text-xs p-2 rounded-lg border transition-all ${
                  selectedProblemCategory === "diseases" ? "bg-[#1B4D3E] text-white border-[#1B4D3E]" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                }`}
              >
                🛡️ Фунгициды и протравители
              </button>
              <button
                onClick={() => setSelectedProblemCategory("pests")}
                className={`w-full text-left text-xs p-2 rounded-lg border transition-all ${
                  selectedProblemCategory === "pests" ? "bg-[#1B4D3E] text-white border-[#1B4D3E]" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                }`}
              >
                🐛 Инсектициды (вредители)
              </button>
              <button
                onClick={() => setSelectedProblemCategory("nutrition")}
                className={`w-full text-left text-xs p-2 rounded-lg border transition-all ${
                  selectedProblemCategory === "nutrition" ? "bg-[#1B4D3E] text-white border-[#1B4D3E]" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                }`}
              >
                ⚡ Удобрения и питание
              </button>
            </CardContent>
          </Card>

          {/* Калькулятор площади */}
          <Card className="border-[#DDE6DD] shadow-xs bg-[#FFFDF8]">
            <CardHeader className="p-3 sm:p-4 pb-2">
              <CardTitle className="text-sm font-semibold text-[#194F38] flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-600" /> Калькулятор площади
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0 space-y-2">
              <div>
                <label className="text-[11px] font-medium text-gray-600 block mb-1">Площадь поля (га):</label>
                <input
                  type="number"
                  min="1"
                  max="100000"
                  value={fieldArea}
                  onChange={(e) => setFieldArea(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-[#1B4D3E]"
                />
              </div>
              <p className="text-[10px] text-gray-500">
                Пересчёт литража для жидких препаратов и канистр для упаковок.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Правая колонка: схема защиты */}
        <div className="lg:col-span-8 space-y-3">
          <Card className="border-[#DDE6DD] shadow-xs bg-[#FFFDF8] flex flex-col">
            <CardHeader className="p-4 sm:p-5 border-b border-gray-100 bg-[#FBFDFC]">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8A6A1F] bg-[#F8F0CD] px-2 py-0.5 rounded-md border border-[#E7D68D]">
                    Схема защиты • {selectedTech || 'Классика'}
                  </span>
                  <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight text-[#194F38] mt-1">
                    {currentScheme?.title || selectedCrop?.name}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleExportPDF}
                    size="sm"
                    className="bg-[#1B4D3E] text-white hover:bg-[#153B2F] flex items-center gap-1.5 text-xs"
                  >
                    <Download className="w-4 h-4" /> Экспорт в PDF / Печать
                  </Button>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 mt-2">
                {currentScheme?.description}
              </p>
            </CardHeader>

            <CardContent className="p-4 sm:p-5 flex-1 space-y-3">
              {filteredSteps.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">По выбранному фильтру этапы защиты не найдены.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    {filteredSteps.map((step, sIdx) => {
                      return (
                        <div key={sIdx} className="border border-gray-200/80 rounded-xl p-3 sm:p-4 bg-white shadow-xs hover:border-[#1B4D3E]/30 transition-all">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2 pb-1.5 border-b border-gray-100">
                            <h3 className="font-semibold text-sm sm:text-base text-[#1B4D3E] flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-[#F8F0CD] text-[#8A6A1F] text-xs flex items-center justify-center font-bold border border-[#E7D68D]">
                                {sIdx + 1}
                              </span>
                              {step.stage}
                            </h3>
                            <span className="font-mono text-[10px] uppercase tracking-wide text-gray-500 bg-[#F5F5ED] px-2.5 py-1 rounded-md border border-[#E6E9DF]">
                              {step.task}
                            </span>
                          </div>

                          {/* Препараты в этапе */}
                          <div className="space-y-2 mt-2">
                            {step.products.map((prod, pIdx) => {
                              const replKey = `${selectedCrop?.id}-${sIdx}-${pIdx}`;
                              const activeProd = customReplacements[replKey] || {
                                name: prod.name,
                                dv: prod.dv,
                                rate: prod.rate,
                                group: prod.group as any,
                                category: '',
                                cultures: []
                              };

                              const alternatives = getRegisteredAlternatives(activeProd.group);

                              const isCanister = activeProd.name.includes('КлопЭфир') || activeProd.name.includes('Триатлон') || activeProd.name.includes('Биогем') || activeProd.name.includes('Магнум Твин');
                              
                              let calculatedDisplay = "";
                              if (isCanister) {
                                let canisterCoverage = 12;
                                if (activeProd.name.includes('Интенсив')) canisterCoverage = 14;
                                else if (activeProd.name.includes('Микс') || activeProd.name.includes('Триатлон Плюс') || activeProd.name.includes('Биогем Макс')) canisterCoverage = 11;
                                else if (activeProd.name.includes('Триатлон Экстра') || activeProd.name.includes('Магнум Твин')) canisterCoverage = 12;
                                
                                const totalCanisters = Math.ceil(fieldArea / canisterCoverage);
                                calculatedDisplay = `${totalCanisters} канистр(-ы) (на ${fieldArea} га при норме 1 кан. на ${canisterCoverage} га)`;
                              } else {
                                const rateVal = parseRateValue(activeProd.rate);
                                if (rateVal > 0 && !activeProd.rate.includes('т')) {
                                  const totalVol = (rateVal * fieldArea).toFixed(1);
                                  calculatedDisplay = `${totalVol} л (при норме ${activeProd.rate} л/га)`;
                                } else {
                                  calculatedDisplay = activeProd.rate;
                                }
                              }

                              return (
                                <div key={pIdx} className="bg-[#F9FBF8] border border-gray-200/60 rounded-lg p-3.5 space-y-3">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-sm text-gray-900">{activeProd.name}</span>
                                        <Badge variant="outline" className="font-mono text-[10px] bg-white text-[#194F38] border-[#B9DCC9]">
                                          {activeProd.group}
                                        </Badge>
                                        <span className="font-mono text-[9px] uppercase tracking-wide text-[#194F38] bg-[#EDF7EF] px-2 py-0.5 rounded border border-[#B9DCC9]">
                                          ✓ Зарегистрировано
                                        </span>
                                      </div>
                                      <p className="text-xs text-gray-600">
                                        <b>ДВ:</b> {activeProd.dv}
                                      </p>
                                    </div>

                                    <div className="flex items-sm sm:items-end justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                                      <div className="text-left sm:text-right">
                                        <div className="font-mono text-[10px] uppercase tracking-wide text-gray-500">Норма / фасовка</div>
                                        <div className="font-bold text-sm text-[#1B4D3E]">{activeProd.rate}</div>
                                      </div>
                                      <div className="text-left sm:text-right bg-emerald-50 px-3 py-1.5 rounded-md border border-emerald-100">
                                        <div className="font-mono text-[10px] uppercase tracking-wide text-[#8A6A1F] font-medium">Расход на {fieldArea} га</div>
                                        <div className="font-mono font-bold text-xs sm:text-sm text-[#194F38]">{calculatedDisplay}</div>
                                      </div>
                                    </div>
                                  </div>

                                  {alternatives.length > 1 && (
                                    <div className="pt-2 border-t border-gray-200/60 space-y-1.5">
                                      <span className="font-mono text-[10px] text-gray-500 block italic">
                                        🔄 Замена препарата ({activeProd.group} для {selectedCrop?.name}):
                                      </span>
                                      <div className="flex flex-wrap gap-1.5">
                                        {alternatives.map((alt) => {
                                          const isSelected = activeProd.name === alt.name;
                                          return (
                                            <button
                                              key={alt.name}
                                              onClick={() => handleReplaceProduct(replKey, alt)}
                                              className={`text-[11px] px-2.5 py-1 rounded border transition-all ${
                                                isSelected 
                                                  ? "bg-[#1B4D3E] text-white border-[#1B4D3E] font-medium" 
                                                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                                              }`}
                                            >
                                              {alt.name} ({alt.rate})
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {step.tankMixNote && (
                            <div className="mt-2 text-xs text-[#285A5A] bg-[#EEF7F5] p-2.5 rounded-lg border border-[#CBE4DF] flex items-start sm:items-center gap-2">
                              <Droplet className="w-4 h-4 text-blue-600 shrink-0" />
                              <span>{step.tankMixNote}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mt-3 pt-2 border-t border-[#E6E9DF] text-center font-mono text-[9px] uppercase tracking-wide text-gray-400">
                АгроПомощник ДФ • Проверка официальных регистраций
              </div>
            </CardContent>
          </Card>
        </div>

      </main>
    </div>
  );
}
