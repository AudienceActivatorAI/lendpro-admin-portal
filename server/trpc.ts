import { initTRPC, TRPCError } from "@trpc/server";
import { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import superjson from "superjson";
import { getCurrentUser, type AdminUser } from "./auth";

/**
 * Context for tRPC requests
 * Contains the current authenticated user (if any)
 */
export interface Context {
  user: Omit<AdminUser, "passwordHash"> | null;
  token: string | null;
}

/**
 * Create context for each request
 * Extracts JWT token from Authorization header
 */
export async function createContext({ req }: CreateExpressContextOptions): Promise<Context> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;

  let user: Omit<AdminUser, "passwordHash"> | null = null;

  if (token) {
    try {
      user = await getCurrentUser(token);
    } catch (error) {
      console.error("[tRPC] Auth error:", error);
    }
  }

  return {
    user,
    token,
  };
}

/**
 * Initialize tRPC with context
 */
const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

/**
 * Protected procedure - requires authentication
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }

  return next({
    ctx: {
      user: ctx.user,
      token: ctx.token,
    },
  });
});

/**
 * Admin procedure - requires admin or super_admin role
 */
export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role === "viewer") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have permission to perform this action",
    });
  }

  return next({
    ctx,
  });
});

/**
 * Super admin procedure - requires super_admin role
 */
export const superAdminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== "super_admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You must be a super admin to perform this action",
    });
  }

  return next({
    ctx,
  });
});
