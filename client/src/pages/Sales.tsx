import { trpc } from "@/lib/trpc";
import {
  Briefcase,
  CalendarClock,
  CheckCircle2,
  Circle,
  Clock3,
  Flag,
  Plus,
  Search,
  UserRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const statusLabels = {
  todo: "К выполнению",
  in_progress: "В работе",
  done: "Готово",
  cancelled: "Отменено",
} as const;
const priorityLabels = {
  low: "Низкий",
  normal: "Обычный",
  high: "Высокий",
} as const;
const dealStageLabels = {
  new: "Новая возможность",
  contacted: "Контакт установлен",
  qualified: "Потребность подтверждена",
  proposal: "КП готовится",
  sent: "КП отправлено",
  negotiation: "Переговоры",
  confirmed: "Заказ подтверждён",
  won: "Успешно",
  lost: "Отказ",
} as const;
const dealStageTone = {
  new: "bg-[#E8E2F2] text-[#75658F]",
  contacted: "bg-[#DDEAF2] text-[#52748A]",
  qualified: "bg-[#FFF0C9] text-[#92723A]",
  proposal: "bg-[#F9DFD3] text-[#9A6653]",
  sent: "bg-[#E6E0F1] text-[#75658F]",
  negotiation: "bg-[#D9EDE8] text-[#527A70]",
  confirmed: "bg-[#DCEBDD] text-[#5B8062]",
  won: "bg-[#CFEBD9] text-[#3F7B53]",
  lost: "bg-[#F4DCD9] text-[#A35F5A]",
} as const;
type DealStage = keyof typeof dealStageLabels;
type Tab = "overview" | "clients" | "deals" | "tasks";
type TaskStatus = keyof typeof statusLabels;
type Priority = keyof typeof priorityLabels;

type FarmItem = {
  farm: {
    id: number;
    name: string;
    district: string | null;
    settlement: string | null;
    totalArea: string;
    potentialValue: string;
    nextAction: string | null;
    nextActionAt: Date | null;
  };
  owner: { displayName: string | null; name: string | null; email: string | null };
};
type DealItem = {
  deal: {
    id: number;
    farmId: number;
    title: string;
    season: string | null;
    crop: string | null;
    area: string;
    potentialValue: string;
    probability: number;
    stage: DealStage;
    nextAction: string | null;
    nextActionAt: Date | null;
    lostReason: string | null;
  };
  farm: { id: number; name: string; district: string | null; settlement: string | null };
  owner: { displayName: string | null; name: string | null; email: string | null };
};
type SalesTaskItem = {
  task: {
    id: number;
    title: string;
    description: string | null;
    dueAt: Date | null;
    priority: Priority;
    status: TaskStatus;
    dealId?: number | null;
  };
  workspace: { name: string };
  region: { name: string };
  assignee: { displayName: string | null; name: string | null; email: string | null };
};

function formatDate(value: Date | string | null | undefined) {
  return value
    ? new Date(value).toLocaleDateString("ru-RU", { day: "2-digit", month: "short" })
    : "Без срока";
}
function memberName(user: { displayName?: string | null; name?: string | null; email?: string | null }) {
  return user.displayName?.trim() || user.name?.trim() || user.email?.split("@")[0] || "Сотрудник";
}
function money(value: string | number | null | undefined) {
  const amount = Number(value ?? 0);
  return amount ? `${amount.toLocaleString("ru-RU", { maximumFractionDigits: 0 })} ₽` : "Потенциал не задан";
}

export default function Sales() {
  const { data: currentUser } = trpc.auth.me.useQuery();
  const { data, isLoading, error } = trpc.sales.overview.useQuery(undefined, {
    enabled: Boolean(currentUser),
    retry: false,
  });
  const utils = trpc.useUtils();
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<Tab>("overview");
  const [search, setSearch] = useState("");
  const [activeWorkspaceId, setActiveWorkspaceId] = useState("");
  const [draggedDealId, setDraggedDealId] = useState<number | null>(null);

  const [isTaskOpen, setIsTaskOpen] = useState(false);
  const [taskWorkspaceId, setTaskWorkspaceId] = useState("");
  const [taskAssigneeOpenId, setTaskAssigneeOpenId] = useState("");
  const [taskDealId, setTaskDealId] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskDueAt, setTaskDueAt] = useState("");
  const [taskPriority, setTaskPriority] = useState<Priority>("normal");

  const [isDealOpen, setIsDealOpen] = useState(false);
  const [dealFarmId, setDealFarmId] = useState("");
  const [dealTitle, setDealTitle] = useState("");
  const [dealCrop, setDealCrop] = useState("");
  const [dealArea, setDealArea] = useState("");
  const [dealValue, setDealValue] = useState("");
  const [dealProbability, setDealProbability] = useState("50");

  const workspaces = data?.workspaces ?? [];
  const tasks = (data?.tasks ?? []) as SalesTaskItem[];
  const farms = (data?.farms ?? []) as FarmItem[];
  const deals = (data?.deals ?? []) as DealItem[];
  const selectedWorkspaceId = activeWorkspaceId || (workspaces[0] ? String(workspaces[0].workspace.id) : "");
  const selectedWorkspace = workspaces.find((item) => String(item.workspace.id) === selectedWorkspaceId);
  const workspaceMembers = (data?.members ?? []).filter(
    (item) => item.membership.workspaceId === Number(taskWorkspaceId),
  );
  const todayKey = new Date().toLocaleDateString("ru-RU");
  const todayTasks = tasks.filter(
    (item) => item.task.dueAt && new Date(item.task.dueAt).toLocaleDateString("ru-RU") === todayKey,
  );
  const openTasks = tasks.filter((item) => item.task.status === "todo" || item.task.status === "in_progress");
  const openDeals = deals.filter((item) => !["won", "lost"].includes(item.deal.stage));
  const overdueDeals = openDeals.filter(
    (item) => item.deal.nextActionAt && new Date(item.deal.nextActionAt) < new Date(),
  );
  const filteredFarms = farms.filter((item) => {
    const haystack = `${item.farm.name} ${item.farm.district ?? ""} ${item.owner.displayName ?? item.owner.name ?? ""}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });
  const weightedPipeline = openDeals.reduce(
    (sum, item) => sum + Number(item.deal.potentialValue ?? 0) * Number(item.deal.probability ?? 0) / 100,
    0,
  );

  const updateStatus = trpc.sales.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Статус задачи обновлён");
      void utils.sales.overview.invalidate();
    },
    onError: (mutationError) => toast.error(mutationError.message || "Не удалось изменить статус"),
  });
  const createTask = trpc.sales.createTask.useMutation({
    onSuccess: () => {
      toast.success("Задача создана");
      setIsTaskOpen(false);
      setTaskTitle("");
      setTaskDescription("");
      setTaskDueAt("");
      setTaskDealId("");
      void utils.sales.overview.invalidate();
    },
    onError: (mutationError) => toast.error(mutationError.message || "Не удалось создать задачу"),
  });
  const createDeal = trpc.deals.create.useMutation({
    onSuccess: () => {
      toast.success("Сделка создана на этапе «Новая возможность»");
      setIsDealOpen(false);
      setDealTitle("");
      setDealCrop("");
      setDealArea("");
      setDealValue("");
      void utils.sales.overview.invalidate();
    },
    onError: (mutationError) => toast.error(mutationError.message || "Не удалось создать сделку"),
  });
  const updateDealStage = trpc.deals.updateStage.useMutation({
    onSuccess: () => {
      toast.success("Этап сделки обновлён");
      setDraggedDealId(null);
      void utils.sales.overview.invalidate();
    },
    onError: (mutationError) => {
      setDraggedDealId(null);
      toast.error(mutationError.message || "Не удалось изменить этап сделки");
    },
  });

  const openTaskCreate = () => {
    setTaskWorkspaceId(selectedWorkspaceId);
    setTaskAssigneeOpenId(currentUser?.openId ?? "");
    setIsTaskOpen(true);
  };
  const submitTask = (event: React.FormEvent) => {
    event.preventDefault();
    if (!taskWorkspaceId || !taskAssigneeOpenId) return toast.error("Выберите пространство и исполнителя");
    createTask.mutate({
      workspaceId: Number(taskWorkspaceId),
      assigneeOpenId: taskAssigneeOpenId,
      dealId: taskDealId ? Number(taskDealId) : null,
      title: taskTitle,
      description: taskDescription || null,
      dueAt: taskDueAt ? new Date(`${taskDueAt}T18:00:00`) : null,
      priority: taskPriority,
    });
  };
  const submitDeal = (event: React.FormEvent) => {
    event.preventDefault();
    if (!dealFarmId || !dealTitle.trim()) return toast.error("Выберите хозяйство и укажите название сделки");
    createDeal.mutate({
      farmId: Number(dealFarmId),
      title: dealTitle,
      crop: dealCrop || null,
      area: Number(dealArea || 0),
      potentialValue: Number(dealValue || 0),
      probability: Number(dealProbability || 0),
      stage: "new",
      workspaceId: selectedWorkspaceId ? Number(selectedWorkspaceId) : null,
      season: null,
      nextAction: null,
      nextActionAt: null,
      lostReason: null,
    });
  };

  if (error) {
    return (
      <section className="mx-auto max-w-5xl rounded-[2rem] bg-white p-8 text-center shadow-sm">
        <Briefcase className="mx-auto h-9 w-9 text-[#9EBAC4]" />
        <h2 className="mt-4 text-xl font-extrabold text-[#4F626A]">Раздел «Продажи» недоступен</h2>
        <p className="mt-2 text-sm text-[#829097]">Суперпользователь должен назначить вам право sales.read и добавить в рабочее пространство.</p>
      </section>
    );
  }

  return (
    <section className="sales-page mx-auto max-w-6xl text-[#53636B]">
      <header className="rounded-[1.75rem] border border-[#DCE5E7] bg-[#EAF3F5] p-5 shadow-[0_14px_35px_rgba(94,126,139,.09)] sm:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#7596A5]">CRM рабочего дня</p>
            <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-[#4B6069]">Продажи</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#71858D]">Хозяйство — постоянная карточка клиента. Сделка — конкретная коммерческая возможность. Задача — следующее действие сотрудника.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setIsDealOpen(true)} disabled={!farms.length} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#D9EDE8] px-4 text-sm font-extrabold text-[#527A70] hover:bg-[#C7E5DD] disabled:cursor-not-allowed disabled:opacity-60"><Plus className="h-4 w-4" />Новая сделка</button>
            <button type="button" onClick={openTaskCreate} disabled={!workspaces.length} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#B5D2DC] px-4 text-sm font-extrabold text-[#425B65] hover:bg-[#A5C7D2] disabled:cursor-not-allowed disabled:opacity-60"><Plus className="h-4 w-4" />Новая задача</button>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {workspaces.map((item) => <button key={item.workspace.id} type="button" onClick={() => setActiveWorkspaceId(String(item.workspace.id))} className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${selectedWorkspaceId === String(item.workspace.id) ? "bg-white text-[#58717B] shadow-sm" : "bg-white/55 text-[#78909A] hover:bg-white"}`}>{item.region.name}</button>)}
          {!workspaces.length && !isLoading && <span className="text-sm text-[#7C9097]">Рабочее пространство ещё не назначено.</span>}
        </div>
      </header>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Metric value={String(openDeals.length)} label="активных сделок" tone="bg-[#DCEBDD]" />
        <Metric value={weightedPipeline ? money(weightedPipeline) : "0 ₽"} label="взвешенный потенциал" tone="bg-[#DDEAF2]" />
        <Metric value={String(overdueDeals.length)} label="сделок требуют действия" tone="bg-[#FFF0C9]" />
        <Metric value={String(openTasks.length)} label="открытых задач" tone="bg-[#E8E2F2]" />
      </div>

      <nav className="mt-5 grid grid-cols-2 gap-1 rounded-2xl bg-[#EEF2F1] p-1 sm:grid-cols-4">
        {([["overview", "Обзор"], ["clients", "Хозяйства"], ["deals", "Сделки"], ["tasks", "Задачи"]] as const).map(([value, label]) => <button key={value} type="button" onClick={() => setTab(value)} className={`rounded-xl px-2 py-2.5 text-xs font-extrabold transition sm:text-sm ${tab === value ? "bg-white text-[#526B76] shadow-sm" : "text-[#829097] hover:text-[#5F747C]"}`}>{label}</button>)}
      </nav>

      {isLoading ? <div className="mt-5 rounded-2xl bg-white p-8 text-sm text-[#7D8E94] shadow-sm">Загружаем рабочее пространство…</div> : <>
        {tab === "overview" && <OverviewView tasks={todayTasks} openDeals={openDeals} weightedPipeline={weightedPipeline} workspaceName={selectedWorkspace?.workspace.name} onTaskStatus={(id, status) => updateStatus.mutate({ id, status })} onDeals={() => setTab("deals")} />}
        {tab === "clients" && <ClientsView farms={filteredFarms} search={search} setSearch={setSearch} onOpen={(farmId) => setLocation(`/farms?farmId=${farmId}`)} />}
        {tab === "deals" && <DealsView deals={deals} farms={farms} onCreate={() => setIsDealOpen(true)} onStageChange={(id, stage) => updateDealStage.mutate({ id, stage })} onOpenFarm={(farmId) => setLocation(`/farms?farmId=${farmId}`)} draggedDealId={draggedDealId} setDraggedDealId={setDraggedDealId} />}
        {tab === "tasks" && <TasksView tasks={tasks} onStatus={(id, status) => updateStatus.mutate({ id, status })} />}
      </>}

      {isDealOpen && <DealModal farms={farms} isPending={createDeal.isPending} dealFarmId={dealFarmId} setDealFarmId={setDealFarmId} title={dealTitle} setTitle={setDealTitle} crop={dealCrop} setCrop={setDealCrop} area={dealArea} setArea={setDealArea} value={dealValue} setValue={setDealValue} probability={dealProbability} setProbability={setDealProbability} onClose={() => setIsDealOpen(false)} onSubmit={submitDeal} />}
      {isTaskOpen && <TaskModal workspaces={workspaces} members={workspaceMembers} deals={deals} workspaceId={taskWorkspaceId} setWorkspaceId={(value) => { setTaskWorkspaceId(value); setTaskAssigneeOpenId(""); }} assigneeOpenId={taskAssigneeOpenId} setAssigneeOpenId={setTaskAssigneeOpenId} dealId={taskDealId} setDealId={setTaskDealId} title={taskTitle} setTitle={setTaskTitle} description={taskDescription} setDescription={setTaskDescription} dueAt={taskDueAt} setDueAt={setTaskDueAt} priority={taskPriority} setPriority={setTaskPriority} isPending={createTask.isPending} onClose={() => setIsTaskOpen(false)} onSubmit={submitTask} />}
    </section>
  );
}

