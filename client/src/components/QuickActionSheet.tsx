import { FormEvent, useEffect, useMemo, useState } from "react";
import { CalendarCheck2, Loader2, Phone, UserPlus, X } from "lucide-react";
import { trpc } from "@/lib/trpc";

type QuickAction = "client" | "meeting" | "call";

type Props = {
  action: QuickAction | null;
  onClose: () => void;
};

export const quickActionTitles: Record<QuickAction, string> = {
  client: "Новый клиент",
  meeting: "Новая встреча",
  call: "Новый звонок",
};

export default function QuickActionSheet({ action, onClose }: Props) {
  const titles = quickActionTitles;
  const open = Boolean(action);
  const [name, setName] = useState("");
  const [district, setDistrict] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState("");
  const [crops, setCrops] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "normal" | "high">("normal");

  const utils = trpc.useUtils();
  const { data: me } = trpc.auth.me.useQuery(undefined, { enabled: open });
  const taskData = trpc.sales.overview.useQuery(undefined, {
    enabled: open && (action === "meeting" || action === "call"),
    retry: false,
  });
  const createFarm = trpc.farms.create.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.farms.list.invalidate(), utils.dashboard.overview.invalidate()]);
      onClose();
    },
  });
  const createTask = trpc.sales.createTask.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.sales.overview.invalidate(), utils.dashboard.overview.invalidate()]);
      onClose();
    },
  });

  const workspace = taskData.data?.workspaces?.[0]?.workspace;
  const isReadyForTask = Boolean(workspace?.id && me?.openId);
  const icon = useMemo(() => {
    if (action === "client") return <UserPlus aria-hidden="true" />;
    if (action === "meeting") return <CalendarCheck2 aria-hidden="true" />;
    return <Phone aria-hidden="true" />;
  }, [action]);

  useEffect(() => {
    if (!open) return;
    setName("");
    setDistrict("");
    setContactName("");
    setPhone("");
    setArea("");
    setCrops("");
    setDate("");
    setDescription("");
    setPriority("normal");
  }, [action, open]);

  if (!action) return null;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (action === "client") {
      createFarm.mutate({
        name,
        district: district || null,
        settlement: null,
        contactName: contactName || null,
        contactRole: null,
        phone: phone || null,
        email: null,
        totalArea: area ? Number(area) : 0,
        crops: crops || null,
        technology: null,
        salesStage: "lead",
        potentialValue: 0,
        nextAction: null,
        nextActionAt: null,
        notes: null,
      });
      return;
    }
    if (!workspace?.id || !me?.openId) return;
    createTask.mutate({
      workspaceId: workspace.id,
      assigneeOpenId: me.openId,
      title: action === "meeting" ? "Встреча с клиентом" : "Звонок клиенту",
      description: description || null,
      dueAt: date ? new Date(`${date}T12:00:00`) : null,
      priority,
    });
  };

  const pending = createFarm.isPending || createTask.isPending;
  const error = createFarm.error?.message || createTask.error?.message;
  return (
    <div className="quick-action-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="quick-action-sheet" role="dialog" aria-modal="true" aria-labelledby="quick-action-title">
        <div className="quick-action-grabber" aria-hidden="true" />
        <header className="quick-action-header">
          <div className="quick-action-title-wrap"><span className="quick-action-icon">{icon}</span><div><p className="quick-action-eyebrow">Быстрое действие</p><h2 id="quick-action-title">{titles[action]}</h2></div></div>
          <button type="button" className="quick-action-close" onClick={onClose} aria-label="Закрыть форму"><X aria-hidden="true" /></button>
        </header>
        <form onSubmit={submit} className="quick-action-form">
          {action === "client" ? <>
            <label>Название хозяйства<input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Например, ООО «Агро»" /></label>
            <div className="quick-action-grid"><label>Район<input value={district} onChange={(event) => setDistrict(event.target.value)} placeholder="Район" /></label><label>Площадь, га<input inputMode="decimal" type="number" min="0" value={area} onChange={(event) => setArea(event.target.value)} placeholder="0" /></label></div>
            <label>Контактное лицо<input value={contactName} onChange={(event) => setContactName(event.target.value)} placeholder="Имя и фамилия" /></label>
            <div className="quick-action-grid"><label>Телефон<input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+7" /></label><label>Культуры<input value={crops} onChange={(event) => setCrops(event.target.value)} placeholder="Пшеница, подсолнечник" /></label></div>
          </> : <>
            <label>Тема<input required value={description} onChange={(event) => setDescription(event.target.value)} placeholder={action === "meeting" ? "Обсудить потребность хозяйства" : "Уточнить потребность и следующий шаг"} /></label>
            <div className="quick-action-grid"><label>Дата<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label><label>Приоритет<select value={priority} onChange={(event) => setPriority(event.target.value as "low" | "normal" | "high")}><option value="low">Низкий</option><option value="normal">Обычный</option><option value="high">Высокий</option></select></label></div>
            <p className="quick-action-context">Задача будет создана в рабочем пространстве {workspace?.name ? `«${workspace.name}»` : "текущего сотрудника"} и назначена вам.</p>
            {!isReadyForTask && <p className="quick-action-error">Не найдено доступное рабочее пространство для создания задачи.</p>}
          </>}
          {error && <p className="quick-action-error">{error}</p>}
          <button type="submit" className="quick-action-submit" disabled={pending || (action !== "client" && !isReadyForTask)}>{pending ? <><Loader2 className="animate-spin" aria-hidden="true" />Сохраняем…</> : action === "client" ? "Создать клиента" : action === "meeting" ? "Запланировать встречу" : "Создать задачу звонка"}</button>
        </form>
      </section>
    </div>
  );
}

export type { QuickAction };
