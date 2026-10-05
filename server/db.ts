import {
  and,
  count,
  desc,
  eq,
  inArray,
  isNotNull,
  isNull,
  sql,
} from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  accessRequests,
  catalogImportBatches,
  catalogProducts,
  deals,
  farms,
  InsertCatalogProduct,
  InsertFarm,
  InsertProposal,
  InsertUser,
  inviteCodeHistory,
  notifications,
  orderRequestItems,
  orderRequests,
  proposals,
  regions,
  salesTasks,
  shipmentItems,
  shipments,
  supportAttachments,
  supportMessages,
  supportTickets,
  userPermissions,
  users,
  workspaceMembers,
  workspaces,
} from "../drizzle/schema";
import type { DealInput, DealStage } from "../shared/deal";
import type { FarmInput, ProposalInput } from "../shared/farm";
import type { PermissionCode } from "../shared/permissions";
import { creditedActiveSeconds } from "../shared/activity";
import { ENV } from "./_core/env";
import { storagePut } from "./storage";
import { decryptInviteCode, encryptInviteCode } from "./inviteCodeVault";

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

export type CatalogImportRow = {
  catalogId: string;
  name: string;
  preparativeForm?: string | null;
  category?: string | null;
  productGroup?: string | null;
  active?: number | null;
  registrationStatus?: string | null;
  effectiveFrom?: Date | null;
  effectiveTo?: Date | null;
  pricePrepayment?: number | null;
  price5050?: number | null;
  price7030?: number | null;
  priceDeferred?: number | null;
  fullData: Record<string, unknown>;
};

export async function listCatalogProducts(includeArchived = true) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(catalogProducts)
    .where(includeArchived ? undefined : eq(catalogProducts.active, 1))
    .orderBy(catalogProducts.name);
}

export async function listCatalogImportBatches(limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(catalogImportBatches)
    .orderBy(desc(catalogImportBatches.createdAt))
    .limit(Math.min(Math.max(limit, 1), 100));
}

export async function applyCatalogImport(
  rows: CatalogImportRow[],
  fileName: string,
  importedByOpenId: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const normalizedRows = rows.map(row => ({
    ...row,
    catalogId: row.catalogId.trim(),
    name: row.name.trim(),
    fullDataJson: JSON.stringify(row.fullData),
    updatedByOpenId: importedByOpenId,
    active: row.active === 0 ? 0 : 1,
  }));
  const duplicateIds = normalizedRows
    .map(row => row.catalogId)
    .filter((id, index, ids) => ids.indexOf(id) !== index);
  if (
    duplicateIds.length ||
    normalizedRows.some(row => !row.catalogId || !row.name)
  ) {
    throw new Error(
      "Импорт содержит пустые или дублирующиеся ID/названия препаратов"
    );
  }
  const summaryJson = JSON.stringify({
    count: normalizedRows.length,
    catalogIds: normalizedRows.map(row => row.catalogId),
  });
  const result = await db.transaction(async tx => {
    const [batch] = await tx
      .insert(catalogImportBatches)
      .values({
        fileName: fileName || "Номенклатура.xlsx",
        status: "applied",
        rowCount: normalizedRows.length,
        summaryJson,
        importedByOpenId,
        appliedAt: new Date(),
      })
      .$returningId();
    for (const row of normalizedRows) {
      const values: InsertCatalogProduct = {
        catalogId: row.catalogId,
        name: row.name,
        preparativeForm: row.preparativeForm ?? null,
        category: row.category ?? null,
        productGroup: row.productGroup ?? null,
        active: row.active,
        registrationStatus: row.registrationStatus ?? null,
        effectiveFrom: row.effectiveFrom ?? null,
        effectiveTo: row.effectiveTo ?? null,
        pricePrepayment:
          row.pricePrepayment == null ? null : String(row.pricePrepayment),
        price5050: row.price5050 == null ? null : String(row.price5050),
        price7030: row.price7030 == null ? null : String(row.price7030),
        priceDeferred:
          row.priceDeferred == null ? null : String(row.priceDeferred),
        fullDataJson: row.fullDataJson,
        updatedByOpenId: importedByOpenId,
      };
      await tx
        .insert(catalogProducts)
        .values(values)
        .onDuplicateKeyUpdate({ set: { ...values, updatedAt: new Date() } });
    }
    return { batchId: batch?.id ?? null, imported: normalizedRows.length };
  });
  return result;
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

    const textFields = ["name", "email", "loginMethod", "position"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.primaryRegionId !== undefined) {
      values.primaryRegionId = user.primaryRegionId;
      updateSet.primaryRegionId = user.primaryRegionId;
    }

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (user.openId === ENV.ownerOpenId) {
      values.isSuperuser = 1;
      updateSet.isSuperuser = 1;
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

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizeAccessEmail(email)))
    .limit(1);
  return result[0];
}

export async function setUserPassword(openId: string, passwordHash: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db
    .update(users)
    .set({ passwordHash, passwordSetAt: new Date(), lastSignedIn: new Date() })
    .where(eq(users.openId, openId));
  return getUserByOpenId(openId);
}

export async function listRegions() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(regions)
    .where(eq(regions.isActive, 1))
    .orderBy(regions.name);
}

export async function getRegionById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select()
    .from(regions)
    .where(eq(regions.id, id))
    .limit(1);
  return rows[0];
}

/**
 * Returns only explicit workspace memberships. A user's registration/primary region
 * is deliberately not used as a fallback membership source.
 */
export async function listWorkspacesForUser(openId: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      workspace: workspaces,
      region: regions,
      membership: workspaceMembers,
    })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
    .innerJoin(regions, eq(workspaces.regionId, regions.id))
    .where(
      and(eq(workspaceMembers.userOpenId, openId), eq(workspaces.isActive, 1))
    )
    .orderBy(regions.name);
}

/**
 * The member list is sourced exclusively from workspaceMembers. Do not infer
 * membership from users.primaryRegionId: an employee must be assigned explicitly.
 */
export async function listWorkspaces() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      workspace: workspaces,
      region: regions,
      member: workspaceMembers,
      user: users,
    })
    .from(workspaces)
    .innerJoin(regions, eq(workspaces.regionId, regions.id))
    .leftJoin(workspaceMembers, eq(workspaceMembers.workspaceId, workspaces.id))
    .leftJoin(users, eq(workspaceMembers.userOpenId, users.openId))
    .where(eq(workspaces.isActive, 1))
    .orderBy(regions.name, users.displayName);
  const grouped = new Map<
    number,
    {
      workspace: (typeof rows)[number]["workspace"];
      region: (typeof rows)[number]["region"];
      members: Array<{
        membership: NonNullable<(typeof rows)[number]["member"]>;
        user: NonNullable<(typeof rows)[number]["user"]>;
      }>;
    }
  >();
  rows.forEach(({ workspace, region, member, user }) => {
    const item = grouped.get(workspace.id) ?? {
      workspace,
      region,
      members: [],
    };
    if (member && user) item.members.push({ membership: member, user });
    grouped.set(workspace.id, item);
  });
  return Array.from(grouped.values());
}