function OverviewView({ tasks, openDeals, weightedPipeline, workspaceName, onTaskStatus, onDeals }: { tasks: SalesTaskItem[]; openDeals: DealItem[]; weightedPipeline: number; workspaceName?: string; onTaskStatus: (id: number, status: TaskStatus) => void; onDeals: () => void }) {
  return <div className="mt-5 grid gap-5 lg:grid-cols-[1.12fr_.88fr]"><article className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(85,107,114,.07)]"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-[#91A1A6]">Фокус дня</p><h3 className="mt-1 text-xl font-extrabold text-[#53666D]">Следующие действия</h3></div><span className="rounded-full bg-[#FFF0C9] px-3 py-1 text-xs font-bold text-[#92723A]">{tasks.length} на сегодня</span></div><div className="mt-4 grid gap-2">{tasks.length ? tasks.map(item => <TaskRow key={item.task.id} item={item} onStatus={(status) => onTaskStatus(item.task.id, status)} />) : <EmptyState text="На сегодня задач нет" detail="Создайте задачу и привяжите её к сделке, если действие относится к конкретной продаже." />}</div></article><aside className="rounded-2xl bg-[#F8F4EC] p-5"><p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-[#A18C6E]">Контур сделок</p><h3 className="mt-1 text-xl font-extrabold text-[#6A6256]">{workspaceName ?? "Нет пространства"}</h3><p className="mt-1 text-sm text-[#8E8475]">Воронка теперь считает коммерческие возможности, а не сами хозяйства.</p><div className="mt-5 grid grid-cols-2 gap-2"><Metric value={String(openDeals.length)} label="активных сделок" tone="bg-white" /><Metric value={weightedPipeline ? money(weightedPipeline) : "0 ₽"} label="взвешенный потенциал" tone="bg-white" /></div><button type="button" onClick={onDeals} className="mt-4 text-sm font-extrabold text-[#90764D]">Открыть воронку сделок →</button></aside></div>;
}

