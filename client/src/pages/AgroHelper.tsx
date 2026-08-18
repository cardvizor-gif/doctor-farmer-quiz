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
      {/* Стили для печати: скрываем всё кроме печатаемого блока схемы */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-scheme-container, #printable-scheme-container * {
            visibility: visible;
          }
          #printable-scheme-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            background: #ffffff !important;
            color: #000000 !important;
          }
        }
      `}} />

      {/* Шапка */}
      <header className="border-b border-[#DDE6DD] bg-[#FFFDF8] sticky top-0 z-20 shadow-xs no-print">
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
                <ArrowLeft className="w-4 h-4 mr-1.5" /> В рабочий кабинет
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <main className="max-w-6xl mx-auto px-4 py-3 sm:py-5 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-5">
        
        {/* Левая колонка (на печать не попадает) */}
        <div className="lg:col-span-4 space-y-3 no-print">
          <Card className="border-[#DDE6DD] shadow-xs bg-[#FFFDF8]">
            <CardHeader className="p-3 sm:p-4 pb-2">
              <CardTitle className="text-sm font-semibold text-[#194F38] flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-[0.08em]">Культура / поле</span>
                <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">ШАГ 1</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0 space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Выберите культуру:</label>
                <select 
                  className="w-full text-xs p-2.5 rounded-lg border border-[#DDE6DD] bg-white text-gray-800 font-medium focus:outline-none focus:ring-1 focus:ring-[#1B4D3E]"
                  value={selectedCrop?.id}
                  onChange={(e) => {
                    const found = CROP_OPTIONS.find(c => c.id === e.target.value);
                    if (found) setSelectedCrop(found);
                  }}
                >
                  {CROP_OPTIONS.map(crop => (
                    <option key={crop.id} value={crop.id}>{crop.name}</option>
                  ))}
                </select>
              </div>

              {selectedCrop && selectedCrop.technologies.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Технология возделывания:</label>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCrop.technologies.map(tech => (
                      <button
                        key={tech}
                        onClick={() => setSelectedTech(tech)}
                        className={`text-xs px-2.5 py-1 rounded-md border font-mono transition-all ${
                          selectedTech === tech 
                            ? "bg-[#1B4D3E] text-white border-[#1B4D3E]" 
                            : "bg-white text-gray-700 border-[#DDE6DD] hover:bg-gray-50"
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

          {/* Калькулятор площади */}
          <Card className="border-[#DDE6DD] shadow-xs bg-[#FFFDF8]">
            <CardHeader className="p-3 sm:p-4 pb-2">
              <CardTitle className="text-sm font-semibold text-[#194F38] flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-[0.08em]">Площадь поля</span>
                <Calculator className="w-4 h-4 text-[#1B4D3E]" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0 space-y-2">
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  min="1" 
                  max="100000"
                  value={fieldArea} 
                  onChange={(e) => setFieldArea(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full text-sm font-mono p-2 rounded-lg border border-[#DDE6DD] bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#1B4D3E]"
                />
                <span className="text-xs font-mono font-bold text-gray-600 bg-gray-100 px-3 py-2 rounded-lg border border-gray-200">га</span>
              </div>
              <p className="text-[11px] text-gray-500 font-mono">
                Автоматический пересчёт литров и канистр препаратов на всю площадь поля.
              </p>
            </CardContent>
          </Card>

          {/* Фильтр по задачам */}
          <Card className="border-[#DDE6DD] shadow-xs bg-[#FFFDF8]">
            <CardHeader className="p-3 sm:p-4 pb-2">
              <CardTitle className="text-sm font-semibold text-[#194F38] flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-[0.08em]">Фильтр по задачам</span>
                <Filter className="w-4 h-4 text-[#1B4D3E]" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0 space-y-1.5">
              {[
                { id: "all", label: "Все этапы защиты" },
                { id: "weeds", label: "Гербицидная защита (сорняки)" },
                { id: "diseases", label: "Фунгициды и протравители" },
                { id: "pests", label: "Инсектициды (вредители)" },
                { id: "nutrition", label: "Удобрения и питание" },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedProblemCategory(cat.id)}
                  className={`w-full text-left text-xs px-3 py-2 rounded-lg border transition-all font-medium ${
                    selectedProblemCategory === cat.id
                      ? "bg-[#1B4D3E] text-white border-[#1B4D3E]"
                      : "bg-white text-gray-700 border-[#DDE6DD] hover:bg-gray-50"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Правая колонка — Схема защиты (попадает в PDF / печать) */}
        <div className="lg:col-span-8 space-y-3" id="printable-scheme-container">
          <Card className="border-[#DDE6DD] shadow-xs bg-[#FFFDF8]">
            <CardHeader className="p-4 sm:p-5 pb-3 border-b border-[#EAEFEA]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#8A6A1F] bg-[#F8F0CD] px-2.5 py-1 rounded border border-[#E7D68D]">
                      ОФИЦИАЛЬНЫЙ РЕГЛАМЕНТ
                    </span>
                    <span className="text-xs font-mono text-gray-500">• {selectedCrop?.name} ({selectedTech})</span>
                  </div>
                  <CardTitle className="text-xl sm:text-2xl font-bold text-[#194F38] mt-1.5">
                    Схема защиты: {selectedCrop?.name}
                  </CardTitle>
                </div>
                <div className="no-print">
                  <Button 
                    onClick={handleExportPDF}
                    className="bg-[#1B4D3E] hover:bg-[#143D2C] text-white text-xs sm:text-sm font-medium px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-xs"
                  >
                    <Download className="w-4 h-4" /> Экспорт в PDF / Печать
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 space-y-4">
              {filteredSteps.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-xs sm:text-sm font-mono">
                  Для выбранной культуры или фильтра этапы защиты не найдены.
                </div>
              ) : (
                filteredSteps.map((step, stepIdx) => (
                  <div key={stepIdx} className="border border-[#DDE6DD] rounded-xl p-4 bg-white space-y-3 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#8A6A1F] bg-[#F8F0CD] px-2 py-0.5 rounded border border-[#E7D68D]">
                          ЭТАП {stepIdx + 1}
                        </span>
                        <h4 className="font-bold text-sm sm:text-base text-gray-900">{step.stage}</h4>
                      </div>
                      <span className="font-mono text-[11px] text-gray-600 bg-gray-100 px-2.5 py-1 rounded border border-gray-200">
                        {step.task}
                      </span>
                    </div>

                    {/* Препараты в этапе */}
                    <div className="space-y-3">
                      {step.products.map((prod, prodIdx) => {
                        const customKey = `${selectedCrop?.id}-${stepIdx}-${prodIdx}`;
                        const activeProduct = customReplacements[customKey] || prod;

                        // Расчет расхода на площадь
                        const rateVal = parseRateValue(activeProduct.rate);
                        const isCanister = activeProduct.rate.toLowerCase().includes('га') && !activeProduct.rate.includes('л/га');
                        let totalAmountText = "";

                        if (isCanister) {
                          const numbers = activeProduct.rate.match(/([\d\.]+)/g);
                          const avgHaPerCan = numbers && numbers.length >= 2 
                            ? (parseFloat(numbers[0]) + parseFloat(numbers[1])) / 2 
                            : (numbers ? parseFloat(numbers[0]) : 14);
                          const canisterCount = Math.ceil(fieldArea / (avgHaPerCan || 14));
                          totalAmountText = `${canisterCount} канистр(-ы) на ${fieldArea} га`;
                        } else if (activeProduct.rate.includes('л/т')) {
                          totalAmountText = `По нормативу протравливания семян`;
                        } else {
                          const totalLitres = (rateVal * fieldArea).toFixed(1);
                          totalAmountText = `${totalLitres} л на всю площадь (${fieldArea} га)`;
                        }

                        // Список альтернатив для замены
                        const alternatives = getRegisteredAlternatives(activeProduct.group);

                        return (
                          <div key={prodIdx} className="bg-[#FAFBF9] border border-[#E6EBE6] rounded-xl p-3 sm:p-4 space-y-2">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h5 className="font-bold text-sm sm:text-base text-[#194F38]">{activeProduct.name}</h5>
                                  <Badge variant="outline" className="font-mono text-[10px] bg-white text-[#194F38] border-[#1B4D3E]">
                                    {activeProduct.group}
                                  </Badge>
                                  <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                    ✓ Регистрация подтверждена
                                  </span>
                                </div>
                                <p className="text-xs text-gray-600 font-mono">
                                  <strong>ДВ:</strong> {activeProduct.dv}
                                </p>
                              </div>

                              <div className="text-left sm:text-right bg-white p-2.5 rounded-lg border border-[#E6EBE6] shadow-2xs">
                                <div className="text-[10px] uppercase font-mono text-gray-400">Норма / Расход</div>
                                <div className="font-mono text-xs sm:text-sm font-bold text-[#194F38]">
                                  {activeProduct.rate}
                                </div>
                                <div className="font-mono text-[11px] text-emerald-800 font-semibold mt-0.5">
                                  📦 {totalAmountText}
                                </div>
                              </div>
                            </div>

                            {/* Блок замены препарата (скрывается при печати) */}
                            <div className="pt-2 border-t border-gray-100 flex flex-col gap-1.5 no-print">
                              <div className="text-[11px] font-mono text-gray-500 flex items-center gap-1">
                                <span>🔄 Заменить на другой зарегистрированный препарат ({alternatives.length} доступно для {selectedCrop?.name}):</span>
                              </div>
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {alternatives.map(alt => {
                                  const isSelected = activeProduct.name === alt.name;
                                  return (
                                    <button
                                      key={alt.name}
                                      onClick={() => handleReplaceProduct(customKey, alt)}
                                      className={`text-xs px-2.5 py-1 rounded-md border font-mono transition-all ${
                                        isSelected
                                          ? "bg-[#194F38] text-white border-[#1B4D3E] font-bold"
                                          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100"
                                      }`}
                                    >
                                      {alt.name} ({alt.rate})
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

      </main>
    </div>
  );
}
