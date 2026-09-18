import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({
  listFarms: vi.fn(),
  listFarmTasks: vi.fn(),
  getFarmById: vi.fn(),
  createFarm: vi.fn(),
  createFarms: vi.fn(),
  updateFarm: vi.fn(),
  updateFarmStage: vi.fn(),
  removeFarm: vi.fn(),
  claimLegacyFarms: vi.fn(),
  listProposals: vi.fn(),
  getProposalById: vi.fn(),
  createProposal: vi.fn(),
  updateProposal: vi.fn(),
  removeProposal: vi.fn(),
  updateProposalStatus: vi.fn(),
  listTeamMembers: vi.fn(),
  listTeamFarms: vi.fn(),
  getTeamMemberWorkspace: vi.fn(),
  getUserPermissions: vi.fn().mockResolvedValue(["farms.read", "farms.write", "proposals.read", "proposals.write"]),
}));

import * as db from "./db";
import { ENV } from "./_core/env";
import { appRouter } from "./routers";

const ownerOpenId = ENV.ownerOpenId;
const otherOpenId = "other-test-open-id";

const farm = {
  id: 12,
  ownerOpenId,
  name: "Проверка API",
  district: null,
  settlement: null,
  contactName: null,
  contactRole: null,
  phone: null,
  email: null,
  totalArea: "125.0",
  crops: null,
  technology: null,
  salesStage: "lead" as const,
  potentialValue: "0.00",
  nextAction: null,
  nextActionAt: null,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const proposal = {
  id: 31,
  farmId: farm.id,
  title: "КП · Схема",
  crop: "Озимая пшеница",
  technology: "Классическая",
  area: "125.0",
  costPerHectare: "0.00",
  totalCost: "0.00",
  status: "draft" as const,
  schemeJson: "{}",
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function createContext(openId: string | null, role: "user" | "admin" = "user"): TrpcContext {
  return {
    user: openId
      ? ({ id: 1, openId, name: "Тестовый пользователь", email: null, loginMethod: "test", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() } as NonNullable<TrpcContext["user"]>)
      : null,
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("farms and proposals privacy", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects unauthenticated access to private farm data", async () => {
    const caller = appRouter.createCaller(createContext(null));
    await expect(caller.farms.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(db.listFarms).not.toHaveBeenCalled();
  });

  it("creates and updates a farm only for the authenticated owner", async () => {
    vi.mocked(db.createFarm).mockResolvedValue(farm);
    vi.mocked(db.updateFarm).mockResolvedValue({ ...farm, salesStage: "proposal" });
    const caller = appRouter.createCaller(createContext(ownerOpenId));

    const created = await caller.farms.create({ name: farm.name, totalArea: 125 });
    const updated = await caller.farms.update({ id: farm.id, name: farm.name, totalArea: 125, salesStage: "proposal" });

    expect(created.id).toBe(farm.id);
    expect(db.createFarm).toHaveBeenCalledWith(expect.objectContaining({ name: farm.name, totalArea: 125, salesStage: "lead" }), ownerOpenId);
    expect(updated.salesStage).toBe("proposal");
    expect(db.updateFarm).toHaveBeenCalledWith(farm.id, expect.objectContaining({ salesStage: "proposal" }), ownerOpenId);
  });

  it("saves a proposal only after confirming the authenticated user owns its farm", async () => {
    vi.mocked(db.getFarmById).mockResolvedValue(farm);
    vi.mocked(db.createProposal).mockResolvedValue(proposal);
    const caller = appRouter.createCaller(createContext(ownerOpenId));
    const editedSchemeJson = JSON.stringify({ scheme: { steps: [{ products: [{ name: "Тайсон, КС", note: "Добавлено менеджером" }] }] } });

    const result = await caller.proposals.create({
      farmId: farm.id,
      title: proposal.title,
      crop: proposal.crop,
      technology: proposal.technology,
      area: 125,
      schemeJson: editedSchemeJson,
    });

    expect(db.getFarmById).toHaveBeenCalledWith(farm.id, ownerOpenId);
    expect(db.createProposal).toHaveBeenCalledWith(expect.objectContaining({ farmId: farm.id, status: "draft", schemeJson: editedSchemeJson }), ownerOpenId);
    expect(result.id).toBe(proposal.id);
  });

  it("imports only the user-confirmed validated farms for the authenticated owner", async () => {
    vi.mocked(db.createFarms).mockResolvedValue({ created: 2 });
    const caller = appRouter.createCaller(createContext(ownerOpenId));
    const importedFarms = [
      { name: "Импорт 1", totalArea: 100, salesStage: "lead" as const },
      { name: "Импорт 2", totalArea: 250, salesStage: "proposal" as const },
    ];

    const result = await caller.farms.bulkCreate({ farms: importedFarms });

    expect(db.createFarms).toHaveBeenCalledWith([
      expect.objectContaining({ name: "Импорт 1", totalArea: 100, salesStage: "lead", potentialValue: 0 }),
      expect.objectContaining({ name: "Импорт 2", totalArea: 250, salesStage: "proposal", potentialValue: 0 }),
    ], ownerOpenId);
    expect(result).toEqual({ created: 2 });
  });

  it("filters the farm and proposal history by the authenticated owner", async () => {
    vi.mocked(db.listFarms).mockResolvedValue([farm]);
    vi.mocked(db.listProposals).mockResolvedValue([proposal]);
    vi.mocked(db.getProposalById).mockResolvedValue(proposal);
    const caller = appRouter.createCaller(createContext(ownerOpenId));

    const farms = await caller.farms.list();
    const history = await caller.proposals.list({ farmId: farm.id });
    const found = await caller.proposals.byId({ id: proposal.id });

    expect(db.listFarms).toHaveBeenCalledWith(ownerOpenId);
    expect(db.listProposals).toHaveBeenCalledWith(ownerOpenId, farm.id);
    expect(db.getProposalById).toHaveBeenCalledWith(proposal.id, ownerOpenId);
    expect(farms).toEqual([farm]);
    expect(history).toEqual([proposal]);
    expect(found).toEqual(proposal);
  });

  it("returns tasks only for an owned farm", async () => {
    const farmTask = { task: { id: 77, farmId: farm.id, title: "Позвонить агроному", status: "todo" }, workspace: { id: 10, name: "Башкортостан" }, region: { id: 1, name: "Республика Башкортостан" }, assignee: { openId: ownerOpenId, displayName: "Владелец" } };
    vi.mocked(db.getFarmById).mockResolvedValue(farm);
    vi.mocked(db.listFarmTasks).mockResolvedValue([farmTask] as never);
    const caller = appRouter.createCaller(createContext(ownerOpenId));

    await expect(caller.farms.tasks({ id: farm.id })).resolves.toEqual([farmTask]);
    expect(db.getFarmById).toHaveBeenCalledWith(farm.id, ownerOpenId);
    expect(db.listFarmTasks).toHaveBeenCalledWith(farm.id, ownerOpenId);
  });

  it("updates the sales stage only for an owned farm", async () => {
    vi.mocked(db.updateFarmStage).mockResolvedValue({ ...farm, salesStage: "negotiation" });
    const caller = appRouter.createCaller(createContext(ownerOpenId));

    await expect(caller.farms.updateStage({ id: farm.id, salesStage: "negotiation" })).resolves.toMatchObject({ salesStage: "negotiation" });
    expect(db.updateFarmStage).toHaveBeenCalledWith(farm.id, "negotiation", ownerOpenId);
  });

  it("updates and removes only the authenticated user's proposal", async () => {
    vi.mocked(db.getProposalById).mockResolvedValue(proposal);
    vi.mocked(db.getFarmById).mockResolvedValue(farm);
    vi.mocked(db.updateProposal).mockResolvedValue({ ...proposal, title: "Обновлённое КП" });
    vi.mocked(db.removeProposal).mockResolvedValue(proposal);
    const caller = appRouter.createCaller(createContext(ownerOpenId));
    await expect(caller.proposals.update({ id: proposal.id, farmId: farm.id, title: "Обновлённое КП", crop: proposal.crop, area: 125, schemeJson: "{}" })).resolves.toMatchObject({ title: "Обновлённое КП" });
    await expect(caller.proposals.remove({ id: proposal.id })).resolves.toMatchObject({ id: proposal.id });
    expect(db.updateProposal).toHaveBeenCalledWith(proposal.id, expect.objectContaining({ title: "Обновлённое КП" }), ownerOpenId);
    expect(db.removeProposal).toHaveBeenCalledWith(proposal.id, ownerOpenId);
  });

  it("does not expose or mutate another user's farm or proposal", async () => {
    vi.mocked(db.getFarmById).mockResolvedValue(undefined);
    vi.mocked(db.getProposalById).mockResolvedValue(undefined);
    vi.mocked(db.updateFarm).mockResolvedValue(undefined);
    vi.mocked(db.updateProposal).mockResolvedValue(undefined);
    vi.mocked(db.removeProposal).mockResolvedValue(undefined);
    vi.mocked(db.updateProposalStatus).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createContext(otherOpenId));

    await expect(caller.farms.byId({ id: farm.id })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(caller.farms.update({ id: farm.id, name: "Чужая запись", totalArea: 125 })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(caller.proposals.byId({ id: proposal.id })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(caller.proposals.update({ id: proposal.id, farmId: farm.id, title: proposal.title, crop: proposal.crop, area: 125, schemeJson: "{}" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(caller.proposals.remove({ id: proposal.id })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(caller.proposals.updateStatus({ id: proposal.id, status: "sent" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(caller.proposals.create({ farmId: farm.id, title: proposal.title, crop: proposal.crop, area: 125, schemeJson: "{}" })).rejects.toMatchObject({ code: "NOT_FOUND" });

    expect(db.getFarmById).toHaveBeenCalledWith(farm.id, otherOpenId);
    expect(db.updateFarm).toHaveBeenCalledWith(farm.id, expect.any(Object), otherOpenId);
    expect(db.getProposalById).toHaveBeenCalledWith(proposal.id, otherOpenId);
    expect(db.updateProposalStatus).toHaveBeenCalledWith(proposal.id, "sent", otherOpenId);
  });

  it("allows only an administrator to claim unassigned legacy farms", async () => {
    vi.mocked(db.claimLegacyFarms).mockResolvedValue({ claimed: 1 });
    const adminCaller = appRouter.createCaller(createContext(ownerOpenId, "admin"));
    const userCaller = appRouter.createCaller(createContext(otherOpenId));

    await expect(userCaller.farms.claimLegacy()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(adminCaller.farms.claimLegacy()).resolves.toEqual({ claimed: 1 });
    expect(db.claimLegacyFarms).toHaveBeenCalledWith(ownerOpenId);
  });

  it("limits team members and employee workspaces to the administrator without changing owner-scoped routes", async () => {
    const teamMember = { id: 2, openId: otherOpenId, name: "Сотрудник", displayName: "Сотрудник", email: "employee@example.com", loginMethod: "invite", role: "user" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(), farmCount: 1, proposalCount: 1 };
    vi.mocked(db.listTeamMembers).mockResolvedValue([teamMember]);
    vi.mocked(db.getTeamMemberWorkspace).mockResolvedValue({ member: teamMember, farms: [farm], proposals: [proposal] });
    const adminCaller = appRouter.createCaller(createContext(ownerOpenId, "admin"));
    const employeeCaller = appRouter.createCaller(createContext(otherOpenId));

    await expect(employeeCaller.admin.team()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(employeeCaller.admin.memberWorkspace({ openId: ownerOpenId })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(adminCaller.admin.team()).resolves.toEqual([teamMember]);
    await expect(adminCaller.admin.memberWorkspace({ openId: otherOpenId })).resolves.toMatchObject({ member: teamMember, farms: [farm], proposals: [proposal] });
    expect(db.getTeamMemberWorkspace).toHaveBeenCalledWith(otherOpenId);
  });

  it("allows only the administrator to retrieve farm rows for the team export", async () => {
    const teamFarm = { ...farm, managerName: "Сотрудник", managerEmail: "employee@example.com" };
    vi.mocked(db.listTeamFarms).mockResolvedValue([teamFarm]);
    const adminCaller = appRouter.createCaller(createContext(ownerOpenId, "admin"));
    const employeeCaller = appRouter.createCaller(createContext(otherOpenId));

    await expect(employeeCaller.admin.teamFarms()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(adminCaller.admin.teamFarms()).resolves.toEqual([teamFarm]);
    expect(db.listTeamFarms).toHaveBeenCalledOnce();
  });
});