function DealsView({ deals, farms, onCreate, onStageChange, onOpenFarm, draggedDealId, setDraggedDealId }: { deals: DealItem[]; farms: FarmItem[]; onCreate: () => void; onStageChange: (id: number, stage: DealStage) => void; onOpenFarm: (farmId: number) => void; draggedDealId: number | null; setDraggedDealId: (id: number | null) => void }) {
  const columns = Object.keys(dealStageLabels) as DealStage[];
  return <div className="mt-5 rounded-2xl border border-[#DCE5E7] bg-[#F5F8F7] p-3 shadow-[0_10px_30px_rgba(85,107,114,.06)]"><div className="mb-4 flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-[#91A1A6]">CRM сделок</p><h3 className="mt-1 text-xl font-extrabold text-[#53666D]">Коммерческие возможности</h3><p className="mt-1 max-w-2xl text-xs leading-5 text-[#829097]">Хозяйство — постоянный клиент. Сделка — конкретная продажа по культуре, площади и сезону.</p></div><button type="button" onClick={onCreate} disabled={!farms.length} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#D9EDE8] px-4 text-xs font-extrabold text-[#527A70] hover:bg-[#C7E5DD] disabled:opacity-50"><Plus className="h-4 w-4" />Новая сделка</button></div><div className="grid gap-3 overflow-x-auto pb-2 md:grid-flow-col md:auto-cols-[minmax(245px,1fr)]">{columns.map(stage => { const items = deals.filter(item => item.deal.stage === stage); const total = items.reduce((sum, item) => sum + Number(item.deal.potentialValue ?? 0), 0); const weighted = items.reduce((sum, item) => sum + Number(item.deal.potentialValue ?? 0) * Number(item.deal.probability ?? 0) / 100, 0); return <article key={stage} onDragOver={event => event.preventDefault()} onDrop={() => draggedDealId && onStageChange(draggedDealId, stage)} className={`min-w-[245px] rounded-2xl border border-[#E4ECE9] bg-white/90 p-3 transition ${draggedDealId ? "ring-1 ring-[#B5D2DC]" : ""}`}><div className="border-b border-[#EDF2F0] pb-3"><div className="flex items-start justify-between gap-2"><h4 className="text-sm font-extrabold text-[#61747A]">{dealStageLabels[stage]}</h4><span className={`rounded-full px-2 py-1 text-xs font-bold ${dealStageTone[stage]}`}>{items.length}</span></div><div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-semibold text-[#97A4A8]"><span>{money(total)}</span><span>Взвешенно {money(weighted)}</span></div></div><div className="mt-3 grid gap-2">{items.length ? items.map(item => <DealCard key={item.deal.id} item={item} onOpenFarm={onOpenFarm} onDragStart={() => setDraggedDealId(item.deal.id)} onDragEnd={() => setDraggedDealId(null)} />) : <p className="rounded-xl bg-[#F8FAF9] p-4 text-center text-xs text-[#A0ACAF]">Перетащите сделку сюда</p>}</div></article>; })}</div></div>;
}

