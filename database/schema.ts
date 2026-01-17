import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
} from "drizzle-orm/mysql-core";

/**
 * Admin Portal Database Schema
 * Stores information about clients, their deployments, and analytics
 */

/**
 * Clients table - stores information about each client instance
 */
export const clients = mysqlTable("clients", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  domain: varchar("domain", { length: 255 }),
  
  // Railway configuration
  railwayProjectId: varchar("railway_project_id", { length: 100 }),
  railwayProjectUrl: varchar("railway_project_url", { length: 500 }),
  railwayEnvironmentId: varchar("railway_environment_id", { length: 100 }),
  railwayServiceId: varchar("railway_service_id", { length: 100 }),
  serviceUrl: varchar("service_url", { length: 500 }),
  
  // Status
  status: mysqlEnum("status", ["active", "inactive", "deploying", "failed"]).default("inactive").notNull(),
  lastDeployedAt: timestamp("last_deployed_at"),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  createdBy: varchar("created_by", { length: 100 }),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

/**
 * LendPro configuration for each client
 */
export const clientLendproConfig = mysqlTable("client_lendpro_config", {
  id: int("id").autoincrement().primaryKey(),
  clientId: varchar("client_id", { length: 36 }).notNull().references(() => clients.id, { onDelete: "cascade" }),
  
  apiUrl: varchar("api_url", { length: 500 }).notNull().default("https://apisg.mylendpro.com"),
  username: varchar("username", { length: 255 }).notNull(),
  password: text("password").notNull(), // Will be encrypted
  storeId: varchar("store_id", { length: 100 }).notNull(),
  salesId: varchar("sales_id", { length: 100 }).notNull(),
  salesName: varchar("sales_name", { length: 255 }).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type ClientLendproConfig = typeof clientLendproConfig.$inferSelect;
export type InsertClientLendproConfig = typeof clientLendproConfig.$inferInsert;

/**
 * Branding configuration for each client
 */
export const clientBranding = mysqlTable("client_branding", {
  id: int("id").autoincrement().primaryKey(),
  clientId: varchar("client_id", { length: 36 }).notNull().references(() => clients.id, { onDelete: "cascade" }),
  
  logoUrl: varchar("logo_url", { length: 500 }),
  faviconUrl: varchar("favicon_url", { length: 500 }),
  primaryColor: varchar("primary_color", { length: 7 }),
  secondaryColor: varchar("secondary_color", { length: 7 }),
  companyName: varchar("company_name", { length: 255 }),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type ClientBranding = typeof clientBranding.$inferSelect;
export type InsertClientBranding = typeof clientBranding.$inferInsert;

/**
 * Feature flags for each client
 */
export const clientFeatures = mysqlTable("client_features", {
  id: int("id").autoincrement().primaryKey(),
  clientId: varchar("client_id", { length: 36 }).notNull().references(() => clients.id, { onDelete: "cascade" }),
  
  preApproval: boolean("pre_approval").default(true).notNull(),
  cartFinancing: boolean("cart_financing").default(true).notNull(),
  orderTracking: boolean("order_tracking").default(true).notNull(),
  customerAccounts: boolean("customer_accounts").default(true).notNull(),
  productComparison: boolean("product_comparison").default(true).notNull(),
  cartOnly: boolean("cart_only").default(false).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type ClientFeatures = typeof clientFeatures.$inferSelect;
export type InsertClientFeatures = typeof clientFeatures.$inferInsert;

/**
 * Visualizer configuration for each client
 */
export const clientVisualizer = mysqlTable("client_visualizer", {
  id: int("id").autoincrement().primaryKey(),
  clientId: varchar("client_id", { length: 36 }).notNull().references(() => clients.id, { onDelete: "cascade" }),
  
  enabled: boolean("enabled").default(true).notNull(),
  embedCode: text("embed_code"),
  autoSyncApiKey: varchar("autosync_api_key", { length: 500 }),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type ClientVisualizer = typeof clientVisualizer.$inferSelect;
export type InsertClientVisualizer = typeof clientVisualizer.$inferInsert;

/**
 * Deployment history
 */
export const deployments = mysqlTable("deployments", {
  id: varchar("id", { length: 36 }).primaryKey(),
  clientId: varchar("client_id", { length: 36 }).notNull().references(() => clients.id, { onDelete: "cascade" }),
  
  status: mysqlEnum("status", [
    "pending",
    "building",
    "deploying",
    "success",
    "failed",
    "cancelled"
  ]).default("pending").notNull(),
  
  deploymentType: mysqlEnum("deployment_type", [
    "initial",
    "update",
    "redeploy",
    "rollback"
  ]).default("update").notNull(),
  
  railwayDeploymentId: varchar("railway_deployment_id", { length: 100 }),
  logs: text("logs"),
  errorMessage: text("error_message"),
  
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  deployedBy: varchar("deployed_by", { length: 100 }),
});

export type Deployment = typeof deployments.$inferSelect;
export type InsertDeployment = typeof deployments.$inferInsert;

/**
 * Client analytics - aggregated daily metrics
 */
export const clientAnalytics = mysqlTable("client_analytics", {
  id: int("id").autoincrement().primaryKey(),
  clientId: varchar("client_id", { length: 36 }).notNull().references(() => clients.id, { onDelete: "cascade" }),
  
  date: timestamp("date").notNull(),
  
  // Order metrics
  totalOrders: int("total_orders").default(0).notNull(),
  totalRevenue: decimal("total_revenue", { precision: 12, scale: 2 }).default("0.00").notNull(),
  averageOrderValue: decimal("average_order_value", { precision: 10, scale: 2 }).default("0.00").notNull(),
  
  // LendPro metrics
  lendproApplications: int("lendpro_applications").default(0).notNull(),
  lendproApprovals: int("lendpro_approvals").default(0).notNull(),
  lendproDeclines: int("lendpro_declines").default(0).notNull(),
  lendproConversionRate: decimal("lendpro_conversion_rate", { precision: 5, scale: 2 }).default("0.00").notNull(),
  
  // Customer metrics
  newCustomers: int("new_customers").default(0).notNull(),
  returningCustomers: int("returning_customers").default(0).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type ClientAnalytics = typeof clientAnalytics.$inferSelect;
export type InsertClientAnalytics = typeof clientAnalytics.$inferInsert;

/**
 * Admin users for the portal
 */
export const adminUsers = mysqlTable("admin_users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("open_id", { length: 64 }).notNull().unique(),
  
  name: text("name"),
  email: varchar("email", { length: 320 }).notNull(),
  
  role: mysqlEnum("role", ["super_admin", "admin", "viewer"]).default("viewer").notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("last_signed_in").defaultNow().notNull(),
});

export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = typeof adminUsers.$inferInsert;

/**
 * Audit log for tracking admin actions
 */
export const auditLog = mysqlTable("audit_log", {
  id: int("id").autoincrement().primaryKey(),
  adminUserId: int("admin_user_id").references(() => adminUsers.id),
  
  action: varchar("action", { length: 100 }).notNull(), // e.g., "create_client", "delete_client", "update_config"
  resourceType: varchar("resource_type", { length: 50 }).notNull(), // e.g., "client", "deployment"
  resourceId: varchar("resource_id", { length: 36 }),
  
  details: text("details"), // JSON string with additional details
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AuditLog = typeof auditLog.$inferSelect;
export type InsertAuditLog = typeof auditLog.$inferInsert;