export async function createWorkspace(
  name: string,
  regionId: number,
  createdByOpenId: string
) {
  const db = await getDb();
  if (!db) throw new Error("База данных недоступна");
  const region = await getRegionById(regionId);
  if (!region) throw new Error("Регион не найден");
  const result = await db
    .insert(workspaces)
    .values({ name: name.trim(), regionId, createdByOpenId });
  const workspaceId = Number(result[0].insertId);
  return db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1)
    .then(rows => rows[0]);
}

export async function upsertWorkspaceMember(
  workspaceId: number,
  userOpenId: string,
  membershipRole: "manager" | "rop" | "cluster_director" | "deputy_ceo" | "ceo",
  assignedByOpenId: string
) {
  const db = await getDb();
  if (!db) throw new Error("База данных недоступна");
  const [workspace, user] = await Promise.all([
    db
      .select()
      .from(workspaces)
      .where(and(eq(workspaces.id, workspaceId), eq(workspaces.isActive, 1)))
      .limit(1),
    getUserByOpenId(userOpenId),
  ]);
  if (!workspace[0]) throw new Error("Рабочее пространство не найдено");
  if (!user || user.status === "archived")
    throw new Error("Сотрудник не найден или архивирован");
  await db
    .insert(workspaceMembers)
    .values({ workspaceId, userOpenId, membershipRole, assignedByOpenId })
    .onDuplicateKeyUpdate({
      set: { membershipRole, assignedByOpenId, updatedAt: new Date() },
    });
  return listWorkspaces();
}

export async function getWorkspaceMember(
  workspaceId: number,
  userOpenId: string
) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select()
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userOpenId, userOpenId)
      )
    )
    .limit(1);
  return rows[0];
}

export async function getWorkspaceById(workspaceId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select({ workspace: workspaces, region: regions })
    .from(workspaces)
    .innerJoin(regions, eq(workspaces.regionId, regions.id))
    .where(and(eq(workspaces.id, workspaceId), eq(workspaces.isActive, 1)))
    .limit(1);
  return rows[0];
}

export async function createSalesTask(input: {
  workspaceId: number;
  creatorOpenId: string;
  assigneeOpenId: string;
  farmId?: number | null;
  proposalId?: number | null;
  dealId?: number | null;
  title: string;
  description?: string | null;
  dueAt?: Date | null;
  priority: "low" | "normal" | "high";
}) {
  const db = await getDb();
  if (!db) throw new Error("База данных недоступна");
  const result = await db
    .insert(salesTasks)
    .values({
      ...input,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      dueAt: input.dueAt ?? null,
      farmId: input.farmId ?? null,
      proposalId: input.proposalId ?? null,
      dealId: input.dealId ?? null,
    });
  const rows = await db
    .select()
    .from(salesTasks)
    .where(eq(salesTasks.id, Number(result[0].insertId)))
    .limit(1);
  const task = rows[0];
  if (task && task.assigneeOpenId !== task.creatorOpenId) {
    await db.insert(notifications).values({
      recipientOpenId: task.assigneeOpenId,
      workspaceId: task.workspaceId,
      kind: "task",
      title: "Новое рабочее задание",
      body: task.title,
      href: "/sales",
    });
  }
  return task;
}

export async function listNotificationsForUser(openId: string, limit = 30) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.recipientOpenId, openId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function countUnreadNotifications(openId: string) {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db
    .select({ count: count(notifications.id) })
    .from(notifications)
    .where(
      and(
        eq(notifications.recipientOpenId, openId),
        eq(notifications.isRead, 0)
      )
    );
  return Number(rows[0]?.count ?? 0);
}

export async function markNotificationRead(
  openId: string,
  notificationId: number
) {
  const db = await getDb();
  if (!db) throw new Error("База данных недоступна");
  await db
    .update(notifications)
    .set({ isRead: 1 })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.recipientOpenId, openId)
      )
    );
  return { notificationId };
}

export async function markAllNotificationsRead(openId: string) {
  const db = await getDb();
  if (!db) throw new Error("База данных недоступна");
  await db
    .update(notifications)
    .set({ isRead: 1 })
    .where(
      and(
        eq(notifications.recipientOpenId, openId),
        eq(notifications.isRead, 0)
      )
    );
  return { openId };
}

export async function publishNewsNotification(
  title: string,
  body: string,
  href = "/news"
) {
  const db = await getDb();
  if (!db) throw new Error("База данных недоступна");
  const recipients = await db
    .select({ openId: users.openId })
    .from(users)
    .where(eq(users.status, "active"));
  if (recipients.length > 0) {
    await db
      .insert(notifications)
      .values(
        recipients.map(({ openId }) => ({
          recipientOpenId: openId,
          kind: "news" as const,
          title: title.trim(),
          body: body.trim(),
          href,
        }))
      );
  }
  return { recipients: recipients.length };
}

export async function getSalesTaskById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select()
    .from(salesTasks)
    .where(eq(salesTasks.id, id))
    .limit(1);
  return rows[0];
}

export async function updateSalesTaskStatus(
  id: number,
  status: "todo" | "in_progress" | "done" | "cancelled"
) {
  const db = await getDb();
  if (!db) throw new Error("База данных недоступна");
  await db
    .update(salesTasks)
    .set({ status, completedAt: status === "done" ? new Date() : null })
    .where(eq(salesTasks.id, id));
  const rows = await db
    .select()
    .from(salesTasks)
    .where(eq(salesTasks.id, id))
    .limit(1);
  return rows[0];
}

export async function removeWorkspaceMember(
  workspaceId: number,
  userOpenId: string
) {
  const db = await getDb();
  if (!db) throw new Error("База данных недоступна");
  await db
    .delete(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userOpenId, userOpenId)
      )
    );
  return listWorkspaces();
}

export async function listWorkspaceMembers(workspaceIds: number[]) {
  const db = await getDb();
  if (!db || workspaceIds.length === 0) return [];
  return db
    .select({ membership: workspaceMembers, user: users })
    .from(workspaceMembers)
    .innerJoin(users, eq(workspaceMembers.userOpenId, users.openId))
    .where(
      and(
        inArray(workspaceMembers.workspaceId, workspaceIds),
        eq(users.status, "active")
      )
    )
    .orderBy(users.displayName);
}

export async function listWorkspaceTasksForUser(openId: string) {
  const memberships = await listWorkspacesForUser(openId);
  const workspaceIds = memberships.map(item => item.workspace.id);
  const db = await getDb();
  if (!db || workspaceIds.length === 0) return [];
  const rows = await db
    .select({
      task: salesTasks,
      workspace: workspaces,
      region: regions,
      assignee: users,
    })
    .from(salesTasks)
    .innerJoin(workspaces, eq(salesTasks.workspaceId, workspaces.id))
    .innerJoin(regions, eq(workspaces.regionId, regions.id))
    .innerJoin(users, eq(salesTasks.assigneeOpenId, users.openId))
    .where(
      and(
        eq(salesTasks.assigneeOpenId, openId),
        inArray(salesTasks.workspaceId, workspaceIds)
      )
    )
    .orderBy(salesTasks.dueAt, desc(salesTasks.createdAt));
  return rows;
}

