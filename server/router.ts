import { initTRPC } from "@trpc/server";
import { z } from "zod";
import superjson from "superjson";
import {
  createClient,
  getClient,
  getAllClients,
  updateClient,
  updateClientLendpro,
  updateClientBranding,
  updateClientFeatures,
  deleteClient as dbDeleteClient,
  createDeployment,
  updateDeployment,
  getDeploymentHistory,
  getClientAnalytics,
  getAggregateAnalytics,
  logAdminAction,
  getAuditLogs,
  type InsertClient,
  type InsertClientLendproConfig,
  type InsertClientBranding,
  type InsertClientFeatures,
} from "@db/db";
import { ClientDeployer } from "../../scripts/deploy-client";
import { createRailwayApiClient } from "../../scripts/railway-api";
import { nanoid } from "nanoid";
import { encryptPassword, decryptPassword } from "./crypto";

const t = initTRPC.create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

/**
 * Admin Portal tRPC Router
 */
export const appRouter = router({
  // ===== Client Operations =====
  clients: router({
    /**
     * Get all clients
     */
    list: publicProcedure.query(async () => {
      const clients = await getAllClients();
      return clients;
    }),

    /**
     * Get a single client by ID
     */
    get: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const client = await getClient(input.id);
        if (!client) {
          throw new Error(`Client not found: ${input.id}`);
        }
        
        // Decrypt password before returning
        if (client.lendpro) {
          client.lendpro.password = decryptPassword(client.lendpro.password);
        }
        
        return client;
      }),

    /**
     * Create a new client and deploy to Railway
     */
    create: publicProcedure
      .input(
        z.object({
          name: z.string(),
          domain: z.string(),
          lendpro: z.object({
            username: z.string(),
            password: z.string(),
            storeId: z.string(),
            salesId: z.string(),
            salesName: z.string(),
            apiUrl: z.string().default("https://apisg.mylendpro.com"),
          }),
          branding: z
            .object({
              logoUrl: z.string().optional(),
              primaryColor: z.string().optional(),
              secondaryColor: z.string().optional(),
              companyName: z.string().optional(),
            })
            .optional(),
          features: z
            .object({
              preApproval: z.boolean().default(true),
              cartFinancing: z.boolean().default(true),
              orderTracking: z.boolean().default(true),
              customerAccounts: z.boolean().default(true),
              productComparison: z.boolean().default(true),
              visualizer3D: z.boolean().default(true),
            })
            .optional(),
        })
      )
      .mutation(async ({ input }) => {
        const clientId = nanoid();
        
        // Encrypt password
        const encryptedPassword = encryptPassword(input.lendpro.password);
        
        // Create client in database
        const clientData: InsertClient = {
          id: clientId,
          name: input.name,
          domain: input.domain,
          status: "inactive",
        };
        
        const lendproData: Omit<InsertClientLendproConfig, "id"> = {
          clientId,
          ...input.lendpro,
          password: encryptedPassword,
        };
        
        const brandingData: Omit<InsertClientBranding, "id"> | undefined = input.branding
          ? {
              clientId,
              ...input.branding,
            }
          : undefined;
        
        const featuresData: Omit<InsertClientFeatures, "id"> | undefined = input.features
          ? {
              clientId,
              ...input.features,
            }
          : undefined;
        
        await createClient(clientData, lendproData, brandingData, featuresData);
        
        // Log action
        await logAdminAction({
          action: "create_client",
          resourceType: "client",
          resourceId: clientId,
          details: JSON.stringify({ name: input.name, domain: input.domain }),
        });
        
        return { clientId, message: "Client created successfully. Deploy to activate." };
      }),

    /**
     * Deploy a client to Railway
     */
    deploy: publicProcedure
      .input(z.object({ clientId: z.string() }))
      .mutation(async ({ input }) => {
        const client = await getClient(input.clientId);
        if (!client) {
          throw new Error(`Client not found: ${input.clientId}`);
        }
        
        // Create deployment record
        const deploymentId = nanoid();
        await createDeployment({
          id: deploymentId,
          clientId: input.clientId,
          status: "pending",
          deploymentType: client.client.railwayProjectId ? "redeploy" : "initial",
        });
        
        try {
          // Update client status
          await updateClient(input.clientId, { status: "deploying" });
          await updateDeployment(deploymentId, { status: "building" });
          
          // Deploy to Railway
          const railwayClient = createRailwayApiClient();
          const deployer = new ClientDeployer(railwayClient);
          
          const clientConfig = {
            id: client.client.id,
            name: client.client.name,
            domain: client.client.domain || "",
            lendpro: {
              ...client.lendpro,
              password: decryptPassword(client.lendpro.password),
            },
            branding: client.branding,
            features: client.features,
            railway: {
              projectId: client.client.railwayProjectId || undefined,
              projectUrl: client.client.railwayProjectUrl || undefined,
              status: client.client.status,
            },
          };
          
          const result = await deployer.deployClient(clientConfig as any);
          
          if (result.success) {
            // Update client with Railway info
            await updateClient(input.clientId, {
              status: "active",
              railwayProjectId: result.projectId || undefined,
              railwayProjectUrl: result.projectUrl || undefined,
              serviceUrl: result.serviceUrl || undefined,
              lastDeployedAt: new Date(),
            });
            
            await updateDeployment(deploymentId, {
              status: "success",
              completedAt: new Date(),
            });
            
            // Log action
            await logAdminAction({
              action: "deploy_client",
              resourceType: "deployment",
              resourceId: deploymentId,
              details: JSON.stringify(result),
            });
            
            return { success: true, ...result };
          } else {
            await updateClient(input.clientId, { status: "failed" });
            await updateDeployment(deploymentId, {
              status: "failed",
              errorMessage: result.error,
              completedAt: new Date(),
            });
            
            throw new Error(result.error || "Deployment failed");
          }
        } catch (error) {
          await updateClient(input.clientId, { status: "failed" });
          await updateDeployment(deploymentId, {
            status: "failed",
            errorMessage: error instanceof Error ? error.message : String(error),
            completedAt: new Date(),
          });
          throw error;
        }
      }),

    /**
     * Update client configuration
     */
    update: publicProcedure
      .input(
        z.object({
          clientId: z.string(),
          name: z.string().optional(),
          domain: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { clientId, ...updates } = input;
        await updateClient(clientId, updates);
        
        await logAdminAction({
          action: "update_client",
          resourceType: "client",
          resourceId: clientId,
          details: JSON.stringify(updates),
        });
        
        return { success: true };
      }),

    /**
     * Update LendPro configuration
     */
    updateLendpro: publicProcedure
      .input(
        z.object({
          clientId: z.string(),
          username: z.string().optional(),
          password: z.string().optional(),
          storeId: z.string().optional(),
          salesId: z.string().optional(),
          salesName: z.string().optional(),
          apiUrl: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { clientId, password, ...otherUpdates } = input;
        
        const updates: any = { ...otherUpdates };
        if (password) {
          updates.password = encryptPassword(password);
        }
        
        await updateClientLendpro(clientId, updates);
        
        await logAdminAction({
          action: "update_client_lendpro",
          resourceType: "client",
          resourceId: clientId,
          details: JSON.stringify({ ...otherUpdates, passwordUpdated: !!password }),
        });
        
        return { success: true };
      }),

    /**
     * Update branding
     */
    updateBranding: publicProcedure
      .input(
        z.object({
          clientId: z.string(),
          logoUrl: z.string().optional(),
          primaryColor: z.string().optional(),
          secondaryColor: z.string().optional(),
          companyName: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { clientId, ...updates } = input;
        await updateClientBranding(clientId, updates);
        
        await logAdminAction({
          action: "update_client_branding",
          resourceType: "client",
          resourceId: clientId,
          details: JSON.stringify(updates),
        });
        
        return { success: true };
      }),

    /**
     * Update feature flags
     */
    updateFeatures: publicProcedure
      .input(
        z.object({
          clientId: z.string(),
          preApproval: z.boolean().optional(),
          cartFinancing: z.boolean().optional(),
          orderTracking: z.boolean().optional(),
          customerAccounts: z.boolean().optional(),
          productComparison: z.boolean().optional(),
          visualizer3D: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { clientId, ...updates } = input;
        await updateClientFeatures(clientId, updates);
        
        await logAdminAction({
          action: "update_client_features",
          resourceType: "client",
          resourceId: clientId,
          details: JSON.stringify(updates),
        });
        
        return { success: true };
      }),

    /**
     * Delete a client
     */
    delete: publicProcedure
      .input(z.object({ clientId: z.string() }))
      .mutation(async ({ input }) => {
        const client = await getClient(input.clientId);
        if (!client) {
          throw new Error("Client not found");
        }
        
        // Delete from Railway if exists
        if (client.client.railwayProjectId) {
          try {
            const railwayClient = createRailwayApiClient();
            const deployer = new ClientDeployer(railwayClient);
            await deployer.deleteClient(client.client.railwayProjectId);
          } catch (error) {
            console.error("Failed to delete Railway project:", error);
            // Continue with database deletion even if Railway deletion fails
          }
        }
        
        // Delete from database
        await dbDeleteClient(input.clientId);
        
        await logAdminAction({
          action: "delete_client",
          resourceType: "client",
          resourceId: input.clientId,
          details: JSON.stringify({ name: client.client.name }),
        });
        
        return { success: true };
      }),
  }),

  // ===== Deployment Operations =====
  deployments: router({
    /**
     * Get deployment history for a client
     */
    history: publicProcedure
      .input(z.object({ clientId: z.string(), limit: z.number().default(10) }))
      .query(async ({ input }) => {
        return await getDeploymentHistory(input.clientId, input.limit);
      }),
  }),

  // ===== Analytics Operations =====
  analytics: router({
    /**
     * Get analytics for a specific client
     */
    client: publicProcedure
      .input(
        z.object({
          clientId: z.string(),
          startDate: z.date(),
          endDate: z.date(),
        })
      )
      .query(async ({ input }) => {
        return await getClientAnalytics(input.clientId, input.startDate, input.endDate);
      }),

    /**
     * Get aggregate analytics across all clients
     */
    aggregate: publicProcedure
      .input(
        z.object({
          startDate: z.date(),
          endDate: z.date(),
        })
      )
      .query(async ({ input }) => {
        return await getAggregateAnalytics(input.startDate, input.endDate);
      }),
  }),

  // ===== Audit Log Operations =====
  audit: router({
    /**
     * Get audit logs
     */
    logs: publicProcedure
      .input(z.object({ limit: z.number().default(100) }))
      .query(async ({ input }) => {
        return await getAuditLogs(input.limit);
      }),
  }),
});

export type AppRouter = typeof appRouter;
