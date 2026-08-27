import { and, count, desc, eq, isNotNull, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { accessRequests, farms, InsertFarm, InsertProposal, InsertUser, orderRequestItems, orderRequests, proposals, shipmentItems, shipments, users } from "../drizzle/schema";
import type { FarmInput, ProposalInput } from "../shared/farm";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserDisplayName(openId: string, displayName: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database is not available");
  }

  await db.update(users).set({ displayName }).where(eq(users.openId, openId));
  return getUserByOpenId(openId);
}

export async function listTeamMembers() {
  const db = await getDb();
  if (!db) return [];
  const [members, farmCounts, proposalCounts] = await Promise.all([
    db.select().from(users).orderBy(desc(users.lastSignedIn)),
    db.select({ ownerOpenId: farms.ownerOpenId, count: count(farms.id) }).from(farms).where(isNotNull(farms.ownerOpenId)).groupBy(farms.ownerOpenId),
    db.select({ ownerOpenId: farms.ownerOpenId, count: count(proposals.id) }).from(proposals).innerJoin(farms, eq(proposals.farmId, farms.id)).where(isNotNull(farms.ownerOpenId)).groupBy(farms.ownerOpenId),
  ]);
  const farmsByOwner = new Map(farmCounts.flatMap((item) => item.ownerOpenId ? [[item.ownerOpenId, Number(item.count)] as const] : []));
  const proposalsByOwner = new Map(proposalCounts.flatMap((item) => item.ownerOpenId ? [[item.ownerOpenId, Number(item.count)] as const] : []));
  return members.map((member) => ({
    ...member,
    farmCount: farmsByOwner.get(member.openId) ?? 0,
    proposalCount: proposalsByOwner.get(member.openId) ?? 0,
  }));
}

export async function getTeamMemberWorkspace(openId: string) {
  const member = await getUserByOpenId(openId);
  if (!member) return undefined;
  const [memberFarms, memberProposals] = await Promise.all([listFarms(openId), listProposals(openId)]);
  return { member, farms: memberFarms, proposals: memberProposals };
}

export async function listTeamFarms() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({ farm: farms, owner: users })
    .from(farms)
    .innerJoin(users, eq(farms.ownerOpenId, users.openId))
    .orderBy(desc(farms.updatedAt));
  return rows.map(({ farm, owner }) => ({
    ...farm,
    managerName: owner.displayName?.trim() || owner.name?.trim() || owner.email?.split("@")[0] || "Сотрудник",
    managerEmail: owner.email,
  }));
}

function toNullable(value: string | null | undefined) {
  return value?.trim() ? value.trim() : null;
}

function toOptionalDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toFarmValues(input: FarmInput, ownerOpenId: string): InsertFarm {
  return {
    ownerOpenId,
    name: input.name,
    district: toNullable(input.district),
    settlement: toNullable(input.settlement),
    contactName: toNullable(input.contactName),
    contactRole: toNullable(input.contactRole),
    phone: toNullable(input.phone),
    email: toNullable(input.email),
    totalArea: input.totalArea.toFixed(1),
    crops: toNullable(input.crops),
    technology: toNullable(input.technology),
    salesStage: input.salesStage,
    potentialValue: input.potentialValue.toFixed(2),
    nextAction: toNullable(input.nextAction),
    nextActionAt: toOptionalDate(input.nextActionAt),
    notes: toNullable(input.notes),
  };
}

function toProposalValues(input: ProposalInput): InsertProposal {
  return {
    farmId: input.farmId,
    title: input.title,
    crop: input.crop,
    technology: toNullable(input.technology),
    area: input.area.toFixed(1),
    costPerHectare: input.costPerHectare.toFixed(2),
    totalCost: input.totalCost.toFixed(2),
    status: input.status,
    schemeJson: input.schemeJson,
    notes: toNullable(input.notes),
  };
}

export type OrderItemInput = { productName: string; unit: string; quantity: number; unitPrice: number };
export type OrderRequestInput = {
  farmId: number;
  requestDate: Date;
  buyerName: string;
  segment: "agroholding" | "dealer" | "large" | "medium" | "small";
  paymentTerms: string;
  paymentDueDate?: Date | null;
  supplyDocuments?: string | null;
  deliveryDueDate?: Date | null;
  edoStatus: "yes" | "no";
  edoProvider?: string | null;
  notes?: string | null;
  status: "draft" | "submitted";
  items: OrderItemInput[];
};

export type ShipmentInput = {
  shipmentDate: Date;
  documentNumber?: string | null;
  notes?: string | null;
  items: Array<{ requestItemId: number; quantity: number; unitPrice: number }>;
};

