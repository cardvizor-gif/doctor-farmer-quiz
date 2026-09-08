import { decimal, index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const regions = mysqlTable("regions", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull().unique(),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Region = typeof regions.$inferSelect;
export type InsertRegion = typeof regions.$inferInsert;

export const workspaces = mysqlTable(
  "workspaces",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 160 }).notNull(),
    regionId: int("regionId").notNull().references(() => regions.id, { onDelete: "restrict" }),
    isActive: int("isActive").default(1).notNull(),
    createdByOpenId: varchar("createdByOpenId", { length: 64 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("workspaces_region_unique").on(table.regionId), index("workspaces_active_idx").on(table.isActive)],
);

export type Workspace = typeof workspaces.$inferSelect;
export type InsertWorkspace = typeof workspaces.$inferInsert;

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
  position: varchar("position", { length: 160 }),
  /** Primary business region selected during access request; nullable for historical users. */
  primaryRegionId: int("primaryRegionId").references(() => regions.id, { onDelete: "set null" }),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  /** Explicit owner marker survives OAuth re-login and is never editable from the admin UI. */
  isSuperuser: int("isSuperuser").default(0).notNull(),
  status: mysqlEnum("status", ["active", "archived"]).default("active").notNull(),
  archivedAt: timestamp("archivedAt"),
  archivedByOpenId: varchar("archivedByOpenId", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  /** Last authenticated cabinet activity ping; null for users who have not visited after this feature was enabled. */
  lastActivityAt: timestamp("lastActivityAt"),
  /** Accumulated active seconds, counted only across short visible activity intervals. */
  activeSeconds: int("activeSeconds").default(0).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const workspaceMembers = mysqlTable(
  "workspaceMembers",
  {
    id: int("id").autoincrement().primaryKey(),
    workspaceId: int("workspaceId").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    userOpenId: varchar("userOpenId", { length: 64 }).notNull().references(() => users.openId, { onDelete: "cascade" }),
    membershipRole: mysqlEnum("membershipRole", ["manager", "rop", "cluster_director", "deputy_ceo", "ceo"]).notNull().default("manager"),
    assignedByOpenId: varchar("assignedByOpenId", { length: 64 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("workspace_members_user_unique").on(table.workspaceId, table.userOpenId), index("workspace_members_user_idx").on(table.userOpenId), index("workspace_members_role_idx").on(table.membershipRole)],
);

export type WorkspaceMember = typeof workspaceMembers.$inferSelect;
export type InsertWorkspaceMember = typeof workspaceMembers.$inferInsert;

export const userPermissions = mysqlTable(
  "userPermissions",
  {
    id: int("id").autoincrement().primaryKey(),
    userOpenId: varchar("userOpenId", { length: 64 }).notNull(),
    permission: varchar("permission", { length: 64 }).notNull(),
    grantedByOpenId: varchar("grantedByOpenId", { length: 64 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("user_permissions_user_permission_unique").on(table.userOpenId, table.permission),
    index("user_permissions_user_idx").on(table.userOpenId),
  ],
);

export type UserPermission = typeof userPermissions.$inferSelect;
export type InsertUserPermission = typeof userPermissions.$inferInsert;

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

export const orderRequests = mysqlTable(
  "orderRequests",
  {
    id: int("id").autoincrement().primaryKey(),
    farmId: int("farmId").notNull().references(() => farms.id, { onDelete: "cascade" }),
    ownerOpenId: varchar("ownerOpenId", { length: 64 }).notNull(),
    requestDate: timestamp("requestDate").notNull(),
    buyerName: varchar("buyerName", { length: 255 }).notNull(),
    managerName: varchar("managerName", { length: 120 }).notNull(),
    managerEmail: varchar("managerEmail", { length: 320 }),
    segment: mysqlEnum("segment", ["agroholding", "dealer", "large", "medium", "small"]).notNull().default("medium"),
    paymentTerms: varchar("paymentTerms", { length: 32 }).notNull().default("100%"),
    paymentDueDate: timestamp("paymentDueDate"),
    supplyDocuments: text("supplyDocuments"),
    deliveryDueDate: timestamp("deliveryDueDate"),
    edoStatus: mysqlEnum("edoStatus", ["yes", "no"]).notNull().default("no"),
    edoProvider: varchar("edoProvider", { length: 120 }),
    status: mysqlEnum("status", ["draft", "submitted", "partial", "shipped", "cancelled"]).notNull().default("draft"),
    totalAmount: decimal("totalAmount", { precision: 16, scale: 2 }).notNull().default("0"),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("order_requests_owner_updated_idx").on(table.ownerOpenId, table.updatedAt),
    index("order_requests_farm_idx").on(table.farmId),
    index("order_requests_status_idx").on(table.status),
  ],
);

export const orderRequestItems = mysqlTable(
  "orderRequestItems",
  {
    id: int("id").autoincrement().primaryKey(),
    requestId: int("requestId").notNull().references(() => orderRequests.id, { onDelete: "cascade" }),
    productName: varchar("productName", { length: 255 }).notNull(),
    unit: varchar("unit", { length: 24 }).notNull().default("шт."),
    quantity: decimal("quantity", { precision: 14, scale: 3 }).notNull(),
    unitPrice: decimal("unitPrice", { precision: 16, scale: 2 }).notNull().default("0"),
    lineTotal: decimal("lineTotal", { precision: 16, scale: 2 }).notNull().default("0"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("order_request_items_request_idx").on(table.requestId)],
);

export const shipments = mysqlTable(
  "shipments",
  {
    id: int("id").autoincrement().primaryKey(),
    requestId: int("requestId").notNull().references(() => orderRequests.id, { onDelete: "cascade" }),
    shipmentDate: timestamp("shipmentDate").notNull(),
    documentNumber: varchar("documentNumber", { length: 120 }),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("shipments_request_date_idx").on(table.requestId, table.shipmentDate)],
);

export const shipmentItems = mysqlTable(
  "shipmentItems",
  {
    id: int("id").autoincrement().primaryKey(),
    shipmentId: int("shipmentId").notNull().references(() => shipments.id, { onDelete: "cascade" }),
    requestItemId: int("requestItemId").notNull().references(() => orderRequestItems.id, { onDelete: "restrict" }),
    productName: varchar("productName", { length: 255 }).notNull(),
    unit: varchar("unit", { length: 24 }).notNull().default("шт."),
    quantity: decimal("quantity", { precision: 14, scale: 3 }).notNull(),
    unitPrice: decimal("unitPrice", { precision: 16, scale: 2 }).notNull().default("0"),
    lineTotal: decimal("lineTotal", { precision: 16, scale: 2 }).notNull().default("0"),
  },
  table => [index("shipment_items_shipment_idx").on(table.shipmentId), index("shipment_items_request_item_idx").on(table.requestItemId)],
);

export const supportTickets = mysqlTable(
  "supportTickets",
  {
    id: int("id").autoincrement().primaryKey(),
    ownerOpenId: varchar("ownerOpenId", { length: 64 }).notNull(),
    subject: varchar("subject", { length: 255 }).notNull(),
    message: text("message").notNull(),
    pagePath: varchar("pagePath", { length: 255 }).notNull().default("/"),
    status: mysqlEnum("status", ["new", "in_progress", "resolved"]).notNull().default("new"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    index("support_tickets_owner_updated_idx").on(table.ownerOpenId, table.updatedAt),
    index("support_tickets_status_updated_idx").on(table.status, table.updatedAt),
  ],
);

export const supportAttachments = mysqlTable(
  "supportAttachments",
  {
    id: int("id").autoincrement().primaryKey(),
    ticketId: int("ticketId").notNull().references(() => supportTickets.id, { onDelete: "cascade" }),
    fileName: varchar("fileName", { length: 255 }).notNull(),
    storageKey: varchar("storageKey", { length: 512 }).notNull(),
    mimeType: varchar("mimeType", { length: 160 }).notNull(),
    sizeBytes: int("sizeBytes").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("support_attachments_ticket_idx").on(table.ticketId)],
);

export const supportMessages = mysqlTable(
  "supportMessages",
  {
    id: int("id").autoincrement().primaryKey(),
    ticketId: int("ticketId").notNull().references(() => supportTickets.id, { onDelete: "cascade" }),
    authorOpenId: varchar("authorOpenId", { length: 64 }).notNull().references(() => users.openId, { onDelete: "restrict" }),
    message: text("message").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("support_messages_ticket_created_idx").on(table.ticketId, table.createdAt), index("support_messages_author_idx").on(table.authorOpenId)],
);

export type SupportMessage = typeof supportMessages.$inferSelect;
export type InsertSupportMessage = typeof supportMessages.$inferInsert;

export const accessRequests = mysqlTable(
  "accessRequests",
  {
    id: int("id").autoincrement().primaryKey(),
    email: varchar("email", { length: 320 }).notNull(),
    requestedName: varchar("requestedName", { length: 120 }).notNull(),
    /** Historical requests may predate the position and region fields; new requests validate them at the API boundary. */
    position: varchar("position", { length: 160 }),
    regionId: int("regionId").references(() => regions.id, { onDelete: "set null" }),
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

export const salesTasks = mysqlTable(
  "salesTasks",
  {
    id: int("id").autoincrement().primaryKey(),
    workspaceId: int("workspaceId").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    creatorOpenId: varchar("creatorOpenId", { length: 64 }).notNull().references(() => users.openId, { onDelete: "restrict" }),
    assigneeOpenId: varchar("assigneeOpenId", { length: 64 }).notNull().references(() => users.openId, { onDelete: "restrict" }),
    farmId: int("farmId").references(() => farms.id, { onDelete: "set null" }),
    proposalId: int("proposalId").references(() => proposals.id, { onDelete: "set null" }),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    dueAt: timestamp("dueAt"),
    priority: mysqlEnum("priority", ["low", "normal", "high"]).notNull().default("normal"),
    status: mysqlEnum("status", ["todo", "in_progress", "done", "cancelled"]).notNull().default("todo"),
    completedAt: timestamp("completedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("sales_tasks_workspace_due_idx").on(table.workspaceId, table.dueAt), index("sales_tasks_assignee_status_idx").on(table.assigneeOpenId, table.status), index("sales_tasks_creator_idx").on(table.creatorOpenId)],
);

export type SalesTask = typeof salesTasks.$inferSelect;
export type InsertSalesTask = typeof salesTasks.$inferInsert;

export const notifications = mysqlTable(
  "notifications",
  {
    id: int("id").autoincrement().primaryKey(),
    recipientOpenId: varchar("recipientOpenId", { length: 64 }).notNull().references(() => users.openId, { onDelete: "cascade" }),
    workspaceId: int("workspaceId").references(() => workspaces.id, { onDelete: "set null" }),
    kind: mysqlEnum("kind", ["task", "news", "system"]).notNull().default("system"),
    title: varchar("title", { length: 255 }).notNull(),
    body: text("body").notNull(),
    href: varchar("href", { length: 255 }),
    isRead: int("isRead").default(0).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("notifications_recipient_read_created_idx").on(table.recipientOpenId, table.isRead, table.createdAt), index("notifications_workspace_idx").on(table.workspaceId)],
);

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

export const inviteCodeHistory = mysqlTable(
  "inviteCodeHistory",
  {
    id: int("id").autoincrement().primaryKey(),
    requestId: int("requestId").notNull().references(() => accessRequests.id, { onDelete: "cascade" }),
    codeHash: varchar("codeHash", { length: 128 }).notNull(),
    encryptedCode: text("encryptedCode").notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    issuedByOpenId: varchar("issuedByOpenId", { length: 64 }).notNull(),
    usedAt: timestamp("usedAt"),
    usedByOpenId: varchar("usedByOpenId", { length: 64 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    index("invite_code_history_request_created_idx").on(table.requestId, table.createdAt),
    index("invite_code_history_hash_idx").on(table.codeHash),
  ],
);

export type Farm = typeof farms.$inferSelect;
export type InsertFarm = typeof farms.$inferInsert;
export type Proposal = typeof proposals.$inferSelect;
export type InsertProposal = typeof proposals.$inferInsert;
export type OrderRequest = typeof orderRequests.$inferSelect;
export type InsertOrderRequest = typeof orderRequests.$inferInsert;
export type OrderRequestItem = typeof orderRequestItems.$inferSelect;
export type InsertOrderRequestItem = typeof orderRequestItems.$inferInsert;
export type Shipment = typeof shipments.$inferSelect;
export type InsertShipment = typeof shipments.$inferInsert;
export type ShipmentItem = typeof shipmentItems.$inferSelect;
export type InsertShipmentItem = typeof shipmentItems.$inferInsert;
export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = typeof supportTickets.$inferInsert;
export type SupportAttachment = typeof supportAttachments.$inferSelect;
export type InsertSupportAttachment = typeof supportAttachments.$inferInsert;
export type AccessRequest = typeof accessRequests.$inferSelect;
export type InsertAccessRequest = typeof accessRequests.$inferInsert;
export type InviteCodeHistory = typeof inviteCodeHistory.$inferSelect;
export type InsertInviteCodeHistory = typeof inviteCodeHistory.$inferInsert;
