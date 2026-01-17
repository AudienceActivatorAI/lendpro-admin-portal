import { drizzle } from "drizzle-orm/mysql2";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import {
  clients,
  clientLendproConfig,
  clientBranding,
  clientFeatures,
  clientVisualizer,
  deployments,
  clientAnalytics,
  adminUsers,
  auditLog,
  type Client,
  type InsertClient,
  type ClientLendproConfig,
  type InsertClientLendproConfig,
  type ClientBranding,
  type InsertClientBranding,
  type ClientFeatures,
  type InsertClientFeatures,
  type ClientVisualizer,
  type InsertClientVisualizer,
  type Deployment,
  type InsertDeployment,
  type ClientAnalytics,
  type InsertClientAnalytics,
  type AdminUser,
  type InsertAdminUser,
  type AuditLog,
  type InsertAuditLog,
} from "./schema";

let _db: ReturnType<typeof drizzle> | null = null;

/**
 * Get database instance
 */
export async function getAdminDb() {
  if (!_db && process.env.ADMIN_DATABASE_URL) {
    try {
      _db = drizzle(process.env.ADMIN_DATABASE_URL);
      console.log("[Admin DB] Connected successfully");
    } catch (error) {
      console.error("[Admin DB] Failed to connect:", error);
      _db = null;
    }
  }
  
  if (!_db) {
    throw new Error("Admin database not configured. Set ADMIN_DATABASE_URL environment variable.");
  }
  
  return _db;
}

/**
 * Client Operations
 */
export async function createClient(
  client: InsertClient,
  lendpro: InsertClientLendproConfig,
  branding?: InsertClientBranding,
  features?: InsertClientFeatures,
  visualizer?: InsertClientVisualizer
): Promise<Client> {
  const db = await getAdminDb();
  
  // Insert client
  await db.insert(clients).values(client);
  
  // Insert LendPro config
  await db.insert(clientLendproConfig).values({
    ...lendpro,
    clientId: client.id,
  });
  
  // Insert branding if provided
  if (branding) {
    await db.insert(clientBranding).values({
      ...branding,
      clientId: client.id,
    });
  }
  
  // Insert features if provided
  if (features) {
    await db.insert(clientFeatures).values({
      ...features,
      clientId: client.id,
    });
  }
  
  // Insert visualizer config if provided
  if (visualizer) {
    await db.insert(clientVisualizer).values({
      ...visualizer,
      clientId: client.id,
    });
  }
  
  // Return created client
  const [created] = await db.select().from(clients).where(eq(clients.id, client.id));
  return created;
}

export async function getClient(clientId: string): Promise<{
  client: Client;
  lendpro: ClientLendproConfig;
  branding?: ClientBranding;
  features?: ClientFeatures;
  visualizer?: ClientVisualizer;
} | null> {
  const db = await getAdminDb();
  
  const [client] = await db.select().from(clients).where(eq(clients.id, clientId));
  if (!client) return null;
  
  const [lendpro] = await db.select().from(clientLendproConfig).where(eq(clientLendproConfig.clientId, clientId));
  const [branding] = await db.select().from(clientBranding).where(eq(clientBranding.clientId, clientId));
  const [features] = await db.select().from(clientFeatures).where(eq(clientFeatures.clientId, clientId));
  const [visualizer] = await db.select().from(clientVisualizer).where(eq(clientVisualizer.clientId, clientId));
  
  return {
    client,
    lendpro,
    branding,
    features,
    visualizer,
  };
}

export async function getAllClients(): Promise<Client[]> {
  const db = await getAdminDb();
  return await db.select().from(clients).orderBy(desc(clients.createdAt));
}

export async function updateClient(
  clientId: string,
  updates: Partial<InsertClient>
): Promise<void> {
  const db = await getAdminDb();
  await db.update(clients).set(updates).where(eq(clients.id, clientId));
}

export async function updateClientLendpro(
  clientId: string,
  updates: Partial<InsertClientLendproConfig>
): Promise<void> {
  const db = await getAdminDb();
  await db.update(clientLendproConfig).set(updates).where(eq(clientLendproConfig.clientId, clientId));
}

export async function updateClientBranding(
  clientId: string,
  updates: Partial<InsertClientBranding>
): Promise<void> {
  const db = await getAdminDb();
  
  // Check if branding exists
  const [existing] = await db.select().from(clientBranding).where(eq(clientBranding.clientId, clientId));
  
  if (existing) {
    await db.update(clientBranding).set(updates).where(eq(clientBranding.clientId, clientId));
  } else {
    await db.insert(clientBranding).values({
      ...updates,
      clientId,
    });
  }
}

export async function updateClientFeatures(
  clientId: string,
  updates: Partial<InsertClientFeatures>
): Promise<void> {
  const db = await getAdminDb();
  
  // Check if features exist
  const [existing] = await db.select().from(clientFeatures).where(eq(clientFeatures.clientId, clientId));
  
  if (existing) {
    await db.update(clientFeatures).set(updates).where(eq(clientFeatures.clientId, clientId));
  } else {
    await db.insert(clientFeatures).values({
      ...updates,
      clientId,
    });
  }
}