function requestItemsValues(requestId: number, items: OrderItemInput[]) {
  return items.map((item) => ({
    requestId,
    productName: item.productName.trim(),
    unit: item.unit.trim() || "шт.",
    quantity: item.quantity.toFixed(3),
    unitPrice: item.unitPrice.toFixed(2),
    lineTotal: (item.quantity * item.unitPrice).toFixed(2),
  }));
}

function requestTotal(items: OrderItemInput[]) {
  return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
}

function requestValues(input: OrderRequestInput, ownerOpenId: string, manager: { name: string; email?: string | null }) {
  return {
    farmId: input.farmId,
    ownerOpenId,
    requestDate: input.requestDate,
    buyerName: input.buyerName.trim(),
    managerName: manager.name.trim(),
    managerEmail: toNullable(manager.email),
    segment: input.segment,
    paymentTerms: input.paymentTerms.trim(),
    paymentDueDate: input.paymentDueDate ?? null,
    supplyDocuments: toNullable(input.supplyDocuments),
    deliveryDueDate: input.deliveryDueDate ?? null,
    edoStatus: input.edoStatus,
    edoProvider: input.edoStatus === "yes" ? toNullable(input.edoProvider) : null,
    status: input.status,
    totalAmount: requestTotal(input.items).toFixed(2),
    notes: toNullable(input.notes),
  };
}

export async function listOrderRequests(ownerOpenId: string) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({ request: orderRequests, farmName: farms.name })
    .from(orderRequests)
    .innerJoin(farms, eq(orderRequests.farmId, farms.id))
    .where(eq(orderRequests.ownerOpenId, ownerOpenId))
    .orderBy(desc(orderRequests.updatedAt));
  return rows.map(({ request, farmName }) => ({ ...request, farmName }));
}

export async function getOrderRequestById(id: number, ownerOpenId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select({ request: orderRequests, farm: farms })
    .from(orderRequests)
    .innerJoin(farms, eq(orderRequests.farmId, farms.id))
    .where(and(eq(orderRequests.id, id), eq(orderRequests.ownerOpenId, ownerOpenId)))
    .limit(1);
  const entry = rows[0];
  if (!entry) return undefined;

  const [items, requestShipments, shipmentRows] = await Promise.all([
    db.select().from(orderRequestItems).where(eq(orderRequestItems.requestId, id)).orderBy(orderRequestItems.id),
    db.select().from(shipments).where(eq(shipments.requestId, id)).orderBy(desc(shipments.shipmentDate)),
    db.select({ item: shipmentItems }).from(shipmentItems).innerJoin(shipments, eq(shipmentItems.shipmentId, shipments.id)).where(eq(shipments.requestId, id)),
  ]);
  const shipmentItemsByShipment = new Map<number, typeof shipmentRows[number]["item"][]>();
  shipmentRows.forEach(({ item }) => shipmentItemsByShipment.set(item.shipmentId, [...(shipmentItemsByShipment.get(item.shipmentId) ?? []), item]));
  const shippedByRequestItem = new Map<number, number>();
  shipmentRows.forEach(({ item }) => shippedByRequestItem.set(item.requestItemId, (shippedByRequestItem.get(item.requestItemId) ?? 0) + Number(item.quantity)));

  return {
    ...entry.request,
    farm: entry.farm,
    items: items.map((item) => ({ ...item, shippedQuantity: shippedByRequestItem.get(item.id) ?? 0 })),
    shipments: requestShipments.map((shipment) => ({ ...shipment, items: shipmentItemsByShipment.get(shipment.id) ?? [] })),
  };
}

export async function createOrderRequest(input: OrderRequestInput, ownerOpenId: string, manager: { name: string; email?: string | null }) {
  const db = await getDb();
  if (!db) throw new Error("База данных недоступна");
  const farm = await getFarmById(input.farmId, ownerOpenId);
  if (!farm) return undefined;
  const requestId = await db.transaction(async (tx) => {
    const created = await tx.insert(orderRequests).values(requestValues(input, ownerOpenId, manager));
    const id = Number(created[0].insertId);
    await tx.insert(orderRequestItems).values(requestItemsValues(id, input.items));
    return id;
  });
  return getOrderRequestById(requestId, ownerOpenId);
}

export async function updateOrderRequest(id: number, input: OrderRequestInput, ownerOpenId: string, manager: { name: string; email?: string | null }) {
  const db = await getDb();
  if (!db) throw new Error("База данных недоступна");
  const existing = await getOrderRequestById(id, ownerOpenId);
  if (!existing || existing.status !== "draft") return undefined;
  const farm = await getFarmById(input.farmId, ownerOpenId);
  if (!farm) return undefined;
  await db.transaction(async (tx) => {
    await tx.update(orderRequests).set(requestValues(input, ownerOpenId, manager)).where(and(eq(orderRequests.id, id), eq(orderRequests.ownerOpenId, ownerOpenId), eq(orderRequests.status, "draft")));
    await tx.delete(orderRequestItems).where(eq(orderRequestItems.requestId, id));
    await tx.insert(orderRequestItems).values(requestItemsValues(id, input.items));
  });
  return getOrderRequestById(id, ownerOpenId);
}

