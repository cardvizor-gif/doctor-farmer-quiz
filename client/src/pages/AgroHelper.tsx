import { useState } from "react";
import { CROP_OPTIONS, CropOption } from "@/data/agropom";
import { PROTECTION_SCHEMES, CropProtectionScheme } from "@/data/protectionSchemes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, ArrowLeft, CheckCircle2, ShieldCheck, Layers, Droplet } from "lucide-react";
import { Link } from "wouter";

export default function AgroHelper() {
  const [selectedCrop, setSelectedCrop] = useState<CropOption | null>(CROP_OPTIONS[0]);
  const [selectedTech, setSelectedTech] = useState<string>("Классическая");

  // Найти подходящую схему защиты
  const currentScheme: CropProtectionScheme | undefined = PROTECTION_SCHEMES.find(
    s => s.cropId === selectedCrop?.id && (s.technology === selectedTech || s.technology === 'Классическая')
  ) ?? PROTECTION_SCHEMES.find(s => s.cropId === selectedCrop?.id);

  return (
    <div className="min-h-screen bg-[#F7F9F6] text-[#1B2A1E] flex flex-col font-sans">
      {/* Шапка */}
      <header className="border-b border-[#E2E8DF] bg-white sticky top-0 z-20 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-[#1B4D3E] flex items-center justify-center text-white font-bold text-lg">
              🌱
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight text-[#1B4D3E]">АгроПомощник ДФ</h1>
              <p className="text-xs text-gray-500">Готовые схемы защиты и точные нормы из прайса</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Link href="/">
              <Button variant="outline" size="sm" className="border-[#1B4D3E] text-[#1B4D3E] hover:bg-[#1B4D3E]/10">
                <ArrowLeft className="w-4 h-4 mr-1.5" /> К тесту прайса
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Левая колонка: выбор культуры и технологии */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-[#E2E8DF] shadow-xs bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-[#1B4D3E] flex items-center justify-between">
                <span>Выберите культуру</span>
                {selectedCrop && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-1.5 max-h-96 overflow-y-auto pr-1">
                {CROP_OPTIONS.map((crop) => (
                  <button
                    key={crop.id}
                    onClick={() => {
                      setSelectedCrop(crop);
                      setSelectedTech(crop.technologies[0]);
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
        </div>

        {/* Правая колонка: готовая схема защиты */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="border-[#E2E8DF] shadow-xs bg-white min-h-[550px] flex flex-col">
            <CardHeader className="border-b border-gray-100 bg-[#FBFDFC]">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Готовая схема защиты • {selectedTech || 'Классика'}
                  </span>
                  <CardTitle className="text-xl font-bold text-[#1B4D3E] mt-1">
                    {selectedCrop?.name}
                  </CardTitle>
                </div>
                {currentScheme && (
                  <Badge variant="secondary" className="bg-[#1B4D3E]/10 text-[#1B4D3E] font-medium">
                    {currentScheme.steps.length} этапа обработки
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6 flex-1 flex flex-col justify-between">
              
              {!currentScheme ? (
                <div className="text-center py-24 my-auto text-gray-500 space-y-2">
                  <Search className="w-12 h-12 mx-auto text-gray-300 stroke-1" />
                  <p className="font-medium text-sm">Для выбранной культуры схема формируется в базовом каталоге прайса.</p>
                  <p className="text-xs text-gray-400">Выберите озимую пшеницу, подсолнечник Clearfield/Express или рапс для просмотра детальной схемы.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-emerald-50/70 border border-emerald-200/60 p-4 rounded-xl flex items-start space-x-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-700 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="font-semibold text-sm text-[#1B4D3E]">{currentScheme.title}</h4>
                      <p className="text-xs text-gray-600 mt-0.5">{currentScheme.description}</p>
                    </div>
                  </div>

                  {/* Шаги схемы */}
                  <div className="space-y-4">
                    {currentScheme.steps.map((step, idx) => (
                      <div key={step.stage} className="border border-gray-200 rounded-xl p-5 bg-white shadow-xs relative overflow-hidden">
                        <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-[#1B4D3E]" />
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-md">
                            Этап {idx + 1}: {step.stage}
                          </span>
                          <span className="text-xs text-gray-500 font-medium flex items-center">
                            <Layers className="w-3.5 h-3.5 mr-1 text-emerald-700" /> Задача: {step.task}
                          </span>
                        </div>

                        <div className="space-y-3 mt-3">
                          {step.products.map(prod => (
                            <div key={prod.name} className="bg-gray-50 rounded-lg p-3.5 border border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-[10px] font-medium px-2 py-0.5 bg-white border border-gray-200 text-gray-700 rounded-md">
                                    {prod.group}
                                  </span>
                                  <h5 className="font-bold text-sm text-[#1B4D3E]">{prod.name}</h5>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">ДВ: {prod.dv}</p>
                                {prod.note && <p className="text-xs text-amber-700 mt-0.5 font-medium">{prod.note}</p>}
                              </div>
                              <div className="text-right shrink-0 bg-white px-3 py-2 rounded-lg border border-gray-200">
                                <span className="text-[10px] text-gray-400 block">Норма из прайса</span>
                                <span className="font-bold text-sm text-[#1B4D3E]">{prod.rate}</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {step.tankMixNote && (
                          <div className="mt-3 text-xs text-blue-800 bg-blue-50 p-2.5 rounded-lg border border-blue-100 flex items-center space-x-2">
                            <Droplet className="w-4 h-4 text-blue-600 shrink-0" />
                            <span>{step.tankMixNote}</span>
                          </div>
                        )}

                        {step.adjuvant && (
                          <div className="mt-2 text-xs text-emerald-800 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100">
                            <b>Рекомендуемый адъювант / ПАВ:</b> {step.adjuvant}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-8 pt-4 border-t border-gray-100 text-center text-xs text-gray-400">
                АгроПомощник ДФ • Готовые схемы защиты с точными нормами • На базе прайса Кинзябузов.xlsx
              </div>
            </CardContent>
          </Card>
        </div>

      </main>
    </div>
  );
}
