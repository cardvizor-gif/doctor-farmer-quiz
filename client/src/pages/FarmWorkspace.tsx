import { DoctorFarmerLogo } from "@/components/DoctorFarmerLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { buildAgroHelperContextQuery, buildProposalContextQuery } from "@/lib/proposal";
import { downloadFarmImportTemplate, downloadFarmsWorkbook, readFarmImportFile, type ImportFilePreview } from "@/lib/workspaceTransfer";
import type { Farm } from "../../../drizzle/schema";
import { AlertCircle, Building2, ChevronRight, CircleDollarSign, Download, FileSpreadsheet, FileText, MapPin, Plus, Save, Search, Sprout, Upload, UsersRound } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

type FarmDraft = {
  name: string;
  district: string;
  settlement: string;
  contactName: string;
  contactRole: string;
  phone: string;
  email: string;
  totalArea: string;
  crops: string;
  technology: string;
  salesStage: "lead" | "diagnostics" | "proposal" | "negotiation" | "client";
  potentialValue: string;
  nextAction: string;
  nextActionAt: string;
  notes: string;
};

const stages: Record<FarmDraft["salesStage"], { label: string; className: string }> = {
  lead: { label: "Новый контакт", className: "bg-slate-100 text-slate-700" },
  diagnostics: { label: "Диагностика", className: "bg-blue-50 text-blue-700" },
  proposal: { label: "КП готовится", className: "bg-amber-50 text-amber-700" },
  negotiation: { label: "Согласование", className: "bg-violet-50 text-violet-700" },
  client: { label: "Клиент", className: "bg-emerald-50 text-emerald-700" },
};

const blankDraft = (): FarmDraft => ({
  name: "",
  district: "",
  settlement: "",
  contactName: "",
  contactRole: "",
  phone: "",
  email: "",
  totalArea: "",
  crops: "",
  technology: "",
  salesStage: "lead",
  potentialValue: "",
  nextAction: "",
  nextActionAt: "",
  notes: "",
});

const farmToDraft = (farm: Farm): FarmDraft => ({
  name: farm.name,
  district: farm.district ?? "",
  settlement: farm.settlement ?? "",
  contactName: farm.contactName ?? "",
  contactRole: farm.contactRole ?? "",
  phone: farm.phone ?? "",
  email: farm.email ?? "",
  totalArea: farm.totalArea ?? "",
  crops: farm.crops ?? "",
  technology: farm.technology ?? "",
  salesStage: farm.salesStage,
  potentialValue: farm.potentialValue ?? "",
  nextAction: farm.nextAction ?? "",
  nextActionAt: farm.nextActionAt ? new Date(farm.nextActionAt).toISOString().slice(0, 10) : "",
  notes: farm.notes ?? "",
});

function makePayload(draft: FarmDraft) {
  return {
    ...draft,
    district: draft.district || null,
    settlement: draft.settlement || null,
    contactName: draft.contactName || null,
    contactRole: draft.contactRole || null,
    phone: draft.phone || null,
    email: draft.email || null,
    totalArea: Number(draft.totalArea || 0),
    crops: draft.crops || null,
    technology: draft.technology || null,
    potentialValue: Number(draft.potentialValue || 0),
    nextAction: draft.nextAction || null,
    nextActionAt: draft.nextActionAt || null,
    notes: draft.notes || null,
  };
}

function displayNumber(value: string | number | null | undefined) {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(Number(value ?? 0));
}

