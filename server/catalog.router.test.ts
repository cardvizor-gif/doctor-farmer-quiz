import { vi, describe, beforeEach, it, expect } from "vitest";

vi.mock("./db", () => ({
  listCatalogProducts: vi.fn(),
  listCatalogImportBatches: vi.fn(),
  applyCatalogImport: vi.fn(),
  getUserPermissions: vi.fn().mockResolvedValue([]),
}));

import { appRouter } from "./routers";
import * as db from "./db";
import type { TrpcContext } from "./_core/context";

const timestamp = new Date("2026-09-09T12:00:00.000Z");

function createContext(openId = "manager-one"): TrpcContext {
  return {
    user: { id: 1, openId, name: "Менеджер", displayName: "Менеджер", email: "manager@example.com", loginMethod: "invite", role: "user", createdAt: timestamp, updatedAt: timestamp, lastSignedIn: timestamp },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { cookie: vi.fn(), clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

const row = {
  catalogId: "DF-001",
  name: "Препарат, КС",
  preparativeForm: "КС",
  category: "СЗР",
  productGroup: "Гербицид",
  active: 1,
  registrationStatus: "Зарегистрирован",
  pricePrepayment: 100,
  price5050: 102,
  price7030: 104,
  priceDeferred: 106,
  fullData: { "ID препарата": "DF-001", "Наименование препарата": "Препарат, КС" },
};

describe("catalog permissions and import", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.getUserPermissions).mockResolvedValue([]);
  });

  it("does not expose catalog management to a regular employee", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.catalog.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(db.listCatalogProducts).not.toHaveBeenCalled();
  });

  it("allows a delegated catalog manager to export and view import history", async () => {
    vi.mocked(db.getUserPermissions).mockResolvedValue(["catalog.manage"]);
    vi.mocked(db.listCatalogProducts).mockResolvedValue([] as never);
    vi.mocked(db.listCatalogImportBatches).mockResolvedValue([] as never);
    const caller = appRouter.createCaller(createContext());

    await expect(caller.catalog.list()).resolves.toEqual([]);
    await expect(caller.catalog.history()).resolves.toEqual([]);
    expect(db.listCatalogProducts).toHaveBeenCalledWith(true);
    expect(db.listCatalogImportBatches).toHaveBeenCalled();
  });

  it("passes validated rows to the protected import operation", async () => {
    vi.mocked(db.getUserPermissions).mockResolvedValue(["catalog.manage"]);
    vi.mocked(db.applyCatalogImport).mockResolvedValue({ batchId: 3, imported: 1 });
    const caller = appRouter.createCaller(createContext());

    await expect(caller.catalog.import({ fileName: "fresh.xlsx", rows: [row] })).resolves.toEqual({ batchId: 3, imported: 1 });
    expect(db.applyCatalogImport).toHaveBeenCalledWith([row], "fresh.xlsx", "manager-one");
  });
});
