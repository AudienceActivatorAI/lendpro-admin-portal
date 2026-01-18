import { getAdminDb } from "../database/db";

/**
 * Migration: Fix admin_users table structure
 * This script drops the old table and recreates it with the correct schema
 */
async function migrateAdminUsersTable() {
  console.log("[Migration] Starting admin_users table migration...");
  
  try {
    const db = await getAdminDb();
    
    // Disable foreign key checks temporarily
    console.log("[Migration] Disabling foreign key checks...");
    await db.execute(`SET FOREIGN_KEY_CHECKS = 0`);
    
    // Drop ALL tables that might reference admin_users in the correct order
    console.log("[Migration] Dropping all related tables...");
    const tablesToDrop = [
      'sessions',
      'notifications', 
      'notification_settings',
      'audit_log',
      'deployments',
      'client_analytics',
      'client_visualizer',
      'client_features',
      'client_branding',
      'client_lendpro_config',
      'clients',
      'admin_users'
    ];
    
    for (const table of tablesToDrop) {
      try {
        await db.execute(`DROP TABLE IF EXISTS ${table}`);
        console.log(`[Migration] Dropped ${table}`);
      } catch (e) {
        console.log(`[Migration] Could not drop ${table}, continuing...`);
      }
    }
    
    // Create new admin_users table with correct structure
    console.log("[Migration] Creating new admin_users table...");
    await db.execute(`
      CREATE TABLE admin_users (
        id varchar(36) PRIMARY KEY,
        name varchar(255) NOT NULL,
        email varchar(320) NOT NULL UNIQUE,
        password_hash text NOT NULL,
        role enum('super_admin', 'admin', 'viewer') NOT NULL DEFAULT 'viewer',
        email_verified boolean NOT NULL DEFAULT false,
        verification_token varchar(100),
        reset_token varchar(100),
        reset_token_expiry timestamp NULL,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        last_signed_in timestamp NULL
      )
    `);
    
    // Create sessions table
    console.log("[Migration] Creating sessions table...");
    await db.execute(`
      CREATE TABLE sessions (
        id varchar(100) PRIMARY KEY,
        user_id varchar(36) NOT NULL,
        token text NOT NULL,
        ip_address varchar(45),
        user_agent text,
        expires_at timestamp NOT NULL,
        created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_activity_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE
      )
    `);
    
    // Recreate audit_log table (without foreign key for now to avoid issues)
    console.log("[Migration] Creating audit_log table...");
    await db.execute(`
      CREATE TABLE audit_log (
        id int AUTO_INCREMENT PRIMARY KEY,
        admin_user_id int,
        action varchar(100) NOT NULL,
        resource_type varchar(50) NOT NULL,
        resource_id varchar(36),
        details text,
        ip_address varchar(45),
        user_agent text,
        created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Re-enable foreign key checks
    console.log("[Migration] Re-enabling foreign key checks...");
    await db.execute(`SET FOREIGN_KEY_CHECKS = 1`);
    
    console.log("[Migration] ✅ Migration completed successfully!");
    return true;
  } catch (error) {
    console.error("[Migration] ❌ Migration failed:", error);
    // Try to re-enable foreign key checks even if migration fails
    try {
      const db = await getAdminDb();
      await db.execute(`SET FOREIGN_KEY_CHECKS = 1`);
    } catch (e) {
      // Ignore if this fails
    }
    return false;
  }
}

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateAdminUsersTable()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error("[Migration] Unexpected error:", error);
      process.exit(1);
    });
}

export { migrateAdminUsersTable };
