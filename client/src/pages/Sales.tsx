import { trpc } from "@/lib/trpc";
import { Briefcase, CalendarClock, CheckCircle2, Circle, Clock3, Flag, ListTodo, Plus, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const statusLabels = { todo: "К выполнению", in_progress: "В работе", done: "Готово", cancelled: "Отменено" } as const;
const priorityLabels = { low: "Низкий", normal: "Обычный", high: "Высокий" } as const;

type Tab = "today" | "pipeline" | "tasks";

function formatDate(value: Date | string | null | undefined) {
  return value ? new Date(value).toLocaleDateString("ru-RU", { day: "2-digit", month: "short" }) : "Без срока";
}

function memberName(user: { displayName?: string | null; name?: string | null; email?: string | null }) {
  return user.displayName?.trim() || user.name?.trim() || user.email?.split("@")[0] || "Сотрудник";
}

export default function Sales() {
  const { data: currentUser } = trpc.auth.me.useQuery();
  const { data, isLoading, error } = trpc.sales.overview.useQuery(undefined, { enabled: Boolean(currentUser), retry: false });
  const utils = trpc.useUtils();
  const [tab, setTab] = useState<Tab>("today");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [workspaceId, setWorkspaceId] = useState("");
  const [assigneeOpenId, setAssigneeOpenId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [priority, setPriority] = useState<"low" | "normal" | "high">("normal");
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>("");

  const workspaces = data?.workspaces ?? [];
  const tasks = data?.tasks ?? [];
  const selectedWorkspaceId = activeWorkspaceId || (workspaces[0] ? String(workspaces[0].workspace.id) : "");
  const selectedWorkspace = workspaces.find((item) => String(item.workspace.id) === selectedWorkspaceId);
  const workspaceMembers = (data?.members ?? []).filter((item) => item.membership.workspaceId === Number(workspaceId));
  const todayKey = new Date().toLocaleDateString("ru-RU");
  const todayTasks = tasks.filter((item) => item.task.dueAt && new Date(item.task.dueAt).toLocaleDateString("ru-RU") === todayKey);
  const openTasks = tasks.filter((item) => item.task.status === "todo" || item.task.status === "in_progress");
  const pipeline = useMemo(() => (['todo', 'in_progress', 'done', 'cancelled'] as const).map((status) => ({ status, items: tasks.filter((item) => item.task.status === status) })), [tasks]);

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
      setIsCreateOpen(false);
      setTitle("");
      setDescription("");
      setDueAt("");
      void utils.sales.overview.invalidate();
    },
    onError: (mutationError) => toast.error(mutationError.message || "Не удалось создать задачу"),
  });

  const openCreate = () => {
    setWorkspaceId(selectedWorkspaceId);
    setAssigneeOpenId(currentUser?.openId ?? "");
    setIsCreateOpen(true);
  };

  const submitTask = (event: React.FormEvent) => {
    event.preventDefault();
    if (!workspaceId || !assigneeOpenId) return toast.error("Выберите пространство и исполнителя");
    createTask.mutate({ workspaceId: Number(workspaceId), assigneeOpenId, title, description: description || null, dueAt: dueAt ? new Date(`${dueAt}T18:00:00`) : null, priority });
  };

  if (error) return <section className="mx-auto max-w-5xl rounded-[2rem] bg-white p-8 text-center shadow-sm"><Briefcase className="mx-auto h-9 w-9 text-[#9fce35]" /><h2 className="mt-4 text-xl font-extrabold text-[#26343a]">Раздел «Продажи» недоступен</h2><p className="mt-2 text-sm text-[#68777a]">Суперпользователь должен назначить вам право sales.read и добавить в рабочее пространство.</p></section>;

  return <section className="sales-page mx-auto max-w-6xl">
    <div className="rounded-[2rem] bg-[#26343a] p-6 text-white shadow-[0_20px_50px_rgba(38,52,58,0.2)] sm:p-8"><div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#b9dc55]">Sales workspace</p><h2 className="mt-2 text-3xl font-extrabold tracking-tight">Продажи</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">Рабочие пространства регионов, задачи команды и контроль следующего действия по хозяйствам.</p></div><button type="button" onClick={openCreate} disabled={!workspaces.length} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#b4d83e] px-4 text-sm font-extrabold text-[#26343a] transition hover:bg-[#c5e65d] disabled:cursor-not-allowed disabled:opacity-100"><Plus className="h-4 w-4" />Новая задача</button></div><div className="mt-6 flex flex-wrap gap-2">{workspaces.map((item) => <button key={item.workspace.id} type="button" onClick={() => setActiveWorkspaceId(String(item.workspace.id))} className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${selectedWorkspaceId === String(item.workspace.id) ? "bg-white text-[#26343a]" : "bg-white/10 text-white/75 hover:bg-white/20"}`}>{item.region.name}</button>)}{!workspaces.length && !isLoading && <span className="text-sm text-white/70">Рабочее пространство ещё не назначено.</span>}</div></div>

    <div className="mt-5 grid grid-cols-3 gap-1 rounded-2xl bg-[#e9efea] p-1"><button type="button" onClick={() => setTab("today")} className={`rounded-xl px-2 py-2.5 text-xs font-extrabold sm:text-sm ${tab === "today" ? "bg-white text-[#26343a] shadow-sm" : "text-[#718083]"}`}>Сегодня</button><button type="button" onClick={() => setTab("pipeline")} className={`rounded-xl px-2 py-2.5 text-xs font-extrabold sm:text-sm ${tab === "pipeline" ? "bg-white text-[#26343a] shadow-sm" : "text-[#718083]"}`}>Воронка</button><button type="button" onClick={() => setTab("tasks")} className={`rounded-xl px-2 py-2.5 text-xs font-extrabold sm:text-sm ${tab === "tasks" ? "bg-white text-[#26343a] shadow-sm" : "text-[#718083]"}`}>Задачи</button></div>

    {isLoading ? <div className="mt-5 rounded-2xl bg-white p-8 text-sm text-[#6b7a7d] shadow-sm">Загружаем рабочее пространство…</div> : tab === "today" ? <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]"><article className="rounded-2xl bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#829095]">Фокус дня</p><h3 className="mt-1 text-xl font-extrabold text-[#26343a]">Следующие действия</h3></div><span className="rounded-full bg-[#eef7d5] px-3 py-1 text-xs font-bold text-[#58751d]">{todayTasks.length} на сегодня</span></div><div className="mt-4 grid gap-2">{todayTasks.length ? todayTasks.map((item) => <TaskRow key={item.task.id} item={item} onStatus={(status) => updateStatus.mutate({ id: item.task.id, status })} />) : <EmptyState text="На сегодня задач нет" detail="Создайте задачу, когда договоритесь о следующем действии с клиентом." />}</div></article><aside className="rounded-2xl bg-[#f1f5ee] p-5"><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#829095]">Контур</p><h3 className="mt-1 text-xl font-extrabold text-[#26343a]">{selectedWorkspace?.workspace.name ?? "Нет пространства"}</h3><p className="mt-1 text-sm text-[#6c7b7e]">{selectedWorkspace?.region.name ?? "Назначьте пользователя в региональном пространстве"}</p><div className="mt-5 grid grid-cols-2 gap-2"><Metric value={String(openTasks.length)} label="открытых задач" /><Metric value={String(tasks.filter((item) => item.task.status === "done").length)} label="завершено" /></div><button type="button" onClick={() => setTab("tasks")} className="mt-4 inline-flex items-center gap-2 text-sm font-extrabold text-[#5b7e1d]">Открыть список задач <span aria-hidden="true">→</span></button></aside></div> : tab === "pipeline" ? <div className="mt-5 grid gap-3 overflow-x-auto pb-2 md:grid-cols-4">{pipeline.map((column) => <article key={column.status} className="min-w-[245px] rounded-2xl bg-[#f1f5ee] p-4"><div className="flex items-center justify-between"><h3 className="font-extrabold text-[#26343a]">{statusLabels[column.status]}</h3><span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-[#68777a]">{column.items.length}</span></div><div className="mt-3 grid gap-2">{column.items.map((item) => <TaskCard key={item.task.id} item={item} onStatus={(status) => updateStatus.mutate({ id: item.task.id, status })} />)}</div></article>)}</div> : <div className="mt-5 rounded-2xl bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#829095]">Рабочий список</p><h3 className="mt-1 text-xl font-extrabold text-[#26343a]">Все задачи</h3></div><span className="rounded-full bg-[#eef7d5] px-3 py-1 text-xs font-bold text-[#58751d]">{tasks.length}</span></div><div className="mt-4 grid gap-2">{tasks.length ? tasks.map((item) => <TaskRow key={item.task.id} item={item} onStatus={(status) => updateStatus.mutate({ id: item.task.id, status })} />) : <EmptyState text="Задач пока нет" detail="Создайте первую задачу для себя или доступного подчинённого." />}</div></div>}

    {isCreateOpen && <div className="fixed inset-0 z-[90] grid place-items-center bg-[#26343a]/45 p-4" onMouseDown={() => setIsCreateOpen(false)}><form onSubmit={submitTask} onMouseDown={(event) => event.stopPropagation()} className="w-full max-w-lg rounded-[1.75rem] bg-white p-6 shadow-[0_24px_70px_rgba(38,52,58,0.3)]"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#89a831]">Sales workspace</p><h3 className="mt-1 text-xl font-extrabold text-[#26343a]">Новая задача</h3></div><button type="button" onClick={() => setIsCreateOpen(false)} className="text-2xl leading-none text-[#829095]" aria-label="Закрыть">×</button></div><div className="mt-5 grid gap-3"><label><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#68777a]">Пространство</span><select required value={workspaceId} onChange={(event) => { setWorkspaceId(event.target.value); setAssigneeOpenId(""); }} className="h-10 w-full rounded-xl border border-[#d7e0da] px-3 text-sm text-[#26343a]"><option value="" disabled>Выберите пространство</option>{workspaces.map((item) => <option key={item.workspace.id} value={item.workspace.id}>{item.workspace.name}</option>)}</select></label><label><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#68777a]">Исполнитель</span><select required value={assigneeOpenId} onChange={(event) => setAssigneeOpenId(event.target.value)} className="h-10 w-full rounded-xl border border-[#d7e0da] px-3 text-sm text-[#26343a]"><option value="" disabled>Выберите участника</option>{workspaceMembers.map((item) => <option key={item.user.openId} value={item.user.openId}>{memberName(item.user)} · {item.membership.membershipRole === "manager" ? "менеджер" : "руководитель"}</option>)}</select><p className="mt-1 text-xs text-[#7b898b]">Постановка задач другим участникам будет доступна после назначения соответствующего права.</p></label><label><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#68777a]">Задача</span><input required value={title} onChange={(event) => setTitle(event.target.value)} className="h-10 w-full rounded-xl border border-[#d7e0da] px-3 text-sm text-[#26343a]" placeholder="Следующее действие" /></label><label><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#68777a]">Описание</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} className="w-full rounded-xl border border-[#d7e0da] px-3 py-2 text-sm text-[#26343a]" placeholder="Контекст задачи, без лишних персональных данных" /></label><div className="grid gap-3 sm:grid-cols-2"><label><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#68777a]">Срок</span><input type="date" value={dueAt} onChange={(event) => setDueAt(event.target.value)} className="h-10 w-full rounded-xl border border-[#d7e0da] px-3 text-sm text-[#26343a]" /></label><label><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#68777a]">Приоритет</span><select value={priority} onChange={(event) => setPriority(event.target.value as "low" | "normal" | "high")} className="h-10 w-full rounded-xl border border-[#d7e0da] px-3 text-sm text-[#26343a]">{Object.entries(priorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div></div><button type="submit" disabled={createTask.isPending} className="mt-5 h-11 w-full rounded-xl bg-[#26343a] text-sm font-extrabold text-white hover:bg-[#17252b] disabled:opacity-60">{createTask.isPending ? "Создаём…" : "Создать задачу"}</button></form></div>}
  </section>;
}

