import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({
  listOrderRequests: vi.fn(),
  getOrderRequestById: vi.fn(),
  createOrderRequest: vi.fn(),
  updateOrderRequest: vi.fn(),
  createShipment: vi.fn(),
  getUserPermissions: vi.fn().mockResolvedValue(["orders.read", "orders.write"]),
}));

import { appRouter } from "./routers";
import * as db from "./db";
import type { TrpcContext } from "./_core/context";

const ownerOpenId = "manager-one";
const otherOpenId = "manager-two";
const requestDate = new Date("2026-08-27T12:00:00.000Z");

function createContext(openId: string = ownerOpenId): TrpcContext {
  return {
    user: {
      id: 1,
      openId,
      name: "Иван Менеджер",
      displayName: "Иван Менеджер",
      email: "manager@example.com",
      loginMethod: "invite",
      role: "user",
      createdAt: requestDate,
      updatedAt: requestDate,
      lastSignedIn: requestDate,
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { cookie: vi.fn(), clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

const input = {
  farmId: 14,
  requestDate,
  buyerName: "КФХ Север",
  segment: "medium" as const,
  paymentTerms: "50/50%",
  paymentDueDate: null,
  supplyDocuments: "договор, спецификация, УПД, счет",
  deliveryDueDate: null,
  edoStatus: "no" as const,
  edoProvider: null,
  notes: null,
  status: "submitted" as const,
  items: [{ productName: "Турион, КЭ", unit: "л", quantity: 80, unitPrice: 1110 }],
};

describe("order requests privacy", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates an order request only in the current manager workspace and saves the session manager identity", async () => {
    const created = { id: 77, ...input, totalAmount: "88800.00", farm: { id: 14, name: "КФХ Север" }, items: [], shipments: [] };
    vi.mocked(db.createOrderRequest).mockResolvedValue(created as never);
    const caller = appRouter.createCaller(createContext());

    await expect(caller.orderRequests.create(input)).resolves.toEqual(created);
    expect(db.createOrderRequest).toHaveBeenCalledWith(input, ownerOpenId, { name: "Иван Менеджер", email: "manager@example.com" });
  });

  it("does not expose another manager request when the owner-scoped lookup returns no record", async () => {
    vi.mocked(db.getOrderRequestById).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(createContext(otherOpenId));

    await expect(caller.orderRequests.byId({ id: 77 })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(db.getOrderRequestById).toHaveBeenCalledWith(77, otherOpenId);
  });

  it("records a shipment only against the current manager request", async () => {
    const updated = { id: 77, items: [], shipments: [{ id: 5 }] };
    vi.mocked(db.createShipment).mockResolvedValue(updated as never);
    const caller = appRouter.createCaller(createContext());
    const shipment = { requestId: 77, shipmentDate: requestDate, documentNumber: "УПД-42", notes: null, items: [{ requestItemId: 9, quantity: 12, unitPrice: 1110 }] };

    await expect(caller.orderRequests.createShipment(shipment)).resolves.toEqual(updated);
    expect(db.createShipment).toHaveBeenCalledWith(77, {
      shipmentDate: requestDate,
      documentNumber: "УПД-42",
      notes: null,
      items: [{ requestItemId: 9, quantity: 12, unitPrice: 1110 }],
    }, ownerOpenId);
  });

  it("requires an EDO provider when EDO is selected", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.orderRequests.create({ ...input, edoStatus: "yes", edoProvider: null })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(db.createOrderRequest).not.toHaveBeenCalled();
  });
});
