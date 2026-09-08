import { trpc } from "@/lib/trpc";
import { Layers3, MapPin, Plus, UserPlus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { regionalMembershipRoleLabels, regionalMembershipRoles, type RegionalMembershipRole } from "@shared/regions";
import { groupWorkspaceAssignments, workspaceAssignmentLabel } from "@/lib/regionalWorkspace";

type TeamMember = {
  openId: string;
  displayName?: string | null;
  name?: string | null;
  email?: string | null;
  status?: string | null;
};

function displayMember(member: TeamMember) {
  return member.displayName?.trim() || member.name?.trim() || member.email?.split("@")[0] || "Сотрудник";
}

export default function RegionalWorkspacesPanel({ team, canManage }: { team: TeamMember[]; canManage: boolean }) {
  const utils = trpc.useUtils();
  const { data: regions = [], isLoading: regionsLoading } = trpc.workspace.regions.useQuery(undefined, { enabled: canManage });
  const { data: workspaces = [], isLoading: workspacesLoading } = trpc.workspace.list.useQuery(undefined, { enabled: canManage });
  const [workspaceName, setWorkspaceName] = useState("");
  const [regionId, setRegionId] = useState("");
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const [memberOpenId, setMemberOpenId] = useState("");
  const [memberRole, setMemberRole] = useState<RegionalMembershipRole>("manager");
  const workspaceAssignments = useMemo(() => groupWorkspaceAssignments(workspaces.flatMap((item) => item.members.map(({ user }) => ({ userOpenId: user.openId, workspaceName: item.workspace.name, regionName: item.region.name })))), [workspaces]);

  useEffect(() => {
    if (!selectedWorkspaceId && workspaces[0]) setSelectedWorkspaceId(String(workspaces[0].workspace.id));
  }, [selectedWorkspaceId, workspaces]);

  const createWorkspace = trpc.workspace.create.useMutation({
    onSuccess: (workspace) => {
      toast.success(`Пространство «${workspace?.name ?? "Регион"}» создано`);
      setWorkspaceName("");
      setRegionId("");
      void utils.workspace.list.invalidate();
    },
    onError: (error) => toast.error(error.message || "Не удалось создать пространство"),
  });
  const assignMember = trpc.workspace.assign.useMutation({
    onSuccess: () => {
      toast.success("Назначение сохранено");
      setMemberOpenId("");
      setMemberRole("manager");
      void utils.workspace.list.invalidate();
    },
    onError: (error) => toast.error(error.message || "Не удалось назначить сотрудника"),
  });
  const removeMember = trpc.workspace.removeMember.useMutation({
    onSuccess: () => {
      toast.success("Сотрудник исключён из пространства");
      void utils.workspace.list.invalidate();
    },
    onError: (error) => toast.error(error.message || "Не удалось изменить состав пространства"),
  });

  if (!canManage) return null;

  const submitWorkspace = (event: React.FormEvent) => {
    event.preventDefault();
    if (!regionId) return toast.error("Выберите регион");
    const region = regions.find((item) => String(item.id) === regionId);
    createWorkspace.mutate({ name: workspaceName.trim() || region?.name || "Рабочее пространство", regionId: Number(regionId) });
  };

  const submitMember = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedWorkspaceId || !memberOpenId) return toast.error("Выберите пространство и сотрудника");
    assignMember.mutate({ workspaceId: Number(selectedWorkspaceId), userOpenId: memberOpenId, membershipRole: memberRole });
  };

  return <section className="regional-workspaces-panel mt-6 rounded-[1.75rem] border border-[#dbe2dd] bg-white p-5 shadow-[0_16px_36px_rgba(25,39,44,0.07)] sm:p-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div className="flex items-center gap-2 text-[#26343a]"><Layers3 className="h-5 w-5 text-[#9fce35]" /><h3 className="text-lg font-extrabold">Региональные пространства</h3></div>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-[#66777b]">Создайте рабочее пространство региона, затем назначьте РОПа, менеджеров и руководителей. Один руководитель может состоять в нескольких пространствах.</p>
      </div>
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#f1f5ee] px-3 py-1.5 text-xs font-bold text-[#53655e]"><MapPin className="h-3.5 w-3.5" />{workspaces.length} пространств</span>
    </div>

    <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <form onSubmit={submitWorkspace} className="rounded-2xl bg-[#f5f7f4] p-4">
        <p className="text-sm font-extrabold text-[#26343a]">Новое пространство</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2"><span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.08em] text-[#607174]">Название</span><input value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} className="h-10 w-full rounded-xl border border-[#d5dfd9] bg-white px-3 text-sm text-[#26343a] outline-none focus:border-[#a9d13c] focus:ring-4 focus:ring-[#eaf4ca]" placeholder="Например, Региональный центр»" /></label>
          <label className="block sm:col-span-2"><span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.08em] text-[#607174]">Регион</span><select required value={regionId} onChange={(event) => setRegionId(event.target.value)} className="h-10 w-full rounded-xl border border-[#d5dfd9] bg-white px-3 text-sm text-[#26343a] outline-none focus:border-[#a9d13c] focus:ring-4 focus:ring-[#eaf4ca]"><option value="" disabled>{regionsLoading ? "Загрузка регионов…" : "Выберите регион"}</option>{regions.map((region) => <option key={region.id} value={region.id}>{region.name}</option>)}</select></label>
        </div>
        <button type="submit" disabled={createWorkspace.isPending || regionsLoading} className="mt-3 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#26343a] px-4 text-sm font-bold text-white transition hover:bg-[#17252b] disabled:cursor-wait disabled:opacity-60"><Plus className="h-4 w-4" />{createWorkspace.isPending ? "Создаём…" : "Создать пространство"}</button>
      </form>

      <form onSubmit={submitMember} className="rounded-2xl bg-[#f5f7f4] p-4">
        <p className="text-sm font-extrabold text-[#26343a]">Назначить сотрудника</p>
        <p className="mt-1 text-xs leading-5 text-[#66777b]">В карточке РЦ сотрудник появляется только после явного сохранения назначения. Регион регистрации сам по себе не создаёт членство.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.08em] text-[#607174]">Пространство</span><select required value={selectedWorkspaceId} onChange={(event) => setSelectedWorkspaceId(event.target.value)} className="h-10 w-full rounded-xl border border-[#d5dfd9] bg-white px-3 text-sm text-[#26343a] outline-none focus:border-[#a9d13c] focus:ring-4 focus:ring-[#eaf4ca]"><option value="" disabled>Выберите пространство</option>{workspaces.map((item) => <option key={item.workspace.id} value={item.workspace.id}>{item.workspace.name}</option>)}</select></label>
          <label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.08em] text-[#607174]">Сотрудник</span><select required value={memberOpenId} onChange={(event) => setMemberOpenId(event.target.value)} className="h-10 w-full rounded-xl border border-[#d5dfd9] bg-white px-3 text-sm text-[#26343a] outline-none focus:border-[#a9d13c] focus:ring-4 focus:ring-[#eaf4ca]"><option value="" disabled>Выберите сотрудника</option>{team.filter((member) => member.status !== "archived").map((member) => <option key={member.openId} value={member.openId}>{displayMember(member)} · {workspaceAssignmentLabel(member.openId, workspaceAssignments)}</option>)}</select></label>
          <label className="block sm:col-span-2"><span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.08em] text-[#607174]">Роль в пространстве</span><select value={memberRole} onChange={(event) => setMemberRole(event.target.value as RegionalMembershipRole)} className="h-10 w-full rounded-xl border border-[#d5dfd9] bg-white px-3 text-sm text-[#26343a] outline-none focus:border-[#a9d13c] focus:ring-4 focus:ring-[#eaf4ca]">{regionalMembershipRoles.map((role) => <option key={role} value={role}>{regionalMembershipRoleLabels[role]}</option>)}</select></label>
        </div>
        <button type="submit" disabled={assignMember.isPending || workspacesLoading} className="mt-3 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#26343a] px-4 text-sm font-bold text-white transition hover:bg-[#17252b] disabled:cursor-wait disabled:opacity-60"><UserPlus className="h-4 w-4" />{assignMember.isPending ? "Сохраняем…" : "Сохранить назначение"}</button>
      </form>
    </div>

    <div className="mt-5 grid gap-3 xl:grid-cols-2">
      {workspacesLoading ? <div className="rounded-2xl bg-[#f5f7f4] p-5 text-sm text-[#66777b]">Загружаем пространства…</div> : workspaces.length ? workspaces.map((item) => <article key={item.workspace.id} className="rounded-2xl border border-[#e0e6e1] bg-white p-4"><div className="flex items-start justify-between gap-3"><div><h4 className="font-extrabold text-[#26343a]">{item.workspace.name}</h4><p className="mt-1 text-xs font-semibold text-[#7a898b]">{item.region.name}</p></div><span className="rounded-full bg-[#eef7d5] px-2.5 py-1 text-[11px] font-bold text-[#536b24]">{item.members.length} участников</span></div><div className="mt-3 flex flex-wrap gap-2">{item.members.length ? item.members.map(({ membership, user }) => <span key={membership.id} className="inline-flex items-center gap-1.5 rounded-full bg-[#f4f6f3] px-2.5 py-1.5 text-xs font-semibold text-[#4f5f61]"><span>{displayMember(user)}</span><span className="text-[#86938e]">· {regionalMembershipRoleLabels[membership.membershipRole as RegionalMembershipRole]}</span><button type="button" onClick={() => removeMember.mutate({ workspaceId: item.workspace.id, userOpenId: membership.userOpenId })} className="ml-1 rounded-full p-0.5 text-[#9aa5a1] transition hover:bg-[#e7ece7] hover:text-[#26343a]" aria-label={`Исключить ${displayMember(user)}`}><X className="h-3 w-3" /></button></span>) : <span className="text-xs text-[#8a9691]">Пока никто не назначен</span>}</div></article>) : <div className="rounded-2xl border border-dashed border-[#d5dfd9] p-5 text-sm text-[#66777b]">Пространства ещё не созданы. Начните с выбора региона.</div>}
    </div>
  </section>;
}
