import { useState } from "react";
import { CROP_OPTIONS, PROBLEM_CATEGORIES, CropOption } from "@/data/agropom";
import { DRUGS } from "@/data/drugs";
import { AGRONOMIC_RULES } from "@/data/agtorules";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sprout, ShieldAlert, Bug, Sun, Zap, Search, ArrowLeft, CheckCircle2, AlertCircle, HelpCircle, Info } from "lucide-react";
import { Link } from "wouter";

export default function AgroHelper() {
  const [selectedCrop, setSelectedCrop] = useState<CropOption | null>(null);
  const [selectedTech, setSelectedTech] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("weeds");
  const [selectedIssue, setSelectedIssue] = useState<string>("");

  // Строгий агрономический подбор препаратов из прайса
  const getRecommendations = (): { drug: any; confidence: 'high' | 'medium' | 'review'; reason: string }[] => {
    if (!selectedCrop || !selectedIssue) return [];

    const results: { drug: any; confidence: 'high' | 'medium' | 'review'; reason: string }[] = [];

    // Ищем подходящее правило в матрице регламентов
    const rule = AGRONOMIC_RULES.find(r => r.cropId === selectedCrop.id && r.category === selectedCategory);

    DRUGS.forEach((drug: any) => {
      const groupMatch = rule ? rule.allowedGroups.includes(drug.group) : (
        (selectedCategory === 'weeds' && drug.group === 'Гербицид') ||
        (selectedCategory === 'diseases' && (drug.group === 'Фунгицид' || drug.group === 'Протравитель')) ||
        (selectedCategory === 'pests' && drug.group === 'Инсектицид') ||
        (selectedCategory === 'desiccation' && drug.group === 'Десикант') ||
        (selectedCategory === 'nutrition' && (drug.group === 'Удобрение' || drug.group === 'Вспомогательный'))
      );

      if (!groupMatch) return;

      const dvLower = drug.dv.toLowerCase();
      const cultLower = drug.cult.toLowerCase();
      const cropNameLower = selectedCrop.name.toLowerCase();

      // Проверяем технологию (например, Clearfield или Express)
      if (selectedTech === 'Clearfield' && selectedCrop.name.includes('Подсолнечник') && !dvLower.includes('имазамокс') && !dvLower.includes('имазапир')) {
        return;
      }
      if (selectedTech === 'Express (Трио/Экспресс)' && selectedCrop.name.includes('Подсолнечник') && !dvLower.includes('трибенурон')) {
        return;
      }

      // Проверка по правилу
      if (rule) {
        const hasRequired = rule.requiredKeywords.some(kw => dvLower.includes(kw));
        const hasExcluded = rule.excludedKeywords.some(kw => dvLower.includes(kw));
        const matchesCult = cultLower.includes('все') || cultLower.split(/[, коммуна]+/).some((c: string) => cropNameLower.includes(c.trim()) || c.trim().includes(cropNameLower.split(' ')[0]));

        if (hasExcluded) return;

        if (hasRequired && matchesCult) {
          results.push({
            drug,
            confidence: 'high',
            reason: `Строгое соответствие регламенту: действующее вещество (${drug.dv}) и культура (${selectedCrop.name}) подтверждены по прайс-листу.`
          });
        } else if (hasRequired) {
          results.push({
            drug,
            confidence: 'medium',
            reason: `Действующее вещество (${drug.dv}) профильное для задачи, требуется уточнение спектра по региональному регламенту.`
          });
        }
      } else {
        // Базовый поиск по упоминанию культуры в прайсе
        const matchesCult = cultLower.includes('все') || cultLower.includes(selectedCrop.name.toLowerCase().split(' ')[0]);
        if (matchesCult) {
          results.push({
            drug,
            confidence: 'medium',
            reason: `Препарат зарегистрирован на культуру согласно данным прайс-листа.`
          });
        }
      }
    });

    // Если точных совпадений по строгим правилам мало, добавляем профильные по группе с пометкой о проверке
    if (results.length === 0) {
      DRUGS.forEach((drug: any) => {
        const isGroupOk = (selectedCategory === 'weeds' && drug.group === 'Гербицид') ||
                          (selectedCategory === 'diseases' && (drug.group === 'Фунгицид' || drug.group === 'Протравитель')) ||
                          (selectedCategory === 'pests' && drug.group === 'Инсектицид') ||
                          (selectedCategory === 'desiccation' && drug.group === 'Десикант');
        if (isGroupOk && results.length < 3) {
          results.push({
            drug,
            confidence: 'review',
            reason: `Общая позиция группы в прайсе. Требуется обязательная сверка регламента применения на культуре ${selectedCrop.name}.`
          });
        }
      });
    }

    return results.slice(0, 3);
  };

  const recommendations = getRecommendations();

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
              <p className="text-xs text-gray-500">Агрономический подбор по регламентам и прайсу</p>
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
        
        {/* Левая колонка: шаги выбора */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Шаг 1: Культура и технология */}
          <Card className="border-[#E2E8DF] shadow-xs bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-[#1B4D3E] flex items-center justify-between">
                <span>1. Культура и технология</span>
                {selectedCrop && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {CROP_OPTIONS.map((crop) => (
                  <button
                    key={crop.id}
                    onClick={() => {
                      setSelectedCrop(crop);
                      setSelectedTech(crop.technologies[0]);
                    }}
                    className={`text-left text-xs p-2.5 rounded-lg border transition-all ${
                      selectedCrop?.id === crop.id
                        ? "bg-[#1B4D3E] text-white border-[#1B4D3E] shadow-xs"
                        : "bg-white text-gray-700 border-gray-200 hover:border-[#1B4D3E]/40"
                    }`}
                  >
                    {crop.name}
                  </button>
                ))}
              </div>

              {selectedCrop && selectedCrop.technologies.length > 1 && (
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <label className="text-xs font-medium text-gray-600 block mb-1.5">Технология возделывания:</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedCrop.technologies.map(tech => (
                      <button
                        key={tech}
                        onClick={() => setSelectedTech(tech)}
                        className={`text-xs px-3 py-1 rounded-full border transition-all ${
                          selectedTech === tech
                            ? "bg-emerald-700 text-white border-emerald-700"
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

          {/* Шаг 2: Задача или проблема */}
          <Card className="border-[#E2E8DF] shadow-xs bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-[#1B4D3E] flex items-center justify-between">
                <span>2. Агрономическая задача</span>
                {selectedIssue && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-2">
                {PROBLEM_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setSelectedIssue(cat.issues[0]);
                    }}
                    className={`text-left text-xs p-2.5 rounded-lg border flex items-center space-x-2 transition-all ${
                      selectedCategory === cat.id
                        ? "bg-[#1B4D3E]/10 text-[#1B4D3E] border-[#1B4D3E] font-medium"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-gray-100">
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Уточните проблему на поле:</label>
                <select
                  value={selectedIssue}
                  onChange={(e) => setSelectedIssue(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-gray-200 bg-white text-gray-800 focus:outline-hidden focus:border-[#1B4D3E]"
                >
                  {PROBLEM_CATEGORIES.find(c => c.id === selectedCategory)?.issues.map((iss) => (
                    <option key={iss} value={iss}>{iss}</option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Правая колонка: результаты подбора с матрицей уверенности */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="border-[#E2E8DF] shadow-xs bg-white min-h-[500px] flex flex-col">
            <CardHeader className="border-b border-gray-100 bg-[#FBFDFC]">
              <CardTitle className="text-lg font-bold text-[#1B4D3E] flex items-center justify-between">
                <span>Проверенные решения из прайса ДФ</span>
                {selectedCrop && (
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 font-normal">
                    {selectedCrop.name} {selectedTech ? `(${selectedTech})` : ''}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex-1 flex flex-col justify-between">
              
              {!selectedCrop ? (
                <div className="text-center py-20 my-auto text-gray-400 space-y-3">
                  <Search className="w-12 h-12 mx-auto stroke-1 text-gray-300" />
                  <p className="text-sm font-medium">Выберите культуру, технологию и задачу в левой панели,<br />чтобы получить регламентированный подбор.</p>
                </div>
              ) : recommendations.length === 0 ? (
                <div className="text-center py-20 my-auto text-gray-500 space-y-2">
                  <AlertCircle className="w-10 h-10 mx-auto text-amber-500" />
                  <p className="font-medium text-sm">По выбранным параметрам в текущем прайсе совпадений не найдено.</p>
                  <p className="text-xs text-gray-400">Попробуйте изменить категорию задачи или технологию.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="text-xs text-gray-600 bg-amber-50 border border-amber-200/60 p-3 rounded-lg flex items-start space-x-2">
                    <Info className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
                    <span>Подбор выполнен по действующим веществам и зарегистрированным регламентам прайс-листа Кинзябузов.xlsx с учетом технологии <b>{selectedTech || 'Классика'}</b>. Обязательно сверяйте фазу развития культуры перед внесением.</span>
                  </div>

                  <div className="space-y-4">
                    {recommendations.map(({ drug, confidence, reason }) => (
                      <div key={drug.name} className="border border-gray-200 rounded-xl p-5 bg-white shadow-xs hover:border-emerald-700/50 transition-all">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md">
                                {drug.group}
                              </span>
                              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
                                confidence === 'high' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                confidence === 'medium' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}>
                                {confidence === 'high' ? '✓ Строгий регламент' : confidence === 'medium' ? '○ Профильное ДВ' : '⚠ Требует сверки'}
                              </span>
                            </div>
                            <h3 className="font-bold text-lg text-[#1B4D3E] mt-1.5">{drug.name}</h3>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-gray-400 block">Норма применения</span>
                            <span className="font-bold text-sm text-gray-800">{drug.norma}</span>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-gray-400 block font-medium">Действующее вещество:</span>
                            <span className="text-gray-800 font-semibold">{drug.dv}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block font-medium">Регламент / Обоснование:</span>
                            <span className="text-gray-700">{reason}</span>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                          <span className="text-emerald-700 font-medium flex items-center">
                            <HelpCircle className="w-3.5 h-3.5 mr-1" /> Вопрос для клиента: «Какая фаза развития сорняка или культуры на поле?»
                          </span>
                          <span className="text-gray-400">Зарегистрированные культуры: {drug.cult}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-8 pt-4 border-t border-gray-100 text-center text-xs text-gray-400">
                АгроПомощник ДФ • Версия 2.0 (Аудит по действующим веществам) • На базе прайса Кинзябузов.xlsx
              </div>
            </CardContent>
          </Card>
        </div>

      </main>
    </div>
  );
}