export async function createShipment(requestId: number, input: ShipmentInput, ownerOpenId: string) {
  const db = await getDb();
  if (!db) throw new Error("База данных недоступна");
  const request = await getOrderRequestById(requestId, ownerOpenId);
  if (!request || request.status === "draft" || request.status === "cancelled") return undefined;
  const itemsById = new Map(request.items.map((item) => [item.id, item]));
  if (input.items.some((item) => !itemsById.has(item.requestItemId))) return undefined;
  if (input.items.some((item) => item.quantity + Number(itemsById.get(item.requestItemId)?.shippedQuantity ?? 0) > Number(itemsById.get(item.requestItemId)?.quantity ?? 0) + 0.0001)) return undefined;

  await db.transaction(async (tx) => {
    const created = await tx.insert(shipments).values({
      requestId,
      shipmentDate: input.shipmentDate,
      documentNumber: toNullable(input.documentNumber),
      notes: toNullable(input.notes),
    });
    const shipmentId = Number(created[0].insertId);
    await tx.insert(shipmentItems).values(input.items.map((item) => {
      const requestItem = itemsById.get(item.requestItemId)!;
      return {
        shipmentId,
        requestItemId: requestItem.id,
        productName: requestItem.productName,
        unit: requestItem.unit,
        quantity: item.quantity.toFixed(3),
        unitPrice: item.unitPrice.toFixed(2),
        lineTotal: (item.quantity * item.unitPrice).toFixed(2),
      };
    }));
    const allShipped = request.items.every((item) => Number(item.shippedQuantity) + (input.items.find((shipmentItem) => shipmentItem.requestItemId === item.id)?.quantity ?? 0) >= Number(item.quantity) - 0.0001);
    await tx.update(orderRequests).set({ status: allShipped ? "shipped" : "partial" }).where(and(eq(orderRequests.id, requestId), eq(orderRequests.ownerOpenId, ownerOpenId)));
  });
  return getOrderRequestById(requestId, ownerOpenId);
}

export async function listFarms(ownerOpenId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(farms).where(eq(farms.ownerOpenId, ownerOpenId)).orderBy(desc(farms.updatedAt));
}

export async function getFarmById(id: number, ownerOpenId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(farms).where(and(eq(farms.id, id), eq(farms.ownerOpenId, ownerOpenId))).limit(1);
  return result[0];
}

export async function createFarm(input: FarmInput, ownerOpenId: string) {
  const db = await getDb();
  if (!db) throw new Error("База данных недоступна");
  const result = await db.insert(farms).values(toFarmValues(input, ownerOpenId));
  return getFarmById(Number(result[0].insertId), ownerOpenId);
}

export async function createFarms(inputs: FarmInput[], ownerOpenId: string) {
  const db = await getDb();
  if (!db) throw new Error("База данных недоступна");
  if (inputs.length === 0) return { created: 0 };
  await db.insert(farms).values(inputs.map(input => toFarmValues(input, ownerOpenId)));
  return { created: inputs.length };
}

export async function updateFarm(id: number, input: FarmInput, ownerOpenId: string) {
  const db = await getDb();
  if (!db) throw new Error("База данных недоступна");
  const { ownerOpenId: _ownerOpenId, ...farmValues } = toFarmValues(input, ownerOpenId);
  await db.update(farms).set(farmValues).where(and(eq(farms.id, id), eq(farms.ownerOpenId, ownerOpenId)));
  return getFarmById(id, ownerOpenId);
}

export async function removeFarm(id: number, ownerOpenId: string) {
  const db = await getDb();
  if (!db) throw new Error("База данных недоступна");
  await db.delete(farms).where(and(eq(farms.id, id), eq(farms.ownerOpenId, ownerOpenId)));
  return { success: true } as const;
}

export async function listProposals(ownerOpenId: string, farmId?: number) {
  const db = await getDb();
  if (!db) return [];
  const ownerCondition = farmId
    ? and(eq(farms.ownerOpenId, ownerOpenId), eq(proposals.farmId, farmId))
    : eq(farms.ownerOpenId, ownerOpenId);
  const result = await db
    .select({ proposal: proposals })
    .from(proposals)
    .innerJoin(farms, eq(proposals.farmId, farms.id))
    .where(ownerCondition)
    .orderBy(desc(proposals.updatedAt));
  return result.map(row => row.proposal);
}

export async function getProposalById(id: number, ownerOpenId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select({ proposal: proposals })
    .from(proposals)
    .innerJoin(farms, eq(proposals.farmId, farms.id))
    .where(and(eq(proposals.id, id), eq(farms.ownerOpenId, ownerOpenId)))
    .limit(1);
  return result[0]?.proposal;
}

