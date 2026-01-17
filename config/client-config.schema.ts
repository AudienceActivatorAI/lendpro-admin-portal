import { z } from "zod";

/**
 * Client Configuration Schema
 * Defines the structure for per-client configuration including LendPro credentials,
 * branding, features, and Railway deployment information.
 */

export const LendProConfigSchema = z.object({
  apiUrl: z.string().url().default("https://apisg.mylendpro.com"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  storeId: z.string().min(1, "Store ID is required"),
  salesId: z.string().min(1, "Sales ID is required"),
  salesName: z.string().min(1, "Sales Name is required"),
});

export const BrandingConfigSchema = z.object({
  logoUrl: z.string().url().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  companyName: z.string().optional(),
  favicon: z.string().url().optional(),
}).optional();

export const VisualizerConfigSchema = z.object({
  enabled: z.boolean().default(true),
  embedCode: z.string().optional(),
  autoSyncApiKey: z.string().optional(),
}).optional();

export const FeatureFlagsSchema = z.object({
  preApproval: z.boolean().default(true),
  cartFinancing: z.boolean().default(true),
  orderTracking: z.boolean().default(true),
  customerAccounts: z.boolean().default(true),
  productComparison: z.boolean().default(true),
  cartOnly: z.boolean().default(false), // Cart only mode (no visualizer)
}).optional();

export const RailwayConfigSchema = z.object({
  projectId: z.string().optional(),
  projectUrl: z.string().url().optional(),
  environmentId: z.string().optional(),
  serviceId: z.string().optional(),
  status: z.enum(["active", "inactive", "deploying", "failed"]).optional(),
  lastDeployedAt: z.date().optional(),
});

export const ClientConfigSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Client name is required"),
  domain: z.string().min(1, "Domain is required"),
  lendpro: LendProConfigSchema,
  branding: BrandingConfigSchema,
  visualizer: VisualizerConfigSchema,
  features: FeatureFlagsSchema,
  railway: RailwayConfigSchema,
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Type exports
export type LendProConfig = z.infer<typeof LendProConfigSchema>;
export type BrandingConfig = z.infer<typeof BrandingConfigSchema>;
export type VisualizerConfig = z.infer<typeof VisualizerConfigSchema>;
export type FeatureFlags = z.infer<typeof FeatureFlagsSchema>;
export type RailwayConfig = z.infer<typeof RailwayConfigSchema>;
export type ClientConfig = z.infer<typeof ClientConfigSchema>;

// Helper to create a new client config with defaults
export function createDefaultClientConfig(
  name: string,
  domain: string,
  lendpro: LendProConfig
): Omit<ClientConfig, "id" | "createdAt" | "updatedAt"> {
  return {
    name,
    domain,
    lendpro,
    branding: {
      primaryColor: "#2563eb",
      secondaryColor: "#1e40af",
    },
    visualizer: {
      enabled: true,
      embedCode: "",
      autoSyncApiKey: "",
    },
    features: {
      preApproval: true,
      cartFinancing: true,
      orderTracking: true,
      customerAccounts: true,
      productComparison: true,
      cartOnly: false,
    },
    railway: {
      status: "inactive",
    },
  };
}

// Validation helper
export function validateClientConfig(config: unknown): ClientConfig {
  return ClientConfigSchema.parse(config);
}

// Example client config
export const exampleClientConfig: ClientConfig = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  name: "Example Client",
  domain: "example.tredfi.com",
  lendpro: {
    apiUrl: "https://apisg.mylendpro.com",
    username: "example_user",
    password: "secure_password_here",
    storeId: "STORE123",
    salesId: "SALES456",
    salesName: "Example Sales Rep",
  },
  branding: {
    logoUrl: "https://example.com/logo.png",
    primaryColor: "#2563eb",
    secondaryColor: "#1e40af",
    companyName: "Example Corp",
  },
  visualizer: {
    enabled: true,
    embedCode: "<script src='https://visualizer.example.com/embed.js'></script>",
    autoSyncApiKey: "your_autosync_api_key_here",
  },
  features: {
    preApproval: true,
    cartFinancing: true,
    orderTracking: true,
    customerAccounts: true,
    productComparison: true,
    cartOnly: false,
  },
  railway: {
    projectId: undefined,
    projectUrl: undefined,
    status: "inactive",
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};