export async function listWorkspaceTasks(workspaceIds: number[]) {
  const db = await getDb();
  if (!db || workspaceIds.length === 0) return [];
  const rows = await db
    .select({
      task: salesTasks,
      workspace: workspaces,
      region: regions,
      assignee: users,
    })
    .from(salesTasks)
    .innerJoin(workspaces, eq(salesTasks.workspaceId, workspaces.id))
    .innerJoin(regions, eq(workspaces.regionId, regions.id))
    .innerJoin(users, eq(salesTasks.assigneeOpenId, users.openId))
    .where(inArray(salesTasks.workspaceId, workspaceIds))
    .orderBy(salesTasks.dueAt, desc(salesTasks.createdAt));
  return rows;
}

export async function listFarmTasks(farmId: number, ownerOpenId: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      task: salesTasks,
      workspace: workspaces,
      region: regions,
      assignee: users,
    })
    .from(salesTasks)
    .innerJoin(farms, eq(salesTasks.farmId, farms.id))
    .innerJoin(workspaces, eq(salesTasks.workspaceId, workspaces.id))
    .innerJoin(regions, eq(workspaces.regionId, regions.id))
    .innerJoin(users, eq(salesTasks.assigneeOpenId, users.openId))
    .where(and(eq(salesTasks.farmId, farmId), eq(farms.ownerOpenId, ownerOpenId)))
    .orderBy(salesTasks.dueAt, desc(salesTasks.createdAt));
}

export async function listSalesFarms(ownerOpenIds: string[]) {
  const database = await getDb();
  if (!database || ownerOpenIds.length === 0) return [];
  return database
    .select({ farm: farms, owner: users })
    .from(farms)
    .innerJoin(users, eq(farms.ownerOpenId, users.openId))
    .where(inArray(farms.ownerOpenId, ownerOpenIds))
    .orderBy(desc(farms.nextActionAt), desc(farms.updatedAt));
}

function toDealValues(input: DealInput, ownerOpenId: string) {
  return {
    farmId: input.farmId,
    ownerOpenId,
    workspaceId: input.workspaceId ?? null,
    title: input.title.trim(),
    season: input.season?.trim() || null,
    crop: input.crop?.trim() || null,
    area: String(input.area ?? 0),
    potentialValue: String(input.potentialValue ?? 0),
    probability: input.probability ?? 50,
    stage: input.stage ?? "new",
    nextAction: input.nextAction?.trim() || null,
    nextActionAt: input.nextActionAt ?? null,
    lostReason: input.lostReason?.trim() || null,
  };
}

export async function listSalesDeals(ownerOpenIds: string[]) {
  const database = await getDb();
  if (!database || ownerOpenIds.length === 0) return [];
  return database
    .select({ deal: deals, farm: farms, owner: users })
    .from(deals)
    .innerJoin(farms, eq(deals.farmId, farms.id))
    .innerJoin(users, eq(deals.ownerOpenId, users.openId))
    .where(inArray(deals.ownerOpenId, ownerOpenIds))
    .orderBy(desc(deals.nextActionAt), desc(deals.updatedAt));
}

export async function getDealById(id: number, ownerOpenId: string) {
  const database = await getDb();
  if (!database) return undefined;
  const rows = await database
    .select({ deal: deals, farm: farms, owner: users })
    .from(deals)
    .innerJoin(farms, eq(deals.farmId, farms.id))
    .innerJoin(users, eq(deals.ownerOpenId, users.openId))
    .where(and(eq(deals.id, id), eq(deals.ownerOpenId, ownerOpenId)))
    .limit(1);
  return rows[0];
}

export async function createDeal(input: DealInput, ownerOpenId: string) {
  const database = await getDb();
  if (!database) throw new Error("База данных недоступна");
  const result = await database.insert(deals).values(toDealValues(input, ownerOpenId));
  return getDealById(Number(result[0].insertId), ownerOpenId);
}

export async function updateDealStage(id: number, stage: DealStage, ownerOpenId: string) {
  const database = await getDb();
  if (!database) throw new Error("База данных недоступна");
  await database
    .update(deals)
    .set({ stage })
    .where(and(eq(deals.id, id), eq(deals.ownerOpenId, ownerOpenId)));
  return getDealById(id, ownerOpenId);
}

export async function updateDeal(id: number, input: DealInput, ownerOpenId: string) {
  const database = await getDb();
  if (!database) throw new Error("База данных недоступна");
  const { ownerOpenId: _ownerOpenId, ...values } = toDealValues(input, ownerOpenId);
  await database.update(deals).set(values).where(and(eq(deals.id, id), eq(deals.ownerOpenId, ownerOpenId)));
  return getDealById(id, ownerOpenId);
}

const dashboardRoleRank = {
  manager: 1,
  rop: 2,
  cluster_director: 3,
  deputy_ceo: 4,
  ceo: 5,
} as const;
const dashboardRoleLabels = {
  manager: "Менеджер",
  rop: "РОП",
  cluster_director: "Директор кластера",
  deputy_ceo: "Заместитель генерального директора",
  ceo: "Генеральный директор",
} as const;

/**
 * Role-aware home data. Leadership scope is derived only from explicit workspaceMembers;
 * primaryRegionId is never used to expand a user's visibility.
 */
