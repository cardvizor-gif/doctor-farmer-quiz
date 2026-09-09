import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import RegionalWorkspacesPanel from "@/components/RegionalWorkspacesPanel";
import { downloadTeamFarmsWorkbook, type TeamFarmExport } from "@/lib/workspaceTransfer";
import { Building2, Check, Download, FileText, RotateCcw, Save, ShieldCheck, Trash2, UsersRound } from "lucide-react";
import { defaultPermissionsForRole, permissionLabels, permissionCodes, type PermissionCode } from "@shared/permissions";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const proposalStatusLabels = { draft: "Черновик", sent: "Отправлено", approved: "Согласовано", declined: "Отклонено" } as const;

function memberName(member: { displayName?: string | null; name?: string | null; email?: string | null }) {
  return member.displayName?.trim() || member.name?.trim() || member.email?.split("@")[0] || "Сотрудник";
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "DF";
}

function formatDate(value: Date | string | null | undefined) {
  return value ? new Date(value).toLocaleString("ru-RU") : "Нет данных";
}

function formatActiveDuration(totalSeconds: number | null | undefined) {
  if (!totalSeconds) return "Нет данных";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours} ч ${minutes} мин`;
  return `${Math.max(minutes, 1)} мин`;
}

function activityStatus(lastActivityAt: Date | string | null | undefined) {
  if (!lastActivityAt) return "Нет данных";
  const ageMs = Date.now() - new Date(lastActivityAt).getTime();
  if (ageMs <= 5 * 60 * 1000) return "Активен сейчас";
  if (ageMs <= 15 * 60 * 1000) return "Был недавно";
  return "Не в сети";
}

const permissionGroup = (permission: PermissionCode) => {
  if (["team.read", "team.manage", "team.transfer", "workspace.manage", "catalog.manage"].includes(permission)) return "admin" as const;
  if (["support.manage", "sales.assign"].includes(permission)) return "management" as const;
  return "work" as const;
};

const permissionGroupMeta = {
  work: { title: "Рабочие разделы менеджера", hint: "Хозяйства, КП, заявки, схемы, тестирование и свои задачи", card: "border-[#cfe7b8] bg-[#f4faec]", icon: "text-[#4d7f2e]", titleText: "text-[#315d2b]" },
  management: { title: "Расширенные рабочие права", hint: "Обработка обращений и постановка задач сотрудникам", card: "border-[#b9d8ee] bg-[#eff7fc]", icon: "text-[#2f6f9f]", titleText: "text-[#24567d]" },
  admin: { title: "Административные права", hint: "Команда, передача данных, рабочие пространства и номенклатура", card: "border-[#ead0a7] bg-[#fff8e9]", icon: "text-[#a56820]", titleText: "text-[#7d501c]" },
} as const;

const permissionGroups: Array<{ key: keyof typeof permissionGroupMeta; codes: PermissionCode[] }> = [
  { key: "work", codes: ["farms.read", "farms.write", "proposals.read", "proposals.write", "orders.read", "orders.write", "knowledge.read", "agro.use", "quiz.use", "sales.read", "sales.write"] },
  { key: "management", codes: ["support.create", "support.manage", "sales.assign"] },
  { key: "admin", codes: ["team.read", "team.manage", "team.transfer", "workspace.manage", "catalog.manage"] },
];

export default function AdminPanel() {
  const { data: currentUser } = trpc.auth.me.useQuery();
  const isSuperuser = Boolean(currentUser?.isSuperuser);
  const canManageWorkspaces = Boolean(isSuperuser || currentUser?.permissions?.includes("workspace.manage"));
  const { data: team = [], isLoading: isTeamLoading, error: teamError } = trpc.admin.team.useQuery(undefined, { enabled: Boolean(currentUser), retry: false });
  const teamFarmsQuery = trpc.admin.teamFarms.useQuery(undefined, { enabled: false });
  const utils = trpc.useUtils();
  const [selectedOpenId, setSelectedOpenId] = useState<string | null>(null);
  const [accessRole, setAccessRole] = useState<"user" | "admin">("user");
  const [accessPermissions, setAccessPermissions] = useState<PermissionCode[]>([]);
  const [transferTargetOpenId, setTransferTargetOpenId] = useState("");
  const [newsTitle, setNewsTitle] = useState("");
  const [newsBody, setNewsBody] = useState("");
  const selectedMember = useMemo(() => team.find((member) => member.openId === selectedOpenId), [selectedOpenId, team]);
  const transferTargets = useMemo(() => team.filter((member) => member.status === "active" && member.openId !== selectedOpenId), [selectedOpenId, team]);
  const updateAccess = trpc.admin.updateAccess.useMutation({
    onSuccess: () => {
      toast.success("Роль и права сохранены");
      void utils.admin.team.invalidate();
    },
    onError: (error) => toast.error(error.message || "Не удалось сохранить права"),
  });
  const transferData = trpc.admin.transferData.useMutation({
    onSuccess: () => {
      toast.success("Рабочие данные переданы, сотрудник оставлен активным");
      setTransferTargetOpenId("");
      void utils.admin.team.invalidate();
      void utils.admin.memberWorkspace.invalidate();
    },
    onError: (error) => toast.error(error.message || "Не удалось передать базу сотрудника"),
  });
  const archiveUser = trpc.admin.archiveUser.useMutation({
    onSuccess: () => {
      toast.success("Сотрудник архивирован");
      void utils.admin.team.invalidate();
      void utils.admin.memberWorkspace.invalidate();
    },
    onError: (error) => toast.error(error.message || "Не удалось архивировать сотрудника"),
  });
  const restoreUser = trpc.admin.restoreUser.useMutation({
    onSuccess: () => {
      toast.success("Сотрудник снова активен");
      void utils.admin.team.invalidate();
    },
    onError: (error) => toast.error(error.message || "Не удалось восстановить сотрудника"),
  });
  const publishNews = trpc.admin.publishNews.useMutation({
    onSuccess: (result) => { toast.success(`Новость отправлена сотрудникам: ${result.recipients}`); setNewsTitle(""); setNewsBody(""); },
    onError: (error) => toast.error(error.message || "Не удалось опубликовать новость"),
  });
  const deleteUser = trpc.admin.deleteUser.useMutation({
    onSuccess: () => {
      toast.success("Аккаунт сотрудника удалён");
      setSelectedOpenId(null);
      void utils.admin.team.invalidate();
    },
    onError: (error) => toast.error(error.message || "Не удалось удалить сотрудника"),
  });
  useEffect(() => {
    if (!selectedMember) return;
    setAccessRole(selectedMember.role);
    const savedPermissions = (selectedMember.permissions ?? []) as PermissionCode[];
    setAccessPermissions(savedPermissions.length > 0 ? savedPermissions : defaultPermissionsForRole(selectedMember.role));
  }, [selectedMember]);
  const { data: workspace, isLoading: isWorkspaceLoading, error: workspaceError } = trpc.admin.memberWorkspace.useQuery(
    { openId: selectedOpenId ?? "" },
    { enabled: Boolean(selectedOpenId) },
  );
  const activityQuery = trpc.activity.forUser.useQuery(
    { openId: selectedOpenId ?? "" },
    { enabled: Boolean(isSuperuser && selectedOpenId), staleTime: 30_000, refetchInterval: isSuperuser && selectedOpenId ? 60_000 : false },
  );
  const employeeCount = team.filter((member) => member.role === "user" && member.status === "active").length;
  const totalFarms = team.reduce((sum, member) => sum + member.farmCount, 0);
  const totalProposals = team.reduce((sum, member) => sum + member.proposalCount, 0);

  const exportFarms = async (farms: TeamFarmExport[], fileName: string) => {
    try {
      await downloadTeamFarmsWorkbook(farms, fileName);
      toast.success("Excel-реестр сформирован");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось сформировать Excel-файл");
    }
  };

  const exportTeamFarms = async () => {
    const result = await teamFarmsQuery.refetch();
    if (result.error || !result.data) return toast.error("Не удалось загрузить хозяйства команды");
    await exportFarms(result.data, "Doctor-Farmer-реестр-хозяйств-команды.xlsx");
  };

  const exportSelectedMemberFarms = async () => {
    if (!workspace) return;
    const name = memberName(workspace.member);
    const fileSafeName = name.replace(/[^a-zа-яё0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "сотрудник";
    await exportFarms(workspace.farms.map((farm) => ({ ...farm, managerName: name, managerEmail: workspace.member.email })), `Doctor-Farmer-реестр-${fileSafeName}.xlsx`);
  };

  if (teamError) { const isForbidden = teamError.data?.code === "FORBIDDEN"; return <section className="admin-panel-page mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-sm"><ShieldCheck className="h-8 w-8 text-[#5d7e34]" /><h2 className="mt-4 text-xl font-extrabold text-[#244b2d]">{isForbidden ? "Недостаточно прав для панели команды" : "Не удалось загрузить панель команды"}</h2><p className="mt-2 text-sm text-[#647461]">{isForbidden ? "Владелец кабинета должен назначить вам право просмотра команды." : "Обновите страницу и повторите попытку."}</p></section>; }

  return <section className="admin-panel-page mx-auto max-w-6xl">
    <div className="rounded-[2rem] bg-[linear-gradient(130deg,#244f2f,#47733a)] p-7 text-white shadow-[0_20px_50px_rgba(31,75,44,0.22)] sm:p-9"><div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-[#ddf2ad]">Управление командой</p><h2 className="mt-2 text-3xl font-extrabold tracking-tight">Панель администратора</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-white/78">Просматривайте зарегистрированных сотрудников и их рабочие базы. Изменение хозяйств и КП остаётся доступно только их владельцам.</p></div><Button type="button" variant="outline" onClick={() => void exportTeamFarms()} disabled={teamFarmsQuery.isFetching} className="shrink-0 border-white/35 bg-white/10 text-white hover:bg-white/20 hover:text-white"><Download className="mr-2 h-4 w-4" />{teamFarmsQuery.isFetching ? "Готовим Excel…" : "Выгрузить всю команду"}</Button></div><div className="mt-6 grid max-w-2xl grid-cols-3 gap-3"><div className="rounded-2xl bg-white/10 p-4"><strong className="block text-2xl">{employeeCount}</strong><span className="mt-1 block text-xs text-white/70">сотрудников</span></div><div className="rounded-2xl bg-white/10 p-4"><strong className="block text-2xl">{totalFarms}</strong><span className="mt-1 block text-xs text-white/70">хозяйств</span></div><div className="rounded-2xl bg-white/10 p-4"><strong className="block text-2xl">{totalProposals}</strong><span className="mt-1 block text-xs text-white/70">КП в базе</span></div></div></div>
    <RegionalWorkspacesPanel team={team} canManage={canManageWorkspaces} />
    {isSuperuser && <section className="mt-6 rounded-3xl border border-[#dce8d7] bg-[#f7fbf4] p-5 shadow-sm sm:p-6"><div className="flex flex-col gap-1"><h3 className="font-extrabold text-[#244b2d]">Новости для команды</h3><p className="text-sm leading-5 text-[#6b7b68]">Публикация появится в центре уведомлений всех активных сотрудников. Не включайте в текст персональные или регионально закрытые данные.</p></div><div className="mt-4 grid gap-3"><input value={newsTitle} onChange={(event) => setNewsTitle(event.target.value)} maxLength={255} placeholder="Заголовок новости" className="h-11 rounded-xl border border-[#dce8d7] bg-white px-3 text-sm text-[#244b2d] outline-none focus:border-[#7fae4d]" /><textarea value={newsBody} onChange={(event) => setNewsBody(event.target.value)} maxLength={2000} rows={3} placeholder="Текст новости или объявления" className="rounded-xl border border-[#dce8d7] bg-white px-3 py-3 text-sm text-[#244b2d] outline-none focus:border-[#7fae4d]" /><Button type="button" size="sm" onClick={() => publishNews.mutate({ title: newsTitle.trim(), body: newsBody.trim() })} disabled={publishNews.isPending || newsTitle.trim().length < 2 || newsBody.trim().length < 2} className="w-fit bg-[#315d1e] text-white hover:bg-[#244816]">{publishNews.isPending ? "Отправляем…" : "Опубликовать новость"}</Button></div></section>}
    <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div className="overflow-hidden rounded-3xl border border-[#e3ebe0] bg-white shadow-sm"><div className="border-b border-[#edf2ea] px-6 py-5"><h3 className="flex items-center gap-2 font-extrabold text-[#244b2d]"><UsersRound className="h-5 w-5 text-[#5d7e34]" />Зарегистрированные сотрудники</h3><p className="mt-1 text-sm text-[#6b7b68]">Выберите сотрудника для просмотра его рабочей базы.</p></div>{isTeamLoading ? <div className="p-8 text-sm text-[#61735f]">Загружаем состав команды…</div> : team.length === 0 ? <div className="p-10 text-center text-sm font-semibold text-[#4c654d]">Зарегистрированных сотрудников пока нет</div> : <div className="divide-y divide-[#edf2ea]">{team.map((member) => { const name = memberName(member); const isSelected = selectedOpenId === member.openId; return <button key={member.openId} type="button" onClick={() => setSelectedOpenId(member.openId)} className={`flex w-full items-center gap-3 px-5 py-4 text-left transition-colors ${isSelected ? "bg-[#f2f9e9]" : "hover:bg-[#f8fbf6]"}`}><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#e8f3df] text-xs font-extrabold text-[#35672e]">{initials(name)}</span><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><strong className="truncate text-sm text-[#244b2d]">{name}</strong><em className={`rounded-full px-2 py-0.5 text-[10px] font-bold not-italic ${member.status === "archived" ? "bg-[#f7e6df] text-[#92513c]" : member.role === "admin" ? "bg-[#e7eefb] text-[#365d9d]" : "bg-[#eef5e9] text-[#487841]"}`}>{member.status === "archived" ? "Архивирован" : member.role === "admin" ? "Администратор" : "Сотрудник"}</em></span><small className="mt-1 block truncate text-xs text-[#728171]">{member.email || "E-mail не указан"}</small>{member.position && <small className="mt-0.5 block truncate text-xs text-[#8a9888]">{member.position}</small>}</span><span className="shrink-0 text-right text-xs text-[#6e7d6a]"><b className="block font-extrabold text-[#315d2b]">{member.farmCount}</b>хоз.</span></button>; })}</div>}</div>
      <div className="overflow-hidden rounded-3xl border border-[#e3ebe0] bg-white shadow-sm"><div className="flex flex-col gap-3 border-b border-[#edf2ea] px-6 py-5 sm:flex-row sm:items-start sm:justify-between"><div><h3 className="font-extrabold text-[#244b2d]">Рабочая база сотрудника</h3><p className="mt-1 text-sm text-[#6b7b68]">Данные доступны в режиме просмотра.</p></div>{workspace && <Button type="button" variant="outline" size="sm" onClick={() => void exportSelectedMemberFarms()}><Download className="mr-2 h-4 w-4" />Excel сотрудника</Button>}</div>{!selectedOpenId ? <div className="p-10 text-center text-sm font-semibold text-[#647461]">Выберите сотрудника из списка слева</div> : isWorkspaceLoading ? <div className="p-8 text-sm text-[#61735f]">Загружаем хозяйства и КП…</div> : workspaceError || !workspace ? <div className="p-8 text-sm text-[#9a5b51]">Не удалось загрузить рабочую базу сотрудника.</div> : <div className="space-y-6 p-6"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-full bg-[#e8f3df] text-sm font-extrabold text-[#35672e]">{initials(memberName(workspace.member))}</span><div><strong className="block text-[#244b2d]">{memberName(workspace.member)}</strong><span className="text-xs text-[#70806e]">{workspace.member.email || selectedMember?.email || "E-mail не указан"}</span>{workspace.member.position && <span className="mt-1 block text-xs font-semibold text-[#5d7e34]">{workspace.member.position}</span>}</div></div>{isSuperuser && selectedMember && <div className="flex flex-wrap gap-2 rounded-2xl border border-[#e5eee1] bg-[#fbfdf9] p-3"><p className="w-full text-xs leading-5 text-[#728171]">Управление аккаунтом доступно только вам. Передача данных не меняет статус сотрудника; архивирование выполняется отдельной кнопкой.</p>{selectedMember.status === "archived" && <Button type="button" size="sm" onClick={() => restoreUser.mutate({ openId: selectedMember.openId })} disabled={restoreUser.isPending} className="bg-[#315d1e] text-white hover:bg-[#244816]"><RotateCcw className="mr-2 h-4 w-4" />{restoreUser.isPending ? "Восстанавливаем…" : "Восстановить сотрудника"}</Button>}{selectedMember.status === "active" && !selectedMember.isSuperuser && <Button type="button" variant="outline" size="sm" onClick={() => { if (!window.confirm(`Архивировать сотрудника «${memberName(selectedMember)}»? Его рабочие данные останутся без изменений.`)) return; archiveUser.mutate({ openId: selectedMember.openId }); }} disabled={archiveUser.isPending || selectedMember.role === "admin"} className="border-[#d9a894] bg-white text-[#8a4936] hover:bg-[#fff0e9]"><Trash2 className="mr-2 h-4 w-4" />{archiveUser.isPending ? "Архивируем…" : "Архивировать сотрудника"}</Button>}<Button type="button" variant="outline" size="sm" onClick={() => { if (!window.confirm(`Удалить аккаунт сотрудника «${memberName(selectedMember)}»? Рабочие данные не будут удалены, но операция необратима, если связанные данные отсутствуют.`)) return; deleteUser.mutate({ openId: selectedMember.openId }); }} disabled={deleteUser.isPending || Boolean(selectedMember.isSuperuser) || selectedMember.role === "admin"} className="border-[#d9a894] bg-white text-[#8a4936] hover:bg-[#fff0e9]"><Trash2 className="mr-2 h-4 w-4" />{deleteUser.isPending ? "Удаляем…" : "Удалить аккаунт"}</Button></div>}{isSuperuser && <div className="rounded-2xl border border-[#dfead8] bg-[#f7fbf4] p-4"><div className="flex items-center justify-between gap-3"><div><h4 className="font-extrabold text-[#244b2d]">Активность сотрудника</h4><p className="mt-1 text-xs leading-5 text-[#728171]">Этот блок виден только суперпользователю.</p></div><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${activityStatus(activityQuery.data?.lastActivityAt) === "Активен сейчас" ? "bg-[#e4f4d8] text-[#397330]" : "bg-[#eef2ec] text-[#627060]"}`}>{activityStatus(activityQuery.data?.lastActivityAt)}</span></div>{activityQuery.isLoading ? <p className="mt-4 text-sm text-[#61735f]">Загружаем активность…</p> : activityQuery.error ? <p className="mt-4 text-sm text-[#9a5b51]">Не удалось загрузить активность сотрудника.</p> : <div className="mt-4 grid gap-2 sm:grid-cols-3"><div className="rounded-xl bg-white p-3"><span className="block text-[11px] font-bold uppercase tracking-wide text-[#82917e]">Последняя активность</span><strong className="mt-1 block text-sm text-[#315d2b]">{formatDate(activityQuery.data?.lastActivityAt)}</strong></div><div className="rounded-xl bg-white p-3"><span className="block text-[11px] font-bold uppercase tracking-wide text-[#82917e]">Активное время</span><strong className="mt-1 block text-sm text-[#315d2b]">{formatActiveDuration(activityQuery.data?.activeSeconds)}</strong></div><div className="rounded-xl bg-white p-3"><span className="block text-[11px] font-bold uppercase tracking-wide text-[#82917e]">Сбор активности</span><strong className="mt-1 block text-sm text-[#315d2b]">С включения функции</strong></div></div>}</div>}<div className="rounded-2xl border border-[#e5eee1] bg-[#fbfdf9] p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h4 className="font-extrabold text-[#244b2d]">Роль и права доступа</h4><p className="mt-1 text-xs leading-5 text-[#728171]">{isSuperuser ? "Вы — суперпользователь и можете назначать роли. Для сотрудника можно включить только необходимые разделы." : "Вы можете менять права обычных сотрудников, но не назначать администраторов и не изменять права администраторов."}</p></div><select value={accessRole} onChange={(event) => { const nextRole = event.target.value as "user" | "admin"; setAccessRole(nextRole); setAccessPermissions(defaultPermissionsForRole(nextRole)); }} disabled={!isSuperuser || selectedMember?.status !== "active"} className="h-10 rounded-xl border border-[#dce8d7] bg-white px-3 text-sm font-bold text-[#315d2b] disabled:cursor-not-allowed disabled:opacity-60"><option value="user">Сотрудник</option>{isSuperuser && <option value="admin">Администратор</option>}</select></div>{accessRole === "admin" ? <p className="mt-4 rounded-xl bg-[#edf4ff] p-3 text-xs leading-5 text-[#43669a]">{isSuperuser ? "Полный доступ суперпользователя включает системные настройки, управление ролями и все рабочие разделы." : "Эта запись уже имеет роль администратора. Делегированный администратор не может изменять административные роли."}</p> : <div className="mt-4 space-y-3"><div className="flex flex-wrap gap-2 text-[11px] font-bold"><span className="rounded-full bg-[#edf7df] px-2.5 py-1 text-[#4d7f2e]">Зелёный — права менеджера</span><span className="rounded-full bg-[#eaf4fb] px-2.5 py-1 text-[#2f6f9f]">Синий — расширенные права</span><span className="rounded-full bg-[#fff3d8] px-2.5 py-1 text-[#9a611d]">Янтарный — управление системой</span></div>{permissionGroups.map(({ key, codes }) => { const meta = permissionGroupMeta[key]; return <section key={key} className={`rounded-2xl border p-3 ${meta.card}`}><div className="mb-2"><h5 className={`text-sm font-extrabold ${meta.titleText}`}>{meta.title}</h5><p className="mt-0.5 text-[11px] leading-4 text-[#667568]">{meta.hint}</p></div><div className="grid gap-2 sm:grid-cols-2">{codes.map((permission) => { const checked = accessPermissions.includes(permission); return <label key={permission} className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/80 bg-white/85 p-3 shadow-sm transition-colors hover:bg-white"><input type="checkbox" checked={checked} onChange={() => setAccessPermissions((current) => checked ? current.filter((item) => item !== permission) : [...current, permission])} className="mt-1 h-4 w-4 accent-[#315d1e]" /><span><span className={`flex items-center gap-1 text-sm font-bold ${meta.titleText}`}>{checked && <Check className="h-3.5 w-3.5" />}{permissionLabels[permission].title}</span><span className="mt-1 block text-xs leading-4 text-[#728171]">{permissionLabels[permission].description}</span></span></label>; })}</div></section>; })}</div>}<Button type="button" size="sm" onClick={() => selectedMember && updateAccess.mutate({ openId: selectedMember.openId, role: accessRole, permissions: accessPermissions })} disabled={!selectedMember || selectedMember.status !== "active" || (!isSuperuser && selectedMember.role === "admin") || updateAccess.isPending} className="mt-4 bg-[#315d1e] text-white hover:bg-[#244816]"><Save className="mr-2 h-4 w-4" />{updateAccess.isPending ? "Сохраняем…" : "Сохранить доступ"}</Button></div>{selectedMember && selectedMember.status === "active" && transferTargets.length > 0 && <div className="rounded-2xl border border-[#f0ddd2] bg-[#fffaf7] p-4"><h4 className="font-extrabold text-[#7d4535]">Передача рабочих данных</h4><p className="mt-1 text-xs leading-5 text-[#8b6a60]">Хозяйства и связанные заявки перейдут выбранному менеджеру. Исходный сотрудник останется активным; архивирование выполняется отдельно.</p><div className="mt-3 flex flex-col gap-2 sm:flex-row"><select value={transferTargetOpenId} onChange={(event) => setTransferTargetOpenId(event.target.value)} className="h-10 min-w-0 flex-1 rounded-xl border border-[#ead8d0] bg-white px-3 text-sm text-[#6f4032]"><option value="">Выберите менеджера-получателя</option>{transferTargets.map((member) => <option key={member.openId} value={member.openId}>{memberName(member)} · {member.farmCount} хоз.</option>)}</select><Button type="button" variant="outline" onClick={() => { if (!selectedMember || !transferTargetOpenId) return; if (!window.confirm(`Передать рабочие данные сотрудника «${memberName(selectedMember)}» менеджеру «${memberName(team.find((member) => member.openId === transferTargetOpenId) ?? {})}»? Сотрудник останется активным.`)) return; transferData.mutate({ sourceOpenId: selectedMember.openId, targetOpenId: transferTargetOpenId }); }} disabled={!transferTargetOpenId || transferData.isPending} className="shrink-0 border-[#d9a894] bg-white text-[#8a4936] hover:bg-[#fff0e9]">{transferData.isPending ? "Передаём…" : "Передать данные"}</Button></div></div>}<div><div className="mb-3 flex items-center gap-2 text-sm font-extrabold text-[#244b2d]"><Building2 className="h-4 w-4 text-[#5d7e34]" />Хозяйства <span className="rounded-full bg-[#edf4e7] px-2 py-0.5 text-xs text-[#507549]">{workspace.farms.length}</span></div>{workspace.farms.length === 0 ? <p className="rounded-2xl bg-[#fafcf8] p-4 text-sm text-[#748270]">Карточек хозяйств пока нет.</p> : <div className="grid gap-2">{workspace.farms.map((farm) => <div key={farm.id} className="rounded-2xl border border-[#e8eee5] p-4"><strong className="block text-sm text-[#254c2d]">{farm.name}</strong><p className="mt-1 text-xs text-[#70806e]">{farm.district || "Район не указан"}{farm.settlement ? ` · ${farm.settlement}` : ""}</p><p className="mt-2 text-xs font-bold text-[#527849]">{Number(farm.totalArea).toLocaleString("ru-RU")} га · {farm.salesStage}</p></div>)}</div>}</div><div><div className="mb-3 flex items-center gap-2 text-sm font-extrabold text-[#244b2d]"><FileText className="h-4 w-4 text-[#5d7e34]" />Коммерческие предложения <span className="rounded-full bg-[#edf4e7] px-2 py-0.5 text-xs text-[#507549]">{workspace.proposals.length}</span></div>{workspace.proposals.length === 0 ? <p className="rounded-2xl bg-[#fafcf8] p-4 text-sm text-[#748270]">Коммерческих предложений пока нет.</p> : <div className="grid gap-2">{workspace.proposals.map((proposal) => <div key={proposal.id} className="rounded-2xl border border-[#e8eee5] p-4"><strong className="block text-sm text-[#254c2d]">{proposal.title}</strong><p className="mt-1 text-xs text-[#70806e]">{proposal.crop} · {Number(proposal.area).toLocaleString("ru-RU")} га</p><p className="mt-2 text-xs font-bold text-[#527849]">{proposalStatusLabels[proposal.status]} · {Number(proposal.totalCost).toLocaleString("ru-RU")} ₽</p></div>)}</div>}</div></div>}</div>
    </div>
  </section>;
}
