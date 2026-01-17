import { ClientConfig, validateClientConfig } from "../config/client-config.schema";
import { RailwayApiClient, createRailwayApiClient, EnvironmentVariable } from "./railway-api";
import fs from "fs/promises";
import path from "path";

/**
 * Client Deployment Script
 * Automates the process of deploying a new client instance to Railway
 */

export interface DeploymentResult {
  success: boolean;
  clientId: string;
  projectId?: string;
  projectUrl?: string;
  serviceUrl?: string;
  error?: string;
}

export class ClientDeployer {
  private railwayClient: RailwayApiClient;
  private githubRepo: string;
  private githubBranch: string;

  constructor(
    railwayClient: RailwayApiClient,
    options?: {
      githubRepo?: string;
      githubBranch?: string;
    }
  ) {
    this.railwayClient = railwayClient;
    this.githubRepo = options?.githubRepo || "AudienceActivatorAI/lendpro-ecommerce";
    this.githubBranch = options?.githubBranch || "main";
  }

  /**
   * Deploy a new client instance
   */
  async deployClient(config: ClientConfig): Promise<DeploymentResult> {
    console.log(`[Deployer] Starting deployment for client: ${config.name}`);
    
    try {
      // Step 1: Create Railway project
      console.log("[Deployer] Creating Railway project...");
      const project = await this.railwayClient.createProject(
        `lendpro-${config.name.toLowerCase().replace(/\s+/g, "-")}`
      );
      console.log(`[Deployer] Project created: ${project.projectId}`);

      // Step 2: Create MySQL service
      console.log("[Deployer] Creating MySQL database service...");
      const mysqlService = await this.railwayClient.createMySQLService(
        project.projectId,
        "mysql"
      );
      console.log(`[Deployer] MySQL service created: ${mysqlService.serviceId}`);

      // Wait for MySQL to be ready
      await this.sleep(5000);

      // Step 3: Create web service
      console.log("[Deployer] Creating web application service...");
      const webService = await this.railwayClient.createService(
        project.projectId,
        "web",
        {
          repo: this.githubRepo,
          branch: this.githubBranch,
        }
      );
      console.log(`[Deployer] Web service created: ${webService.serviceId}`);

      // Step 4: Set environment variables
      console.log("[Deployer] Configuring environment variables...");
      const envVars = this.buildEnvironmentVariables(config, mysqlService.serviceId);
      await this.railwayClient.setEnvironmentVariables(
        project.projectId,
        webService.serviceId,
        envVars
      );
      console.log("[Deployer] Environment variables configured");

      // Step 5: Trigger deployment
      console.log("[Deployer] Triggering initial deployment...");
      const deployment = await this.railwayClient.triggerDeployment(
        project.projectId,
        webService.serviceId
      );
      console.log(`[Deployer] Deployment triggered: ${deployment.deploymentId}`);

      // Step 6: Wait for deployment to complete
      console.log("[Deployer] Waiting for deployment to complete...");
      const deploymentStatus = await this.waitForDeployment(
        deployment.deploymentId,
        300000 // 5 minutes timeout
      );

      // Step 7: Get service URL
      const serviceUrl = await this.railwayClient.getServiceDomain(webService.serviceId);
      console.log(`[Deployer] Service URL: ${serviceUrl}`);

      // Step 8: Add custom domain if specified
      if (config.domain) {
        console.log(`[Deployer] Adding custom domain: ${config.domain}`);
        try {
          await this.railwayClient.addCustomDomain(webService.serviceId, config.domain);
          console.log("[Deployer] Custom domain added successfully");
        } catch (error) {
          console.warn("[Deployer] Failed to add custom domain:", error);
          // Don't fail the deployment if custom domain setup fails
        }
      }

      console.log(`[Deployer] ✅ Deployment completed successfully for ${config.name}`);

      return {
        success: true,
        clientId: config.id,
        projectId: project.projectId,
        projectUrl: `https://railway.app/project/${project.projectId}`,
        serviceUrl: serviceUrl || undefined,
      };
    } catch (error) {
      console.error("[Deployer] ❌ Deployment failed:", error);
      return {
        success: false,
        clientId: config.id,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Build environment variables for a client
   */
  private buildEnvironmentVariables(
    config: ClientConfig,
    mysqlServiceId: string
  ): EnvironmentVariable[] {
    const vars: EnvironmentVariable[] = [
      // Application
      { key: "NODE_ENV", value: "production" },
      { key: "PORT", value: "3000" },
      
      // LendPro Configuration
      { key: "LENDPRO_API_URL", value: config.lendpro.apiUrl },
      { key: "LENDPRO_USERNAME", value: config.lendpro.username },
      { key: "LENDPRO_PASSWORD", value: config.lendpro.password },
      { key: "LENDPRO_STORE_ID", value: config.lendpro.storeId },
      { key: "LENDPRO_SALES_ID", value: config.lendpro.salesId },
      { key: "LENDPRO_SALES_NAME", value: config.lendpro.salesName },
      
      // Database (reference MySQL service)
      { key: "DATABASE_URL", value: "${{" + mysqlServiceId + ".MYSQL_URL}}" },
      
      // OAuth (optional)
      { key: "OAUTH_SERVER_URL", value: "http://localhost:3000" },
    ];

    // Add visualizer config
    if (config.visualizer) {
      vars.push({ key: "VISUALIZER_ENABLED", value: config.visualizer.enabled ? "true" : "false" });
      if (config.visualizer.embedCode) {
        vars.push({ key: "VISUALIZER_EMBED_CODE", value: config.visualizer.embedCode });
      }
      if (config.visualizer.autoSyncApiKey) {
        vars.push({ key: "AUTOSYNC_API_KEY", value: config.visualizer.autoSyncApiKey });
      }
    }

    // Add cart only mode
    if (config.features?.cartOnly) {
      vars.push({ key: "CART_ONLY_MODE", value: "true" });
    }

    // Add branding as environment variables if specified
    if (config.branding) {
      if (config.branding.primaryColor) {
        vars.push({ key: "VITE_PRIMARY_COLOR", value: config.branding.primaryColor });
      }
      if (config.branding.secondaryColor) {
        vars.push({ key: "VITE_SECONDARY_COLOR", value: config.branding.secondaryColor });
      }
      if (config.branding.companyName) {
        vars.push({ key: "VITE_COMPANY_NAME", value: config.branding.companyName });
      }
      if (config.branding.logoUrl) {
        vars.push({ key: "VITE_LOGO_URL", value: config.branding.logoUrl });
      }
    }

    return vars;
  }

  /**
   * Wait for deployment to complete
   */
  private async waitForDeployment(
    deploymentId: string,
    timeout: number = 300000
  ): Promise<{ status: string; url?: string }> {
    const startTime = Date.now();
    const pollInterval = 5000; // 5 seconds

    while (Date.now() - startTime < timeout) {
      const status = await this.railwayClient.getDeploymentStatus(deploymentId);
      
      console.log(`[Deployer] Deployment status: ${status.status}`);

      if (status.status === "SUCCESS" || status.status === "ACTIVE") {
        return status;
      }

      if (status.status === "FAILED" || status.status === "CRASHED") {
        throw new Error(`Deployment failed with status: ${status.status}`);
      }

      await this.sleep(pollInterval);
    }

    throw new Error(`Deployment timed out after ${timeout}ms`);
  }

  /**
   * Update an existing client deployment
   */
  async updateClient(
    config: ClientConfig,
    projectId: string,
    serviceId: string
  ): Promise<DeploymentResult> {
    console.log(`[Deployer] Updating deployment for client: ${config.name}`);

    try {
      // Update environment variables
      console.log("[Deployer] Updating environment variables...");
      const envVars = this.buildEnvironmentVariables(config, "mysql"); // Assume mysql service exists
      await this.railwayClient.setEnvironmentVariables(
        projectId,
        serviceId,
        envVars
      );

      // Trigger redeployment
      console.log("[Deployer] Triggering redeployment...");
      const deployment = await this.railwayClient.triggerDeployment(projectId, serviceId);

      // Wait for deployment
      await this.waitForDeployment(deployment.deploymentId);

      console.log(`[Deployer] ✅ Update completed successfully for ${config.name}`);

      return {
        success: true,
        clientId: config.id,
        projectId,
      };
    } catch (error) {
      console.error("[Deployer] ❌ Update failed:", error);
      return {
        success: false,
        clientId: config.id,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Delete a client deployment
   */
  async deleteClient(projectId: string): Promise<void> {
    console.log(`[Deployer] Deleting project: ${projectId}`);
    await this.railwayClient.deleteProject(projectId);
    console.log("[Deployer] ✅ Project deleted successfully");
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Load client config from file
 */
export async function loadClientConfig(configPath: string): Promise<ClientConfig> {
  const content = await fs.readFile(configPath, "utf-8");
  const config = JSON.parse(content);
  return validateClientConfig(config);
}

/**
 * Main deployment function - can be called from CLI
 */
export async function deployClientFromFile(configPath: string): Promise<DeploymentResult> {
  console.log(`[Deployer] Loading client configuration from: ${configPath}`);
  
  const config = await loadClientConfig(configPath);
  const railwayClient = createRailwayApiClient();
  const deployer = new ClientDeployer(railwayClient);
  
  return await deployer.deployClient(config);
}

// CLI execution
if (require.main === module) {
  const configPath = process.argv[2];
  
  if (!configPath) {
    console.error("Usage: tsx scripts/deploy-client.ts <config-file.json>");
    process.exit(1);
  }

  deployClientFromFile(configPath)
    .then((result) => {
      if (result.success) {
        console.log("\n✅ Deployment successful!");
        console.log("Project ID:", result.projectId);
        console.log("Project URL:", result.projectUrl);
        console.log("Service URL:", result.serviceUrl);
      } else {
        console.error("\n❌ Deployment failed!");
        console.error("Error:", result.error);
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error("\n❌ Deployment failed with exception:", error);
      process.exit(1);
    });
}
