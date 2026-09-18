import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({
  getUserPermissions: vi.fn(),
  listWorkspacesForUser: vi.fn(),
  listWorkspaces: vi.fn(),
  listWorkspaceTasksForUser: vi.fn(),
  listWorkspaceTasks: vi.fn(),
  listWorkspaceMembers: vi.fn(),
  listSalesFarms: vi.fn(),
  getWorkspaceMember: vi.fn(),
  createSalesTask: vi.fn(),
  getSalesTaskById: vi.fn(),
  updateSalesTaskStatus: vi.fn(),
}));

import * as db from "./db";
import { ENV } from "./_core/env";
import { appRouter } from "./routers";

const manager = { id: 1, openId: "manager-1", name: "Менеджер", displayName: "Менеджер", email: "manager@example.com", loginMethod: "invite", role: "user" as const, status: "active" as const };
const workspace = { id: 10, name: "Башкортостан", regionId: 1, createdByOpenId: ENV.ownerOpenId, isActive: 1, createdAt: new Date(), updatedAt: new Date() };
const region = { id: 1, name: "Республика Башкортостан", isActive: 1, createdAt: new Date() };
const membership = { id: 20, workspaceId: workspace.id, userOpenId: manager.openId, membershipRole: "manager" as const, assignedByOpenId: ENV.ownerOpenId, createdAt: new Date(), updatedAt: new Date() };

function context(user: typeof manager): TrpcContext {
  return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] } as TrpcContext;
}

function task(id: number, assigneeOpenId = manager.openId) {
  return { task: { id, workspaceId: workspace.id, creatorOpenId: assigneeOpenId, assigneeOpenId, farmId: null, proposalId: null, title: `Задача ${id}`, description: null, dueAt: null, status: "todo" as const, priority: "normal" as const, completedAt: null, createdAt: new Date(), updatedAt: new Date() }, workspace, region, assignee: manager };
}

describe("regional sales workspace", () => {
  beforeEach(() => vi.clearAllMocks());

  it("limits a manager overview to tasks assigned to that manager", async () => {
    vi.mocked(db.getUserPermissions).mockResolvedValue(["sales.read"]);
    vi.mocked(db.listWorkspacesForUser).mockResolvedValue([{ workspace, region, membership }] as never);
    vi.mocked(db.listWorkspaceTasksForUser).mockResolvedValue([task(1)] as never);
    vi.mocked(db.listWorkspaceMembers).mockResolvedValue([{ membership, user: manager }] as never);
    vi.mocked(db.listSalesFarms).mockResolvedValue([]);
    const caller = appRouter.createCaller(context(manager));

    const result = await caller.sales.overview();
    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0]?.task.assigneeOpenId).toBe(manager.openId);
    expect(db.listWorkspaceTasksForUser).toHaveBeenCalledWith(manager.openId);
    expect(db.listWorkspaceTasks).not.toHaveBeenCalled();
  });

  it("allows a manager to create a task for themselves in their workspace", async () => {
    vi.mocked(db.getUserPermissions).mockResolvedValue(["sales.write"]);
    vi.mocked(db.getWorkspaceMember).mockResolvedValue(membership);
    vi.mocked(db.createSalesTask).mockResolvedValue(task(2).task as never);
    const caller = appRouter.createCaller(context(manager));

    await expect(caller.sales.createTask({ workspaceId: workspace.id, assigneeOpenId: manager.openId, title: "Позвонить хозяйству", priority: "normal" })).resolves.toMatchObject({ title: "Задача 2" });
    expect(db.createSalesTask).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: workspace.id, creatorOpenId: manager.openId, assigneeOpenId: manager.openId }));
  });

  it("does not allow a manager to assign a task to another participant without sales.assign", async () => {
    const colleagueMembership = { ...membership, id: 21, userOpenId: "manager-2" };
    vi.mocked(db.getUserPermissions).mockResolvedValue(["sales.write"]);
    vi.mocked(db.getWorkspaceMember).mockImplementation(async (_workspaceId, openId) => openId === manager.openId ? membership : colleagueMembership);
    const caller = appRouter.createCaller(context(manager));

    await expect(caller.sales.createTask({ workspaceId: workspace.id, assigneeOpenId: "manager-2", title: "Чужая задача", priority: "normal" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(db.createSalesTask).not.toHaveBeenCalled();
  });

  it("allows only the superuser to see the complete workspace task overview", async () => {
    const owner = { ...manager, openId: ENV.ownerOpenId, role: "admin" as const };
    vi.mocked(db.listWorkspaces).mockResolvedValue([{ workspace, region, members: [] }] as never);
    vi.mocked(db.listWorkspaceTasks).mockResolvedValue([task(3)] as never);
    vi.mocked(db.listWorkspaceMembers).mockResolvedValue([]);
    vi.mocked(db.listSalesFarms).mockResolvedValue([]);
    const caller = appRouter.createCaller(context(owner));

    const result = await caller.sales.overview();
    expect(result.tasks[0]?.task.id).toBe(3);
    expect(db.listWorkspaces).toHaveBeenCalledTimes(1);
    expect(db.listWorkspaceTasks).toHaveBeenCalledWith([workspace.id]);
  });
});