export async function getDashboardOverview(user: {
  openId: string;
  role: "user" | "admin";
  isSuperuser?: number | boolean;
  name?: string | null;
  position?: string | null;
}) {
  const memberships = await listWorkspacesForUser(user.openId);
  const allWorkspaces = user.isSuperuser ? await listWorkspaces() : memberships;
  const workspaceIds = allWorkspaces.map(item => item.workspace.id);
  const memberRows = workspaceIds.length
    ? await listWorkspaceMembers(workspaceIds)
    : [];
  const highestMembership = memberships.reduce<
    (typeof memberships)[number]["membership"] | null
  >((best, item) => {
    if (
      !best ||
      dashboardRoleRank[item.membership.membershipRole] >
        dashboardRoleRank[best.membershipRole]
    )
      return item.membership;
    return best;
  }, null);
  const roleKey = user.isSuperuser
    ? "ceo"
    : (highestMembership?.membershipRole ?? "manager");
  const isLeadership = Boolean(
    user.isSuperuser ||
      (highestMembership && highestMembership.membershipRole !== "manager")
  );
  const ownerIds = user.isSuperuser
    ? (await listTeamMembers()).map(item => item.openId)
    : isLeadership
      ? Array.from(new Set(memberRows.map(item => item.user.openId)))
      : [user.openId];
  const [tasks, scopedFarms, scopedProposals, scopedOrders, notifications] =
    await Promise.all([
      user.isSuperuser
        ? listWorkspaceTasks(workspaceIds)
        : isLeadership && workspaceIds.length
          ? listWorkspaceTasks(workspaceIds)
          : listWorkspaceTasksForUser(user.openId),
      Promise.all(ownerIds.map(ownerId => listFarms(ownerId))),
      Promise.all(ownerIds.map(ownerId => listProposals(ownerId))),
      Promise.all(ownerIds.map(ownerId => listOrderRequests(ownerId))),
      listNotificationsForUser(user.openId, 8),
    ]);
  const farms = scopedFarms.flat();
  const proposals = scopedProposals.flat();
  const orders = scopedOrders.flat();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const openTask = (item: (typeof tasks)[number]) =>
    item.task.status === "todo" || item.task.status === "in_progress";
  const todayTasks = tasks.filter(
    item =>
      openTask(item) &&
      item.task.dueAt &&
      new Date(item.task.dueAt) >= todayStart &&
      new Date(item.task.dueAt) < tomorrowStart
  );
  const overdueTasks = tasks.filter(
    item =>
      openTask(item) &&
      item.task.dueAt &&
      new Date(item.task.dueAt) < todayStart
  );
  const attentionFarms = farms
    .filter(
      farm => farm.nextActionAt && new Date(farm.nextActionAt) < tomorrowStart
    )
    .slice(0, 5);
  const openProposals = proposals.filter(
    proposal => proposal.status === "draft" || proposal.status === "sent"
  );
  const openOrders = orders.filter(
    order =>
      order.status === "draft" ||
      order.status === "submitted" ||
      order.status === "partial"
  );
  return {
    role: roleKey,
    userName: user.name?.trim() || "коллега",
    position:
      user.position?.trim() ||
      (user.isSuperuser ? "Суперпользователь" : dashboardRoleLabels[roleKey]),
    roleLabel: user.isSuperuser
      ? "Суперпользователь"
      : dashboardRoleLabels[roleKey],
    isLeadership,
    scopeLabel: user.isSuperuser
      ? "Вся компания"
      : allWorkspaces.map(item => item.region.name).join(", ") ||
        "Личное рабочее пространство",
    workspaces: allWorkspaces.map(item => ({
      id: item.workspace.id,
      name: item.workspace.name,
      region: item.region.name,
    })),
    summary: {
      today: todayTasks.length,
      overdue: overdueTasks.length,
      farms: farms.length,
      proposals: openProposals.length,
      orders: openOrders.length,
      team: memberRows.length,
    },
    tasks: [
      ...overdueTasks,
      ...todayTasks,
      ...tasks.filter(
        item =>
          openTask(item) &&
          !todayTasks.includes(item) &&
          !overdueTasks.includes(item)
      ),
    ].slice(0, 8),
    attention: {
      overdueTasks: overdueTasks.length,
      attentionFarms,
      openProposals: openProposals.length,
      openOrders: openOrders.length,
    },
    // A target/plan source is not stored in the current data model yet. Keep this explicit instead of inventing sales numbers.
    sales: {
      isConfigured: false,
      planTarget: null,
      fact: null,
      percent: null,
      history: [],
    },
    notifications,
  };
}

export async function getUserPermissions(
  openId: string
): Promise<PermissionCode[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({ permission: userPermissions.permission })
    .from(userPermissions)
    .where(eq(userPermissions.userOpenId, openId));
  return rows.map(row => row.permission as PermissionCode);
}

export async function updateUserDisplayName(
  openId: string,
  displayName: string
) {
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
  const [members, farmCounts, proposalCounts, permissions] = await Promise.all([
    db.select().from(users).orderBy(desc(users.lastSignedIn)),
    db
      .select({ ownerOpenId: farms.ownerOpenId, count: count(farms.id) })
      .from(farms)
      .where(isNotNull(farms.ownerOpenId))
      .groupBy(farms.ownerOpenId),
    db
      .select({ ownerOpenId: farms.ownerOpenId, count: count(proposals.id) })
      .from(proposals)
      .innerJoin(farms, eq(proposals.farmId, farms.id))
      .where(isNotNull(farms.ownerOpenId))
      .groupBy(farms.ownerOpenId),
    db.select().from(userPermissions),
  ]);
  const farmsByOwner = new Map(
    farmCounts.flatMap(item =>
      item.ownerOpenId ? [[item.ownerOpenId, Number(item.count)] as const] : []
    )
  );
  const proposalsByOwner = new Map(
    proposalCounts.flatMap(item =>
      item.ownerOpenId ? [[item.ownerOpenId, Number(item.count)] as const] : []
    )
  );
  const permissionsByOwner = new Map<string, string[]>();
  permissions.forEach(({ userOpenId, permission }) =>
    permissionsByOwner.set(userOpenId, [
      ...(permissionsByOwner.get(userOpenId) ?? []),
      permission,
    ])
  );
  return members.map(member => ({
    ...member,
    farmCount: farmsByOwner.get(member.openId) ?? 0,
    proposalCount: proposalsByOwner.get(member.openId) ?? 0,
    permissions: permissionsByOwner.get(member.openId) ?? [],
  }));
}

export async function restoreArchivedUser(
  openId: string,
  restoredByOpenId: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const target = await getUserByOpenId(openId);
  if (!target) return undefined;
  if (target.status !== "archived") throw new Error("Сотрудник уже активен");
  await db
    .update(users)
    .set({ status: "active", archivedAt: null, archivedByOpenId: null })
    .where(and(eq(users.openId, openId), eq(users.status, "archived")));
  return { user: await getUserByOpenId(openId), restoredByOpenId };
}

export async function deleteUserAccount(openId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const target = await getUserByOpenId(openId);
  if (!target) return undefined;
  if (target.isSuperuser || openId === ENV.ownerOpenId)
    throw new Error("Нельзя удалить владельца кабинета");
  if (target.role === "admin")
    throw new Error("Сначала снимите роль администратора");
  const [
    farmsCount,
    proposalsCount,
    ordersCount,
    supportCount,
    createdTasksCount,
    assignedTasksCount,
  ] = await Promise.all([
    db
      .select({ count: count(farms.id) })
      .from(farms)
      .where(eq(farms.ownerOpenId, openId)),
    db
      .select({ count: count(proposals.id) })
      .from(proposals)
      .innerJoin(farms, eq(proposals.farmId, farms.id))
      .where(eq(farms.ownerOpenId, openId)),
    db
      .select({ count: count(orderRequests.id) })
      .from(orderRequests)
      .where(eq(orderRequests.ownerOpenId, openId)),
    db
      .select({ count: count(supportTickets.id) })
      .from(supportTickets)
      .where(eq(supportTickets.ownerOpenId, openId)),
    db
      .select({ count: count(salesTasks.id) })
      .from(salesTasks)
      .where(eq(salesTasks.creatorOpenId, openId)),
    db
      .select({ count: count(salesTasks.id) })
      .from(salesTasks)
      .where(eq(salesTasks.assigneeOpenId, openId)),
  ]);
  const linked = [
    farmsCount[0]?.count,
    proposalsCount[0]?.count,
    ordersCount[0]?.count,
    supportCount[0]?.count,
    createdTasksCount[0]?.count,
    assignedTasksCount[0]?.count,
  ]
    .map(Number)
    .reduce((sum, value) => sum + value, 0);
  if (linked > 0)
    throw new Error(
      "Нельзя удалить сотрудника: у него есть связанные хозяйства, КП, заявки, обращения или задачи. Сначала передайте базу и завершите связанные задачи."
    );
  await db.transaction(async tx => {
    await tx
      .delete(userPermissions)
      .where(eq(userPermissions.userOpenId, openId));
    await tx.delete(users).where(eq(users.openId, openId));
  });
  return { openId, deleted: true };
}