function FarmFields({ draft, onChange, showNotes = true }: { draft: FarmDraft; onChange: (key: keyof FarmDraft, value: string) => void; showNotes?: boolean }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="space-y-1.5 sm:col-span-2">
        <span className="text-xs font-bold text-[#194f38]">Название хозяйства *</span>
        <Input value={draft.name} onChange={event => onChange("name", event.target.value)} placeholder="Например, ООО «Название хозяйства»" />
      </label>
      <label className="space-y-1.5">
        <span className="text-xs font-bold text-[#194f38]">Район</span>
        <Input value={draft.district} onChange={event => onChange("district", event.target.value)} placeholder="Район работы" />
      </label>
      <label className="space-y-1.5">
        <span className="text-xs font-bold text-[#194f38]">Населённый пункт</span>
        <Input value={draft.settlement} onChange={event => onChange("settlement", event.target.value)} placeholder="Село или город" />
      </label>
      <label className="space-y-1.5">
        <span className="text-xs font-bold text-[#194f38]">Контактное лицо</span>
        <Input value={draft.contactName} onChange={event => onChange("contactName", event.target.value)} placeholder="Фамилия Имя" />
      </label>
      <label className="space-y-1.5">
        <span className="text-xs font-bold text-[#194f38]">Должность</span>
        <Input value={draft.contactRole} onChange={event => onChange("contactRole", event.target.value)} placeholder="ЛПР, агроном, руководитель" />
      </label>
      <label className="space-y-1.5">
        <span className="text-xs font-bold text-[#194f38]">Телефон</span>
        <Input value={draft.phone} onChange={event => onChange("phone", event.target.value)} placeholder="+7 (...)" />
      </label>
      <label className="space-y-1.5">
        <span className="text-xs font-bold text-[#194f38]">E-mail</span>
        <Input type="email" value={draft.email} onChange={event => onChange("email", event.target.value)} placeholder="mail@example.ru" />
      </label>
      <label className="space-y-1.5">
        <span className="text-xs font-bold text-[#194f38]">Площадь, га</span>
        <Input type="number" min="0" value={draft.totalArea} onChange={event => onChange("totalArea", event.target.value)} placeholder="0" />
      </label>
      <label className="space-y-1.5">
        <span className="text-xs font-bold text-[#194f38]">Статус работы</span>
        <select value={draft.salesStage} onChange={event => onChange("salesStage", event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-[#2e7d52]">
          {Object.entries(stages).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}
        </select>
      </label>
      <label className="space-y-1.5 sm:col-span-2">
        <span className="text-xs font-bold text-[#194f38]">Культуры и площадь по ним</span>
        <Input value={draft.crops} onChange={event => onChange("crops", event.target.value)} placeholder="Например: озимая пшеница — 1 200 га; подсолнечник — 450 га" />
      </label>
      <label className="space-y-1.5">
        <span className="text-xs font-bold text-[#194f38]">Технология</span>
        <Input value={draft.technology} onChange={event => onChange("technology", event.target.value)} placeholder="Классическая, Clearfield, Express" />
      </label>
      <label className="space-y-1.5">
        <span className="text-xs font-bold text-[#194f38]">Потенциал, ₽</span>
        <Input type="number" min="0" value={draft.potentialValue} onChange={event => onChange("potentialValue", event.target.value)} placeholder="0" />
      </label>
      <label className="space-y-1.5 sm:col-span-2">
        <span className="text-xs font-bold text-[#194f38]">Следующее действие</span>
        <Input value={draft.nextAction} onChange={event => onChange("nextAction", event.target.value)} placeholder="Например: назначить выезд и согласовать демо" />
      </label>
      <label className="space-y-1.5">
        <span className="text-xs font-bold text-[#194f38]">Дата следующего действия</span>
        <Input type="date" value={draft.nextActionAt} onChange={event => onChange("nextActionAt", event.target.value)} />
      </label>
      {showNotes && <label className="space-y-1.5 sm:col-span-2">
        <span className="text-xs font-bold text-[#194f38]">Рабочие заметки</span>
        <Textarea value={draft.notes} onChange={event => onChange("notes", event.target.value)} placeholder="Потребность, возражения, договорённости, контекст поля" rows={4} />
      </label>}
    </div>
  );
}

export default function FarmWorkspace() {
  const utils = trpc.useUtils();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [draft, setDraft] = useState<FarmDraft>(blankDraft());
  const [createDraft, setCreateDraft] = useState<FarmDraft>(blankDraft());
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isReadingImport, setIsReadingImport] = useState(false);
  const [importPreview, setImportPreview] = useState<ImportFilePreview | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const farmsQuery = trpc.farms.list.useQuery();
  const farms = farmsQuery.data ?? [];
  const selectedFarm = farms.find(farm => farm.id === selectedFarmId) ?? null;

  useEffect(() => {
    if (!selectedFarmId && farms[0]) {
      setSelectedFarmId(farms[0].id);
      setDraft(farmToDraft(farms[0]));
    }
  }, [farms, selectedFarmId]);

  const selectFarm = (farm: Farm) => {
    setSelectedFarmId(farm.id);
    setDraft(farmToDraft(farm));
  };

  const createFarm = trpc.farms.create.useMutation({
    onSuccess: async farm => {
      await utils.farms.list.invalidate();
      if (farm) selectFarm(farm);
      setIsCreating(false);
      setCreateDraft(blankDraft());
      toast.success("Карточка хозяйства создана");
    },
    onError: error => toast.error(error.message),
  });

  const updateFarm = trpc.farms.update.useMutation({
    onSuccess: async farm => {
      await utils.farms.list.invalidate();
      if (farm) selectFarm(farm);
      setLastSavedAt(Date.now());
      toast.success("Карточка хозяйства сохранена");
    },
    onError: error => toast.error(error.message),
  });

  const importFarms = trpc.farms.bulkCreate.useMutation({
    onSuccess: async result => {
      await utils.farms.list.invalidate();
      setImportPreview(null);
      setIsImportOpen(false);
      toast.success(`Добавлено карточек хозяйств: ${result.created}`);
    },
    onError: error => toast.error(error.message),
  });

  const filteredFarms = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("ru-RU");
    if (!term) return farms;
    return farms.filter(farm => [farm.name, farm.district, farm.settlement, farm.contactName, farm.crops].filter(Boolean).join(" ").toLocaleLowerCase("ru-RU").includes(term));
  }, [farms, search]);

  const totalArea = farms.reduce((sum, farm) => sum + Number(farm.totalArea ?? 0), 0);
  const totalPotential = farms.reduce((sum, farm) => sum + Number(farm.potentialValue ?? 0), 0);
  const nextActions = farms.filter(farm => farm.nextAction?.trim()).length;
  const changeDraft = (key: keyof FarmDraft, value: string) => setDraft(current => ({ ...current, [key]: value } as FarmDraft));
  const changeCreateDraft = (key: keyof FarmDraft, value: string) => setCreateDraft(current => ({ ...current, [key]: value } as FarmDraft));
  const importErrors = importPreview?.rows.flatMap((row) => row.errors.map((error) => `Строка ${row.rowNumber}: ${error}`)) ?? [];
  const importableFarms = importPreview?.rows.flatMap((row) => row.farm ? [row.farm] : []) ?? [];

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setIsReadingImport(true);
    setImportPreview(null);
    try {
      const preview = await readFarmImportFile(file);
      setImportPreview(preview);
      if (preview.headerErrors.length > 0) toast.error("Файл не соответствует шаблону");
      else if (preview.rows.some((row) => row.errors.length > 0)) toast.warning("Исправьте ошибки в файле: сохранение заблокировано");
      else toast.success(`Файл проверен: ${preview.rows.length} строк готовы к импорту`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось прочитать файл");
    } finally {
      setIsReadingImport(false);
    }
  };

  return (
    <div className="farm-workspace min-h-screen bg-[#f4f7f1] text-[#15211c]">
      <header className="sticky top-0 z-30 border-b border-[#dde5dc] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="shrink-0"><DoctorFarmerLogo className="h-9 w-auto" clickable={false} /></Link>
          <nav className="hidden items-center gap-2 sm:flex">
            <Link href="/agro-helper"><Button variant="outline" size="sm">АгроПомощник</Button></Link>
            <Link href="/knowledge-base"><Button variant="outline" size="sm">База знаний</Button></Link>
            <Link href="/quiz"><Button variant="outline" size="sm">Тестирование</Button></Link>
            <Link href="/proposals/new"><Button variant="outline" size="sm" className="border-[#2e7d52] text-[#194f38]"><FileText className="mr-1.5 h-4 w-4" />Генератор КП</Button></Link>
            <Button size="sm" className="bg-[#194f38] hover:bg-[#12352a]" onClick={() => setIsCreating(true)}><Plus className="mr-1.5 h-4 w-4" />Новое хозяйство</Button>
          </nav>
          <Button size="sm" className="bg-[#194f38] hover:bg-[#12352a] sm:hidden" onClick={() => setIsCreating(true)}><Plus className="h-4 w-4" /></Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:py-10">
        <section className="farm-workspace-hero mb-7 grid gap-5 rounded-3xl border border-[#dce8dc] bg-[#173f30] p-6 text-white shadow-[0_18px_60px_rgba(19,53,42,0.16)] lg:grid-cols-[1.4fr_1fr] lg:p-8">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.13em] text-emerald-100"><Building2 className="h-3.5 w-3.5" />Клиентская база</div>
            <h1 className="max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">Хозяйства и возможности продаж</h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-emerald-50/80">Соберите агрономический и коммерческий контекст хозяйства, зафиксируйте следующий шаг и подготовьте основу для персонального коммерческого предложения.</p>
            <div className="mt-5 flex flex-wrap gap-2"><Button variant="outline" size="sm" className="border-white/30 bg-white/10 text-white hover:bg-white/20" onClick={() => setLocation("/proposals/new")}><FileText className="mr-1.5 h-4 w-4" />Открыть генератор КП</Button><Button variant="outline" size="sm" className="border-white/30 bg-white/10 text-white hover:bg-white/20" onClick={() => setIsImportOpen(true)}><Upload className="mr-1.5 h-4 w-4" />Импорт Excel</Button><Button variant="outline" size="sm" className="border-white/30 bg-white/10 text-white hover:bg-white/20" onClick={() => void downloadFarmsWorkbook(farms)}><Download className="mr-1.5 h-4 w-4" />Экспорт реестра</Button></div>
          </div>
          <div className="grid grid-cols-3 gap-2 self-end">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-3"><span className="text-[10px] font-bold uppercase tracking-wide text-emerald-100/70">Хозяйств</span><strong className="mt-1 block text-2xl">{farms.length}</strong></div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-3"><span className="text-[10px] font-bold uppercase tracking-wide text-emerald-100/70">Площадь</span><strong className="mt-1 block text-2xl">{displayNumber(totalArea)}<small className="ml-1 text-sm font-medium">га</small></strong></div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-3"><span className="text-[10px] font-bold uppercase tracking-wide text-emerald-100/70">Действий</span><strong className="mt-1 block text-2xl">{nextActions}</strong></div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[0.85fr_1.45fr]">
          <section className="overflow-hidden rounded-2xl border border-[#dde5dc] bg-white shadow-sm">
            <div className="border-b border-[#e7eee5] p-4">
              <div className="mb-3 flex items-center justify-between gap-3"><h2 className="font-bold text-[#12352a]">Реестр хозяйств</h2><div className="flex items-center gap-2"><Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs text-[#194f38]" onClick={() => void downloadFarmImportTemplate()}><FileSpreadsheet className="mr-1 h-3.5 w-3.5" />Шаблон</Button><span className="rounded-full bg-[#e8efe5] px-2.5 py-1 text-xs font-bold text-[#194f38]">{filteredFarms.length}</span></div></div>
              <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#72917d]" /><Input value={search} onChange={event => setSearch(event.target.value)} className="pl-9" placeholder="Поиск по хозяйству, району, культуре" /></div>
            </div>
            <div className="max-h-[620px] overflow-y-auto p-2">
              {farmsQuery.isLoading && <div className="p-6 text-center text-sm text-[#6f7a73]">Загружаем хозяйства…</div>}
              {farmsQuery.isError && <div className="p-6 text-center text-sm text-red-700">Не удалось загрузить реестр. Обновите страницу.</div>}
              {!farmsQuery.isLoading && filteredFarms.length === 0 && <div className="p-6 text-center"><Building2 className="mx-auto mb-3 h-9 w-9 text-[#9bb3a2]" /><p className="text-sm font-semibold text-[#194f38]">Пока нет карточек хозяйств</p><p className="mt-1 text-xs leading-relaxed text-[#6f7a73]">Можно сразу рассчитать КП по схеме; для сохранения его в историю добавьте карточку хозяйства.</p><div className="mt-4 flex flex-wrap justify-center gap-2"><Button onClick={() => setIsCreating(true)} size="sm" className="bg-[#194f38] hover:bg-[#12352a]"><Plus className="mr-1 h-4 w-4" />Добавить хозяйство</Button><Button onClick={() => setLocation("/proposals/new")} variant="outline" size="sm" className="border-[#2e7d52] text-[#194f38]"><FileText className="mr-1 h-4 w-4" />Генератор КП</Button></div></div>}
              {filteredFarms.map(farm => <button key={farm.id} type="button" onClick={() => selectFarm(farm)} className={`mb-1 w-full rounded-xl p-3 text-left transition-colors ${selectedFarmId === farm.id ? "bg-[#e8f1e7]" : "hover:bg-[#f5f8f4]"}`}>
                <div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate font-bold text-[#12352a]">{farm.name}</p><p className="mt-0.5 flex items-center gap-1 text-xs text-[#6f7a73]"><MapPin className="h-3 w-3" />{[farm.district, farm.settlement].filter(Boolean).join(" · ") || "Локация не указана"}</p></div><span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${stages[farm.salesStage].className}`}>{stages[farm.salesStage].label}</span></div>
                <div className="mt-3 flex items-center justify-between border-t border-[#dce8dc] pt-2 text-xs text-[#486656]"><span>{displayNumber(farm.totalArea)} га</span><span>{farm.nextAction?.trim() ? "Есть следующий шаг" : "Без задачи"}</span></div>
              </button>)}
            </div>
          </section>

          <section className="rounded-2xl border border-[#dde5dc] bg-white p-5 shadow-sm sm:p-6">
            {!selectedFarm && <div className="flex min-h-[460px] flex-col items-center justify-center text-center"><Sprout className="mb-4 h-12 w-12 text-[#8cac91]" /><h2 className="text-xl font-bold text-[#12352a]">Выберите хозяйство из реестра</h2><p className="mt-2 max-w-sm text-sm leading-relaxed text-[#6f7a73]">Здесь будет карточка клиента: контакты, культуры, потенциал и сценарий следующего действия.</p><Button onClick={() => setLocation("/proposals/new")} variant="outline" className="mt-5 border-[#2e7d52] text-[#194f38]"><FileText className="mr-1.5 h-4 w-4" />Перейти к генератору КП</Button></div>}
            {selectedFarm && <form onSubmit={event => { event.preventDefault(); updateFarm.mutate({ id: selectedFarm.id, ...makePayload(draft) }); }}>
              <div className="mb-6 flex flex-col gap-4 border-b border-[#e7eee5] pb-5 sm:flex-row sm:items-start sm:justify-between">
                <div><div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#2e7d52]"><UsersRound className="h-4 w-4" />Карточка хозяйства</div><h2 className="text-2xl font-extrabold tracking-tight text-[#12352a]">{selectedFarm.name}</h2><p className="mt-1 text-sm text-[#6f7a73]">Обновляйте договорённости и контекст перед визитом или подготовкой КП.</p></div>
                <div className="flex flex-wrap items-center justify-end gap-2"><span className={`rounded-full px-3 py-2 text-xs font-bold ${stages[selectedFarm.salesStage].className}`}>{stages[selectedFarm.salesStage].label}</span>{lastSavedAt && <span className="rounded-full bg-[#e8f1e7] px-2.5 py-1.5 text-[10px] font-bold text-[#194f38]" role="status">Карточка сохранена</span>}<Button type="submit" disabled={updateFarm.isPending} className="bg-[#194f38] hover:bg-[#12352a]"><Save className="mr-1.5 h-4 w-4" />Сохранить</Button></div>
              </div>
              <div className="mb-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-[#f5f8f4] p-3"><span className="text-[10px] font-bold uppercase tracking-wide text-[#6f7a73]">Площадь</span><strong className="mt-1 block text-lg text-[#12352a]">{displayNumber(draft.totalArea)} га</strong></div>
                <div className="rounded-xl bg-[#f5f8f4] p-3"><span className="text-[10px] font-bold uppercase tracking-wide text-[#6f7a73]">Потенциал</span><strong className="mt-1 block text-lg text-[#12352a]">{displayNumber(draft.potentialValue)} ₽</strong></div>
                <div className="rounded-xl bg-[#f5f8f4] p-3"><span className="text-[10px] font-bold uppercase tracking-wide text-[#6f7a73]">Следующий шаг</span><strong className="mt-1 block truncate text-sm text-[#12352a]">{draft.nextAction || "Не задан"}</strong></div>
              </div>
              <FarmFields draft={draft} onChange={changeDraft} />
              <div className="mt-6 flex flex-col gap-3 border-t border-[#e7eee5] pt-5 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs leading-relaxed text-[#6f7a73]">Откройте АгроПомощник в контексте этого хозяйства: его площадь автоматически передастся в готовую схему и затем в коммерческое предложение.</p><div className="flex flex-wrap gap-2"><Button type="button" variant="outline" className="border-[#2e7d52] text-[#194f38]" onClick={() => setLocation(`/agro-helper?${buildAgroHelperContextQuery({ farmId: selectedFarm.id, area: Number(draft.totalArea || 0) })}`)}>Открыть схему <ChevronRight className="ml-1 h-4 w-4" /></Button><Button type="button" className="bg-[#194f38] hover:bg-[#12352a]" onClick={() => setLocation(`/proposals/new?${buildProposalContextQuery({ farmId: selectedFarm.id, area: Number(draft.totalArea || 0) })}`)}>К генератору КП <ChevronRight className="ml-1 h-4 w-4" /></Button></div></div>
            </form>}
          </section>
        </div>
        {totalPotential > 0 && <p className="mt-5 flex items-center gap-2 text-xs text-[#6f7a73]"><CircleDollarSign className="h-4 w-4 text-[#2e7d52]" />Совокупный зафиксированный потенциал: <strong className="text-[#194f38]">{displayNumber(totalPotential)} ₽</strong></p>}
      </main>

        {isCreating && <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#12352a]/45 p-0 sm:items-center sm:p-4"><div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-7"><div className="mb-6 flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wide text-[#2e7d52]">Новая карточка</p><h2 className="mt-1 text-2xl font-extrabold text-[#12352a]">Добавить хозяйство</h2><p className="mt-1 text-sm text-[#6f7a73]">Заполните только известные данные — карточку можно дополнить позже.</p></div><Button type="button" variant="ghost" onClick={() => setIsCreating(false)}>Закрыть</Button></div><form onSubmit={event => { event.preventDefault(); createFarm.mutate(makePayload(createDraft)); }}><FarmFields draft={createDraft} onChange={changeCreateDraft} showNotes={false} /><div className="mt-6 flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => setIsCreating(false)}>Отмена</Button><Button type="submit" disabled={createFarm.isPending} className="bg-[#194f38] hover:bg-[#12352a]"><Plus className="mr-1.5 h-4 w-4" />Создать карточку</Button></div></form></div></div>}
        <input ref={importInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImportFile} />
        {isImportOpen && <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#12352a]/45 p-0 sm:items-center sm:p-4"><div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-7"><div className="mb-5 flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wide text-[#2e7d52]">Импорт реестра</p><h2 className="mt-1 text-2xl font-extrabold text-[#12352a]">Загрузить хозяйства из Excel</h2><p className="mt-1 max-w-xl text-sm leading-relaxed text-[#6f7a73]">Сначала кабинет проверит все строки. В базу попадут только данные из файла без ошибок после вашего подтверждения.</p></div><Button type="button" variant="ghost" onClick={() => { setImportPreview(null); setIsImportOpen(false); }}>Закрыть</Button></div><div className="grid gap-3 rounded-2xl border border-[#dce8dc] bg-[#f5f8f4] p-4 sm:grid-cols-[1fr_auto]"><div><p className="font-bold text-[#194f38]">1. Скачайте и заполните шаблон</p><p className="mt-1 text-xs leading-relaxed text-[#66766b]">Обязательна только колонка «Название хозяйства *». Поддерживаются Excel (.xlsx, .xls) и CSV до 5 МБ.</p></div><Button type="button" variant="outline" className="border-[#2e7d52] text-[#194f38]" onClick={() => void downloadFarmImportTemplate()}><FileSpreadsheet className="mr-1.5 h-4 w-4" />Скачать шаблон</Button></div><div className="mt-4 flex flex-col gap-3 rounded-2xl border border-dashed border-[#9eb9a0] p-5 text-center"><Upload className="mx-auto h-7 w-7 text-[#2e7d52]" /><div><p className="font-bold text-[#194f38]">2. Выберите заполненный файл</p><p className="mt-1 text-xs text-[#6f7a73]">Строки не сохраняются автоматически.</p></div><Button type="button" disabled={isReadingImport} className="mx-auto bg-[#194f38] text-white hover:bg-[#12352a]" onClick={() => importInputRef.current?.click()}>{isReadingImport ? "Проверяем файл…" : "Выбрать Excel или CSV"}</Button><Input type="file" accept=".xlsx,.xls,.csv" disabled={isReadingImport} className="mx-auto max-w-sm cursor-pointer text-xs file:mr-3 file:rounded-md file:border-0 file:bg-[#e8f1e7] file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-[#194f38]" onChange={handleImportFile} /></div>{importPreview && <div className="mt-5 rounded-2xl border border-[#dce8dc]"><div className="flex flex-col gap-2 border-b border-[#e7eee5] p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold text-[#12352a]">Предпросмотр: {importPreview.fileName}</p><p className="mt-1 text-xs text-[#6f7a73]">Строк: {importPreview.rows.length} · Готово: {importableFarms.length} · Ошибок: {importErrors.length + importPreview.headerErrors.length}</p></div>{importPreview.headerErrors.length === 0 && importErrors.length === 0 && <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">Можно сохранить</span>}</div>{(importPreview.headerErrors.length > 0 || importErrors.length > 0) && <div className="m-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><div className="flex gap-2"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><div><strong>Импорт заблокирован до исправления ошибок.</strong><ul className="mt-1 list-disc space-y-1 pl-4 text-xs">{[...importPreview.headerErrors, ...importErrors].slice(0, 8).map((error) => <li key={error}>{error}</li>)}</ul>{importErrors.length + importPreview.headerErrors.length > 8 && <p className="mt-2 text-xs">Показаны первые 8 ошибок.</p>}</div></div></div>} {importPreview.headerErrors.length === 0 && <div className="max-h-52 overflow-auto p-4"><table className="w-full min-w-[420px] text-left text-xs"><thead className="text-[#527060]"><tr><th className="pb-2">Строка</th><th className="pb-2">Хозяйство</th><th className="pb-2">Площадь</th><th className="pb-2">Результат</th></tr></thead><tbody className="divide-y divide-[#edf2eb]">{importPreview.rows.slice(0, 50).map((row) => <tr key={row.rowNumber}><td className="py-2 text-[#6f7a73]">{row.rowNumber}</td><td className="py-2 font-semibold text-[#194f38]">{row.name}</td><td className="py-2">{displayNumber(row.totalArea)} га</td><td className={`py-2 font-semibold ${row.errors.length ? "text-amber-800" : "text-emerald-700"}`}>{row.errors.length ? row.errors[0] : "Готово"}</td></tr>)}</tbody></table>{importPreview.rows.length > 50 && <p className="mt-3 text-xs text-[#6f7a73]">В предпросмотре показаны первые 50 строк.</p>}</div>}</div>}<div className="mt-6 flex flex-col-reverse gap-3 border-t border-[#e7eee5] pt-5 sm:flex-row sm:items-center sm:justify-between"><Button type="button" variant="outline" onClick={() => { setImportPreview(null); importInputRef.current?.click(); }}>Выбрать другой файл</Button><Button type="button" disabled={!importPreview || importPreview.headerErrors.length > 0 || importErrors.length > 0 || importFarms.isPending} className="bg-[#194f38] text-white hover:bg-[#12352a]" onClick={() => importFarms.mutate({ farms: importableFarms })}>{importFarms.isPending ? "Сохраняем…" : `Подтвердить импорт (${importableFarms.length})`}</Button></div></div></div>}
    </div>
  );
}