function Metric({ value, label }: { value: string; label: string }) { return <div className="rounded-xl bg-white p-3"><strong className="block text-2xl text-[#26343a]">{value}</strong><span className="mt-1 block text-xs text-[#758387]">{label}</span></div>; }

function EmptyState({ text, detail }: { text: string; detail: string }) { return <div className="rounded-xl bg-[#f7f9f6] p-5 text-center"><Circle className="mx-auto h-6 w-6 text-[#b8c4bd]" /><p className="mt-2 text-sm font-bold text-[#4d5e62]">{text}</p><p className="mt-1 text-xs leading-5 text-[#7a898b]">{detail}</p></div>; }

type SalesTaskItem = { task: { id: number; title: string; description: string | null; dueAt: Date | null; priority: "low" | "normal" | "high"; status: "todo" | "in_progress" | "done" | "cancelled" }; workspace: { name: string }; region: { name: string }; assignee: { displayName: string | null; name: string | null; email: string | null } };

function TaskRow({ item, onStatus }: { item: SalesTaskItem; onStatus: (status: "todo" | "in_progress" | "done" | "cancelled") => void }) { return <div className="flex items-start gap-3 rounded-xl border border-[#e3eae4] bg-white p-3"><button type="button" onClick={() => onStatus(item.task.status === "done" ? "todo" : "done")} className="mt-0.5 text-[#90af39]" aria-label={item.task.status === "done" ? "Вернуть задачу" : "Завершить задачу"}>{item.task.status === "done" ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}</button><div className="min-w-0 flex-1"><strong className={`block text-sm ${item.task.status === "done" ? "text-[#899497] line-through" : "text-[#26343a]"}`}>{item.task.title}</strong><p className="mt-1 text-xs text-[#748286]">{item.workspace.name} · {item.region.name}</p><div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold text-[#758387]"><span className="inline-flex items-center gap-1"><CalendarClock className="h-3 w-3" />{formatDate(item.task.dueAt)}</span><span className="inline-flex items-center gap-1"><Flag className="h-3 w-3" />{priorityLabels[item.task.priority]}</span><span className="inline-flex items-center gap-1"><UserRound className="h-3 w-3" />{memberName(item.assignee)}</span></div></div><span className="hidden rounded-full bg-[#f1f5ee] px-2 py-1 text-[10px] font-bold text-[#647274] sm:inline-flex">{statusLabels[item.task.status]}</span></div>; }

function TaskCard({ item, onStatus }: { item: SalesTaskItem; onStatus: (status: "todo" | "in_progress" | "done" | "cancelled") => void }) { return <div className="rounded-xl bg-white p-3 shadow-sm"><p className="text-sm font-extrabold text-[#26343a]">{item.task.title}</p><p className="mt-2 text-xs text-[#78868a]">{formatDate(item.task.dueAt)} · {memberName(item.assignee)}</p><button type="button" onClick={() => onStatus(item.task.status === "done" ? "todo" : "done")} className="mt-3 text-xs font-extrabold text-[#5d7f1b]">{item.task.status === "done" ? "Вернуть" : "Отметить готовой"}</button></div>; }