export async function updateUserAccess(
  openId: string,
  role: "user" | "admin",
  permissions: PermissionCode[],
  grantedByOpenId: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const target = await getUserByOpenId(openId);
  if (!target) return undefined;
  if (target.isSuperuser || openId === ENV.ownerOpenId) {
    if (role !== "admin")
      throw new Error("Нельзя снять права владельца кабинета");
  }
  if (target.status === "archived")
    throw new Error("Архивированный сотрудник недоступен для изменения");
  if (target.role === "admin" && role === "user") {
    const admins = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, "admin"));
    if (admins.length <= 1)
      throw new Error("Нельзя понизить последнего администратора");
  }
  await db.transaction(async tx => {
    await tx.update(users).set({ role }).where(eq(users.openId, openId));
    await tx
      .delete(userPermissions)
      .where(eq(userPermissions.userOpenId, openId));
    if (permissions.length > 0) {
      await tx
        .insert(userPermissions)
        .values(
          permissions.map(permission => ({
            userOpenId: openId,
            permission,
            grantedByOpenId,
          }))
        );
    }
  });
  return getUserByOpenId(openId);
}

export async function transferUserData(
  sourceOpenId: string,
  targetOpenId: string,
  transferredByOpenId: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  if (sourceOpenId === targetOpenId)
    throw new Error("Нельзя передать базу самому себе");
  const [source, target, transferredBy] = await Promise.all([
    getUserByOpenId(sourceOpenId),
    getUserByOpenId(targetOpenId),
    getUserByOpenId(transferredByOpenId),
  ]);
  if (!source) throw new Error("Сотрудник-источник не найден");
  if (!target) throw new Error("Сотрудник-получатель не найден");
  if (!transferredBy) throw new Error("Администратор-инициатор не найден");
  if (source.status === "archived")
    throw new Error("Сначала восстановите сотрудника");
  if (target.status === "archived")
    throw new Error("Нельзя передать базу архивированному сотруднику");
  if (source.isSuperuser)
    throw new Error("Нельзя передать базу владельца кабинета");

  await db.transaction(async tx => {
    await tx
      .update(farms)
      .set({ ownerOpenId: targetOpenId })
      .where(eq(farms.ownerOpenId, sourceOpenId));
    await tx
      .update(orderRequests)
      .set({ ownerOpenId: targetOpenId })
      .where(eq(orderRequests.ownerOpenId, sourceOpenId));
  });
  return {
    sourceOpenId,
    targetOpenId,
    transferredByOpenId,
    transferredAt: new Date(),
  };
}

export async function archiveUser(openId: string, archivedByOpenId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const [source, archivedBy] = await Promise.all([
    getUserByOpenId(openId),
    getUserByOpenId(archivedByOpenId),
  ]);
  if (!source) throw new Error("Сотрудник не найден");
  if (!archivedBy) throw new Error("Администратор-инициатор не найден");
  if (source.status === "archived")
    throw new Error("Сотрудник уже архивирован");
  if (source.isSuperuser)
    throw new Error("Нельзя архивировать владельца кабинета");
  if (
    source.role === "admin" &&
    !archivedBy.isSuperuser &&
    archivedByOpenId !== ENV.ownerOpenId
  )
    throw new Error(
      "Только суперпользователь может архивировать администратора"
    );
  if (source.role === "admin") {
    const admins = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.role, "admin"), eq(users.status, "active")));
    if (admins.length <= 1)
      throw new Error("Нельзя архивировать последнего администратора");
  }
  await db
    .update(users)
    .set({ status: "archived", archivedAt: new Date(), archivedByOpenId })
    .where(and(eq(users.openId, openId), eq(users.status, "active")));
  return { openId, archivedByOpenId, archivedAt: new Date() };
}

