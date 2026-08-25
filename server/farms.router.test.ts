import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({
  listFarms: vi.fn(),
  getFarmById: vi.fn(),
  createFarm: vi.fn(),
  updateFarm: vi.fn(),
  removeFarm: vi.fn(),
  listProposals: vi.fn(),
  getProposalById: vi.fn(),
  createProposal: vi.fn(),
  updateProposalStatus: vi.fn(),
}));

import * as db from "./db";
import { appRouter } from "./routers";

const farm = {
  id: 12,
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

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("farms and proposals router", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates and updates a farm card through public procedures", async () => {
    vi.mocked(db.createFarm).mockResolvedValue(farm);
    vi.mocked(db.updateFarm).mockResolvedValue({ ...farm, salesStage: "proposal" });
    const caller = appRouter.createCaller(createPublicContext());

    const created = await caller.farms.create({ name: farm.name, totalArea: 125 });
    const updated = await caller.farms.update({ id: farm.id, name: farm.name, totalArea: 125, salesStage: "proposal" });

    expect(created.id).toBe(farm.id);
    expect(db.createFarm).toHaveBeenCalledWith(expect.objectContaining({ name: farm.name, totalArea: 125, salesStage: "lead" }));
    expect(updated.salesStage).toBe("proposal");
    expect(db.updateFarm).toHaveBeenCalledWith(farm.id, expect.objectContaining({ salesStage: "proposal" }));
  });

  it("saves a proposal only after confirming that its farm exists", async () => {
    vi.mocked(db.getFarmById).mockResolvedValue(farm);
    vi.mocked(db.createProposal).mockResolvedValue(proposal);
    const caller = appRouter.createCaller(createPublicContext());

    const result = await caller.proposals.create({
      farmId: farm.id,
      title: proposal.title,
      crop: proposal.crop,
      technology: proposal.technology,
      area: 125,
      schemeJson: proposal.schemeJson,
    });

    expect(db.getFarmById).toHaveBeenCalledWith(farm.id);
    expect(db.createProposal).toHaveBeenCalledWith(expect.objectContaining({ farmId: farm.id, status: "draft" }));
    expect(result.id).toBe(proposal.id);
  });

  it("returns a farm proposal history and an individual saved proposal", async () => {
    vi.mocked(db.listProposals).mockResolvedValue([proposal]);
    vi.mocked(db.getProposalById).mockResolvedValue(proposal);
    const caller = appRouter.createCaller(createPublicContext());

    const history = await caller.proposals.list({ farmId: farm.id });
    const found = await caller.proposals.byId({ id: proposal.id });

    expect(db.listProposals).toHaveBeenCalledWith(farm.id);
    expect(history).toEqual([proposal]);
    expect(db.getProposalById).toHaveBeenCalledWith(proposal.id);
    expect(found).toEqual(proposal);
  });
});
