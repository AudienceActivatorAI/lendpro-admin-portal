import axios, { AxiosInstance } from "axios";

/**
 * Railway API Client
 * Integrates with Railway's GraphQL API to manage projects, services, and deployments.
 * API Reference: https://docs.railway.app/reference/public-api
 */

const RAILWAY_API_URL = "https://backboard.railway.app/graphql/v2";

export interface RailwayApiConfig {
  apiToken: string;
}

export interface CreateProjectResponse {
  projectId: string;
  projectName: string;
}

export interface CreateServiceResponse {
  serviceId: string;
  serviceName: string;
}

export interface DeploymentResponse {
  deploymentId: string;
  status: string;
  url?: string;
}

export interface EnvironmentVariable {
  key: string;
  value: string;
}

export class RailwayApiClient {
  private client: AxiosInstance;
  private apiToken: string;

  constructor(config: RailwayApiConfig) {
    this.apiToken = config.apiToken;
    this.client = axios.create({
      baseURL: RAILWAY_API_URL,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiToken}`,
      },
      timeout: 30000,
    });
  }

  /**
   * Execute a GraphQL query
   */
  private async query<T = any>(
    query: string,
    variables?: Record<string, any>
  ): Promise<T> {
    try {
      const response = await this.client.post("", {
        query,
        variables,
      });

      if (response.data.errors) {
        throw new Error(
          `Railway API Error: ${JSON.stringify(response.data.errors)}`
        );
      }

      return response.data.data as T;
    } catch (error) {
      console.error("[Railway API] Query failed:", error);
      throw error;
    }
  }

  /**
   * Create a new Railway project
   */
  async createProject(name: string, teamId?: string): Promise<CreateProjectResponse> {
    const mutation = `
      mutation CreateProject($name: String!, $teamId: String) {
        projectCreate(input: { name: $name, teamId: $teamId }) {
          id
          name
        }
      }
    `;

    const result = await this.query<{ projectCreate: { id: string; name: string } }>(
      mutation,
      { name, teamId }
    );

    return {
      projectId: result.projectCreate.id,
      projectName: result.projectCreate.name,
    };
  }

  /**
   * Create a service within a project
   */
  async createService(
    projectId: string,
    name: string,
    source?: { repo: string; branch: string }
  ): Promise<CreateServiceResponse> {
    const mutation = `
      mutation CreateService($projectId: String!, $name: String!, $source: ServiceSourceInput) {
        serviceCreate(input: { projectId: $projectId, name: $name, source: $source }) {
          id
          name
        }
      }
    `;

    const result = await this.query<{ serviceCreate: { id: string; name: string } }>(
      mutation,
      { projectId, name, source }
    );

    return {
      serviceId: result.serviceCreate.id,
      serviceName: result.serviceCreate.name,
    };
  }

  /**
   * Add a MySQL database service to a project
   */
  async createMySQLService(projectId: string, name: string = "mysql"): Promise<CreateServiceResponse> {
    const mutation = `
      mutation CreateDatabaseService($projectId: String!, $name: String!) {
        serviceCreate(input: { 
          projectId: $projectId, 
          name: $name,
          source: {
            image: "mysql:8.0"
          }
        }) {
          id
          name
        }
      }
    `;

    const result = await this.query<{ serviceCreate: { id: string; name: string } }>(
      mutation,
      { projectId, name }
    );

    // Set MySQL environment variables
    await this.setEnvironmentVariables(projectId, result.serviceCreate.id, [
      { key: "MYSQL_ROOT_PASSWORD", value: this.generatePassword() },
      { key: "MYSQL_DATABASE", value: "lendpro" },
    ]);

    return {
      serviceId: result.serviceCreate.id,
      serviceName: result.serviceCreate.name,
    };
  }

  /**
   * Set environment variables for a service
   */
  async setEnvironmentVariables(
    projectId: string,
    serviceId: string,
    variables: EnvironmentVariable[]
  ): Promise<void> {
    const mutation = `
      mutation SetVariables($projectId: String!, $serviceId: String!, $variables: [VariableInput!]!) {
        variableCollectionUpsert(input: { 
          projectId: $projectId, 
          serviceId: $serviceId,
          variables: $variables
        }) {
          id
        }
      }
    `;

    await this.query(mutation, {
      projectId,
      serviceId,
      variables: variables.map((v) => ({ name: v.key, value: v.value })),
    });
  }

  /**
   * Trigger a deployment
   */
  async triggerDeployment(
    projectId: string,
    serviceId: string
  ): Promise<DeploymentResponse> {
    const mutation = `
      mutation TriggerDeploy($serviceId: String!) {
        serviceInstanceRedeploy(serviceId: $serviceId) {
          id
          status
        }
      }
    `;

    const result = await this.query<{
      serviceInstanceRedeploy: { id: string; status: string };
    }>(mutation, { serviceId });

    return {
      deploymentId: result.serviceInstanceRedeploy.id,
      status: result.serviceInstanceRedeploy.status,
    };
  }

  /**
   * Get deployment status
   */
  async getDeploymentStatus(deploymentId: string): Promise<{
    status: string;
    url?: string;
    logs?: string;
  }> {
    const query = `
      query GetDeployment($id: String!) {
        deployment(id: $id) {
          id
          status
          url
        }
      }
    `;

    const result = await this.query<{
      deployment: { id: string; status: string; url?: string };
    }>(query, { id: deploymentId });

    return {
      status: result.deployment.status,
      url: result.deployment.url,
    };
  }

  /**
   * Get project details
   */
  async getProject(projectId: string): Promise<{
    id: string;
    name: string;
    services: Array<{ id: string; name: string }>;
  }> {
    const query = `
      query GetProject($id: String!) {
        project(id: $id) {
          id
          name
          services {
            edges {
              node {
                id
                name
              }
            }
          }
        }
      }
    `;

    const result = await this.query<{
      project: {
        id: string;
        name: string;
        services: { edges: Array<{ node: { id: string; name: string } }> };
      };
    }>(query, { id: projectId });

    return {
      id: result.project.id,
      name: result.project.name,
      services: result.project.services.edges.map((edge) => edge.node),
    };
  }

  /**
   * Delete a project
   */
  async deleteProject(projectId: string): Promise<void> {
    const mutation = `
      mutation DeleteProject($id: String!) {
        projectDelete(id: $id)
      }
    `;

    await this.query(mutation, { id: projectId });
  }

  /**
   * Get service domain
   */
  async getServiceDomain(serviceId: string): Promise<string | null> {
    const query = `
      query GetService($id: String!) {
        service(id: $id) {
          id
          domains {
            serviceDomains
          }
        }
      }
    `;

    const result = await this.query<{
      service: { id: string; domains: { serviceDomains: string[] } };
    }>(query, { id: serviceId });

    return result.service.domains.serviceDomains[0] || null;
  }

  /**
   * Add custom domain to service
   */
  async addCustomDomain(serviceId: string, domain: string): Promise<void> {
    const mutation = `
      mutation AddDomain($serviceId: String!, $domain: String!) {
        customDomainCreate(input: { serviceId: $serviceId, domain: $domain }) {
          id
        }
      }
    `;

    await this.query(mutation, { serviceId, domain });
  }

  /**
   * Generate a secure random password
   */
  private generatePassword(length: number = 32): string {
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      password += charset[array[i] % charset.length];
    }
    return password;
  }
}

/**
 * Create Railway API client from environment variable
 */
export function createRailwayApiClient(): RailwayApiClient {
  const apiToken = process.env.RAILWAY_API_TOKEN;
  if (!apiToken) {
    throw new Error(
      "RAILWAY_API_TOKEN environment variable is required. Get your token from https://railway.app/account/tokens"
    );
  }
  return new RailwayApiClient({ apiToken });
}
