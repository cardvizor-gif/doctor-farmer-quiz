import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { farms, InsertFarm, InsertProposal, InsertUser, proposals, users } from "../drizzle/schema";
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

function toNullable(value: string | null | undefined) {
  return value?.trim() ? value.trim() : null;
}

function toOptionalDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toFarmValues(input: FarmInput): InsertFarm {
  return {
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

export async function listFarms() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(farms).orderBy(desc(farms.updatedAt));
}

export async function getFarmById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(farms).where(eq(farms.id, id)).limit(1);
  return result[0];
}

export async function createFarm(input: FarmInput) {
  const db = await getDb();
  if (!db) throw new Error("База данных недоступна");
  const result = await db.insert(farms).values(toFarmValues(input));
  return getFarmById(Number(result[0].insertId));
}

export async function createFarms(inputs: FarmInput[]) {
  const db = await getDb();
  if (!db) throw new Error("База данных недоступна");
  if (inputs.length === 0) return { created: 0 };
  await db.insert(farms).values(inputs.map(toFarmValues));
  return { created: inputs.length };
}

export async function updateFarm(id: number, input: FarmInput) {
  const db = await getDb();
  if (!db) throw new Error("База данных недоступна");
  await db.update(farms).set(toFarmValues(input)).where(eq(farms.id, id));
  return getFarmById(id);
}

export async function removeFarm(id: number) {
  const db = await getDb();
  if (!db) throw new Error("База данных недоступна");
  await db.delete(farms).where(eq(farms.id, id));
  return { success: true } as const;
}

export async function listProposals(farmId?: number) {
  const db = await getDb();
  if (!db) return [];
  const query = db.select().from(proposals).orderBy(desc(proposals.updatedAt));
  return farmId ? query.where(eq(proposals.farmId, farmId)) : query;
}

export async function getProposalById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(proposals).where(eq(proposals.id, id)).limit(1);
  return result[0];
}

export async function createProposal(input: ProposalInput) {
  const db = await getDb();
  if (!db) throw new Error("База данных недоступна");
  const result = await db.insert(proposals).values(toProposalValues(input));
  return getProposalById(Number(result[0].insertId));
}

export async function updateProposalStatus(id: number, status: ProposalInput["status"]) {
  const db = await getDb();
  if (!db) throw new Error("База данных недоступна");
  await db.update(proposals).set({ status }).where(eq(proposals.id, id));
  return getProposalById(id);
}
