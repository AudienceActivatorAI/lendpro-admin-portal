import bcrypt from "bcrypt";
import { SignJWT, jwtVerify } from "jose";
import { nanoid } from "nanoid";
import { getAdminDb } from "../database/db";
import { adminUsers, sessions, type AdminUser, type Session } from "../database/schema";
import { eq, and, gt } from "drizzle-orm";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "change-this-to-a-secure-random-secret-in-production"
);
const JWT_EXPIRY = "7d"; // 7 days
const SALT_ROUNDS = 10;

export interface AuthResult {
  success: boolean;
  user?: Omit<AdminUser, "passwordHash">;
  token?: string;
  error?: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: "super_admin" | "admin" | "viewer";
}

export interface LoginData {
  email: string;
  password: string;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * Generate a JWT token
 */
export async function generateToken(userId: string): Promise<string> {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(JWT_SECRET);

  return token;
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { userId: string };
  } catch (error) {
    console.error("[Auth] Token verification failed:", error);
    return null;
  }
}

/**
 * Register a new admin user
 */
export async function register(data: RegisterData): Promise<AuthResult> {
  try {
    const db = await getAdminDb();

    // Check if email already exists
    const existing = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, data.email))
      .limit(1);

    if (existing.length > 0) {
      return {
        success: false,
        error: "Email already registered",
      };
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Create user
    const userId = nanoid();
    await db.insert(adminUsers).values({
      id: userId,
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role || "viewer",
      emailVerified: false,
      isActive: true,
    });

    // Generate token
    const token = await generateToken(userId);

    // Create session
    const sessionId = nanoid();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await db.insert(sessions).values({
      id: sessionId,
      userId,
      token,
      expiresAt,
    });

    // Get user without password
    const [user] = await db
      .select({
        id: adminUsers.id,
        name: adminUsers.name,
        email: adminUsers.email,
        role: adminUsers.role,
        emailVerified: adminUsers.emailVerified,
        isActive: adminUsers.isActive,
        createdAt: adminUsers.createdAt,
        updatedAt: adminUsers.updatedAt,
        lastSignedIn: adminUsers.lastSignedIn,
      })
      .from(adminUsers)
      .where(eq(adminUsers.id, userId))
      .limit(1);

    return {
      success: true,
      user: user as any,
      token,
    };
  } catch (error) {
    console.error("[Auth] Registration error:", error);
    return {
      success: false,
      error: "Registration failed",
    };
  }
}

/**
 * Login an admin user
 */
export async function login(data: LoginData): Promise<AuthResult> {
  try {
    const db = await getAdminDb();

    // Find user by email
    const [user] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, data.email))
      .limit(1);

    if (!user) {
      return {
        success: false,
        error: "Invalid email or password",
      };
    }

    // Check if account is active
    if (!user.isActive) {
      return {
        success: false,
        error: "Account is deactivated",
      };
    }

    // Verify password
    const isValid = await verifyPassword(data.password, user.passwordHash);
    if (!isValid) {
      return {
        success: false,
        error: "Invalid email or password",
      };
    }

    // Generate token
    const token = await generateToken(user.id);

    // Create session
    const sessionId = nanoid();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await db.insert(sessions).values({
      id: sessionId,
      userId: user.id,
      token,
      expiresAt,
    });

    // Update last signed in
    await db
      .update(adminUsers)
      .set({ lastSignedIn: new Date() })
      .where(eq(adminUsers.id, user.id));

    // Return user without password
    const { passwordHash, resetToken, resetTokenExpiry, verificationToken, ...userWithoutPassword } = user;

    return {
      success: true,
      user: userWithoutPassword,
      token,
    };
  } catch (error) {
    console.error("[Auth] Login error:", error);
    return {
      success: false,
      error: "Login failed",
    };
  }
}

/**
 * Logout a user (invalidate session)
 */
export async function logout(token: string): Promise<boolean> {
  try {
    const db = await getAdminDb();
    await db.delete(sessions).where(eq(sessions.token, token));
    return true;
  } catch (error) {
    console.error("[Auth] Logout error:", error);
    return false;
  }
}

/**
 * Get current user from token
 */
export async function getCurrentUser(token: string): Promise<Omit<AdminUser, "passwordHash"> | null> {
  try {
    const db = await getAdminDb();

    // Verify token
    const payload = await verifyToken(token);
    if (!payload) {
      return null;
    }

    // Check if session exists and is valid
    const [session] = await db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.token, token),
          gt(sessions.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!session) {
      return null;
    }

    // Get user
    const [user] = await db
      .select({
        id: adminUsers.id,
        name: adminUsers.name,
        email: adminUsers.email,
        role: adminUsers.role,
        emailVerified: adminUsers.emailVerified,
        isActive: adminUsers.isActive,
        createdAt: adminUsers.createdAt,
        updatedAt: adminUsers.updatedAt,
        lastSignedIn: adminUsers.lastSignedIn,
      })
      .from(adminUsers)
      .where(eq(adminUsers.id, session.userId))
      .limit(1);

    if (!user || !user.isActive) {
      return null;
    }

    // Update session activity
    await db
      .update(sessions)
      .set({ lastActivityAt: new Date() })
      .where(eq(sessions.id, session.id));

    return user as any;
  } catch (error) {
    console.error("[Auth] Get current user error:", error);
    return null;
  }
}

/**
 * Check if user has required role
 */
export function hasRole(
  user: Pick<AdminUser, "role">,
  requiredRole: "super_admin" | "admin" | "viewer"
): boolean {
  const roleHierarchy = {
    super_admin: 3,
    admin: 2,
    viewer: 1,
  };

  return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions(): Promise<number> {
  try {
    const db = await getAdminDb();
    const result = await db
      .delete(sessions)
      .where(gt(new Date(), sessions.expiresAt));
    
    return result.rowsAffected || 0;
  } catch (error) {
    console.error("[Auth] Cleanup sessions error:", error);
    return 0;
  }
}
