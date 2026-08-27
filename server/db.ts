import { and, desc, eq, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { accessRequests, farms, InsertFarm, InsertProposal, InsertUser, proposals, users } from "../drizzle/schema";
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
