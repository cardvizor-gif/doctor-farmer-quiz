import { useState } from "react";
import { CROP_OPTIONS, PROBLEM_CATEGORIES, CropOption } from "@/data/agropom";
import { DRUGS_DATABASE } from "@/data/drugs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sprout, ShieldAlert, Bug, Sun, Zap, Search, ArrowLeft, CheckCircle2, AlertCircle, HelpCircle } from "lucide-react";
import { Link } from "wouter";

export default function AgroHelper() {
  const [selectedCrop, setSelectedCrop] = useState<CropOption | null>(null);
  const [selectedTech, setSelectedTech] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("weeds");
  const [selectedIssue, setSelectedIssue] = useState<string>("");

  // Подбор препаратов на основе выбранных параметров
  const getRecommendations = (): any[] => {
    if (!selectedCrop || !selectedIssue) return [];

    let matched = DRUGS_DATABASE.filter((drug: any) => {
      // Фильтрация по смыслу проблемы
      const nameLower = drug.name.toLowerCase();
      const groupLower = drug.group.toLowerCase();
      const descLower = drug.description.toLowerCase();

      if (selectedCategory === 'weeds') {
        return groupLower.includes('гербицид') || descLower.includes('сорняк') || descLower.includes('злаков') || descLower.includes('двудоль');
      }
      if (selectedCategory === 'diseases') {
        return groupLower.includes('фунгицид') || groupLower.includes('протравитель') || descLower.includes('гниль') || descLower.includes('болезн');
      }
      if (selectedCategory === 'pests') {
        return groupLower.includes('инсектицид') || descLower.includes('вредител') || descLower.includes('мух') || descLower.includes('Тли');
      }
      if (selectedCategory === 'desiccation') {
        return groupLower.includes('десикант') || descLower.includes('десикац');
      }
      if (selectedCategory === 'nutrition') {
        return groupLower.includes('удобрени') || groupLower.includes('стимулятор') || groupLower.includes('аминокислот');
      }
      return true;
    });

    // Возвращаем до 3 подходящих вариантов
    return matched.slice(0, 3);
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
              <p className="text-xs text-gray-500">Интеллектуальный подбор решений из прайса</p>
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
          
          {/* Шаг 1: Культура */}
          <Card className="border-[#E2E8DF] shadow-xs bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-[#1B4D3E] flex items-center justify-between">
                <span>1. Выберите культуру</span>
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

          {/* Шаг 2: Проблема / Категория */}
          <Card className="border-[#E2E8DF] shadow-xs bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-[#1B4D3E] flex items-center justify-between">
                <span>2. Задача или проблема</span>
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

              {/* Уточнение проблемы */}
              <div className="pt-2 border-t border-gray-100">
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Уточните задачу:</label>
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

        {/* Правая колонка: результаты подбора */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="border-[#E2E8DF] shadow-xs bg-white min-h-[500px] flex flex-col">
            <CardHeader className="border-b border-gray-100 bg-[#FBFDFC]">
              <CardTitle className="text-lg font-bold text-[#1B4D3E] flex items-center justify-between">
                <span>Рекомендации прайса «Доктор Фармер»</span>
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
                  <p className="text-sm font-medium">Выберите культуру и задачу в левой панели,<br />чтобы получить агрономическое решение из прайса.</p>
                </div>
              ) : recommendations.length === 0 ? (
                <div className="text-center py-20 my-auto text-gray-500 space-y-2">
                  <AlertCircle className="w-10 h-10 mx-auto text-amber-500" />
                  <p className="font-medium text-sm">По вашему запросу точных позиций в текущем срезе не найдено.</p>
                  <p className="text-xs text-gray-400">Попробуйте выбрать другую категорию или уточнить задачу.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="text-xs text-gray-500 bg-emerald-50 border border-emerald-100 p-3 rounded-lg flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
                    <span>Подобранные препараты проверены по прайсу и соответствуют заявленной агрономической задаче для культуры <b>{selectedCrop.name}</b>.</span>
                  </div>

                  <div className="space-y-4">
                    {recommendations.map((drug: any, idx: number) => (
                      <div key={drug.name} className="border border-gray-200 rounded-xl p-5 bg-white shadow-xs hover:border-emerald-700/50 transition-all">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md">
                              {drug.group}
                            </span>
                            <h3 className="font-bold text-lg text-[#1B4D3E] mt-1.5">{drug.name}</h3>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-gray-400 block">Норма применения</span>
                            <span className="font-bold text-sm text-gray-800">{drug.rate}</span>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-gray-400 block font-medium">Действующее вещество:</span>
                            <span className="text-gray-800 font-semibold">{drug.activeIngredient}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block font-medium">Назначение / Описание:</span>
                            <span className="text-gray-700 line-clamp-2">{drug.description}</span>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                          <span className="text-emerald-700 font-medium flex items-center">
                            <HelpCircle className="w-3.5 h-3.5 mr-1" /> Вопрос для клиента: «Какая фаза развития сорняка или культуры на поле?»
                          </span>
                          <span className="text-gray-400">Артикул из прайса ДФ</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-8 pt-4 border-t border-gray-100 text-center text-xs text-gray-400">
                АгроПомощник ДФ • Версия 1.0 MVP • На базе прайса Кинзябузов.xlsx
              </div>
            </CardContent>
          </Card>
        </div>

      </main>
    </div>
  );
}