export async function getTeamMemberWorkspace(openId: string) {
  const member = await getUserByOpenId(openId);
  if (!member) return undefined;
  const [memberFarms, memberProposals] = await Promise.all([
    listFarms(openId),
    listProposals(openId),
  ]);
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
    managerName:
      owner.displayName?.trim() ||
      owner.name?.trim() ||
      owner.email?.split("@")[0] ||
      "Сотрудник",
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
    dealId: input.dealId ?? null,
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

export type OrderItemInput = {
  productName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
};
export type OrderRequestInput = {
  farmId: number;
  dealId?: number | null;
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

export type SupportAttachmentInput = {
  fileName: string;
  mimeType: string;
  dataBase64: string;
};
export type SupportTicketInput = {
  subject?: string | null;
  message: string;
  pagePath: string;
  attachments?: SupportAttachmentInput[];
};
export type SupportReplyInput = {
  ticketId: number;
  message: string;
  responderOpenId: string;
};

function safeAttachmentName(fileName: string) {
  const normalized = fileName
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "");
  return normalized.slice(0, 160) || "attachment";
}

function requestItemsValues(requestId: number, items: OrderItemInput[]) {
  return items.map(item => ({
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

function requestValues(
  input: OrderRequestInput,
  ownerOpenId: string,
  manager: { name: string; email?: string | null }
) {
  return {
    farmId: input.farmId,
    dealId: input.dealId ?? null,
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
    edoProvider:
      input.edoStatus === "yes" ? toNullable(input.edoProvider) : null,
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
    .where(
      and(eq(orderRequests.id, id), eq(orderRequests.ownerOpenId, ownerOpenId))
    )
    .limit(1);
  const entry = rows[0];
  if (!entry) return undefined;

  const [items, requestShipments, shipmentRows] = await Promise.all([
    db
      .select()
      .from(orderRequestItems)
      .where(eq(orderRequestItems.requestId, id))
      .orderBy(orderRequestItems.id),
    db
      .select()
      .from(shipments)
      .where(eq(shipments.requestId, id))
      .orderBy(desc(shipments.shipmentDate)),
    db
      .select({ item: shipmentItems })
      .from(shipmentItems)
      .innerJoin(shipments, eq(shipmentItems.shipmentId, shipments.id))
      .where(eq(shipments.requestId, id)),
  ]);
  const shipmentItemsByShipment = new Map<
    number,
    (typeof shipmentRows)[number]["item"][]
  >();
  shipmentRows.forEach(({ item }) =>
    shipmentItemsByShipment.set(item.shipmentId, [
      ...(shipmentItemsByShipment.get(item.shipmentId) ?? []),
      item,
    ])
  );
  const shippedByRequestItem = new Map<number, number>();
  shipmentRows.forEach(({ item }) =>
    shippedByRequestItem.set(
      item.requestItemId,
      (shippedByRequestItem.get(item.requestItemId) ?? 0) +
        Number(item.quantity)
    )
  );

  return {
    ...entry.request,
    farm: entry.farm,
    items: items.map(item => ({
      ...item,
      shippedQuantity: shippedByRequestItem.get(item.id) ?? 0,
    })),
    shipments: requestShipments.map(shipment => ({
      ...shipment,
      items: shipmentItemsByShipment.get(shipment.id) ?? [],
    })),
  };
}

export async function createOrderRequest(
  input: OrderRequestInput,
  ownerOpenId: string,
  manager: { name: string; email?: string | null }
) {
  const db = await getDb();
  if (!db) throw new Error("База данных недоступна");
  const farm = await getFarmById(input.farmId, ownerOpenId);
  if (!farm) return undefined;
  const requestId = await db.transaction(async tx => {
    const created = await tx
      .insert(orderRequests)
      .values(requestValues(input, ownerOpenId, manager));
    const id = Number(created[0].insertId);
    await tx
      .insert(orderRequestItems)
      .values(requestItemsValues(id, input.items));
    return id;
  });
  return getOrderRequestById(requestId, ownerOpenId);
}

export async function updateOrderRequest(
  id: number,
  input: OrderRequestInput,
  ownerOpenId: string,
  manager: { name: string; email?: string | null }
) {
  const db = await getDb();
  if (!db) throw new Error("База данных недоступна");
  const existing = await getOrderRequestById(id, ownerOpenId);
  if (!existing || existing.shipments.length > 0) return undefined;
  const farm = await getFarmById(input.farmId, ownerOpenId);
  if (!farm) return undefined;
  await db.transaction(async tx => {
    await tx
      .update(orderRequests)
      .set(requestValues(input, ownerOpenId, manager))
      .where(
        and(
          eq(orderRequests.id, id),
          eq(orderRequests.ownerOpenId, ownerOpenId)
        )
      );
    await tx
      .delete(orderRequestItems)
      .where(eq(orderRequestItems.requestId, id));
    await tx
      .insert(orderRequestItems)
      .values(requestItemsValues(id, input.items));
  });
  return getOrderRequestById(id, ownerOpenId);
}

export async function removeOrderRequest(id: number, ownerOpenId: string) {
  const db = await getDb();
  if (!db) throw new Error("База данных недоступна");
  const existing = await getOrderRequestById(id, ownerOpenId);
  if (!existing || existing.shipments.length > 0) return undefined;
  await db.delete(orderRequestItems).where(eq(orderRequestItems.requestId, id));
  await db
    .delete(orderRequests)
    .where(
      and(eq(orderRequests.id, id), eq(orderRequests.ownerOpenId, ownerOpenId))
    );
  return existing;
}

export async function createShipment(
  requestId: number,
  input: ShipmentInput,
  ownerOpenId: string
) {
  const db = await getDb();
  if (!db) throw new Error("База данных недоступна");
  const request = await getOrderRequestById(requestId, ownerOpenId);
  if (!request || request.status === "draft" || request.status === "cancelled")
    return undefined;
  const itemsById = new Map(request.items.map(item => [item.id, item]));
  if (input.items.some(item => !itemsById.has(item.requestItemId)))
    return undefined;
  if (
    input.items.some(
      item =>
        item.quantity +
          Number(itemsById.get(item.requestItemId)?.shippedQuantity ?? 0) >
        Number(itemsById.get(item.requestItemId)?.quantity ?? 0) + 0.0001
    )
  )
    return undefined;

  await db.transaction(async tx => {
    const created = await tx.insert(shipments).values({
      requestId,
      shipmentDate: input.shipmentDate,
      documentNumber: toNullable(input.documentNumber),
      notes: toNullable(input.notes),
    });
    const shipmentId = Number(created[0].insertId);
    await tx.insert(shipmentItems).values(
      input.items.map(item => {
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
      })
    );
    const allShipped = request.items.every(
      item =>
        Number(item.shippedQuantity) +
          (input.items.find(
            shipmentItem => shipmentItem.requestItemId === item.id
          )?.quantity ?? 0) >=
        Number(item.quantity) - 0.0001
    );
    await tx
      .update(orderRequests)
      .set({ status: allShipped ? "shipped" : "partial" })
      .where(
        and(
          eq(orderRequests.id, requestId),
          eq(orderRequests.ownerOpenId, ownerOpenId)
        )
      );
  });
  return getOrderRequestById(requestId, ownerOpenId);
}

export async function listSupportTickets(
  ownerOpenId: string,
  includeAll = false
) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({ ticket: supportTickets, sender: users })
    .from(supportTickets)
    .leftJoin(users, eq(supportTickets.ownerOpenId, users.openId))
    .where(includeAll ? undefined : eq(supportTickets.ownerOpenId, ownerOpenId))
    .orderBy(desc(supportTickets.updatedAt));
  return rows.map(({ ticket, sender }) => ({
    ...ticket,
    senderName:
      sender?.displayName?.trim() ||
      sender?.name?.trim() ||
      sender?.email?.split("@")[0] ||
      "Сотрудник",
    senderEmail: sender?.email ?? null,
  }));
}

export async function getSupportTicketById(
  id: number,
  viewerOpenId: string,
  includeAll = false
) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select({ ticket: supportTickets, sender: users })
    .from(supportTickets)
    .leftJoin(users, eq(supportTickets.ownerOpenId, users.openId))
    .where(
      includeAll
        ? eq(supportTickets.id, id)
        : and(
            eq(supportTickets.id, id),
            eq(supportTickets.ownerOpenId, viewerOpenId)
          )
    )
    .limit(1);
  const entry = rows[0];
  if (!entry) return undefined;
  const [attachments, messages] = await Promise.all([
    db
      .select()
      .from(supportAttachments)
      .where(eq(supportAttachments.ticketId, id))
      .orderBy(supportAttachments.id),
    db
      .select({ message: supportMessages, author: users })
      .from(supportMessages)
      .leftJoin(users, eq(supportMessages.authorOpenId, users.openId))
      .where(eq(supportMessages.ticketId, id))
      .orderBy(supportMessages.createdAt, supportMessages.id),
  ]);
  return {
    ...entry.ticket,
    senderName:
      entry.sender?.displayName?.trim() ||
      entry.sender?.name?.trim() ||
      entry.sender?.email?.split("@")[0] ||
      "Сотрудник",
    senderEmail: entry.sender?.email ?? null,
    attachments: attachments.map(attachment => ({
      ...attachment,
      url: `/manus-storage/${attachment.storageKey}`,
    })),
    messages: messages.map(({ message, author }) => ({
      ...message,
      authorName:
        author?.displayName?.trim() ||
        author?.name?.trim() ||
        author?.email?.split("@")[0] ||
        "Сотрудник",
      authorEmail: author?.email ?? null,
    })),
  };
}

export async function createSupportTicket(
  input: SupportTicketInput,
  ownerOpenId: string
) {
  const db = await getDb();
  if (!db) throw new Error("База данных недоступна");
  const uploads = await Promise.all(
    (input.attachments ?? []).map(async attachment => {
      const data = Buffer.from(attachment.dataBase64, "base64");
      const stored = await storagePut(
        `support/${ownerOpenId}/${Date.now()}-${safeAttachmentName(attachment.fileName)}`,
        data,
        attachment.mimeType
      );
      return {
        fileName: attachment.fileName.trim(),
        storageKey: stored.key,
        mimeType: attachment.mimeType,
        sizeBytes: data.byteLength,
      };
    })
  );
  const ticketId = await db.transaction(async tx => {
    const created = await tx.insert(supportTickets).values({
      ownerOpenId,
      subject: input.subject?.trim() || "Обращение в поддержку",
      message: input.message.trim(),
      pagePath: input.pagePath.trim() || "/",
    });
    const id = Number(created[0].insertId);
    if (uploads.length)
      await tx
        .insert(supportAttachments)
        .values(uploads.map(attachment => ({ ...attachment, ticketId: id })));
    return id;
  });
  return getSupportTicketById(ticketId, ownerOpenId);
}

export async function replySupportTicket(input: SupportReplyInput) {
  const db = await getDb();
  if (!db) throw new Error("База данных недоступна");
  const ticketRows = await db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.id, input.ticketId))
    .limit(1);
  const ticket = ticketRows[0];
  if (!ticket) return undefined;
  const message = input.message.trim();
  await db.transaction(async tx => {
    await tx
      .insert(supportMessages)
      .values({
        ticketId: input.ticketId,
        authorOpenId: input.responderOpenId,
        message,
      });
    await tx
      .update(supportTickets)
      .set({ status: "in_progress", updatedAt: new Date() })
      .where(eq(supportTickets.id, input.ticketId));
    if (ticket.ownerOpenId !== input.responderOpenId) {
      await tx.insert(notifications).values({
        recipientOpenId: ticket.ownerOpenId,
        kind: "system",
        title: "Ответ на обращение",
        body: message,
        href: `/support?ticketId=${input.ticketId}`,
      });
    }
  });
  return getSupportTicketById(input.ticketId, input.responderOpenId, true);
}

export async function updateSupportTicketStatus(
  id: number,
  status: "new" | "in_progress" | "resolved"
) {
  const db = await getDb();
  if (!db) throw new Error("База данных недоступна");
  await db
    .update(supportTickets)
    .set({ status })
    .where(eq(supportTickets.id, id));
  const rows = await db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.id, id))
    .limit(1);
  return rows[0];
}