export async function createProposal(input: ProposalInput, ownerOpenId: string) {
  const db = await getDb();
  if (!db) throw new Error("База данных недоступна");
  const result = await db.insert(proposals).values(toProposalValues(input));
  return getProposalById(Number(result[0].insertId), ownerOpenId);
}

export async function updateProposalStatus(id: number, status: ProposalInput["status"], ownerOpenId: string) {
  const db = await getDb();
  if (!db) throw new Error("База данных недоступна");
  const existingProposal = await getProposalById(id, ownerOpenId);
  if (!existingProposal) return undefined;
  await db.update(proposals).set({ status }).where(eq(proposals.id, id));
  return getProposalById(id, ownerOpenId);
}

export async function claimLegacyFarms(ownerOpenId: string) {
  const db = await getDb();
  if (!db) throw new Error("База данных недоступна");
  const result = await db.update(farms).set({ ownerOpenId }).where(isNull(farms.ownerOpenId));
  return { claimed: Number(result[0].affectedRows ?? 0) };
}

type AccessRequestInput = { requestedName: string; email: string };

const normalizeAccessEmail = (email: string) => email.trim().toLowerCase();

export async function requestAccess(input: AccessRequestInput) {
  const db = await getDb();
  if (!db) throw new Error("База данных недоступна");
  const email = normalizeAccessEmail(input.email);
  const requestedName = input.requestedName.trim();
  const existing = await db.select().from(accessRequests).where(eq(accessRequests.email, email)).limit(1);

  if (existing[0]?.status === "pending" || existing[0]?.status === "activated") return existing[0];
  if (existing[0]) {
    await db.update(accessRequests).set({
      requestedName,
      status: "pending",
      reviewedByOpenId: null,
      reviewedAt: null,
      inviteCodeHash: null,
      inviteCodeExpiresAt: null,
      inviteCodeUsedAt: null,
      localOpenId: null,
    }).where(eq(accessRequests.id, existing[0].id));
    const refreshed = await db.select().from(accessRequests).where(eq(accessRequests.id, existing[0].id)).limit(1);
    return refreshed[0];
  }

  const result = await db.insert(accessRequests).values({ email, requestedName, status: "pending" });
  const created = await db.select().from(accessRequests).where(eq(accessRequests.id, Number(result[0].insertId))).limit(1);
  return created[0];
}

export async function listAccessRequests() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(accessRequests).orderBy(desc(accessRequests.createdAt));
}

export async function getAccessRequestById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(accessRequests).where(eq(accessRequests.id, id)).limit(1);
  return result[0];
}

export async function approveAccessRequest(id: number, reviewerOpenId: string, inviteCodeHash: string, expiresAt: Date) {
  const db = await getDb();
  if (!db) throw new Error("База данных недоступна");
  const request = await getAccessRequestById(id);
  if (!request || request.status !== "pending") return undefined;
  await db.update(accessRequests).set({
    status: "approved",
    reviewedByOpenId: reviewerOpenId,
    reviewedAt: new Date(),
    inviteCodeHash,
    inviteCodeExpiresAt: expiresAt,
    inviteCodeUsedAt: null,
  }).where(eq(accessRequests.id, id));
  return getAccessRequestById(id);
}

export async function rejectAccessRequest(id: number, reviewerOpenId: string) {
  const db = await getDb();
  if (!db) throw new Error("База данных недоступна");
  const request = await getAccessRequestById(id);
  if (!request || request.status !== "pending") return undefined;
  await db.update(accessRequests).set({
    status: "rejected",
    reviewedByOpenId: reviewerOpenId,
    reviewedAt: new Date(),
    inviteCodeHash: null,
    inviteCodeExpiresAt: null,
  }).where(eq(accessRequests.id, id));
  return getAccessRequestById(id);
}

export async function findActiveInvite(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(accessRequests).where(eq(accessRequests.email, normalizeAccessEmail(email))).limit(1);
  const request = result[0];
  if (!request || request.status !== "approved" || !request.inviteCodeHash || !request.inviteCodeExpiresAt || request.inviteCodeExpiresAt.getTime() <= Date.now()) return undefined;
  return request;
}

export async function consumeInvite(id: number, inviteCodeHash: string, localOpenId: string) {
  const db = await getDb();
  if (!db) throw new Error("База данных недоступна");
  const result = await db.update(accessRequests).set({
    status: "activated",
    inviteCodeUsedAt: new Date(),
    localOpenId,
  }).where(and(eq(accessRequests.id, id), eq(accessRequests.status, "approved"), eq(accessRequests.inviteCodeHash, inviteCodeHash), isNull(accessRequests.inviteCodeUsedAt)));
  return Number(result[0].affectedRows ?? 0) === 1;
}
