import { decimal, index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  /** User-controlled label for the cabinet; OAuth resyncs never overwrite it. */
  displayName: varchar("displayName", { length: 120 }),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const farms = mysqlTable(
  "farms",
  {
    id: int("id").autoincrement().primaryKey(),
    /** Manus OAuth openId владельца. Null допускается только для исторических записей до миграции. */
    ownerOpenId: varchar("ownerOpenId", { length: 64 }),
    name: varchar("name", { length: 255 }).notNull(),
    district: varchar("district", { length: 160 }),
    settlement: varchar("settlement", { length: 160 }),
    contactName: varchar("contactName", { length: 160 }),
    contactRole: varchar("contactRole", { length: 160 }),
    phone: varchar("phone", { length: 64 }),
    email: varchar("email", { length: 320 }),
    totalArea: decimal("totalArea", { precision: 12, scale: 1 }).notNull().default("0"),
    crops: text("crops"),
    technology: varchar("technology", { length: 160 }),
    salesStage: mysqlEnum("salesStage", ["lead", "diagnostics", "proposal", "negotiation", "client"]).notNull().default("lead"),
    potentialValue: decimal("potentialValue", { precision: 14, scale: 2 }).notNull().default("0"),
    nextAction: text("nextAction"),
    nextActionAt: timestamp("nextActionAt"),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("farms_owner_updated_at_idx").on(table.ownerOpenId, table.updatedAt),
    index("farms_sales_stage_idx").on(table.salesStage),
    index("farms_updated_at_idx").on(table.updatedAt),
  ],
);

export const proposals = mysqlTable(
  "proposals",
  {
    id: int("id").autoincrement().primaryKey(),
    farmId: int("farmId").notNull().references(() => farms.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    crop: varchar("crop", { length: 160 }).notNull(),
    technology: varchar("technology", { length: 160 }),
    area: decimal("area", { precision: 12, scale: 1 }).notNull(),
    costPerHectare: decimal("costPerHectare", { precision: 14, scale: 2 }).notNull().default("0"),
    totalCost: decimal("totalCost", { precision: 14, scale: 2 }).notNull().default("0"),
    status: mysqlEnum("status", ["draft", "sent", "approved", "declined"]).notNull().default("draft"),
    schemeJson: text("schemeJson").notNull(),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("proposals_farm_idx").on(table.farmId), index("proposals_status_idx").on(table.status)],
);

export const accessRequests = mysqlTable(
  "accessRequests",
  {
    id: int("id").autoincrement().primaryKey(),
    email: varchar("email", { length: 320 }).notNull(),
    requestedName: varchar("requestedName", { length: 120 }).notNull(),
    status: mysqlEnum("status", ["pending", "approved", "rejected", "activated"]).notNull().default("pending"),
    reviewedByOpenId: varchar("reviewedByOpenId", { length: 64 }),
    reviewedAt: timestamp("reviewedAt"),
    inviteCodeHash: varchar("inviteCodeHash", { length: 128 }),
    inviteCodeExpiresAt: timestamp("inviteCodeExpiresAt"),
    inviteCodeUsedAt: timestamp("inviteCodeUsedAt"),
    localOpenId: varchar("localOpenId", { length: 64 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("access_requests_email_unique").on(table.email),
    index("access_requests_status_created_idx").on(table.status, table.createdAt),
  ],
);

export type Farm = typeof farms.$inferSelect;
export type InsertFarm = typeof farms.$inferInsert;
export type Proposal = typeof proposals.$inferSelect;
export type InsertProposal = typeof proposals.$inferInsert;
export type AccessRequest = typeof accessRequests.$inferSelect;
export type InsertAccessRequest = typeof accessRequests.$inferInsert;