export async function listFarms(ownerOpenId: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(farms)
    .where(eq(farms.ownerOpenId, ownerOpenId))
    .orderBy(desc(farms.updatedAt));
}

export async function getFarmById(id: number, ownerOpenId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(farms)
    .where(and(eq(farms.id, id), eq(farms.ownerOpenId, ownerOpenId)))
    .limit(1);
  return result[0];
}

export async function createFarm(input: FarmInput, ownerOpenId: string) {
  const db = await getDb();
  if (!db) throw new Error("База данных недоступна");
  const result = await db
    .insert(farms)
    .values(toFarmValues(input, ownerOpenId));
  return getFarmById(Number(result[0].insertId), ownerOpenId);
}

export async function createFarms(inputs: FarmInput[], ownerOpenId: string) {
  const db = await getDb();
  if (!db) throw new Error("База данных недоступна");
  if (inputs.length === 0) return { created: 0 };
  await db
    .insert(farms)
    .values(inputs.map(input => toFarmValues(input, ownerOpenId)));
  return { created: inputs.length };
}

export async function updateFarm(
  id: number,
  input: FarmInput,
  ownerOpenId: string
) {
  const db = await getDb();
  if (!db) throw new Error("База данных недоступна");
  const { ownerOpenId: _ownerOpenId, ...farmValues } = toFarmValues(
    input,
    ownerOpenId
  );
  await db
    .update(farms)
    .set(farmValues)
    .where(and(eq(farms.id, id), eq(farms.ownerOpenId, ownerOpenId)));
  return getFarmById(id, ownerOpenId);
}

export async function updateFarmStage(
  id: number,
  salesStage: FarmInput["salesStage"],
  ownerOpenId: string
) {
  const db = await getDb();
  if (!db) throw new Error("База данных недоступна");
  await db
    .update(farms)
    .set({ salesStage })
    .where(and(eq(farms.id, id), eq(farms.ownerOpenId, ownerOpenId)));
  return getFarmById(id, ownerOpenId);
}

export async function removeFarm(id: number, ownerOpenId: string) {
  const db = await getDb();
  if (!db) throw new Error("База данных недоступна");
  await db
    .delete(farms)
    .where(and(eq(farms.id, id), eq(farms.ownerOpenId, ownerOpenId)));
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

export async function createProposal(
  input: ProposalInput,
  ownerOpenId: string
) {
  const db = await getDb();
  if (!db) throw new Error("База данных недоступна");
  const result = await db.insert(proposals).values(toProposalValues(input));
  return getProposalById(Number(result[0].insertId), ownerOpenId);
}

export async function updateProposal(
  id: number,
  input: ProposalInput,
  ownerOpenId: string
) {
  const db = await getDb();
  if (!db) throw new Error("База данных недоступна");
  const existingProposal = await getProposalById(id, ownerOpenId);
  if (!existingProposal) return undefined;
  const farm = await getFarmById(input.farmId, ownerOpenId);
  if (!farm) return undefined;
  await db
    .update(proposals)
    .set(toProposalValues(input))
    .where(eq(proposals.id, id));
  return getProposalById(id, ownerOpenId);
}

export async function removeProposal(id: number, ownerOpenId: string) {
  const db = await getDb();
  if (!db) throw new Error("База данных недоступна");
  const existingProposal = await getProposalById(id, ownerOpenId);
  if (!existingProposal) return undefined;
  await db.delete(proposals).where(eq(proposals.id, id));
  return existingProposal;
}

export async function updateProposalStatus(
  id: number,
  status: ProposalInput["status"],
  ownerOpenId: string
) {
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
  const result = await db
    .update(farms)
    .set({ ownerOpenId })
    .where(isNull(farms.ownerOpenId));
  return { claimed: Number(result[0].affectedRows ?? 0) };
}

type AccessRequestInput = {
  requestedName: string;
  position: string;
  email: string;
  regionId: number;
};

const normalizeAccessEmail = (email: string) => email.trim().toLowerCase();

export async function recordUserActivity(openId: string, now = new Date()) {
  const db = await getDb();
  if (!db) return undefined;
  const current = await db
    .select({ lastActivityAt: users.lastActivityAt })
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);
  if (!current[0]) return undefined;
  const creditedSeconds = creditedActiveSeconds(current[0].lastActivityAt, now);
  await db
    .update(users)
    .set({
      lastActivityAt: now,
      ...(creditedSeconds > 0
        ? { activeSeconds: sql`${users.activeSeconds} + ${creditedSeconds}` }
        : {}),
    })
    .where(eq(users.openId, openId));
  return { lastActivityAt: now, creditedSeconds };
}