export async function updateClientVisualizer(
  clientId: string,
  updates: Partial<InsertClientVisualizer>
): Promise<void> {
  const db = await getAdminDb();
  
  // Check if visualizer config exists
  const [existing] = await db.select().from(clientVisualizer).where(eq(clientVisualizer.clientId, clientId));
  
  if (existing) {
    await db.update(clientVisualizer).set(updates).where(eq(clientVisualizer.clientId, clientId));
  } else {
    await db.insert(clientVisualizer).values({
      ...updates,
      clientId,
    });
  }
}

export async function deleteClient(clientId: string): Promise<void> {
  const db = await getAdminDb();
  // Cascade delete will handle related records
  await db.delete(clients).where(eq(clients.id, clientId));
}

/**
 * Deployment Operations
 */
export async function createDeployment(deployment: InsertDeployment): Promise<Deployment> {
  const db = await getAdminDb();
  await db.insert(deployments).values(deployment);
  const [created] = await db.select().from(deployments).where(eq(deployments.id, deployment.id));
  return created;
}

export async function updateDeployment(
  deploymentId: string,
  updates: Partial<InsertDeployment>
): Promise<void> {
  const db = await getAdminDb();
  await db.update(deployments).set(updates).where(eq(deployments.id, deploymentId));
}

export async function getDeploymentHistory(clientId: string, limit: number = 10): Promise<Deployment[]> {
  const db = await getAdminDb();
  return await db
    .select()
    .from(deployments)
    .where(eq(deployments.clientId, clientId))
    .orderBy(desc(deployments.startedAt))
    .limit(limit);
}

/**
 * Analytics Operations
 */
export async function saveClientAnalytics(analytics: InsertClientAnalytics): Promise<void> {
  const db = await getAdminDb();
  await db.insert(clientAnalytics).values(analytics);
}

export async function getClientAnalytics(
  clientId: string,
  startDate: Date,
  endDate: Date
): Promise<ClientAnalytics[]> {
  const db = await getAdminDb();
  return await db
    .select()
    .from(clientAnalytics)
    .where(
      and(
        eq(clientAnalytics.clientId, clientId),
        gte(clientAnalytics.date, startDate),
        lte(clientAnalytics.date, endDate)
      )
    )
    .orderBy(clientAnalytics.date);
}

export async function getAggregateAnalytics(
  startDate: Date,
  endDate: Date
): Promise<{
  totalRevenue: number;
  totalOrders: number;
  totalLendproApplications: number;
  totalClients: number;
}> {
  const db = await getAdminDb();
  
  const [result] = await db
    .select({
      totalRevenue: sql<number>`SUM(${clientAnalytics.totalRevenue})`,
      totalOrders: sql<number>`SUM(${clientAnalytics.totalOrders})`,
      totalLendproApplications: sql<number>`SUM(${clientAnalytics.lendproApplications})`,
    })
    .from(clientAnalytics)
    .where(
      and(
        gte(clientAnalytics.date, startDate),
        lte(clientAnalytics.date, endDate)
      )
    );
  
  const [clientCount] = await db
    .select({
      count: sql<number>`COUNT(*)`,
    })
    .from(clients)
    .where(eq(clients.status, "active"));
  
  return {
    totalRevenue: result?.totalRevenue || 0,
    totalOrders: result?.totalOrders || 0,
    totalLendproApplications: result?.totalLendproApplications || 0,
    totalClients: clientCount?.count || 0,
  };
}

/**
 * Admin User Operations
 */
export async function upsertAdminUser(user: InsertAdminUser): Promise<AdminUser> {
  const db = await getAdminDb();
  
  const [existing] = await db.select().from(adminUsers).where(eq(adminUsers.openId, user.openId));
  
  if (existing) {
    await db
      .update(adminUsers)
      .set({ lastSignedIn: new Date() })
      .where(eq(adminUsers.openId, user.openId));
    return { ...existing, lastSignedIn: new Date() };
  } else {
    await db.insert(adminUsers).values(user);
    const [created] = await db.select().from(adminUsers).where(eq(adminUsers.openId, user.openId));
    return created;
  }
}

export async function getAdminUser(openId: string): Promise<AdminUser | null> {
  const db = await getAdminDb();
  const [user] = await db.select().from(adminUsers).where(eq(adminUsers.openId, openId));
  return user || null;
}

/**
 * Audit Log Operations
 */
export async function logAdminAction(log: InsertAuditLog): Promise<void> {
  const db = await getAdminDb();
  await db.insert(auditLog).values(log);
}

export async function getAuditLogs(limit: number = 100): Promise<AuditLog[]> {
  const db = await getAdminDb();
  return await db
    .select()
    .from(auditLog)
    .orderBy(desc(auditLog.createdAt))
    .limit(limit);
}

// Export schema and types
export {
  clients,
  clientLendproConfig,
  clientBranding,
  clientFeatures,
  clientVisualizer,
  deployments,
  clientAnalytics,
  adminUsers,
  auditLog,
  type Client,
  type InsertClient,
  type ClientLendproConfig,
  type InsertClientLendproConfig,
  type ClientBranding,
  type InsertClientBranding,
  type ClientFeatures,
  type InsertClientFeatures,
  type ClientVisualizer,
  type InsertClientVisualizer,
  type Deployment,
  type InsertDeployment,
  type ClientAnalytics,
  type InsertClientAnalytics,
  type AdminUser,
  type InsertAdminUser,
  type AuditLog,
  type InsertAuditLog,
};
