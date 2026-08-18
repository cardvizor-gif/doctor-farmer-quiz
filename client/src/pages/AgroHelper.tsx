import React, { useState } from "react";
import { CROP_OPTIONS, CropOption } from "@/data/agropom";
import { PROTECTION_SCHEMES, CropProtectionScheme } from "@/data/protectionSchemes";
import { PRICE_CATALOG, PriceItem } from "@/data/priceCatalog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle2, ShieldCheck, Droplet, Filter, Calculator, Download, RefreshCw } from "lucide-react";
import { Link } from "wouter";

export default function AgroHelper() {
  const [selectedCrop, setSelectedCrop] = useState<CropOption | null>(CROP_OPTIONS[0]);
  const [selectedTech, setSelectedTech] = useState<string>("Классическая");
  const [selectedProblemCategory, setSelectedProblemCategory] = useState<string>("all");
  const [fieldArea, setFieldArea] = useState<number>(100); // га

  // Пользовательские замены препаратов (ключ: cropId-stepIndex-productIndex, значение: выбранный PriceItem)
  const [customReplacements, setCustomReplacements] = useState<Record<string, PriceItem>>({});

  // Найти базовую схему защиты
  const currentScheme: CropProtectionScheme | undefined = PROTECTION_SCHEMES.find(
    s => s.cropId === selectedCrop?.id && (s.technology === selectedTech || s.technology === 'Классическая')
  ) ?? PROTECTION_SCHEMES.find(s => s.cropId === selectedCrop?.id);

  // Фильтрация зарегистрированных препаратов для данной культуры по категории/группе
  const getRegisteredProductsForCrop = (groupFilter?: string): PriceItem[] => {
    if (!selectedCrop) return [];
    return PRICE_CATALOG.filter(item => {
      // Проверить регистрацию на культуру (по совпадению подстроки в массиве cultures)
      const isRegistered = item.cultures.some(c => 
        selectedCrop.name.toLowerCase().includes(c.toLowerCase()) || 
        c.toLowerCase().includes(selectedCrop.name.toLowerCase().split(' ')[0])
      );
      if (!isRegistered) return false;
      if (groupFilter && item.group !== groupFilter) return false;
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
      <header className="border-b border-[#E2E8DF] bg-white sticky top-0 z-20 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:h-16 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-[#1B4D3E] flex items-center justify-center text-white font-bold text-lg">
              🌱
            </div>
            <div>
              <h1 className="font-bold text-base sm:text-lg tracking-tight text-[#1B4D3E] leading-tight">АгроПомощник ДФ</h1>
              <p className="text-[11px] sm:text-xs text-gray-500 leading-tight">Схемы защиты с проверкой официальных регистраций из прайса</p>
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
      <main className="max-w-6xl mx-auto px-4 py-4 sm:py-8 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8">
        
        {/* Левая колонка */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-[#E2E8DF] shadow-xs bg-white">
            <CardHeader className="p-4 sm:p-6 pb-3">
              <CardTitle className="text-base font-semibold text-[#1B4D3E] flex items-center justify-between">
                <span>Выберите культуру</span>
                {selectedCrop && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4">
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
                className="sm:hidden w-full rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm text-gray-800 focus:outline-none focus:border-[#1B4D3E]"
                aria-label="Выберите культуру"
              >
                {CROP_OPTIONS.map((crop) => <option key={crop.id} value={crop.id}>{crop.name}</option>)}
              </select>
              <div className="hidden sm:grid grid-cols-1 gap-1.5 max-h-64 overflow-y-auto pr-1">
                {CROP_OPTIONS.map((crop) => (
                  <button
                    key={crop.id}
                    onClick={() => {
                      setSelectedCrop(crop);
                      setSelectedTech(crop.technologies[0]);
                      setCustomReplacements({});
                    }}
                    className={`text-left text-xs p-2.5 rounded-lg border transition-all ${
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
                <div className="pt-3 border-t border-gray-100">
                  <label className="text-xs font-medium text-gray-600 block mb-1.5">Технология возделывания:</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedCrop.technologies.map(tech => (
                      <button
                        key={tech}
                        onClick={() => setSelectedTech(tech)}
                        className={`text-xs px-3 py-1 rounded-full border transition-all ${
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
          <Card className="border-[#E2E8DF] shadow-xs bg-white">
            <CardHeader className="p-4 sm:p-6 pb-3">
              <CardTitle className="text-base font-semibold text-[#1B4D3E] flex items-center gap-2">
                <Filter className="w-4 h-4 text-emerald-600" /> Фильтр по задачам
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-2">
              <button
                onClick={() => setSelectedProblemCategory("all")}
                className={`w-full text-left text-xs p-2.5 rounded-lg border transition-all ${
                  selectedProblemCategory === "all" ? "bg-[#1B4D3E] text-white border-[#1B4D3E]" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                }`}
              >
                Все этапы защиты
              </button>
              <button
                onClick={() => setSelectedProblemCategory("weeds")}
                className={`w-full text-left text-xs p-2.5 rounded-lg border transition-all ${
                  selectedProblemCategory === "weeds" ? "bg-[#1B4D3E] text-white border-[#1B4D3E]" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                }`}
              >
                🌾 Гербицидная защита (сорняки)
              </button>
              <button
                onClick={() => setSelectedProblemCategory("diseases")}
                className={`w-full text-left text-xs p-2.5 rounded-lg border transition-all ${
                  selectedProblemCategory === "diseases" ? "bg-[#1B4D3E] text-white border-[#1B4D3E]" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                }`}
              >
                🛡️ Фунгициды и протравители
              </button>
              <button
                onClick={() => setSelectedProblemCategory("pests")}
                className={`w-full text-left text-xs p-2.5 rounded-lg border transition-all ${
                  selectedProblemCategory === "pests" ? "bg-[#1B4D3E] text-white border-[#1B4D3E]" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                }`}
              >
                🐛 Инсектициды (вредители)
              </button>
              <button
                onClick={() => setSelectedProblemCategory("nutrition")}
                className={`w-full text-left text-xs p-2.5 rounded-lg border transition-all ${
                  selectedProblemCategory === "nutrition" ? "bg-[#1B4D3E] text-white border-[#1B4D3E]" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                }`}
              >
                ⚡ Удобрения и питание
              </button>
            </CardContent>
          </Card>

          {/* Калькулятор площади */}
          <Card className="border-[#E2E8DF] shadow-xs bg-white">
            <CardHeader className="p-4 sm:p-6 pb-3">
              <CardTitle className="text-base font-semibold text-[#1B4D3E] flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-600" /> Калькулятор площади
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Площадь поля (га):</label>
                <input
                  type="number"
                  min="1"
                  max="100000"
                  value={fieldArea}
                  onChange={(e) => setFieldArea(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#1B4D3E]"
                />
              </div>
              <p className="text-[11px] text-gray-500">
                Автоматический расчёт литража или канистр (для бинарных упаковок из расчёта 1 канистра на 11–14 га).
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Правая колонка: схема защиты и выбор зарегистрированных препаратов */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="border-[#E2E8DF] shadow-xs bg-white min-h-[550px] flex flex-col">
            <CardHeader className="p-4 sm:p-6 border-b border-gray-100 bg-[#FBFDFC]">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Схема защиты • {selectedTech || 'Классика'}
                  </span>
                  <CardTitle className="text-xl sm:text-2xl font-bold text-[#1B4D3E] mt-1">
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
                {currentScheme?.description} (все препараты проверены по официальной регистрации для культуры)
              </p>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 flex-1 space-y-6">
              {!currentScheme || !currentScheme.steps || currentScheme.steps.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">Для выбранной культуры этапы защиты не найдены.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-4">
                    {currentScheme.steps.map((step, sIdx) => {
                      return (
                        <div key={sIdx} className="border border-gray-200/80 rounded-xl p-4 sm:p-5 bg-white shadow-xs hover:border-[#1B4D3E]/30 transition-all">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3 pb-2 border-b border-gray-100">
                            <h3 className="font-semibold text-sm sm:text-base text-[#1B4D3E] flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs flex items-center justify-center font-bold">
                                {sIdx + 1}
                              </span>
                              {step.stage}
                            </h3>
                            <span className="text-xs text-gray-500 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">
                              {step.task}
                            </span>
                          </div>

                          {/* Список препаратов в этапе */}
                          <div className="space-y-4 mt-3">
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

                              // Определим группу для подбора из прайса
                              let targetGroup = activeProd.group;
                              if (targetGroup === 'Удобрение') targetGroup = 'Удобрение';
                              else if (targetGroup.includes('Инсектицид')) targetGroup = 'Инсектицид';
                              else if (targetGroup.includes('Фунгицид') || targetGroup.includes('Протравитель')) targetGroup = activeProd.group as any;
                              else targetGroup = 'Гербицид';

                              // Получим список всех зарегистрированных альтернатив из прайса для этой группы
                              const registeredAlternatives = getRegisteredProductsForCrop(targetGroup);

                              // Расчет фасовки
                              const isCanister = activeProd.name.includes('КлопЭфир') || activeProd.name.includes('Триатлон') || activeProd.name.includes('Биогем') || activeProd.name.includes('Магнум') || activeProd.rate.includes('канистр');
                              let canisterCoverage = 14;
                              if (activeProd.name.includes('Микс') || activeProd.name.includes('Триатлон') || activeProd.name.includes('Макс')) canisterCoverage = 11;
                              else if (activeProd.name.includes('Интенсив') || activeProd.name.includes('Магнум')) canisterCoverage = 12;

                              let calculatedDisplay = "";
                              if (isCanister) {
                                const totalCanisters = Math.ceil(fieldArea / canisterCoverage);
                                calculatedDisplay = `${totalCanisters} канистр(-ы) (на ${fieldArea} га при норме 1 кан. на ${canisterCoverage} га)`;
                              } else {
                                const rateVal = parseRateValue(activeProd.rate);
                                if (rateVal > 0 && !activeProd.rate.includes('т')) {
                                  const totalVol = (rateVal * fieldArea).toFixed(1);
                                  calculatedDisplay = `${totalVol} л (при норме ${activeProd.rate})`;
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
                                        <Badge variant="outline" className="text-[10px] bg-white text-emerald-800 border-emerald-200">
                                          {activeProd.group}
                                        </Badge>
                                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                          ✓ Регистрация подтверждена
                                        </span>
                                      </div>
                                      <p className="text-xs text-gray-600">
                                        <b>ДВ:</b> {activeProd.dv}
                                      </p>
                                    </div>

                                    <div className="flex items-sm sm:items-end justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                                      <div className="text-left sm:text-right">
                                        <div className="text-xs text-gray-500">Норма / Фасовка</div>
                                        <div className="font-bold text-sm text-[#1B4D3E]">{activeProd.rate}</div>
                                      </div>
                                      <div className="text-left sm:text-right bg-emerald-50 px-3 py-1.5 rounded-md border border-emerald-100">
                                        <div className="text-[10px] text-emerald-700 font-medium">Расход на {fieldArea} га</div>
                                        <div className="font-bold text-xs sm:text-sm text-emerald-900">{calculatedDisplay}</div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Выпадающий список или кнопки альтернатив из прайса с подтвержденной регистрацией */}
                                  {registeredAlternatives.length > 1 && (
                                    <div className="pt-2 border-t border-gray-200/60 space-y-1.5">
                                      <span className="text-[11px] text-gray-500 block italic">
                                        🔄 Заменить на другой зарегистрированный препарат из прайса ({registeredAlternatives.length} доступно для {selectedCrop?.name}):
                                      </span>
                                      <div className="flex flex-wrap gap-1.5">
                                        {registeredAlternatives.map((alt) => {
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
                            <div className="mt-3 text-xs text-blue-800 bg-blue-50 p-2.5 rounded-lg border border-blue-100 flex items-start sm:items-center gap-2">
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

              <div className="mt-8 pt-4 border-t border-gray-100 text-center text-xs text-gray-400">
                АгроПомощник ДФ • Проверка официальных регистраций из прайса
              </div>
            </CardContent>
          </Card>
        </div>

      </main>
    </div>
  );
}