export async function getUserActivity(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select({
      lastSignedIn: users.lastSignedIn,
      lastActivityAt: users.lastActivityAt,
      activeSeconds: users.activeSeconds,
    })
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);
  return rows[0];
}

export async function requestAccess(input: AccessRequestInput) {
  const db = await getDb();
  if (!db) throw new Error("База данных недоступна");
  const email = normalizeAccessEmail(input.email);
  const requestedName = input.requestedName.trim();
  const region = await getRegionById(input.regionId);
  if (!region || region.isActive !== 1)
    throw new Error("Выберите действующий регион");
  const existing = await db
    .select()
    .from(accessRequests)
    .where(eq(accessRequests.email, email))
    .limit(1);

  if (existing[0]?.status === "pending" || existing[0]?.status === "activated")
    return existing[0];
  if (existing[0]) {
    await db
      .update(accessRequests)
      .set({
        requestedName,
        position: input.position.trim(),
        regionId: input.regionId,
        status: "pending",
        reviewedByOpenId: null,
        reviewedAt: null,
        inviteCodeHash: null,
        inviteCodeExpiresAt: null,
        inviteCodeUsedAt: null,
        localOpenId: null,
      })
      .where(eq(accessRequests.id, existing[0].id));
    const refreshed = await db
      .select()
      .from(accessRequests)
      .where(eq(accessRequests.id, existing[0].id))
      .limit(1);
    return refreshed[0];
  }

  const result = await db
    .insert(accessRequests)
    .values({
      email,
      requestedName,
      position: input.position.trim(),
      regionId: input.regionId,
      status: "pending",
    });
  const created = await db
    .select()
    .from(accessRequests)
    .where(eq(accessRequests.id, Number(result[0].insertId)))
    .limit(1);
  return created[0];
}

export async function listAccessRequests() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(accessRequests)
    .orderBy(desc(accessRequests.createdAt));
}

export async function getAccessRequestById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(accessRequests)
    .where(eq(accessRequests.id, id))
    .limit(1);
  return result[0];
}

export async function approveAccessRequest(
  id: number,
  reviewerOpenId: string,
  inviteCode: string,
  inviteCodeHash: string,
  expiresAt: Date
) {
  const db = await getDb();
  if (!db) throw new Error("База данных недоступна");
  const request = await getAccessRequestById(id);
  if (!request || request.status !== "pending") return undefined;
  await db.transaction(async tx => {
    await tx
      .update(accessRequests)
      .set({
        status: "approved",
        reviewedByOpenId: reviewerOpenId,
        reviewedAt: new Date(),
        inviteCodeHash,
        inviteCodeExpiresAt: expiresAt,
        inviteCodeUsedAt: null,
      })
      .where(eq(accessRequests.id, id));
    await tx.insert(inviteCodeHistory).values({
      requestId: id,
      codeHash: inviteCodeHash,
      encryptedCode: encryptInviteCode(inviteCode),
      expiresAt,
      issuedByOpenId: reviewerOpenId,
    });
  });
  return getAccessRequestById(id);
}

export async function listInviteCodeHistory(requestId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select()
    .from(inviteCodeHistory)
    .where(eq(inviteCodeHistory.requestId, requestId))
    .orderBy(desc(inviteCodeHistory.createdAt));
  return rows.map(({ encryptedCode, ...history }) => ({
    ...history,
    code: decryptInviteCode(encryptedCode),
  }));
}

export async function reissueAccessRequest(
  id: number,
  reviewerOpenId: string,
  inviteCode: string,
  inviteCodeHash: string,
  expiresAt: Date
) {
  const db = await getDb();
  if (!db) throw new Error("База данных недоступна");
  const request = await getAccessRequestById(id);
  if (!request || !["approved", "activated"].includes(request.status)) return undefined;
    await db.transaction(async tx => {
      await tx
        .update(accessRequests)
        .set({
          status: "approved",
          reviewedByOpenId: reviewerOpenId,
          reviewedAt: new Date(),
          inviteCodeHash,
          inviteCodeExpiresAt: expiresAt,
          inviteCodeUsedAt: null,
        })
        .where(
        and(eq(accessRequests.id, id), inArray(accessRequests.status, ["approved", "activated"]))
        );
    await tx.insert(inviteCodeHistory).values({
      requestId: id,
      codeHash: inviteCodeHash,
      encryptedCode: encryptInviteCode(inviteCode),
      expiresAt,
      issuedByOpenId: reviewerOpenId,
    });
  });
  return getAccessRequestById(id);
}

export async function rejectAccessRequest(id: number, reviewerOpenId: string) {
  const db = await getDb();
  if (!db) throw new Error("База данных недоступна");
  const request = await getAccessRequestById(id);
  if (!request || request.status !== "pending") return undefined;
  await db
    .update(accessRequests)
    .set({
      status: "rejected",
      reviewedByOpenId: reviewerOpenId,
      reviewedAt: new Date(),
      inviteCodeHash: null,
      inviteCodeExpiresAt: null,
    })
    .where(eq(accessRequests.id, id));
  return getAccessRequestById(id);
}

export async function findActiveInvite(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(accessRequests)
    .where(eq(accessRequests.email, normalizeAccessEmail(email)))
    .limit(1);
  const request = result[0];
  if (
    !request ||
    request.status !== "approved" ||
    !request.inviteCodeHash ||
    !request.inviteCodeExpiresAt ||
    request.inviteCodeExpiresAt.getTime() <= Date.now()
  )
    return undefined;
  return request;
}

export async function consumeInvite(
  id: number,
  inviteCodeHash: string,
  localOpenId: string
) {
  const db = await getDb();
  if (!db) throw new Error("База данных недоступна");
  const usedAt = new Date();
  const result = await db.transaction(async tx => {
    const updateResult = await tx
      .update(accessRequests)
      .set({
        status: "activated",
        inviteCodeUsedAt: usedAt,
        localOpenId,
      })
      .where(
        and(
          eq(accessRequests.id, id),
          eq(accessRequests.status, "approved"),
          eq(accessRequests.inviteCodeHash, inviteCodeHash),
          isNull(accessRequests.inviteCodeUsedAt)
        )
      );
    if (Number(updateResult[0].affectedRows ?? 0) !== 1) return false;
    await tx
      .update(inviteCodeHistory)
      .set({ usedAt, usedByOpenId: localOpenId })
      .where(eq(inviteCodeHistory.codeHash, inviteCodeHash));
    return true;
  });
  return result;
}