function DealCard({ item, onOpenFarm, onDragStart, onDragEnd }: { item: DealItem; onOpenFarm: (farmId: number) => void; onDragStart: () => void; onDragEnd: () => void }) { const overdue = item.deal.nextActionAt && new Date(item.deal.nextActionAt) < new Date(); return <article draggable onDragStart={onDragStart} onDragEnd={onDragEnd} className="cursor-grab rounded-xl border border-[#E7EEEC] bg-white p-3 shadow-[0_4px_12px_rgba(85,107,114,.05)] active:cursor-grabbing"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><strong className="block truncate text-sm font-extrabold text-[#53666D]">{item.deal.title}</strong><button type="button" onClick={() => onOpenFarm(item.farm.id)} className="mt-1 block max-w-full truncate text-left text-[11px] font-bold text-[#6D8D77] hover:underline">{item.farm.name}</button></div><span className="shrink-0 rounded-full bg-[#EEF2F1] px-2 py-1 text-[10px] font-bold text-[#71838A]">{item.deal.probability}%</span></div><div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold text-[#829097]"><span>{money(item.deal.potentialValue)}</span>{item.deal.crop && <span>· {item.deal.crop}</span>}{Number(item.deal.area) > 0 && <span>· {Number(item.deal.area).toLocaleString("ru-RU")} га</span>}</div><p className={`mt-2 truncate text-[11px] ${overdue ? "font-bold text-[#B46D58]" : "text-[#91A0A5]"}`}>{item.deal.nextAction || "Следующее действие не задано"}{item.deal.nextActionAt ? ` · ${formatDate(item.deal.nextActionAt)}` : ""}</p><div className="mt-3 flex items-center justify-between"><span className="text-[10px] font-semibold text-[#A0ACAF]">{item.deal.season || "Сезон не задан"}</span><button type="button" onClick={() => onOpenFarm(item.farm.id)} className="text-[11px] font-extrabold text-[#52748A]">Хозяйство →</button></div></article>; }

function ClientsView({ farms, search, setSearch, onOpen }: { farms: FarmItem[]; search: string; setSearch: (value: string) => void; onOpen: (farmId: number) => void }) { return <div className="mt-5 rounded-2xl bg-white p-5 shadow-sm"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-[#91A1A6]">CRM-реестр</p><h3 className="mt-1 text-xl font-extrabold text-[#53666D]">Хозяйства</h3><p className="mt-1 text-xs text-[#829097]">Постоянные данные клиента не смешиваются с отдельными сделками.</p></div><label className="flex h-10 items-center gap-2 rounded-xl border border-[#DCE5E7] px-3 text-sm text-[#829097]"><Search className="h-4 w-4" /><input value={search} onChange={event => setSearch(event.target.value)} className="w-full min-w-0 bg-transparent outline-none" placeholder="Поиск хозяйства" /></label></div><div className="mt-4 grid gap-2">{farms.length ? farms.map(item => <article key={item.farm.id} className="rounded-xl border border-[#E7EEEC] bg-[#FCFDFC] p-3"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><strong className="block truncate text-sm font-extrabold text-[#5A6C72]">{item.farm.name}</strong><p className="mt-1 text-[11px] text-[#91A0A5]">{[item.farm.district, item.farm.settlement].filter(Boolean).join(" · ") || "Локация не указана"} · {Number(item.farm.totalArea).toLocaleString("ru-RU")} га</p></div><span className="shrink-0 rounded-full bg-[#DCEBDD] px-2 py-1 text-[10px] font-bold text-[#5B8062]">Хозяйство</span></div><div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold text-[#829097]"><span>{money(item.farm.potentialValue)}</span><span>·</span><span>{item.farm.nextAction || "Следующее действие не задано"}</span>{item.farm.nextActionAt && <span className="inline-flex items-center gap-1"><Clock3 className="h-3 w-3" />{formatDate(item.farm.nextActionAt)}</span>}</div><button type="button" onClick={() => onOpen(item.farm.id)} className="mt-2 text-[11px] font-extrabold text-[#52748A]">Открыть карточку →</button></article>) : <EmptyState text="Хозяйства не найдены" detail="Измените запрос или проверьте область доступа." />}</div></div>; }

function TasksView({ tasks, onStatus }: { tasks: SalesTaskItem[]; onStatus: (id: number, status: TaskStatus) => void }) { return <div className="mt-5 rounded-2xl bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-[#91A1A6]">Рабочий список</p><h3 className="mt-1 text-xl font-extrabold text-[#53666D]">Все задачи</h3></div><span className="rounded-full bg-[#E8E2F2] px-3 py-1 text-xs font-bold text-[#75658F]">{tasks.length}</span></div><div className="mt-4 grid gap-2">{tasks.length ? tasks.map(item => <TaskRow key={item.task.id} item={item} onStatus={status => onStatus(item.task.id, status)} />) : <EmptyState text="Задач пока нет" detail="Создайте задачу и при необходимости привяжите её к сделке." />}</div></div>; }

function TaskRow({ item, onStatus }: { item: SalesTaskItem; onStatus: (status: TaskStatus) => void }) { return <div className="flex items-start gap-3 rounded-xl border border-[#E7EEEC] bg-white p-3"><button type="button" onClick={() => onStatus(item.task.status === "done" ? "todo" : "done")} className="mt-0.5 text-[#9BB9A1]" aria-label={item.task.status === "done" ? "Вернуть задачу" : "Завершить задачу"}>{item.task.status === "done" ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}</button><div className="min-w-0 flex-1"><strong className={`block text-sm ${item.task.status === "done" ? "text-[#A0ACAF] line-through" : "text-[#5A6C72]"}`}>{item.task.title}</strong><p className="mt-1 text-xs text-[#91A0A5]">{item.workspace.name} · {item.region.name}</p><div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold text-[#87959A]"><span className="inline-flex items-center gap-1"><CalendarClock className="h-3 w-3" />{formatDate(item.task.dueAt)}</span><span className="inline-flex items-center gap-1"><Flag className="h-3 w-3" />{priorityLabels[item.task.priority]}</span><span className="inline-flex items-center gap-1"><UserRound className="h-3 w-3" />{memberName(item.assignee)}</span></div></div><span className="hidden rounded-full bg-[#F1F5F3] px-2 py-1 text-[10px] font-bold text-[#849296] sm:inline-flex">{statusLabels[item.task.status]}</span></div>; }

function DealModal({ farms, isPending, dealFarmId, setDealFarmId, title, setTitle, crop, setCrop, area, setArea, value, setValue, probability, setProbability, onClose, onSubmit }: { farms: FarmItem[]; isPending: boolean; dealFarmId: string; setDealFarmId: (value: string) => void; title: string; setTitle: (value: string) => void; crop: string; setCrop: (value: string) => void; area: string; setArea: (value: string) => void; value: string; setValue: (value: string) => void; probability: string; setProbability: (value: string) => void; onClose: () => void; onSubmit: (event: React.FormEvent) => void }) { return <div className="fixed inset-0 z-[90] grid place-items-center bg-[#71858D]/30 p-4" onMouseDown={onClose}><form onSubmit={onSubmit} onMouseDown={event => event.stopPropagation()} className="w-full max-w-lg rounded-[1.75rem] bg-white p-6 shadow-[0_24px_70px_rgba(79,101,109,.22)]"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-[#7596A5]">CRM сделки</p><h3 className="mt-1 text-xl font-extrabold text-[#53666D]">Новая сделка</h3></div><button type="button" onClick={onClose} className="text-2xl leading-none text-[#829097]" aria-label="Закрыть">×</button></div><div className="mt-5 grid gap-3"><label><span className="mb-1.5 block text-xs font-bold text-[#71838A]">Хозяйство</span><select required value={dealFarmId} onChange={event => setDealFarmId(event.target.value)} className="h-10 w-full rounded-xl border border-[#DCE5E7] px-3 text-sm"><option value="" disabled>Выберите хозяйство</option>{farms.map(item => <option key={item.farm.id} value={item.farm.id}>{item.farm.name}</option>)}</select></label><label><span className="mb-1.5 block text-xs font-bold text-[#71838A]">Название возможности</span><input required value={title} onChange={event => setTitle(event.target.value)} className="h-10 w-full rounded-xl border border-[#DCE5E7] px-3 text-sm" placeholder="Защита зерновых, сезон 2027" /></label><div className="grid gap-3 sm:grid-cols-2"><label><span className="mb-1.5 block text-xs font-bold text-[#71838A]">Культура</span><input value={crop} onChange={event => setCrop(event.target.value)} className="h-10 w-full rounded-xl border border-[#DCE5E7] px-3 text-sm" placeholder="Пшеница" /></label><label><span className="mb-1.5 block text-xs font-bold text-[#71838A]">Площадь, га</span><input type="number" min="0" value={area} onChange={event => setArea(event.target.value)} className="h-10 w-full rounded-xl border border-[#DCE5E7] px-3 text-sm" /></label><label><span className="mb-1.5 block text-xs font-bold text-[#71838A]">Потенциал, ₽</span><input type="number" min="0" value={value} onChange={event => setValue(event.target.value)} className="h-10 w-full rounded-xl border border-[#DCE5E7] px-3 text-sm" /></label><label><span className="mb-1.5 block text-xs font-bold text-[#71838A]">Вероятность, %</span><input type="number" min="0" max="100" value={probability} onChange={event => setProbability(event.target.value)} className="h-10 w-full rounded-xl border border-[#DCE5E7] px-3 text-sm" /></label></div></div><button type="submit" disabled={isPending} className="mt-5 h-11 w-full rounded-xl bg-[#D9EDE8] text-sm font-extrabold text-[#527A70] disabled:opacity-60">{isPending ? "Создаём…" : "Создать сделку"}</button></form></div>; }

function TaskModal({ workspaces, members, deals, workspaceId, setWorkspaceId, assigneeOpenId, setAssigneeOpenId, dealId, setDealId, title, setTitle, description, setDescription, dueAt, setDueAt, priority, setPriority, isPending, onClose, onSubmit }: { workspaces: Array<{ workspace: { id: number; name: string } }>; members: Array<{ user: { openId: string; displayName: string | null; name: string | null; email: string | null }; membership: { membershipRole: string } }>; deals: DealItem[]; workspaceId: string; setWorkspaceId: (value: string) => void; assigneeOpenId: string; setAssigneeOpenId: (value: string) => void; dealId: string; setDealId: (value: string) => void; title: string; setTitle: (value: string) => void; description: string; setDescription: (value: string) => void; dueAt: string; setDueAt: (value: string) => void; priority: Priority; setPriority: (value: Priority) => void; isPending: boolean; onClose: () => void; onSubmit: (event: React.FormEvent) => void }) { return <div className="fixed inset-0 z-[90] grid place-items-center bg-[#71858D]/30 p-4" onMouseDown={onClose}><form onSubmit={onSubmit} onMouseDown={event => event.stopPropagation()} className="w-full max-w-lg rounded-[1.75rem] bg-white p-6 shadow-[0_24px_70px_rgba(79,101,109,.22)]"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-[#7596A5]">CRM рабочего дня</p><h3 className="mt-1 text-xl font-extrabold text-[#53666D]">Новая задача</h3></div><button type="button" onClick={onClose} className="text-2xl leading-none text-[#829097]" aria-label="Закрыть">×</button></div><div className="mt-5 grid gap-3"><label><span className="mb-1.5 block text-xs font-bold text-[#71838A]">Пространство</span><select required value={workspaceId} onChange={event => setWorkspaceId(event.target.value)} className="h-10 w-full rounded-xl border border-[#DCE5E7] px-3 text-sm"><option value="" disabled>Выберите пространство</option>{workspaces.map(item => <option key={item.workspace.id} value={item.workspace.id}>{item.workspace.name}</option>)}</select></label><label><span className="mb-1.5 block text-xs font-bold text-[#71838A]">Исполнитель</span><select required value={assigneeOpenId} onChange={event => setAssigneeOpenId(event.target.value)} className="h-10 w-full rounded-xl border border-[#DCE5E7] px-3 text-sm"><option value="" disabled>Выберите участника</option>{members.map(item => <option key={item.user.openId} value={item.user.openId}>{memberName(item.user)} · {item.membership.membershipRole}</option>)}</select></label><label><span className="mb-1.5 block text-xs font-bold text-[#71838A]">Сделка</span><select value={dealId} onChange={event => setDealId(event.target.value)} className="h-10 w-full rounded-xl border border-[#DCE5E7] px-3 text-sm"><option value="">Без привязки</option>{deals.map(item => <option key={item.deal.id} value={item.deal.id}>{item.deal.title} · {item.farm.name}</option>)}</select></label><label><span className="mb-1.5 block text-xs font-bold text-[#71838A]">Задача</span><input required value={title} onChange={event => setTitle(event.target.value)} className="h-10 w-full rounded-xl border border-[#DCE5E7] px-3 text-sm" placeholder="Следующее действие" /></label><label><span className="mb-1.5 block text-xs font-bold text-[#71838A]">Описание</span><textarea value={description} onChange={event => setDescription(event.target.value)} rows={3} className="w-full rounded-xl border border-[#DCE5E7] px-3 py-2 text-sm" placeholder="Контекст задачи и ожидаемый результат" /></label><div className="grid gap-3 sm:grid-cols-2"><label><span className="mb-1.5 block text-xs font-bold text-[#71838A]">Срок</span><input type="date" value={dueAt} onChange={event => setDueAt(event.target.value)} className="h-10 w-full rounded-xl border border-[#DCE5E7] px-3 text-sm" /></label><label><span className="mb-1.5 block text-xs font-bold text-[#71838A]">Приоритет</span><select value={priority} onChange={event => setPriority(event.target.value as Priority)} className="h-10 w-full rounded-xl border border-[#DCE5E7] px-3 text-sm">{Object.entries(priorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div></div><button type="submit" disabled={isPending} className="mt-5 h-11 w-full rounded-xl bg-[#B5D2DC] text-sm font-extrabold text-[#425B65] disabled:opacity-60">{isPending ? "Создаём…" : "Создать задачу"}</button></form></div>; }

function Metric({ value, label, tone }: { value: string; label: string; tone: string }) { return <div className={`min-w-0 rounded-2xl ${tone} p-4`}><strong className="block truncate text-xl font-extrabold text-[#52656C] sm:text-2xl">{value}</strong><span className="mt-1 block text-xs font-semibold text-[#71838A]">{label}</span></div>; }
function EmptyState({ text, detail }: { text: string; detail: string }) { return <div className="rounded-xl bg-[#F8FAF9] p-5 text-center"><Circle className="mx-auto h-6 w-6 text-[#B8C8C7]" /><p className="mt-2 text-sm font-bold text-[#64767C]">{text}</p><p className="mt-1 text-xs leading-5 text-[#8C9A9E]">{detail}</p></div>; }
